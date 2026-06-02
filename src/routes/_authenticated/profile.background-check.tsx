import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BackgroundCheckCheckout } from "@/components/payments/BackgroundCheckCheckout";
import { getBackgroundCheckStatus } from "@/lib/background-check.functions";
import { Loader2, ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile/background-check")({
  component: BackgroundCheckPage,
  head: () => ({ meta: [{ title: "Background Check — REI Runner" }] }),
});

function BackgroundCheckPage() {
  const fn = useServerFn(getBackgroundCheckStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["bg-check-status"],
    queryFn: () => fn(),
    refetchInterval: 15000,
  });
  const p = (data?.profile ?? {}) as any;
  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profile/background-check?paid=1`
    : "/profile/background-check";

  const status = (p.checkr_status as string | null) ?? null;

  return (
    <DashboardShell
      title="Background Check Verification"
      subtitle="One-time $13.99 — unlocks your Verified badge once approved."
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : p.background_check_verified ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-3">
          <CheckCircle2 className="size-10 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-semibold">You're fully verified.</h2>
          <p className="text-sm text-muted-foreground">
            Your background check passed. The Verified badge is now shown on your profile.
          </p>
          <Link to="/profile/verification">
            <Button variant="outline">Back to verification</Button>
          </Link>
        </div>
      ) : status === "failed" ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <XCircle className="size-10 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Background check did not pass</h2>
          <p className="text-sm text-muted-foreground">
            Unfortunately your background check was not approved. Contact support if you believe this is a mistake.
          </p>
          <Link to="/help">
            <Button variant="outline">Contact support</Button>
          </Link>
        </div>
      ) : p.background_check_paid_at ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center space-y-3">
          <Clock className="size-10 text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Background check in progress</h2>
          <p className="text-sm text-muted-foreground">
            We received your payment on{" "}
            {new Date(p.background_check_paid_at).toLocaleDateString()}. Our team has been notified and will run your
            check within 1 business day. Most results come back in 24–72 hours after that.
          </p>
          <p className="text-xs text-muted-foreground">
            Status: <span className="capitalize font-medium">{status || "pending"}</span>
          </p>
          <Link to="/profile/verification">
            <Button variant="outline">Back to verification</Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <div className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <h2 className="text-base font-semibold text-foreground">Why we require this</h2>
              <p className="text-sm text-muted-foreground">
                Investors are handing over access to properties worth hundreds of thousands of dollars — sometimes
                lockbox codes, sometimes keys, sometimes sensitive tenant info. Before they trust a runner they've never
                met, they need to know that person has been vetted. A verified background check is the single biggest
                signal of trust on this platform.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Think of the $13.99 as an investment in yourself.</strong> Verified
                runners get prioritized in search, show a Verified badge on every bid, and consistently win more tasks
                than unverified ones. More trust → more tasks → more money in your pocket. Most runners earn this back
                on their first or second job.
              </p>
            </div>
            <h2 className="text-lg font-semibold">What's included</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• SSN trace & address history</li>
              <li>• National criminal database search</li>
              <li>• County criminal records (7 years)</li>
              <li>• Sex offender registry</li>
              <li>• Global watchlist screening</li>
            </ul>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Background checks are run through <strong>Checkr</strong>, the same provider used by Uber, DoorDash,
                and Instacart. Your data is encrypted and never shared.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-2">
            <BackgroundCheckCheckout returnUrl={returnUrl} />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}