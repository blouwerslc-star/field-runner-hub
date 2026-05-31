import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicProfiles } from "@/lib/profiles.functions";
import { ProfileCard, type PublicProfile } from "@/components/profiles/ProfileCard";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MarketplaceMap, type MapPoint } from "@/components/maps/MarketplaceMap";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/profiles")({
  component: ProfilesDirectory,
  head: () => ({
    meta: [
      { title: "Browse runners and investors — REI Runner" },
      { name: "description", content: "Find verified field runners and active investors in your market." },
    ],
  }),
});

function ProfilesDirectory() {
  const fetchFn = useServerFn(listPublicProfiles);
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
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["publicProfiles", filters],
    queryFn: () => fetchFn({ data: filters }),
  });

  const profiles = (data?.profiles ?? []) as PublicProfile[];

  const mapPoints: MapPoint[] = profiles.map((p: any) => ({
    id: p.user_id,
    kind: "runner",
    title: p.full_name ?? "Runner",
    subtitle: [p.city, p.state].filter(Boolean).join(", ") || p.headline || null,
    href: p.profile_slug ? `/profile/${p.profile_slug}` : null,
    lat: p.home_lat,
    lng: p.home_lng,
    city: p.city,
    state: p.state,
    badge: p.top_runner ? "Top Runner" : p.availability_status === "available" ? "Available" : null,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Browse the marketplace</h1>
          <p className="mt-2 text-muted-foreground">Find runners and investors active in your market.</p>
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
            <Input placeholder="Search name or headline" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="runner">Runners</SelectItem>
              <SelectItem value="investor">Investors</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
          <Input placeholder="Service" value={service} onChange={(e) => setService(e.target.value)} />
          <Select value={availability} onValueChange={(v) => setAvailability(v as typeof availability)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any availability</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            {profiles.map((p) => <ProfileCard key={p.user_id} p={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}