import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  Download,
  Loader2,
  FileImage,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { getSignedDownloadUrl } from "@/lib/storage.functions";
import { cn } from "@/lib/utils";

export type DeliverableFile = {
  id: string;
  bucket: string;
  path: string;
  kind: string;
  mime_type: string | null;
};

export type FeedbackState = Record<
  string,
  { status: "pending" | "approved" | "reshoot"; note: string }
>;

function isImage(f: DeliverableFile) {
  return (f.mime_type ?? "").startsWith("image/");
}
function isVideo(f: DeliverableFile) {
  return (f.mime_type ?? "").startsWith("video/");
}

function SignedMedia({ file, className }: { file: DeliverableFile; className?: string }) {
  const signFn = useServerFn(getSignedDownloadUrl);
  const { data, isLoading } = useQuery({
    queryKey: ["signed-url", file.bucket, file.path],
    queryFn: () => signFn({ data: { bucket: file.bucket as "task-photos", path: file.path } }),
    staleTime: 4 * 60_000,
  });
  if (isLoading) {
    return (
      <div className={cn("grid place-items-center bg-muted/30", className)}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data?.url) {
    return (
      <div className={cn("grid place-items-center bg-muted/20 text-muted-foreground", className)}>
        <FileImage className="size-6" />
      </div>
    );
  }
  if (isImage(file)) {
    return <img src={data.url} alt={file.kind} className={cn("object-contain", className)} />;
  }
  if (isVideo(file)) {
    return <video src={data.url} controls className={cn("object-contain", className)} />;
  }
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noreferrer"
      className={cn("grid place-items-center bg-muted/20 text-sm text-primary underline", className)}
    >
      Open file
    </a>
  );
}

export function DeliverableReviewWorkspace({
  files,
  feedback,
  onChangeFeedback,
  onClose,
  open,
  startIndex = 0,
}: {
  files: DeliverableFile[];
  feedback: FeedbackState;
  onChangeFeedback: (next: FeedbackState) => void;
  onClose: () => void;
  open: boolean;
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);
  useEffect(() => { if (open) setIndex(startIndex); }, [open, startIndex]);

  const file = files[index];
  const fb = file ? feedback[file.id] ?? { status: "pending", note: "" } : null;
  const signFn = useServerFn(getSignedDownloadUrl);

  const counts = useMemo(() => {
    let approved = 0, reshoot = 0;
    for (const f of files) {
      const s = feedback[f.id]?.status ?? "pending";
      if (s === "approved") approved++;
      else if (s === "reshoot") reshoot++;
    }
    return { approved, reshoot, pending: files.length - approved - reshoot };
  }, [files, feedback]);

  function setStatus(s: "approved" | "reshoot" | "pending") {
    if (!file) return;
    onChangeFeedback({ ...feedback, [file.id]: { ...(feedback[file.id] ?? { note: "" }), status: s } });
  }
  function setNote(v: string) {
    if (!file) return;
    onChangeFeedback({ ...feedback, [file.id]: { status: feedback[file.id]?.status ?? "pending", note: v } });
  }
  function go(delta: number) {
    setIndex((i) => Math.min(files.length - 1, Math.max(0, i + delta)));
  }
  async function download() {
    if (!file) return;
    const { url } = await signFn({ data: { bucket: file.bucket as "task-photos", path: file.path } });
    window.open(url, "_blank");
  }

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key.toLowerCase() === "a") setStatus("approved");
      else if (e.key.toLowerCase() === "r") setStatus("reshoot");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.id, feedback]);

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[96vw] w-full h-[92vh] p-0 gap-0 overflow-hidden sm:rounded-xl">
        <DialogTitle className="sr-only">Review deliverable {index + 1} of {files.length}</DialogTitle>
        <div className="flex flex-col md:flex-row h-full min-h-0">
          {/* Media column */}
          <div className="relative flex-1 bg-black/70 grid place-items-center min-h-[40vh] md:min-h-0">
            <SignedMedia file={file} className="max-h-full max-w-full w-auto h-auto" />
            {index > 0 && (
              <button
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur p-2 hover:bg-background"
                aria-label="Previous"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {index < files.length - 1 && (
              <button
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur p-2 hover:bg-background"
                aria-label="Next"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <Badge variant="outline" className="bg-background/80 backdrop-blur">{file.kind}</Badge>
              <Badge variant="outline" className="bg-background/80 backdrop-blur">{index + 1} / {files.length}</Badge>
            </div>
            <button
              onClick={download}
              className="absolute top-3 right-3 rounded-md bg-background/80 backdrop-blur px-2.5 py-1.5 text-xs flex items-center gap-1.5 hover:bg-background"
            >
              <Download className="size-3.5" /> Download
            </button>
          </div>

          {/* Sidebar */}
          <aside className="w-full md:w-[340px] md:border-l border-t md:border-t-0 border-border bg-card/60 flex flex-col min-h-0">
            <div className="p-4 border-b border-border space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Progress</div>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400"><Check className="size-3.5" /> {counts.approved}</span>
                <span className="flex items-center gap-1 text-amber-300"><RotateCcw className="size-3.5" /> {counts.reshoot}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><AlertCircle className="size-3.5" /> {counts.pending} left</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                <div className="bg-emerald-500" style={{ width: `${(counts.approved / files.length) * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${(counts.reshoot / files.length) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 space-y-3 border-b border-border">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={fb?.status === "approved" ? "default" : "outline"}
                  size="sm"
                  className={fb?.status === "approved" ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" : ""}
                  onClick={() => setStatus(fb?.status === "approved" ? "pending" : "approved")}
                >
                  <Check className="size-4 mr-1" /> Approve
                </Button>
                <Button
                  variant={fb?.status === "reshoot" ? "default" : "outline"}
                  size="sm"
                  className={fb?.status === "reshoot" ? "bg-amber-600 hover:bg-amber-600/90 text-white" : ""}
                  onClick={() => setStatus(fb?.status === "reshoot" ? "pending" : "reshoot")}
                >
                  <RotateCcw className="size-4 mr-1" /> Re-shoot
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Tip: press <kbd className="px-1 py-0.5 rounded bg-muted">A</kbd> to approve, <kbd className="px-1 py-0.5 rounded bg-muted">R</kbd> to request re-shoot, ← → to navigate.</p>
            </div>

            <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="size-3.5" /> Note for this file
                </label>
                <Textarea
                  rows={3}
                  value={fb?.note ?? ""}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={fb?.status === "reshoot" ? "What needs to change?" : "Optional note for your runner…"}
                />
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">All files</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {files.map((f, i) => {
                    const s = feedback[f.id]?.status ?? "pending";
                    return (
                      <button
                        key={f.id}
                        onClick={() => setIndex(i)}
                        className={cn(
                          "relative aspect-square rounded-md overflow-hidden border-2 transition",
                          i === index ? "border-primary" : "border-transparent hover:border-border",
                        )}
                      >
                        <SignedMedia file={f} className="w-full h-full object-cover" />
                        {s !== "pending" && (
                          <div
                            className={cn(
                              "absolute bottom-0 inset-x-0 text-[9px] uppercase font-semibold py-0.5 text-center",
                              s === "approved" ? "bg-emerald-600/90 text-white" : "bg-amber-600/90 text-white",
                            )}
                          >
                            {s === "approved" ? "OK" : "Redo"}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <Button variant="outline" className="w-full" onClick={onClose}>
                <X className="size-4 mr-1" /> Close workspace
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function buildReshootReason(
  files: DeliverableFile[],
  feedback: FeedbackState,
): string {
  const lines: string[] = [];
  files.forEach((f, i) => {
    const fb = feedback[f.id];
    if (!fb) return;
    if (fb.status === "reshoot") {
      lines.push(`#${i + 1} (${f.kind}): RE-SHOOT — ${fb.note || "needs re-do"}`);
    } else if (fb.note?.trim()) {
      lines.push(`#${i + 1} (${f.kind}): note — ${fb.note.trim()}`);
    }
  });
  return lines.join("\n");
}