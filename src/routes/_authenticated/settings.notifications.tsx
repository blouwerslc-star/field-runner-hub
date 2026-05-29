import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getMySettings, updateNotificationPrefs } from "@/lib/settings.functions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SettingsCard, SettingsHeader, ToggleRow } from "@/components/settings/SettingsSection";

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

  return (
    <div>
      <SettingsHeader title="Notifications" description="Choose what we send you and where." />
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
      </SettingsCard>
    </div>
  );
}