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

type RoleParam = "runner" | "investor";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role === "investor" ? "investor" : "runner") as RoleParam,
    redirect: typeof s.redirect === "string" ? s.redirect : "/dashboard",
  }),
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create your REI Runner account" },
      { name: "description", content: "Sign up as a runner or investor to join the REI Runner marketplace." },
    ],
  }),
});

function SignupPage() {
  const { role, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<RoleParam>(role);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirect}`,
          data: { full_name: fullName, phone, role: activeRole },
        },
      });
      if (error) throw error;
      toast.success("Account created. Check your email to confirm, then sign in.");
      navigate({ to: "/login", search: { redirect } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      // Note: role from raw_user_meta_data not set for OAuth — user picks on first dashboard load if missing.
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${redirect}`,
        extraParams: { role: activeRole },
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

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-12">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <div className="w-full max-w-md">
        <Link to="/" aria-label="REI Runner home" className="flex justify-center mb-8">
          <BrandLogo size="md" />
        </Link>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick how you'll use REI Runner.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-xl">
            {(["runner", "investor"] as RoleParam[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRole(r)}
                className={`text-sm font-medium py-2 rounded-lg transition ${
                  activeRole === r
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                I'm {r === "runner" ? "a Runner" : "an Investor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="su-name">Full name</Label>
              <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-phone">Phone</Label>
              <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-pw">Password</Label>
              <Input id="su-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={100} />
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow" size="lg">
              {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Creating…</> : "Create account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link to="/login" search={{ redirect }} className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}