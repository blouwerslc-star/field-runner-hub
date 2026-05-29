import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPlatformSettings, updatePlatformSetting } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComingSoon, SettingsCard, SettingsHeader } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    if (!(roles ?? []).some((r) => r.role === "admin")) {
      throw redirect({ to: "/settings/account" });
    }
  },
  component: AdminSettings,
});

function AdminSettings() {
  const fetchSettings = useServerFn(getPlatformSettings);
  const save = useServerFn(updatePlatformSetting);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["platformSettings"], queryFn: () => fetchSettings() });

  const [feePct, setFeePct] = useState("");
  useEffect(() => {
    const settings = data?.settings ?? [];
    const fee = settings.find((s) => s.key === "platform_fee_percentage");
    if (fee) setFeePct(fee.value);
  }, [data]);

  const mut = useMutation({
    mutationFn: (vars: { key: string; value: string }) => save({ data: vars }),
    onSuccess: () => {
      toast.success("Platform setting saved");
      qc.invalidateQueries({ queryKey: ["platformSettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div>
      <SettingsHeader title="Admin settings" description="Platform-wide controls. Use with care." />

      <SettingsCard
        title="Platform fee"
        description="Percentage taken from each task payout."
        footer={
          <Button
            onClick={() => mut.mutate({ key: "platform_fee_percentage", value: feePct })}
            disabled={mut.isPending || !feePct}
          >
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save
          </Button>
        }
      >
        <div className="space-y-1.5 max-w-xs">
          <Label>Fee percentage</Label>
          <Input
            value={feePct}
            onChange={(e) => setFeePct(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="10"
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Verification & featured profiles">
        <p className="text-sm text-muted-foreground">
          Manage user verification and featured listings from the{" "}
          <Link to="/admin/profiles" className="underline">profiles admin</Link>.
        </p>
      </SettingsCard>

      <ComingSoon title="Default task statuses" description="Configure default lifecycle for new tasks." />
      <ComingSoon title="Support inbox" description="Review and respond to user support requests." />
      <ComingSoon title="System notifications" description="Send platform-wide announcements." />
    </div>
  );
}