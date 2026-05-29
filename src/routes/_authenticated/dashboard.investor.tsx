import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, MapPin, Calendar, DollarSign, CheckCircle2, XCircle, FileImage } from "lucide-react";
import { toast } from "sonner";
import { listMyTasks, getTaskDetail, createInvestorTask, reviewSubmission } from "@/lib/tasks.functions";
import { getSignedDownloadUrl } from "@/lib/storage.functions";
import { TaskFundingCheckout } from "@/components/payments/TaskFundingCheckout";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";

export const Route = createFileRoute("/_authenticated/dashboard/investor")({
  component: InvestorDashboard,
  head: () => ({ meta: [{ title: "Investor Dashboard — REI Runner" }] }),
});

function statusColor(status: string) {
  switch (status) {
    case "open": return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    case "assigned": return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    case "in_progress": return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    case "submitted": return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "approved": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "revision_requested": return "bg-red-500/15 text-red-300 border-red-500/30";
    case "paid": return "bg-emerald-600/20 text-emerald-200 border-emerald-500/40";
    default: return "bg-muted text-muted-foreground";
  }
}

function InvestorDashboard() {
  const fetchTasks = useServerFn(listMyTasks);
  const { data, isLoading } = useQuery({ queryKey: ["my-tasks"], queryFn: () => fetchTasks() });
  const tasks = data?.tasks ?? [];

  const buckets = {
    open: tasks.filter((t) => t.status === "open" || t.status === "assigned"),
    in_progress: tasks.filter((t) => t.status === "in_progress" || t.status === "revision_requested"),
    submitted: tasks.filter((t) => t.status === "submitted"),
    completed: tasks.filter((t) => t.status === "approved" || t.status === "paid"),
  };

  const totalSpent = tasks
    .filter((t) => t.status === "approved" || t.status === "paid")
    .reduce((s, t) => s + Number(t.payout_amount ?? 0), 0);

  return (
    <DashboardShell title="Investor Dashboard" subtitle="Post tasks, review submissions, release payments.">
      <div className="-mx-6 mb-6"><PaymentTestModeBanner /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile label="Open" value={buckets.open.length.toString()} />
        <StatTile label="In progress" value={buckets.in_progress.length.toString()} />
        <StatTile label="To review" value={buckets.submitted.length.toString()} />
        <StatTile label="Spent" value={`$${totalSpent.toFixed(0)}`} />
      </div>

      <div className="flex justify-end mb-4">
        <CreateTaskDialog />
      </div>

      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : tasks.length === 0 ? (
        <EmptyState message="No tasks yet. Post one to get started." />
      ) : (
        <Tabs defaultValue="review">
          <TabsList className="mb-6">
            <TabsTrigger value="review">To review ({buckets.submitted.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({buckets.open.length + buckets.in_progress.length})</TabsTrigger>
            <TabsTrigger value="done">Completed ({buckets.completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="review" className="space-y-3">
            {buckets.submitted.map((t) => <InvestorTaskCard key={t.id} task={t} />)}
            {buckets.submitted.length === 0 && <EmptyState message="Nothing to review right now." />}
          </TabsContent>
          <TabsContent value="active" className="space-y-3">
            {[...buckets.open, ...buckets.in_progress].map((t) => <InvestorTaskCard key={t.id} task={t} />)}
            {buckets.open.length + buckets.in_progress.length === 0 && <EmptyState message="No active tasks." />}
          </TabsContent>
          <TabsContent value="done" className="space-y-3">
            {buckets.completed.map((t) => <InvestorTaskCard key={t.id} task={t} />)}
            {buckets.completed.length === 0 && <EmptyState message="No completed tasks yet." />}
          </TabsContent>
        </Tabs>
      )}
    </DashboardShell>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
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

type Task = {
  id: string;
  title: string;
  status: string;
  task_type: string;
  property_address: string;
  city: string;
  state: string;
  payout_amount: number | null;
  due_date: string | null;
  description: string | null;
  funded?: boolean;
};

function InvestorTaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const needsFunding = !task.funded && task.payout_amount != null && Number(task.payout_amount) > 0;
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{task.title}</h3>
            <Badge variant="outline" className={statusColor(task.status)}>
              {task.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
            {task.funded ? (
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-300">Funded</Badge>
            ) : needsFunding ? (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Unfunded</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {task.property_address}, {task.city}, {task.state}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            {task.payout_amount != null && (
              <span className="flex items-center gap-1 text-primary font-semibold">
                <DollarSign className="size-3" /> ${Number(task.payout_amount).toFixed(2)}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> Due {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {needsFunding && (
            <Dialog open={fundOpen} onOpenChange={setFundOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-primary shadow-glow">
                  <DollarSign className="size-4 mr-1" /> Fund task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Fund “{task.title}”</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-2">
                  Escrow ${Number(task.payout_amount).toFixed(2)} payout + 20% platform fee. Funds are released to the runner only after you approve their work.
                </p>
                <TaskFundingCheckout
                  taskId={task.id}
                  returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                />
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant={task.status === "submitted" ? "default" : "outline"}>
              {task.status === "submitted" ? "Review" : "View"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{task.title}</DialogTitle></DialogHeader>
            <InvestorTaskPanel task={task} onDone={() => setOpen(false)} />
          </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function InvestorTaskPanel({ task, onDone }: { task: Task; onDone: () => void }) {
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getTaskDetail);
  const reviewFn = useServerFn(reviewSubmission);
  const signFn = useServerFn(getSignedDownloadUrl);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["task-detail", task.id],
    queryFn: () => fetchDetail({ data: { taskId: task.id } }),
  });

  const [rejectReason, setRejectReason] = useState("");

  const review = useMutation({
    mutationFn: (v: { submissionId: string; action: "approve" | "reject"; reason?: string }) =>
      reviewFn({ data: v }),
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approve" ? "Approved & payment released" : "Sent back for changes");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      refetch();
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openFile(bucket: string, path: string) {
    const { url } = await signFn({ data: { bucket: bucket as "task-photos", path } });
    window.open(url, "_blank");
  }

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;
  const files = data?.files ?? [];
  const submissions = data?.submissions ?? [];
  const pendingSub = submissions.find((s) => s.status === "pending");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
        <div className="font-medium">{task.property_address}</div>
        <div className="text-muted-foreground">{task.city}, {task.state}</div>
        {task.description && <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{task.description}</p>}
        {task.payout_amount != null && (
          <div className="mt-2 text-primary font-semibold">Payout: ${Number(task.payout_amount).toFixed(2)}</div>
        )}
      </div>

      {pendingSub?.notes && (
        <div className="rounded-xl border border-border bg-card/40 p-3 text-sm">
          <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Runner notes</div>
          {pendingSub.notes}
        </div>
      )}

      <div>
        <Label>Deliverables ({files.length})</Label>
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-2">No files yet.</p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {files.map((f) => (
              <button
                key={f.id}
                onClick={() => openFile(f.bucket, f.path)}
                className="aspect-square rounded-lg bg-muted/30 border border-border grid place-items-center text-xs text-muted-foreground p-2 text-center hover:border-primary/50 transition"
              >
                <FileImage className="size-5 mb-1" />
                {f.kind}
              </button>
            ))}
          </div>
        )}
      </div>

      {pendingSub && (
        <>
          <div>
            <Label htmlFor="reject-reason">Reason (only needed if requesting changes)</Label>
            <Textarea id="reject-reason" rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="What needs to change?" />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => review.mutate({ submissionId: pendingSub.id, action: "reject", reason: rejectReason })}
              disabled={review.isPending}
            >
              <XCircle className="size-4 mr-1.5" /> Request changes
            </Button>
            <Button
              onClick={() => review.mutate({ submissionId: pendingSub.id, action: "approve" })}
              disabled={review.isPending}
              className="bg-gradient-primary shadow-glow"
            >
              {review.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-1.5" />}
              Approve & release payment
            </Button>
          </DialogFooter>
        </>
      )}
    </div>
  );
}

function CreateTaskDialog() {
  const qc = useQueryClient();
  const createFn = useServerFn(createInvestorTask);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", task_type: "photos", property_address: "",
    city: "", state: "", zip_code: "", payout_amount: "",
    due_date: "", description: "",
  });

  const create = useMutation({
    mutationFn: () => createFn({
      data: {
        title: form.title,
        task_type: form.task_type,
        property_address: form.property_address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code || null,
        payout_amount: form.payout_amount ? Number(form.payout_amount) : null,
        due_date: form.due_date || null,
        description: form.description || null,
      },
    }),
    onSuccess: () => {
      toast.success("Task posted. An admin will assign a runner.");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      setOpen(false);
      setForm({ title: "", task_type: "photos", property_address: "", city: "", state: "", zip_code: "", payout_amount: "", due_date: "", description: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-glow">
          <Plus className="size-4 mr-1.5" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Post a new task</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Drive-by photos at 123 Main St" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="photos">Photos</SelectItem>
                <SelectItem value="video">Video walkthrough</SelectItem>
                <SelectItem value="occupancy">Occupancy check</SelectItem>
                <SelectItem value="drive_by">Drive-by</SelectItem>
                <SelectItem value="lockbox">Lockbox / sign</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><Label>ZIP</Label><Input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Payout ($)</Label><Input type="number" value={form.payout_amount} onChange={(e) => setForm({ ...form, payout_amount: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any specifics the runner should know…" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title || !form.property_address || !form.city || !form.state} className="bg-gradient-primary shadow-glow">
            {create.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Post task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
