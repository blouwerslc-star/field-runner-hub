import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitPing, logPermissionEvent } from "@/lib/tracking.functions";

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

export type LiveLocation = {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  ts: number;
};

/** Owns navigator.geolocation.watchPosition for one active task. */
export function useTaskTracking(opts: { taskId: string; active: boolean }) {
  const { taskId, active } = opts;
  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [last, setLast] = useState<LiveLocation | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<LiveLocation | null>(null);
  const bufferRef = useRef<LiveLocation[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ping = useServerFn(submitPing);
  const logPerm = useServerFn(logPermissionEvent);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.geolocation) {
      if (!active) setStatus("idle");
      else {
        setStatus("unavailable");
        logPerm({ data: { taskId, outcome: "unavailable", user_agent: navigator.userAgent } }).catch(() => {});
      }
      return;
    }

    setStatus("starting");
    let cancelled = false;

    const sendPing = async (loc: LiveLocation) => {
      try {
        await ping({
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
      } catch {
        // buffer for retry
        if (bufferRef.current.length < BUFFER_MAX) bufferRef.current.push(loc);
      }
    };

    const flushBuffer = async () => {
      if (!navigator.onLine) return;
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

    const onSuccess: PositionCallback = (pos) => {
      if (cancelled) return;
      const loc: LiveLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
        ts: pos.timestamp || Date.now(),
      };
      setLast(loc);
      if (status !== "active") setStatus("active");
      maybeSend(loc);
    };

    const onError: PositionErrorCallback = (err) => {
      if (cancelled) return;
      const map: Record<number, TrackingStatus> = { 1: "denied", 2: "unavailable", 3: "error" };
      const outcomeMap: Record<number, "denied" | "unavailable" | "timeout"> = {
        1: "denied",
        2: "unavailable",
        3: "timeout",
      };
      setStatus(map[err.code] ?? "error");
      logPerm({
        data: {
          taskId,
          outcome: outcomeMap[err.code] ?? "error",
          error_message: err.message,
          user_agent: navigator.userAgent,
        },
      }).catch(() => {});
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      });
      logPerm({ data: { taskId, outcome: "granted", user_agent: navigator.userAgent } }).catch(() => {});
    } catch (e) {
      setStatus("error");
      logPerm({
        data: { taskId, outcome: "error", error_message: (e as Error).message },
      }).catch(() => {});
    }

    flushTimerRef.current = setInterval(() => {
      void flushBuffer();
    }, PING_INTERVAL_MS);
    const onOnline = () => void flushBuffer();
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, active]);

  return { status, last };
}