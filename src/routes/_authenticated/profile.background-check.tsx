import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BackgroundCheckCheckout } from "@/components/payments/BackgroundCheckCheckout";
import { getBackgroundCheckStatus } from "@/lib/background-check.functions";
import { BackgroundCheckIntakeForm } from "@/components/profiles/BackgroundCheckIntakeForm";
import { Loader2, CheckCircle2, XCircle, Clock, MessageCircleWarning } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile/background-check")({
  component: BackgroundCheckPage,
  head: () => ({ meta: [{ title: "Background Check — REI Runner" }] }),
});

function BackgroundCheckPage() {
  const fn = useServerFn(getBackgroundCheckStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["bg-check-status"],
    queryFn: () => fn(),
    refetchInterval: 15000,
  });
  const p = (data?.profile ?? {}) as any;
  const sub = (data?.submission ?? null) as any;
  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profile/background-check?paid=1`
    : "/profile/background-check";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      toast.success("Payment received — finish the secure intake form below (~5 min).", { duration: 8000 });
      params.delete("paid");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
      setTimeout(() => {
        document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []);

  const subStatus = (sub?.status as string | null) ?? null;
  const paid = !!p.background_check_paid_at;
  const step =
    p.background_check_verified ? 4
    : subStatus === "failed" ? 4
    : subStatus === "passed" ? 4
    : subStatus === "submitted" || subStatus === "in_review" ? 3
    : paid ? 2
    : 1;

  return (
    <DashboardShell
      title="Background Check Verification"
      subtitle="One-time $13.99 — secure intake, manually reviewed. Unlocks your Verified badge once approved."
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : (
        <>
          <Stepper step={step} />
          {renderBody()}
        </>
      )}
    </DashboardShell>
  );

  function renderBody() {
    if (isLoading) return null;
    if (p.background_check_verified) return (
      <Done icon="ok" title="You're fully verified." body="Your background check passed. The Verified badge is now shown on your profile." />
    );
    if (subStatus === "failed") return (
      <Done icon="fail" title="Background check did not pass" body={sub?.admin_notes ?? "Unfortunately your background check was not approved. Contact support if you believe this is a mistake."} />
    );
    if (subStatus === "needs_info") return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
        <div className="flex items-center gap-2 font-medium text-amber-300">
          <MessageCircleWarning className="size-5" /> We need more information
        </div>
        <p className="text-sm text-muted-foreground">{sub?.needs_info_reason ?? sub?.admin_notes ?? "Please review and resubmit your information."}</p>
        <BackgroundCheckIntakeForm
          defaults={{ full_name: p.full_name, email: p.email, phone: p.phone, city: p.city, state: p.state }}
          onSubmitted={() => qc.invalidateQueries({ queryKey: ["bg-check-status"] })}
        />
      </div>
    );
    if (subStatus === "submitted" || subStatus === "in_review") return (
      <div className="rounded-2xl border border-border bg-card/60 p-8 text-center space-y-3">
        <Clock className="size-10 text-primary mx-auto" />
        <h2 className="text-xl font-semibold">In review — typically 1–3 business days</h2>
        <p className="text-sm text-muted-foreground">
          Submitted {sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString() : ""}. We'll email you when there's a decision.
        </p>
        <p className="text-xs text-muted-foreground">
          On file: {sub?.legal_first_name} {sub?.legal_last_name} · SSN ending in {sub?.ssn_last4} · {sub?.current_city}, {sub?.current_state}
        </p>
        <Link to="/profile/verification">
          <Button variant="outline">Back to verification</Button>
        </Link>
      </div>
    );
    if (paid) return (
      <div className="rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="text-lg font-semibold mb-1">Secure intake form</h2>
        <p className="text-xs text-muted-foreground mb-5">
          We need a few details to run your background check. All sensitive fields are encrypted.
        </p>
        <BackgroundCheckIntakeForm
          defaults={{ full_name: p.full_name, email: p.email, phone: p.phone, city: p.city, state: p.state }}
          onSubmitted={() => qc.invalidateQueries({ queryKey: ["bg-check-status"] })}
        />
      </div>
    );
    return (
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <div className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
            <h2 className="text-base font-semibold">Why we require this</h2>
            <p className="text-sm text-muted-foreground">
              Investors hand over access to properties worth hundreds of thousands of dollars. Verified runners get prioritized in search, show a Verified badge, and consistently win more tasks.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Think of the $13.99 as an investment in yourself.</strong> Most runners earn this back on their first or second job.
            </p>
          </div>
          <h2 className="text-lg font-semibold">How it works</h2>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
            <li>Pay the one-time $13.99 fee.</li>
            <li>Fill out a secure intake form (legal name, DOB, address history, ID photo).</li>
            <li>Our team reviews and runs the check — typically 1–3 business days.</li>
            <li>Your Verified badge appears as soon as you're approved.</li>
          </ol>
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              All sensitive fields are encrypted at rest. We use them solely to verify identity and run the background check.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-2">
          <BackgroundCheckCheckout returnUrl={returnUrl} />
        </div>
      </div>
    );
  }
}

function Stepper({ step }: { step: number }) {
  const items = ["Pay", "Submit info", "Review", "Result"];
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs">
      {items.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span className={
              "size-6 rounded-full grid place-items-center text-[11px] border " +
              (done ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                : active ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border text-muted-foreground")
            }>{done ? "✓" : n}</span>
            <span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {n < items.length && <span className="text-muted-foreground/40">›</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Done({ icon, title, body }: { icon: "ok" | "fail"; title: string; body: string }) {
  const ok = icon === "ok";
  return (
    <div className={
      "rounded-2xl border p-8 text-center space-y-3 " +
      (ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5")
    }>
      {ok ? <CheckCircle2 className="size-10 text-emerald-400 mx-auto" /> : <XCircle className="size-10 text-destructive mx-auto" />}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
      <Link to={ok ? "/profile/verification" : "/help"}>
        <Button variant="outline">{ok ? "Back to verification" : "Contact support"}</Button>
      </Link>
    </div>
  );
}