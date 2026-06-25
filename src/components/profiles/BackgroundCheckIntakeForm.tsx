import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { submitBackgroundCheckIntake } from "@/lib/background-check.functions";
import { createUploadUrl } from "@/lib/storage.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Upload, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

type Address = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  from?: string;
  to?: string;
};

const emptyAddress = (): Address => ({ line1: "", line2: "", city: "", state: "", zip: "", from: "", to: "" });

export function BackgroundCheckIntakeForm({
  defaults,
  onSubmitted,
}: {
  defaults?: { full_name?: string | null; email?: string | null; phone?: string | null; city?: string | null; state?: string | null };
  onSubmitted: () => void;
}) {
  const submitFn = useServerFn(submitBackgroundCheckIntake);
  const uploadFn = useServerFn(createUploadUrl);

  const [first, ...rest] = (defaults?.full_name ?? "").split(" ");
  const [form, setForm] = useState({
    legal_first_name: first ?? "",
    legal_middle_name: "",
    legal_last_name: rest.join(" ") ?? "",
    name_suffix: "",
    other_names: [] as string[],
    date_of_birth: "",
    ssn_last4: "",
    provide_full_ssn: false,
    ssn_full: "",
    drivers_license_number: "",
    drivers_license_state: "",
    drivers_license_expiration: "",
    phone: defaults?.phone ?? "",
    email: defaults?.email ?? "",
    current_address: { ...emptyAddress(), city: defaults?.city ?? "", state: defaults?.state ?? "" },
    prior_addresses: [] as Address[],
    id_front_path: "",
    id_back_path: "",
    selfie_path: "",
    fcra_consent: false,
    background_check_consent: false,
    info_truthful_consent: false,
    signature_full_name: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function uploadId(field: "id_front_path" | "id_back_path" | "selfie_path", file: File) {
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const filename = `${field}-${safeName}`;
    try {
      const res = await uploadFn({ data: { bucket: "runner-ids", filename } });
      const { error } = await supabase.storage
        .from(res.bucket)
        .uploadToSignedUrl(res.path, res.token, file, { contentType: file.type });
      if (error) throw error;
      set(field, res.path);
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  const mutate = useMutation({
    mutationFn: async () => {
      const payload = {
        legal_first_name: form.legal_first_name,
        legal_middle_name: form.legal_middle_name || null,
        legal_last_name: form.legal_last_name,
        name_suffix: form.name_suffix || null,
        other_names: form.other_names.filter((n) => n.trim().length > 0),
        date_of_birth: form.date_of_birth,
        ssn_last4: form.ssn_last4,
        ssn_full: form.provide_full_ssn && form.ssn_full ? form.ssn_full : null,
        drivers_license_number: form.drivers_license_number || null,
        drivers_license_state: form.drivers_license_state ? form.drivers_license_state.toUpperCase() : null,
        drivers_license_expiration: form.drivers_license_expiration || null,
        phone: form.phone,
        email: form.email,
        current_address: form.current_address,
        prior_addresses: form.prior_addresses,
        id_front_path: form.id_front_path || null,
        id_back_path: form.id_back_path || null,
        selfie_path: form.selfie_path || null,
        fcra_consent: form.fcra_consent as true,
        background_check_consent: form.background_check_consent as true,
        info_truthful_consent: form.info_truthful_consent as true,
        signature_full_name: form.signature_full_name,
      };
      return submitFn({ data: payload as any });
    },
    onSuccess: () => {
      toast.success("Submitted — we'll review your information shortly");
      onSubmitted();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allConsent = form.fcra_consent && form.background_check_consent && form.info_truthful_consent;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!allConsent) return toast.error("Please review and accept all consent items");
        if (!form.id_front_path) return toast.error("Please upload the front of your government ID");
        mutate.mutate();
      }}
      className="space-y-8"
    >
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm flex items-start gap-3">
        <Lock className="size-4 text-primary mt-0.5" />
        <div>
          <div className="font-medium">Your information is encrypted</div>
          <p className="text-xs text-muted-foreground">
            Sensitive fields are encrypted and only visible to our verification team. We use them solely to run your background check.
          </p>
        </div>
      </div>

      <Section title="Legal name">
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="First name" required value={form.legal_first_name} onChange={(v) => set("legal_first_name", v)} />
          <Field label="Middle (optional)" value={form.legal_middle_name} onChange={(v) => set("legal_middle_name", v)} />
          <Field label="Last name" required value={form.legal_last_name} onChange={(v) => set("legal_last_name", v)} />
          <Field label="Suffix" placeholder="Jr / Sr" value={form.name_suffix} onChange={(v) => set("name_suffix", v)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Other names used (aliases / maiden)</Label>
          {form.other_names.map((n, i) => (
            <div key={i} className="flex gap-2">
              <Input value={n} onChange={(e) => set("other_names", form.other_names.map((x, j) => (j === i ? e.target.value : x)))} />
              <Button type="button" variant="ghost" size="icon" onClick={() => set("other_names", form.other_names.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set("other_names", [...form.other_names, ""]) }>
            <Plus className="size-3.5 mr-1.5" /> Add another name
          </Button>
        </div>
      </Section>

      <Section title="Identity">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field type="date" label="Date of birth" required value={form.date_of_birth} onChange={(v) => set("date_of_birth", v)} />
          <Field label="SSN — last 4 digits" required placeholder="1234" maxLength={4} value={form.ssn_last4} onChange={(v) => set("ssn_last4", v.replace(/[^0-9]/g, "").slice(0, 4))} />
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.provide_full_ssn} onCheckedChange={(v) => set("provide_full_ssn", !!v)} />
              <span>Provide full SSN (encrypted)</span>
            </label>
          </div>
        </div>
        {form.provide_full_ssn && (
          <Field label="Full SSN" placeholder="123-45-6789" value={form.ssn_full} onChange={(v) => set("ssn_full", v)} />
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Driver's license #" value={form.drivers_license_number} onChange={(v) => set("drivers_license_number", v)} />
          <Field label="License state" maxLength={2} placeholder="TN" value={form.drivers_license_state} onChange={(v) => set("drivers_license_state", v.toUpperCase().slice(0, 2))} />
          <Field type="date" label="License expiration" value={form.drivers_license_expiration} onChange={(v) => set("drivers_license_expiration", v)} />
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Phone" required value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="Email" required type="email" value={form.email} onChange={(v) => set("email", v)} />
        </div>
      </Section>

      <Section title="Current address">
        <AddressFields value={form.current_address} onChange={(a) => set("current_address", a)} />
      </Section>

      <Section title="Prior addresses (last 7 years)">
        {form.prior_addresses.map((a, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Address #{i + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => set("prior_addresses", form.prior_addresses.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <AddressFields value={a} onChange={(updated) => set("prior_addresses", form.prior_addresses.map((x, j) => (j === i ? updated : x)))} showRange />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => set("prior_addresses", [...form.prior_addresses, emptyAddress()])}>
          <Plus className="size-3.5 mr-1.5" /> Add prior address
        </Button>
      </Section>

      <Section title="Government ID & selfie">
        <div className="grid sm:grid-cols-3 gap-3">
          <FileSlot label="ID — front" required path={form.id_front_path} onPick={(f) => uploadId("id_front_path", f)} />
          <FileSlot label="ID — back" path={form.id_back_path} onPick={(f) => uploadId("id_back_path", f)} />
          <FileSlot label="Selfie with ID" path={form.selfie_path} onPick={(f) => uploadId("selfie_path", f)} />
        </div>
      </Section>

      <Section title="Consent & e-signature">
        <Consent
          checked={form.fcra_consent}
          onCheck={(v) => set("fcra_consent", v)}
          title="FCRA disclosure & authorization"
          body="I acknowledge I have received the Fair Credit Reporting Act (FCRA) Summary of Rights and authorize REI Runner to obtain a consumer report about me."
        />
        <Consent
          checked={form.background_check_consent}
          onCheck={(v) => set("background_check_consent", v)}
          title="Background check consent"
          body="I consent to a criminal background check, including national and county criminal records, sex-offender registry, and identity verification."
        />
        <Consent
          checked={form.info_truthful_consent}
          onCheck={(v) => set("info_truthful_consent", v)}
          title="Truthfulness"
          body="I certify that all information I have provided is true and accurate to the best of my knowledge."
        />
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <Field
            label="E-signature — type your full legal name"
            required
            value={form.signature_full_name}
            onChange={(v) => set("signature_full_name", v)}
          />
          <div className="text-xs text-muted-foreground self-end">Signed {new Date().toLocaleString()}</div>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={mutate.isPending || !allConsent} className="gap-2">
          {mutate.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Submit for review
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AddressFields({
  value,
  onChange,
  showRange,
}: {
  value: Address;
  onChange: (a: Address) => void;
  showRange?: boolean;
}) {
  const u = (k: keyof Address, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Field label="Street" required value={value.line1} onChange={(v) => u("line1", v)} />
      <Field label="Apt / Unit" value={value.line2 ?? ""} onChange={(v) => u("line2", v)} />
      <Field label="City" required value={value.city} onChange={(v) => u("city", v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="State" required maxLength={2} value={value.state} onChange={(v) => u("state", v.toUpperCase().slice(0, 2))} />
        <Field label="ZIP" required value={value.zip} onChange={(v) => u("zip", v)} />
      </div>
      {showRange ? (
        <>
          <Field type="date" label="From" value={value.from ?? ""} onChange={(v) => u("from", v)} />
          <Field type="date" label="To" value={value.to ?? ""} onChange={(v) => u("to", v)} />
        </>
      ) : (
        <Field type="date" label="Living here since" value={value.from ?? ""} onChange={(v) => u("from", v)} />
      )}
    </div>
  );
}

function FileSlot({
  label,
  required,
  path,
  onPick,
}: {
  label: string;
  required?: boolean;
  path: string;
  onPick: (file: File) => void;
}) {
  const id = `bg-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <label
        htmlFor={id}
        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30"
      >
        <Upload className="size-3.5" />
        {path ? "Uploaded ✓ — replace" : "Click to upload"}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
    </div>
  );
}

function Consent({
  checked,
  onCheck,
  title,
  body,
}: {
  checked: boolean;
  onCheck: (v: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheck(!!v)} className="mt-0.5" />
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </label>
  );
}