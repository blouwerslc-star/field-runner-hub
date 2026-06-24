import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getTaskTrackingState,
  getTaskTrail,
  transitionRunnerState,
} from "@/lib/tracking.functions";
import { TaskMap } from "@/components/tracking/TaskMap";
import { TaskTrackingPanel } from "@/components/tracking/TaskTrackingPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, CheckCircle2, ShieldCheck, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/$taskId/tracking")({
  component: TrackingPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-6 text-sm text-destructive">
      {error.message}
      <Button size="sm" variant="ghost" onClick={reset}>Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Task not found.</div>,
});

function timeline(task: Record<string, unknown>) {
  const entries: Array<{ key: string; label: string; at: string | null }> = [
    { key: "accepted", label: "Accepted", at: task.accepted_at as string | null },
    { key: "en_route", label: "En route", at: task.en_route_at as string | null },
    { key: "arrived", label: "Arrived", at: task.arrived_at as string | null },
    { key: "in_progress", label: "Started", at: task.started_at as string | null },
    { key: "completed", label: "Completed", at: task.completed_at as string | null },
    { key: "verified", label: "Verified", at: task.verified_at as string | null },
  ];
  return entries;
}

function TrackingPage() {
  const { taskId } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const stateFn = useServerFn(getTaskTrackingState);
  const trailFn = useServerFn(getTaskTrail);
  const transitionFn = useServerFn(transitionRunnerState);

  const { data, isLoading } = useQuery({
    queryKey: ["task-tracking", taskId],
    queryFn: () => stateFn({ data: { taskId } }),
    refetchInterval: 10_000,
  });
  const { data: trail } = useQuery({
    queryKey: ["task-trail", taskId],
    queryFn: () => trailFn({ data: { taskId, limit: 500 } }),
    refetchInterval: 15_000,
  });

  const [me, setMe] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: d }) => setMe(d.user?.id ?? null));
  }, []);

  // Realtime: refresh on new pings
  useEffect(() => {
    const ch = supabase
      .channel(`task-trail-${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_location_pings", filter: `task_id=eq.${taskId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["task-trail", taskId] });
          qc.invalidateQueries({ queryKey: ["task-tracking", taskId] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [taskId, qc]);

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  const task = data.task as Record<string, unknown> & {
    title: string;
    runner_id: string;
    investor_id: string;
    property_lat: number | null;
    property_lng: number | null;
    geofence_radius_ft: number;
    last_ping_lat: number | null;
    last_ping_lng: number | null;
    last_ping_within_geofence: boolean | null;
    last_ping_at: string | null;
    runner_state: string | null;
    tracking_active: boolean;
  };

  const isRunner = me === task.runner_id;
  const isInvestor = me === task.investor_id;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{task.title}</h1>
          <p className="text-xs text-muted-foreground">
            <Link to="/tasks/$taskId" params={{ taskId }} className="underline">
              View task details
            </Link>
          </p>
        </div>
        {task.last_ping_within_geofence === true && (
          <Badge className="bg-emerald-500 text-white">
            <CheckCircle2 className="mr-1 h-3 w-3" /> On site
          </Badge>
        )}
        {task.last_ping_within_geofence === false && (
          <Badge variant="outline" className="border-amber-500 text-amber-600">Off site</Badge>
        )}
      </div>

      <TaskMap
        propertyLat={task.property_lat}
        propertyLng={task.property_lng}
        radiusFt={task.geofence_radius_ft}
        runnerLat={task.last_ping_lat}
        runnerLng={task.last_ping_lng}
        trail={trail?.pings ?? []}
        className="h-72 sm:h-96"
      />

      {isRunner && <TaskTrackingPanel taskId={taskId} />}

      {(isRunner || isInvestor) && (
        <Button asChild variant="outline" className="w-full">
          <Link to="/tasks/$taskId/run" params={{ taskId }}>
            <ListChecks className="mr-2 h-4 w-4" />
            {isRunner ? "Open guided checklist" : "View runner checklist progress"}
          </Link>
        </Button>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Status timeline</h2>
        <ol className="space-y-2 text-sm">
          {timeline(task).map((e) => (
            <li key={e.key} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
              <span className={e.at ? "text-foreground" : "text-muted-foreground"}>{e.label}</span>
              <span className="text-xs text-muted-foreground">
                {e.at ? new Date(e.at).toLocaleString() : "—"}
              </span>
            </li>
          ))}
        </ol>
        {isInvestor && task.runner_state === "completed" && (
          <Button
            className="mt-3 w-full"
            onClick={async () => {
              try {
                await transitionFn({ data: { taskId, to: "verified" } });
                qc.invalidateQueries({ queryKey: ["task-tracking", taskId] });
                toast.success("Task verified");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Verify completion
          </Button>
        )}
      </div>

      {task.last_ping_at && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> Last location update {new Date(task.last_ping_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}