import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}

export const getInvestorAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const investorId = context.userId;
    const now = Date.now();
    const since30 = new Date(now - 30 * 86400_000).toISOString();
    const since90 = new Date(now - 90 * 86400_000).toISOString();

    const supabase = context.supabase;
    const [tasksRes, paymentsRes, reviewsRes, appsRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, status, task_type, payout_amount, funded, city, state, runner_id, created_at, updated_at, due_date")
        .eq("investor_id", investorId),
      supabase
        .from("payments")
        .select("amount_cents, platform_fee_cents, runner_payout_cents, status, kind, runner_id, created_at, paid_at, task_id")
        .eq("investor_id", investorId),
      supabase
        .from("reviews")
        .select("rating, direction, reviewee_id, task_id, created_at")
        .eq("reviewer_id", investorId),
      supabase
        .from("task_applications")
        .select("id, task_id, status, created_at, tasks!inner(investor_id)")
        .eq("tasks.investor_id", investorId),
    ]);

    const tasks = (tasksRes.data ?? []) as any[];
    const payments = (paymentsRes.data ?? []) as any[];
    const reviews = (reviewsRes.data ?? []) as any[];
    const apps = (appsRes.data ?? []) as any[];

    const completedStatuses = new Set(["approved", "paid", "completed"]);
    const inFlightStatuses = new Set(["open", "assigned", "in_progress", "submitted", "revision_requested"]);

    let inEscrowCents = 0;
    let spend30Cents = 0;
    let spendAllCents = 0;
    let feesAllCents = 0;
    for (const p of payments) {
      if (p.status === "paid") {
        spendAllCents += p.amount_cents ?? 0;
        feesAllCents += p.platform_fee_cents ?? 0;
        if (p.paid_at && new Date(p.paid_at).getTime() >= now - 30 * 86400_000) {
          spend30Cents += p.amount_cents ?? 0;
        }
      }
      if (p.status === "escrow" || p.status === "held" || p.status === "authorized") {
        inEscrowCents += p.amount_cents ?? 0;
      }
    }
    // Fallback in-escrow from tasks if no payment rows match
    if (inEscrowCents === 0) {
      for (const t of tasks) {
        if (t.funded && inFlightStatuses.has(t.status)) {
          inEscrowCents += Math.round(Number(t.payout_amount ?? 0) * 100);
        }
      }
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => completedStatuses.has(t.status));
    const openTasks = tasks.filter((t) => t.status === "open" || t.status === "assigned");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "submitted" || t.status === "revision_requested");
    const cancelled = tasks.filter((t) => t.status === "cancelled" || t.status === "expired").length;
    const completionRate = totalTasks ? completedTasks.length / totalTasks : 0;

    // Avg time-to-complete (created -> updated for completed tasks) in hours
    const completionHours = completedTasks
      .map((t) => (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 3600_000)
      .filter((h) => Number.isFinite(h) && h > 0);
    const avgCompletionHours = completionHours.length
      ? completionHours.reduce((s, h) => s + h, 0) / completionHours.length
      : 0;

    // Time-to-first-application (hours) per task
    const firstAppByTask = new Map<string, number>();
    for (const a of apps) {
      const prior = firstAppByTask.get(a.task_id);
      const t = new Date(a.created_at).getTime();
      if (prior === undefined || t < prior) firstAppByTask.set(a.task_id, t);
    }
    const ttaHours: number[] = [];
    const appsPerTask = new Map<string, number>();
    for (const a of apps) appsPerTask.set(a.task_id, (appsPerTask.get(a.task_id) ?? 0) + 1);
    for (const t of tasks) {
      const first = firstAppByTask.get(t.id);
      if (first) ttaHours.push((first - new Date(t.created_at).getTime()) / 3600_000);
    }
    const avgTimeToFirstApp = ttaHours.length ? ttaHours.reduce((s, h) => s + h, 0) / ttaHours.length : 0;
    const avgAppsPerTask = tasks.length
      ? [...appsPerTask.values()].reduce((s, n) => s + n, 0) / tasks.length
      : 0;

    // By task type
    const byTypeMap = new Map<string, { count: number; spend_cents: number; completed: number }>();
    for (const t of tasks) {
      const row = byTypeMap.get(t.task_type) ?? { count: 0, spend_cents: 0, completed: 0 };
      row.count += 1;
      if (completedStatuses.has(t.status)) {
        row.completed += 1;
        row.spend_cents += Math.round(Number(t.payout_amount ?? 0) * 100);
      }
      byTypeMap.set(t.task_type, row);
    }
    const byType = [...byTypeMap.entries()]
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.spend_cents - a.spend_cents);

    // By market (city, state)
    const byMarketMap = new Map<string, { city: string; state: string; count: number; spend_cents: number }>();
    for (const t of tasks) {
      const key = `${t.city ?? ""}|${t.state ?? ""}`;
      const row = byMarketMap.get(key) ?? { city: t.city ?? "—", state: t.state ?? "—", count: 0, spend_cents: 0 };
      row.count += 1;
      if (completedStatuses.has(t.status)) {
        row.spend_cents += Math.round(Number(t.payout_amount ?? 0) * 100);
      }
      byMarketMap.set(key, row);
    }
    const byMarket = [...byMarketMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

    // Top runners
    const runnerSpend = new Map<string, { runner_id: string; tasks: number; spend_cents: number; ratings: number[] }>();
    for (const t of tasks) {
      if (!t.runner_id) continue;
      const row = runnerSpend.get(t.runner_id) ?? { runner_id: t.runner_id, tasks: 0, spend_cents: 0, ratings: [] };
      row.tasks += 1;
      if (completedStatuses.has(t.status)) row.spend_cents += Math.round(Number(t.payout_amount ?? 0) * 100);
      runnerSpend.set(t.runner_id, row);
    }
    for (const r of reviews) {
      if (r.direction === "investor_to_runner" && r.reviewee_id && runnerSpend.has(r.reviewee_id)) {
        runnerSpend.get(r.reviewee_id)!.ratings.push(r.rating);
      }
    }
    const runnerIds = [...runnerSpend.keys()];
    let runnerProfiles: any[] = [];
    if (runnerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, city, state")
        .in("user_id", runnerIds);
      runnerProfiles = profs ?? [];
    }
    const profileMap = new Map(runnerProfiles.map((p) => [p.user_id, p]));
    const topRunners = [...runnerSpend.values()]
      .sort((a, b) => b.spend_cents - a.spend_cents)
      .slice(0, 5)
      .map((r) => {
        const p = profileMap.get(r.runner_id);
        const avgRating = r.ratings.length ? r.ratings.reduce((s, n) => s + n, 0) / r.ratings.length : null;
        return {
          runner_id: r.runner_id,
          full_name: p?.full_name ?? "Runner",
          avatar_url: p?.avatar_url ?? null,
          city: p?.city ?? null,
          state: p?.state ?? null,
          tasks: r.tasks,
          spend_cents: r.spend_cents,
          avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        };
      });

    // Daily task volume + spend (last 30 days)
    const daily: { day: string; tasks: number; spend_cents: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400_000);
      const key = d.toISOString().slice(0, 10);
      const dayTasks = tasks.filter((t) => (t.created_at ?? "").slice(0, 10) === key);
      const daySpend = payments
        .filter((p) => p.status === "paid" && (p.paid_at ?? "").slice(0, 10) === key)
        .reduce((s, p) => s + (p.amount_cents ?? 0), 0);
      daily.push({ day: key, tasks: dayTasks.length, spend_cents: daySpend });
    }

    return {
      totals: {
        tasks: totalTasks,
        open: openTasks.length,
        in_progress: inProgressTasks.length,
        completed: completedTasks.length,
        cancelled,
        completion_rate: Math.round(completionRate * 100) / 100,
        in_escrow_cents: inEscrowCents,
        spend_30_cents: spend30Cents,
        spend_all_cents: spendAllCents,
        platform_fees_cents: feesAllCents,
      },
      performance: {
        avg_completion_hours: Math.round(avgCompletionHours * 10) / 10,
        avg_time_to_first_application_hours: Math.round(avgTimeToFirstApp * 10) / 10,
        avg_applications_per_task: Math.round(avgAppsPerTask * 10) / 10,
      },
      by_type: byType,
      by_market: byMarket,
      top_runners: topRunners,
      daily,
      since: { thirty: since30, ninety: since90 },
    };
  });

export const getPlatformMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const now = Date.now();
    const since30 = new Date(now - 30 * 86400_000).toISOString();
    const since7 = new Date(now - 7 * 86400_000).toISOString();

    const [profilesAll, profiles30, profiles7, roles, tasksAll, tasksOpen, tasksDone, payments, apps, reviews, reports, disputes, visibleProfiles] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id", { head: true, count: "exact" }),
      supabaseAdmin.from("profiles").select("user_id", { head: true, count: "exact" }).gte("created_at", since30),
      supabaseAdmin.from("profiles").select("user_id", { head: true, count: "exact" }).gte("created_at", since7),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("tasks").select("id, status, payout_amount, created_at"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).eq("status", "open"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).in("status", ["completed","approved","paid"]),
      supabaseAdmin.from("payments").select("amount_cents, platform_fee_cents, runner_payout_cents, status, created_at"),
      supabaseAdmin.from("task_applications").select("id", { head: true, count: "exact" }),
      supabaseAdmin.from("reviews").select("rating"),
      supabaseAdmin.from("reports").select("id", { head: true, count: "exact" }).eq("status", "open"),
      supabaseAdmin.from("disputes").select("id", { head: true, count: "exact" }).in("status", ["open","under_review"]),
      supabaseAdmin.from("profiles").select("user_id").eq("public_profile_enabled", true).eq("suspended", false),
    ]);

    const roleCounts: Record<string, number> = { admin: 0, investor: 0, runner: 0 };
    const roleByUser: Record<string, string[]> = {};
    for (const r of (roles.data ?? []) as { user_id: string; role: string }[]) {
      roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
      (roleByUser[r.user_id] ||= []).push(r.role);
    }
    const visibleSet = new Set<string>(((visibleProfiles.data ?? []) as { user_id: string }[]).map((p) => p.user_id));
    let publicRunners = 0, publicInvestors = 0;
    for (const [uid, rs] of Object.entries(roleByUser)) {
      if (!visibleSet.has(uid)) continue;
      if (rs.includes("runner")) publicRunners++;
      if (rs.includes("investor")) publicInvestors++;
    }

    const allTasks = tasksAll.data ?? [];
    const gmvCents = (payments.data ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + (p.amount_cents ?? 0), 0);
    const feeCents = (payments.data ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + (p.platform_fee_cents ?? 0), 0);
    const payoutCents = (payments.data ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + (p.runner_payout_cents ?? 0), 0);

    const avgPayout = allTasks.length
      ? allTasks.reduce((s: number, t: any) => s + (Number(t.payout_amount) || 0), 0) / allTasks.length
      : 0;

    const ratings = reviews.data ?? [];
    const avgRating = ratings.length ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length : 0;

    // tasks per day (last 14)
    const days: { day: string; tasks: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400_000);
      const key = d.toISOString().slice(0, 10);
      const count = allTasks.filter((t: any) => (t.created_at ?? "").slice(0, 10) === key).length;
      days.push({ day: key, tasks: count });
    }

    return {
      users: {
        total: profilesAll.count ?? 0,
        last30: profiles30.count ?? 0,
        last7: profiles7.count ?? 0,
        admins: roleCounts.admin,
        investors: roleCounts.investor,
        runners: roleCounts.runner,
        runners_public: publicRunners,
        investors_public: publicInvestors,
      },
      tasks: {
        total: allTasks.length,
        open: tasksOpen.count ?? 0,
        completed: tasksDone.count ?? 0,
        avg_payout: Math.round(avgPayout * 100) / 100,
      },
      applications_total: apps.count ?? 0,
      gmv_cents: gmvCents,
      platform_fees_cents: feeCents,
      runner_payout_cents: payoutCents,
      reviews: { count: ratings.length, avg_rating: Math.round(avgRating * 100) / 100 },
      moderation: { open_reports: reports.count ?? 0, open_disputes: disputes.count ?? 0 },
      daily_tasks: days,
    };
  });