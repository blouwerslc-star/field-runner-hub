import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPlatformMetrics } from "@/lib/analytics.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RouteErrorState } from "@/components/dashboard/UiStates";
import { Loader2, Users, ClipboardList, DollarSign, Star, ShieldAlert, TrendingUp, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
  head: () => ({ meta: [{ title: "Platform analytics — REI Runner Admin" }] }),
  errorComponent: ({ error, reset }) => <RouteErrorState error={error} reset={reset} />,
});

function fmtMoney(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-3">
        <Icon className="size-4" /> {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function AdminAnalytics() {
  const fn = useServerFn(getPlatformMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin-metrics"], queryFn: () => fn(), refetchInterval: 60_000 });

  if (isLoading || !data) {
    return (
      <DashboardShell title="Platform analytics" subtitle="Marketplace KPIs and operations health.">
        <Loader2 className="size-6 animate-spin text-primary" />
      </DashboardShell>
    );
  }

  const m = data;
  const maxDaily = Math.max(1, ...m.daily_tasks.map((d) => d.tasks));

  return (
    <DashboardShell title="Platform analytics" subtitle="Marketplace KPIs and operations health.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat icon={Users} label="Users" value={m.users.total} sub={`+${m.users.last7} this week`} />
        <Stat icon={Briefcase} label="Tasks" value={m.tasks.total} sub={`${m.tasks.open} open · ${m.tasks.completed} done`} />
        <Stat icon={DollarSign} label="GMV (paid)" value={fmtMoney(m.gmv_cents)} sub={`${fmtMoney(m.platform_fees_cents)} platform fees`} />
        <Stat icon={TrendingUp} label="Avg payout" value={`$${m.tasks.avg_payout.toFixed(0)}`} sub={`${m.applications_total} applications`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat icon={Users} label="Runners" value={m.users.runners} />
        <Stat icon={Users} label="Investors" value={m.users.investors} />
        <Stat icon={Star} label="Avg rating" value={m.reviews.count > 0 ? `${m.reviews.avg_rating.toFixed(2)}★` : "—"} sub={`${m.reviews.count} reviews`} />
        <Stat icon={ShieldAlert} label="Moderation" value={m.moderation.open_reports + m.moderation.open_disputes} sub={`${m.moderation.open_reports} reports · ${m.moderation.open_disputes} disputes`} />
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-4">
          <ClipboardList className="size-4" /> Tasks per day (last 14)
        </div>
        <div className="flex items-end gap-2 h-40">
          {m.daily_tasks.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary"
                style={{ height: `${(d.tasks / maxDaily) * 100}%` }}
                title={`${d.day}: ${d.tasks}`}
              />
              <div className="text-[10px] text-muted-foreground">{d.day.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Stat icon={DollarSign} label="Runner payouts (paid)" value={fmtMoney(m.runner_payout_cents)} />
        <Stat icon={Users} label="New users (30d)" value={m.users.last30} />
      </div>
    </DashboardShell>
  );
}