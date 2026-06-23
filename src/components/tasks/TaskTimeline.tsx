import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Navigation,
  PackageCheck,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { listTaskTimeline } from "@/lib/task-timeline.functions";
import { supabase } from "@/integrations/supabase/client";

const EVENT_META: Record<string, { label: string; Icon: any; tone: string }> = {
  posted:             { label: "Task posted",         Icon: Sparkles,     tone: "text-primary" },
  assigned:           { label: "Runner assigned",     Icon: ShieldCheck,  tone: "text-primary" },
  accepted:           { label: "Runner accepted",     Icon: CheckCircle2, tone: "text-primary" },
  en_route:           { label: "On the way",          Icon: Navigation,   tone: "text-amber-500" },
  on_site:            { label: "Arrived on site",     Icon: MapPin,       tone: "text-amber-500" },
  in_progress:        { label: "Work in progress",    Icon: PlayCircle,   tone: "text-blue-500" },
  submitted:          { label: "Submitted for review", Icon: PackageCheck,tone: "text-blue-500" },
  completed:          { label: "Marked complete",     Icon: CheckCircle2, tone: "text-emerald-500" },
  verified:           { label: "Verified by investor", Icon: ShieldCheck, tone: "text-emerald-500" },
  revision_requested: { label: "Revision requested",  Icon: RotateCcw,    tone: "text-rose-500" },
  cancelled:          { label: "Cancelled",           Icon: Circle,       tone: "text-muted-foreground" },
};

export function TaskTimeline({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const fetchFn = useServerFn(listTaskTimeline);

  const { data, isLoading } = useQuery({
    queryKey: ["task-timeline", taskId],
    queryFn: () => fetchFn({ data: { taskId } }),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`task-timeline-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_status_events",
          filter: `task_id=eq.${taskId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["task-timeline", taskId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, qc]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading timeline…
      </div>
    );
  }

  const events = data?.events ?? [];
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="size-4" /> No activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2 text-sm font-medium">
        <Clock className="size-4 text-primary" /> Live activity
      </div>
      <ol className="relative px-4 py-4 space-y-4">
        {events.map((e: any, i: number) => {
          const meta = EVENT_META[e.event_code] ?? {
            label: e.event_code,
            Icon: Circle,
            tone: "text-muted-foreground",
          };
          const Icon = meta.Icon;
          const last = i === events.length - 1;
          const actorName = e.actor?.full_name ?? e.actor?.email ?? "System";
          return (
            <li key={e.id} className="relative pl-9">
              {!last && (
                <span className="absolute left-[14px] top-7 bottom-[-1rem] w-px bg-border" />
              )}
              <span
                className={`absolute left-0 top-0.5 size-7 rounded-full bg-background border border-border flex items-center justify-center ${meta.tone}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="text-sm font-medium text-foreground">{meta.label}</div>
              <div className="text-xs text-muted-foreground">
                {actorName} · {new Date(e.created_at).toLocaleString()}
                {e.latitude && e.longitude && (
                  <span className="ml-1">
                    · {Number(e.latitude).toFixed(3)}, {Number(e.longitude).toFixed(3)}
                  </span>
                )}
              </div>
              {e.note && (
                <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {e.note}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}