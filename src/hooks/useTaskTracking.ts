import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  submitPing,
  logPermissionEvent,
  transitionRunnerState,
} from "@/lib/tracking.functions";
import { startTracker, type Fix, type Tracker } from "@/lib/location-tracker";
import { Capacitor } from "@capacitor/core";

const PING_INTERVAL_MS = 20_000;
const MIN_MOVE_METERS = 30;
const BUFFER_MAX = 20;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export type TrackingStatus =
  | "idle"
  | "starting"
  | "active"
  | "denied"
  | "unavailable"
  | "error";

export type LiveLocation = Fix;

/**
 * Owns the location watcher for one active task.
 * Uses the native background plugin on iOS/Android, plain
 * navigator.geolocation on the web.
 */
export function useTaskTracking(opts: { taskId: string; active: boolean; taskTitle?: string }) {
  const { taskId, active, taskTitle = "Active task" } = opts;
  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [last, setLast] = useState<LiveLocation | null>(null);
  const trackerRef = useRef<Tracker | null>(null);
  const lastSentRef = useRef<LiveLocation | null>(null);
  const bufferRef = useRef<LiveLocation[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoArrivedRef = useRef<Set<string>>(new Set());
  const ping = useServerFn(submitPing);
  const logPerm = useServerFn(logPermissionEvent);
  const transition = useServerFn(transitionRunnerState);

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      return;
    }
    setStatus("starting");
    let cancelled = false;

    const sendPing = async (loc: LiveLocation) => {
      try {
        const res = await ping({
          data: {
            taskId,
            latitude: loc.lat,
            longitude: loc.lng,
            accuracy_m: loc.accuracy,
            speed_mps: loc.speed,
            heading_deg: loc.heading,
          },
        });
        lastSentRef.current = loc;
        // Auto-advance to "arrived" the first time we cross into the geofence.
        if (
          res?.inside === true &&
          res?.runner_state === "en_route" &&
          !autoArrivedRef.current.has(taskId)
        ) {
          autoArrivedRef.current.add(taskId);
          transition({ data: { taskId, to: "arrived" } }).catch(() => {
            // server may already have advanced; ignore
            autoArrivedRef.current.delete(taskId);
          });
        }
      } catch {
        // buffer for retry
        if (bufferRef.current.length < BUFFER_MAX) bufferRef.current.push(loc);
      }
    };

    const flushBuffer = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const items = bufferRef.current.splice(0, bufferRef.current.length);
      for (const it of items) {
        await sendPing(it);
      }
    };

    const maybeSend = (loc: LiveLocation) => {
      const prev = lastSentRef.current;
      const enoughTime = !prev || loc.ts - prev.ts >= PING_INTERVAL_MS;
      const enoughMove =
        !prev || haversineMeters({ lat: prev.lat, lng: prev.lng }, { lat: loc.lat, lng: loc.lng }) >= MIN_MOVE_METERS;
      if (enoughTime || enoughMove) {
        void sendPing(loc);
      }
    };

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : Capacitor.getPlatform();
    startTracker({
      taskTitle,
      onFix: (loc) => {
        if (cancelled) return;
        setLast(loc);
        setStatus("active");
        maybeSend(loc);
      },
      onError: (code, message) => {
        if (cancelled) return;
        const map: Record<typeof code, TrackingStatus> = {
          denied: "denied",
          unavailable: "unavailable",
          timeout: "error",
          error: "error",
        };
        setStatus(map[code] ?? "error");
        logPerm({
          data: { taskId, outcome: code, error_message: message, user_agent: ua },
        }).catch(() => {});
      },
    })
      .then((t) => {
        if (cancelled) {
          void t.stop();
          return;
        }
        trackerRef.current = t;
        logPerm({ data: { taskId, outcome: "granted", user_agent: ua } }).catch(() => {});
      })
      .catch((e: Error) => {
        setStatus("error");
        logPerm({ data: { taskId, outcome: "error", error_message: e.message, user_agent: ua } }).catch(() => {});
      });

    flushTimerRef.current = setInterval(() => {
      void flushBuffer();
    }, PING_INTERVAL_MS);
    const onOnline = () => void flushBuffer();
    if (typeof window !== "undefined") window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      if (trackerRef.current) {
        void trackerRef.current.stop();
        trackerRef.current = null;
      }
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      if (typeof window !== "undefined") window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, active]);

  return { status, last };
}