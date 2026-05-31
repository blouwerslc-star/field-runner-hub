import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getPublicProfileBySlug } from "@/lib/profiles.functions";
import { toggleFavorite, isFavorite } from "@/lib/profile-extras.functions";
import { Button } from "@/components/ui/button";
import { RoleBadge, AvailabilityBadge, StarRating, LocationLine } from "@/components/profiles/ProfileBadges";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CertificationBadge } from "@/components/academy/CertificationBadge";
import { TrustBadgeRow } from "@/components/profiles/TrustBadgeRow";
import { PerformanceMetrics } from "@/components/profiles/PerformanceMetrics";
import { PortfolioGallery } from "@/components/profiles/PortfolioGallery";
import { ProfileReviewsList } from "@/components/profiles/ProfileReviewsList";
import { ServiceAreaMap, parseRadius } from "@/components/profiles/ServiceAreaMap";
import { Progress } from "@/components/ui/progress";
import { SPECIALTY_OPTIONS, PRICING_SERVICES, EXPERIENCE_FIELDS, isOnline, trustScore } from "@/lib/profile-constants";
import { Loader2, MessageSquare, Send, Heart, BookmarkPlus, CalendarDays, ShieldCheck, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

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

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function PublicProfilePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchFn = useServerFn(getPublicProfileBySlug);
  const favCheck = useServerFn(isFavorite);
  const favToggle = useServerFn(toggleFavorite);

  const { data, isLoading } = useQuery({
    queryKey: ["publicProfile", slug],
    queryFn: () => fetchFn({ data: { slug } }),
  });

  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => setAuthed(!!s.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = (data as any)?.profile?.user_id as string | undefined;
  const { data: favData, refetch: refetchFav } = useQuery({
    enabled: authed && !!userId,
    queryKey: ["isFavorite", userId],
    queryFn: () => favCheck({ data: { runnerId: userId! } }),
  });
  const toggleMut = useMutation({
    mutationFn: () => favToggle({ data: { runnerId: userId! } }),
    onSuccess: (r) => { toast.success(r.favorited ? "Saved to favorites" : "Removed from favorites"); void refetchFav(); },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }
  if (!data?.profile) throw notFound();

  const p = data.profile as any;
  const roles: string[] = (data as any).roles ?? [];
  const portfolio = (data as any).portfolio ?? [];
  const reviews = (data as any).reviews ?? [];
  const blocks = (data as any).availability_blocks ?? [];
  const metrics = (data as any).metrics ?? {};
  const isRunner = roles.includes("runner");
  const isInvestor = roles.includes("investor");
  const certLevel = (data as any).runner?.certification_level ?? 0;
  const memberSince = new Date(p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" });
  const online = isOnline(metrics.last_activity_at ?? p.last_active_at);
  const score = trustScore(p);
  const radiusMiles = parseRadius(p.service_radius);
  const specialties: string[] = (p.specialties && p.specialties.length ? p.specialties : (p.services_offered ?? [])).filter((s: string) => !!s);

  const pricing = PRICING_SERVICES.filter((s) => p[s.key] != null);
  const experience = EXPERIENCE_FIELDS.filter((f) => p[f.key]);

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

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid md:grid-cols-[2fr,1fr] gap-8 -mt-16 md:-mt-20">
          {/* MAIN */}
          <div className="space-y-8">
            {/* HEADER */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="size-28 md:size-36 rounded-full border-4 border-background bg-muted overflow-hidden flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                  {p.profile_photo_url ? (
                    <img src={p.profile_photo_url} alt={p.full_name ?? ""} className="size-full object-cover" />
                  ) : (
                    initials(p.full_name)
                  )}
                </div>
                <span
                  className={`absolute bottom-2 right-2 size-4 rounded-full border-2 border-background ${online ? "bg-emerald-400" : "bg-zinc-500"}`}
                  title={online ? "Online now" : "Offline"}
                />
              </div>
              <div className="pb-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold truncate">{p.full_name ?? "Unnamed"}</h1>
                  <RoleBadge roles={roles} />
                </div>
                <div className="mt-1 flex items-center gap-3 flex-wrap text-sm">
                  <LocationLine city={p.city} state={p.state} />
                  {p.service_radius && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {radiusMiles}mi radius</span>}
                  <AvailabilityBadge status={p.availability_status} />
                  <StarRating rating={p.average_rating} count={p.review_count} />
                  {isRunner && <CertificationBadge level={certLevel} hideWhenZero />}
                  <span className="text-xs text-muted-foreground">Member since {memberSince}</span>
                </div>
                <div className="mt-3"><TrustBadgeRow {...p} /></div>
              </div>
            </div>

            {p.headline && <p className="text-lg">{p.headline}</p>}
            {p.bio && <p className="text-muted-foreground whitespace-pre-wrap">{p.bio}</p>}

            {/* PERFORMANCE METRICS */}
            {isRunner && (
              <Section title="Performance">
                <PerformanceMetrics
                  completed_tasks_count={p.completed_tasks_count}
                  average_rating={Number(p.average_rating ?? 0)}
                  review_count={p.review_count}
                  response_time={p.response_time}
                  response_time_minutes={p.response_time_minutes}
                  completion_rate={Number(metrics.completion_rate ?? p.completion_rate ?? 0)}
                  repeat_client_rate={Number(metrics.repeat_client_rate ?? p.repeat_client_rate ?? 0)}
                  last_activity_at={metrics.last_activity_at ?? p.last_active_at}
                />
              </Section>
            )}

            {/* SPECIALTIES */}
            {specialties.length > 0 && (
              <Section title="Specialties">
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s) => (
                    <span key={s} className="rounded-full border border-primary/30 bg-primary/10 text-primary px-3 py-1 text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* PORTFOLIO */}
            {isRunner && (
              <Section title="Portfolio">
                <PortfolioGallery items={portfolio} />
              </Section>
            )}

            {/* SERVICE AREA */}
            {isRunner && (
              <Section title="Service area">
                <ServiceAreaMap city={p.city} state={p.state} radiusMiles={radiusMiles} />
              </Section>
            )}

            {/* AVAILABILITY */}
            {isRunner && (
              <Section title="Availability">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <AvailChip on={p.avail_today} label="Available today" />
                  <AvailChip on={p.avail_this_week} label="This week" />
                  <AvailChip on={p.avail_weekends} label="Weekends" />
                  <AvailChip on={p.avail_emergency} label="Emergency requests" />
                </div>
                {blocks.length > 0 && (
                  <div className="mt-4 rounded-lg border border-border/60 p-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><CalendarDays className="size-3.5" /> Unavailable dates</div>
                    <div className="flex flex-wrap gap-1.5">
                      {blocks.slice(0, 20).map((b: any) => (
                        <span key={b.blocked_date} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                          {new Date(b.blocked_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* EXPERIENCE */}
            {isRunner && experience.length > 0 && (
              <Section title="Experience">
                <ul className="grid gap-2 md:grid-cols-2">
                  {experience.map((f) => (
                    <li key={f.key} className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
                      <span className="text-sm">{f.label}</span>
                      <span className="text-xs text-muted-foreground">{p[f.yearsKey] != null ? `${p[f.yearsKey]} yrs` : "Yes"}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* PRICING */}
            {isRunner && pricing.length > 0 && (
              <Section title="Starting rates">
                <ul className="rounded-xl border border-border/60 divide-y divide-border/60">
                  {pricing.map((s) => (
                    <li key={s.key} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm">{s.label}</span>
                      <span className="font-semibold">${Number(p[s.key]).toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Estimates only — final pricing confirmed at booking.</p>
              </Section>
            )}

            {/* REVIEWS */}
            <Section title="Reviews">
              <ProfileReviewsList reviews={reviews} />
            </Section>

            {/* INVESTOR DETAILS */}
            {isInvestor && p.company_description && (
              <Section title={p.company_name ?? "Company"}>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.company_description}</p>
              </Section>
            )}
          </div>

          {/* STICKY QUICK HIRE PANEL */}
          <aside className="md:pt-24">
            <div className="rounded-xl border border-border/60 bg-card/40 p-5 md:sticky md:top-24 space-y-4">
              {isRunner && p.task_rate != null && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Starting at</div>
                  <div className="text-3xl font-bold">${Number(p.task_rate).toFixed(0)}<span className="text-sm text-muted-foreground"> / task</span></div>
                </div>
              )}

              {isRunner ? (
                <>
                  <Button className="w-full" onClick={() => navigate({ to: "/messages/new", search: { to: userId } })}>
                    <Send className="size-4 mr-1.5" /> Request Service
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/messages/new", search: { to: userId } })}>
                    <MessageSquare className="size-4 mr-1.5" /> Message Runner
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        if (!authed) { toast.info("Sign in to save runners"); return; }
                        toggleMut.mutate();
                      }}
                    >
                      <Heart className={`size-4 mr-1.5 ${favData?.favorited ? "fill-rose-400 text-rose-400" : ""}`} />
                      {favData?.favorited ? "Saved" : "Save"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => toast.info("Future-jobs invites coming soon.")}>
                      <BookmarkPlus className="size-4 mr-1.5" /> Invite
                    </Button>
                  </div>
                </>
              ) : (
                <Button className="w-full" onClick={() => navigate({ to: "/messages/new", search: { to: userId } })}>
                  <MessageSquare className="size-4 mr-1.5" /> Message
                </Button>
              )}

              {/* Trust score */}
              {isRunner && (
                <div className="pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-muted-foreground"><ShieldCheck className="size-4" /> Trust score</span>
                    <span className="font-semibold">{score}/100</span>
                  </div>
                  <Progress value={score} className="mt-2" />
                </div>
              )}

              <dl className="text-sm space-y-1.5 pt-3 border-t border-border/60">
                <Row label="Completed" value={String(p.completed_tasks_count)} />
                {metrics.unique_clients ? <Row label="Unique clients" value={String(metrics.unique_clients)} /> : null}
                {metrics.favorite_count ? <Row label="Saved by" value={`${metrics.favorite_count} investors`} /> : null}
                {p.response_time && <Row label="Response time" value={p.response_time} />}
                {p.service_radius && <Row label="Service radius" value={`${radiusMiles}mi`} />}
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
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
function AvailChip({ on, label }: { on?: boolean | null; label: string }) {
  return (
    <span className={`rounded-lg border px-3 py-2 text-center text-sm ${on ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border/60 bg-muted/30 text-muted-foreground"}`}>
      {label}
    </span>
  );
}
// Avoid unused warnings
void SPECIALTY_OPTIONS;