import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPricingCatalog, PRICING_DISCLAIMER } from "@/lib/pricing.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/runner-rates")({
  component: RunnerRatesPage,
  head: () => ({ meta: [{ title: "Your payout rates — REI Runner" }] }),
});

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return `$${Number(n).toFixed(Number.isInteger(Number(n)) ? 0 : 2)}`;
}

function RunnerRatesPage() {
  const fn = useServerFn(getPricingCatalog);
  const { data, isLoading } = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fn() });

  return (
    <DashboardShell title="Your payout rates" subtitle="What you earn on each assignment type, plus add-on payouts.">
      {isLoading || !data ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Assignment payouts</h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead className="text-right">You earn</TableHead>
                    <TableHead className="text-right">Investor pays</TableHead>
                    <TableHead className="text-right">Est. time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.title}</div>
                        {t.category && <Badge variant="outline" className="mt-1 text-xs">{t.category}</Badge>}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">{money(t.runner_payout)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{money(t.investor_price)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{t.est_minutes ? `${t.est_minutes} min` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Add-on payouts</h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Add-on</TableHead>
                    <TableHead className="text-right">Your share</TableHead>
                    <TableHead className="text-right">Investor pays</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.addons.map((a) => (
                    <TableRow key={a.key}>
                      <TableCell>
                        <div className="font-medium">{a.name}</div>
                        {a.description && <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {a.runner_pct != null
                          ? `${Math.round((a.runner_pct ?? 0) * 100)}%`
                          : `${money(a.runner_payout)}${a.unit_label ? ` ${a.unit_label}` : ""}`}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {a.price_type === "range"
                          ? `${money(a.investor_price_min)}–${money(a.investor_price_max)}`
                          : `${money(a.investor_price)}${a.unit_label ? ` ${a.unit_label}` : ""}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground flex gap-3">
            <Info className="size-5 shrink-0 mt-0.5 text-primary" />
            <p>{PRICING_DISCLAIMER}</p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}