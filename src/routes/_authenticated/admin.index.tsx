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
import { Loader2, Users, ClipboardList, UserCog, Plus, ShieldCheck, Send, BarChart3, Activity, BadgeCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listPayouts, markPayoutPaid } from "@/lib/payments.functions";
import { getTaskDetail } from "@/lib/tasks.functions";
import { getSignedDownloadUrl } from "@/lib/storage.functions";
import { listAdminRunners, type AdminRunner } from "@/lib/admin.functions";
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

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [runners, setRunners] = useState<FieldRunner[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const fetchRunners = useServerFn(listAdminRunners);
  const signFn = useServerFn(getSignedDownloadUrl);

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
  }, []);

  const runnersWithAccount = useMemo(
    () => runners.filter((r) => r.user_id),
    [runners],
  );

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Manage signups, post tasks on behalf of investors, and assign runners."
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/marketplace-health"><Activity className="size-4 mr-2" /> Health</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/runner-approvals"><ShieldCheck className="size-4 mr-2" /> Approvals</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/verifications"><BadgeCheck className="size-4 mr-2" /> Verifications</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/dispatch"><Send className="size-4 mr-2" /> Dispatch</Link></Button>
        <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/analytics"><BarChart3 className="size-4 mr-2" /> Analytics</Link></Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatTile icon={Users} label="Runners" value={runners.length} />
        <StatTile icon={UserCog} label="Investors" value={investors.length} />
        <StatTile icon={ClipboardList} label="Tasks" value={tasks.length} />
        <StatTile
          icon={ClipboardList}
          label="Open"
          value={tasks.filter((t) => t.status === "open").length}
        />
      </div>

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
