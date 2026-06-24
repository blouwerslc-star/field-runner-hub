import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { StateCoverageMap } from "@/components/maps/StateCoverageMap";
import { getCoverageDashboard } from "@/lib/public-stats.functions";
import {
  ArrowRight,
  MapPin,
  TrendingUp,
  Users,
  Briefcase,
  Sparkles,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/coverage")({
  component: CoveragePage,
  head: () => ({
    meta: [
      { title: "Nationwide Coverage Map — REI Runner" },
      {
        name: "description",
        content:
          "Live coverage map of REI Runner: verified runners, active investors, and tasks completed across U.S. cities and states.",
      },
      { property: "og:title", content: "Nationwide Coverage Map — REI Runner" },
      {
        property: "og:description",
        content:
          "See where REI Runner is active right now — runners, investors, and completed tasks by state and city. Live marketplace data.",
      },
      { property: "og:url", content: "https://reirunner.com/coverage" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/coverage" }],
  }),
});

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function CoveragePage() {
  const dashFn = useServerFn(getCoverageDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["coverage-dashboard"],
    queryFn: () => dashFn(),
    staleTime: 5 * 60_000,
  });

  const totals = data?.totals;
  const deltas = data?.deltas_7d;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home">
            <BrandLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/coverage" className="text-foreground">Coverage</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/trust" className="hover:text-foreground">Trust</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          </nav>
          <Link to="/apply" className="text-sm font-medium text-primary hover:underline">
            Apply →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-4">
            <Activity className="size-3.5" /> Live marketplace data
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Where REI Runner is active right now
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl text-base md:text-lg">
            Real coverage from real users. Verified runners, active investors, and tasks completed
            across the U.S. — updated continuously, never fabricated.
          </p>

          {/* Stat strip */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              icon={<Users className="size-4" />}
              label="Runners"
              value={totals?.runners ?? 0}
              delta={deltas?.runners ?? 0}
              loading={isLoading}
            />
            <StatTile
              icon={<Briefcase className="size-4" />}
              label="Investors"
              value={totals?.investors ?? 0}
              delta={deltas?.investors ?? 0}
              loading={isLoading}
            />
            <StatTile
              icon={<MapPin className="size-4" />}
              label="Cities active"
              value={totals?.cities_active ?? 0}
              suffix={`${totals?.states_active ?? 0} states`}
              loading={isLoading}
            />
            <StatTile
              icon={<Sparkles className="size-4" />}
              label="Tasks completed"
              value={totals?.tasks_completed ?? 0}
              delta={deltas?.tasks ?? 0}
              deltaLabel="new this week"
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <StateCoverageMap height={480} />
        <div className="mt-3 text-xs text-muted-foreground">
          State counts show registered runner coverage. City-level demand is summarized below —
          we never expose precise addresses.
        </div>
      </section>

      {/* States table + Underserved markets */}
      <section className="mx-auto max-w-6xl px-5 pb-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> State coverage
            </h2>
            <span className="text-xs text-muted-foreground">
              {data?.states.length ?? 0} states active
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="text-left px-4 py-2">State</th>
                  <th className="text-right px-4 py-2">Cities</th>
                  <th className="text-right px-4 py-2">Runners</th>
                  <th className="text-right px-4 py-2">Investors</th>
                  <th className="text-right px-4 py-2">Open tasks</th>
                  <th className="text-right px-4 py-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {(data?.states ?? []).slice(0, 25).map((s) => (
                  <tr key={s.state} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2 font-medium">{s.state}</td>
                    <td className="px-4 py-2 text-right">{s.cities}</td>
                    <td className="px-4 py-2 text-right">{s.runners}</td>
                    <td className="px-4 py-2 text-right">{s.investors}</td>
                    <td className="px-4 py-2 text-right">{s.tasks_open}</td>
                    <td className="px-4 py-2 text-right">{s.tasks_completed}</td>
                  </tr>
                ))}
                {!isLoading && (data?.states ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No coverage data yet — be the first runner in your market.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-400" /> Underserved markets
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Cities with open investor demand but few or no runners.
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {(data?.underserved ?? []).map((c) => (
              <div key={`${c.city}-${c.state}`} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{c.city}, {c.state}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.open_tasks} open task{c.open_tasks === 1 ? "" : "s"} · {c.runners} runner{c.runners === 1 ? "" : "s"}
                  </div>
                </div>
                <Link
                  to="/apply"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  Apply <ArrowRight className="size-3" />
                </Link>
              </div>
            ))}
            {!isLoading && (data?.underserved ?? []).length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No underserved markets right now — coverage matches demand.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent signups */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Recently joined
            </h2>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <ul className="divide-y divide-border/40">
            {(data?.recent_signups ?? []).map((s, i) => (
              <li key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {s.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm truncate">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground"> joined as {s.role}</span>
                    </div>
                    {(s.city || s.state) && (
                      <div className="text-xs text-muted-foreground truncate">
                        {[s.city, s.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo(s.joined_at)}
                </span>
              </li>
            ))}
            {!isLoading && (data?.recent_signups ?? []).length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No recent signups yet.
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Help us grow coverage in your market
          </h2>
          <p className="mt-3 text-muted-foreground">
            Become a verified field runner, or post your first task and join the network.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg">
              <Link to="/apply">Apply as a runner</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/investors">Post a task</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  delta,
  deltaLabel,
  suffix,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
  suffix?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1.5 text-2xl md:text-3xl font-semibold tabular-nums">
        {loading ? "—" : value.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {delta && delta > 0 ? (
          <span className="text-emerald-400">
            +{delta} {deltaLabel ?? "this week"}
          </span>
        ) : suffix ? (
          <span>{suffix}</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  );
}