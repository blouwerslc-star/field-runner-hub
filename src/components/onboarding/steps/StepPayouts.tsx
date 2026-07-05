import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConnectStatus, startConnectOnboarding, openConnectDashboard } from "@/lib/stripe-connect.functions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function StepPayouts({ onDone }: { onDone: () => void }) {
  const statusFn = useServerFn(getConnectStatus);
  const startFn = useServerFn(startConnectOnboarding);
  const openFn = useServerFn(openConnectDashboard);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["connect-status"], queryFn: () => statusFn() });

  const start = useMutation({
    mutationFn: () =>
      startFn({
        data: {
          returnUrl: `${window.location.origin}/onboarding?step=payouts`,
          refreshUrl: `${window.location.origin}/onboarding?step=payouts`,
        },
      }),
    onSuccess: (res: any) => {
      if (res?.url) window.location.href = res.url;
      else toast.error(res?.error ?? "Could not start onboarding");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const openDash = useMutation({
    mutationFn: () => openFn(),
    onSuccess: (res: any) => {
      if (res?.url) window.open(res.url, "_blank", "noopener,noreferrer");
      qc.invalidateQueries({ queryKey: ["connect-status"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="size-4 animate-spin text-primary" />;
  const connected = !!data?.connected;
  const enabled = !!data?.payouts_enabled;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      <div className="flex items-start gap-3">
        {enabled ? (
          <CheckCircle2 className="size-5 text-emerald-400 mt-0.5" />
        ) : (
          <CreditCard className="size-5 text-primary mt-0.5" />
        )}
        <div>
          <div className="font-medium">
            {enabled ? "Direct deposit is active" : connected ? "Finish setting up direct deposit" : "Connect your bank"}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            We use Stripe Connect. Your bank details never touch our servers.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {enabled ? (
          <Button variant="outline" onClick={() => openDash.mutate()} disabled={openDash.isPending}>
            {openDash.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ExternalLink className="size-4 mr-2" />}
            Manage payout account
          </Button>
        ) : (
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {connected ? "Continue Stripe onboarding" : "Set up payouts"}
          </Button>
        )}
      </div>
    </div>
  );
}