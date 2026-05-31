import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEmailMonitorData } from "@/lib/email-monitor.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Mail, Clock, AlertTriangle, CheckCircle2, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/email-monitor")({
  component: EmailMonitorPage,
  head: () => ({ meta: [{ title: "Email monitor — Admin" }] }),
});

function fmtAge(sec: number | null) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "sent") return "default";
  if (s === "pending") return "secondary";
  if (["failed", "dlq", "bounced", "complained"].includes(s)) return "destructive";
  return "outline";
}

function EmailMonitorPage() {
  const fetchData = useServerFn(getEmailMonitorData);
  const [hours, setHours] = useState<number>(24);

  const q = useQuery({
    queryKey: ["email-monitor", hours],
    queryFn: () => fetchData({ data: { hours } }),
    refetchInterval: 15_000,
  });

  const d = q.data;

  return (
    <DashboardShell title="Email monitor" subtitle="Queue depth, recent sends, and failures by recipient.">
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[1, 24, 24 * 7, 24 * 30].map((h) => (
          <Button
            key={h}
            size="sm"
            variant={hours === h ? "default" : "outline"}
            onClick={() => setHours(h)}
          >
            {h === 1 ? "Last hour" : h === 24 ? "24h" : h === 168 ? "7d" : "30d"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => q.refetch()} className="ml-auto">
          <RefreshCcw className="size-4 mr-1" /> Refresh
        </Button>
      </div>

      {q.isLoading && !d ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : !d ? (
        <p className="text-sm text-destructive">{(q.error as Error)?.message ?? "Failed to load"}</p>
      ) : (
        <div className="space-y-8">
          {/* Queue health */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Queue health</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {d.queues.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full">No queues found.</p>
              ) : (
                d.queues.map((qd) => {
                  const isDlq = qd.queue_name.endsWith("_dlq");
                  return (
                    <div
                      key={qd.queue_name}
                      className={`rounded-2xl border p-4 ${
                        isDlq && qd.queue_length > 0
                          ? "border-destructive/40 bg-destructive/5"
                          : "border-border bg-card/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                        {isDlq ? <AlertTriangle className="size-3.5" /> : <Inbox className="size-3.5" />}
                        {qd.queue_name}
                      </div>
                      <div className="mt-2 text-2xl font-bold">{qd.queue_length}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="size-3" /> oldest {fmtAge(qd.oldest_msg_age_sec)} · total {qd.total_messages}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {d.state && (
              <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Batch: {d.state.batch_size}</span>
                <span>Delay: {d.state.send_delay_ms}ms</span>
                <span>Auth TTL: {d.state.auth_email_ttl_minutes}m</span>
                <span>Tx TTL: {d.state.transactional_email_ttl_minutes}m</span>
                {d.state.retry_after_until && (
                  <span className="text-amber-500">
                    Rate-limited until {new Date(d.state.retry_after_until).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Stats */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Window stats ({d.stats.total} unique emails)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatBox label="Sent" value={d.stats.sent} tone="success" icon={CheckCircle2} />
              <StatBox label="Pending" value={d.stats.pending} tone="muted" icon={Clock} />
              <StatBox label="Failed" value={d.stats.failed} tone="danger" icon={AlertTriangle} />
              <StatBox label="DLQ" value={d.stats.dlq} tone="danger" icon={AlertTriangle} />
              <StatBox label="Bounced" value={d.stats.bounced} tone="danger" icon={AlertTriangle} />
              <StatBox label="Complained" value={d.stats.complained} tone="danger" icon={AlertTriangle} />
              <StatBox label="Suppressed" value={d.stats.suppressed} tone="muted" icon={Mail} />
            </div>
          </section>

          {/* Failures by recipient */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Failures by recipient
            </h2>
            {d.failuresByRecipient.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failures in this window. 🎉</p>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Recipient</th>
                      <th className="text-left px-3 py-2">Template</th>
                      <th className="text-left px-3 py-2">Count</th>
                      <th className="text-left px-3 py-2">Last failure</th>
                      <th className="text-left px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.failuresByRecipient.map((f) => (
                      <tr key={f.recipient_email} className="border-t border-border/60">
                        <td className="px-3 py-2 font-mono text-xs">{f.recipient_email}</td>
                        <td className="px-3 py-2 text-xs">{f.template_name}</td>
                        <td className="px-3 py-2">
                          <Badge variant="destructive">{f.failure_count}</Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(f.last_failed_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-md truncate" title={f.last_error ?? ""}>
                          {f.last_error ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent sends */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Recent sends
            </h2>
            {d.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity in this window.</p>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Time</th>
                      <th className="text-left px-3 py-2">Template</th>
                      <th className="text-left px-3 py-2">Recipient</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recent.map((r, i) => (
                      <tr key={`${r.message_id ?? i}-${i}`} className="border-t border-border/60">
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs">{r.template_name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.recipient_email}</td>
                        <td className="px-3 py-2">
                          <Badge variant={statusVariant(r.status)} className="capitalize">{r.status}</Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-md truncate" title={r.error_message ?? ""}>
                          {r.error_message ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function StatBox({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "muted";
  icon: any;
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-500"
      : tone === "danger"
      ? "text-destructive"
      : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4">
      <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider ${toneClass}`}>
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}