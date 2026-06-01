import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listActivity } from "@/lib/activity.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Activity, ClipboardList, UserPlus, Star, CheckCircle2 } from "lucide-react";
import { DashboardLoadingSkeleton, EmptyState, RouteErrorState } from "@/components/dashboard/UiStates";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
  head: () => ({ meta: [{ title: "Activity — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <DashboardShell title="Activity">
      <RouteErrorState error={error} reset={reset} title="Couldn't load activity feed" />
    </DashboardShell>
  ),
});

const ICONS: Record<string, any> = {
  task_posted: ClipboardList,
  task_assigned: ClipboardList,
  task_completed: CheckCircle2,
  review_left: Star,
  user_joined: UserPlus,
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ActivityPage() {
  const fn = useServerFn(listActivity);
  const { data, isLoading } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: () => fn({ data: { limit: 80 } }),
    refetchInterval: 30_000,
  });
  const events = data?.events ?? [];

  return (
    <DashboardShell title="Activity" subtitle="What's happening across the REI Runner marketplace.">
      {isLoading ? (
        <DashboardLoadingSkeleton tiles={0} rows={6} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Quiet around here"
          message="No marketplace activity yet. New tasks, applications, and reviews will appear here as they happen."
        />
      ) : (
        <ul className="space-y-2">
          {events.map((e: any) => {
            const Icon = ICONS[e.event_type] ?? Activity;
            const inner = (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4 hover:border-primary/40 transition-colors">
                <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{e.title}</div>
                  {e.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{e.body}</div>}
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                    {e.actor?.full_name && <span>{e.actor.company_name || e.actor.full_name}</span>}
                    <span>·</span>
                    <span>{timeAgo(e.created_at)}</span>
                  </div>
                </div>
              </div>
            );
            return (
              <li key={e.id}>
                {e.link ? <Link to={e.link as any}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}