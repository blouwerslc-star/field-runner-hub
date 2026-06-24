import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicProfiles, listAcademyCertOptions } from "@/lib/profiles.functions";
import { ProfileCard, type PublicProfile } from "@/components/profiles/ProfileCard";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { StateCoverageMap } from "@/components/maps/StateCoverageMap";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, BadgeCheck, Star, Trophy, Lock, ShieldCheck, MapPinned, GraduationCap } from "lucide-react";
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
  const [zip, setZip] = useState("");
  const [service, setService] = useState("");
  const [availability, setAvailability] = useState<"all" | "available" | "busy" | "unavailable">("all");
  const [sort, setSort] = useState<"featured" | "rating" | "completed" | "newest">("featured");
  const [certs, setCerts] = useState<string[]>([]);

  const certOptsFn = useServerFn(listAcademyCertOptions);
  const { data: certOpts } = useQuery({
    queryKey: ["academy-cert-options"],
    queryFn: () => certOptsFn(),
    staleTime: 60 * 60_000,
  });

  const filters = {
    q: q || undefined,
    role: role === "all" ? undefined : role,
    city: city || undefined,
    state: state || undefined,
    zip: zip || undefined,
    service: service || undefined,
    availability: availability === "all" ? undefined : availability,
    sort,
    viewerLoggedIn: authed,
    certifications: certs.length > 0 ? certs : undefined,
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

  function handleStateClick(stateAbbr: string) {
    setState(stateAbbr);
    setCity("");
    setZip("");
    // Scroll to results list
    requestAnimationFrame(() => {
      document.getElementById("profiles-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader
        signedIn={authed}
        links={[
          { to: "/tasks", label: "Open tasks" },
          { to: "/runners", label: "Become a runner" },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-5 py-6 sm:py-10">
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
            <p className="mt-2 text-muted-foreground">
              The nationwide boots-on-the-ground network for real estate investors.
              {!isLoading && profiles.length > 0 && (
                <> Showing <span className="text-foreground font-medium">{profiles.length}</span> profile{profiles.length === 1 ? "" : "s"} across <span className="text-foreground font-medium">{uniqueMarkets || 1}</span> market{uniqueMarkets === 1 ? "" : "s"}.</>
              )}
            </p>
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

        {/* TRUST STRIP */}
        <div className="mb-6 rounded-xl border border-border bg-card/40 backdrop-blur px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-3.5 text-primary" /> ID-verified runners</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Escrow-protected payments</span>
          <span className="inline-flex items-center gap-1.5"><MapPinned className="size-3.5 text-primary" /> Nationwide coverage</span>
          <span className="inline-flex items-center gap-1.5"><Star className="size-3.5 text-primary" /> Rated after every task</span>
        </div>

        <div className="mb-6">
          <StateCoverageMap onStateClick={handleStateClick} selectedState={state} />
        </div>

        <form
          id="profiles-search"
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
          <Input aria-label="Filter by ZIP code" placeholder="ZIP" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, ""))} />
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

        {/* Academy certification filter chips */}
        {(certOpts?.courses ?? []).length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground mr-1">
              <GraduationCap className="size-3.5 text-primary" /> Academy
            </span>
            {(certOpts?.courses ?? []).map((c) => {
              const active = certs.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() =>
                    setCerts((prev) =>
                      prev.includes(c.slug) ? prev.filter((s) => s !== c.slug) : [...prev, c.slug],
                    )
                  }
                  className={
                    "rounded-full border px-3 py-1 text-xs transition " +
                    (active
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground")
                  }
                  aria-pressed={active}
                >
                  {c.title}
                </button>
              );
            })}
            {certs.length > 0 && (
              <button
                type="button"
                onClick={() => setCerts([])}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : profiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
            <div className="text-sm text-muted-foreground">No profiles match your current filters.</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setQ("");
                setRole("all");
                setCity("");
                setState("");
                setZip("");
                setService("");
                setAvailability("all");
                setSort("featured");
                setCerts([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {profiles.map((p) => <ProfileCard key={p.user_id} p={p} viewerAuthenticated={authed} />)}
          </div>
        )}
      </main>
    </div>
  );
}