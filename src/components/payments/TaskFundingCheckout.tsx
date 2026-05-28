import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTaskFundingCheckout } from "@/lib/payments.functions";

export function TaskFundingCheckout({ taskId, returnUrl }: { taskId: string; returnUrl: string }) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createTaskFundingCheckout({
      data: { taskId, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };
  return (
    <div id="checkout" className="min-h-[480px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}