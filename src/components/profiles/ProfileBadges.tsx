import { BadgeCheck, MapPin, Star } from "lucide-react";

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
      <BadgeCheck className="size-3.5" /> Verified
    </span>
  );
}

export function RoleBadge({ roles }: { roles: string[] }) {
  if (roles.includes("runner"))
    return (
      <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/30">
        Runner
      </span>
    );
  if (roles.includes("investor"))
    return (
      <span className="inline-flex items-center rounded-full bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-300 border border-purple-500/30">
        Investor
      </span>
    );
  return null;
}

export function AvailabilityBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    busy: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    unavailable: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  };
  const cls = map[status ?? "available"] ?? map.available;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${cls}`}>
      {(status ?? "available").replace(/^./, (c) => c.toUpperCase())}
    </span>
  );
}

export function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-foreground">
      <Star className="size-4 fill-yellow-400 text-yellow-400" />
      <span className="font-semibold">{rating > 0 ? rating.toFixed(1) : "New"}</span>
      {count > 0 && <span className="text-muted-foreground">({count})</span>}
    </span>
  );
}

export function LocationLine({ city, state }: { city?: string | null; state?: string | null }) {
  const parts = [city, state].filter(Boolean);
  if (!parts.length) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MapPin className="size-3" /> {parts.join(", ")}
    </span>
  );
}