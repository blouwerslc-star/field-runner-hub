import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set a new password — REI Runner" },
      { name: "description", content: "Set a new password for your REI Runner account." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery session in the URL hash; just confirm a session lands.
    let unsub: { unsubscribe: () => void } | null = null;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    unsub = data.subscription;
    return () => { unsub?.unsubscribe(); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-12">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <div className="w-full max-w-md">
        <Link to="/" aria-label="REI Runner home" className="flex justify-center mb-8">
          <BrandLogo size="md" />
        </Link>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password you'll remember.
          </p>

          {!ready ? (
            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              This page only works when opened from the password reset email link. If you arrived here directly,{" "}
              <Link to="/forgot-password" className="text-primary hover:underline">request a new link</Link>.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rp-pw">New password</Label>
                <Input id="rp-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={100} autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp-pw2">Confirm new password</Label>
                <Input id="rp-pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={100} autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow" size="lg">
                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Updating…</> : <><KeyRound className="size-4 mr-2" /> Update password</>}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}