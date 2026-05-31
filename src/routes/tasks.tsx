import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listOpenTasks } from "@/lib/marketplace.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Loader2, MapPin, DollarSign, Calendar, Search, BadgeCheck } from "lucide-react";
import { MarketplaceMap, type MapPoint } from "@/components/maps/MarketplaceMap";

export const Route = createFileRoute("/tasks")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Open tasks — REI Runner Marketplace" },
      { name: "description", content: "Browse open real estate field service tasks. Filter by market, payout, and type." },
      { property: "og:title", content: "Open tasks — REI Runner Marketplace" },
      { property: "og:description", content: "Browse open real estate field service tasks across the country." },
    ],
  }),
});

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [taskType, setTaskType] = useState<string>("all");
  const [minPayout, setMinPayout] = useState<string>("");
  const [maxPayout, setMaxPayout] = useState<string>("");
  const [beforeDue, setBeforeDue] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "payout" | "due">("newest");
  const fn = useServerFn(listOpenTasks);
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
  });
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
            <Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Open tasks</h1>
          <p className="mt-2 text-muted-foreground">Real-time marketplace of property visits, photos, occupancy checks, and more.</p>
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
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or description" className="pl-9" />
            </div>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue placeholder="Task type" /></SelectTrigger>
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
            <Input type="number" min={0} value={minPayout} onChange={(e) => setMinPayout(e.target.value)} placeholder="Min $" />
            <Input type="number" min={0} value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)} placeholder="Max $" />
            <Input type="date" value={beforeDue} onChange={(e) => setBeforeDue(e.target.value)} placeholder="Due before" />
            <Button type="button" variant="ghost" onClick={reset}>Reset</Button>
          </div>
        </form>

        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No open tasks match your filters.
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