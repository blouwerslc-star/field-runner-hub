import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicProfiles } from "@/lib/profiles.functions";
import { ProfileCard, type PublicProfile } from "@/components/profiles/ProfileCard";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { MarketplaceMap, type MapPoint } from "@/components/maps/MarketplaceMap";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, BadgeCheck, Star, Trophy, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profiles")({
  component: ProfilesDirectory,
  head: () => ({
    meta: [
      { title: "Browse runners and investors — REI Runner" },
      { name: "description", content: "Find verified field runners and active investors in your market." },
      { property: "og:title", content: "Browse runners and investors — REI Runner" },
      { property: "og:description", content: "Find verified field runners and active investors in your market." },
      { property: "og:url", content: "https://reirunner.com/profiles" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/profiles" }],
  }),
});

function ProfilesDirectory() {
  const fetchFn = useServerFn(listPublicProfiles);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => setAuthed(!!s.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | "runner" | "investor">("all");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [service, setService] = useState("");
  const [availability, setAvailability] = useState<"all" | "available" | "busy" | "unavailable">("all");
  const [sort, setSort] = useState<"featured" | "rating" | "completed" | "newest">("featured");

  const filters = {
    q: q || undefined,
    role: role === "all" ? undefined : role,
    city: city || undefined,
    state: state || undefined,
    service: service || undefined,
    availability: availability === "all" ? undefined : availability,
    sort,
    viewerLoggedIn: authed,
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["publicProfiles", filters],
    queryFn: () => fetchFn({ data: filters }),
  });

  const profiles = (data?.profiles ?? []) as unknown as PublicProfile[];

  const verifiedCount = profiles.filter((p: any) => p.verified_status).length;
  const topRunners = profiles.filter((p: any) => p.top_runner).length;
  const ratings = profiles
    .map((p: any) => (p.average_rating != null ? Number(p.average_rating) : null))
    .filter((n): n is number => n != null && !Number.isNaN(n));
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
  const uniqueMarkets = new Set(
    profiles.map((p: any) => [p.city, p.state].filter(Boolean).join(", ")).filter(Boolean)
  ).size;

  const mapPoints: MapPoint[] = profiles.map((p: any) => ({
    id: p.user_id,
    kind: "runner",
    title: p.full_name ?? "Runner",
    subtitle: [p.city, p.state].filter(Boolean).join(", ") || p.headline || null,
    href: p.profile_slug ? `/profile/${p.profile_slug}` : null,
    city: p.city,
    state: p.state,
    badge: p.top_runner ? "Top Runner" : p.availability_status === "available" ? "Available" : null,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader currentPath="/profiles" />

      <main className="mx-auto max-w-7xl px-5 py-10">
        {!authed && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="size-4 text-primary" />
              <span>Public listings show first name + last initial only. <span className="text-muted-foreground">Sign in to view full runner profiles and contact runners.</span></span>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/investors">Create investor account</Link></Button>
            </div>
          </div>
        )}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Browse the marketplace</h1>
            <p className="mt-2 text-muted-foreground">Find runners and investors active in your market.</p>
          </div>
          {!isLoading && profiles.length > 0 && (
            <dl className="grid grid-cols-4 gap-6 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Profiles</dt>
                <dd className="text-2xl font-bold tabular-nums">{profiles.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide inline-flex items-center gap-1"><BadgeCheck className="size-3" /> Verified</dt>
                <dd className="text-2xl font-bold tabular-nums">{verifiedCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide inline-flex items-center gap-1"><Trophy className="size-3" /> Top</dt>
                <dd className="text-2xl font-bold tabular-nums">{topRunners}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide inline-flex items-center gap-1"><Star className="size-3" /> Avg rating</dt>
                <dd className="text-2xl font-bold tabular-nums">{avgRating}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="mb-6">
          <MarketplaceMap
            points={mapPoints}
            title="Runners on the map"
            emptyMessage="No runner locations available for these filters."
          />
        </div>

        <form
          className="grid gap-3 md:grid-cols-6 mb-6"
          onSubmit={(e) => { e.preventDefault(); void refetch(); }}
        >
          <div className="md:col-span-2 relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search profiles by name or headline" placeholder="Search name or headline" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger aria-label="Filter by role"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="runner">Runners</SelectItem>
              <SelectItem value="investor">Investors</SelectItem>
            </SelectContent>
          </Select>
          <Input aria-label="Filter by city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input aria-label="Filter by state" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
          <Input aria-label="Filter by service offered" placeholder="Service" value={service} onChange={(e) => setService(e.target.value)} />
          <Select value={availability} onValueChange={(v) => setAvailability(v as typeof availability)}>
            <SelectTrigger aria-label="Filter by availability"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any availability</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger aria-label="Sort profiles"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured first</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="completed">Most jobs</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isFetching}>
            {isFetching ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Search className="size-4 mr-1.5" />}
            Search
          </Button>
        </form>

        {isLoading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : profiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            No profiles match your filters.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {profiles.map((p) => <ProfileCard key={p.user_id} p={p} viewerAuthenticated={authed} />)}
          </div>
        )}
      </main>
    </div>
  );
}
