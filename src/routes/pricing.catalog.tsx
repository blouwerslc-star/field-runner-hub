import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPricingCatalog, PRICING_DISCLAIMER, type PricingAddon, type PricingTemplate } from "@/lib/pricing.functions";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, DollarSign, CheckCircle2, XCircle, Info, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing/catalog")({
  component: PricingCatalogPage,
  head: () => ({
    meta: [
      { title: "Service pricing & deliverables — REI Runner" },
      {
        name: "description",
        content:
          "Detailed pricing, deliverables, estimated turnaround, and add-ons for every REI Runner field service assignment.",
      },
      { property: "og:title", content: "Service pricing & deliverables — REI Runner" },
    ],
  }),
});

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return `$${Number(n).toFixed(Number.isInteger(Number(n)) ? 0 : 2)}`;
}

function PricingCatalogPage() {
  const fn = useServerFn(getPricingCatalog);
  const { data, isLoading } = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fn() });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><BrandLogo /></Link>
          <div className="flex gap-2">
            <Link to="/pricing"><Button variant="ghost" size="sm">Overview</Button></Link>
            <Link to="/tasks"><Button size="sm">Post a task <ArrowRight className="size-3.5 ml-1.5" /></Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3">Investor pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Service catalog & deliverables</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Transparent pricing for every assignment type. Each card shows what you pay, what runners earn, estimated turnaround, and exactly what you get back.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading catalog…</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-5">
              {data.templates.map((t) => (
                <TemplateCard key={t.id} t={t} addons={data.addons} />
              ))}
            </div>

            <section className="mt-14">
              <h2 className="text-2xl font-semibold mb-1">Add-ons</h2>
              <p className="text-muted-foreground text-sm mb-5">Apply on top of any assignment when conditions require it.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.addons.map((a) => (
                  <AddonCard key={a.key} a={a} />
                ))}
              </div>
            </section>

            <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground flex gap-3">
              <Info className="size-5 shrink-0 mt-0.5 text-primary" />
              <p>{PRICING_DISCLAIMER}</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function TemplateCard({ t, addons }: { t: PricingTemplate; addons: PricingAddon[] }) {
  const addonMap = new Map(addons.map((a) => [a.key, a]));
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            {t.category && <Badge variant="outline" className="mb-2 text-xs">{t.category}</Badge>}
            <CardTitle className="text-xl">{t.title}</CardTitle>
            {t.description && <p className="text-sm text-muted-foreground mt-1.5">{t.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-semibold text-primary">{money(t.investor_price)}</div>
            <div className="text-xs text-muted-foreground">investor price</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat label="Runner payout" value={money(t.runner_payout)} />
          <Stat label="Platform fee" value={money(t.platform_fee)} />
          <Stat label="Est. time" value={t.est_minutes ? `${t.est_minutes} min` : "—"} icon={<Clock className="size-3" />} />
        </div>

        {t.deliverables.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Deliverables</div>
            <ul className="space-y-1.5">
              {t.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(t.includes_notes || t.excludes_notes) && (
          <div className="space-y-2 text-sm">
            {t.includes_notes && (
              <div className="flex gap-2"><CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" /><span className="text-muted-foreground">{t.includes_notes}</span></div>
            )}
            {t.excludes_notes && (
              <div className="flex gap-2"><XCircle className="size-4 text-destructive shrink-0 mt-0.5" /><span className="text-muted-foreground">{t.excludes_notes}</span></div>
            )}
          </div>
        )}

        {t.available_addons.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Available add-ons</div>
            <div className="flex flex-wrap gap-1.5">
              {t.available_addons.map((k) => {
                const a = addonMap.get(k);
                return <Badge key={k} variant="secondary" className="text-xs">{a?.name ?? k}</Badge>;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
      <div className="text-muted-foreground flex items-center gap-1">{icon}{label}</div>
      <div className="font-semibold text-foreground text-sm mt-0.5">{value}</div>
    </div>
  );
}

function AddonCard({ a }: { a: PricingAddon }) {
  const price =
    a.price_type === "range"
      ? `+${money(a.investor_price_min)}–${money(a.investor_price_max)}`
      : `+${money(a.investor_price)}${a.unit_label ? ` ${a.unit_label}` : ""}`;
  const payout =
    a.runner_pct != null
      ? `${Math.round((a.runner_pct ?? 0) * 100)}% to runner`
      : a.runner_payout != null
        ? `${money(a.runner_payout)}${a.unit_label ? ` ${a.unit_label}` : ""} payout`
        : "—";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-semibold">{a.name}</div>
        {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
        <div className="mt-3 text-primary font-semibold">{price}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{payout}</div>
      </CardContent>
    </Card>
  );
}