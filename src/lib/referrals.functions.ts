import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyReferralSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const userId = context.userId;

    const [{ data: me }, { data: referrals }] = await Promise.all([
      supabase.from("profiles").select("referral_code, referred_by").eq("user_id", userId).maybeSingle(),
      supabase
        .from("referrals")
        .select("id, referee_id, status, reward_amount_cents, qualified_at, rewarded_at, created_at")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const list = (referrals ?? []) as any[];
    const refereeIds = list.map((r) => r.referee_id);
    let profiles: any[] = [];
    if (refereeIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, city, state, created_at")
        .in("user_id", refereeIds);
      profiles = data ?? [];
    }
    const profMap = new Map(profiles.map((p) => [p.user_id, p]));

    const enriched = list.map((r) => ({
      ...r,
      referee: profMap.get(r.referee_id) ?? null,
    }));

    const totals = {
      total: list.length,
      pending: list.filter((r) => r.status === "pending").length,
      qualified: list.filter((r) => r.status === "qualified").length,
      rewarded: list.filter((r) => r.status === "rewarded").length,
      pending_reward_cents: list
        .filter((r) => r.status === "qualified")
        .reduce((s, r) => s + (r.reward_amount_cents ?? 0), 0),
      earned_reward_cents: list
        .filter((r) => r.status === "rewarded")
        .reduce((s, r) => s + (r.reward_amount_cents ?? 0), 0),
    };

    return {
      referral_code: me?.referral_code ?? null,
      referred_by: me?.referred_by ?? null,
      referrals: enriched,
      totals,
    };
  });