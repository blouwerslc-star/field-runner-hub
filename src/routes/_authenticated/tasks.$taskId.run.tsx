import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTaskChecklist,
  updateChecklistStep,
  completeChecklistTask,
  type RunnerStep,
  type StepProgress,
} from "@/lib/checklist.functions";
import { createUploadUrl } from "@/lib/storage.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Camera,
  Video,
  CheckCircle2,
  MapPin,
  Upload,
  Loader2,
  PenLine,
  ListChecks,
  Circle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/$taskId/run")({
  component: GuidedRunPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-6 text-sm">
      <p className="text-destructive">{error.message}</p>
      <Button size="sm" variant="ghost" onClick={reset} className="mt-2">Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Task not found.</div>,
});

function GuidedRunPage() {
  const { taskId } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getTaskChecklist);
  const updateFn = useServerFn(updateChecklistStep);
  const completeFn = useServerFn(completeChecklistTask);

  const { data, isLoading } = useQuery({
    queryKey: ["task-checklist", taskId],
    queryFn: () => fetchFn({ data: { taskId } }),
    refetchInterval: 15_000,
  });

  const update = useMutation({
    mutationFn: (vars: {
      step_key: string;
      status: "done" | "pending" | "skipped";
      data?: Record<string, unknown>;
    }) =>
      updateFn({
        data: {
          taskId,
          step_key: vars.step_key,
          status: vars.status,
          data: vars.data ?? {},
          file_ids: [],
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-checklist", taskId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: () => completeFn({ data: { taskId } }),
    onSuccess: () => {
      toast.success("Task submitted for review");
      qc.invalidateQueries({ queryKey: ["task-checklist", taskId] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [activeIdx, setActiveIdx] = useState(0);

  const progressByKey = useMemo(() => {
    const m = new Map<string, StepProgress>();
    (data?.progress ?? []).forEach((p) => m.set(p.step_key, p));
    return m;
  }, [data]);

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  if (!data.steps || data.steps.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-3">
        <Button size="sm" variant="ghost" onClick={() => router.history.back()}>
          <ArrowLeft className="mr-1 size-4" /> Back
        </Button>
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          This task has no guided checklist yet. Capture your deliverables on the task page.
        </div>
        <Button asChild>
          <Link to="/tasks/$taskId" params={{ taskId }}>Open task page</Link>
        </Button>
      </div>
    );
  }

  if (data.viewerRole !== "runner") {
    // Read-only investor view
    return (
      <div className="mx-auto max-w-2xl p-4 space-y-3">
        <BackHeader title={data.task.title} taskId={taskId} />
        <p className="text-xs text-muted-foreground">Live runner checklist progress</p>
        <ol className="space-y-2">
          {data.steps.map((s, i) => {
            const p = progressByKey.get(s.key);
            return (
              <li key={s.key} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-sm">
                  {p?.status === "done" ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{i + 1}. {s.title}</span>
                  {p?.completed_at && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(p.completed_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {p?.data && Object.keys(p.data).length > 0 && (
                  <pre className="mt-2 text-[11px] whitespace-pre-wrap text-muted-foreground">
                    {JSON.stringify(p.data, null, 2)}
                  </pre>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const steps = data.steps;
  const doneCount = steps.filter((s) => progressByKey.get(s.key)?.status === "done").length;
  const requiredSteps = steps.filter((s) => s.required !== false);
  const allRequiredDone = requiredSteps.every((s) => progressByKey.get(s.key)?.status === "done");

  const activeStep = steps[activeIdx] ?? steps[0];
  const activeProgress = progressByKey.get(activeStep.key);

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <BackHeader title={data.task.title} taskId={taskId} />

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Step {activeIdx + 1} of {steps.length}</span>
          <span>{doneCount}/{steps.length} done</span>
        </div>
        <Progress value={(doneCount / steps.length) * 100} className="h-1.5" />
      </div>

      {data.introNotes && activeIdx === 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <ListChecks className="size-3.5" /> Before you start
          </div>
          {data.introNotes}
        </div>
      )}

      <StepCard
        step={activeStep}
        progress={activeProgress}
        taskId={taskId}
        insideGeofence={data.task.last_ping_within_geofence === true}
        templateInputs={data.task.template_inputs ?? {}}
        onMark={(status, payload) =>
          update.mutate({ step_key: activeStep.key, status, data: payload })
        }
        isSaving={update.isPending}
      />

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={activeIdx === 0}
          onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>
        {activeIdx < steps.length - 1 ? (
          <Button size="sm" onClick={() => setActiveIdx((i) => Math.min(steps.length - 1, i + 1))}>
            Next step
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!allRequiredDone || complete.isPending}
            onClick={() => complete.mutate()}
          >
            {complete.isPending ? <Loader2 className="size-4 animate-spin" /> : "Complete task"}
          </Button>
        )}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">All steps</div>
        <ol className="space-y-1.5">
          {steps.map((s, i) => {
            const p = progressByKey.get(s.key);
            const isActive = i === activeIdx;
            return (
              <li key={s.key}>
                <button
                  onClick={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition ${
                    isActive ? "border-primary bg-primary/10" : "border-border bg-card/40 hover:bg-card"
                  }`}
                >
                  {p?.status === "done" ? (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1 truncate">{i + 1}. {s.title}</span>
                  {s.required === false && <Badge variant="outline" className="text-[10px]">optional</Badge>}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function BackHeader({ title, taskId }: { title: string; taskId: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <Button size="icon" variant="ghost" onClick={() => router.history.back()}>
        <ArrowLeft className="size-4" />
      </Button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">
          <Link to="/tasks/$taskId/tracking" params={{ taskId }} className="underline">
            View tracking map
          </Link>
        </p>
      </div>
    </div>
  );
}

function StepCard({
  step,
  progress,
  taskId,
  insideGeofence,
  templateInputs,
  onMark,
  isSaving,
}: {
  step: RunnerStep;
  progress: StepProgress | undefined;
  taskId: string;
  insideGeofence: boolean;
  templateInputs: Record<string, unknown>;
  onMark: (status: "done" | "pending", data?: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const isDone = progress?.status === "done";
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className={`grid size-8 place-items-center rounded-full ${isDone ? "bg-emerald-500/20" : "bg-primary/20"}`}>
          {isDone ? <CheckCircle2 className="size-4 text-emerald-500" /> : <StepIcon type={step.type} />}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{step.title}</h2>
          {step.instructions && (
            <p className="text-sm text-muted-foreground mt-0.5">{step.instructions}</p>
          )}
        </div>
      </div>

      <StepBody
        step={step}
        progress={progress}
        taskId={taskId}
        insideGeofence={insideGeofence}
        templateInputs={templateInputs}
        onMark={onMark}
        isSaving={isSaving}
      />
    </div>
  );
}

function StepIcon({ type }: { type: RunnerStep["type"] }) {
  if (type === "photo") return <Camera className="size-4 text-primary" />;
  if (type === "video") return <Video className="size-4 text-primary" />;
  if (type === "upload") return <Upload className="size-4 text-primary" />;
  if (type === "signature") return <PenLine className="size-4 text-primary" />;
  if (type === "geofence_arrive") return <MapPin className="size-4 text-primary" />;
  return <ListChecks className="size-4 text-primary" />;
}

function StepBody({
  step,
  progress,
  taskId,
  insideGeofence,
  templateInputs,
  onMark,
  isSaving,
}: {
  step: RunnerStep;
  progress: StepProgress | undefined;
  taskId: string;
  insideGeofence: boolean;
  templateInputs: Record<string, unknown>;
  onMark: (status: "done" | "pending", data?: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const isDone = progress?.status === "done";

  if (step.type === "geofence_arrive") {
    return (
      <div className="space-y-2">
        <div className={`rounded-lg border p-3 text-sm ${insideGeofence ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
          {insideGeofence ? "You're inside the property geofence. " : "Drive to the property — you'll be auto-marked as soon as you're inside the geofence. "}
        </div>
        <Button
          className="w-full"
          disabled={(!insideGeofence && !isDone) || isSaving}
          onClick={() => onMark(isDone ? "pending" : "done", { arrived_at: new Date().toISOString() })}
        >
          {isDone ? "Mark not arrived" : "Confirm arrived"}
        </Button>
      </div>
    );
  }

  if (step.type === "checkbox") {
    return (
      <Button
        className="w-full"
        variant={isDone ? "outline" : "default"}
        disabled={isSaving}
        onClick={() => onMark(isDone ? "pending" : "done")}
      >
        {isDone ? "Mark incomplete" : "Confirm done"}
      </Button>
    );
  }

  if (step.type === "note") {
    return <NoteStep progress={progress} onMark={onMark} isSaving={isSaving} />;
  }

  if (step.type === "signature") {
    return <SignatureStep progress={progress} onMark={onMark} isSaving={isSaving} />;
  }

  if (step.type === "item_list" || step.type === "scan") {
    const list = (templateInputs.item_list as string[] | undefined) ?? [];
    return <ItemListStep items={list} progress={progress} onMark={onMark} isSaving={isSaving} />;
  }

  // photo / video / upload
  return (
    <UploadStep
      step={step}
      progress={progress}
      taskId={taskId}
      onMark={onMark}
      isSaving={isSaving}
    />
  );
}

function NoteStep({
  progress,
  onMark,
  isSaving,
}: {
  progress: StepProgress | undefined;
  onMark: (status: "done" | "pending", data?: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [val, setVal] = useState((progress?.data?.note as string | undefined) ?? "");
  return (
    <div className="space-y-2">
      <Textarea
        value={val}
        rows={3}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type notes here…"
      />
      <Button
        className="w-full"
        disabled={isSaving || val.trim().length === 0}
        onClick={() => onMark("done", { note: val.trim() })}
      >
        {progress?.status === "done" ? "Update note" : "Save note"}
      </Button>
    </div>
  );
}

function SignatureStep({
  progress,
  onMark,
  isSaving,
}: {
  progress: StepProgress | undefined;
  onMark: (status: "done" | "pending", data?: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState((progress?.data?.signer_name as string | undefined) ?? "");
  return (
    <div className="space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Recipient's full name" />
      <p className="text-xs text-muted-foreground">
        Recipient types their full name to confirm receipt. (On-screen signature pad coming soon.)
      </p>
      <Button
        className="w-full"
        disabled={isSaving || name.trim().length < 2}
        onClick={() => onMark("done", { signer_name: name.trim(), signed_at: new Date().toISOString() })}
      >
        Save signature
      </Button>
    </div>
  );
}

function ItemListStep({
  items,
  progress,
  onMark,
  isSaving,
}: {
  items: string[];
  progress: StepProgress | undefined;
  onMark: (status: "done" | "pending", data?: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const initial = (progress?.data?.checked as string[] | undefined) ?? [];
  const [checked, setChecked] = useState<string[]>(initial);
  const [custom, setCustom] = useState("");
  const [extras, setExtras] = useState<string[]>(
    (progress?.data?.extras as string[] | undefined) ?? [],
  );
  const all = [...items, ...extras];
  const toggle = (it: string) =>
    setChecked((prev) => (prev.includes(it) ? prev.filter((x) => x !== it) : [...prev, it]));

  return (
    <div className="space-y-2">
      {items.length === 0 && extras.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No item list provided by the investor. Add items as you shop.
        </p>
      )}
      <ul className="space-y-1">
        {all.map((it) => (
          <li key={it}>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-1.5 text-sm">
              <input type="checkbox" checked={checked.includes(it)} onChange={() => toggle(it)} />
              <span className={checked.includes(it) ? "line-through text-muted-foreground" : ""}>
                {it}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add item" />
        <Button
          variant="outline"
          onClick={() => {
            if (custom.trim()) {
              setExtras((e) => [...e, custom.trim()]);
              setCustom("");
            }
          }}
        >
          Add
        </Button>
      </div>
      <Button
        className="w-full"
        disabled={isSaving || all.length === 0 || checked.length < all.length}
        onClick={() => onMark("done", { checked, extras, total: all.length })}
      >
        {checked.length === all.length && all.length > 0 ? "Mark complete" : `Check off all (${checked.length}/${all.length})`}
      </Button>
    </div>
  );
}

function UploadStep({
  step,
  progress,
  taskId,
  onMark,
  isSaving,
}: {
  step: RunnerStep;
  progress: StepProgress | undefined;
  taskId: string;
  onMark: (status: "done" | "pending", data?: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const existing = (progress?.data?.files as Array<{ path: string; mime?: string }> | undefined) ?? [];
  const min = step.min_count ?? 1;
  const accept =
    step.accept_mime ?? (step.type === "video" ? "video/*" : step.type === "photo" ? "image/*" : "*/*");
  const uploadFn = useServerFn(createUploadUrl);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      const newFiles: Array<{ path: string; mime: string }> = [];
      for (const file of Array.from(list)) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
        const { path, signedUrl, token } = await uploadFn({
          data: { bucket: "task-deliverables", taskId, filename: `${step.key}-${cleanName}` },
        });
        const res = await supabase.storage
          .from("task-deliverables")
          .uploadToSignedUrl(path, token, file);
        if (res.error) throw new Error(res.error.message);
        newFiles.push({ path, mime: file.type });
        void signedUrl;
      }
      const all = [...existing, ...newFiles];
      onMark(all.length >= min ? "done" : "pending", { files: all });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        capture={step.type === "photo" || step.type === "video" ? "environment" : undefined}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        className="w-full"
        variant={progress?.status === "done" ? "outline" : "default"}
        disabled={uploading || isSaving}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <><Loader2 className="mr-2 size-4 animate-spin" /> Uploading…</>
        ) : step.type === "video" ? (
          <><Video className="mr-2 size-4" /> {existing.length > 0 ? "Add another" : "Record / upload video"}</>
        ) : step.type === "photo" ? (
          <><Camera className="mr-2 size-4" /> {existing.length > 0 ? "Add another" : "Take / upload photo"}</>
        ) : (
          <><Upload className="mr-2 size-4" /> Upload file</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        {existing.length} uploaded — need at least {min}
      </p>
      {existing.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {existing.map((f, i) => (
            <div key={i} className="rounded-md border border-border bg-background/40 p-1 text-[10px] text-muted-foreground truncate">
              {f.path.split("/").pop()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}