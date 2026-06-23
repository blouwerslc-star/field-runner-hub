import { Link } from "@tanstack/react-router";
import { RoleBadge, StarRating, LocationLine, VerifiedBadge } from "./ProfileBadges";
import { VerificationLevelBadge } from "./VerificationLevelBadge";
import { GraduationCap, Lock } from "lucide-react";

export type PublicProfile = {
  user_id: string;
  profile_slug: string | null;
  full_name: string | null;
  city: string | null;
  state: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  headline: string | null;
  services_offered: string[] | null;
  task_rate: number | null;
  average_rating: number;
  review_count: number;
  completed_tasks_count: number;
  verified_status: boolean;
  featured: boolean;
  roles: string[];
  verification_level?: number;
  academy_certification?: { level: string | null; status: string | null } | null;
  academy_certifications?: string[];
};

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileCard({ p, viewerAuthenticated = true }: { p: PublicProfile; viewerAuthenticated?: boolean }) {
  const slug = p.profile_slug ?? p.user_id;
  const canLink = viewerAuthenticated && !!p.profile_slug;

  const inner = (
    <>
      <div
        className="h-14 w-full bg-gradient-to-br from-primary/20 to-purple-500/20"
        style={p.cover_photo_url ? { backgroundImage: `url(${p.cover_photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="-mt-6 px-3 pb-3 flex flex-col gap-1.5">
        <div className="size-12 rounded-full border-[3px] border-card bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {p.profile_photo_url ? (
            <img src={p.profile_photo_url} alt={p.full_name ?? ""} loading="lazy" decoding="async" className="size-full object-cover" />
          ) : (
            initials(p.full_name)
          )}
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h3 className="text-sm font-semibold truncate group-hover:text-primary min-w-0">{p.full_name ?? "Unnamed"}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <RoleBadge roles={p.roles} />
            {p.verified_status && <VerifiedBadge />}
          </div>
        </div>
        {(p.verification_level ?? 0) > 0 && (
          <div><VerificationLevelBadge level={p.verification_level ?? 0} /></div>
        )}
        {p.academy_certification?.status === "certified" && (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium">
              <GraduationCap className="size-3" />
              Academy Certified{p.academy_certification.level ? ` · ${p.academy_certification.level}` : ""}
            </span>
          </div>
        )}
        {(p.academy_certifications ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(p.academy_certifications ?? []).slice(0, 3).map((slug) => (
              <span
                key={slug}
                className="rounded-full bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 text-[10px] font-medium"
                title={`Academy: ${slug}`}
              >
                {slug.replace(/-/g, " ")}
              </span>
            ))}
            {(p.academy_certifications ?? []).length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{(p.academy_certifications ?? []).length - 3}
              </span>
            )}
          </div>
        )}
        {p.headline && <p className="text-xs text-muted-foreground line-clamp-1">{p.headline}</p>}
        <div className="flex items-center justify-between gap-2 text-xs">
          <StarRating rating={p.average_rating} count={p.review_count} />
          <LocationLine city={p.city} state={p.state} />
        </div>
        {(p.services_offered ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(p.services_offered ?? []).slice(0, 2).map((s) => (
              <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
          <span className="text-xs text-muted-foreground">{p.completed_tasks_count} jobs</span>
          {!viewerAuthenticated ? (
            <span className="text-xs text-primary font-medium inline-flex items-center gap-1">
              <Lock className="size-3" /> Sign in to view
            </span>
          ) : p.task_rate ? (
            <span className="text-xs">
              <span className="text-muted-foreground">from </span>
              <span className="font-semibold">${p.task_rate}</span>
            </span>
          ) : (
            <span className="text-xs text-primary font-medium">View profile →</span>
          )}
        </div>
      </div>
    </>
  );

  const className = "group flex flex-col rounded-xl border border-border/60 bg-card/40 overflow-hidden hover:border-primary/50 transition-colors";
  if (canLink) {
    return (
      <Link to="/profile/$slug" params={{ slug }} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className} aria-label={viewerAuthenticated ? undefined : "Sign in to view this profile"}>{inner}</div>;
}