import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getMySettings, updatePreferences } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SettingsCard, SettingsHeader } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/preferences")({
  component: PreferencesSettings,
});

const THEME_KEY = "rei:theme";

function applyTheme(theme: string) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
  root.classList.toggle("dark", resolved === "dark");
}

function PreferencesSettings() {
  const fetchSettings = useServerFn(getMySettings);
  const save = useServerFn(updatePreferences);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["mySettings"], queryFn: () => fetchSettings() });

  const [form, setForm] = useState({
    timezone: "",
    theme_preference: "system" as "system" | "light" | "dark",
    preferred_task_radius: "",
    preferred_markets: "",
    task_types: [] as string[],
  });

  useEffect(() => {
    const p = (data?.profile ?? {}) as Record<string, unknown>;
    setForm({
      timezone: (p.timezone as string) ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
      theme_preference: ((p.theme_preference as string) ?? localStorage.getItem(THEME_KEY) ?? "system") as
        | "system" | "light" | "dark",
      preferred_task_radius: (p.preferred_task_radius as string) ?? "",
      preferred_markets: (p.preferred_markets as string) ?? "",
      task_types: (p.task_types as string[]) ?? [],
    });
  }, [data]);

  const mut = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success("Preferences saved");
      localStorage.setItem(THEME_KEY, form.theme_preference);
      applyTheme(form.theme_preference);
      qc.invalidateQueries({ queryKey: ["mySettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div>
      <SettingsHeader title="Preferences" description="Tailor the platform to how you work." />

      <SettingsCard
        title="Task preferences"
        footer={
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save preferences
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Label>Preferred task radius (miles)</Label>
          <Input
            value={form.preferred_task_radius}
            onChange={(e) => setForm((f) => ({ ...f, preferred_task_radius: e.target.value }))}
            placeholder="25"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Preferred markets</Label>
          <Input
            value={form.preferred_markets}
            onChange={(e) => setForm((f) => ({ ...f, preferred_markets: e.target.value }))}
            placeholder="Atlanta GA, Birmingham AL"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Preferred task types (comma separated)</Label>
          <Input
            value={form.task_types.join(", ")}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                task_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
            placeholder="Drive-by, Photos"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Display"
        footer={
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save preferences
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Input
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            placeholder="America/New_York"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Theme</Label>
          <Select
            value={form.theme_preference}
            onValueChange={(v: "system" | "light" | "dark") => {
              setForm((f) => ({ ...f, theme_preference: v }));
              applyTheme(v);
              localStorage.setItem(THEME_KEY, v);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsCard>
    </div>
  );
}