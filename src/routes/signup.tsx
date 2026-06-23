import { createFileRoute, Link, useNavigate, redirect as routerRedirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { finalizeSignupProfile } from "@/lib/signup.functions";
import { trackSignup } from "@/lib/tracking";
import { getPendingReferralCode, clearPendingReferralCode } from "@/lib/referral-tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type RoleParam = "runner" | "investor";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role === "investor" || s.role === "runner" ? s.role : undefined) as RoleParam | undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const to = (search as { redirect?: string }).redirect || "/dashboard";
      throw routerRedirect({ to });
    }
  },
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create your REI Runner account" },
      { name: "description", content: "Sign up as a runner or investor to join the REI Runner marketplace." },
      { property: "og:title", content: "Create your REI Runner account" },
      { property: "og:description", content: "Join REI Runner as a runner to earn on property tasks, or as an investor to hire local boots-on-the-ground in your market." },
      { property: "og:url", content: "https://reirunner.com/signup" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/signup" }],
  }),
});

function SignupPage() {
  const { role, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const finalizeProfile = useServerFn(finalizeSignupProfile);
  const [activeRole, setActiveRole] = useState<RoleParam | null>(role ?? null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [debug, setDebug] = useState<{ authUserId: string; email: string; role: RoleParam; profileStatus: string } | null>(null);

  const dashboardFor = (r: RoleParam) => (r === "investor" ? "/dashboard/investor" : "/dashboard/runner");
  const postSignupRedirect = activeRole ? (redirect ?? dashboardFor(activeRole)) : (redirect ?? "/dashboard");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRole) {
      toast.error("Please choose how you'll use REI Runner.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setFormError(null);
    setDebug(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${postSignupRedirect}`,
          data: {
            full_name: fullName,
            phone,
            role: activeRole,
            referral_code: getPendingReferralCode() ?? undefined,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Sign-up didn't return a user. Please try again.");
      clearPendingReferralCode();
      let profileStatus = "Created by database trigger; sign in after email verification to confirm profile access.";
      if (data.session) {
        const result = await finalizeProfile({
          data: {
            userId: data.user.id,
            email: data.user.email ?? email,
            full_name: fullName,
            phone,
            role: activeRole,
          },
        });
        profileStatus = result.profileStatus;
      }
      setDebug({ authUserId: data.user.id, email: data.user.email ?? email, role: activeRole, profileStatus });
      trackSignup(activeRole);
      if (!data.session) {
        toast.success("Account created. Check your email to confirm, then sign in.");
        return;
      }
      toast.success("Account created.");
      navigate({ to: postSignupRedirect, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!activeRole) {
      toast.error("Please choose how you'll use REI Runner.");
      return;
    }
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${postSignupRedirect}`,
        extraParams: { role: activeRole },
      });
      if (result.redirected) return;
      if (result.error) throw result.error;
      navigate({ to: postSignupRedirect, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setLoading(false);
    }
  }

  async function handleApple() {
    if (!activeRole) {
      toast.error("Please choose how you'll use REI Runner.");
      return;
    }
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}${postSignupRedirect}`,
        extraParams: { role: activeRole },
      });
      if (result.redirected) return;
      if (result.error) throw result.error;
      navigate({ to: postSignupRedirect, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Apple sign-in failed";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-12">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <div className="w-full max-w-2xl">
        <Link to="/" aria-label="REI Runner home" className="flex justify-center mb-8">
          <BrandLogo size="md" />
        </Link>

        {!activeRole ? (
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
            <h1 className="text-2xl font-bold tracking-tight text-center">How will you use REI Runner?</h1>
            <p className="mt-1 text-sm text-muted-foreground text-center">Choose one to continue. You can't create an account without picking a role.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {([
                {
                  role: "runner" as const,
                  title: "Become a Runner",
                  desc: "Get paid completing property photos, walkthroughs, occupancy checks, and other field tasks.",
                },
                {
                  role: "investor" as const,
                  title: "Join as an Investor",
                  desc: "Post property tasks and hire local runners in our active U.S. markets.",
                },
              ]).map((c) => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => setActiveRole(c.role)}
                  className="text-left rounded-xl border border-border bg-background/60 p-5 hover:border-primary hover:shadow-glow transition group"
                >
                  <div className="text-lg font-semibold tracking-tight group-hover:text-primary">{c.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
                  <div className="mt-4 text-sm font-medium text-primary">Continue →</div>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <button
            type="button"
            onClick={() => setActiveRole(null)}
            className="text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            ← Change role
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Create your {activeRole} account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signing up as {activeRole === "runner" ? "a Runner" : "an Investor"}.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Sign-up failed</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            {debug && (
              <Alert>
                <AlertTitle>Signup debug</AlertTitle>
                <AlertDescription className="space-y-1 text-xs">
                  <div>Auth user id: {debug.authUserId}</div>
                  <div>Email: {debug.email}</div>
                  <div>Selected role: {debug.role}</div>
                  <div>Profile insert: {debug.profileStatus}</div>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="su-name">Full name</Label>
              <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} autoComplete="name" autoCapitalize="words" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-phone">Phone</Label>
              <Input id="su-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-pw">Password</Label>
              <div className="relative">
                <Input id="su-pw" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={100} autoComplete="new-password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-pw2">Confirm password</Label>
              <Input id="su-pw2" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} maxLength={100} autoComplete="new-password" />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-destructive">Passwords don't match.</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow" size="lg">
              {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Creating…</> : "Create account"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Encrypted sign-up. We never share your contact info.
            </p>
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
            Already have an account?{" "}
            <Link to="/login" search={{ redirect: postSignupRedirect }} className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
        )}
      </div>
    </div>
  );
}