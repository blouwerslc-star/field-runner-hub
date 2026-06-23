import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Find or create the conversation tied to a task between the investor and the
 * currently-assigned runner. Returns null if the task has no runner yet.
 */
export const getOrCreateTaskConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select("id, title, investor_id, runner_id")
      .eq("id", data.taskId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task) throw new Error("Task not found");
    if (task.investor_id !== userId && task.runner_id !== userId) {
      throw new Error("Not authorized for this task");
    }
    if (!task.runner_id || !task.investor_id) {
      return { conversationId: null as string | null };
    }

    // Look for an existing conversation tied to this task that includes both parties.
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existing) return { conversationId: existing.id };

    const { data: conv, error: cErr } = await supabase
      .from("conversations")
      .insert({
        subject: task.title,
        task_id: task.id,
        created_by: userId,
      })
      .select("id")
      .single();
    if (cErr) throw new Error(cErr.message);

    const participants = Array.from(new Set([task.investor_id, task.runner_id]));
    const { error: pErr } = await supabase
      .from("conversation_participants")
      .insert(participants.map((uid) => ({ conversation_id: conv.id, user_id: uid })));
    if (pErr) throw new Error(pErr.message);

    return { conversationId: conv.id };
  });