import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getBackgroundCheckStatus } from "@/lib/background-check.functions";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export function StepBackgroundCheck({ onDone: _onDone }: { onDone: () => void }) {
  const fn = useServerFn(getBackgroundCheckStatus);
  const { data, isLoading } = useQuery({ queryKey: ["bg-check-status"], queryFn: () => fn(), refetchInterval: 30000 });
  if (isLoading) return <Loader2 className="size-4 animate-spin text-primary" />;
  const p = (data?.profile ?? {}) as any;
  const sub = (data?.submission ?? null) as any;
  const paid = !!p.background_check_paid_at;
  const verified = !!p.background_check_verified;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      {verified ? (
        <Row icon={<CheckCircle2 className="size-5 text-emerald-400" />} title="Background check passed" body="The Verified badge is now on your profile." />
      ) : sub?.status === "submitted" || sub?.status === "in_review" ? (
        <Row icon={<Clock className="size-5 text-amber-400" />} title="In review — typically 1–3 business days" body="We'll notify you the moment there's a decision." />
      ) : sub?.status === "needs_info" ? (
        <Row icon={<AlertTriangle className="size-5 text-red-400" />} title="We need more info" body={sub.needs_info_reason ?? "Open the background check page to resubmit."} />
      ) : paid ? (
        <Row icon={<ShieldCheck className="size-5 text-primary" />} title="Payment received" body="Fill out the secure intake form to start your check." />
      ) : (
        <Row
          icon={<ShieldCheck className="size-5 text-primary" />}
          title="Unlock interior-access tasks — $13.99 one-time"
          body="Investors trust verified runners with lockbox codes and walkthroughs. Most runners earn this back on their first job."
        />
      )}
      <Link to="/profile/background-check">
        <Button className="bg-gradient-to-r from-primary to-primary/80">
          {verified
            ? "Review status"
            : sub?.status === "submitted" || sub?.status === "in_review"
              ? "View status"
              : sub?.status === "needs_info"
                ? "Resubmit info"
                : paid
                  ? "Continue intake form"
                  : "Start background check"}
        </Button>
      </Link>
    </div>
  );
}

function Row({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-0.5">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <p className="text-sm text-muted-foreground mt-1">{body}</p>
      </div>
    </div>
  );
}