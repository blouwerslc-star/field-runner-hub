import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTaskFundingCheckout } from "@/lib/payments.functions";
import { useState } from "react";
import { Gift } from "lucide-react";

export function TaskFundingCheckout({ taskId, returnUrl }: { taskId: string; returnUrl: string }) {
  const [breakdown, setBreakdown] = useState<{
    totalCents: number; promoAppliedCents: number; chargeCents: number;
  } | null>(null);
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createTaskFundingCheckout({
      data: { taskId, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    if (result.breakdown) setBreakdown(result.breakdown);
    return result.clientSecret;
  };
  return (
    <div id="checkout" className="min-h-[480px]">
      {breakdown && breakdown.promoAppliedCents > 0 && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Gift className="size-4 text-primary" /> First Task Free credit applied
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Task cost</dt>
            <dd className="text-right">${(breakdown.totalCents / 100).toFixed(2)}</dd>
            <dt className="text-muted-foreground">Promotional credit</dt>
            <dd className="text-right text-primary">−${(breakdown.promoAppliedCents / 100).toFixed(2)}</dd>
            <dt className="font-semibold pt-1 border-t border-border/50 mt-1">Amount due</dt>
            <dd className="text-right font-semibold pt-1 border-t border-border/50 mt-1">
              ${(breakdown.chargeCents / 100).toFixed(2)}
            </dd>
          </dl>
        </div>
      )}
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}