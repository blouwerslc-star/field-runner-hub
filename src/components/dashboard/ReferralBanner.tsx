import { Link } from "@tanstack/react-router";
import { Gift, ChevronRight } from "lucide-react";

export function ReferralBanner() {
  return (
    <Link
      to="/dashboard/referrals"
      className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card/60 to-card/30 backdrop-blur p-4 hover:border-primary/50 transition-colors"
    >
      <div className="rounded-full bg-primary/15 p-2 text-primary">
        <Gift className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">Earn $25 per referral</div>
        <div className="text-xs text-muted-foreground">Invite a friend — you both get rewarded on their first completed task.</div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}