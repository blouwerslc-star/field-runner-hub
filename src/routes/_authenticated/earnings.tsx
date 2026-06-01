import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getRunnerEarnings } from "@/lib/ops.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DollarSign, Clock, Trophy, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardLoadingSkeleton, EmptyState, RouteErrorState } from "@/components/dashboard/UiStates";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: EarningsPage,
  head: () => ({ meta: [{ title: "Earnings — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <DashboardShell title="Earnings">
      <RouteErrorState error={error} reset={reset} title="Couldn't load earnings" />
    </DashboardShell>
  ),
});

const fmt = (c: number) => `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function EarningsPage() {
  const fn = useServerFn(getRunnerEarnings);
  const q = useQuery({ queryKey: ["runner-earnings"], queryFn: () => fn() });

  if (q.isLoading) {
    return (
      <DashboardShell title="Earnings">
        <DashboardLoadingSkeleton tiles={4} rows={3} />
      </DashboardShell>
    );
  }
  const d = q.data;
  if (!d) {
    return (
      <DashboardShell title="Earnings">
        <EmptyState message="No earnings data yet." />
      </DashboardShell>
    );
  }
  const maxMonth = Math.max(1, ...d.months.map((m) => m.paid));

  return (
    <DashboardShell title="Earnings" subtitle="Track every dollar earned — pending, paid out, and lifetime.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Clock} label="Pending" value={fmt(d.pending_cents)} accent="text-amber-300" />
        <Stat icon={DollarSign} label="Paid out" value={fmt(d.paid_cents)} accent="text-emerald-300" />
        <Stat icon={Trophy} label="Lifetime earnings" value={fmt(d.lifetime_cents)} accent="text-primary" />
        <Stat icon={CheckCircle2} label="Completed tasks" value={String(d.completed_count)} />
      </div>

      <section className="rounded-2xl border border-border bg-card/50 p-6 mb-6">
        <h2 className="font-semibold mb-4">Last 6 months</h2>
        <div className="grid grid-cols-6 gap-1 sm:gap-3 items-end h-40">
          {d.months.map((m) => (
            <div key={m.month} className="flex flex-col items-center gap-2 min-w-0">
              <div className="text-[10px] sm:text-xs font-semibold text-primary truncate max-w-full">{fmt(m.paid)}</div>
              <div className="w-full bg-primary/80 rounded-t-md transition-all" style={{ height: `${(m.paid / maxMonth) * 100}%`, minHeight: m.paid > 0 ? 6 : 2 }} />
              <div className="text-[10px] sm:text-xs text-muted-foreground">{m.month.slice(5)}</div>
              <div className="text-[10px] text-muted-foreground">{m.tasks} task{m.tasks === 1 ? "" : "s"}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Recent completed tasks</h2>
        {d.recent_completed.length === 0 ? (
          <EmptyState
            message="No completed tasks yet. Apply to one from the Marketplace to start earning."
            ctaLabel="Browse marketplace"
            ctaTo="/tasks"
          />
        ) : (
          <div className="rounded-2xl border border-border bg-card/40 overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr><th className="text-left p-3">Task</th><th className="text-left p-3">Location</th><th className="text-left p-3">Payout</th><th className="text-left p-3">Status</th></tr>
              </thead>
              <tbody>
                {d.recent_completed.map((t: any) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3 text-muted-foreground">{t.city}, {t.state}</td>
                    <td className="p-3 font-semibold text-primary">${Number(t.payout_amount ?? 0).toFixed(2)}</td>
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