import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset your password — REI Runner" },
      { name: "description", content: "Reset your REI Runner password. Enter your email and we'll send you a secure link to set a new one." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/forgot-password" }],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send reset email";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-12">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <div className="w-full max-w-md">
        <Link to="/" aria-label="REI Runner home" className="flex justify-center mb-8">
          <BrandLogo size="md" />
        </Link>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email on your account and we'll send you a secure link to set a new password.
          </p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="size-4 text-primary" /> Check your inbox
                </div>
                <p className="mt-1 text-muted-foreground">
                  If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
                  The link expires in 1 hour.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { setSent(false); setEmail(""); }}>
                Send to a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={200}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow" size="lg">
                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Sending…</> : "Send reset link"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Remembered it?{" "}
            <Link to="/login" search={{ redirect: "/dashboard" }} className="text-primary hover:underline">Back to sign in</Link>
          </p>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Can't access your email?{" "}
            <Link to="/about" className="text-primary hover:underline">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}