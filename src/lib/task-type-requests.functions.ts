import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

export type TaskTypeRequest = {
  id: string;
  requester_id: string;
  proposed_name: string;
  task_type_slug: string | null;
  description: string;
  deliverables: string[];
  suggested_payout: number | null;
  example_inputs: JsonObject;
  status: "pending" | "approved" | "rejected" | "needs_info";
  admin_notes: string | null;
  created_template_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

const requestSchema = z.object({
  proposed_name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  deliverables: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  suggested_payout: z.number().min(0).max(100000).optional().nullable(),
});

export const requestNewTaskType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => requestSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("task_type_requests")
      .insert({
        requester_id: userId,
        proposed_name: data.proposed_name,
        description: data.description,
        deliverables: data.deliverables,
        suggested_payout: data.suggested_payout ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { request: JSON.parse(JSON.stringify(row)) as TaskTypeRequest };
  });

export const listMyTaskTypeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("task_type_requests")
      .select("*")
      .eq("requester_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { requests: JSON.parse(JSON.stringify(data ?? [])) as TaskTypeRequest[] };
  });

export const adminListTaskTypeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { data, error } = await supabase
      .from("task_type_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { requests: JSON.parse(JSON.stringify(data ?? [])) as TaskTypeRequest[] };
  });

const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "needs_info"]),
  admin_notes: z.string().max(2000).optional().nullable(),
  create_template: z.boolean().default(false),
  task_type_slug: z.string().trim().min(1).max(60).optional().nullable(),
  default_payout: z.number().min(0).max(100000).optional().nullable(),
});

export const reviewTaskTypeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => reviewSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { data: req, error: getErr } = await supabase
      .from("task_type_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!req) throw new Error("Request not found");

    let templateId: string | null = null;
    if (data.status === "approved" && data.create_template) {
      const slug = (data.task_type_slug ?? req.proposed_name.toLowerCase().replace(/[^a-z0-9]+/g, "_")).slice(0, 60);
      const { data: tpl, error: tplErr } = await supabase
        .from("task_templates")
        .insert({
          is_system: true,
          name: req.proposed_name,
          task_type: slug,
          title: req.proposed_name,
          description: req.description,
          default_payout: data.default_payout ?? req.suggested_payout ?? null,
          deliverables: req.deliverables ?? [],
          runner_steps: [] as never,
          required_fields: [] as never,
          category: "Custom",
          active: true,
        })
        .select("id")
        .single();
      if (tplErr) throw new Error(tplErr.message);
      templateId = tpl.id;
    }

    const { data: row, error } = await supabase
      .from("task_type_requests")
      .update({
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        created_template_id: templateId ?? req.created_template_id,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { request: JSON.parse(JSON.stringify(row)) as TaskTypeRequest };
  });