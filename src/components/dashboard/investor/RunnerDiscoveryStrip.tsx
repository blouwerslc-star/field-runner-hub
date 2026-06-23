import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { listPublicProfiles } from "@/lib/profiles.functions";

type Props = {
  state?: string | null;
  city?: string | null;
};

export function RunnerDiscoveryStrip({ state, city }: Props) {
  const fetchRunners = useServerFn(listPublicProfiles);
  const { data, isLoading } = useQuery({
    queryKey: ["investor-discover-runners", state ?? null, city ?? null],
    queryFn: () =>
      fetchRunners({
        data: {
          role: "runner",
          state: state || undefined,
          sort: "rating",
          limit: 12,
          viewerLoggedIn: true,
        },
      }),
    staleTime: 60_000,
  });

  const runners = (data?.profiles ?? []) as Array<{
    user_id: string;
    profile_slug: string | null;
    full_name: string | null;
    city: string | null;
    state: string | null;
    profile_photo_url: string | null;
    average_rating: number | null;
    review_count: number | null;
    completed_tasks_count: number | null;
    verification_level: string | null;
    background_check_verified: boolean | null;
    headline: string | null;
  }>;

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold">
            {state ? `Runners in ${state}` : "Top-rated runners"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse local runners before you post — invite them directly to your next task.
          </p>
        </div>
        <Link
          to="/profiles"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          See all <ArrowRight className="size-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="h-32 grid place-items-center">
          <Loader2 className="size-4 animate-spin text-primary" />
        </div>
      ) : runners.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No runners onboarded {state ? `in ${state}` : "yet"}. We're matching nationwide — post your task and we'll dispatch the closest runner.
        </p>
      ) : (
        <div className="-mx-2 px-2 overflow-x-auto">
          <div className="flex gap-3 pb-2 snap-x">
            {runners.map((r) => (
              <RunnerCard key={r.user_id} runner={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RunnerCard({
  runner: r,
}: {
  runner: {
    profile_slug: string | null;
    full_name: string | null;
    city: string | null;
    state: string | null;
    profile_photo_url: string | null;
    average_rating: number | null;
    review_count: number | null;
    completed_tasks_count: number | null;
    background_check_verified: boolean | null;
    headline: string | null;
  };
}) {
  const name = r.full_name || "Runner";
  const initials = name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const inner = (
    <div className="w-[200px] shrink-0 snap-start rounded-xl border border-border bg-background/60 p-3 hover:border-primary/50 transition group">
      <div className="flex items-center gap-2.5">
        {r.profile_photo_url ? (
          <img
            src={r.profile_photo_url}
            alt={name}
            className="size-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="size-10 rounded-full bg-gradient-primary grid place-items-center text-[11px] font-bold text-primary-foreground">
            {initials || "R"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{name}</div>
          {(r.city || r.state) && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
              <MapPin className="size-2.5 shrink-0" />
              {[r.city, r.state].filter(Boolean).join(", ")}
            </div>
          )}
        </div>
      </div>
      {r.headline && (
        <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{r.headline}</p>
      )}
      <div className="mt-2.5 flex items-center justify-between text-[10px]">
        <span className="inline-flex items-center gap-0.5 text-amber-300">
          <Star className="size-3 fill-current" />
          {r.average_rating ? Number(r.average_rating).toFixed(1) : "—"}
          <span className="text-muted-foreground">
            {r.review_count ? ` (${r.review_count})` : ""}
          </span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {r.completed_tasks_count ?? 0} jobs
        </span>
      </div>
      {r.background_check_verified && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-300">
          <ShieldCheck className="size-3" /> Background-checked
        </div>
      )}
    </div>
  );
  if (r.profile_slug) {
    return (
      <Link to="/profile/$slug" params={{ slug: r.profile_slug }} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}