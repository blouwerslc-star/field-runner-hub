import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Smartphone } from "lucide-react";
import { getMySettings, updateNotificationPrefs } from "@/lib/settings.functions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsCard, SettingsHeader, ToggleRow } from "@/components/settings/SettingsSection";
import {
  requestPhoneVerification,
  confirmPhoneVerification,
  removePhoneNumber,
} from "@/lib/phone-verification.functions";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  component: NotificationSettings,
});

const DEFAULTS: Record<string, boolean> = {
  email_enabled: true,
  sms_enabled: false,
  new_task_alerts: true,
  task_status_updates: true,
  payout_updates: true,
  profile_messages: true,
  marketing_emails: false,
  weekly_summary: true,
  sms_task_assigned: true,
  sms_submission_approved: true,
  sms_submission_rejected: true,
  sms_message_received: false,
  sms_referral_qualified: true,
};

function NotificationSettings() {
  const fetchSettings = useServerFn(getMySettings);
  const save = useServerFn(updateNotificationPrefs);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["mySettings"], queryFn: () => fetchSettings() });
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULTS);

  useEffect(() => {
    const fromDb = (data?.profile as { notification_prefs?: Record<string, boolean> } | null)?.notification_prefs ?? {};
    setPrefs({ ...DEFAULTS, ...fromDb });
  }, [data]);

  const mut = useMutation({
    mutationFn: () => save({ data: { prefs } }),
    onSuccess: () => {
      toast.success("Notification preferences saved");
      qc.invalidateQueries({ queryKey: ["mySettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;

  const set = (k: string, v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  const ROWS: { key: string; label: string; desc?: string }[] = [
    { key: "email_enabled", label: "Email notifications", desc: "Master switch for all email alerts." },
    { key: "sms_enabled", label: "SMS notifications", desc: "Time-sensitive alerts via text." },
    { key: "new_task_alerts", label: "New task alerts" },
    { key: "task_status_updates", label: "Task status updates" },
    { key: "payout_updates", label: "Payout updates" },
    { key: "profile_messages", label: "Profile messages" },
    { key: "marketing_emails", label: "Marketing emails", desc: "Product updates and announcements." },
    { key: "weekly_summary", label: "Weekly summary emails" },
  ];

  const SMS_ROWS: { key: string; label: string }[] = [
    { key: "sms_task_assigned", label: "Task assigned to you" },
    { key: "sms_submission_approved", label: "Submission approved" },
    { key: "sms_submission_rejected", label: "Submission needs changes" },
    { key: "sms_message_received", label: "New message received" },
    { key: "sms_referral_qualified", label: "Referral reward earned" },
  ];

  const profile = data?.profile as { phone?: string | null; phone_verified?: boolean } | null;

  return (
    <div>
      <SettingsHeader title="Notifications" description="Choose what we send you and where." />
      <PhoneVerificationCard
        phone={profile?.phone ?? null}
        verified={!!profile?.phone_verified}
        onChanged={() => qc.invalidateQueries({ queryKey: ["mySettings"] })}
      />
      <SettingsCard
        title="Notification preferences"
        footer={
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save preferences
          </Button>
        }
      >
        <div className="divide-y divide-border/60">
          {ROWS.map((r) => (
            <ToggleRow key={r.key} label={r.label} description={r.desc}>
              <Switch checked={!!prefs[r.key]} onCheckedChange={(v) => set(r.key, v)} />
            </ToggleRow>
          ))}
        </div>
        {prefs.sms_enabled && profile?.phone_verified && (
          <div className="mt-6 pt-4 border-t border-border/60">
            <div className="text-sm font-medium mb-2">SMS events</div>
            <div className="divide-y divide-border/60">
              {SMS_ROWS.map((r) => (
                <ToggleRow key={r.key} label={r.label}>
                  <Switch checked={prefs[r.key] !== false} onCheckedChange={(v) => set(r.key, v)} />
                </ToggleRow>
              ))}
            </div>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

function PhoneVerificationCard({
  phone,
  verified,
  onChanged,
}: {
  phone: string | null;
  verified: boolean;
  onChanged: () => void;
}) {
  const request = useServerFn(requestPhoneVerification);
  const confirm = useServerFn(confirmPhoneVerification);
  const remove = useServerFn(removePhoneNumber);
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  const reqMut = useMutation({
    mutationFn: () => request({ data: { phone: phoneInput } }),
    onSuccess: (res) => {
      setSent(true);
      toast.success(res.smsSent ? "Verification code sent" : "Code created — SMS provider not configured yet");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const conMut = useMutation({
    mutationFn: () => confirm({ data: { code } }),
    onSuccess: () => {
      toast.success("Phone verified");
      setSent(false);
      setCode("");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rmMut = useMutation({
    mutationFn: () => remove(),
    onSuccess: () => {
      toast.success("Phone removed");
      setPhoneInput("");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SettingsCard
      title="Phone number for SMS"
      description="Verify a mobile number to receive time-sensitive alerts via text."
    >
      {verified ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="font-medium">{phone}</span>
            <span className="text-xs text-muted-foreground">Verified</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => rmMut.mutate()} disabled={rmMut.isPending}>
            Remove
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Mobile number</label>
              <div className="relative">
                <Smartphone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="+1 555 555 1234"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={() => reqMut.mutate()} disabled={reqMut.isPending || !phoneInput.trim()}>
              {reqMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
              Send code
            </Button>
          </div>
          {sent && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">6-digit code</label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button onClick={() => conMut.mutate()} disabled={conMut.isPending || code.length !== 6}>
                {conMut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                Verify
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            US numbers can be entered as 10 digits — international numbers need a leading +.
          </p>
        </div>
      )}
    </SettingsCard>
  );
}