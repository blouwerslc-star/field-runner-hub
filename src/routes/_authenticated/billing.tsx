import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPayoutMethods, addPayoutMethod, removePayoutMethod,
  listMyInvoices, requestPayout, listMyPayoutRequests, getEarningsSummary,
} from "@/lib/billing.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, DollarSign, ArrowDownToLine, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { startConnectOnboarding, getConnectStatus, openConnectDashboard } from "@/lib/stripe-connect.functions";
import { DashboardLoadingSkeleton, RouteErrorState } from "@/components/dashboard/UiStates";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
  head: () => ({ meta: [{ title: "Billing & payouts — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <DashboardShell title="Billing & payouts">
      <RouteErrorState error={error} reset={reset} title="Couldn't load billing" />
    </DashboardShell>
  ),
});

function fmt(c?: number | null) {
  return `$${((c ?? 0) / 100).toFixed(2)}`;
}

function BillingPage() {
  const methodsFn = useServerFn(listPayoutMethods);
  const addMethodFn = useServerFn(addPayoutMethod);
  const removeMethodFn = useServerFn(removePayoutMethod);
  const invoicesFn = useServerFn(listMyInvoices);
  const requestFn = useServerFn(requestPayout);
  const requestsFn = useServerFn(listMyPayoutRequests);
  const summaryFn = useServerFn(getEarningsSummary);
  const connectStatusFn = useServerFn(getConnectStatus);
  const startOnboardFn = useServerFn(startConnectOnboarding);
  const openDashFn = useServerFn(openConnectDashboard);
  const qc = useQueryClient();

  const methods = useQuery({ queryKey: ["payout-methods"], queryFn: () => methodsFn() });
  const invoices = useQuery({ queryKey: ["my-invoices"], queryFn: () => invoicesFn() });
  const requests = useQuery({ queryKey: ["my-payout-requests"], queryFn: () => requestsFn() });
  const summary = useQuery({ queryKey: ["earnings"], queryFn: () => summaryFn() });
  const connect = useQuery({ queryKey: ["connect-status"], queryFn: () => connectStatusFn() });

  const removeMethod = useMutation({
    mutationFn: (id: string) => removeMethodFn({ data: { id } }),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["payout-methods"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Billing & payouts" subtitle="Manage how you get paid, request payouts, and review invoices.">
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <Stat label="Paid out" value={fmt(summary.data?.paid_cents)} />
        <Stat label="Pending" value={fmt(summary.data?.pending_cents)} />
        <Stat label="Total tasks" value={String(summary.data?.count ?? 0)} />
      </div>

      <Tabs defaultValue="earnings">
        <TabsList className="mb-6 w-full overflow-x-auto justify-start">
          <TabsTrigger value="earnings">Payout requests</TabsTrigger>
          <TabsTrigger value="methods">Payout methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-3">
          <div className="flex justify-end">
            <RequestPayoutDialog
              methods={methods.data?.methods ?? []}
              onSubmit={async (v) => {
                await requestFn({ data: v });
                toast.success("Payout requested");
                qc.invalidateQueries({ queryKey: ["my-payout-requests"] });
              }}
            />
          </div>
          {requests.isLoading ? <DashboardLoadingSkeleton tiles={0} rows={3} /> :
            (requests.data?.requests.length ?? 0) === 0 ? (
              <Empty>No payout requests yet.</Empty>
            ) : (
              <div className="rounded-2xl border border-border bg-card/50 overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                    <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Notes</th></tr>
                  </thead>
                  <tbody>
                    {requests.data!.requests.map((r: any) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold">{fmt(r.amount_cents)}</td>
                        <td className="p-3"><Badge variant="outline" className="capitalize">{r.status}</Badge></td>
                        <td className="p-3 text-muted-foreground">{r.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </TabsContent>

        <TabsContent value="methods" className="space-y-3">
          <ConnectCard
            status={connect.data}
            loading={connect.isLoading}
            onStart={async () => {
              const origin = window.location.origin;
              const r = await startOnboardFn({
                data: {
                  returnUrl: `${origin}/billing?connect=return`,
                  refreshUrl: `${origin}/billing?connect=refresh`,
                },
              });
              if ((r as any).error) { toast.error((r as any).error); return; }
              if ((r as any).url) window.location.href = (r as any).url;
            }}
            onOpenDashboard={async () => {
              const r = await openDashFn();
              if ((r as any).error) { toast.error((r as any).error); return; }
              if ((r as any).url) window.open((r as any).url, "_blank");
            }}
          />
          <div className="flex justify-end">
            <AddMethodDialog onSubmit={async (v) => {
              await addMethodFn({ data: v });
              toast.success("Added");
              qc.invalidateQueries({ queryKey: ["payout-methods"] });
            }} />
          </div>
          {methods.isLoading ? <DashboardLoadingSkeleton tiles={0} rows={2} /> :
            (methods.data?.methods.length ?? 0) === 0 ? (
              <Empty>No payout methods yet. Add one to receive payments.</Empty>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {methods.data!.methods.map((m: any) => (
                  <div key={m.id} className="rounded-2xl border border-border bg-card/50 p-5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {m.display_name ?? m.method_type}
                        {m.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">{m.method_type.replace("_", " ")}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeMethod.mutate(m.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )
          }
          <p className="text-xs text-muted-foreground">Stripe Connect express onboarding is rolling out — manual payout methods are accepted in the meantime.</p>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-3">
          {invoices.isLoading ? <DashboardLoadingSkeleton tiles={0} rows={3} /> :
            (invoices.data?.invoices.length ?? 0) === 0 ? (
              <Empty>No invoices yet.</Empty>
            ) : (
              <div className="rounded-2xl border border-border bg-card/50 overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                    <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Description</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {invoices.data!.invoices.map((i: any) => (
                      <tr key={i.id} className="border-t border-border">
                        <td className="p-3">{new Date(i.created_at).toLocaleDateString()}</td>
                        <td className="p-3">{i.description ?? "—"}</td>
                        <td className="p-3 font-semibold">{fmt(i.amount_cents)}</td>
                        <td className="p-3"><Badge variant="outline" className="capitalize">{i.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">{children}</div>;
}

function ConnectCard({
  status, loading, onStart, onOpenDashboard,
}: { status: any; loading: boolean; onStart: () => void | Promise<void>; onOpenDashboard: () => void | Promise<void> }) {
  const connected = !!status?.connected;
  const payoutsOn = !!status?.payouts_enabled;
  const ready = connected && payoutsOn;
  const needsMore = connected && !payoutsOn;
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card/40 p-5 mb-3">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Direct deposit via Stripe</h3>
            {ready && <Badge variant="outline" className="text-xs gap-1"><CheckCircle2 className="size-3" /> Active</Badge>}
            {needsMore && <Badge variant="outline" className="text-xs">Action needed</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Checking your account…" :
              ready ? "You're set up to receive instant ACH payouts when tasks are approved." :
              needsMore ? "Finish a few details with Stripe to unlock payouts." :
              "Connect your bank with Stripe Express for fast, secure payouts."}
          </p>
        </div>
        <div className="flex gap-2">
          {ready ? (
            <Button variant="outline" onClick={onOpenDashboard}>
              <ExternalLink className="size-4 mr-2" /> Stripe dashboard
            </Button>
          ) : (
            <Button onClick={onStart}>
              {needsMore ? "Complete setup" : "Connect with Stripe"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddMethodDialog({ onSubmit }: { onSubmit: (v: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [method_type, setType] = useState<"bank_account" | "debit_card" | "paypal" | "venmo" | "cashapp" | "other">("bank_account");
  const [display_name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [is_default, setDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4 mr-2" /> Add method</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add payout method</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={method_type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_account">Bank account (ACH)</SelectItem>
                <SelectItem value="debit_card">Debit card</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="cashapp">Cash App</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Display name</Label><Input value={display_name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase ••1234" /></div>
          <div><Label>Identifier</Label><Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="email / handle / last 4" /></div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={is_default} onChange={(e) => setDefault(e.target.checked)} /> Make default
          </label>
        </div>
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({ method_type, display_name: display_name || null, details: { identifier: detail }, is_default });
                setOpen(false);
              } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
              finally { setSaving(false); }
            }}
          >
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestPayoutDialog({ methods, onSubmit }: { methods: any[]; onSubmit: (v: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState<string>(methods.find((m) => m.is_default)?.id ?? methods[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><ArrowDownToLine className="size-4 mr-2" /> Request payout</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Request payout</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          {methods.length > 0 && (
            <div>
              <Label>Payout method</Label>
              <Select value={methodId} onValueChange={setMethodId}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.display_name ?? m.method_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Notes (optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || !amount || Number(amount) <= 0}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({
                  amount_cents: Math.round(Number(amount) * 100),
                  payout_method_id: methodId || null,
                  notes: notes || null,
                });
                setOpen(false);
              } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
              finally { setSaving(false); }
            }}
          >
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}