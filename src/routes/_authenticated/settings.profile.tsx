import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";
import { getMyProfile, updateMyProfile } from "@/lib/profiles.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PhotoUploader } from "@/components/profiles/PhotoUploader";
import { SettingsCard, SettingsHeader, ToggleRow } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/profile")({
  component: ProfileSettings,
});

function ProfileSettings() {
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["myProfile"], queryFn: () => fetchProfile() });
  const profile = (data?.profile ?? {}) as Record<string, unknown>;
  const userId = (profile.user_id as string) ?? "";
  const slug = (profile.profile_slug as string) ?? "";

  const [form, setForm] = useState<Record<string, unknown>>({});
  useEffect(() => {
    if (data?.profile) setForm(data.profile as Record<string, unknown>);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => save({ data: payload as never }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["myProfile"] });
      qc.invalidateQueries({ queryKey: ["mySettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function update<K extends string>(key: K, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSave() {
    const keys = [
      "headline","bio","profile_photo_url","cover_photo_url","services_offered",
      "markets_served","availability_status","public_profile_enabled",
    ];
    const payload: Record<string, unknown> = {};
    for (const k of keys) if (k in form) payload[k] = form[k] === "" ? null : form[k];
    saveMut.mutate(payload);
  }

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;

  const services = (form.services_offered as string[]) ?? [];

  return (
    <div>
      <SettingsHeader title="Profile" description="Edit how you appear on your public profile." />

      <div className="flex justify-end mb-4">
        {slug && (
          <Button asChild variant="outline" size="sm">
            <Link to="/profile/$slug" params={{ slug }} target="_blank">
              <ExternalLink className="size-3.5 mr-1.5" /> View public profile
            </Link>
          </Button>
        )}
      </div>

      <SettingsCard
        title="Photos"
        footer={
          <Button onClick={onSave} disabled={saveMut.isPending}>
            {saveMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        }
      >
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <Label className="block mb-2">Profile photo</Label>
            <PhotoUploader
              userId={userId}
              label="Profile photo"
              currentUrl={(form.profile_photo_url as string) ?? null}
              onUploaded={(url) => update("profile_photo_url", url)}
              shape="circle"
            />
          </div>
          <div>
            <Label className="block mb-2">Cover photo</Label>
            <PhotoUploader
              userId={userId}
              label="Cover photo"
              currentUrl={(form.cover_photo_url as string) ?? null}
              onUploaded={(url) => update("cover_photo_url", url)}
              shape="wide"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Headline & bio"
        footer={
          <Button onClick={onSave} disabled={saveMut.isPending}>
            {saveMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Label>Headline</Label>
          <Input
            value={(form.headline as string) ?? ""}
            onChange={(e) => update("headline", e.target.value)}
            placeholder="e.g. Atlanta-based field runner — fast turnaround"
            maxLength={160}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea
            rows={5}
            value={(form.bio as string) ?? ""}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Tell investors a bit about yourself, your experience and what you do best."
            maxLength={2000}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Services & markets"
        footer={
          <Button onClick={onSave} disabled={saveMut.isPending}>
            {saveMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Label>Services offered (comma separated)</Label>
          <Input
            value={services.join(", ")}
            onChange={(e) =>
              update(
                "services_offered",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
            placeholder="Drive-by, Lockbox install, Photos"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Markets served</Label>
          <Input
            value={(form.markets_served as string) ?? ""}
            onChange={(e) => update("markets_served", e.target.value)}
            placeholder="Atlanta GA, Birmingham AL"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Availability</Label>
          <Select
            value={(form.availability_status as string) ?? "available"}
            onValueChange={(v) => update("availability_status", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Visibility"
        footer={
          <Button onClick={onSave} disabled={saveMut.isPending}>
            {saveMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        }
      >
        <ToggleRow
          label="Public profile enabled"
          description="When off, your profile is hidden from the directory and public pages."
        >
          <Switch
            checked={(form.public_profile_enabled as boolean) ?? true}
            onCheckedChange={(v) => update("public_profile_enabled", v)}
          />
        </ToggleRow>
      </SettingsCard>

      <p className="text-xs text-muted-foreground">
        Need to edit company details, rates or experience?{" "}
        <Link to="/profile/edit" className="underline">Open the full profile editor</Link>.
      </p>
    </div>
  );
}