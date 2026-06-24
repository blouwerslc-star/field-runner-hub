import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listOpenTasks } from "@/lib/marketplace.functions";
import { getPublicStats } from "@/lib/public-stats.functions";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Loader2, MapPin, DollarSign, Calendar, Search, BadgeCheck, Camera, Video, ShieldCheck } from "lucide-react";
import { MarketplaceMap, type MapPoint } from "@/components/maps/MarketplaceMap";

export const Route = createFileRoute("/tasks")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Open tasks — REI Runner Marketplace" },
      { name: "description", content: "Browse open real estate field service tasks across REI Runner's launching markets. Filter by city, payout, and task type." },
      { property: "og:title", content: "Open tasks — REI Runner Marketplace" },
      { property: "og:description", content: "Browse open property field tasks. REI Runner is launching market-by-market across the U.S." },
      { property: "og:url", content: "https://reirunner.com/tasks" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/tasks" }],
  }),
});

const SAMPLE_TASKS = [
  { id: "sample-1", task_type: "property_photos", title: "Exterior + interior photo set", city: "Detroit", state: "MI", payout: 65, icon: Camera, desc: "20+ geotagged photos uploaded same-day. Example only — apply to be notified when real tasks open." },
  { id: "sample-2", task_type: "occupancy_check", title: "Drive-by occupancy check", city: "Atlanta", state: "GA", payout: 35, icon: ShieldCheck, desc: "Verify vacant / occupied with 4 exterior photos and written observations." },
  { id: "sample-3", task_type: "walkthrough_video", title: "Interior walkthrough video", city: "Dallas", state: "TX", payout: 110, icon: Video, desc: "Full narrated interior walkthrough video, vertical HD." },
];

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [taskType, setTaskType] = useState<string>("all");
  const [minPayout, setMinPayout] = useState<string>("");
  const [maxPayout, setMaxPayout] = useState<string>("");
  const [beforeDue, setBeforeDue] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "payout" | "due">("newest");
  const fn = useServerFn(listOpenTasks);
  const statsFn = useServerFn(getPublicStats);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["open-tasks", { q, city, state, taskType, minPayout, maxPayout, beforeDue, sort }],
    queryFn: () => fn({
      data: {
        q: q || undefined,
        city: city || undefined,
        state: state || undefined,
        task_type: taskType !== "all" ? taskType : undefined,
        min_payout: minPayout ? Number(minPayout) : undefined,
        max_payout: maxPayout ? Number(maxPayout) : undefined,
        before_due: beforeDue || undefined,
        sort,
      },
    }),
    refetchInterval: 30_000,
  });
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => statsFn(),
    refetchInterval: 30_000,
  });

  // Realtime: refresh tasks list + stats when anyone adds/changes a task.
  useEffect(() => {
    const channel = supabase
      .channel("marketplace-tasks-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          refetch();
          refetchStats();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchStats]);

  const tasks = data?.tasks ?? [];

  const mapPoints: MapPoint[] = (tasks as any[]).map((t) => ({
    id: t.id,
    kind: "task",
    title: t.title ?? "Open task",
    subtitle: [t.city, t.state].filter(Boolean).join(", ") || null,
    href: `/tasks/${t.id}`,
    lat: t.lat ?? null,
    lng: t.lng ?? null,
    city: t.city,
    state: t.state,
    badge: t.payout_amount != null ? `$${Number(t.payout_amount).toFixed(0)}` : t.task_type ?? null,
  }));

  const payouts = (tasks as any[])
    .map((t) => (t.payout_amount != null ? Number(t.payout_amount) : null))
    .filter((n): n is number => n != null && !Number.isNaN(n));
  const totalPayout = payouts.reduce((sum, n) => sum + n, 0);
  const avgPayout = payouts.length ? Math.round(totalPayout / payouts.length) : 0;
  const uniqueMarkets = new Set(
    (tasks as any[])
      .map((t) => [t.city, t.state].filter(Boolean).join(", "))
      .filter(Boolean)
  ).size;
  const verifiedCount = (tasks as any[]).filter((t) => t.investor?.verified).length;

  function reset() {
    setQ(""); setCity(""); setState(""); setTaskType("all");
    setMinPayout(""); setMaxPayout(""); setBeforeDue(""); setSort("newest");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/profiles" className="text-muted-foreground hover:text-foreground">Browse runners</Link>
            <Link to="/investors" className="text-muted-foreground hover:text-foreground">Hire a Runner</Link>
            <Link to="/runners" className="text-muted-foreground hover:text-foreground">Become a Runner</Link>
            {signedIn ? (
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            ) : (
              <Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        {stats && (
          <div className="mb-8 rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
                Live platform activity
              </div>
              <span className="text-[10px] text-muted-foreground">Updates in real time</span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Runners</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.runners}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Investors</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.investors}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Tasks posted</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.tasks_total}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Completed</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.tasks_completed}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Markets</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.cities_active}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Avg rating</dt>
                <dd className="text-2xl font-bold tabular-nums">
                  {stats.reviews_count > 0 ? stats.avg_rating.toFixed(1) : "—"}
                </dd>
              </div>
            </dl>
          </div>
        )}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Open tasks</h1>
            <p className="mt-2 text-muted-foreground">Real-time marketplace of property visits, photos, occupancy checks, and more.</p>
          </div>
          {!isLoading && tasks.length > 0 && (
            <dl className="grid grid-cols-4 gap-6 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Open</dt>
                <dd className="text-2xl font-bold tabular-nums">{tasks.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Markets</dt>
                <dd className="text-2xl font-bold tabular-nums">{uniqueMarkets}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Avg payout</dt>
                <dd className="text-2xl font-bold tabular-nums">{avgPayout ? `$${avgPayout}` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Verified</dt>
                <dd className="text-2xl font-bold tabular-nums">{verifiedCount}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="mb-6">
          <MarketplaceMap
            points={mapPoints}
            title="Open tasks on the map"
            emptyMessage="No task locations available for these filters."
          />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); refetch(); }}
          className="mb-8 rounded-2xl border border-border/60 bg-card/40 p-3 space-y-2"
        >
          <div className="grid md:grid-cols-[1fr_160px_120px_180px_auto] gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search tasks by title or description" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or description" className="pl-9" />
            </div>
            <Input aria-label="Filter tasks by city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <Input aria-label="Filter tasks by state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger aria-label="Sort tasks"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="payout">Highest payout</SelectItem>
                <SelectItem value="due">Soonest due</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isFetching}>
              {isFetching && <Loader2 className="size-4 mr-2 animate-spin" />} Search
            </Button>
          </div>
          <div className="grid md:grid-cols-[200px_140px_140px_180px_auto] gap-2">
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger aria-label="Filter by task type"><SelectValue placeholder="Task type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All task types</SelectItem>
                <SelectItem value="property_photos">Property photos</SelectItem>
                <SelectItem value="occupancy_check">Occupancy check</SelectItem>
                <SelectItem value="drive_by">Drive-by inspection</SelectItem>
                <SelectItem value="lockbox_install">Lockbox install</SelectItem>
                <SelectItem value="sign_install">Sign install</SelectItem>
                <SelectItem value="document_drop">Document drop-off</SelectItem>
                <SelectItem value="property_inspection">Property inspection</SelectItem>
                <SelectItem value="key_pickup">Key pickup</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input aria-label="Minimum payout in dollars" type="number" min={0} value={minPayout} onChange={(e) => setMinPayout(e.target.value)} placeholder="Min $" />
            <Input aria-label="Maximum payout in dollars" type="number" min={0} value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)} placeholder="Max $" />
            <Input aria-label="Due before date" type="date" value={beforeDue} onChange={(e) => setBeforeDue(e.target.value)} placeholder="Due before" />
            <Button type="button" variant="ghost" onClick={reset}>Reset</Button>
          </div>
        </form>

        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : tasks.length === 0 ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed border-border p-8 md:p-12 text-center">
              <MapPin className="size-8 text-primary mx-auto mb-3" />
              <h2 className="text-xl md:text-2xl font-semibold">No open tasks in this market yet.</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                REI Runner is opening markets city-by-city. Join early access to get notified when tasks go live near you.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button asChild><Link to="/runners">Become a Runner</Link></Button>
                <Button asChild variant="outline"><Link to="/investors">Post a Task</Link></Button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono uppercase tracking-widest text-primary">Example tasks</div>
                <div className="text-[11px] text-muted-foreground">For illustration only — not live work.</div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SAMPLE_TASKS.map((s) => (
                  <div key={s.id} className="relative rounded-2xl border border-dashed border-border/70 bg-card/30 p-5 opacity-90">
                    <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-muted text-muted-foreground border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      Example task
                    </span>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-xs font-medium">
                        {s.task_type}
                      </span>
                    </div>
                    <h3 className="mt-3 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> {s.city}, {s.state}</p>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{s.desc}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><s.icon className="size-3.5" /> Sample deliverable</span>
                      <span className="inline-flex items-center gap-1 font-bold text-primary"><DollarSign className="size-4" />{s.payout}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((t: any) => (
              <Link
                key={t.id}
                to="/tasks/$taskId"
                params={{ taskId: t.id }}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-border bg-card/50 p-5 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-xs font-medium">
                    {t.task_type}
                  </span>
                  {t.payout_amount != null && (
                    <span className="inline-flex items-center gap-1 font-bold text-primary">
                      <DollarSign className="size-4" />{Number(t.payout_amount).toFixed(0)}
                    </span>
                  )}
                </div>
                {t.requires_interior_access && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Background check required
                  </span>
                )}
                <h3 className="mt-3 font-semibold group-hover:text-primary line-clamp-2">{t.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" /> {[t.city, t.state].filter(Boolean).join(", ")}
                </p>
                {t.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  {t.due_date ? (
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> Due {new Date(t.due_date).toLocaleDateString()}</span>
                  ) : <span />}
                  {t.investor?.verified && (
                    <span className="inline-flex items-center gap-1 text-emerald-300"><BadgeCheck className="size-3" /> Verified</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}