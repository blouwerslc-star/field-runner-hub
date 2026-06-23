import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listFlaggedTasks,
  getTaskTrail,
  getTaskTrackingState,
  adminOverrideCompletion,
} from "@/lib/tracking.functions";
import { TaskMap } from "@/components/tracking/TaskMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tracking")({
  component: AdminTrackingPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-6 text-sm text-destructive">
      {error.message} <Button size="sm" variant="ghost" onClick={reset}>Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

function AdminTrackingPage() {
  const flaggedFn = useServerFn(listFlaggedTasks);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-flagged-tracking"],
    queryFn: () => flaggedFn(),
    refetchInterval: 30_000,
  });
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <header>
        <h1 className="text-xl font-semibold">GPS Tracking — Admin</h1>
        <p className="text-sm text-muted-foreground">
          Tasks completed outside the property radius or without GPS verification.
        </p>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && data && data.tasks.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nothing flagged. All completed tasks were verified inside their geofences.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`text-left rounded-xl border p-3 transition ${selected === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.city ?? ""}{t.state ? `, ${t.state}` : ""}
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {t.last_ping_within_geofence === false ? "Off site" : "No GPS"}
              </Badge>
            </div>
            {t.last_ping_distance_ft !== null && t.last_ping_distance_ft !== undefined && (
              <p className="mt-2 text-xs text-muted-foreground">
                {Math.round(t.last_ping_distance_ft)} ft from property at completion
              </p>
            )}
          </button>
        ))}
      </div>

      {selected && <SelectedTaskDetail taskId={selected} />}
    </div>
  );
}

function SelectedTaskDetail({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const stateFn = useServerFn(getTaskTrackingState);
  const trailFn = useServerFn(getTaskTrail);
  const overrideFn = useServerFn(adminOverrideCompletion);

  const { data: state } = useQuery({
    queryKey: ["admin-tracking-state", taskId],
    queryFn: () => stateFn({ data: { taskId } }),
  });
  const { data: trail } = useQuery({
    queryKey: ["admin-trail", taskId],
    queryFn: () => trailFn({ data: { taskId, limit: 1000 } }),
  });

  const override = useMutation({
    mutationFn: (reason: string) => overrideFn({ data: { taskId, reason } }),
    onSuccess: () => {
      toast.success("Task verified by admin");
      qc.invalidateQueries({ queryKey: ["admin-flagged-tracking"] });
      qc.invalidateQueries({ queryKey: ["admin-tracking-state", taskId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!state) return null;
  const t = state.task as Record<string, unknown> & {
    property_lat: number | null;
    property_lng: number | null;
    geofence_radius_ft: number;
    last_ping_lat: number | null;
    last_ping_lng: number | null;
    title: string;
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Selected</p>
          <p className="font-semibold">{t.title}</p>
        </div>
        <Link
          to="/tasks/$taskId/tracking"
          params={{ taskId }}
          className="text-xs underline"
        >
          Open task view
        </Link>
      </div>

      <TaskMap
        propertyLat={t.property_lat}
        propertyLng={t.property_lng}
        radiusFt={t.geofence_radius_ft}
        runnerLat={t.last_ping_lat}
        runnerLng={t.last_ping_lng}
        trail={trail?.pings ?? []}
        className="h-72"
      />

      <div className="max-h-48 overflow-auto rounded-lg border border-border/60 bg-muted/20 p-2 text-xs">
        {trail?.pings.map((p) => (
          <div key={p.id} className="flex justify-between border-b border-border/30 py-1 last:border-0">
            <span>{new Date(p.created_at).toLocaleTimeString()} · {p.runner_state ?? "—"}</span>
            <span className={p.within_geofence ? "text-emerald-600" : "text-amber-600"}>
              {p.distance_ft !== null ? `${Math.round(p.distance_ft)}ft` : "—"}
              <MapPin className="ml-1 inline h-3 w-3" />
            </span>
          </div>
        ))}
        {(!trail || trail.pings.length === 0) && (
          <p className="py-2 text-center text-muted-foreground">No GPS pings recorded for this task.</p>
        )}
      </div>

      <Button
        className="w-full"
        variant="outline"
        onClick={() => {
          const reason = window.prompt("Reason for admin override:");
          if (reason && reason.trim().length >= 3) override.mutate(reason.trim());
        }}
        disabled={override.isPending}
      >
        <ShieldCheck className="mr-2 h-4 w-4" /> Manually verify completion
      </Button>
    </div>
  );
}