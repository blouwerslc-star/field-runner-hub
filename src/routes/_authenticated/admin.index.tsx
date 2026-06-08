import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Users, ClipboardList, Plus, ShieldCheck, Send, BarChart3, Activity, BadgeCheck, Mail, DollarSign, MapPin, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listPayouts, markPayoutPaid } from "@/lib/payments.functions";
import { getTaskDetail } from "@/lib/tasks.functions";
import { getSignedDownloadUrl } from "@/lib/storage.functions";
import { listAdminRunners, type AdminRunner } from "@/lib/admin.functions";
import { getPlatformMetrics } from "@/lib/analytics.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Admin — REI Runner" }] }),
});

type FieldRunner = AdminRunner;

type Investor = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  market_city: string;
  market_state: string;
  role: string;
  services_needed: string[];
  user_id: string | null;
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  task_type: string;
  property_address: string;
  city: string;
  state: string;
  status: string;
  payout_amount: number | null;
  due_date: string | null;
  investor_id: string | null;
  runner_id: string | null;
  created_at: string;
};

function statusColor(status: string) {
  switch (status) {
    case "open":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    case "assigned":
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    case "in_progress":
      return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    case "submitted":
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "approved":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "revision_requested":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "paid":
      return "bg-emerald-600/20 text-emerald-200 border-emerald-500/40";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function fmtMoney(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtTaskStatus(status: string) {
  return status.replace(/_/g, " ");
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [runners, setRunners] = useState<FieldRunner[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const fetchRunners = useServerFn(listAdminRunners);
  const signFn = useServerFn(getSignedDownloadUrl);
  const metricsFn = useServerFn(getPlatformMetrics);
  const metricsQuery = useQuery({
    queryKey: ["admin-command-metrics"],
    queryFn: () => metricsFn(),
    refetchInterval: 60_000,
  });

  async function loadAll() {
    setLoading(true);
    const [r, i, t] = await Promise.all([
      fetchRunners().catch((e) => {
        toast.error(e?.message ?? "Failed to load runners");
        return { runners: [] as AdminRunner[] };
      }),
      supabase
        .from("real_estate_pro_applications")
        .select("id, full_name, email, phone, market_city, market_state, role, services_needed, user_id, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (i.error) toast.error("Failed to load investors");
    if (t.error) toast.error("Failed to load tasks");
    setRunners(r.runners ?? []);
    setInvestors((i.data ?? []) as Investor[]);
    setTasks((t.data ?? []) as Task[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();

    const refresh = () => {
      loadAll();
      metricsQuery.refetch();
    };
    const channel = supabase
      .channel("admin-dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "real_estate_pro_applications" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "disputes" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const runnersWithAccount = useMemo(
    () => runners.filter((r) => r.user_id),
    [runners],
  );

  const metrics = metricsQuery.data;
  const activeTasks = useMemo(
    () => tasks.filter((t) => ["open", "assigned", "in_progress", "submitted"].includes(t.status)),
    [tasks],
  );
  const atRiskTasks = useMemo(
    () =>
      tasks
        .filter((t) => {
          if (t.status === "revision_requested") return true;
          if (!t.due_date || ["approved", "paid", "completed"].includes(t.status)) return false;
          return new Date(t.due_date).getTime() < Date.now();
        })
        .slice(0, 5),
    [tasks],
  );
  const marketRows = useMemo(() => {
    const markets = new Map<string, { open: number; total: number; runners: number }>();
    for (const task of tasks) {
      const key = [task.city, task.state].filter(Boolean).join(", ") || "Unassigned";
      const row = markets.get(key) ?? { open: 0, total: 0, runners: 0 };
      row.total += 1;
      if (["open", "assigned", "in_progress", "submitted"].includes(task.status)) row.open += 1;
      markets.set(key, row);
    }
    for (const runner of runners) {
      const key = [runner.city, runner.state].filter(Boolean).join(", ") || "Unassigned";
      const row = markets.get(key) ?? { open: 0, total: 0, runners: 0 };
      row.runners += 1;
      markets.set(key, row);
    }
    return Array.from(markets.entries())
      .map(([market, row]) => ({
        market,
        ...row,
        pressure: row.runners === 0 ? row.open : Math.round((row.open / row.runners) * 10) / 10,
      }))
      .sort((a, b) => b.open - a.open)
      .slice(0, 5);
  }, [runners, tasks]);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Live command center for field tasks, runners, investors, market pressure, and payouts."
    >
      <AdminCommandCenter
        metrics={metrics}
        metricsLoading={metricsQuery.isLoading}
        runners={runners}
        investors={investors}
        tasks={tasks}
        activeTasks={activeTasks}
        atRiskTasks={atRiskTasks}
        marketRows={marketRows}
      />

      <Tabs defaultValue="tasks">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="runners">Runners ({runners.length})</TabsTrigger>
          <TabsTrigger value="investors">Investors ({investors.length})</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">All Tasks</h2>
            <CreateTaskDialog onCreated={loadAll} />
          </div>
          {loading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : tasks.length === 0 ? (
            <EmptyState message="No tasks yet. Create one to get started." />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  runners={runnersWithAccount}
                  onChanged={loadAll}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runners">
          {loading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : runners.length === 0 ? (
            <EmptyState message="No runner signups yet." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Market</th>
                    <th className="px-4 py-3">Task types</th>
                    <th className="px-4 py-3">ID verification</th>
                    <th className="px-4 py-3">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {runners.map((r) => (
                    <tr key={r.user_id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{r.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{r.email}</div>
                        <div className="text-xs">{r.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.city}, {r.state}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {(r.task_types ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.id_file ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={async () => {
                              try {
                                const { url } = await signFn({
                                  data: { bucket: r.id_file!.bucket as any, path: r.id_file!.path },
                                });
                                window.open(url, "_blank", "noopener,noreferrer");
                              } catch (e) {
                                toast.error((e as Error).message);
                              }
                            }}
                          >
                            View ID
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not uploaded
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="investors">
          {loading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : investors.length === 0 ? (
            <EmptyState message="No investor signups yet." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Market</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Needs</th>
                    <th className="px-4 py-3">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((i) => (
                    <tr key={i.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{i.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{i.email}</div>
                        <div className="text-xs">{i.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {i.market_city}, {i.market_state}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i.role}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {(i.services_needed ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(i.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutsTab />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function AdminCommandCenter({
  metrics,
  metricsLoading,
  runners,
  investors,
  tasks,
  activeTasks,
  atRiskTasks,
  marketRows,
}: {
  metrics: any;
  metricsLoading: boolean;
  runners: FieldRunner[];
  investors: Investor[];
  tasks: Task[];
  activeTasks: Task[];
  atRiskTasks: Task[];
  marketRows: { market: string; open: number; total: number; runners: number; pressure: number }[];
}) {
  const openTasks = metrics?.tasks?.open ?? tasks.filter((t) => t.status === "open").length;
  const completedTasks = metrics?.tasks?.completed ?? tasks.filter((t) => ["completed", "approved", "paid"].includes(t.status)).length;
  const paidGmv = metrics?.gmv_cents ?? 0;
  const platformFees = metrics?.platform_fees_cents ?? 0;
  const runnerFillRate = activeTasks.length === 0 ? 100 : Math.round((activeTasks.filter((t) => t.runner_id).length / activeTasks.length) * 100);
  const latestTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-5 mb-8">
      <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
        <div className="p-5 md:p-6 bg-gradient-to-br from-primary/15 via-card to-card">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div>
              <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
                Live operations
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Company command center
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                Real-time Supabase-backed view of marketplace volume, active field work, runner coverage, and operational risk.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><Link to="/admin/dispatch"><Send className="size-4 mr-2" /> Dispatch</Link></Button>
              <Button asChild variant="outline" size="sm"><Link to="/admin/marketplace-health"><Activity className="size-4 mr-2" /> Health</Link></Button>
              <Button asChild variant="outline" size="sm"><Link to="/admin/analytics"><BarChart3 className="size-4 mr-2" /> Analytics</Link></Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
            <CommandMetric icon={DollarSign} label="GMV paid" value={metricsLoading ? "Loading..." : fmtMoney(paidGmv)} sub={`${fmtMoney(platformFees)} platform fees`} tone="primary" />
            <CommandMetric icon={ClipboardList} label="Open field tasks" value={openTasks} sub={`${activeTasks.length} active across all statuses`} tone="warning" />
            <CommandMetric icon={Users} label="Runner fill rate" value={`${runnerFillRate}%`} sub={`${runners.length} runners · ${investors.length} investors`} tone="success" />
            <CommandMetric icon={CheckCircle2} label="Completed tasks" value={completedTasks} sub={`${metrics?.reviews?.count ?? 0} reviews tracked`} tone="info" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-0 border-t border-border">
          <div className="p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-border">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold">Dispatch pulse</h3>
                <p className="text-xs text-muted-foreground mt-1">Newest tasks and status changes from the live database.</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {tasks.length} total
              </Badge>
            </div>
            {latestTasks.length === 0 ? (
              <EmptyState message="No tasks yet. Create one to start tracking live operations." />
            ) : (
              <div className="space-y-2">
                {latestTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-border/70 bg-background/40 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{task.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {task.city}, {task.state}</span>
                          {task.due_date && <span className="inline-flex items-center gap-1"><Clock className="size-3" /> Due {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColor(task.status)}>
                          {fmtTaskStatus(task.status)}
                        </Badge>
                        {task.payout_amount != null && <span className="text-sm font-semibold">${Number(task.payout_amount).toFixed(0)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 md:p-6 space-y-5">
            <MarketPressureList rows={marketRows} />
            <AdminAlertList atRiskTasks={atRiskTasks} metrics={metrics} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/runner-approvals"><ShieldCheck className="size-4 mr-2" /> Approvals</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/verifications"><BadgeCheck className="size-4 mr-2" /> Verifications</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/background-checks"><ShieldCheck className="size-4 mr-2" /> Background</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/dispatch"><Send className="size-4 mr-2" /> Dispatch</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/marketplace-health"><Activity className="size-4 mr-2" /> Health</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/analytics"><BarChart3 className="size-4 mr-2" /> Analytics</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/broadcasts"><Send className="size-4 mr-2" /> Broadcasts</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/email-monitor"><Mail className="size-4 mr-2" /> Email</Link></Button>
      </div>
    </div>
  );
}

function CommandMetric({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  tone: "primary" | "success" | "warning" | "info";
}) {
  const tones = {
    primary: "text-primary bg-primary/15",
    success: "text-emerald-300 bg-emerald-500/15",
    warning: "text-yellow-300 bg-yellow-500/15",
    info: "text-cyan-300 bg-cyan-500/15",
  };
  return (
    <div className="rounded-xl border border-border bg-background/55 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        <div className={`size-9 rounded-lg grid place-items-center ${tones[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function MarketPressureList({
  rows,
}: {
  rows: { market: string; open: number; total: number; runners: number; pressure: number }[];
}) {
  const maxOpen = Math.max(1, ...rows.map((row) => row.open));
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold">Market pressure</h3>
        <Badge variant="outline" className="text-xs"><MapPin className="size-3 mr-1" /> Top 5</Badge>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/30 p-4 text-sm text-muted-foreground">
          No market activity yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.market}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">{row.market}</div>
                  <div className="text-xs text-muted-foreground">{row.open} active · {row.runners} runners</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold">{row.pressure}</div>
                  <div className="text-muted-foreground">load</div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" style={{ width: `${Math.max(8, (row.open / maxOpen) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminAlertList({ atRiskTasks, metrics }: { atRiskTasks: Task[]; metrics: any }) {
  const moderation = (metrics?.moderation?.open_reports ?? 0) + (metrics?.moderation?.open_disputes ?? 0);
  const alerts = [
    atRiskTasks.length > 0
      ? {
          tone: "text-red-300 bg-red-500/15",
          title: `${atRiskTasks.length} task${atRiskTasks.length === 1 ? "" : "s"} need attention`,
          body: atRiskTasks[0]?.title ?? "Review overdue or revision-requested tasks.",
        }
      : {
          tone: "text-emerald-300 bg-emerald-500/15",
          title: "No overdue field tasks",
          body: "Active tasks are inside the current due-date window.",
        },
    moderation > 0
      ? {
          tone: "text-yellow-300 bg-yellow-500/15",
          title: `${moderation} moderation item${moderation === 1 ? "" : "s"}`,
          body: "Open reports or disputes are waiting for admin review.",
        }
      : {
          tone: "text-cyan-300 bg-cyan-500/15",
          title: "Moderation queue clear",
          body: "No open reports or disputes in the current metrics snapshot.",
        },
  ];

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold">Operator alerts</h3>
        <Badge variant="outline" className="text-xs"><AlertTriangle className="size-3 mr-1" /> Live</Badge>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.title} className="rounded-xl border border-border/70 bg-background/40 p-3 flex gap-3">
            <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${alert.tone}`}>
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <div className="text-sm font-medium">{alert.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{alert.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TaskRow({
  task,
  runners,
  onChanged,
}: {
  task: Task;
  runners: FieldRunner[];
  onChanged: () => void;
}) {
  const [assigning, setAssigning] = useState(false);
  const assignedRunner = runners.find((r) => r.user_id === task.runner_id);

  async function assign(runnerUserId: string) {
    setAssigning(true);
    const { error } = await supabase
      .from("tasks")
      .update({
        runner_id: runnerUserId,
        status: task.status === "open" ? "assigned" : task.status,
      })
      .eq("id", task.id);
    setAssigning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Runner assigned");
    onChanged();
  }

  async function setStatus(status: string) {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task updated");
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{task.title}</h3>
            <Badge variant="outline" className={statusColor(task.status)}>
              {task.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {task.task_type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {task.property_address}, {task.city}, {task.state}
          </p>
        </div>
        <div className="text-right text-sm">
          {task.payout_amount != null && (
            <div className="font-semibold text-primary">
              ${Number(task.payout_amount).toFixed(2)}
            </div>
          )}
          {task.due_date && (
            <div className="text-xs text-muted-foreground">
              Due {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Runner:</span>
          <Select
            value={task.runner_id ?? ""}
            onValueChange={(v) => assign(v)}
            disabled={assigning}
          >
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue placeholder="Assign runner…">
                {assignedRunner ? assignedRunner.full_name : "Assign runner…"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {runners.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No runners have signed up yet
                </div>
              )}
              {runners.map((r) => (
                <SelectItem key={r.user_id} value={r.user_id}>
                  {r.full_name} — {r.city}, {r.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Select value={task.status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="revision_requested">Revision requested</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <AdminTaskDetailDialog task={task} />
        </div>
      </div>
    </div>
  );
}

function AdminTaskDetailDialog({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const fetchDetail = useServerFn(getTaskDetail);
  const signFn = useServerFn(getSignedDownloadUrl);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-task-detail", task.id, open],
    queryFn: () => fetchDetail({ data: { taskId: task.id } }),
    enabled: open,
  });

  async function openFile(bucket: string, path: string) {
    try {
      const { url } = await signFn({ data: { bucket: bucket as "task-photos", path } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open file");
    }
  }

  const submissions = data?.submissions ?? [];
  const files = data?.files ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <div className="space-y-5 text-sm">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="font-medium">{task.property_address}</div>
              <div className="text-muted-foreground">{task.city}, {task.state}</div>
              {task.payout_amount != null && (
                <div className="mt-2 text-primary font-semibold">
                  Payout: ${Number(task.payout_amount).toFixed(2)}
                </div>
              )}
            </div>

            <div>
              <Label>Submissions ({submissions.length})</Label>
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No submissions yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {submissions.map((s: any) => (
                    <div key={s.id} className="rounded-lg border border-border bg-card/40 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className={statusColor(s.status)}>
                          {s.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString()}
                        </span>
                      </div>
                      {s.notes && <p className="text-muted-foreground whitespace-pre-wrap">{s.notes}</p>}
                      {s.rejection_reason && (
                        <p className="text-xs text-red-300 mt-1">Rejected: {s.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Files ({files.length})</Label>
              {files.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No files uploaded.</p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {files.map((f: any) => (
                    <button
                      key={f.id}
                      onClick={() => openFile(f.bucket, f.path)}
                      className="aspect-square rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition grid place-items-center text-xs text-muted-foreground p-2 text-center"
                    >
                      <ClipboardList className="size-5 mb-1" />
                      {f.kind}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    task_type: "photos",
    property_address: "",
    city: "",
    state: "",
    zip_code: "",
    payout_amount: "",
    due_date: "",
    description: "",
  });

  async function submit() {
    if (!form.title || !form.property_address || !form.city || !form.state) {
      toast.error("Title, address, city and state are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      task_type: form.task_type,
      property_address: form.property_address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code || null,
      payout_amount: form.payout_amount ? Number(form.payout_amount) : null,
      due_date: form.due_date || null,
      description: form.description || null,
      status: "open",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task created");
    setOpen(false);
    setForm({
      title: "",
      task_type: "photos",
      property_address: "",
      city: "",
      state: "",
      zip_code: "",
      payout_amount: "",
      due_date: "",
      description: "",
    });
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-glow">
          <Plus className="size-4 mr-1.5" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Drive-by photos at 123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={form.task_type}
                onValueChange={(v) => setForm({ ...form, task_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photos">Drive-by photos</SelectItem>
                  <SelectItem value="inspection">Property inspection</SelectItem>
                  <SelectItem value="occupancy">Occupancy check</SelectItem>
                  <SelectItem value="sign_install">Sign install</SelectItem>
                  <SelectItem value="lockbox">Lockbox install</SelectItem>
                  <SelectItem value="documents">Document delivery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payout ($)</Label>
              <Input
                type="number"
                value={form.payout_amount}
                onChange={(e) => setForm({ ...form, payout_amount: e.target.value })}
                placeholder="50"
              />
            </div>
          </div>
          <div>
            <Label>Property address</Label>
            <Input
              value={form.property_address}
              onChange={(e) => setForm({ ...form, property_address: e.target.value })}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                maxLength={2}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Zip</Label>
              <Input
                value={form.zip_code}
                onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="What does the runner need to do?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-gradient-primary">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function PayoutsTab() {
  const fetchPayouts = useServerFn(listPayouts);
  const markPaid = useServerFn(markPayoutPaid);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => fetchPayouts({}),
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [method, setMethod] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<Record<string, string>>({});

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;
  const payments = (data?.payments ?? []) as any[];
  if (payments.length === 0) {
    return <EmptyState message="No payments yet. Funded tasks will appear here." />;
  }

  const queue = payments.filter((p) => p.status === "funded");
  const history = payments.filter((p) => p.status !== "funded");

  async function handlePay(p: any) {
    const m = method[p.id] || "manual";
    setBusyId(p.id);
    try {
      await markPaid({ data: { paymentId: p.id, method: m, reference: reference[p.id] } });
      toast.success("Payout recorded");
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to mark paid");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Pending Payouts ({queue.length})</h2>
        {queue.length === 0 ? (
          <EmptyState message="No pending payouts. All caught up." />
        ) : (
          <div className="space-y-3">
            {queue.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-semibold">{p.task?.title ?? "Task"}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.task?.city}, {p.task?.state} · Funded{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm mt-1">
                      Runner:{" "}
                      <span className="font-medium">
                        {p.runner?.full_name ?? "Unassigned"}
                      </span>
                      {p.runner?.phone && (
                        <span className="text-muted-foreground"> · {p.runner.phone}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Investor: {p.investor?.full_name ?? "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${(p.runner_payout_cents / 100).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fee ${(p.platform_fee_cents / 100).toFixed(2)} · Total $
                      {(p.amount_cents / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-[160px_1fr_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs">Method</Label>
                    <Select
                      value={method[p.id] ?? "manual"}
                      onValueChange={(v) => setMethod((s) => ({ ...s, [p.id]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="venmo">Venmo</SelectItem>
                        <SelectItem value="cashapp">Cash App</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="ach">ACH / Bank</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Reference / Note</Label>
                    <Input
                      placeholder="Confirmation #, memo, etc."
                      value={reference[p.id] ?? ""}
                      onChange={(e) =>
                        setReference((s) => ({ ...s, [p.id]: e.target.value }))
                      }
                    />
                  </div>
                  <Button onClick={() => handlePay(p)} disabled={busyId === p.id}>
                    {busyId === p.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Mark paid"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">History ({history.length})</h2>
        {history.length === 0 ? (
          <EmptyState message="No completed payouts yet." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Runner</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Paid</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{p.task?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.runner?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      ${(p.runner_payout_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-300"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.payout_method ?? "—"}
                      {p.payout_reference ? ` · ${p.payout_reference}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="investors">
          {loading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : investors.length === 0 ? (
            <EmptyState message="No investor signups yet." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Market</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Needs</th>
                    <th className="px-4 py-3">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((i) => (
                    <tr key={i.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{i.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{i.email}</div>
                        <div className="text-xs">{i.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {i.market_city}, {i.market_state}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i.role}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {(i.services_needed ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(i.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutsTab />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
        <Icon className="size-4" /> {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TaskRow({
  task,
  runners,
  onChanged,
}: {
  task: Task;
  runners: FieldRunner[];
  onChanged: () => void;
}) {
  const [assigning, setAssigning] = useState(false);
  const assignedRunner = runners.find((r) => r.user_id === task.runner_id);

  async function assign(runnerUserId: string) {
    setAssigning(true);
    const { error } = await supabase
      .from("tasks")
      .update({
        runner_id: runnerUserId,
        status: task.status === "open" ? "assigned" : task.status,
      })
      .eq("id", task.id);
    setAssigning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Runner assigned");
    onChanged();
  }

  async function setStatus(status: string) {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task updated");
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{task.title}</h3>
            <Badge variant="outline" className={statusColor(task.status)}>
              {task.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {task.task_type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {task.property_address}, {task.city}, {task.state}
          </p>
        </div>
        <div className="text-right text-sm">
          {task.payout_amount != null && (
            <div className="font-semibold text-primary">
              ${Number(task.payout_amount).toFixed(2)}
            </div>
          )}
          {task.due_date && (
            <div className="text-xs text-muted-foreground">
              Due {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Runner:</span>
          <Select
            value={task.runner_id ?? ""}
            onValueChange={(v) => assign(v)}
            disabled={assigning}
          >
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue placeholder="Assign runner…">
                {assignedRunner ? assignedRunner.full_name : "Assign runner…"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {runners.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No runners have signed up yet
                </div>
              )}
              {runners.map((r) => (
                <SelectItem key={r.user_id} value={r.user_id}>
                  {r.full_name} — {r.city}, {r.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Select value={task.status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="revision_requested">Revision requested</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <AdminTaskDetailDialog task={task} />
        </div>
      </div>
    </div>
  );
}

function AdminTaskDetailDialog({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const fetchDetail = useServerFn(getTaskDetail);
  const signFn = useServerFn(getSignedDownloadUrl);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-task-detail", task.id, open],
    queryFn: () => fetchDetail({ data: { taskId: task.id } }),
    enabled: open,
  });

  async function openFile(bucket: string, path: string) {
    try {
      const { url } = await signFn({ data: { bucket: bucket as "task-photos", path } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open file");
    }
  }

  const submissions = data?.submissions ?? [];
  const files = data?.files ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <div className="space-y-5 text-sm">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="font-medium">{task.property_address}</div>
              <div className="text-muted-foreground">{task.city}, {task.state}</div>
              {task.payout_amount != null && (
                <div className="mt-2 text-primary font-semibold">
                  Payout: ${Number(task.payout_amount).toFixed(2)}
                </div>
              )}
            </div>

            <div>
              <Label>Submissions ({submissions.length})</Label>
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No submissions yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {submissions.map((s: any) => (
                    <div key={s.id} className="rounded-lg border border-border bg-card/40 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className={statusColor(s.status)}>
                          {s.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString()}
                        </span>
                      </div>
                      {s.notes && <p className="text-muted-foreground whitespace-pre-wrap">{s.notes}</p>}
                      {s.rejection_reason && (
                        <p className="text-xs text-red-300 mt-1">Rejected: {s.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Files ({files.length})</Label>
              {files.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No files uploaded.</p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {files.map((f: any) => (
                    <button
                      key={f.id}
                      onClick={() => openFile(f.bucket, f.path)}
                      className="aspect-square rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition grid place-items-center text-xs text-muted-foreground p-2 text-center"
                    >
                      <ClipboardList className="size-5 mb-1" />
                      {f.kind}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    task_type: "photos",
    property_address: "",
    city: "",
    state: "",
    zip_code: "",
    payout_amount: "",
    due_date: "",
    description: "",
  });

  async function submit() {
    if (!form.title || !form.property_address || !form.city || !form.state) {
      toast.error("Title, address, city and state are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      task_type: form.task_type,
      property_address: form.property_address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code || null,
      payout_amount: form.payout_amount ? Number(form.payout_amount) : null,
      due_date: form.due_date || null,
      description: form.description || null,
      status: "open",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task created");
    setOpen(false);
    setForm({
      title: "",
      task_type: "photos",
      property_address: "",
      city: "",
      state: "",
      zip_code: "",
      payout_amount: "",
      due_date: "",
      description: "",
    });
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-glow">
          <Plus className="size-4 mr-1.5" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Drive-by photos at 123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={form.task_type}
                onValueChange={(v) => setForm({ ...form, task_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photos">Drive-by photos</SelectItem>
                  <SelectItem value="inspection">Property inspection</SelectItem>
                  <SelectItem value="occupancy">Occupancy check</SelectItem>
                  <SelectItem value="sign_install">Sign install</SelectItem>
                  <SelectItem value="lockbox">Lockbox install</SelectItem>
                  <SelectItem value="documents">Document delivery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payout ($)</Label>
              <Input
                type="number"
                value={form.payout_amount}
                onChange={(e) => setForm({ ...form, payout_amount: e.target.value })}
                placeholder="50"
              />
            </div>
          </div>
          <div>
            <Label>Property address</Label>
            <Input
              value={form.property_address}
              onChange={(e) => setForm({ ...form, property_address: e.target.value })}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                maxLength={2}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Zip</Label>
              <Input
                value={form.zip_code}
                onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="What does the runner need to do?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-gradient-primary">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function PayoutsTab() {
  const fetchPayouts = useServerFn(listPayouts);
  const markPaid = useServerFn(markPayoutPaid);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => fetchPayouts({}),
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [method, setMethod] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<Record<string, string>>({});

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;
  const payments = (data?.payments ?? []) as any[];
  if (payments.length === 0) {
    return <EmptyState message="No payments yet. Funded tasks will appear here." />;
  }

  const queue = payments.filter((p) => p.status === "funded");
  const history = payments.filter((p) => p.status !== "funded");

  async function handlePay(p: any) {
    const m = method[p.id] || "manual";
    setBusyId(p.id);
    try {
      await markPaid({ data: { paymentId: p.id, method: m, reference: reference[p.id] } });
      toast.success("Payout recorded");
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to mark paid");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Pending Payouts ({queue.length})</h2>
        {queue.length === 0 ? (
          <EmptyState message="No pending payouts. All caught up." />
        ) : (
          <div className="space-y-3">
            {queue.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-semibold">{p.task?.title ?? "Task"}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.task?.city}, {p.task?.state} · Funded{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm mt-1">
                      Runner:{" "}
                      <span className="font-medium">
                        {p.runner?.full_name ?? "Unassigned"}
                      </span>
                      {p.runner?.phone && (
                        <span className="text-muted-foreground"> · {p.runner.phone}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Investor: {p.investor?.full_name ?? "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${(p.runner_payout_cents / 100).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fee ${(p.platform_fee_cents / 100).toFixed(2)} · Total $
                      {(p.amount_cents / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-[160px_1fr_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs">Method</Label>
                    <Select
                      value={method[p.id] ?? "manual"}
                      onValueChange={(v) => setMethod((s) => ({ ...s, [p.id]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="venmo">Venmo</SelectItem>
                        <SelectItem value="cashapp">Cash App</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="ach">ACH / Bank</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Reference / Note</Label>
                    <Input
                      placeholder="Confirmation #, memo, etc."
                      value={reference[p.id] ?? ""}
                      onChange={(e) =>
                        setReference((s) => ({ ...s, [p.id]: e.target.value }))
                      }
                    />
                  </div>
                  <Button onClick={() => handlePay(p)} disabled={busyId === p.id}>
                    {busyId === p.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Mark paid"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">History ({history.length})</h2>
        {history.length === 0 ? (
          <EmptyState message="No completed payouts yet." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Runner</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Paid</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{p.task?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.runner?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      ${(p.runner_payout_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-300"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.payout_method ?? "—"}
                      {p.payout_reference ? ` · ${p.payout_reference}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
