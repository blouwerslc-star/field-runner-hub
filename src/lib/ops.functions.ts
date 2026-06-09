import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}

/* ───────────────────────── 1. RUNNER APPROVAL QUEUE ───────────────────────── */

export const adminListRunnerApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    let q = supabaseAdmin
      .from("field_runner_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { applications: rows ?? [] };
  });

export const adminDecideRunnerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      decision: z.enum(["approved", "rejected"]),
      admin_notes: z.string().max(2000).optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: app, error: e0 } = await supabaseAdmin
      .from("field_runner_applications")
      .update({
        status: data.decision,
        admin_notes: data.admin_notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (e0) throw new Error(e0.message);

    if (data.decision === "approved" && app?.user_id) {
      await supabaseAdmin.from("user_roles")
        .insert({ user_id: app.user_id, role: "runner" })
        .select();
      await supabaseAdmin.from("runner_profiles")
        .upsert({ user_id: app.user_id }, { onConflict: "user_id" });
      await supabaseAdmin.from("notifications").insert({
        user_id: app.user_id, type: "application_approved",
        title: "You're approved as a Field Runner!",
        body: "Welcome aboard. Open Marketplace to start applying to tasks.",
        link: "/tasks",
      });
    } else if (data.decision === "rejected" && app?.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: app.user_id, type: "application_rejected",
        title: "Field Runner application update",
        body: data.admin_notes ?? "Your application was not approved at this time.",
        link: "/settings/account",
      });
    }
    return { ok: true };
  });

/* ───────────────────────── 2. ID VERIFICATION ─────────────────────────────── */

export const recordIdDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      kind: z.enum(["front_id", "back_id", "selfie"]),
      path: z.string().min(3).max(500),
      mime_type: z.string().max(120).optional().nullable(),
      size_bytes: z.number().int().nonnegative().optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (!data.path.startsWith(`${userId}/`)) throw new Error("Invalid path");
    const { data: row, error } = await supabase
      .from("runner_id_documents")
      .upsert({
        user_id: userId,
        kind: data.kind,
        path: data.path,
        mime_type: data.mime_type ?? null,
        size_bytes: data.size_bytes ?? null,
        status: "pending",
        rejection_reason: null,
        reviewed_at: null,
        reviewed_by: null,
      }, { onConflict: "user_id,kind" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { document: row };
  });

export const listMyIdDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("runner_id_documents")
      .select("*")
      .eq("user_id", userId)
      .order("kind");
    if (error) throw new Error(error.message);
    return { documents: data ?? [] };
  });

export const getIdDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ path: z.string().min(3).max(500) }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    // admin or owner can preview
    const { data: role } = await supabaseAdmin.from("user_roles")
      .select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    const ownerPrefix = data.path.split("/")[0];
    if (!role && ownerPrefix !== userId) throw new Error("Not allowed");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("runner-ids")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

/* ───────────────────────── 3. ADMIN DISPATCH BOARD ────────────────────────── */

function similarity(a: string | null, b: string | null) {
  if (!a || !b) return 0;
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.6;
  return 0;
}

export const adminDispatchBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const [tasksRes, runnerRoles] = await Promise.all([
      supabaseAdmin.from("tasks").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "runner"),
    ]);
    if (tasksRes.error) throw new Error(tasksRes.error.message);
    const tasks = tasksRes.data ?? [];
    const ids = Array.from(new Set((runnerRoles.data ?? []).map((r: any) => r.user_id)));
    let runners: any[] = [];
    if (ids.length > 0) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, city, state, task_types, transportation_available, availability_status, average_rating, completed_tasks_count, service_radius, preferred_markets")
        .in("user_id", ids)
        .neq("suspended", true);
      runners = data ?? [];
    }
    return { tasks, runners };
  });

export const adminRankRunnersForTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ task_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: task } = await supabaseAdmin.from("tasks").select("*").eq("id", data.task_id).single();
    if (!task) throw new Error("Task not found");
    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "runner");
    const ids = (roleRows ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) return { task, ranked: [] };
    const { data: profs } = await supabaseAdmin
      .from("profiles").select("*").in("user_id", ids).neq("suspended", true);
    const ranked = (profs ?? []).map((p: any) => {
      const citySim = similarity(p.city, task.city);
      const stateSim = similarity(p.state, task.state);
      const marketSim = similarity(p.preferred_markets, `${task.city ?? ""} ${task.state ?? ""}`);
      const typeMatch = (p.task_types ?? []).includes(task.task_type) ? 1 : 0;
      const rating = Number(p.average_rating ?? 0) / 5;
      const completedBoost = Math.min(1, Number(p.completed_tasks_count ?? 0) / 20);
      const transport = p.transportation_available ? 0.2 : 0;
      const available = p.availability_status === "available" ? 0.2 : 0;
      const score =
        citySim * 3 + stateSim * 1.5 + marketSim * 1 + typeMatch * 1.5 +
        rating * 1 + completedBoost * 0.5 + transport + available;
      return {
        user_id: p.user_id,
        full_name: p.full_name,
        city: p.city,
        state: p.state,
        task_types: p.task_types ?? [],
        average_rating: p.average_rating,
        completed_tasks_count: p.completed_tasks_count,
        availability_status: p.availability_status,
        transportation_available: p.transportation_available,
        match_label: citySim === 1 ? "Same city" : stateSim === 1 ? "Same state" : marketSim > 0 ? "Listed market" : "Out of market",
        score: Math.round(score * 100) / 100,
      };
    }).sort((a, b) => b.score - a.score).slice(0, 25);
    return { task, ranked };
  });

export const adminAssignTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ task_id: z.string().uuid(), runner_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("tasks")
      .update({ runner_id: data.runner_id, status: "assigned" })
      .eq("id", data.task_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────────────────────── 4. RUNNER EARNINGS ─────────────────────────────── */

export const getRunnerEarnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [paymentsRes, tasksRes] = await Promise.all([
      supabase.from("payments")
        .select("runner_payout_cents, status, created_at, task_id")
        .eq("runner_id", userId),
      supabase.from("tasks")
        .select("id, title, status, payout_amount, created_at, city, state")
        .eq("runner_id", userId),
    ]);
    const payments = paymentsRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    let paid = 0, pending = 0, lifetime = 0;
    for (const p of payments) {
      const c = Number((p as any).runner_payout_cents ?? 0);
      lifetime += c;
      if ((p as any).status === "paid") paid += c;
      else pending += c;
    }
    const completed = tasks.filter((t: any) => ["completed", "approved", "paid"].includes(t.status));

    // monthly buckets (last 6)
    const now = new Date();
    const months: { month: string; paid: number; tasks: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const monthPaid = payments
        .filter((p: any) => p.status === "paid" && (p.created_at ?? "").slice(0, 7) === key)
        .reduce((s: number, p: any) => s + Number(p.runner_payout_cents ?? 0), 0);
      const monthTasks = completed.filter((t: any) => (t.created_at ?? "").slice(0, 7) === key).length;
      months.push({ month: key, paid: monthPaid, tasks: monthTasks });
    }

    return {
      pending_cents: pending,
      paid_cents: paid,
      lifetime_cents: lifetime,
      completed_count: completed.length,
      active_count: tasks.filter((t: any) => ["assigned", "in_progress", "submitted"].includes(t.status)).length,
      recent_completed: completed.sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 10),
      months,
    };
  });

/* ───────────────────────── 5. INVESTOR PERFORMANCE ────────────────────────── */

export const getInvestorPerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [tasksRes, paymentsRes] = await Promise.all([
      supabase.from("tasks").select("id, status, payout_amount, created_at, updated_at, title, city, state").eq("investor_id", userId),
      supabase.from("payments").select("amount_cents, status, created_at").eq("investor_id", userId),
    ]);
    const tasks = tasksRes.data ?? [];
    const payments = paymentsRes.data ?? [];
    const active = tasks.filter((t: any) => ["open", "assigned", "in_progress", "submitted"].includes(t.status));
    const completed = tasks.filter((t: any) => ["completed", "approved", "paid"].includes(t.status));
    const durations = completed
      .map((t: any) => (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 86400_000)
      .filter((n: number) => Number.isFinite(n) && n >= 0);
    const avgDays = durations.length ? durations.reduce((s, n) => s + n, 0) / durations.length : 0;
    const totalSpend = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount_cents ?? 0), 0);

    const now = new Date();
    const months: { month: string; spend: number; tasks: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const spend = payments.filter((p: any) => p.status === "paid" && (p.created_at ?? "").slice(0, 7) === key)
        .reduce((s: number, p: any) => s + Number(p.amount_cents ?? 0), 0);
      const created = tasks.filter((t: any) => (t.created_at ?? "").slice(0, 7) === key).length;
      months.push({ month: key, spend, tasks: created });
    }

    return {
      active_count: active.length,
      completed_count: completed.length,
      avg_completion_days: Math.round(avgDays * 10) / 10,
      total_spend_cents: totalSpend,
      this_month_spend_cents: months[months.length - 1]?.spend ?? 0,
      months,
      recent_active: active.slice(0, 10),
    };
  });

/* ───────────────────────── 6. ADMIN MARKETPLACE HEALTH ────────────────────── */

export const getMarketplaceHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const now = Date.now();
    const since = (days: number) => new Date(now - days * 86400_000).toISOString();

    const [
      profilesAll, profiles30, profiles7, profilesPrev30,
      tasksAll, tasksOpen, tasksDone,
      payments,
      cities, runnerCities,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { head: true, count: "exact" }),
      supabaseAdmin.from("profiles").select("id", { head: true, count: "exact" }).gte("created_at", since(30)),
      supabaseAdmin.from("profiles").select("id", { head: true, count: "exact" }).gte("created_at", since(7)),
      supabaseAdmin.from("profiles").select("id", { head: true, count: "exact" }).gte("created_at", since(60)).lt("created_at", since(30)),
      supabaseAdmin.from("tasks").select("id, status, payout_amount, city, state, created_at"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).eq("status", "open"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).in("status", ["completed", "approved", "paid"]),
      supabaseAdmin.from("payments").select("amount_cents, platform_fee_cents, status, created_at"),
      supabaseAdmin.from("tasks").select("city, state"),
      supabaseAdmin.from("profiles").select("city, state"),
    ]);

    // Active users: created an event or message in last 30 days
    const { data: actors } = await supabaseAdmin
      .from("activity_events").select("actor_id").gte("created_at", since(30));
    const activeUsers = new Set((actors ?? []).map((a: any) => a.actor_id).filter(Boolean)).size;

    const allTasks = tasksAll.data ?? [];
    const allPayments = payments.data ?? [];
    const revenueCents = allPayments
      .filter((p: any) => p.status === "paid")
      .reduce((s: number, p: any) => s + Number(p.platform_fee_cents ?? 0), 0);
    const gmvCents = allPayments
      .filter((p: any) => p.status === "paid")
      .reduce((s: number, p: any) => s + Number(p.amount_cents ?? 0), 0);

    const citySet = new Set<string>();
    for (const c of cities.data ?? []) if (c.city && c.state) citySet.add(`${c.city}, ${c.state}`);
    for (const c of runnerCities.data ?? []) if (c.city && c.state) citySet.add(`${c.city}, ${c.state}`);

    const last30Count = profiles30.count ?? 0;
    const prev30Count = profilesPrev30.count ?? 0;
    const userGrowthPct = prev30Count === 0 ? (last30Count > 0 ? 100 : 0) : ((last30Count - prev30Count) / prev30Count) * 100;

    const tasks30 = allTasks.filter((t: any) => t.created_at >= since(30)).length;
    const tasksPrev30 = allTasks.filter((t: any) => t.created_at >= since(60) && t.created_at < since(30)).length;
    const taskGrowthPct = tasksPrev30 === 0 ? (tasks30 > 0 ? 100 : 0) : ((tasks30 - tasksPrev30) / tasksPrev30) * 100;

    const rev30 = allPayments.filter((p: any) => p.status === "paid" && p.created_at >= since(30))
      .reduce((s: number, p: any) => s + Number(p.platform_fee_cents ?? 0), 0);
    const revPrev30 = allPayments.filter((p: any) => p.status === "paid" && p.created_at >= since(60) && p.created_at < since(30))
      .reduce((s: number, p: any) => s + Number(p.platform_fee_cents ?? 0), 0);
    const revGrowthPct = revPrev30 === 0 ? (rev30 > 0 ? 100 : 0) : ((rev30 - revPrev30) / revPrev30) * 100;

    // daily series
    const series: { day: string; users: number; tasks: number; revenue_cents: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400_000).toISOString().slice(0, 10);
      const u = (allTasks.filter(() => false).length); // placeholder
      const t = allTasks.filter((x: any) => (x.created_at ?? "").slice(0, 10) === d).length;
      const r = allPayments.filter((p: any) => p.status === "paid" && (p.created_at ?? "").slice(0, 10) === d)
        .reduce((s: number, p: any) => s + Number(p.platform_fee_cents ?? 0), 0);
      series.push({ day: d, users: u, tasks: t, revenue_cents: r });
    }

    // top cities
    const cityCount = new Map<string, number>();
    for (const t of allTasks) {
      if (t.city && t.state) {
        const k = `${t.city}, ${t.state}`;
        cityCount.set(k, (cityCount.get(k) ?? 0) + 1);
      }
    }
    const top_cities = Array.from(cityCount.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([city, count]) => ({ city, count }));

    return {
      users: {
        total: profilesAll.count ?? 0,
        new_7d: profiles7.count ?? 0,
        new_30d: last30Count,
        active_30d: activeUsers,
        growth_pct: Math.round(userGrowthPct * 10) / 10,
      },
      tasks: {
        total: allTasks.length,
        open: tasksOpen.count ?? 0,
        completed: tasksDone.count ?? 0,
        new_30d: tasks30,
        growth_pct: Math.round(taskGrowthPct * 10) / 10,
      },
      revenue: {
        platform_fees_cents: revenueCents,
        gmv_cents: gmvCents,
        last_30d_cents: rev30,
        growth_pct: Math.round(revGrowthPct * 10) / 10,
      },
      cities_covered: citySet.size,
      top_cities,
      series,
    };
  });

/* ───────────────────────── 7. ADMIN OPS OVERVIEW ──────────────────────────── */

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const now = Date.now();
    const since24h = new Date(now - 86400_000).toISOString();

    const [
      profilesTotal,
      runnerRoles,
      investorRoles,
      pendingApps,
      pendingVerifications,
      pendingBgRows,
      tasksTotal,
      tasksOpenCount,
      tasksCompletedCount,
      openTasksUnassigned,
      openDisputes,
      paymentsPaid,
      emailsFailed24h,
      recentPendingApps,
      recentPendingVerifications,
      recentOpenTasks,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { head: true, count: "exact" }),
      supabaseAdmin.from("user_roles").select("user_id", { head: true, count: "exact" }).eq("role", "runner"),
      supabaseAdmin.from("user_roles").select("user_id", { head: true, count: "exact" }).eq("role", "investor"),
      supabaseAdmin.from("field_runner_applications").select("id", { head: true, count: "exact" }).eq("status", "pending"),
      supabaseAdmin.from("verification_requests").select("id", { head: true, count: "exact" }).eq("status", "pending_review"),
      supabaseAdmin.from("runner_profiles").select("user_id", { head: true, count: "exact" }).eq("background_check_status", "pending"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).eq("status", "open"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).in("status", ["completed", "approved", "paid"]),
      supabaseAdmin
        .from("tasks")
        .select("id, title, city, state, created_at, payout_amount")
        .eq("status", "open")
        .is("runner_id", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("disputes")
        .select("id, task_id, reason, status, created_at")
        .in("status", ["open", "under_review"])
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin.from("payments").select("amount_cents, status").eq("status", "paid"),
      supabaseAdmin
        .from("email_send_log")
        .select("id, recipient_email, template_name, status, error_message, created_at")
        .in("status", ["dlq", "failed", "bounced"])
        .gte("created_at", since24h)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("field_runner_applications")
        .select("id, full_name, email, city, state, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("verification_requests")
        .select("id, user_id, requested_level, created_at")
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("tasks")
        .select("id, title, city, state, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const gmvCents = (paymentsPaid.data ?? []).reduce(
      (s: number, p: any) => s + Number(p.amount_cents ?? 0),
      0,
    );

    const { count: failedEmailCount } = await supabaseAdmin
      .from("email_send_log")
      .select("id", { head: true, count: "exact" })
      .in("status", ["dlq", "failed", "bounced"])
      .gte("created_at", since24h);

    return {
      generated_at: new Date().toISOString(),
      kpis: {
        total_users: profilesTotal.count ?? 0,
        approved_runners: runnerRoles.count ?? 0,
        registered_investors: investorRoles.count ?? 0,
        pending_runner_approvals: pendingApps.count ?? 0,
        pending_verifications: pendingVerifications.count ?? 0,
        pending_background_checks: pendingBgRows.count ?? 0,
        total_tasks: tasksTotal.count ?? 0,
        open_tasks: tasksOpenCount.count ?? 0,
        completed_tasks: tasksCompletedCount.count ?? 0,
        gmv_cents: gmvCents,
        failed_emails_24h: failedEmailCount ?? 0,
      },
      queues: {
        pending_approvals: recentPendingApps.data ?? [],
        pending_verifications: recentPendingVerifications.data ?? [],
        unassigned_open_tasks: openTasksUnassigned.data ?? [],
        open_disputes: openDisputes.data ?? [],
        recent_open_tasks: recentOpenTasks.data ?? [],
        failed_emails: emailsFailed24h.data ?? [],
      },
    };
  });