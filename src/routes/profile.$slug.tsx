import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicProfileBySlug } from "@/lib/profiles.functions";
import { Button } from "@/components/ui/button";
import { RoleBadge, VerifiedBadge, AvailabilityBadge, StarRating, LocationLine } from "@/components/profiles/ProfileBadges";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Loader2, MessageSquare, Send, Clock, Award } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/profile/$slug")({
  component: PublicProfilePage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — REI Runner` },
      { name: "description", content: `Public profile on REI Runner.` },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Profile not found.</div>
  ),
});

type Profile = {
  user_id: string;
  profile_slug: string | null;
  full_name: string | null;
  city: string | null;
  state: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  headline: string | null;
  bio: string | null;
  services_offered: string[] | null;
  markets_served: string | null;
  experience_level: string | null;
  years_experience: number | null;
  task_rate: number | null;
  hourly_rate: number | null;
  availability_status: string | null;
  average_rating: number;
  review_count: number;
  completed_tasks_count: number;
  response_time: string | null;
  verified_status: boolean;
  featured: boolean;
  turnaround_time: string | null;
  task_types: string[] | null;
  service_radius: string | null;
  company_name: string | null;
  company_description: string | null;
  monthly_deal_volume: string | null;
  created_at: string;
};

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function PublicProfilePage() {
  const { slug } = Route.useParams();
  const fetchFn = useServerFn(getPublicProfileBySlug);
  const { data, isLoading } = useQuery({
    queryKey: ["publicProfile", slug],
    queryFn: () => fetchFn({ data: { slug } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
    );
  }
  if (!data?.profile) throw notFound();

  const p = data.profile as Profile;
  const roles = data.roles ?? [];
  const isRunner = roles.includes("runner");
  const isInvestor = roles.includes("investor");
  const memberSince = new Date(p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
          <Link to="/profiles" className="text-sm text-muted-foreground hover:text-foreground">Browse profiles</Link>
        </div>
      </header>

      <div
        className="h-48 md:h-64 w-full bg-gradient-to-br from-primary/20 to-purple-500/20"
        style={p.cover_photo_url ? { backgroundImage: `url(${p.cover_photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid md:grid-cols-[2fr,1fr] gap-8 -mt-16 md:-mt-20">
          <div>
            <div className="flex items-end gap-4">
              <div className="size-28 md:size-32 rounded-full border-4 border-background bg-muted overflow-hidden flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                {p.profile_photo_url ? (
                  <img src={p.profile_photo_url} alt={p.full_name ?? ""} className="size-full object-cover" />
                ) : (
                  initials(p.full_name)
                )}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{p.full_name ?? "Unnamed"}</h1>
                  <RoleBadge roles={roles} />
                  {p.verified_status && <VerifiedBadge />}
                </div>
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  <LocationLine city={p.city} state={p.state} />
                  <AvailabilityBadge status={p.availability_status} />
                  <StarRating rating={p.average_rating} count={p.review_count} />
                </div>
              </div>
            </div>
            {p.headline && <p className="mt-6 text-lg text-foreground">{p.headline}</p>}
            {p.bio && <p className="mt-3 text-muted-foreground whitespace-pre-wrap">{p.bio}</p>}

            {(p.services_offered ?? []).length > 0 && (
              <Section title="Services">
                <div className="flex flex-wrap gap-2">
                  {(p.services_offered ?? []).map((s) => (
                    <span key={s} className="rounded-full bg-muted px-3 py-1 text-sm">{s}</span>
                  ))}
                </div>
              </Section>
            )}

            {(p.task_types ?? []).length > 0 && (
              <Section title="Task types">
                <div className="flex flex-wrap gap-2">
                  {(p.task_types ?? []).map((s) => (
                    <span key={s} className="rounded-full bg-muted px-3 py-1 text-sm">{s}</span>
                  ))}
                </div>
              </Section>
            )}

            {p.markets_served && (
              <Section title="Markets served"><p className="text-sm text-muted-foreground">{p.markets_served}</p></Section>
            )}

            {isInvestor && p.company_description && (
              <Section title={p.company_name ?? "Company"}>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.company_description}</p>
              </Section>
            )}

            <Section title="Reviews">
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No reviews yet. Reviews appear after completed tasks.
              </div>
            </Section>
          </div>

          <aside className="md:pt-24">
            <div className="rounded-xl border border-border/60 bg-card/40 p-5 sticky top-24 space-y-4">
              {isRunner ? (
                <>
                  {p.task_rate && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Starting at</div>
                      <div className="text-2xl font-bold">${p.task_rate}<span className="text-sm text-muted-foreground"> / task</span></div>
                    </div>
                  )}
                  <Button className="w-full" onClick={() => toast.info("Task invitation flow coming soon — assign through your dashboard.")}>
                    <Send className="size-4 mr-1.5" /> Invite Runner To Task
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={() => toast.info("Direct messaging coming soon.")}>
                  <MessageSquare className="size-4 mr-1.5" /> Connect With Investor
                </Button>
              )}

              <dl className="text-sm space-y-2 pt-2 border-t border-border/60">
                <Row icon={<Award className="size-3.5" />} label="Completed tasks" value={String(p.completed_tasks_count)} />
                {p.response_time && <Row icon={<Clock className="size-3.5" />} label="Response time" value={p.response_time} />}
                {p.turnaround_time && <Row icon={<Clock className="size-3.5" />} label="Turnaround" value={p.turnaround_time} />}
                {p.experience_level && <Row label="Experience" value={p.experience_level} />}
                {p.years_experience != null && <Row label="Years" value={String(p.years_experience)} />}
                {p.service_radius && <Row label="Service radius" value={p.service_radius} />}
                <Row label="Member since" value={memberSince} />
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-muted-foreground inline-flex items-center gap-1.5">{icon}{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}