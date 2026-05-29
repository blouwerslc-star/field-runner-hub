import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle2, AlertCircle, Eye, ShieldCheck, IdCard, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createUploadUrl } from "@/lib/storage.functions";
import { recordIdDocument, listMyIdDocuments, getIdDocumentUrl } from "@/lib/ops.functions";

export const Route = createFileRoute("/_authenticated/profile/id-verification")({
  component: IdVerificationPage,
  head: () => ({ meta: [{ title: "ID verification — REI Runner" }] }),
});

const KINDS = [
  { kind: "front_id", label: "Front of ID", icon: IdCard, hint: "Driver's license or government-issued ID (front)" },
  { kind: "back_id", label: "Back of ID", icon: IdCard, hint: "Back of the same document" },
  { kind: "selfie", label: "Selfie with ID", icon: User, hint: "Photo of you holding the ID next to your face" },
] as const;

function IdVerificationPage() {
  const listFn = useServerFn(listMyIdDocuments);
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["my-id-docs"], queryFn: () => listFn() });

  const byKind = new Map((docs.data?.documents ?? []).map((d: any) => [d.kind, d]));
  const submitted = KINDS.filter((k) => byKind.has(k.kind)).length;
  const allApproved = KINDS.every((k) => byKind.get(k.kind)?.status === "approved");

  return (
    <DashboardShell title="Identity verification" subtitle="Upload your ID documents so we can verify you and unlock higher-trust tasks.">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card/40 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="size-5 text-primary" />
          <h3 className="font-semibold">Verification status</h3>
          {allApproved && <Badge variant="outline" className="text-xs gap-1"><CheckCircle2 className="size-3" /> Verified</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {submitted} of {KINDS.length} documents uploaded. Your files are encrypted and only visible to our verification team.
        </p>
      </div>

      {docs.isLoading ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {KINDS.map((k) => (
            <UploadCard
              key={k.kind}
              kind={k.kind}
              label={k.label}
              hint={k.hint}
              icon={k.icon}
              doc={byKind.get(k.kind)}
              onChange={() => qc.invalidateQueries({ queryKey: ["my-id-docs"] })}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function UploadCard({
  kind, label, hint, icon: Icon, doc, onChange,
}: {
  kind: "front_id" | "back_id" | "selfie";
  label: string; hint: string;
  icon: React.ComponentType<{ className?: string }>;
  doc: any; onChange: () => void;
}) {
  const uploadUrlFn = useServerFn(createUploadUrl);
  const recordFn = useServerFn(recordIdDocument);
  const previewFn = useServerFn(getIdDocumentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 15 * 1024 * 1024) return toast.error("File must be under 15MB");
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const { signedUrl, path } = await uploadUrlFn({
        data: { bucket: "runner-ids", filename: `${kind}-${safeName}` },
      });
      const up = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!up.ok) throw new Error("Upload failed");
      await recordFn({ data: { kind, path, mime_type: file.type, size_bytes: file.size } });
      toast.success("Uploaded — pending review");
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function preview() {
    if (!doc?.path) return;
    try {
      const { url } = await previewFn({ data: { path: doc.path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const status = doc?.status as "pending" | "approved" | "rejected" | undefined;

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-primary/10 grid place-items-center text-primary">
            <Icon className="size-4" />
          </div>
          <h3 className="font-semibold">{label}</h3>
        </div>
        {status === "approved" && <Badge variant="outline" className="text-xs gap-1 text-emerald-400 border-emerald-500/40"><CheckCircle2 className="size-3" /> Approved</Badge>}
        {status === "pending" && <Badge variant="outline" className="text-xs">Pending review</Badge>}
        {status === "rejected" && <Badge variant="outline" className="text-xs gap-1 text-destructive border-destructive/40"><AlertCircle className="size-3" /> Rejected</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {status === "rejected" && doc?.rejection_reason && (
        <p className="text-xs italic text-destructive">{doc.rejection_reason}</p>
      )}
      <div className="flex gap-2 pt-1">
        <label className="flex-1">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
          />
          <Button asChild variant={doc ? "outline" : "default"} className="w-full pointer-events-none" disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
              {doc ? "Replace" : "Upload"}
            </span>
          </Button>
        </label>
        {doc && (
          <Button variant="ghost" size="icon" onClick={preview}>
            <Eye className="size-4" />
          </Button>
        )}
      </div>
      {doc && (
        <p className="text-xs text-muted-foreground">Uploaded {new Date(doc.created_at).toLocaleDateString()}</p>
      )}
    </div>
  );
}