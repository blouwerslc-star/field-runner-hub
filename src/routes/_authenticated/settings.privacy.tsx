import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getMySettings, updatePrivacyPrefs } from "@/lib/settings.functions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SettingsCard, SettingsHeader, ToggleRow } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/privacy")({
  component: PrivacySettings,
});

const DEFAULTS: Record<string, boolean> = {
  show_city_state: true,
  show_completed_count: true,
  show_ratings: true,
  allow_contact_requests: true,
  allow_task_invites: true,
};

function PrivacySettings() {
  const fetchSettings = useServerFn(getMySettings);
  const save = useServerFn(updatePrivacyPrefs);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["mySettings"], queryFn: () => fetchSettings() });

  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULTS);
  const [publicProfile, setPublicProfile] = useState(true);
  const [phonePublic, setPhonePublic] = useState(false);

  useEffect(() => {
    const p = (data?.profile ?? {}) as Record<string, unknown>;
    const fromDb = (p.privacy_prefs as Record<string, boolean>) ?? {};
    setPrefs({ ...DEFAULTS, ...fromDb });
    setPublicProfile((p.public_profile_enabled as boolean) ?? true);
    setPhonePublic((p.phone_public as boolean) ?? false);
  }, [data]);

  const mut = useMutation({
    mutationFn: () =>
      save({ data: { prefs, public_profile_enabled: publicProfile, phone_public: phonePublic } }),
    onSuccess: () => {
      toast.success("Privacy preferences saved");
      qc.invalidateQueries({ queryKey: ["mySettings"] });
      qc.invalidateQueries({ queryKey: ["myProfile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;

  const set = (k: string, v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <SettingsHeader title="Privacy" description="Control what's visible on your public profile." />
      <SettingsCard
        title="Profile visibility"
        footer={
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save preferences
          </Button>
        }
      >
        <div className="divide-y divide-border/60">
          <ToggleRow label="Public profile enabled" description="Hide your profile from public listings.">
            <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
          </ToggleRow>
          <ToggleRow label="Show city & state">
            <Switch checked={!!prefs.show_city_state} onCheckedChange={(v) => set("show_city_state", v)} />
          </ToggleRow>
          <ToggleRow label="Show completed task count">
            <Switch checked={!!prefs.show_completed_count} onCheckedChange={(v) => set("show_completed_count", v)} />
          </ToggleRow>
          <ToggleRow label="Show ratings">
            <Switch checked={!!prefs.show_ratings} onCheckedChange={(v) => set("show_ratings", v)} />
          </ToggleRow>
          <ToggleRow label="Show phone publicly" description="Display your phone number on your public profile.">
            <Switch checked={phonePublic} onCheckedChange={setPhonePublic} />
          </ToggleRow>
          <ToggleRow label="Allow direct contact requests">
            <Switch checked={!!prefs.allow_contact_requests} onCheckedChange={(v) => set("allow_contact_requests", v)} />
          </ToggleRow>
          <ToggleRow label="Allow investors to invite me to tasks">
            <Switch checked={!!prefs.allow_task_invites} onCheckedChange={(v) => set("allow_task_invites", v)} />
          </ToggleRow>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Your email, full address, and payment details are never shown publicly.
        </p>
      </SettingsCard>
    </div>
  );
}