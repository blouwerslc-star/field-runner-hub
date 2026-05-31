import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Public, safe-to-display platform stats. No PII.
 * Returns honest live counts — even small numbers. No fabricated data.
 */
export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const [investors, runners, tasksTotal, tasksCompleted, reviews, cities] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id", { head: true, count: "exact" }).eq("role", "investor"),
    supabaseAdmin.from("user_roles").select("user_id", { head: true, count: "exact" }).eq("role", "runner"),
    supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }),
    supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).in("status", ["completed", "approved", "paid"]),
    supabaseAdmin.from("reviews").select("rating"),
    supabaseAdmin.from("profiles").select("city, state").not("city", "is", null),
  ]);

  const ratings = reviews.data ?? [];
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / ratings.length) * 10) / 10
    : 0;

  const cityKeys = new Set<string>();
  for (const p of cities.data ?? []) {
    const c = (p as any).city?.trim?.();
    const s = (p as any).state?.trim?.();
    if (c && s) cityKeys.add(`${c.toLowerCase()}, ${s.toLowerCase()}`);
  }

  return {
    investors: investors.count ?? 0,
    runners: runners.count ?? 0,
    tasks_total: tasksTotal.count ?? 0,
    tasks_completed: tasksCompleted.count ?? 0,
    reviews_count: ratings.length,
    avg_rating: avgRating,
    cities_active: cityKeys.size,
  };
});