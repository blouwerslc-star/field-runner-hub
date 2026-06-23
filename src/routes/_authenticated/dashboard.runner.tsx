import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Upload, FileImage, MapPin, Calendar, DollarSign, Repeat } from "lucide-react";
import { toast } from "sonner";
import { listMyTasks, getTaskDetail, startTask, submitTaskWork } from "@/lib/tasks.functions";
import { createUploadUrl, recordTaskFile } from "@/lib/storage.functions";
import { RunnerVerificationCard } from "@/components/dashboard/RunnerVerificationCard";
import { ProfileCompletionBanner } from "@/components/dashboard/ProfileCompletionBanner";
import { DashboardLoadingSkeleton, RouteErrorState } from "@/components/dashboard/UiStates";
import { TaskMessageThread } from "@/components/dashboard/investor/TaskMessageThread";
import { TaskTimeline } from "@/components/tasks/TaskTimeline";
import { recordTaskTrackingEvent } from "@/lib/task-timeline.functions";
import { Navigation } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/runner")({
  component: RunnerDashboard,
  head: () => ({ meta: [{ title: "Runner Dashboard — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <DashboardShell title="Runner Dashboard">
      <RouteErrorState error={error} reset={reset} title="Couldn't load your tasks" />
    </DashboardShell>
  ),
});

function statusColor(status: string) {
  switch (status) {
    case "assigned": return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    case "in_progress": return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    case "submitted": return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "approved": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "revision_requested": return "bg-red-500/15 text-red-300 border-red-500/30";
    case "paid": return "bg-emerald-600/20 text-emerald-200 border-emerald-500/40";
    default: return "bg-muted text-muted-foreground";
  }
}

function RunnerDashboard() {
  const fetchTasks = useServerFn(listMyTasks);
  const { data, isLoading } = useQuery({ queryKey: ["my-tasks"], queryFn: () => fetchTasks() });
  const tasks = data?.tasks ?? [];

  const buckets = {
    assigned: tasks.filter((t) => t.status === "assigned" || t.status === "revision_requested"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    submitted: tasks.filter((t) => t.status === "submitted"),
    completed: tasks.filter((t) => t.status === "approved" || t.status === "paid"),
  };

  return (
    <DashboardShell title="Runner Dashboard" subtitle="Your assigned tasks. Complete the work, upload deliverables, and get paid.">
      <ProfileCompletionBanner role="runner" />
      <RunnerVerificationCard />
      <ReferralBanner />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatTile label="Assigned" value={buckets.assigned.length} />
        <StatTile label="In progress" value={buckets.in_progress.length} />
        <StatTile label="Submitted" value={buckets.submitted.length} />
        <StatTile label="Completed" value={buckets.completed.length} />
      </div>

      {isLoading ? (
        <DashboardLoadingSkeleton tiles={0} rows={4} />
      ) : tasks.length === 0 ? (
        <EmptyState message="No tasks assigned yet. An admin will assign tasks from your market here." />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-6 w-full overflow-x-auto justify-start">
            <TabsTrigger value="active">Active ({buckets.assigned.length + buckets.in_progress.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({buckets.submitted.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({buckets.completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3">
            {[...buckets.assigned, ...buckets.in_progress].map((t) => (
              <RunnerTaskCard key={t.id} task={t} />
            ))}
            {buckets.assigned.length + buckets.in_progress.length === 0 && (
              <EmptyState message="No active tasks." />
            )}
          </TabsContent>
          <TabsContent value="submitted" className="space-y-3">
            {buckets.submitted.map((t) => <RunnerTaskCard key={t.id} task={t} />)}
            {buckets.submitted.length === 0 && <EmptyState message="Nothing waiting on review." />}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3">
            {buckets.completed.map((t) => <RunnerTaskCard key={t.id} task={t} />)}
            {buckets.completed.length === 0 && <EmptyState message="No completed tasks yet." />}
          </TabsContent>
        </Tabs>
      )}
    </DashboardShell>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
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
  recurrence_rule?: string | null;
  recurrence_active?: boolean | null;
};

function RunnerTaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
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
            {task.recurrence_rule && (
              <Badge
                variant="outline"
                className={`text-xs flex items-center gap-1 ${
                  task.recurrence_active
                    ? "border-primary/40 text-primary"
                    : "border-muted-foreground/40 text-muted-foreground"
                }`}
                title={
                  task.recurrence_active
                    ? `Repeats ${task.recurrence_rule} — investor may auto-post the next one to you`
                    : `Recurring ${task.recurrence_rule} schedule is paused`
                }
              >
                <Repeat className="size-3" />
                {task.recurrence_rule}{!task.recurrence_active ? " · paused" : ""}
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Open</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{task.title}</DialogTitle>
            </DialogHeader>
            <TaskWorkPanel task={task} onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function TaskWorkPanel({ task, onDone }: { task: Task; onDone: () => void }) {
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getTaskDetail);
  const startFn = useServerFn(startTask);
  const submitFn = useServerFn(submitTaskWork);
  const uploadUrlFn = useServerFn(createUploadUrl);
  const recordFn = useServerFn(recordTaskFile);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["task-detail", task.id],
    queryFn: () => fetchDetail({ data: { taskId: task.id } }),
  });

  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const start = useMutation({
    mutationFn: () => startFn({ data: { taskId: task.id } }),
    onSuccess: () => {
      toast.success("Marked as in progress");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const trackFn = useServerFn(recordTaskTrackingEvent);
  const track = useMutation({
    mutationFn: (event: "en_route" | "on_site") =>
      new Promise<void>((resolve, reject) => {
        const send = (lat?: number, lng?: number) =>
          trackFn({
            data: { taskId: task.id, eventCode: event, latitude: lat, longitude: lng },
          })
            .then(() => resolve())
            .catch(reject);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => send(pos.coords.latitude, pos.coords.longitude),
            () => send(),
            { timeout: 6000, maximumAge: 60_000 },
          );
        } else {
          send();
        }
      }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["task-timeline", task.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: () => submitFn({ data: { taskId: task.id, notes } }),
    onSuccess: () => {
      toast.success("Submitted for review");
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const isVideo = file.type.startsWith("video/");
        const bucket = "task-photos";
        const { signedUrl, path } = await uploadUrlFn({
          data: { bucket, taskId: task.id, filename: safeName },
        });
        const put = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!put.ok) throw new Error(`Upload failed for ${file.name}`);
        await recordFn({
          data: {
            taskId: task.id,
            bucket,
            path,
            mimeType: file.type,
            sizeBytes: file.size,
            kind: isVideo ? "video" : "photo",
          },
        });
      }
      toast.success(`Uploaded ${files.length} file(s)`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;
  const files = data?.files ?? [];
  const submissions = data?.submissions ?? [];
  const lastSub = submissions[0];

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

      {task.status === "assigned" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => track.mutate("en_route")}
            disabled={track.isPending}
          >
            <Navigation className="size-4 mr-2" /> On the way
          </Button>
          <Button
            variant="outline"
            onClick={() => track.mutate("on_site")}
            disabled={track.isPending}
          >
            <MapPin className="size-4 mr-2" /> Arrived on site
          </Button>
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Start task
          </Button>
        </div>
      )}

      {task.status === "in_progress" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => track.mutate("on_site")}
          disabled={track.isPending}
        >
          <MapPin className="size-4 mr-2" /> Update: arrived on site
        </Button>
      )}

      <TaskTimeline taskId={task.id} />

      {(lastSub?.status === "rejected" || task.status === "revision_requested") && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          <div className="font-semibold text-red-300">Changes requested</div>
          <div className="text-muted-foreground mt-1">{lastSub?.rejection_reason || "Please revise and resubmit."}</div>
        </div>
      )}

      <TaskMessageThread taskId={task.id} hasRunner={true} />

      <div>
        <Label>Photos / video</Label>
        <div className="mt-2 rounded-xl border border-dashed border-border p-4 text-center">
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={onFiles}
            disabled={uploading}
          />
          <label htmlFor="file-input">
            <Button asChild variant="outline" disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
                Upload files
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2">JPG, PNG, MP4. Up to 2 GB each.</p>
        </div>
        {files.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {files.map((f) => (
              <div key={f.id} className="aspect-square rounded-lg bg-muted/30 border border-border grid place-items-center text-xs text-muted-foreground p-2 text-center">
                <FileImage className="size-5 mb-1" />
                {f.kind}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes for investor (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything they should know about the property…" />
      </div>

      <DialogFooter>
        <Button
          onClick={() => submit.mutate()}
          disabled={submit.isPending || files.length === 0 || task.status === "approved" || task.status === "paid" || task.status === "submitted"}
          className="bg-gradient-primary shadow-glow"
        >
          {submit.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
          Submit for review
        </Button>
      </DialogFooter>
    </div>
  );
}
