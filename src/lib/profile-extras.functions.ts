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