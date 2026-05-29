import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listTaskTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("task_templates")
      .select("*")
      .or(`is_system.eq.true,owner_id.eq.${userId}`)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return { templates: data ?? [] };
  });

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  task_type: z.string().trim().min(1).max(60),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  default_payout: z.number().min(0).max(100000).optional().nullable(),
});

export const upsertTaskTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => templateSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const payload = {
      owner_id: userId,
      is_system: false,
      name: data.name,
      task_type: data.task_type,
      title: data.title,
      description: data.description ?? null,
      default_payout: data.default_payout ?? null,
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("task_templates")
        .update(payload)
        .eq("id", data.id)
        .eq("owner_id", userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { template: row };
    }
    const { data: row, error } = await supabase
      .from("task_templates")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { template: row };
  });

export const deleteTaskTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("task_templates")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const createFromTemplateSchema = z.object({
  templateId: z.string().uuid(),
  property_address: z.string().min(2).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  zip_code: z.string().max(20).optional().nullable(),
  payout_amount: z.number().min(0).max(100000).optional().nullable(),
  due_date: z.string().max(20).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export const createTaskFromTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => createFromTemplateSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: tpl, error: tErr } = await supabase
      .from("task_templates")
      .select("*")
      .eq("id", data.templateId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!tpl) throw new Error("Template not found");
    const description =
      (tpl as any).description
        ? `${(tpl as any).description}${data.note ? `\n\nNote: ${data.note}` : ""}`
        : data.note ?? null;
    const { data: row, error } = await supabase
      .from("tasks")
      .insert({
        investor_id: userId,
        title: (tpl as any).title,
        description,
        task_type: (tpl as any).task_type,
        property_address: data.property_address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code ?? null,
        payout_amount: data.payout_amount ?? (tpl as any).default_payout ?? null,
        due_date: data.due_date ?? null,
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { task: row };
  });