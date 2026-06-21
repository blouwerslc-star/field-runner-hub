import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  createPasswordAccount,
  getPasswordValidationError,
  type SignupRole,
} from "@/lib/signup-client";
import { trackSignup } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type RoleParam = SignupRole;

const DEAL_VOLUME_OPTIONS = [
  "1-3 deals / month",
  "4-10 deals / month",
  "11-25 deals / month",
  "25+ deals / month",
];

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role === "investor" || s.role === "runner" ? s.role : undefined) as RoleParam | undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
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
  const [activeRole, setActiveRole] = useState<RoleParam | null>(role ?? null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [marketsServed, setMarketsServed] = useState("");
  const [dealVolume, setDealVolume] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState<{
    email: string;
    needsEmailVerification: boolean;
    redirectTo: string;
  } | null>(null);

  const dashboardFor = (r: RoleParam) => (r === "investor" ? "/dashboard/investor" : "/dashboard/runner");
  const postSignupRedirect = activeRole ? (redirect ?? dashboardFor(activeRole)) : (redirect ?? "/dashboard");

  function resetRole() {
    setActiveRole(null);
    setFormError(null);
    setAccountCreated(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRole) {
      toast.error("Please choose how you will use REI Runner.");
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedCompany = companyName.trim();
    const trimmedMarkets = marketsServed.trim();

    if (!trimmedName || !trimmedEmail) {
      toast.error("Please enter your name and email.");
      return;
    }
    if (activeRole === "investor" && (!trimmedMarkets || !dealVolume)) {
      toast.error("Please enter your markets and monthly deal volume.");
      return;
    }

    const passwordError = getPasswordValidationError(password, confirmPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const result = await createPasswordAccount({
        email: trimmedEmail,
        password,
        fullName: trimmedName,
        phone: trimmedPhone,
        role: activeRole,
        redirectTo: `${window.location.origin}${postSignupRedirect}`,
        extra:
          activeRole === "investor"
            ? {
                company_name: trimmedCompany,
                markets_served: trimmedMarkets,
                monthly_deal_volume: dealVolume,
              }
            : {},
      });

      trackSignup(activeRole);

      if (result.needsEmailVerification) {
        setAccountCreated({
          email: result.email,
          needsEmailVerification: true,
          redirectTo: postSignupRedirect,
        });
        toast.success("Account created. Check your email to confirm.");
        return;
      }

      toast.success("Account created.");
      navigate({ to: postSignupRedirect });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-up failed";
      setFormError(msg);
      toast.error(msg);
    } finally {
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

        {accountCreated ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card text-center">
            <div className="mx-auto mb-4 size-14 rounded-full bg-primary/15 grid place-items-center">
              {accountCreated.needsEmailVerification ? (
                <MailCheck className="size-7 text-primary" />
              ) : (
                <CheckCircle2 className="size-7 text-primary" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {accountCreated.needsEmailVerification ? "Verify your email" : "Account created"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <strong>{accountCreated.email}</strong>. After you verify it, sign in with the password you just created.
            </p>
            <Button asChild className="mt-6 w-full bg-gradient-primary shadow-glow" size="lg">
              <Link to="/login" search={{ redirect: accountCreated.redirectTo }}>Go to sign in</Link>
            </Button>
          </div>
        ) : !activeRole ? (
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
            <h1 className="text-2xl font-bold tracking-tight text-center">How will you use REI Runner?</h1>
            <p className="mt-1 text-sm text-muted-foreground text-center">Choose one to continue. You cannot create an account without picking a role.</p>

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
                  desc: "Post property tasks and hire local runners in your active U.S. markets.",
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
                  <div className="mt-4 text-sm font-medium text-primary">Continue</div>
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
              onClick={resetRole}
              className="text-xs text-muted-foreground hover:text-foreground mb-3"
            >
              Change role
            </button>
            <h1 className="text-2xl font-bold tracking-tight">
              Create your {activeRole === "investor" ? "Investor" : "Runner"} account
            </h1>
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
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Full name</Label>
                <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-phone">Phone</Label>
                <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" />
              </div>

              {activeRole === "investor" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-company">Company name</Label>
                    <Input id="su-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={150} autoComplete="organization" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-markets">Markets served</Label>
                    <Input id="su-markets" value={marketsServed} onChange={(e) => setMarketsServed(e.target.value)} required maxLength={300} placeholder="e.g. Atlanta GA, Charlotte NC" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Monthly deal volume</Label>
                    <Select value={dealVolume} onValueChange={setDealVolume}>
                      <SelectTrigger aria-label="Monthly deal volume">
                        <SelectValue placeholder="Select volume" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEAL_VOLUME_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="su-pw">Password</Label>
                <Input id="su-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={100} autoComplete="new-password" />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-pw-confirm">Confirm password</Label>
                <Input id="su-pw-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} maxLength={100} autoComplete="new-password" />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow" size="lg">
                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Creating...</> : "Create account"}
              </Button>
            </form>

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
