import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Quote, Star, Sparkles, Users, Building2, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { listFeaturedTestimonials, type Testimonial } from "@/lib/testimonials.functions";

const ROLE_META: Record<
  Testimonial["author_role"],
  { label: string; icon: typeof Users; tint: string }
> = {
  runner: { label: "Runner", icon: Users, tint: "text-primary" },
  investor: { label: "Investor", icon: Building2, tint: "text-primary" },
  team: { label: "REI Runner", icon: Sparkles, tint: "text-primary" },
  partner: { label: "Partner", icon: ShieldCheck, tint: "text-primary" },
};

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TestimonialsSection() {
  const fn = useServerFn(listFeaturedTestimonials);
  const { data, isLoading } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const items = data?.testimonials ?? [];

  return (
    <section
      id="testimonials"
      aria-label="Voices from the marketplace"
      className="mx-auto max-w-7xl px-5 py-16 md:py-24"
    >
      <div className="text-center mb-10 md:mb-14">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">
          Voices from the marketplace
        </div>
        <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
          Why early users are showing up
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          REI Runner is in beta. These are honest quotes from the founding team and the
          first runners and investors using the platform — not paid endorsements.
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card/40 backdrop-blur p-6 h-56 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
          <Quote className="size-6 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Founding Runners and beta investors are onboarding now. Your story could be the
            first one here.
          </p>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-primary hover:underline"
          >
            Become a Founding Runner
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t) => {
            const meta = ROLE_META[t.author_role];
            const Icon = meta.icon;
            return (
              <figure
                key={t.id}
                className="relative rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <Quote
                  aria-hidden
                  className="absolute top-5 right-5 size-7 text-primary/20"
                />
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-primary mb-4">
                  <Icon className="size-3.5" />
                  {meta.label}
                </div>
                {t.rating ? (
                  <div
                    className="flex items-center gap-0.5 mb-3"
                    aria-label={`${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < (t.rating ?? 0)
                            ? "size-3.5 fill-primary text-primary"
                            : "size-3.5 text-muted-foreground/40"
                        }
                      />
                    ))}
                  </div>
                ) : null}
                <blockquote className="text-[15px] leading-relaxed text-foreground/90 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 pt-5 border-t border-border/60 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold shrink-0">
                    {initialsFor(t.author_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{t.author_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {[t.author_title, t.author_location].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-8">
        Want to be quoted here? Email{" "}
        <a
          href="mailto:support@reirunner.com"
          className="underline hover:text-foreground"
        >
          support@reirunner.com
        </a>{" "}
        with your story.
      </p>
    </section>
  );
}