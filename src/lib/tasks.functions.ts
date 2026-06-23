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
});

export const createInvestorTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => createTaskSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const requiresInterior =
      typeof data.requires_interior_access === "boolean"
        ? data.requires_interior_access
        : defaultRequiresInteriorAccess(data.task_type);
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
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { task: row };
  });

export const startTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", data.taskId)
      .eq("runner_id", userId);
    if (error) throw new Error(error.message);
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
      const { data: task } = await supabase
        .from("tasks")
        .select("payout_amount, investor_id, runner_id")
        .eq("id", sub.task_id)
        .maybeSingle();
      if (task && task.payout_amount) {
        const cents = Math.round(Number(task.payout_amount) * 100);
        const fee = Math.round(cents * 0.2);
        await supabase.from("payments").insert({
          task_id: sub.task_id,
          investor_id: task.investor_id,
          runner_id: task.runner_id,
          amount_cents: cents,
          platform_fee_cents: fee,
          runner_payout_cents: cents - fee,
          status: "released",
        });
      }
    } else {
      await supabase
        .from("tasks")
        .update({ status: "revision_requested" })
        .eq("id", sub.task_id);
    }
    return { ok: true };
  });
