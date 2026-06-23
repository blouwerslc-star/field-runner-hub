import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMarketplaceHealth } from "@/lib/ops.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RouteErrorState } from "@/components/dashboard/UiStates";
import { Loader2, Users, ClipboardList, DollarSign, MapPin, TrendingUp, TrendingDown, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketplace-health")({
  component: MarketplaceHealth,
  head: () => ({ meta: [{ title: "Marketplace health — REI Runner Admin" }] }),
  errorComponent: ({ error, reset }) => <RouteErrorState error={error} reset={reset} />,
});

function fmtMoney(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function Stat({
  icon: Icon,
  label,
  value,
  growth,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  growth?: number;
  sub?: string;
}) {
  const up = (growth ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-3">
        <Icon className="size-4" /> {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {growth !== undefined && (
          <span className={`inline-flex items-center gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function MarketplaceHealth() {
  const fn = useServerFn(getMarketplaceHealth);
  const { data, isLoading, error } = useQuery({
    queryKey: ["marketplace-health"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <DashboardShell title="Marketplace health" subtitle="Live KPIs across users, tasks, and revenue.">
        {error ? (
          <div className="text-sm text-red-400">{(error as Error).message}</div>
        ) : (
          <Loader2 className="size-6 animate-spin text-primary" />
        )}
      </DashboardShell>
    );
  }

  const maxTasks = Math.max(1, ...data.series.map((s) => s.tasks));
  const maxRev = Math.max(1, ...data.series.map((s) => s.revenue_cents));

  return (
    <DashboardShell title="Marketplace health" subtitle="Live KPIs across users, tasks, and revenue.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Users} label="Total users" value={data.users.total} growth={data.users.growth_pct} sub="30d growth" />
        <Stat icon={Activity} label="Active 30d" value={data.users.active_30d} sub={`${data.users.new_7d} new this week`} />
        <Stat icon={ClipboardList} label="Open tasks" value={data.tasks.open} sub={`${data.tasks.total} total`} />
        <Stat icon={ClipboardList} label="Completed" value={data.tasks.completed} growth={data.tasks.growth_pct} sub="30d task growth" />
        <Stat icon={DollarSign} label="Platform revenue" value={fmtMoney(data.revenue.platform_fees_cents)} growth={data.revenue.growth_pct} sub="lifetime fees" />
        <Stat icon={DollarSign} label="GMV (paid)" value={fmtMoney(data.revenue.gmv_cents)} sub="gross paid volume" />
        <Stat icon={DollarSign} label="Revenue 30d" value={fmtMoney(data.revenue.last_30d_cents)} sub="last 30 days" />
        <Stat icon={MapPin} label="Cities covered" value={data.cities_covered} sub="unique markets" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold mb-4">
            <ClipboardList className="size-4 text-primary" /> Tasks per day (30d)
          </div>
          <div className="flex items-end gap-1 h-32">
            {data.series.map((s) => (
              <div
                key={s.day}
                className="flex-1 bg-primary/70 hover:bg-primary rounded-t"
                style={{ height: `${(s.tasks / maxTasks) * 100}%`, minHeight: 2 }}
                title={`${s.day}: ${s.tasks} tasks`}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold mb-4">
            <DollarSign className="size-4 text-primary" /> Revenue per day (30d)
          </div>
          <div className="flex items-end gap-1 h-32">
            {data.series.map((s) => (
              <div
                key={s.day}
                className="flex-1 bg-emerald-500/70 hover:bg-emerald-500 rounded-t"
                style={{ height: `${(s.revenue_cents / maxRev) * 100}%`, minHeight: 2 }}
                title={`${s.day}: ${fmtMoney(s.revenue_cents)}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5 mt-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
          <MapPin className="size-4 text-primary" /> Top cities by task volume
        </div>
        {data.top_cities.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {data.top_cities.map((c) => (
              <div key={c.city} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <span className="text-sm">{c.city}</span>
                <span className="text-sm font-semibold text-primary">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}