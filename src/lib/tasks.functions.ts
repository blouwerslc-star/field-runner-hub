import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Task types that, by default, involve the runner entering inside the property.
 * Used to auto-default the `requires_interior_access` flag at task creation.
 * Investors can still override the checkbox manually.
 */
export const INTERIOR_ACCESS_TASK_TYPES = new Set<string>([
  "video",
  "walkthrough_video",
  "lockbox",
  "interior_photos",
  "interior",
]);

export function defaultRequiresInteriorAccess(taskType: string | null | undefined): boolean {
  if (!taskType) return false;
  return INTERIOR_ACCESS_TASK_TYPES.has(taskType);
}

export const listMyTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    const isInvestor = roleList.includes("investor");
    const isRunner = roleList.includes("runner");
    const isAdmin = roleList.includes("admin");

    let query = supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (!isAdmin) {
      if (isInvestor && isRunner) {
        query = query.or(`investor_id.eq.${userId},runner_id.eq.${userId}`);
      } else if (isInvestor) {
        query = query.eq("investor_id", userId);
      } else if (isRunner) {
        query = query.eq("runner_id", userId);
      } else {
        return { tasks: [], roles: roleList };
      }
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { tasks: data ?? [], roles: roleList };
  });

export const getTaskDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const [taskRes, subsRes, filesRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", data.taskId).maybeSingle(),
      supabase
        .from("task_submissions")
        .select("*")
        .eq("task_id", data.taskId)
        .order("created_at", { ascending: false }),
      supabase
        .from("task_files")
        .select("*")
        .eq("task_id", data.taskId)
        .order("created_at", { ascending: false }),
    ]);
    if (taskRes.error) throw new Error(taskRes.error.message);
    if (!taskRes.data) throw new Error("Task not found");
    return {
      task: taskRes.data,
      submissions: subsRes.data ?? [],
      files: filesRes.data ?? [],
    };
  });

const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  task_type: z.string().min(1).max(50),
  property_address: z.string().min(2).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  zip_code: z.string().max(20).optional().nullable(),
  payout_amount: z.number().nonnegative().max(100000).optional().nullable(),
  due_date: z.string().max(20).optional().nullable(),
  requires_interior_access: z.boolean().optional(),
  preferred_runner_id: z.string().uuid().optional().nullable(),
  recurrence_rule: z.enum(["weekly", "biweekly", "monthly"]).optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  template_inputs: z.record(z.unknown()).optional().nullable(),
});

function computeNextRunAt(rule: string | null | undefined, from: Date = new Date()): string | null {
  if (!rule) return null;
  const next = new Date(from);
  if (rule === "weekly") next.setDate(next.getDate() + 7);
  else if (rule === "biweekly") next.setDate(next.getDate() + 14);
  else if (rule === "monthly") next.setMonth(next.getMonth() + 1);
  else return null;
  return next.toISOString();
}

export const createInvestorTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => createTaskSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const requiresInterior =
      typeof data.requires_interior_access === "boolean"
        ? data.requires_interior_access
        : defaultRequiresInteriorAccess(data.task_type);
    const { geocodeAddress } = await import("./geocoding.server");
    const geo = await geocodeAddress({
      address: data.property_address,
      city: data.city,
      state: data.state,
      zip: data.zip_code,
    });
    const { data: row, error } = await supabase
      .from("tasks")
      .insert({
        investor_id: userId,
        title: data.title,
        description: data.description ?? null,
        task_type: data.task_type,
        property_address: data.property_address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code ?? null,
        payout_amount: data.payout_amount ?? null,
        due_date: data.due_date ?? null,
        requires_interior_access: requiresInterior,
        preferred_runner_id: data.preferred_runner_id ?? null,
        recurrence_rule: data.recurrence_rule ?? null,
        recurrence_next_at: computeNextRunAt(data.recurrence_rule ?? null),
        recurrence_active: data.recurrence_rule ? true : false,
        status: "open",
        property_lat: geo?.lat ?? null,
        property_lng: geo?.lng ?? null,
        template_id: data.template_id ?? null,
        template_inputs: (data.template_inputs ?? {}) as never,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    try {
      const { notifyRunnersOfNewTask } = await import("./notify-new-task.server");
      void notifyRunnersOfNewTask(row);
    } catch (e) {
      console.error("[createInvestorTask] notify failed", e);
    }
    // First-task / repeat-task promo analytics (non-blocking).
    try {
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("investor_id", userId);
      const { data: campaign } = await supabase
        .from("promo_campaigns").select("id").eq("code", "first_task_free").maybeSingle();
      if (campaign) {
        const eventType = (count ?? 0) <= 1 ? "first_task_created" : "repeat_task";
        await supabase.from("promo_events").insert({
          campaign_id: campaign.id,
          event_type: eventType,
          user_id: userId,
          metadata: { task_id: row.id, total_tasks: count ?? 1 },
        });
      }
    } catch (e) {
      console.warn("[createInvestorTask] promo event failed", e);
    }
    return { task: row };
  });

export const toggleTaskRecurrence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().uuid(), active: z.boolean() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("tasks")
      .update({ recurrence_active: data.active })
      .eq("id", data.taskId)
      .eq("investor_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const bulkCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  task_type: z.string().min(1).max(50),
  payout_amount: z.number().nonnegative().max(100000).optional().nullable(),
  due_date: z.string().max(20).optional().nullable(),
  requires_interior_access: z.boolean().optional(),
  preferred_runner_id: z.string().uuid().optional().nullable(),
  properties: z
    .array(
      z.object({
        property_address: z.string().min(2).max(200),
        city: z.string().min(1).max(100),
        state: z.string().min(2).max(50),
        zip_code: z.string().max(20).optional().nullable(),
      }),
    )
    .min(1)
    .max(50),
});

export const bulkCreateInvestorTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => bulkCreateSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const requiresInterior =
      typeof data.requires_interior_access === "boolean"
        ? data.requires_interior_access
        : defaultRequiresInteriorAccess(data.task_type);
    const { geocodeAddress } = await import("./geocoding.server");
    const rows = await Promise.all(
      data.properties.map(async (p) => {
        const geo = await geocodeAddress({
          address: p.property_address,
          city: p.city,
          state: p.state,
          zip: p.zip_code,
        });
        return {
          investor_id: userId,
          title: data.title,
          description: data.description ?? null,
          task_type: data.task_type,
          property_address: p.property_address,
          city: p.city,
          state: p.state,
          zip_code: p.zip_code ?? null,
          payout_amount: data.payout_amount ?? null,
          due_date: data.due_date ?? null,
          requires_interior_access: requiresInterior,
          preferred_runner_id: data.preferred_runner_id ?? null,
          status: "open" as const,
          property_lat: geo?.lat ?? null,
          property_lng: geo?.lng ?? null,
        };
      }),
    );
    const { data: inserted, error } = await supabase
      .from("tasks")
      .insert(rows)
      .select("*");
    if (error) throw new Error(error.message);
    try {
      const { notifyRunnersOfNewTask } = await import("./notify-new-task.server");
      for (const r of inserted ?? []) void notifyRunnersOfNewTask(r);
    } catch (e) {
      console.error("[bulkCreateInvestorTasks] notify failed", e);
    }
    return { count: inserted?.length ?? 0 };
  });

export const duplicateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: src, error: sErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", data.taskId)
      .eq("investor_id", userId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!src) throw new Error("Task not found");
    const { data: row, error } = await supabase
      .from("tasks")
      .insert({
        investor_id: userId,
        title: src.title,
        description: src.description,
        task_type: src.task_type,
        property_address: src.property_address,
        city: src.city,
        state: src.state,
        zip_code: src.zip_code,
        payout_amount: src.payout_amount,
        due_date: null,
        requires_interior_access: src.requires_interior_access,
        preferred_runner_id: src.runner_id ?? src.preferred_runner_id ?? null,
        status: "open",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { taskId: row.id };
  });

export const startTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", data.taskId)
      .eq("runner_id", userId)
      .in("status", ["assigned", "revision_requested"])
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("Task cannot be started in its current state.");
    return { ok: true };
  });

export const submitTaskWork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().uuid(), notes: z.string().max(2000).optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select("id, runner_id, status")
      .eq("id", data.taskId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task || task.runner_id !== userId) throw new Error("Not assigned to this task");
    if (!["assigned", "in_progress", "revision_requested"].includes(task.status ?? "")) {
      throw new Error("Task is not in a state that accepts a submission.");
    }

    const { data: sub, error } = await supabase
      .from("task_submissions")
      .insert({
        task_id: data.taskId,
        runner_id: userId,
        notes: data.notes ?? null,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("tasks").update({ status: "submitted" }).eq("id", data.taskId);
    return { submission: sub };
  });

export const reviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        submissionId: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
        reason: z.string().max(1000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: sub, error: sErr } = await supabase
      .from("task_submissions")
      .select("id, task_id, runner_id, status")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!sub) throw new Error("Submission not found");
    if (sub.status !== "pending") {
      throw new Error("This submission has already been reviewed.");
    }
    // Authorization: only the task's investor (or an admin) can approve/reject.
    const { data: parentTask, error: ptErr } = await supabase
      .from("tasks")
      .select("investor_id, runner_id, payout_amount, funded")
      .eq("id", sub.task_id)
      .maybeSingle();
    if (ptErr) throw new Error(ptErr.message);
    if (!parentTask) throw new Error("Task not found");
    const { data: roleRows } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    if (parentTask.investor_id !== userId && !isAdmin) {
      throw new Error("Only the task owner can review this submission.");
    }

    const newStatus = data.action === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("task_submissions")
      .update({
        status: newStatus,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: data.action === "reject" ? data.reason ?? null : null,
      })
      .eq("id", data.submissionId);
    if (error) throw new Error(error.message);

    if (data.action === "approve") {
      await supabase.from("tasks").update({ status: "approved" }).eq("id", sub.task_id);
      // Release the funded escrow row to the runner, OR — for legacy/unfunded
      // tasks — create a single pending payout row. Avoid creating a duplicate
      // payment for the same task (the funding row already exists when the
      // investor paid through Stripe).
      if (parentTask.payout_amount) {
        const cents = Math.round(Number(parentTask.payout_amount) * 100);
        const fee = Math.round(cents * 0.2);
        const runnerId = parentTask.runner_id;
        const { data: fundingRow } = await supabase
          .from("payments")
          .select("id")
          .eq("task_id", sub.task_id)
          .eq("kind", "task")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (fundingRow?.id) {
          await supabase
            .from("payments")
            .update({ status: "released", runner_id: runnerId })
            .eq("id", fundingRow.id);
        } else if (runnerId) {
          await supabase.from("payments").insert({
            task_id: sub.task_id,
            investor_id: parentTask.investor_id,
            runner_id: runnerId,
            amount_cents: cents,
            platform_fee_cents: fee,
            runner_payout_cents: cents - fee,
            status: "released",
            kind: "task",
          });
        }
      }
    } else {
      await supabase
        .from("tasks")
        .update({ status: "revision_requested" })
        .eq("id", sub.task_id);
    }
    return { ok: true };
  });
