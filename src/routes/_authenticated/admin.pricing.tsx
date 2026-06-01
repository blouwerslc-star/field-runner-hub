import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getPricingCatalog,
  adminUpdatePricingTemplate,
  adminUpdatePricingAddon,
  listPricingOverrides,
  upsertPricingOverride,
  deletePricingOverride,
  PRICING_DISCLAIMER,
} from "@/lib/pricing.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Save, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: AdminPricingPage,
  head: () => ({ meta: [{ title: "Pricing admin — REI Runner" }] }),
});

function AdminPricingPage() {
  return (
    <DashboardShell title="Pricing admin" subtitle="Edit base prices, payouts, and market overrides for assignment templates and add-ons.">
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="overrides">Market overrides</TabsTrigger>
        </TabsList>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="addons"><AddonsTab /></TabsContent>
        <TabsContent value="overrides"><OverridesTab /></TabsContent>
      </Tabs>
      <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground flex gap-3">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" /><p>{PRICING_DISCLAIMER}</p>
      </div>
    </DashboardShell>
  );
}

function TemplatesTab() {
  const fn = useServerFn(getPricingCatalog);
  const update = useServerFn(adminUpdatePricingTemplate);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fn() });

  if (isLoading || !data) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      {data.templates.map((t) => (
        <TemplateEditor
          key={t.id}
          t={t}
          onSave={async (patch) => {
            await update({ data: { id: t.id, ...patch } });
            toast.success(`${t.title} updated`);
            qc.invalidateQueries({ queryKey: ["pricing-catalog"] });
          }}
        />
      ))}
    </div>
  );
}

function TemplateEditor({ t, onSave }: { t: any; onSave: (p: any) => Promise<void> }) {
  const [investor, setInvestor] = useState(String(t.investor_price ?? ""));
  const [payout, setPayout] = useState(String(t.runner_payout ?? ""));
  const [fee, setFee] = useState(String(t.platform_fee ?? ""));
  const [mins, setMins] = useState(String(t.est_minutes ?? ""));
  const [active, setActive] = useState<boolean>(t.active);
  const [sort, setSort] = useState(String(t.sort_order ?? 0));
  const [delivers, setDelivers] = useState((t.deliverables ?? []).join("\n"));
  const [includes, setIncludes] = useState(t.includes_notes ?? "");
  const [excludes, setExcludes] = useState(t.excludes_notes ?? "");
  const [addons, setAddons] = useState((t.available_addons ?? []).join(","));
  const [category, setCategory] = useState(t.category ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{t.title}</div>
          <Badge variant="outline" className="text-xs mt-1">{t.task_type}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        <Field label="Investor price"><Input type="number" min="0" value={investor} onChange={(e) => setInvestor(e.target.value)} /></Field>
        <Field label="Runner payout"><Input type="number" min="0" value={payout} onChange={(e) => setPayout(e.target.value)} /></Field>
        <Field label="Platform fee"><Input type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
        <Field label="Est. minutes"><Input type="number" min="0" value={mins} onChange={(e) => setMins(e.target.value)} /></Field>
        <Field label="Category"><Input value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
        <Field label="Sort order"><Input type="number" min="0" value={sort} onChange={(e) => setSort(e.target.value)} /></Field>
        <Field label="Add-on keys (comma)"><Input value={addons} onChange={(e) => setAddons(e.target.value)} placeholder="rush,mileage" /></Field>
      </div>
      <Field label="Deliverables (one per line)">
        <Textarea rows={4} value={delivers} onChange={(e) => setDelivers(e.target.value)} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Includes notes"><Textarea rows={2} value={includes} onChange={(e) => setIncludes(e.target.value)} /></Field>
        <Field label="Excludes notes"><Textarea rows={2} value={excludes} onChange={(e) => setExcludes(e.target.value)} /></Field>
      </div>
      <div className="flex justify-end">
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                investor_price: investor ? Number(investor) : null,
                runner_payout: payout ? Number(payout) : null,
                platform_fee: fee ? Number(fee) : null,
                est_minutes: mins ? Number(mins) : null,
                deliverables: delivers.split("\n").map((s) => s.trim()).filter(Boolean),
                includes_notes: includes || null,
                excludes_notes: excludes || null,
                available_addons: addons.split(",").map((s) => s.trim()).filter(Boolean),
                category: category || null,
                active,
                sort_order: Number(sort) || 0,
              });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />} Save
        </Button>
      </div>
    </div>
  );
}

function AddonsTab() {
  const fn = useServerFn(getPricingCatalog);
  const update = useServerFn(adminUpdatePricingAddon);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fn() });

  if (isLoading || !data) return <Loader2 className="size-5 animate-spin text-primary" />;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {data.addons.map((a) => (
        <AddonEditor key={a.key} a={a} onSave={async (patch) => {
          await update({ data: { key: a.key, ...patch } });
          toast.success(`${a.name} updated`);
          qc.invalidateQueries({ queryKey: ["pricing-catalog"] });
        }} />
      ))}
    </div>
  );
}

function AddonEditor({ a, onSave }: { a: any; onSave: (p: any) => Promise<void> }) {
  const [investor, setInvestor] = useState(String(a.investor_price ?? ""));
  const [payout, setPayout] = useState(String(a.runner_payout ?? ""));
  const [fee, setFee] = useState(String(a.platform_fee ?? ""));
  const [minP, setMinP] = useState(String(a.investor_price_min ?? ""));
  const [maxP, setMaxP] = useState(String(a.investor_price_max ?? ""));
  const [runnerPct, setRunnerPct] = useState(String(a.runner_pct ?? ""));
  const [platformPct, setPlatformPct] = useState(String(a.platform_pct ?? ""));
  const [active, setActive] = useState<boolean>(a.active);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{a.name}</div>
          <Badge variant="outline" className="text-xs mt-1">{a.price_type}</Badge>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Investor"><Input type="number" value={investor} onChange={(e) => setInvestor(e.target.value)} /></Field>
        <Field label="Runner"><Input type="number" value={payout} onChange={(e) => setPayout(e.target.value)} /></Field>
        <Field label="Fee"><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
        <Field label="Min"><Input type="number" value={minP} onChange={(e) => setMinP(e.target.value)} /></Field>
        <Field label="Max"><Input type="number" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></Field>
        <Field label="Runner % (0-1)"><Input type="number" step="0.05" value={runnerPct} onChange={(e) => setRunnerPct(e.target.value)} /></Field>
        <Field label="Platform % (0-1)"><Input type="number" step="0.05" value={platformPct} onChange={(e) => setPlatformPct(e.target.value)} /></Field>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={saving} onClick={async () => {
          setSaving(true);
          try {
            await onSave({
              investor_price: investor ? Number(investor) : null,
              runner_payout: payout ? Number(payout) : null,
              platform_fee: fee ? Number(fee) : null,
              investor_price_min: minP ? Number(minP) : null,
              investor_price_max: maxP ? Number(maxP) : null,
              runner_pct: runnerPct ? Number(runnerPct) : null,
              platform_pct: platformPct ? Number(platformPct) : null,
              active,
            });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
          } finally { setSaving(false); }
        }}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />} Save
        </Button>
      </div>
    </div>
  );
}

function OverridesTab() {
  const listFn = useServerFn(listPricingOverrides);
  const upsertFn = useServerFn(upsertPricingOverride);
  const deleteFn = useServerFn(deletePricingOverride);
  const catalogFn = useServerFn(getPricingCatalog);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pricing-overrides"], queryFn: () => listFn() });
  const { data: catalog } = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => catalogFn() });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["pricing-overrides"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OverrideDialog
          templates={catalog?.templates ?? []}
          addons={catalog?.addons ?? []}
          onSubmit={async (v) => {
            await upsertFn({ data: v });
            toast.success("Override saved");
            qc.invalidateQueries({ queryKey: ["pricing-overrides"] });
          }}
          trigger={<Button><Plus className="size-4 mr-2" /> New override</Button>}
        />
      </div>
      {isLoading || !data ? <Loader2 className="size-5 animate-spin text-primary" /> : data.overrides.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground text-center">
          No market overrides yet. Use overrides to adjust pricing by city, state, urgency, or runner experience level.
        </div>
      ) : (
        <div className="space-y-2">
          {data.overrides.map((o: any) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card/50 p-4 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium">
                  {o.template_id ? (catalog?.templates.find((t) => t.id === o.template_id)?.title ?? "Template") : (catalog?.addons.find((a) => a.key === o.addon_key)?.name ?? o.addon_key)}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                  {o.market_city && <Badge variant="outline" className="text-xs">{o.market_city}</Badge>}
                  {o.market_state && <Badge variant="outline" className="text-xs">{o.market_state}</Badge>}
                  {o.urgency && <Badge variant="outline" className="text-xs">urgency: {o.urgency}</Badge>}
                  {o.experience_level && <Badge variant="outline" className="text-xs">exp: {o.experience_level}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Investor ${o.investor_price ?? "—"} · Runner ${o.runner_payout ?? "—"} · Fee ${o.platform_fee ?? "—"}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del.mutate(o.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OverrideDialog({ trigger, templates, addons, onSubmit }: { trigger: React.ReactNode; templates: any[]; addons: any[]; onSubmit: (v: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [addonKey, setAddonKey] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [urgency, setUrgency] = useState("");
  const [exp, setExp] = useState("");
  const [investor, setInvestor] = useState("");
  const [payout, setPayout] = useState("");
  const [fee, setFee] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New pricing override</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Template">
              <select className="w-full rounded-md border border-border bg-background h-9 px-2 text-sm" value={templateId} onChange={(e) => { setTemplateId(e.target.value); if (e.target.value) setAddonKey(""); }}>
                <option value="">—</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </Field>
            <Field label="Add-on">
              <select className="w-full rounded-md border border-border bg-background h-9 px-2 text-sm" value={addonKey} onChange={(e) => { setAddonKey(e.target.value); if (e.target.value) setTemplateId(""); }}>
                <option value="">—</option>
                {addons.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
            <Field label="State"><Input value={state} onChange={(e) => setState(e.target.value)} /></Field>
            <Field label="Urgency"><Input value={urgency} onChange={(e) => setUrgency(e.target.value)} placeholder="rush / standard" /></Field>
            <Field label="Experience level"><Input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="new / experienced / top" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Investor"><Input type="number" value={investor} onChange={(e) => setInvestor(e.target.value)} /></Field>
            <Field label="Runner"><Input type="number" value={payout} onChange={(e) => setPayout(e.target.value)} /></Field>
            <Field label="Fee"><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button
            disabled={saving || (!templateId && !addonKey)}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({
                  template_id: templateId || null,
                  addon_key: addonKey || null,
                  market_state: state || null,
                  market_city: city || null,
                  urgency: urgency || null,
                  experience_level: exp || null,
                  investor_price: investor ? Number(investor) : null,
                  runner_payout: payout ? Number(payout) : null,
                  platform_fee: fee ? Number(fee) : null,
                  notes: notes || null,
                  active: true,
                });
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              } finally { setSaving(false); }
            }}
          >Save override</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}