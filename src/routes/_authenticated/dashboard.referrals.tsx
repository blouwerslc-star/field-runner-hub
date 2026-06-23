import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardLoadingSkeleton, RouteErrorState } from "@/components/dashboard/UiStates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Check, Copy, Gift, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { getMyReferralSummary } from "@/lib/referrals.functions";

export const Route = createFileRoute("/_authenticated/dashboard/referrals")({
  component: ReferralsPage,
  head: () => ({ meta: [{ title: "Referrals — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <DashboardShell title="Referrals">
      <RouteErrorState error={error} reset={reset} title="Couldn't load referrals" />
    </DashboardShell>
  ),
});

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function ReferralsPage() {
  const fetchData = useServerFn(getMyReferralSummary);
  const { data, isLoading } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: () => fetchData(),
    staleTime: 60_000,
  });
  const [copied, setCopied] = useState(false);

  if (isLoading || !data) {
    return (
      <DashboardShell title="Referrals">
        <DashboardLoadingSkeleton />
      </DashboardShell>
    );
  }

  const code = data.referral_code ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://reirunner.com";
  const link = code ? `${origin}/?ref=${code}` : "";

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — please copy manually");
    }
  }

  async function share() {
    const text = `Join REI Runner with my code ${code} and we both get rewarded when you complete your first task.`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "REI Runner", text, url: link });
        return;
      } catch {}
    }
    copy(`${text} ${link}`, "Invite message");
  }

  return (
    <DashboardShell title="Referrals" subtitle="Invite friends — earn rewards when they complete their first task.">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/investor"><ArrowLeft className="size-4 mr-1" /> Back</Link>
        </Button>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card/60 to-card/30 backdrop-blur p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="size-5 text-primary" />
          <h2 className="text-base font-semibold">Earn $25 for every active referral</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-xl">
          Share your code. When someone joins through your link and completes their first task, you both earn a $25 credit toward your next payout or task funding.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Your referral code</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-background/60 px-4 py-3 font-mono text-lg font-semibold tracking-wider">
                {code || "—"}
              </div>
              <Button size="icon" variant="outline" onClick={() => copy(code, "Code")} disabled={!code}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Your invite link</label>
            <div className="mt-1 flex items-center gap-2">
              <Input value={link} readOnly className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={() => copy(link, "Link")} disabled={!link}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button onClick={share} disabled={!code}>
            <Share2 className="size-4 mr-2" /> Share invite
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        <Stat icon={<Users className="size-4" />} label="Total referrals" value={String(data.totals.total)} />
        <Stat icon={<Sparkles className="size-4" />} label="Pending" value={String(data.totals.pending)} />
        <Stat icon={<Trophy className="size-4" />} label="Pending reward" value={money(data.totals.pending_reward_cents)} tone="amber" />
        <Stat icon={<Trophy className="size-4" />} label="Earned" value={money(data.totals.earned_reward_cents)} tone="primary" />
      </div>

      {/* Referral list */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
        <h2 className="text-sm font-semibold mb-4">Your invites</h2>
        {data.referrals.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No referrals yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your code to start earning.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.referrals.map((r) => {
              const referee = r.referee as any;
              const name = referee?.full_name ?? "New member";
              const loc = referee?.city ? `${referee.city}${referee.state ? `, ${referee.state}` : ""}` : "—";
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                  <Avatar className="size-9">
                    <AvatarImage src={referee?.avatar_url ?? undefined} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">{name}</div>
                    <div className="text-[11px] text-muted-foreground">{loc} · joined {new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={r.status} />
                  <div className="text-right text-xs font-mono w-16">{money(r.reward_amount_cents)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "primary" | "amber" }) {
  const cls =
    tone === "primary"
      ? "border-primary/40 bg-primary/5"
      : tone === "amber"
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-border bg-card/60";
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "rewarded") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Rewarded</Badge>;
  if (status === "qualified") return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Qualified</Badge>;
  if (status === "void") return <Badge variant="outline" className="text-muted-foreground">Void</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}