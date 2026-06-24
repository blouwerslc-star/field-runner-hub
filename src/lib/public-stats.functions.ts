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

/**
 * Full coverage dashboard payload for /coverage public page.
 * Aggregates totals + 7d deltas, state-level coverage, recent signups, and
 * underserved markets (cities with open tasks but few runners).
 * Honest live numbers — no fabricated counts.
 */
export const getCoverageDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = Date.now();
  const since7 = new Date(now - 7 * 86400_000).toISOString();
  const since30 = new Date(now - 30 * 86400_000).toISOString();

  const [runnerRoles, investorRoles, profiles, tasks, recentProfiles] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id, created_at").eq("role", "runner"),
    supabaseAdmin.from("user_roles").select("user_id, created_at").eq("role", "investor"),
    supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, city, state, created_at")
      .not("city", "is", null)
      .not("state", "is", null),
    supabaseAdmin
      .from("tasks")
      .select("city, state, status, created_at")
      .not("city", "is", null)
      .not("state", "is", null)
      .limit(2000),
    supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, city, state, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const runnerIds = new Set((runnerRoles.data ?? []).map((r: any) => r.user_id));
  const investorIds = new Set((investorRoles.data ?? []).map((r: any) => r.user_id));

  type Bucket = {
    state: string;
    cities: Set<string>;
    runners: number;
    investors: number;
    tasks_total: number;
    tasks_open: number;
    tasks_completed: number;
  };
  type CityBucket = {
    city: string;
    state: string;
    runners: number;
    open_tasks: number;
    completed_tasks: number;
  };

  const byState = new Map<string, Bucket>();
  const byCity = new Map<string, CityBucket>();

  const ensureState = (state: string): Bucket => {
    const key = state.toLowerCase();
    let b = byState.get(key);
    if (!b) {
      b = {
        state,
        cities: new Set(),
        runners: 0,
        investors: 0,
        tasks_total: 0,
        tasks_open: 0,
        tasks_completed: 0,
      };
      byState.set(key, b);
    }
    return b;
  };
  const ensureCity = (city: string, state: string): CityBucket => {
    const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
    let b = byCity.get(key);
    if (!b) {
      b = { city, state, runners: 0, open_tasks: 0, completed_tasks: 0 };
      byCity.set(key, b);
    }
    return b;
  };

  for (const p of profiles.data ?? []) {
    const city = (p as any).city?.trim?.();
    const state = (p as any).state?.trim?.();
    if (!city || !state) continue;
    const sb = ensureState(state);
    sb.cities.add(city.toLowerCase());
    const cb = ensureCity(city, state);
    if (runnerIds.has((p as any).user_id)) {
      sb.runners += 1;
      cb.runners += 1;
    }
    if (investorIds.has((p as any).user_id)) {
      sb.investors += 1;
    }
  }

  for (const t of tasks.data ?? []) {
    const city = (t as any).city?.trim?.();
    const state = (t as any).state?.trim?.();
    if (!city || !state) continue;
    const sb = ensureState(state);
    sb.cities.add(city.toLowerCase());
    const cb = ensureCity(city, state);
    sb.tasks_total += 1;
    const status = (t as any).status;
    if (status === "open") {
      sb.tasks_open += 1;
      cb.open_tasks += 1;
    } else if (["completed", "approved", "paid"].includes(status)) {
      sb.tasks_completed += 1;
      cb.completed_tasks += 1;
    }
  }

  const states = Array.from(byState.values())
    .map((b) => ({
      state: b.state,
      cities: b.cities.size,
      runners: b.runners,
      investors: b.investors,
      tasks_total: b.tasks_total,
      tasks_open: b.tasks_open,
      tasks_completed: b.tasks_completed,
    }))
    .sort((a, b) => b.runners + b.tasks_total - (a.runners + a.tasks_total));

  // Underserved: cities with open tasks but fewer than 2 runners
  const underserved = Array.from(byCity.values())
    .filter((c) => c.open_tasks > 0 && c.runners < 2)
    .sort((a, b) => b.open_tasks - a.open_tasks)
    .slice(0, 12);

  // Totals & 7d deltas
  const totalRunners = runnerIds.size;
  const totalInvestors = investorIds.size;
  const newRunners7d = (runnerRoles.data ?? []).filter(
    (r: any) => r.created_at && r.created_at >= since7,
  ).length;
  const newInvestors7d = (investorRoles.data ?? []).filter(
    (r: any) => r.created_at && r.created_at >= since7,
  ).length;
  const newRunners30d = (runnerRoles.data ?? []).filter(
    (r: any) => r.created_at && r.created_at >= since30,
  ).length;

  const allTasks = tasks.data ?? [];
  const tasksTotal = allTasks.length;
  const tasksCompleted = allTasks.filter((t: any) =>
    ["completed", "approved", "paid"].includes(t.status),
  ).length;
  const tasksOpen = allTasks.filter((t: any) => t.status === "open").length;
  const newTasks7d = allTasks.filter(
    (t: any) => t.created_at && t.created_at >= since7,
  ).length;

  const citiesActive = byCity.size;
  const statesActive = byState.size;

  // Recent signups — first name + initial only, plus city/state
  const recent = (recentProfiles.data ?? [])
    .filter((p: any) => p.full_name)
    .slice(0, 10)
    .map((p: any) => {
      const role = runnerIds.has(p.user_id)
        ? "runner"
        : investorIds.has(p.user_id)
          ? "investor"
          : "member";
      const name = (p.full_name as string).trim().split(/\s+/)[0];
      return {
        name,
        role,
        city: (p.city || "").trim() || null,
        state: (p.state || "").trim() || null,
        joined_at: p.created_at,
      };
    });

  return {
    totals: {
      runners: totalRunners,
      investors: totalInvestors,
      tasks_total: tasksTotal,
      tasks_open: tasksOpen,
      tasks_completed: tasksCompleted,
      cities_active: citiesActive,
      states_active: statesActive,
    },
    deltas_7d: {
      runners: newRunners7d,
      investors: newInvestors7d,
      tasks: newTasks7d,
    },
    deltas_30d: {
      runners: newRunners30d,
    },
    states,
    underserved,
    recent_signups: recent,
  };
});

/**
 * Per-state runner coverage with a small public preview list per state.
 * Used by the marketplace coverage map. No PII — first name + last initial,
 * city + state, profile slug only.
 */
export const getStateCoverage = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [runnerRoles, profiles] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id").eq("role", "runner"),
    supabaseAdmin
      .from("profiles")
      .select(
        "user_id, full_name, profile_slug, city, state, profile_photo_url, average_rating, top_runner, verified_status, public_profile_enabled, suspended",
      )
      .not("state", "is", null),
  ]);

  const runnerIds = new Set((runnerRoles.data ?? []).map((r: any) => r.user_id));

  // Normalize free-text state values (e.g. "Ohio", "ohio", "OH") to USPS code.
  const STATE_NAME_TO_ABBR: Record<string, string> = {
    alabama:"AL",alaska:"AK",arizona:"AZ",arkansas:"AR",california:"CA",colorado:"CO",
    connecticut:"CT",delaware:"DE","district of columbia":"DC",florida:"FL",georgia:"GA",
    hawaii:"HI",idaho:"ID",illinois:"IL",indiana:"IN",iowa:"IA",kansas:"KS",kentucky:"KY",
    louisiana:"LA",maine:"ME",maryland:"MD",massachusetts:"MA",michigan:"MI",minnesota:"MN",
    mississippi:"MS",missouri:"MO",montana:"MT",nebraska:"NE",nevada:"NV","new hampshire":"NH",
    "new jersey":"NJ","new mexico":"NM","new york":"NY","north carolina":"NC","north dakota":"ND",
    ohio:"OH",oklahoma:"OK",oregon:"OR",pennsylvania:"PA","rhode island":"RI","south carolina":"SC",
    "south dakota":"SD",tennessee:"TN",texas:"TX",utah:"UT",vermont:"VT",virginia:"VA",
    washington:"WA","west virginia":"WV",wisconsin:"WI",wyoming:"WY","puerto rico":"PR",
  };
  const VALID_ABBR = new Set(Object.values(STATE_NAME_TO_ABBR));
  function toAbbr(raw: string): string | null {
    const t = raw.trim();
    if (!t) return null;
    const upper = t.toUpperCase();
    if (t.length <= 3 && VALID_ABBR.has(upper)) return upper;
    return STATE_NAME_TO_ABBR[t.toLowerCase()] ?? null;
  }

  function maskName(full: string | null): string {
    const parts = (full || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "Runner";
    const fn = parts[0];
    const li = parts.length > 1 ? `${parts[parts.length - 1][0]?.toUpperCase() ?? ""}.` : "";
    return li ? `${fn} ${li}` : fn;
  }

  type Preview = {
    name: string;
    city: string | null;
    photo: string | null;
    rating: number | null;
    top: boolean;
    verified: boolean;
    slug: string | null;
  };
  type State = { state: string; count: number; preview: Preview[] };

  const byState = new Map<string, State>();
  for (const p of profiles.data ?? []) {
    const raw = (p as any).state?.trim?.();
    if (!raw) continue;
    if (!runnerIds.has((p as any).user_id)) continue;
    if ((p as any).suspended) continue;
    const code = toAbbr(raw);
    if (!code) continue;
    const bucket: State = byState.get(code) ?? { state: code, count: 0, preview: [] };
    bucket.count += 1;
    if (bucket.preview.length < 5 && (p as any).public_profile_enabled !== false) {
      bucket.preview.push({
        name: maskName((p as any).full_name ?? null),
        city: (p as any).city ?? null,
        photo: (p as any).profile_photo_url ?? null,
        rating: (p as any).average_rating ?? null,
        top: !!(p as any).top_runner,
        verified: !!(p as any).verified_status,
        slug: (p as any).profile_slug ?? null,
      });
    }
    byState.set(code, bucket);
  }

  return { states: Array.from(byState.values()) };
});