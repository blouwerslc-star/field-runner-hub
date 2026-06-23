import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Heart, Star, MapPin, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyFavorites } from "@/lib/profile-extras.functions";
import { PostTaskWizard } from "@/components/dashboard/investor/PostTaskWizard";

type SavedRunner = {
  user_id: string;
  full_name: string | null;
  profile_slug: string | null;
  profile_photo_url: string | null;
  city: string | null;
  state: string | null;
  average_rating: number | null;
  review_count: number | null;
  headline: string | null;
  top_runner: boolean | null;
};

export function SavedRunnersStrip() {
  const fetchFavs = useServerFn(listMyFavorites);
  const { data, isLoading } = useQuery({
    queryKey: ["my-saved-runners"],
    queryFn: () => fetchFavs(),
    staleTime: 60_000,
  });
  const [invite, setInvite] = useState<SavedRunner | null>(null);
  const runners = (data?.runners ?? []) as SavedRunner[];

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="size-4 text-rose-400" />
          <h3 className="text-sm font-semibold">My runners</h3>
          <Badge variant="outline" className="text-[10px]">{runners.length}</Badge>
        </div>
        <Button asChild size="sm" variant="ghost" className="text-xs">
          <Link to="/dashboard/favorites">
            View all <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-24 rounded-lg bg-muted/20 animate-pulse" />
      ) : runners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Save runners you like to invite them directly to future tasks.{" "}
          <Link to="/profiles" className="text-primary underline">Browse runners</Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1">
          {runners.slice(0, 8).map((r) => (
            <div
              key={r.user_id}
              className="shrink-0 w-[200px] rounded-xl border border-border bg-card/80 p-3 hover:border-primary/40 transition"
            >
              <div className="flex items-center gap-2.5">
                {r.profile_photo_url ? (
                  <img src={r.profile_photo_url} alt={r.full_name ?? "Runner"} className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                    {(r.full_name ?? "?").slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{r.full_name ?? "Runner"}</div>
                  {r.average_rating != null && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {Number(r.average_rating).toFixed(1)} ({r.review_count ?? 0})
                    </div>
                  )}
                </div>
              </div>
              {(r.city || r.state) && (
                <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 truncate">
                  <MapPin className="size-3 shrink-0" />
                  {[r.city, r.state].filter(Boolean).join(", ")}
                </div>
              )}
              <div className="mt-3 flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-xs bg-gradient-primary shadow-glow" onClick={() => setInvite(r)}>
                  <Send className="size-3 mr-1" /> Invite
                </Button>
                {r.profile_slug && (
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                    <Link to="/profile/$slug" params={{ slug: r.profile_slug }}>View</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {invite && (
        <PostTaskWizard
          controlledOpen={true}
          onControlledOpenChange={(o) => { if (!o) setInvite(null); }}
          preferredRunner={{ id: invite.user_id, name: invite.full_name ?? "your runner" }}
        />
      )}
    </div>
  );
}