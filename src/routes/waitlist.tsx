import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Mail, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { trackLead, trackSignup } from "@/lib/tracking";
import { joinRunnerWaitlist } from "@/lib/waitlist.functions";

export const Route = createFileRoute("/waitlist")({
  validateSearch: (s: Record<string, unknown>) => ({
    submitted: s.submitted === "1" || s.submitted === 1 || s.submitted === true ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Join the Runner Waitlist — REI Runner" },
      { name: "description", content: "Runner signups are temporarily paused. Add yourself to the waitlist and we'll email you when we reopen in your market." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Join the Runner Waitlist — REI Runner" },
      { property: "og:description", content: "Runner signups are temporarily paused. Join the waitlist to hear when they reopen." },
      { property: "og:url", content: "https://reirunner.com/waitlist" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/waitlist" }],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  const { submitted } = Route.useSearch();
  if (submitted) return <WaitlistThankYou />;
  return <WaitlistForm />;
}

function WaitlistThankYou() {
  useEffect(() => {
    trackLead();
    trackSignup("email");
  }, []);
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-xl w-full text-center space-y-6 rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          You're on the waitlist
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Thanks for joining the REI Runner runner waitlist. We'll email you the
          moment runner signups reopen in your market.
        </p>
        <div className="flex items-start gap-3 text-left bg-muted/40 border border-border rounded-lg p-4">
          <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Keep an eye on your <span className="text-foreground font-medium">email inbox</span> — and
            don't forget to check your <span className="text-foreground font-medium">spam or junk folder</span> — for
            future updates and next steps from our team.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}

function WaitlistForm() {
  const navigate = useNavigate();
  const submit = useServerFn(joinRunnerWaitlist);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    market: "",
    notes: "",
    website: "", // honeypot
  });

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Please share your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({ data: { ...form, source: "waitlist_page" } });
      navigate({ to: "/waitlist", search: { submitted: true } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-14 sm:py-20">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
            <Sparkles className="size-3.5" /> Runner waitlist
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Join the runner waitlist
          </h1>
          <p className="mt-3 text-muted-foreground">
            Runner signups are temporarily paused while we focus on onboarding
            investors. Drop your details and we'll email you the moment
            signups reopen in your market.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 sm:p-8 shadow-card space-y-5"
        >
          {/* honeypot */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wl-name">Full name</Label>
              <Input
                id="wl-name"
                required
                autoComplete="name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-email">Email</Label>
              <Input
                id="wl-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wl-phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="wl-phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-market">Market focus <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="wl-market"
                placeholder="e.g. Detroit metro"
                value={form.market}
                onChange={(e) => set("market", e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wl-city">City</Label>
              <Input
                id="wl-city"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-state">State</Label>
              <Input
                id="wl-state"
                autoComplete="address-level1"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-notes">Anything we should know? <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="wl-notes"
              rows={4}
              placeholder="Experience, availability, transportation, etc."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Adding you…</>
            ) : (
              "Join the waitlist"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" search={{ redirect: "/dashboard" }} className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}