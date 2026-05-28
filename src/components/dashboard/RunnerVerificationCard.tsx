import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createUploadUrl, recordTaskFile } from "@/lib/storage.functions";

export function RunnerVerificationCard() {
  const uploadFn = useServerFn(createUploadUrl);
  const recordFn = useServerFn(recordTaskFile);
  const [hasId, setHasId] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("task_files")
      .select("id")
      .eq("uploader_id", user.id)
      .eq("bucket", "runner-ids")
      .limit(1);
    setHasId((data ?? []).length > 0);
  }
  useEffect(() => { refresh(); }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const up = await uploadFn({ data: { bucket: "runner-ids", filename: safe } });
      const res = await fetch(up.signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!res.ok) throw new Error("Upload failed");
      await recordFn({ data: { bucket: "runner-ids", path: up.path, mimeType: file.type, sizeBytes: file.size, kind: "id" } });
      toast.success("ID uploaded. Admin will review.");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h3 className="font-semibold">Identity verification</h3>
          {hasId === true && <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">Submitted</Badge>}
          {hasId === false && <Badge variant="outline" className="border-amber-500/30 text-amber-300">Required</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a government-issued photo ID. Required before you can be paid out.
        </p>
      </div>
      <label>
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} disabled={busy} />
        <Button asChild variant="outline" disabled={busy}>
          <span>
            {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
            {hasId ? "Replace ID" : "Upload ID"}
          </span>
        </Button>
      </label>
    </div>
  );
}