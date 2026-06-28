import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Download, Gift, ToggleLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  getPromoAnalytics,
  updatePromoCampaign,
  exportPromoAnalyticsCsv,
} from "@/lib/promo.functions";

export const Route = createFileRoute("/_authenticated/admin/promotions")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id);
    if (!(roles ?? []).some((r) => r.role === "admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPromotions,
  head: () => ({ meta: [{ title: "Promotions — REI Runner Admin" }] }),
});

function AdminPromotions() {
  const fetchAnalytics = useServerFn(getPromoAnalytics);
  const save = useServerFn(updatePromoCampaign);
  const exportCsv = useServerFn(exportPromoAnalyticsCsv);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["promo-analytics"],
    queryFn: () => fetchAnalytics({ data: { campaignCode: "first_task_free" } }),
  });

  const [enabled, setEnabled] = useState(true);
  const [creditDollars, setCreditDollars] = useState("50");
  const [expiresAt, setExpiresAt] = useState("");
  const [disclaimer, setDisclaimer] = useState("");

  useEffect(() => {
    if (!data?.campaign) return;
    setEnabled(data.campaign.enabled);
    setCreditDollars(String(Math.floor(data.campaign.credit_cents / 100)));
    setExpiresAt(data.campaign.expires_at ? data.campaign.expires_at.slice(0, 10) : "");
    setDisclaimer(data.campaign.legal_disclaimer ?? "");
  }, [data?.campaign]);

  const mut = useMutation({
    mutationFn: () => save({ data: {
      campaignCode: "first_task_free",
      enabled,
      creditCents: Math.max(0, Math.min(50000, Math.round(Number(creditDollars || "0") * 100))),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      legalDisclaimer: disclaimer.trim() || undefined,
    } }),
    onSuccess: () => {
      toast.success("Campaign updated");
      qc.invalidateQueries({ queryKey: ["promo-analytics"] });
      qc.invalidateQueries({ queryKey: ["promo-campaign-active"] });
      qc.invalidateQueries({ queryKey: ["my-promo-credit"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleExport() {
    try {
      const r = await exportCsv();
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `first-task-free-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

  if (isLoading || !data) {
    return <DashboardShell title="Promotions"><Loader2 className="size-5 animate-spin text-primary" /></DashboardShell>;
  }

  const s = data.stats;
  const cards = [
    { label: "Banner views", value: s.bannerViews },
    { label: "Banner clicks", value: s.bannerClicks },
    { label: "Signups", value: s.signups },
    { label: "First tasks created", value: s.firstTasksCreated },
    { label: "Credits issued", value: s.creditsIssued },
    { label: "Credits redeemed", value: s.creditsRedeemed },
    { label: "Total cost", value: `$${(s.totalCostCents / 100).toFixed(2)}` },
    { label: "Downstream revenue", value: `$${(s.downstreamRevenueCents / 100).toFixed(2)}` },
    { label: "Signup → first task", value: `${s.signupConversionPct.toFixed(1)}%` },
    { label: "Repeat-task rate", value: `${s.repeatRatePct.toFixed(1)}%` },
  ];

  return (
    <DashboardShell title="Promotions" subtitle="First Task Free campaign controls and analytics">
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-5 md:p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-lg bg-primary/15 grid place-items-center">
            <Gift className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">First Task Free</h2>
            <p className="text-xs text-muted-foreground">Auto-applies at checkout for eligible new investors.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
            <div>
              <div className="text-sm font-medium flex items-center gap-2"><ToggleLeft className="size-4 text-primary" /> Campaign enabled</div>
              <div className="text-xs text-muted-foreground mt-0.5">Disabling immediately hides the banner and prevents new credit application.</div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-3">
            <Label htmlFor="promo-amount" className="text-sm">Credit amount (USD)</Label>
            <Input id="promo-amount" inputMode="decimal" value={creditDollars}
              onChange={(e) => setCreditDollars(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="50" className="mt-1.5" />
            <p className="text-[11px] text-muted-foreground mt-1.5">Range 0 &ndash; 500. Applies to credits issued going forward.</p>
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-3">
            <Label htmlFor="promo-expires" className="text-sm">Expiration (optional)</Label>
            <Input id="promo-expires" type="date" value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)} className="mt-1.5" />
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-3 md:col-span-2">
            <Label htmlFor="promo-legal" className="text-sm">Legal disclaimer</Label>
            <Textarea id="promo-legal" rows={3} value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)} className="mt-1.5" maxLength={2000} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4 mr-1.5" /> Export analytics CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card/40 p-3">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
