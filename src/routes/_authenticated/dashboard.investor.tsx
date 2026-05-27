import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CheckCircle2, Briefcase, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/investor")({
  component: InvestorDashboard,
  head: () => ({ meta: [{ title: "Investor Dashboard — REI Runner" }] }),
});

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="size-10 rounded-lg bg-primary/10 grid place-items-center mb-3">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function InvestorDashboard() {
  return (
    <DashboardShell
      title="Investor Dashboard"
      subtitle="You're on the Early Access list. Task posting opens as soon as runners are activated in your markets."
    >
      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-6 md:p-8 mb-8 shadow-glow">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-xl bg-primary/20 grid place-items-center shrink-0">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Investor Early Access — Confirmed</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us about your deal flow so we can prioritize your markets. Early Access investors get the first 5 tasks free of platform fees.
            </p>
            <Link to="/investors">
              <Button className="mt-4 bg-gradient-primary shadow-glow">Complete your investor profile</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label="Tasks Posted" value="0" />
        <StatCard icon={Users} label="Available Runners" value="—" />
        <StatCard icon={MapPin} label="Your Markets" value="Pending" />
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
        <h3 className="font-semibold text-lg mb-2">What's coming next</h3>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>Post a property task — address, type, deadline, payout — in under a minute.</li>
          <li>A vetted local runner accepts, completes, and uploads deliverables.</li>
          <li>Approve the work to release payment. 20% platform fee, no subscriptions.</li>
        </ul>
      </div>
    </DashboardShell>
  );
}