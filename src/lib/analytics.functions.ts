import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}

export const getPlatformMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const now = Date.now();
    const since30 = new Date(now - 30 * 86400_000).toISOString();
    const since7 = new Date(now - 7 * 86400_000).toISOString();

    const [profilesAll, profiles30, profiles7, roles, tasksAll, tasksOpen, tasksDone, payments, apps, reviews, reports, disputes] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id", { head: true, count: "exact" }),
      supabaseAdmin.from("profiles").select("user_id", { head: true, count: "exact" }).gte("created_at", since30),
      supabaseAdmin.from("profiles").select("user_id", { head: true, count: "exact" }).gte("created_at", since7),
      supabaseAdmin.from("user_roles").select("role"),
      supabaseAdmin.from("tasks").select("id, status, payout_amount, created_at"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).eq("status", "open"),
      supabaseAdmin.from("tasks").select("id", { head: true, count: "exact" }).in("status", ["completed","approved","paid"]),
      supabaseAdmin.from("payments").select("amount_cents, platform_fee_cents, runner_payout_cents, status, created_at"),
      supabaseAdmin.from("task_applications").select("id", { head: true, count: "exact" }),
      supabaseAdmin.from("reviews").select("rating"),
      supabaseAdmin.from("reports").select("id", { head: true, count: "exact" }).eq("status", "open"),
      supabaseAdmin.from("disputes").select("id", { head: true, count: "exact" }).in("status", ["open","under_review"]),
    ]);

    const roleCounts: Record<string, number> = { admin: 0, investor: 0, runner: 0 };
    for (const r of roles.data ?? []) roleCounts[(r as any).role] = (roleCounts[(r as any).role] ?? 0) + 1;

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