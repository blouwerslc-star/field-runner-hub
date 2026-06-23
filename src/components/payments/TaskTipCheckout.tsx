import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTaskTipCheckout } from "@/lib/payments.functions";

export function TaskTipCheckout({
  taskId,
  amountCents,
  returnUrl,
}: {
  taskId: string;
  amountCents: number;
  returnUrl: string;
}) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createTaskTipCheckout({
      data: { taskId, amountCents, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };
  return (
    <div id="tip-checkout" className="min-h-[480px]">
      <EmbeddedCheckoutProvider
        // Re-mount when amount changes so Stripe fetches a fresh session
        key={amountCents}
        stripe={getStripe()}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}