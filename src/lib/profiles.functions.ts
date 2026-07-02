import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
const PUBLIC_COLUMNS =
  "user_id, profile_slug, full_name, city, state, profile_photo_url, cover_photo_url, headline, bio, services_offered, markets_served, experience_level, years_experience, task_rate, hourly_rate, availability_status, average_rating, review_count, completed_tasks_count, response_time, verified_status, featured, turnaround_time, task_types, transportation_available, service_radius, company_name, company_description, monthly_deal_volume, created_at, verification_level, verification_status, email_verified, phone_verified, identity_verified, background_check_verified, insurance_verified, top_runner, last_active_at, completion_rate, repeat_client_rate, response_time_minutes, specialties, real_estate_experience, real_estate_years, contractor_experience, contractor_years, property_management_experience, property_management_years, realtor_experience, realtor_years, rate_lockbox_install, rate_occupancy_check, rate_property_photos, rate_video_walkthrough, rate_sign_placement, avail_today, avail_this_week, avail_weekends, avail_emergency, timezone, scheduling_notes";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return { profile, roles: (roles ?? []).map((r) => r.role as string) };
  });

const updateSchema = z.object({
  full_name: z.string().trim().min(1).max(120).optional().nullable(),
  headline: z.string().trim().max(160).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(80).optional().nullable(),
  profile_photo_url: z.string().url().max(500).optional().nullable(),
  cover_photo_url: z.string().url().max(500).optional().nullable(),
  services_offered: z.array(z.string().min(1).max(60)).max(20).optional(),
  markets_served: z.string().trim().max(500).optional().nullable(),
  experience_level: z.enum(["beginner", "intermediate", "expert"]).optional().nullable(),
  years_experience: z.number().int().min(0).max(80).optional().nullable(),
  service_radius: z.string().trim().max(40).optional().nullable(),
  availability_status: z.enum(["available", "busy", "unavailable"]).optional(),
  hourly_rate: z.number().min(0).max(10000).optional().nullable(),
  task_rate: z.number().min(0).max(100000).optional().nullable(),
  turnaround_time: z.string().trim().max(120).optional().nullable(),
  response_time: z.string().trim().max(120).optional().nullable(),
  phone_public: z.boolean().optional(),
  public_profile_enabled: z.boolean().optional(),
  transportation_available: z.boolean().optional().nullable(),
  task_types: z.array(z.string().min(1).max(60)).max(20).optional(),
  preferred_payout_min: z.number().min(0).max(100000).optional().nullable(),
  preferred_payout_max: z.number().min(0).max(100000).optional().nullable(),
  company_name: z.string().trim().max(120).optional().nullable(),
  company_description: z.string().trim().max(2000).optional().nullable(),
  monthly_deal_volume: z.string().trim().max(60).optional().nullable(),
});
const profileExtrasSchema = z.object({
  specialties: z.array(z.string().min(1).max(60)).max(30).optional(),
  insurance_verified: z.boolean().optional(),
  real_estate_experience: z.boolean().optional(),
  real_estate_years: z.number().int().min(0).max(80).optional().nullable(),
  contractor_experience: z.boolean().optional(),
  contractor_years: z.number().int().min(0).max(80).optional().nullable(),
  property_management_experience: z.boolean().optional(),
  property_management_years: z.number().int().min(0).max(80).optional().nullable(),
  realtor_experience: z.boolean().optional(),
  realtor_years: z.number().int().min(0).max(80).optional().nullable(),
  rate_lockbox_install: z.number().min(0).max(100000).optional().nullable(),
  rate_occupancy_check: z.number().min(0).max(100000).optional().nullable(),
  rate_property_photos: z.number().min(0).max(100000).optional().nullable(),
  rate_video_walkthrough: z.number().min(0).max(100000).optional().nullable(),
  rate_sign_placement: z.number().min(0).max(100000).optional().nullable(),
  avail_today: z.boolean().optional(),
  avail_this_week: z.boolean().optional(),
  avail_weekends: z.boolean().optional(),
  avail_emergency: z.boolean().optional(),
  home_lat: z.number().min(-90).max(90).optional().nullable(),
  home_lng: z.number().min(-180).max(180).optional().nullable(),
});
const fullUpdateSchema = updateSchema.merge(profileExtrasSchema);

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => fullUpdateSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { profile: row };
  });

export const getPublicProfileBySlug = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ data }) => {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(PUBLIC_COLUMNS)
      .eq("profile_slug", data.slug)
      .eq("public_profile_enabled", true)
      .eq("suspended", false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return { profile: null, roles: [] as string[] };
    const userId = (profile as { user_id: string }).user_id;
    const [{ data: roles }, { data: runner }, { data: progress }, { data: portfolio }, { data: reviewRows }, { data: blocks }, { data: tasks }, { count: favoriteCount }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin
        .from("runner_profiles")
        .select("certification_level, certification_status, certified_at, verified_at, elite_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("academy_progress")
        .select("module_id, passed")
        .eq("user_id", userId),
      supabaseAdmin
        .from("profile_portfolio")
        .select("id, kind, url, thumb_url, caption, sort_order, created_at")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(24),
      supabaseAdmin
        .from("reviews")
        .select("id, task_id, reviewer_id, rating, comment, direction, created_at")
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("runner_availability_blocks")
        .select("blocked_date, reason")
        .eq("runner_id", userId)
        .gte("blocked_date", new Date().toISOString().slice(0, 10))
        .order("blocked_date", { ascending: true })
        .limit(60),
      supabaseAdmin
        .from("tasks")
        .select("id, status, task_type, investor_id, runner_id, created_at, updated_at")
        .or(`runner_id.eq.${userId},investor_id.eq.${userId}`)
        .limit(500),
      supabaseAdmin
        .from("favorite_runners")
        .select("id", { count: "exact", head: true })
        .eq("runner_id", userId),
    ]);
    // Enrich reviews with reviewer name/photo/slug
    const reviewerIds = Array.from(new Set((reviewRows ?? []).map((r) => r.reviewer_id as string)));
    const reviewerMap = new Map<string, { name: string | null; photo: string | null; slug: string | null }>();
    if (reviewerIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, profile_photo_url, profile_slug")
        .in("user_id", reviewerIds);
      for (const p of profs ?? []) {
        reviewerMap.set((p as any).user_id, {
          name: (p as any).full_name,
          photo: (p as any).profile_photo_url,
          slug: (p as any).profile_slug,
        });
      }
    }
    const reviews = (reviewRows ?? []).map((r) => ({ ...r, reviewer: reviewerMap.get(r.reviewer_id as string) ?? { name: null, photo: null, slug: null } }));
    // Compute metrics from tasks where this user is the runner
    const runnerTasks = (tasks ?? []).filter((t: any) => t.runner_id === userId);
    const totalAssigned = runnerTasks.length;
    const completedSet = new Set(["completed", "approved", "paid"]);
    const completed = runnerTasks.filter((t: any) => completedSet.has(t.status)).length;
    const cancelledOrDisputed = runnerTasks.filter((t: any) => ["cancelled", "disputed"].includes(t.status)).length;
    const completionRate = totalAssigned ? Math.round((completed / Math.max(1, totalAssigned - 0)) * 100) : 0;
    const investorIds = runnerTasks.map((t: any) => t.investor_id as string).filter(Boolean);
    const uniqueInvestors = new Set(investorIds).size;
    const repeatInvestors = investorIds.length - uniqueInvestors;
    const repeatClientRate = uniqueInvestors ? Math.round((repeatInvestors / Math.max(1, uniqueInvestors)) * 100) : 0;
    const lastActivity = runnerTasks.reduce<string | null>((acc, t: any) => {
      const d = t.updated_at as string;
      return !acc || (d && d > acc) ? d : acc;
    }, (profile as any).last_active_at ?? null);
    const metrics = {
      total_assigned: totalAssigned,
      completed,
      cancelled_or_disputed: cancelledOrDisputed,
      completion_rate: completionRate,
      repeat_client_rate: repeatClientRate,
      unique_clients: uniqueInvestors,
      last_activity_at: lastActivity,
      favorite_count: favoriteCount ?? 0,
    };
    const { earnedSkillBadges } = await import("@/lib/academy/badges");
    const passedIds = (progress ?? []).filter((p: any) => p.passed).map((p: any) => p.module_id);
    const earned = earnedSkillBadges(passedIds).map((b) => ({ id: b.id, label: b.label, moduleId: b.moduleId }));
    return {
      profile,
      roles: (roles ?? []).map((r) => r.role as string),
      runner: runner ?? null,
      academy: { passed_module_ids: passedIds, earned_badges: earned },
      portfolio: portfolio ?? [],
      reviews,
      availability_blocks: blocks ?? [],
      metrics,
    };
  });

const listSchema = z.object({
  q: z.string().max(120).optional(),
  role: z.enum(["runner", "investor"]).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  zip: z.string().trim().regex(/^\d{3,5}$/).optional(),
  service: z.string().max(60).optional(),
  availability: z.enum(["available", "busy", "unavailable"]).optional(),
  sort: z.enum(["rating", "completed", "newest", "featured"]).default("featured"),
  limit: z.number().int().min(1).max(200).default(120),
  viewerLoggedIn: z.boolean().optional().default(false),
  certifications: z.array(z.string().min(1).max(80)).max(20).optional(),
});

function maskName(full: string | null | undefined): string | null {
  if (!full) return null;
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? "";
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

// Major metros — map known small towns / suburbs to their parent market.
// For unknown cities we fall back to "{City} area" so we don't reveal
// the exact small town/zip-level location to logged-out viewers.
const METRO_MAP: Record<string, string> = {
  detroit: "Detroit market",
  dearborn: "Detroit market",
  warren: "Detroit market",
  southfield: "Detroit market",
  atlanta: "Atlanta metro",
  marietta: "Atlanta metro",
  decatur: "Atlanta metro",
  sandy: "Atlanta metro",
  dallas: "Dallas–Fort Worth metro",
  "fort worth": "Dallas–Fort Worth metro",
  arlington: "Dallas–Fort Worth metro",
  plano: "Dallas–Fort Worth metro",
  irving: "Dallas–Fort Worth metro",
  "los angeles": "Los Angeles market",
  pasadena: "Los Angeles market",
  burbank: "Los Angeles market",
  glendale: "Los Angeles market",
  "long beach": "Los Angeles market",
  chicago: "Chicago market",
  evanston: "Chicago market",
  oak: "Chicago market",
  houston: "Houston market",
  phoenix: "Phoenix market",
  mesa: "Phoenix market",
  scottsdale: "Phoenix market",
  philadelphia: "Philadelphia market",
  miami: "Miami metro",
  "fort lauderdale": "Miami metro",
  hialeah: "Miami metro",
  charlotte: "Charlotte market",
  tampa: "Tampa Bay market",
  "st petersburg": "Tampa Bay market",
  orlando: "Orlando market",
  nashville: "Nashville market",
  indianapolis: "Indianapolis market",
  cleveland: "Cleveland market",
  columbus: "Columbus market",
  cincinnati: "Cincinnati market",
  pittsburgh: "Pittsburgh market",
  baltimore: "Baltimore market",
  "kansas city": "Kansas City market",
  "st louis": "St. Louis market",
  "saint louis": "St. Louis market",
  memphis: "Memphis market",
};

function maskCity(city: string | null | undefined): string | null {
  if (!city) return null;
  const key = city.trim().toLowerCase();
  if (METRO_MAP[key]) return METRO_MAP[key];
  return `${city.trim()} area`;
}

export const listPublicProfiles = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => listSchema.parse(i ?? {}))
  .handler(async ({ data }) => {
    // Resolve ZIP → city/state when caller provides a zip but no explicit city/state.
    let effectiveCity = data.city;
    let effectiveState = data.state;
    if (data.zip && !effectiveState) {
      const { lookupZip } = await import("@/lib/geocoding.server");
      const r = await lookupZip(data.zip);
      if (r?.state) effectiveState = r.state;
      if (r?.city && !effectiveCity) effectiveCity = r.city;
    }
    let q = supabaseAdmin
      .from("profiles")
      .select(PUBLIC_COLUMNS)
      .eq("public_profile_enabled", true)
      .eq("suspended", false)
      .limit(data.limit);

    if (data.q) q = q.or(`full_name.ilike.%${data.q}%,headline.ilike.%${data.q}%,company_name.ilike.%${data.q}%`);
    if (effectiveCity) q = q.ilike("city", `%${effectiveCity}%`);
    if (effectiveState) q = q.ilike("state", `%${effectiveState}%`);
    if (data.service) q = q.contains("services_offered", [data.service]);
    if (data.availability) q = q.eq("availability_status", data.availability);

    // Verified runners always rank first
    q = q.order("verification_level", { ascending: false });
    if (data.sort === "rating") q = q.order("average_rating", { ascending: false });
    else if (data.sort === "completed") q = q.order("completed_tasks_count", { ascending: false });
    else if (data.sort === "newest") q = q.order("created_at", { ascending: false });
    else q = q.order("featured", { ascending: false }).order("average_rating", { ascending: false });

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let filtered = rows ?? [];
    if (data.role) {
      const userIds = filtered.map((r) => (r as { user_id: string }).user_id);
      if (userIds.length) {
        const { data: roleRows } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        const allowed = new Set(
          (roleRows ?? []).filter((r) => r.role === data.role).map((r) => r.user_id),
        );
        filtered = filtered.filter((r) => allowed.has((r as { user_id: string }).user_id));
      }
    }
    // attach roles
    const userIds = filtered.map((r) => (r as { user_id: string }).user_id);
    const rolesByUser = new Map<string, string[]>();
    const certByUser = new Map<string, { level: string | null; status: string | null }>();
    const academyCertsByUser = new Map<string, string[]>();
    if (userIds.length) {
      const { data: roleRows } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      for (const r of roleRows ?? []) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as string);
        rolesByUser.set(r.user_id, arr);
      }
      const { data: runnerRows } = await supabaseAdmin
        .from("runner_profiles")
        .select("user_id, certification_level, certification_status")
        .in("user_id", userIds);
      for (const r of runnerRows ?? []) {
        certByUser.set((r as any).user_id, {
          level: (r as any).certification_level ?? null,
          status: (r as any).certification_status ?? null,
        });
      }
      // Per-course academy certifications, joined to academy_courses for slug
      const { data: acRows } = await supabaseAdmin
        .from("academy_certifications")
        .select("user_id, course_id, academy_courses!inner(slug)")
        .in("user_id", userIds);
      for (const r of (acRows ?? []) as any[]) {
        const slug = r.academy_courses?.slug;
        if (!slug) continue;
        const list = academyCertsByUser.get(r.user_id) ?? [];
        if (!list.includes(slug)) list.push(slug);
        academyCertsByUser.set(r.user_id, list);
      }
    }

    // Filter by required certifications (all must be held)
    if (data.certifications && data.certifications.length > 0) {
      const required = data.certifications;
      filtered = filtered.filter((r) => {
        const held = academyCertsByUser.get((r as any).user_id) ?? [];
        return required.every((c) => held.includes(c));
      });
    }

    return {
       profiles: filtered.map((p): any => {
        const row = p as Record<string, unknown>;
        const base: any = {
          ...row,
          roles: rolesByUser.get((p as { user_id: string }).user_id) ?? [],
          academy_certification: certByUser.get((p as { user_id: string }).user_id) ?? null,
          academy_certifications: academyCertsByUser.get((p as { user_id: string }).user_id) ?? [],
        };
        if (data.viewerLoggedIn) return base;
        // Public (logged-out) view: mask name, strip slug + free-text PII fields
        return {
          ...base,
          full_name: maskName(base.full_name as string | null | undefined),
          city: maskCity(base.city as string | null | undefined),
          profile_slug: null,
          bio: null,
          company_description: null,
          company_name: null,
        };
      }),
      viewerLoggedIn: data.viewerLoggedIn,
    };
  });

// Admin
async function assertAdmin(supabase: import("@supabase/supabase-js").SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin only");
}

// Public list of available academy certification courses, used for filter chips.
export const listAcademyCertOptions = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("academy_courses")
    .select("slug, title, category, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { courses: (data ?? []) as Array<{ slug: string; title: string; category: string | null; sort_order: number }> };
});

export const adminListProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { profiles: data ?? [] };
  });

const adminFlagSchema = z.object({
  userId: z.string().uuid(),
  verified_status: z.boolean().optional(),
  featured: z.boolean().optional(),
  suspended: z.boolean().optional(),
  public_profile_enabled: z.boolean().optional(),
});

export const adminUpdateProfileFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => adminFlagSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { userId, ...rest } = data;
    const { error } = await supabaseAdmin.from("profiles").update(rest).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });