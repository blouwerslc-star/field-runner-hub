import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
/* ------------------------------ Mapbox token ------------------------------ */

export const getMapboxToken = createServerFn({ method: "GET" }).handler(async () => {
  return { token: process.env.MAPBOX_PUBLIC_TOKEN ?? "" };
});

/* -------------------------------- Portfolio ------------------------------- */

export const listPortfolio = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("profile_portfolio")
      .select("id, user_id, kind, url, thumb_url, caption, sort_order, created_at")
      .eq("user_id", data.userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const addPortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        kind: z.enum(["photo", "video", "before_after"]).default("photo"),
        url: z.string().url().max(800),
        thumb_url: z.string().url().max(800).optional().nullable(),
        caption: z.string().trim().max(280).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profile_portfolio")
      .insert({ user_id: userId, ...data })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

export const deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profile_portfolio").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------- Favorites ------------------------------- */

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ runnerId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("favorite_runners")
      .select("id")
      .eq("investor_id", userId)
      .eq("runner_id", data.runnerId)
      .maybeSingle();
    if (existing) {
      await supabase.from("favorite_runners").delete().eq("id", (existing as { id: string }).id);
      return { favorited: false };
    }
    const { error } = await supabase
      .from("favorite_runners")
      .insert({ investor_id: userId, runner_id: data.runnerId });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });

export const isFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ runnerId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("favorite_runners")
      .select("id")
      .eq("investor_id", userId)
      .eq("runner_id", data.runnerId)
      .maybeSingle();
    return { favorited: !!row };
  });

export const listMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: favs, error } = await supabase
      .from("favorite_runners")
      .select("runner_id, list_name, notes, created_at")
      .eq("investor_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (favs ?? []).map((f) => f.runner_id as string);
    if (!ids.length) return { runners: [] as any[] };
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, profile_slug, profile_photo_url, city, state, average_rating, review_count, completed_tasks_count, task_rate, headline, top_runner, verification_level")
      .in("user_id", ids);
    return { runners: profs ?? [] };
  });

/* ----------------------- Availability date blocks ------------------------ */

export const listAvailabilityBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ runnerId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data: rows, error } = await supabase
      .from("runner_availability_blocks")
      .select("id, blocked_date, reason")
      .eq("runner_id", data.runnerId)
      .gte("blocked_date", since.toISOString().slice(0, 10))
      .order("blocked_date", { ascending: true });
    if (error) throw new Error(error.message);
    return { blocks: rows ?? [] };
  });

export const addAvailabilityBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.string().max(200).optional().nullable() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("runner_availability_blocks")
      .upsert({ runner_id: userId, blocked_date: data.date, reason: data.reason ?? null }, { onConflict: "runner_id,blocked_date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeAvailabilityBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("runner_availability_blocks")
      .delete()
      .eq("runner_id", userId)
      .eq("blocked_date", data.date);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------- Touch last_active heartbeat --------------------- */

export const touchLastActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("user_id", userId);
    return { ok: true };
  });

/* ----------------------- Weekly availability schedule -------------------- */

const timeRe = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export const listAvailabilitySchedule = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ runnerId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("runner_availability_schedule")
      .select("id, weekday, start_time, end_time, label")
      .eq("runner_id", data.runnerId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw new Error(error.message);
    return { windows: rows ?? [] };
  });

export const listMyAvailabilitySchedule = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("runner_availability_schedule")
      .select("id, weekday, start_time, end_time, label")
      .eq("runner_id", userId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: prof } = await supabase
      .from("profiles")
      .select("timezone, scheduling_notes")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      windows: rows ?? [],
      timezone: (prof as { timezone?: string | null } | null)?.timezone ?? null,
      scheduling_notes: (prof as { scheduling_notes?: string | null } | null)?.scheduling_notes ?? null,
    };
  });

export const addAvailabilityWindow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        weekday: z.number().int().min(0).max(6),
        start_time: z.string().regex(timeRe),
        end_time: z.string().regex(timeRe),
        label: z.string().trim().max(60).optional().nullable(),
      })
      .refine((v) => v.end_time > v.start_time, { message: "end_time must be after start_time" })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("runner_availability_schedule")
      .insert({
        runner_id: userId,
        weekday: data.weekday,
        start_time: data.start_time,
        end_time: data.end_time,
        label: data.label ?? null,
      })
      .select("id, weekday, start_time, end_time, label")
      .single();
    if (error) throw new Error(error.message);
    return { window: row };
  });

export const removeAvailabilityWindow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("runner_availability_schedule")
      .delete()
      .eq("id", data.id)
      .eq("runner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearAvailabilityDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ weekday: z.number().int().min(0).max(6) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("runner_availability_schedule")
      .delete()
      .eq("runner_id", userId)
      .eq("weekday", data.weekday);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setSchedulingMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        timezone: z.string().trim().max(80).optional().nullable(),
        scheduling_notes: z.string().trim().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const patch: { timezone?: string | null; scheduling_notes?: string | null } = {};
    if ("timezone" in data) patch.timezone = data.timezone || null;
    if ("scheduling_notes" in data) patch.scheduling_notes = data.scheduling_notes || null;
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------- Public directory counts ------------------------- */

export const getPublicDirectoryCounts = createServerFn({ method: "GET" }).handler(async () => {
  const [{ data: roleRows }, { data: visibleProfiles }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id, role").in("role", ["runner", "investor"]),
    supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("public_profile_enabled", true)
      .eq("suspended", false),
  ]);
  const visible = new Set<string>((visibleProfiles ?? []).map((p: any) => p.user_id));
  let totalRunners = 0,
    totalInvestors = 0,
    publicRunners = 0,
    publicInvestors = 0;
  for (const r of roleRows ?? []) {
    if ((r as any).role === "runner") {
      totalRunners++;
      if (visible.has((r as any).user_id)) publicRunners++;
    } else if ((r as any).role === "investor") {
      totalInvestors++;
      if (visible.has((r as any).user_id)) publicInvestors++;
    }
  }
  return {
    runners: { total: totalRunners, public_visible: publicRunners, hidden: totalRunners - publicRunners },
    investors: { total: totalInvestors, public_visible: publicInvestors, hidden: totalInvestors - publicInvestors },
  };
});