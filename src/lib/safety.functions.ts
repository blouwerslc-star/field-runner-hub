import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
const reportSchema = z.object({
  target_type: z.enum(["profile", "task", "message", "review"]),
  target_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(80),
  details: z.string().trim().max(2000).optional().nullable(),
});

export const createReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => reportSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reports").insert({
      reporter_id: userId,
      target_type: data.target_type,
      target_id: data.target_id,
      reason: data.reason,
      details: data.details ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { reports: data ?? [] };
  });

const disputeSchema = z.object({
  task_id: z.string().uuid(),
  category: z.enum(["payment", "quality", "scope", "communication", "other"]),
  description: z.string().trim().min(10).max(4000),
});

export const openDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => disputeSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select("id, investor_id, runner_id")
      .eq("id", data.task_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task) throw new Error("Task not found");
    const against =
      task.investor_id === userId ? task.runner_id :
      task.runner_id === userId ? task.investor_id : null;
    const { error } = await supabase.from("disputes").insert({
      task_id: data.task_id,
      opened_by: userId,
      against_id: against,
      category: data.category,
      description: data.description,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyDisputes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("disputes")
      .select("*, tasks:task_id(title, city, state)")
      .or(`opened_by.eq.${userId},against_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { disputes: data ?? [] };
  });

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin only");
}

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { reports: data ?? [] };
  });

export const adminListDisputes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("disputes")
      .select("*, tasks:task_id(title, city, state, payout_amount)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { disputes: data ?? [] };
  });

export const adminResolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["reviewing", "dismissed", "actioned"]),
      admin_notes: z.string().max(2000).optional().nullable(),
    }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("reports")
      .update({
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        resolved_by: context.userId,
        resolved_at: data.status === "dismissed" || data.status === "actioned" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResolveDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["under_review", "resolved", "closed"]),
      resolution: z.string().max(4000).optional().nullable(),
    }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("disputes")
      .update({
        status: data.status,
        resolution: data.resolution ?? null,
        resolved_by: context.userId,
        resolved_at: data.status === "resolved" || data.status === "closed" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });