import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CheckCircle2, Clock, MapPin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/runner")({
  component: RunnerDashboard,
  head: () => ({ meta: [{ title: "Runner Dashboard — REI Runner" }] }),
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

function RunnerDashboard() {
  return (
    <DashboardShell
      title="Runner Dashboard"
      subtitle="You're on the Founding Runner waitlist. We're activating runners city by city — here's where you stand."
    >
      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-6 md:p-8 mb-8 shadow-glow">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-xl bg-primary/20 grid place-items-center shrink-0">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Founding Runner — Waitlisted</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You'll get an email the moment paid tasks open in your market. Make sure your application is complete to move up the list.
            </p>
            <Link to="/apply">
              <Button className="mt-4 bg-gradient-primary shadow-glow">Complete your application</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Status" value="Waitlisted" />
        <StatCard icon={MapPin} label="Active Markets" value="8" />
        <StatCard icon={Wallet} label="Tasks Completed" value="0" />
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
        <h3 className="font-semibold text-lg mb-2">What's next</h3>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>Paid tasks will appear here as soon as investors in your market post jobs.</li>
          <li>You'll be notified by email and SMS when a job matches your service area.</li>
          <li>Founding Runners get first access to every task posted in their city for the first 30 days.</li>
        </ul>
      </div>
    </DashboardShell>
  );
}