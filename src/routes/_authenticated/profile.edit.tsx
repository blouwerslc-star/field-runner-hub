import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/profiles.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PhotoUploader } from "@/components/profiles/PhotoUploader";
import { PortfolioEditor } from "@/components/profiles/PortfolioEditor";
import { AvailabilityBlockEditor } from "@/components/profiles/AvailabilityBlockEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { SPECIALTY_OPTIONS, PRICING_SERVICES, EXPERIENCE_FIELDS } from "@/lib/profile-constants";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  component: ProfileEditPage,
  head: () => ({ meta: [{ title: "Edit profile — REI Runner" }] }),
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Couldn't load profile: {error.message}</div>
  ),
});

type FormState = Record<string, unknown>;

function ProfileEditPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => fetchProfile(),
  });

  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.profile) setForm(data.profile as FormState);
  }, [data]);

  if (isLoading || !data) {
    return (
      <DashboardShell title="Edit profile">
        <Loader2 className="size-5 animate-spin text-primary" />
      </DashboardShell>
    );
  }

  const profile = data.profile as Record<string, unknown> | null;
  const roles = data.roles ?? [];
  const isRunner = roles.includes("runner");
  const isInvestor = roles.includes("investor");
  const userId = (profile?.user_id as string) ?? "";
  const slug = (profile?.profile_slug as string) ?? "";

  function update<K extends string>(key: K, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      const keys = [
        "full_name","headline","bio","city","state","profile_photo_url","cover_photo_url",
        "services_offered","markets_served","experience_level","years_experience","service_radius",
        "availability_status","hourly_rate","task_rate","turnaround_time","response_time",
        "phone_public","public_profile_enabled","transportation_available","task_types",
        "preferred_payout_min","preferred_payout_max","company_name","company_description","monthly_deal_volume",
        // Profiles 2.0
        "specialties","insurance_verified",
        "real_estate_experience","real_estate_years",
        "contractor_experience","contractor_years",
        "property_management_experience","property_management_years",
        "realtor_experience","realtor_years",
        "rate_lockbox_install","rate_occupancy_check","rate_property_photos","rate_video_walkthrough","rate_sign_placement",
        "avail_today","avail_this_week","avail_weekends","avail_emergency",
        "home_lat","home_lng",
      ];
      for (const k of keys) {
        if (k in form) payload[k] = form[k] === "" ? null : form[k];
      }
      // coerce numerics
      for (const k of [
        "years_experience","hourly_rate","task_rate","preferred_payout_min","preferred_payout_max",
        "real_estate_years","contractor_years","property_management_years","realtor_years",
        "rate_lockbox_install","rate_occupancy_check","rate_property_photos","rate_video_walkthrough","rate_sign_placement",
        "home_lat","home_lng",
      ]) {
        if (payload[k] != null && payload[k] !== "") payload[k] = Number(payload[k]);
        else if (payload[k] === "" || Number.isNaN(payload[k])) payload[k] = null;
      }
      await save({ data: payload });
      toast.success("Profile saved");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const val = (k: string) => (form[k] as string | number | undefined) ?? "";
  const bool = (k: string) => Boolean(form[k]);

  return (
    <DashboardShell title="Edit your public profile" subtitle="Control how investors and runners see you on REI Runner.">
      {slug && (
        <div className="mb-6 flex items-center gap-3">
          <Link to="/profile/$slug" params={{ slug }} className="text-sm inline-flex items-center gap-1 text-primary hover:underline">
            View public profile <ExternalLink className="size-3" />
          </Link>
          <Link to="/profiles" className="text-sm text-muted-foreground hover:text-foreground">Browse directory</Link>
        </div>
      )}
      <form onSubmit={onSave} className="space-y-8">
        <section className="grid gap-6 md:grid-cols-[auto,1fr]">
          <div className="flex gap-4">
            <PhotoUploader userId={userId} label="Photo" shape="circle"
              currentUrl={val("profile_photo_url") as string}
              onUploaded={(u) => update("profile_photo_url", u)} />
          </div>
          <div>
            <PhotoUploader userId={userId} label="Cover" shape="wide"
              currentUrl={val("cover_photo_url") as string}
              onUploaded={(u) => update("cover_photo_url", u)} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Display name"><Input value={val("full_name") as string} onChange={(e) => update("full_name", e.target.value)} /></Field>
          <Field label="Headline"><Input placeholder="e.g. Phoenix-based REI photographer" value={val("headline") as string} onChange={(e) => update("headline", e.target.value)} /></Field>
          <Field label="City"><Input value={val("city") as string} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="State"><Input value={val("state") as string} onChange={(e) => update("state", e.target.value)} /></Field>
          <Field label="Markets served" full><Input value={val("markets_served") as string} onChange={(e) => update("markets_served", e.target.value)} /></Field>
          <Field label="Bio" full>
            <Textarea rows={4} value={val("bio") as string} onChange={(e) => update("bio", e.target.value)} />
          </Field>
          <Field label="Services offered (comma separated)" full>
            <Input
              value={(form.services_offered as string[] | undefined)?.join(", ") ?? ""}
              onChange={(e) => update("services_offered", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Experience level">
            <Select value={(val("experience_level") as string) || "beginner"} onValueChange={(v) => update("experience_level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Years experience"><Input type="number" min={0} value={val("years_experience") as number} onChange={(e) => update("years_experience", e.target.value)} /></Field>
          <Field label="Availability">
            <Select value={(val("availability_status") as string) || "available"} onValueChange={(v) => update("availability_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Service radius"><Input value={val("service_radius") as string} onChange={(e) => update("service_radius", e.target.value)} /></Field>
          <Field label="Response time"><Input placeholder="e.g. within 1 hour" value={val("response_time") as string} onChange={(e) => update("response_time", e.target.value)} /></Field>
        </section>

        {isRunner && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Runner details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Task types (comma separated)" full>
                <Input value={(form.task_types as string[] | undefined)?.join(", ") ?? ""}
                  onChange={(e) => update("task_types", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
              </Field>
              <Field label="Hourly rate ($)"><Input type="number" value={val("hourly_rate") as number} onChange={(e) => update("hourly_rate", e.target.value)} /></Field>
              <Field label="Starting task rate ($)"><Input type="number" value={val("task_rate") as number} onChange={(e) => update("task_rate", e.target.value)} /></Field>
              <Field label="Preferred payout min ($)"><Input type="number" value={val("preferred_payout_min") as number} onChange={(e) => update("preferred_payout_min", e.target.value)} /></Field>
              <Field label="Preferred payout max ($)"><Input type="number" value={val("preferred_payout_max") as number} onChange={(e) => update("preferred_payout_max", e.target.value)} /></Field>
              <Field label="Turnaround time"><Input placeholder="e.g. 24 hours" value={val("turnaround_time") as string} onChange={(e) => update("turnaround_time", e.target.value)} /></Field>
              <Field label="Transportation available">
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={bool("transportation_available")} onCheckedChange={(c) => update("transportation_available", c)} />
                  <span className="text-sm text-muted-foreground">{bool("transportation_available") ? "Yes" : "No"}</span>
                </div>
              </Field>
            </div>
          </section>
        )}

        {isInvestor && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Investor details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company name"><Input value={val("company_name") as string} onChange={(e) => update("company_name", e.target.value)} /></Field>
              <Field label="Monthly deal volume"><Input value={val("monthly_deal_volume") as string} onChange={(e) => update("monthly_deal_volume", e.target.value)} /></Field>
              <Field label="Company description" full>
                <Textarea rows={3} value={val("company_description") as string} onChange={(e) => update("company_description", e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">Privacy</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <ToggleRow label="Public profile visible" hint="Show your profile in the public directory."
              checked={bool("public_profile_enabled")} onChange={(c) => update("public_profile_enabled", c)} />
            <ToggleRow label="Show phone publicly" hint="Display your phone number on your public profile."
              checked={bool("phone_public")} onChange={(c) => update("phone_public", c)} />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save profile
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border/60 p-4">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}