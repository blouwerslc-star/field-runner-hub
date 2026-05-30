import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PUBLIC_TASK_COLS =
  "id, title, description, task_type, city, state, zip_code, payout_amount, due_date, status, investor_id, created_at";

const filterSchema = z.object({
  q: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  task_type: z.string().max(60).optional(),
  min_payout: z.number().min(0).max(100000).optional(),
  max_payout: z.number().min(0).max(100000).optional(),
  before_due: z.string().max(20).optional(),
  sort: z.enum(["newest", "payout", "due"]).default("newest"),
  limit: z.number().int().min(1).max(60).default(30),
});

export const listOpenTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => filterSchema.parse(i ?? {}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("tasks")
      .select(PUBLIC_TASK_COLS)
      .eq("status", "open")
      .is("runner_id", null)
      .limit(data.limit);

    if (data.q) q = q.or(`title.ilike.%${data.q}%,description.ilike.%${data.q}%`);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.state) q = q.ilike("state", `%${data.state}%`);
    if (data.task_type) q = q.eq("task_type", data.task_type);
    if (data.min_payout != null) q = q.gte("payout_amount", data.min_payout);
    if (data.max_payout != null) q = q.lte("payout_amount", data.max_payout);
    if (data.before_due) q = q.lte("due_date", data.before_due);

    if (data.sort === "payout") q = q.order("payout_amount", { ascending: false, nullsFirst: false });
    else if (data.sort === "due") q = q.order("due_date", { ascending: true, nullsFirst: false });
    else q = q.order("created_at", { ascending: false });

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const investorIds = Array.from(new Set((rows ?? []).map((r: any) => r.investor_id).filter(Boolean)));
    const investorMap = new Map<string, { name: string | null; slug: string | null; verified: boolean }>();
    if (investorIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, profile_slug, verified_status, company_name")
        .in("user_id", investorIds);
      for (const p of profs ?? []) {
        investorMap.set((p as any).user_id, {
          name: (p as any).company_name || (p as any).full_name,
          slug: (p as any).profile_slug,
          verified: !!(p as any).verified_status,
        });
      }
    }
    return {
      tasks: (rows ?? []).map((t: any) => ({ ...t, investor: investorMap.get(t.investor_id) ?? null })),
    };
  });

export const getPublicTaskDetail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: t, error } = await supabaseAdmin
      .from("tasks")
      .select(PUBLIC_TASK_COLS + ", property_address")
      .eq("id", data.taskId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!t) return { task: null, investor: null };
    const { data: inv } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, profile_slug, verified_status, company_name, average_rating, review_count, profile_photo_url")
      .eq("user_id", (t as any).investor_id)
      .maybeSingle();
    // hide property address unless task is assigned to viewer; for public it shows city/state only
    const { property_address, ...rest } = t as any;
    return { task: rest, investor: inv ?? null };
  });

export const applyToTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().uuid(), message: z.string().max(1000).optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Gate: must be a Certified Runner (Academy Level 1+) before applying to paid tasks.
    const { data: rp } = await supabase
      .from("runner_profiles")
      .select("certification_level")
      .eq("user_id", userId)
      .maybeSingle();
    if (!rp || ((rp as any).certification_level ?? 0) < 1) {
      throw new Error("Complete REI Runner Academy certification before applying to tasks.");
    }
    const { error } = await supabase
      .from("task_applications")
      .insert({ task_id: data.taskId, runner_id: userId, message: data.message ?? null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const withdrawApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ applicationId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("task_applications")
      .update({ status: "withdrawn" })
      .eq("id", data.applicationId)
      .eq("runner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const decideApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ applicationId: z.string().uuid(), decision: z.enum(["approved", "rejected"]) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: app, error: aErr } = await supabase
      .from("task_applications")
      .select("id, task_id, runner_id, status")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!app) throw new Error("Application not found");
    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select("id, investor_id, status")
      .eq("id", app.task_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task || task.investor_id !== userId) throw new Error("Not authorized");

    const { error: uErr } = await supabase
      .from("task_applications")
      .update({ status: data.decision })
      .eq("id", app.id);
    if (uErr) throw new Error(uErr.message);

    if (data.decision === "approved") {
      await supabase
        .from("tasks")
        .update({ runner_id: app.runner_id, status: "assigned" })
        .eq("id", task.id);
      // reject other pending apps for this task
      await supabase
        .from("task_applications")
        .update({ status: "rejected" })
        .eq("task_id", task.id)
        .neq("id", app.id)
        .eq("status", "pending");
    }
    // Email the runner about the decision (best-effort)
    try {
      const { notifyUserByEmail } = await import("./email-sender.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: t } = await supabaseAdmin
        .from("tasks")
        .select("title")
        .eq("id", task.id)
        .maybeSingle();
      const title = (t as any)?.title ?? "a task";
      if (data.decision === "approved") {
        await notifyUserByEmail({
          userId: app.runner_id,
          title: `You were approved for "${title}"`,
          body: "Head to the task page to start work.",
          link: `/tasks/${task.id}`,
          ctaLabel: "View task",
        });
      } else {
        await notifyUserByEmail({
          userId: app.runner_id,
          title: `Your application wasn't selected`,
          body: `"${title}" was assigned to another runner. Keep browsing the marketplace for new opportunities.`,
          link: `/tasks`,
          ctaLabel: "Browse tasks",
        });
      }
    } catch (err) {
      console.error("application email notify failed", err);
    }
    return { ok: true };
  });

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("task_applications")
      .select("id, status, message, created_at, task_id, tasks:task_id(title, city, state, payout_amount, due_date, status)")
      .eq("runner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { applications: data ?? [] };
  });

export const listApplicationsForMyTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("investor_id", userId);
    const ids = (tasks ?? []).map((t) => t.id);
    if (!ids.length) return { applications: [] };
    const { data, error } = await supabase
      .from("task_applications")
      .select("id, status, message, created_at, task_id, runner_id, tasks:task_id(title, city, state, payout_amount)")
      .in("task_id", ids)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const runnerIds = Array.from(new Set((data ?? []).map((d) => d.runner_id)));
    const profilesMap = new Map<string, any>();
    if (runnerIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, profile_slug, profile_photo_url, average_rating, review_count, completed_tasks_count, city, state, verified_status")
        .in("user_id", runnerIds);
      for (const p of profs ?? []) profilesMap.set((p as any).user_id, p);
    }
    return {
      applications: (data ?? []).map((a) => ({ ...a, runner: profilesMap.get(a.runner_id) ?? null })),
    };
  });

export const toggleSaveTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("saved_tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("task_id", data.taskId)
      .maybeSingle();
    if (existing.data) {
      await supabase.from("saved_tasks").delete().eq("id", existing.data.id);
      return { saved: false };
    }
    await supabase.from("saved_tasks").insert({ user_id: userId, task_id: data.taskId });
    return { saved: true };
  });

export const listSavedTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("saved_tasks")
      .select("id, task_id, created_at, tasks:task_id(id, title, city, state, payout_amount, due_date, status, task_type)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { saved: data ?? [] };
  });

export const getMyApplicationForTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: app } = await supabase
      .from("task_applications")
      .select("id, status, message")
      .eq("task_id", data.taskId)
      .eq("runner_id", userId)
      .maybeSingle();
    const { data: saved } = await supabase
      .from("saved_tasks")
      .select("id")
      .eq("task_id", data.taskId)
      .eq("user_id", userId)
      .maybeSingle();
    return { application: app ?? null, saved: !!saved };
  });