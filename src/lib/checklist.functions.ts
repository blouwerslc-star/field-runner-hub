import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RunnerStepType =
  | "photo"
  | "video"
  | "upload"
  | "scan"
  | "item_list"
  | "checkbox"
  | "signature"
  | "note"
  | "geofence_arrive";

export type RunnerStep = {
  key: string;
  title: string;
  instructions?: string;
  type: RunnerStepType;
  required?: boolean;
  min_count?: number;
  accept_mime?: string;
  geofence_required?: boolean;
};

export type TemplateField = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "address" | "phone" | "list" | "file";
  required?: boolean;
  help?: string;
};

export type TaskHeader = {
  id: string;
  title: string;
  task_type: string;
  runner_id: string | null;
  investor_id: string | null;
  runner_state: string | null;
  status: string;
  template_id: string | null;
  template_inputs: Record<string, unknown> | null;
  last_ping_within_geofence: boolean | null;
  geofence_radius_ft: number;
  property_address: string;
  city: string;
  state: string;
  zip_code: string | null;
};

export type StepProgress = {
  id: string;
  task_id: string;
  step_key: string;
  status: "pending" | "skipped" | "done";
  data: Record<string, unknown>;
  file_ids: string[];
  completed_at: string | null;
  completed_by: string | null;
};

export const getTaskChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select(
        "id,title,task_type,runner_id,investor_id,runner_state,status,template_id,template_inputs,last_ping_within_geofence,geofence_radius_ft,property_address,city,state,zip_code"
      )
      .eq("id", data.taskId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task) throw new Error("Task not found");

    let steps: RunnerStep[] = [];
    let introNotes: string | null = null;
    let requiredFields: TemplateField[] = [];
    if (task.template_id) {
      const { data: tpl, error: tplErr } = await supabase
        .from("task_templates")
        .select("runner_steps,intro_notes,required_fields,name")
        .eq("id", task.template_id)
        .maybeSingle();
      if (tplErr) throw new Error(tplErr.message);
      if (tpl) {
        steps = JSON.parse(JSON.stringify(tpl.runner_steps ?? [])) as RunnerStep[];
        introNotes = (tpl.intro_notes as string | null) ?? null;
        requiredFields = JSON.parse(JSON.stringify(tpl.required_fields ?? [])) as TemplateField[];
      }
    }

    const { data: progressRows, error: pErr } = await supabase
      .from("task_checklist_progress")
      .select("*")
      .eq("task_id", data.taskId);
    if (pErr) throw new Error(pErr.message);

    return {
      task: JSON.parse(JSON.stringify(task)) as TaskHeader,
      steps,
      introNotes,
      requiredFields,
      progress: JSON.parse(JSON.stringify(progressRows ?? [])) as StepProgress[],
      viewerRole:
        task.runner_id === userId ? "runner" : task.investor_id === userId ? "investor" : "other",
    };
  });

const updateStepSchema = z.object({
  taskId: z.string().uuid(),
  step_key: z.string().min(1).max(80),
  status: z.enum(["pending", "done", "skipped"]),
  data: z.record(z.unknown()).default({}),
  file_ids: z.array(z.string()).default([]),
});

export const updateChecklistStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => updateStepSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const payload = {
      task_id: data.taskId,
      step_key: data.step_key,
      status: data.status,
      data: (data.data ?? {}) as never,
      file_ids: [] as string[],
      completed_by: data.status === "done" ? userId : null,
      completed_at: data.status === "done" ? new Date().toISOString() : null,
    };
    const { data: row, error } = await supabase
      .from("task_checklist_progress")
      .upsert(payload, { onConflict: "task_id,step_key" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { progress: JSON.parse(JSON.stringify(row)) as StepProgress };
  });

export const completeChecklistTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Verify all required steps are done.
    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select("id,runner_id,template_id")
      .eq("id", data.taskId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task) throw new Error("Task not found");
    if (task.runner_id !== userId) throw new Error("Only the assigned runner can complete");
    if (!task.template_id) throw new Error("Task has no checklist template");

    const { data: tpl } = await supabase
      .from("task_templates")
      .select("runner_steps")
      .eq("id", task.template_id)
      .maybeSingle();
    const steps = ((tpl?.runner_steps ?? []) as RunnerStep[]).filter(
      (s) => s.required !== false,
    );

    const { data: progressRows } = await supabase
      .from("task_checklist_progress")
      .select("step_key,status")
      .eq("task_id", data.taskId);
    const done = new Set((progressRows ?? []).filter((p) => p.status === "done").map((p) => p.step_key));
    const missing = steps.filter((s) => !done.has(s.key)).map((s) => s.title);
    if (missing.length > 0) {
      throw new Error(`Complete required steps first: ${missing.join(", ")}`);
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        runner_state: "completed",
        completed_at: new Date().toISOString(),
        status: "submitted",
      })
      .eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });