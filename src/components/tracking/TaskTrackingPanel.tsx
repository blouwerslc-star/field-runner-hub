import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getTaskTrackingState,
  startTracking,
  transitionRunnerState,
  stopTracking,
  type RunnerState,
} from "@/lib/tracking.functions";
import { useTaskTracking } from "@/hooks/useTaskTracking";
import { TrackingConsentSheet } from "./TrackingConsentSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  checkLocationPermission,
  requestLocationPermission,
  openLocationSettings,
} from "@/lib/location-tracker";
import { Capacitor } from "@capacitor/core";

const LABEL: Record<RunnerState, string> = {
  accepted: "Accepted",
  en_route: "En Route",
  arrived: "Arrived On Site",
  in_progress: "Task In Progress",
  completed: "Completed",
  verified: "Verified",
};

export function TaskTrackingPanel({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const stateFn = useServerFn(getTaskTrackingState);
  const startFn = useServerFn(startTracking);
  const transitionFn = useServerFn(transitionRunnerState);
  const stopFn = useServerFn(stopTracking);

  const { data, isLoading } = useQuery({
    queryKey: ["task-tracking", taskId],
    queryFn: () => stateFn({ data: { taskId } }),
    refetchInterval: 15_000,
  });
  const task = data?.task;
  const state: RunnerState = (task?.runner_state as RunnerState) ?? "accepted";
  const trackingActive = task?.tracking_active === true;

  const [consentOpen, setConsentOpen] = useState(false);
  const [permState, setPermState] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const tracking = useTaskTracking({
    taskId,
    active: trackingActive,
    taskTitle: (task as { title?: string } | undefined)?.title ?? "Active task",
  });

  useEffect(() => {
    checkLocationPermission().then(setPermState).catch(() => setPermState("unknown"));
  }, [trackingActive, tracking.status]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["task-tracking", taskId] });

  const startMut = useMutation({
    mutationFn: () => startFn({ data: { taskId } }),
    onSuccess: () => { invalidate(); toast.success("Tracking started"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const transitionMut = useMutation({
    mutationFn: (to: RunnerState) => transitionFn({ data: { taskId, to } }),
    onSuccess: (r) => { invalidate(); toast.success(`Updated to ${LABEL[r.runner_state]}`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const completeMut = useMutation({
    mutationFn: (force: boolean) =>
      transitionFn({ data: { taskId, to: "completed", forceOutsideGeofence: force } }),
    onSuccess: () => { invalidate(); toast.success("Task marked complete"); },
    onError: (e: Error) => {
      if (e.message.toLowerCase().includes("outside")) {
        if (window.confirm("You're outside the property radius. Complete anyway?")) {
          completeMut.mutate(true);
        }
      } else {
        toast.error(e.message);
      }
    },
  });
  const stopMut = useMutation({
    mutationFn: () => stopFn({ data: { taskId } }),
    onSuccess: () => { invalidate(); toast.success("Tracking stopped"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !task) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading tracking…
      </div>
    );
  }

  const inside = task.last_ping_within_geofence;
  const distance = task.last_ping_distance_ft;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Task status</p>
          <p className="text-lg font-semibold">{LABEL[state]}</p>
        </div>
        {trackingActive ? (
          <Badge className="bg-emerald-500 text-white">
            <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
            Tracking
          </Badge>
        ) : (
          <Badge variant="outline">Tracking off</Badge>
        )}
      </div>

      {trackingActive && (
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          {tracking.status === "denied" && (
            <div className="space-y-1">
              <p className="text-destructive">
                Location permission denied.{" "}
                {Capacitor.isNativePlatform()
                  ? "Open Settings → REI Runner → Location → Always to continue."
                  : "Enable location for this site in your browser settings to continue."}
              </p>
              {Capacitor.isNativePlatform() && (
                <Button size="sm" variant="outline" onClick={() => void openLocationSettings()}>
                  Open settings
                </Button>
              )}
            </div>
          )}
          {tracking.status === "unavailable" && (
            <p className="text-destructive">Location unavailable on this device.</p>
          )}
          {permState === "prompt" && tracking.status !== "denied" && (
            <p>Location permission not yet granted — you'll be prompted when tracking starts.</p>
          )}
          {tracking.last && (
            <p>
              Last fix {Math.round((Date.now() - tracking.last.ts) / 1000)}s ago
              {tracking.last.accuracy ? ` · ±${Math.round(tracking.last.accuracy)}m` : ""}
            </p>
          )}
          {inside !== null && distance !== null && (
            <p className={inside ? "text-emerald-600" : "text-amber-600"}>
              {inside ? "Inside property radius" : `Outside radius — ${Math.round(distance)}ft from property`}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {state === "accepted" && (
          <Button
            onClick={async () => {
              // Pre-request permission on native so the OS prompt appears
              // before our consent sheet, not after they've already agreed.
              if (Capacitor.isNativePlatform()) {
                const res = await requestLocationPermission().catch(() => "prompt" as const);
                setPermState(res === "granted" ? "granted" : res === "denied" ? "denied" : "prompt");
              }
              setConsentOpen(true);
            }}
            disabled={startMut.isPending}
          >
            <Navigation className="mr-2 h-4 w-4" /> Start Navigation
          </Button>
        )}
        {state === "en_route" && (
          <Button
            onClick={() => transitionMut.mutate("arrived")}
            disabled={transitionMut.isPending || inside === false}
            title={inside === false ? "You must be within the property radius" : undefined}
          >
            <MapPin className="mr-2 h-4 w-4" /> I've Arrived
          </Button>
        )}
        {state === "arrived" && (
          <Button onClick={() => transitionMut.mutate("in_progress")} disabled={transitionMut.isPending}>
            Start Task
          </Button>
        )}
        {state === "in_progress" && (
          <Button onClick={() => completeMut.mutate(false)} disabled={completeMut.isPending}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Task
          </Button>
        )}
        {state === "completed" && (
          <Badge variant="secondary"><ShieldCheck className="mr-1 h-3 w-3" />Awaiting investor verification</Badge>
        )}
        {trackingActive && (
          <Button variant="ghost" size="sm" onClick={() => stopMut.mutate()} disabled={stopMut.isPending}>
            <XCircle className="mr-1 h-4 w-4" /> Stop tracking
          </Button>
        )}
      </div>

      {state === "en_route" && inside === false && (
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" /> Get closer to the property to arrive
        </p>
      )}

      <TrackingConsentSheet
        open={consentOpen}
        onCancel={() => setConsentOpen(false)}
        onConfirm={() => {
          setConsentOpen(false);
          startMut.mutate();
        }}
      />
    </div>
  );
}