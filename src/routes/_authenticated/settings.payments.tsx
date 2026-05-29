import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getMySettings, listMyPayments } from "@/lib/settings.functions";
import { ComingSoon, SettingsCard, SettingsHeader } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/payments")({
  component: PaymentSettings,
});

function fmtCents(c: number | null | undefined) {
  if (typeof c !== "number") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

function PaymentSettings() {
  const fetchSettings = useServerFn(getMySettings);
  const fetchPayments = useServerFn(listMyPayments);
  const { data: settings } = useQuery({ queryKey: ["mySettings"], queryFn: () => fetchSettings() });
  const { data: pay, isLoading } = useQuery({ queryKey: ["myPayments"], queryFn: () => fetchPayments() });

  const roles = settings?.roles ?? [];
  const isRunner = roles.includes("runner");
  const isInvestor = roles.includes("investor");
  const userId = settings?.auth?.userId ?? "";

  const payments = pay?.payments ?? [];

  const runnerPaid = payments
    .filter((p) => p.runner_id === userId && p.status === "paid")
    .reduce((s, p) => s + (p.runner_payout_cents ?? 0), 0);
  const runnerPending = payments
    .filter((p) => p.runner_id === userId && p.status !== "paid")
    .reduce((s, p) => s + (p.runner_payout_cents ?? 0), 0);

  return (
    <div>
      <SettingsHeader title="Payments" description="Payouts, billing and payment methods." />

      {isRunner && (
        <>
          <SettingsCard title="Earnings">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-md border border-border/60 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Paid out</div>
                <div className="text-2xl font-semibold mt-1">{fmtCents(runnerPaid)}</div>
              </div>
              <div className="rounded-md border border-border/60 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Pending</div>
                <div className="text-2xl font-semibold mt-1">{fmtCents(runnerPending)}</div>
              </div>
            </div>
          </SettingsCard>
          <ComingSoon title="Stripe Connect" description="Connect your bank to receive direct payouts." />
          <ComingSoon title="Tax forms" description="W-9 / 1099 collection and downloads." />
        </>
      )}

      {isInvestor && (
        <>
          <ComingSoon title="Default payment method" description="Save a card for one-click task funding." />
          <ComingSoon title="Invoices" description="Download invoices for funded tasks." />
        </>
      )}

      <SettingsCard title={isRunner ? "Payout history" : "Billing history"}>
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2">Date</th><th>Status</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="capitalize">{p.status}</td>
                    <td className="text-right">
                      {fmtCents(isRunner ? p.runner_payout_cents : p.amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}