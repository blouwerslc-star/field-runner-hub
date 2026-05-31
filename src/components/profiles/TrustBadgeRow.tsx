import { ShieldCheck, BadgeCheck, Phone, Mail, FileCheck2, Umbrella, Crown } from "lucide-react";

type Props = {
  email_verified?: boolean | null;
  phone_verified?: boolean | null;
  identity_verified?: boolean | null;
  background_check_verified?: boolean | null;
  insurance_verified?: boolean | null;
  top_runner?: boolean | null;
  verified_status?: boolean | null;
  compact?: boolean;
};

function Pill({ on, icon: Icon, label }: { on: boolean; icon: any; label: string }) {
  if (!on) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
      <Icon className="size-3.5" /> {label}
    </span>
  );
}

export function TrustBadgeRow(p: Props) {
  const anyBadge =
    p.email_verified || p.phone_verified || p.identity_verified ||
    p.background_check_verified || p.insurance_verified || p.top_runner || p.verified_status;
  if (!anyBadge) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {p.top_runner && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300">
          <Crown className="size-3.5" /> Top Runner
        </span>
      )}
      <Pill on={!!p.verified_status} icon={BadgeCheck} label="Verified" />
      <Pill on={!!p.background_check_verified} icon={ShieldCheck} label="Background Checked" />
      <Pill on={!!p.identity_verified} icon={FileCheck2} label="ID Verified" />
      <Pill on={!!p.insurance_verified} icon={Umbrella} label="Insured" />
      <Pill on={!!p.email_verified} icon={Mail} label="Email" />
      <Pill on={!!p.phone_verified} icon={Phone} label="Phone" />
    </div>
  );
}