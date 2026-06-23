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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, MapPin, Calendar, DollarSign, CheckCircle2, XCircle, FileImage, ShieldCheck, Heart, Maximize2, Copy, Repeat, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { listMyTasks, getTaskDetail, reviewSubmission, duplicateTask, toggleTaskRecurrence } from "@/lib/tasks.functions";
import { getSignedDownloadUrl } from "@/lib/storage.functions";
import { TaskFundingCheckout } from "@/components/payments/TaskFundingCheckout";
import { TaskTipCheckout } from "@/components/payments/TaskTipCheckout";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { DashboardLoadingSkeleton, RouteErrorState } from "@/components/dashboard/UiStates";
import { StatusTimeline } from "@/components/dashboard/investor/StatusTimeline";
import { SLABadge } from "@/components/dashboard/investor/SLABadge";
import { SpendAnalyticsCard } from "@/components/dashboard/investor/SpendAnalyticsCard";
import { RunnerDiscoveryStrip } from "@/components/dashboard/investor/RunnerDiscoveryStrip";
import { PostTaskWizard } from "@/components/dashboard/investor/PostTaskWizard";
import { SavedRunnersStrip } from "@/components/dashboard/investor/SavedRunnersStrip";
import { DeliverableReviewWorkspace, buildReshootReason, type FeedbackState } from "@/components/dashboard/investor/DeliverableReviewWorkspace";
import { TaskMessageThread } from "@/components/dashboard/investor/TaskMessageThread";
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
            <PostTaskWizard />
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

      <div className="mb-6">
        <SavedRunnersStrip />
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
  const qc = useQueryClient();
  const dupFn = useServerFn(duplicateTask);
  const dup = useMutation({
    mutationFn: () => dupFn({ data: { taskId: task.id } }),
    onSuccess: () => {
      toast.success("Duplicated. Find it under Active.");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleRecFn = useServerFn(toggleTaskRecurrence);
  const recRule = (task as unknown as { recurrence_rule?: string | null }).recurrence_rule ?? null;
  const recActive = (task as unknown as { recurrence_active?: boolean | null }).recurrence_active ?? false;
  const toggleRec = useMutation({
    mutationFn: () => toggleRecFn({ data: { taskId: task.id, active: !recActive } }),
    onSuccess: () => {
      toast.success(recActive ? "Recurring schedule paused" : "Recurring schedule resumed");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
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
            {recRule && (
              <Badge variant="outline" className={`text-xs flex items-center gap-1 ${recActive ? "border-primary/40 text-primary" : "border-muted-foreground/40 text-muted-foreground"}`}>
                <Repeat className="size-3" /> {recRule}{!recActive ? " · paused" : ""}
              </Badge>
            )}
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
          <Button size="sm" variant="ghost" onClick={() => dup.mutate()} disabled={dup.isPending} title="Duplicate this task">
            {dup.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">Duplicate</span>
          </Button>
          {recRule && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleRec.mutate()}
              disabled={toggleRec.isPending}
              title={recActive ? "Pause recurring schedule" : "Resume recurring schedule"}
            >
              {toggleRec.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : recActive ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              <span className="hidden sm:inline">{recActive ? "Pause" : "Resume"}</span>
            </Button>
          )}
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
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceStart, setWorkspaceStart] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>({});

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

      <TaskMessageThread taskId={task.id} hasRunner={!!task.runner_id} />

      <div>
        <Label>Deliverables ({files.length})</Label>
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-2">No files yet.</p>
        ) : (
          <>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Click a thumbnail or open the review workspace for full-size review with per-file feedback.</p>
              <Button size="sm" variant="outline" onClick={() => { setWorkspaceStart(0); setWorkspaceOpen(true); }}>
                <Maximize2 className="size-3.5 mr-1" /> Open review workspace
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => { setWorkspaceStart(i); setWorkspaceOpen(true); }}
                  onDoubleClick={() => openFile(f.bucket, f.path)}
                  className="aspect-square rounded-lg bg-muted/30 border border-border grid place-items-center text-xs text-muted-foreground p-2 text-center hover:border-primary/50 transition"
                >
                  <FileImage className="size-5 mb-1" />
                  {f.kind}
                </button>
              ))}
            </div>
            <DeliverableReviewWorkspace
              files={files as never}
              feedback={feedback}
              onChangeFeedback={(next) => {
                setFeedback(next);
                const summary = buildReshootReason(files as never, next);
                if (summary) setRejectReason(summary);
              }}
              open={workspaceOpen}
              onClose={() => setWorkspaceOpen(false)}
              startIndex={workspaceStart}
            />
          </>
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

