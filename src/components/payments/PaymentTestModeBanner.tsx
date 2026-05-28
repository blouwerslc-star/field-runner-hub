const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/15 border-b border-destructive/30 px-4 py-2 text-center text-sm text-destructive">
        Production checkout is not configured. Complete Stripe go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300">
        Payments are in test mode. Use card 4242 4242 4242 4242 with any future expiry & CVC.
      </div>
    );
  }
  return null;
}