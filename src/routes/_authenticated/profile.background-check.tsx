import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BackgroundCheckCheckout } from "@/components/payments/BackgroundCheckCheckout";
import { getBackgroundCheckStatus } from "@/lib/background-check.functions";
import { Loader2, ShieldCheck, ExternalLink, CheckCircle2 } from "lucide-react";
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
    refetchInterval: 8000,
  });
  const p = (data?.profile ?? {}) as any;
  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profile/background-check?paid=1`
    : "/profile/background-check";

  return (
    <DashboardShell
      title="Background Check Verification"
      subtitle="Powered by Checkr. One-time $39.99 — unlocks your Level 4 Verified badge."
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
      ) : p.checkr_invitation_url ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 space-y-4 text-center">
          <ShieldCheck className="size-10 text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Finish your background check</h2>
          <p className="text-sm text-muted-foreground">
            We received your payment. Complete the secure Checkr form to submit your info.
            Most reports finish in 24–72 hours.
          </p>
          <a href={p.checkr_invitation_url} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              Open Checkr <ExternalLink className="size-4" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">
            Status: <span className="capitalize">{p.checkr_status?.replace(/_/g, " ") || "pending"}</span>
          </p>
        </div>
      ) : p.background_check_paid_at ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Generating your Checkr invitation…</h2>
          <p className="text-sm text-muted-foreground">
            This usually takes a few seconds. Refresh if it doesn't appear.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <div className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
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
                Run by <strong>Checkr</strong>, the same trusted provider used by Uber, DoorDash, and Instacart.
                Your data is encrypted and never shared.
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