import { useMemo } from "react";
import { TrendingUp, Lock, Calendar, BarChart3 } from "lucide-react";

type T = {
  status: string;
  task_type: string;
  payout_amount: number | null;
  funded?: boolean;
  created_at?: string;
};

const TYPE_LABELS: Record<string, string> = {
  photos: "Photos",
  video: "Video",
  occupancy: "Occupancy",
  drive_by: "Drive-by",
  lockbox: "Lockbox",
  other: "Other",
};

function money(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function SpendAnalyticsCard({ tasks }: { tasks: T[] }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    let inFlight = 0;
    let spent30 = 0;
    let spentAll = 0;
    const byType = new Map<string, { count: number; total: number }>();

    for (const t of tasks) {
      const amt = Number(t.payout_amount ?? 0);
      const completed = t.status === "approved" || t.status === "paid";
      const inFlightStatus =
        t.status === "open" || t.status === "assigned" ||
        t.status === "in_progress" || t.status === "submitted" ||
        t.status === "revision_requested";

      if (inFlightStatus && t.funded) inFlight += amt;
      if (completed) {
        spentAll += amt;
        if (t.created_at && now - new Date(t.created_at).getTime() < thirtyDays) {
          spent30 += amt;
        }
        const row = byType.get(t.task_type) ?? { count: 0, total: 0 };
        row.count += 1;
        row.total += amt;
        byType.set(t.task_type, row);
      }
    }

    const typeRows = [...byType.entries()]
      .map(([k, v]) => ({ key: k, label: TYPE_LABELS[k] ?? k, ...v }))
      .sort((a, b) => b.total - a.total);
    const maxTotal = Math.max(1, ...typeRows.map((r) => r.total));

    return { inFlight, spent30, spentAll, typeRows, maxTotal };
  }, [tasks]);

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          Spend overview
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <MiniStat
          icon={<Lock className="size-3.5" />}
          label="In escrow"
          value={money(stats.inFlight)}
          tone="primary"
        />
        <MiniStat
          icon={<Calendar className="size-3.5" />}
          label="Last 30 days"
          value={money(stats.spent30)}
        />
        <MiniStat
          icon={<TrendingUp className="size-3.5" />}
          label="All-time"
          value={money(stats.spentAll)}
        />
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">By task type</div>
        {stats.typeRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No completed tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.typeRows.map((row) => (
              <div key={row.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/90">{row.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.count} · <span className="text-foreground">{money(row.total)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary"
                    style={{ width: `${(row.total / stats.maxTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone?: "primary" }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`mt-1 text-lg font-bold tabular-nums ${tone === "primary" ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}