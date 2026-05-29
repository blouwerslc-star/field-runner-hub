import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getInvestorPerformance } from "@/lib/ops.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Loader2, Activity, CheckCircle2, Clock, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/performance")({
  component: PerformancePage,
  head: () => ({ meta: [{ title: "Performance — REI Runner" }] }),
});

const fmt = (c: number) => `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PerformancePage() {
  const fn = useServerFn(getInvestorPerformance);
  const q = useQuery({ queryKey: ["investor-performance"], queryFn: () => fn() });

  if (q.isLoading) return <DashboardShell title="Performance"><Loader2 className="size-5 animate-spin text-primary" /></DashboardShell>;
  const d = q.data!;
  const maxSpend = Math.max(1, ...d.months.map((m) => m.spend));

  return (
    <DashboardShell title="Performance" subtitle="Your task throughput, completion velocity, and spend at a glance.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat icon={Activity} label="Active tasks" value={String(d.active_count)} />
        <Stat icon={CheckCircle2} label="Completed" value={String(d.completed_count)} />
        <Stat icon={Clock} label="Avg completion" value={`${d.avg_completion_days} days`} />
        <Stat icon={DollarSign} label="Total spend" value={fmt(d.total_spend_cents)} accent="text-primary" />
        <Stat icon={TrendingUp} label="This month" value={fmt(d.this_month_spend_cents)} accent="text-emerald-300" />
      </div>

      <section className="rounded-2xl border border-border bg-card/50 p-6 mb-6">
        <h2 className="font-semibold mb-4">Monthly spend (last 6)</h2>
        <div className="grid grid-cols-6 gap-3 items-end h-40">
          {d.months.map((m) => (
            <div key={m.month} className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-primary">{fmt(m.spend)}</div>
              <div className="w-full bg-primary/80 rounded-t-md transition-all" style={{ height: `${(m.spend / maxSpend) * 100}%`, minHeight: m.spend > 0 ? 6 : 2 }} />
              <div className="text-xs text-muted-foreground">{m.month.slice(5)}</div>
              <div className="text-[10px] text-muted-foreground">{m.tasks} task{m.tasks === 1 ? "" : "s"}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Active tasks</h2>
        {d.recent_active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">No active tasks.</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr><th className="text-left p-3">Task</th><th className="text-left p-3">Location</th><th className="text-left p-3">Payout</th><th className="text-left p-3">Status</th></tr>
              </thead>
              <tbody>
                {d.recent_active.map((t: any) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3 text-muted-foreground">{t.city}, {t.state}</td>
                    <td className="p-3 font-semibold">${Number(t.payout_amount ?? 0).toFixed(2)}</td>
                    <td className="p-3"><Badge variant="outline" className="capitalize text-xs">{t.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}