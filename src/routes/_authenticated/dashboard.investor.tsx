import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProfileCompletionBanner } from "@/components/dashboard/ProfileCompletionBanner";
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
import { Loader2, Plus, MapPin, Calendar, DollarSign, CheckCircle2, XCircle, FileImage, ShieldCheck, Heart } from "lucide-react";
import { toast } from "sonner";
import { listMyTasks, getTaskDetail, createInvestorTask, reviewSubmission, defaultRequiresInteriorAccess } from "@/lib/tasks.functions";
import { Checkbox } from "@/components/ui/checkbox";
import { getSignedDownloadUrl } from "@/lib/storage.functions";
import { TaskFundingCheckout } from "@/components/payments/TaskFundingCheckout";
import { TaskTipCheckout } from "@/components/payments/TaskTipCheckout";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { DashboardLoadingSkeleton, RouteErrorState } from "@/components/dashboard/UiStates";
import { StatusTimeline } from "@/components/dashboard/investor/StatusTimeline";
import { SLABadge } from "@/components/dashboard/investor/SLABadge";
import { SpendAnalyticsCard } from "@/components/dashboard/investor/SpendAnalyticsCard";
import { RunnerDiscoveryStrip } from "@/components/dashboard/investor/RunnerDiscoveryStrip";
import { getMyProfile } from "@/lib/profiles.functions";
import { Users } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/investor")({
  component: InvestorDashboard,
  head: () => ({ meta: [{ title: "Investor Dashboard — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <DashboardShell title="Investor Dashboard">
      <RouteErrorState error={error} reset={reset} title="Couldn't load your tasks" />
    </DashboardShell>
  ),
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
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profileData } = useQuery({
    queryKey: ["my-profile-investor-dashboard"],
    queryFn: () => fetchProfile(),
    staleTime: 5 * 60_000,
  });
  const myState = (profileData?.profile as { state?: string | null } | null)?.state ?? null;
  const myCity = (profileData?.profile as { city?: string | null } | null)?.city ?? null;

  const buckets = {
    open: tasks.filter((t) => t.status === "open" || t.status === "assigned"),
    in_progress: tasks.filter((t) => t.status === "in_progress" || t.status === "revision_requested"),
    submitted: tasks.filter((t) => t.status === "submitted"),
    completed: tasks.filter((t) => t.status === "approved" || t.status === "paid"),
  };

  return (
    <DashboardShell title="Investor Dashboard" subtitle="Post tasks, review submissions, release payments.">
      <div className="-mx-6 mb-6"><PaymentTestModeBanner /></div>
      <ProfileCompletionBanner role="investor" />

      {/* Hero action row */}
      <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-card/30 backdrop-blur p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold">Need eyes on a property?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Post a task and get matched with a vetted local runner. Funds stay in escrow until you approve the work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <CreateTaskDialog />
            <Button asChild variant="outline" size="sm">
              <Link to="/profiles">
                <Users className="size-4 mr-1.5" />
                Browse runners
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatTile label="Active" value={(buckets.open.length + buckets.in_progress.length).toString()} accent={buckets.in_progress.length > 0 ? "primary" : undefined} />
        <StatTile label="To review" value={buckets.submitted.length.toString()} accent={buckets.submitted.length > 0 ? "amber" : undefined} />
        <StatTile label="Completed" value={buckets.completed.length.toString()} />
      </div>

      {/* Spend + Runner discovery */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <SpendAnalyticsCard tasks={tasks as never} />
        <RunnerDiscoveryStrip state={myState} city={myCity} />
      </div>

      {isLoading ? (
        <DashboardLoadingSkeleton tiles={0} rows={4} />
      ) : tasks.length === 0 ? (
        <EmptyState message="No tasks yet. Post your first task above to start getting bids from local runners." />
      ) : (
        <Tabs defaultValue={buckets.submitted.length > 0 ? "review" : "active"}>
          <TabsList className="mb-6 w-full overflow-x-auto justify-start">
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

function StatTile({ label, value, accent }: { label: string; value: string; accent?: "primary" | "amber" }) {
  const ring =
    accent === "primary" ? "ring-1 ring-primary/40" :
    accent === "amber" ? "ring-1 ring-amber-500/40" : "";
  const text =
    accent === "primary" ? "text-primary" :
    accent === "amber" ? "text-amber-300" : "";
  return (
    <div className={`rounded-2xl border border-border bg-card/60 backdrop-blur p-4 ${ring}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
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
  requires_interior_access?: boolean;
};

function InvestorTaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const needsFunding = !task.funded && task.payout_amount != null && Number(task.payout_amount) > 0;
  const canTip = task.status === "approved" || task.status === "paid";
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{task.title}</h3>
            <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
            {task.requires_interior_access && (
              <Badge variant="outline" className="text-xs border-primary/40 text-primary flex items-center gap-1">
                <ShieldCheck className="size-3" /> Background check req.
              </Badge>
            )}
            {task.funded ? (
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-300">Funded</Badge>
            ) : needsFunding ? (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">Unfunded</Badge>
            ) : null}
            <SLABadge dueDate={task.due_date} status={task.status} />
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
                  Fund ${Number(task.payout_amount).toFixed(2)} in escrow. Your runner receives 80% on approval; REI Runner retains a 20% platform fee. Funds are released only after you approve the work.
                </p>
                <TaskFundingCheckout
                  taskId={task.id}
                  returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                />
              </DialogContent>
            </Dialog>
          )}
          {canTip && (
            <Dialog open={tipOpen} onOpenChange={setTipOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Heart className="size-4 mr-1" /> Leave a tip
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tip your runner</DialogTitle>
                </DialogHeader>
                <TipDialogBody taskId={task.id} />
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
      <div className="mt-4 pt-3 border-t border-border/60">
        <StatusTimeline status={task.status} />
      </div>
    </div>
  );
}

function InvestorTaskPanel({ task, onDone }: { task: Task; onDone: () => void }) {
  return <InvestorTaskPanelInner task={task} onDone={onDone} />;
}

const TIP_PRESETS = [5, 10, 20, 50];

function TipDialogBody({ taskId }: { taskId: string }) {
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState<string>("");
  const cents = Math.round((amount || 0) * 100);
  const valid = cents >= 100 && cents <= 100000;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        100% of your tip goes to your runner. No platform fee on tips.
      </p>
      <div className="flex flex-wrap gap-2">
        {TIP_PRESETS.map((v) => (
          <Button
            key={v}
            type="button"
            size="sm"
            variant={amount === v && !custom ? "default" : "outline"}
            onClick={() => { setAmount(v); setCustom(""); }}
          >
            ${v}
          </Button>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Custom $</span>
          <Input
            type="number"
            min={1}
            max={1000}
            step="1"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) setAmount(n);
            }}
            className="w-24"
            placeholder="0"
          />
        </div>
      </div>
      {!valid ? (
        <p className="text-xs text-muted-foreground">Enter a tip between $1 and $1,000 to continue.</p>
      ) : (
        <TaskTipCheckout
          taskId={taskId}
          amountCents={cents}
          returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&mode=tip`}
        />
      )}
    </div>
  );
}

function InvestorTaskPanelInner({ task, onDone }: { task: Task; onDone: () => void }) {
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
  const [interiorTouched, setInteriorTouched] = useState(false);
  const [requiresInterior, setRequiresInterior] = useState(false);
  // Auto-default the interior-access checkbox from the selected task type,
  // unless the investor has explicitly toggled it.
  const autoInterior = defaultRequiresInteriorAccess(form.task_type);
  const effectiveRequiresInterior = interiorTouched ? requiresInterior : autoInterior;

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
        requires_interior_access: effectiveRequiresInterior,
      },
    }),
    onSuccess: () => {
      toast.success("Task posted. An admin will assign a runner.");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      setOpen(false);
      setForm({ title: "", task_type: "photos", property_address: "", city: "", state: "", zip_code: "", payout_amount: "", due_date: "", description: "" });
      setInteriorTouched(false);
      setRequiresInterior(false);
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
          <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-start gap-3">
            <Checkbox
              id="requires-interior"
              checked={effectiveRequiresInterior}
              onCheckedChange={(v) => {
                setInteriorTouched(true);
                setRequiresInterior(v === true);
              }}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="requires-interior" className="flex items-center gap-1.5 cursor-pointer">
                <ShieldCheck className="size-3.5 text-primary" />
                Runner will enter inside the property
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {autoInterior && !interiorTouched
                  ? "Auto-enabled for this task type. Only runners with a verified background check will be able to apply."
                  : "Check if this involves lockbox entry, interior walkthrough, or any access inside. Only background-check-verified runners can apply."}
              </p>
            </div>
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
