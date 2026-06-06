import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/dashboard",
  }),
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — REI Runner" },
      { name: "description", content: "Sign in to your REI Runner account to post property tasks, manage runners, accept jobs, and track payouts in your local market." },
      { property: "og:title", content: "Sign in — REI Runner" },
      { property: "og:description", content: "Sign in to REI Runner to manage tasks, runners, and payouts in your local real estate market." },
      { property: "og:url", content: "https://reirunner.com/login" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/login" }],
  }),
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: redirect });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${redirect}`,
      });
      if (result.redirected) return;
      if (result.error) throw result.error;
      navigate({ to: redirect });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setLoading(false);
    }
  }

  async function handleApple() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}${redirect}`,
      });
      if (result.redirected) return;
      if (result.error) throw result.error;
      navigate({ to: redirect });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Apple sign-in failed";
      toast.error(msg);
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your REI Runner account.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="li-email">Email</Label>
              <Input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="li-pw">Password</Label>
              <Input id="li-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={100} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow" size="lg">
              {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Signing in…</> : "Sign in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>

          <Button type="button" variant="outline" className="w-full mt-2" onClick={handleApple} disabled={loading}>
            Continue with Apple
          </Button>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            New here?{" "}
            <Link to="/signup" search={{ role: "runner", redirect }} className="text-primary hover:underline">Create an account</Link>
          </p>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Forgot your password?{" "}
            <Link to="/forgot-password" className="text-primary hover:underline">Reset it</Link>
          </p>
        </div>
      </div>
    </div>
  );
}