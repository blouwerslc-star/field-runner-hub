import { createServerFn } from "@tanstack/react-start";
// supabaseAdmin (service role) is loaded lazily inside each handler.
// Top-level imports of *.server.ts in a .functions.ts file ship server-only
// modules into the client bundle via the route import graph.

/**
 * Public, safe-to-display platform stats. No PII.
 * Returns honest live counts — even small numbers. No fabricated data.
 */
export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

/**
 * City-level coverage points (no precise coords, no PII).
 * Used for the homepage "market coverage" map.
 * Aggregates open tasks + active runners by city/state.
 */
export const getCoveragePoints = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [runners, tasks] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("user_id, city, state")
      .not("city", "is", null)
      .not("state", "is", null)
      .in(
        "user_id",
        (
          (await supabaseAdmin.from("user_roles").select("user_id").eq("role", "runner"))
            .data ?? []
        ).map((r: any) => r.user_id),
      ),
    supabaseAdmin
      .from("tasks")
      .select("city, state, status")
      .eq("status", "open")
      .not("city", "is", null)
      .not("state", "is", null)
      .limit(500),
  ]);

  type Bucket = { city: string; state: string; runners: number; tasks: number };
  const buckets = new Map<string, Bucket>();
  const norm = (c?: string | null, s?: string | null) => {
    const cc = (c || "").trim();
    const ss = (s || "").trim();
    if (!cc || !ss) return null;
    return { key: `${cc.toLowerCase()}|${ss.toLowerCase()}`, city: cc, state: ss };
  };

  for (const r of runners.data ?? []) {
    const n = norm((r as any).city, (r as any).state);
    if (!n) continue;
    const b = buckets.get(n.key) ?? { city: n.city, state: n.state, runners: 0, tasks: 0 };
    b.runners += 1;
    buckets.set(n.key, b);
  }
  for (const t of tasks.data ?? []) {
    const n = norm((t as any).city, (t as any).state);
    if (!n) continue;
    const b = buckets.get(n.key) ?? { city: n.city, state: n.state, runners: 0, tasks: 0 };
    b.tasks += 1;
    buckets.set(n.key, b);
  }

  const points = Array.from(buckets.values()).map((b, i) => ({
    id: `coverage-${i}`,
    city: b.city,
    state: b.state,
    runners: b.runners,
    tasks: b.tasks,
  }));

  return { points };
});