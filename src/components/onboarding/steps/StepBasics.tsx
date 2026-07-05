import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/profiles.functions";
import { PhotoUploader } from "@/components/profiles/PhotoUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StepBasics({ onDone }: { onDone: () => void }) {
  const getFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => getFn() });
  const [uid, setUid] = useState<string>("");
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", state: "", profile_photo_url: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? ""));
  }, []);
  useEffect(() => {
    const p = (data?.profile ?? {}) as any;
    if (p.user_id) {
      setForm({
        full_name: p.full_name ?? "",
        phone: p.phone ?? "",
        city: p.city ?? "",
        state: p.state ?? "",
        profile_photo_url: p.profile_photo_url ?? "",
      });
    }
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: (patch: Partial<typeof form>) => saveFn({ data: { ...form, ...patch } as any }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="size-4 animate-spin text-primary" />;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-5">
      <div>
        <Label className="mb-2 block">Profile photo</Label>
        <PhotoUploader
          userId={uid}
          label="Upload photo"
          currentUrl={form.profile_photo_url}
          onUploaded={(url) => {
            setForm((f) => ({ ...f, profile_photo_url: url }));
            save.mutate({ profile_photo_url: url });
          }}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
        <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
        <Field label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
      </div>
      <Button disabled={save.isPending} onClick={() => save.mutate({})}>
        {save.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
        Save & continue
      </Button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}