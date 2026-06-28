import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public read of the active "First Task Free" promotional campaign.
 * Returns null when no enabled, non-expired campaign exists.
 */
export const getActivePromoCampaign = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data } = await supabase
      .from("promo_campaigns")
      .select("id, code, name, enabled, credit_cents, expires_at, legal_disclaimer")
      .eq("code", "first_task_free")
      .eq("enabled", true)
      .maybeSingle();
    if (!data) return { campaign: null };
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return { campaign: null };
    }
    return { campaign: data };
  });

/**
 * Returns the caller's promo credit row for the active campaign (if any).
 */
export const getMyPromoCredit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: campaign } = await supabase
      .from("promo_campaigns")
      .select("id, name, credit_cents, enabled, expires_at, legal_disclaimer")
      .eq("code", "first_task_free")
      .maybeSingle();
    if (!campaign) return { credit: null, campaign: null };
    const { data: credit } = await supabase
      .from("promo_credits")
      .select("id, status, credit_cents, remaining_cents, issued_at, redeemed_at, task_id")
      .eq("campaign_id", campaign.id)
      .eq("user_id", userId)
      .maybeSingle();
    return { credit: credit ?? null, campaign };
  });

/**
 * Public analytics event recorder. Rate-limited via the database GC; not
 * authoritative, used for funnel analytics only.
 */
const EVENT_TYPES = [
  "banner_view",
  "banner_click",
  "signup",
  "first_task_created",
  "credit_redeemed",
  "repeat_task",
] as const;

export const recordPromoEvent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      eventType: z.enum(EVENT_TYPES),
      campaignCode: z.string().min(1).max(64).default("first_task_free"),
      metadata: z.record(z.string(), z.any()).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: campaign } = await supabaseAdmin
      .from("promo_campaigns")
      .select("id")
      .eq("code", data.campaignCode)
      .maybeSingle();
    if (!campaign) return { ok: false };
    await supabaseAdmin.from("promo_events").insert({
      campaign_id: campaign.id,
      event_type: data.eventType,
      metadata: data.metadata ?? {},
    });
    return { ok: true };
  });

/**
 * Admin: aggregate analytics for the active campaign.
 */
export const getPromoAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      campaignCode: z.string().min(1).max(64).default("first_task_free"),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Admins only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: campaign } = await supabaseAdmin
      .from("promo_campaigns")
      .select("*")
      .eq("code", data.campaignCode)
      .maybeSingle();
    if (!campaign) throw new Error("Campaign not found");

    const { data: events } = await supabaseAdmin
      .from("promo_events")
      .select("event_type, user_id, created_at, metadata")
      .eq("campaign_id", campaign.id);

    const counts: Record<string, number> = {};
    for (const e of events ?? []) counts[e.event_type] = (counts[e.event_type] ?? 0) + 1;

    const { data: credits } = await supabaseAdmin
      .from("promo_credits")
      .select("status, credit_cents, remaining_cents, user_id")
      .eq("campaign_id", campaign.id);

    const totalIssued = (credits ?? []).length;
    const totalRedeemed = (credits ?? []).filter((c) => c.status === "redeemed").length;
    const totalCostCents = (credits ?? [])
      .filter((c) => c.status === "redeemed")
      .reduce((s, c) => s + (c.credit_cents - c.remaining_cents), 0);

    // Revenue from redeemers' subsequent (non-first) tasks
    const redeemerIds = (credits ?? []).filter((c) => c.status === "redeemed").map((c) => c.user_id);
    let downstreamRevenueCents = 0;
    let repeatTaskUsers = 0;
    if (redeemerIds.length) {
      const { data: pays } = await supabaseAdmin
        .from("payments")
        .select("investor_id, amount_cents, task_id, created_at, status, kind")
        .in("investor_id", redeemerIds)
        .eq("kind", "task");
      const byUser = new Map<string, { count: number; revenue: number }>();
      for (const p of pays ?? []) {
        const e = byUser.get(p.investor_id!) ?? { count: 0, revenue: 0 };
        e.count += 1;
        e.revenue += p.amount_cents ?? 0;
        byUser.set(p.investor_id!, e);
      }
      for (const [, v] of byUser) {
        if (v.count > 1) {
          repeatTaskUsers += 1;
          downstreamRevenueCents += v.revenue;
        }
      }
    }

    const signups = counts.signup ?? 0;
    const firstTasks = counts.first_task_created ?? 0;

    return {
      campaign,
      stats: {
        bannerViews: counts.banner_view ?? 0,
        bannerClicks: counts.banner_click ?? 0,
        signups,
        firstTasksCreated: firstTasks,
        creditsIssued: totalIssued,
        creditsRedeemed: totalRedeemed,
        totalCostCents,
        downstreamRevenueCents,
        repeatTaskUsers,
        signupConversionPct: signups > 0 ? (firstTasks / signups) * 100 : 0,
        repeatRatePct: totalRedeemed > 0 ? (repeatTaskUsers / totalRedeemed) * 100 : 0,
      },
    };
  });

/**
 * Admin: export campaign analytics as CSV.
 */
export const exportPromoAnalyticsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Admins only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: campaign } = await supabaseAdmin
      .from("promo_campaigns").select("id").eq("code", "first_task_free").maybeSingle();
    if (!campaign) throw new Error("Campaign not found");

    const { data: credits } = await supabaseAdmin
      .from("promo_credits")
      .select("user_id, email, status, credit_cents, remaining_cents, issued_at, redeemed_at, task_id")
      .eq("campaign_id", campaign.id)
      .order("issued_at", { ascending: false });

    const header = "user_id,email,status,credit_cents,remaining_cents,issued_at,redeemed_at,task_id";
    const rows = (credits ?? []).map((c) =>
      [c.user_id, c.email ?? "", c.status, c.credit_cents, c.remaining_cents,
        c.issued_at ?? "", c.redeemed_at ?? "", c.task_id ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    return { csv: [header, ...rows].join("\n") };
  });

/**
 * Admin: update campaign settings.
 */
export const updatePromoCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      campaignCode: z.string().min(1).max(64).default("first_task_free"),
      enabled: z.boolean().optional(),
      creditCents: z.number().int().min(0).max(50000).optional(),
      expiresAt: z.string().datetime().nullable().optional(),
      legalDisclaimer: z.string().min(1).max(2000).optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Admins only");

    const update: Record<string, unknown> = {};
    if (data.enabled !== undefined) update.enabled = data.enabled;
    if (data.creditCents !== undefined) update.credit_cents = data.creditCents;
    if (data.expiresAt !== undefined) update.expires_at = data.expiresAt;
    if (data.legalDisclaimer !== undefined) update.legal_disclaimer = data.legalDisclaimer;

    const { error } = await supabase
      .from("promo_campaigns")
      .update(update)
      .eq("code", data.campaignCode);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
