import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listMyFavorites, toggleFavorite } from "@/lib/profile-extras.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, MapPin, Star, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/favorites")({
  component: FavoritesPage,
  head: () => ({ meta: [{ title: "Favorite runners — REI Runner" }] }),
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Couldn't load favorites: {error.message}</div>
  ),
});

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function FavoritesPage() {
  const navigate = useNavigate();
  const listFn = useServerFn(listMyFavorites);
  const toggle = useServerFn(toggleFavorite);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => listFn(),
  });

  const remove = useMutation({
    mutationFn: (runnerId: string) => toggle({ data: { runnerId } }),
    onSuccess: () => { toast.success("Removed from favorites"); void refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (isLoading) {
    return (
      <DashboardShell title="Favorite runners">
        <Loader2 className="size-5 animate-spin text-primary" />
      </DashboardShell>
    );
  }

  const runners: any[] = data?.runners ?? [];

  return (
    <DashboardShell
      title="Favorite runners"
      subtitle="Your saved runners. Rehire with one click — no need to re-search."
    >
      {runners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
          <Heart className="size-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            You haven't saved any runners yet. Tap the heart on a runner's profile to save them here.
          </p>
          <Button asChild>
            <Link to="/profiles">Browse runners</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {runners.map((r) => (
            <article key={r.user_id} className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-14 rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm font-semibold">
                  {r.profile_photo_url ? (
                    <img src={r.profile_photo_url} alt={r.full_name ?? ""} className="size-full object-cover" />
                  ) : (
                    initials(r.full_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/profile/$slug"
                      params={{ slug: r.profile_slug ?? r.user_id }}
                      className="font-semibold truncate hover:underline"
                    >
                      {r.full_name ?? "Runner"}
                    </Link>
                    {r.top_runner && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 px-1.5 py-0.5 text-[10px] font-medium">
                        <ShieldCheck className="size-3" /> Top
                      </span>
                    )}
                  </div>
                  {r.headline && (
                    <div className="text-xs text-muted-foreground line-clamp-1">{r.headline}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {(r.city || r.state) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" /> {[r.city, r.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {r.average_rating != null && Number(r.average_rating) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {Number(r.average_rating).toFixed(1)}
                        <span className="opacity-70">({r.review_count ?? 0})</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {r.task_rate != null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Starting at </span>
                  <span className="font-semibold">${Number(r.task_rate).toFixed(0)}</span>
                  <span className="text-muted-foreground"> / task</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => navigate({ to: "/messages/new", search: { to: r.user_id } })}
                >
                  <Send className="size-3.5 mr-1.5" /> Rehire
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ to: "/messages/new", search: { to: r.user_id } })}
                >
                  <MessageSquare className="size-3.5 mr-1.5" /> Message
                </Button>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(r.user_id)}
                className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
              >
                <Heart className="size-3 fill-rose-400 text-rose-400" /> Remove from favorites
              </button>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}