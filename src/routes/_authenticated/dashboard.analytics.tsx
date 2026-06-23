import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardLoadingSkeleton, RouteErrorState } from "@/components/dashboard/UiStates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BarChart3, Clock, DollarSign, Lock, MapPin, Star, TrendingUp, Users, Zap } from "lucide-react";
import { getInvestorAnalytics } from "@/lib/analytics.functions";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Investor Analytics — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <DashboardShell title="Analytics">
      <RouteErrorState error={error} reset={reset} title="Couldn't load analytics" />
    </DashboardShell>
  ),
});

const TYPE_LABELS: Record<string, string> = {
  photos: "Photos",
  video: "Video",
  occupancy: "Occupancy",
  drive_by: "Drive-by",
  lockbox: "Lockbox",
  other: "Other",
};

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function hours(h: number) {
  if (!h) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function AnalyticsPage() {
  const fetchData = useServerFn(getInvestorAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["investor-analytics"],
    queryFn: () => fetchData(),
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <DashboardShell title="Investor Analytics">
        <DashboardLoadingSkeleton />
      </DashboardShell>
    );
  }

  const { totals, performance, by_type, by_market, top_runners, daily } = data;
  const maxDaily = Math.max(1, ...daily.map((d) => d.tasks));
  const maxSpend = Math.max(1, ...daily.map((d) => d.spend_cents));
  const maxTypeSpend = Math.max(1, ...by_type.map((r) => r.spend_cents));

  return (
    <DashboardShell title="Investor Analytics" subtitle="Track spend, performance, and your runner network.">
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/investor"><ArrowLeft className="size-4 mr-1" /> Back to dashboard</Link>
        </Button>
        <Badge variant="outline" className="gap-1"><BarChart3 className="size-3" /> Last 30 days</Badge>
      </div>

      {/* Headline KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        <Kpi icon={<Lock className="size-4" />} label="In escrow" value={money(totals.in_escrow_cents)} tone="primary" />
        <Kpi icon={<DollarSign className="size-4" />} label="Spend (30d)" value={money(totals.spend_30_cents)} />
        <Kpi icon={<TrendingUp className="size-4" />} label="Spend all-time" value={money(totals.spend_all_cents)} />
        <Kpi icon={<Zap className="size-4" />} label="Completion rate" value={`${Math.round(totals.completion_rate * 100)}%`} />
      </div>

      {/* Task pipeline */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 mb-6">
        <Kpi label="Total tasks" value={String(totals.tasks)} />
        <Kpi label="Open" value={String(totals.open)} />
        <Kpi label="In progress" value={String(totals.in_progress)} />
        <Kpi label="Completed" value={String(totals.completed)} />
        <Kpi label="Cancelled" value={String(totals.cancelled)} />
      </div>

      {/* Performance */}
      <div className="grid gap-3 md:grid-cols-3 mb-6">
        <Kpi icon={<Clock className="size-4" />} label="Avg time to first applicant" value={hours(performance.avg_time_to_first_application_hours)} />
        <Kpi icon={<Users className="size-4" />} label="Avg applicants / task" value={performance.avg_applications_per_task.toFixed(1)} />
        <Kpi icon={<Clock className="size-4" />} label="Avg time to complete" value={hours(performance.avg_completion_hours)} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card title="Daily task volume (30 days)" icon={<BarChart3 className="size-4 text-primary" />}>
          {daily.every((d) => d.tasks === 0) ? (
            <p className="text-xs text-muted-foreground">No task activity in the last 30 days.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {daily.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.tasks} tasks`}>
                  <div
                    className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors"
                    style={{ height: `${(d.tasks / maxDaily) * 100}%`, minHeight: d.tasks > 0 ? 4 : 0 }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{daily[0]?.day.slice(5)}</span>
            <span>{daily[daily.length - 1]?.day.slice(5)}</span>
          </div>
        </Card>

        <Card title="Daily spend (30 days)" icon={<DollarSign className="size-4 text-primary" />}>
          {daily.every((d) => d.spend_cents === 0) ? (
            <p className="text-xs text-muted-foreground">No payments in the last 30 days.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {daily.map((d) => (
                <div key={d.day} className="flex-1" title={`${d.day}: ${money(d.spend_cents)}`}>
                  <div
                    className="w-full rounded-t bg-emerald-500/70 hover:bg-emerald-500 transition-colors"
                    style={{ height: `${(d.spend_cents / maxSpend) * 100}%`, minHeight: d.spend_cents > 0 ? 4 : 0 }}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Breakdown row */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card title="Spend by task type" icon={<BarChart3 className="size-4 text-primary" />}>
          {by_type.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {by_type.map((row) => (
                <div key={row.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{TYPE_LABELS[row.type] ?? row.type}</span>
                    <span className="text-muted-foreground">
                      {row.completed}/{row.count} · {money(row.spend_cents)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(row.spend_cents / maxTypeSpend) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Top markets" icon={<MapPin className="size-4 text-primary" />}>
          {by_market.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {by_market.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium">{m.city}, {m.state}</div>
                    <div className="text-[11px] text-muted-foreground">{m.count} task{m.count === 1 ? "" : "s"}</div>
                  </div>
                  <div className="text-xs font-mono">{money(m.spend_cents)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top runners */}
      <Card title="Your top runners" icon={<Users className="size-4 text-primary" />}>
        {top_runners.length === 0 ? (
          <p className="text-xs text-muted-foreground">Assign tasks to see your top performers.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {top_runners.map((r) => (
              <div key={r.runner_id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <Avatar className="size-10">
                  <AvatarImage src={r.avatar_url ?? undefined} />
                  <AvatarFallback>{r.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.full_name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    {r.city && <span>{r.city}{r.state ? `, ${r.state}` : ""}</span>}
                    {r.avg_rating !== null && (
                      <span className="flex items-center gap-0.5"><Star className="size-3 fill-amber-400 text-amber-400" /> {r.avg_rating}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-mono">{money(r.spend_cents)}</div>
                  <div className="text-muted-foreground">{r.tasks} task{r.tasks === 1 ? "" : "s"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}

function Kpi({ icon, label, value, tone }: { icon?: React.ReactNode; label: string; value: string; tone?: "primary" }) {
  return (
    <div className={`rounded-xl border p-3 ${tone === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-card/60"}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}