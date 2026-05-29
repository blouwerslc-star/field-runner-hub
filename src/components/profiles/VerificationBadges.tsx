import { Mail, Phone, BadgeCheck, ShieldCheck, Building2, Award } from "lucide-react";

type V = {
  email_verified?: boolean;
  phone_verified?: boolean;
  identity_verified?: boolean;
  background_check_verified?: boolean;
  company_verified?: boolean;
};

function Pill({ icon, label, on }: { icon: React.ReactNode; label: string; on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
        on
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          : "bg-muted/30 text-muted-foreground border-border/60"
      }`}
      title={on ? `${label} verified` : `${label} not verified`}
    >
      {icon}
      {label}
    </span>
  );
}

export function VerificationBadges({ profile }: { profile: V }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Pill icon={<Mail className="size-3" />} label="Email" on={!!profile.email_verified} />
      <Pill icon={<Phone className="size-3" />} label="Phone" on={!!profile.phone_verified} />
      <Pill icon={<BadgeCheck className="size-3" />} label="ID" on={!!profile.identity_verified} />
      <Pill icon={<ShieldCheck className="size-3" />} label="Background" on={!!profile.background_check_verified} />
      <Pill icon={<Building2 className="size-3" />} label="Company" on={!!profile.company_verified} />
    </div>
  );
}

export function TrustScore({ profile }: { profile: V & { average_rating?: number; review_count?: number; completed_tasks_count?: number; repeat_client_count?: number } }) {
  const flags = [
    profile.email_verified,
    profile.phone_verified,
    profile.identity_verified,
    profile.background_check_verified,
    profile.company_verified,
  ].filter(Boolean).length;
  const base = flags * 10;
  const ratingBonus = Math.round((profile.average_rating ?? 0) * 6);
  const completedBonus = Math.min(15, profile.completed_tasks_count ?? 0);
  const repeatBonus = Math.min(10, (profile.repeat_client_count ?? 0) * 2);
  const score = Math.min(100, base + ratingBonus + completedBonus + repeatBonus);
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-xs font-semibold">
      <Award className="size-3.5" /> Trust score {score}
    </div>
  );
}