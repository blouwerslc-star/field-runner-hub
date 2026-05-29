import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySettings } from "@/lib/settings.functions";
import { ComingSoon, SettingsCard, SettingsHeader } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: SecuritySettings,
});

function SecuritySettings() {
  const fetchSettings = useServerFn(getMySettings);
  const { data } = useQuery({ queryKey: ["mySettings"], queryFn: () => fetchSettings() });
  const email = data?.auth?.email ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  async function changePassword() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
    }
  }

  async function sendReset() {
    if (!email) return;
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login",
    });
    setResetBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  }

  return (
    <div>
      <SettingsHeader title="Security" description="Protect your account and sign-in." />

      <SettingsCard
        title="Change password"
        footer={
          <Button onClick={changePassword} disabled={busy}>
            {busy ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <KeyRound className="size-3.5 mr-1.5" />}
            Update password
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Confirm new password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Password reset email"
        description={`Send a reset link to ${email || "your account email"}.`}
        footer={
          <Button variant="outline" onClick={sendReset} disabled={resetBusy || !email}>
            {resetBusy ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Mail className="size-3.5 mr-1.5" />}
            Send reset email
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          Useful if you'd rather reset your password through email.
        </p>
      </SettingsCard>

      <ComingSoon title="Two-factor authentication" description="Add a second factor to your sign-in." />
      <ComingSoon title="Active sessions" description="See devices currently signed into your account." />
      <ComingSoon title="Login history" description="Review recent sign-in activity." />
    </div>
  );
}