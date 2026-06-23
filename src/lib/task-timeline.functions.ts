import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EVENT_CODES = [
  "accepted",
  "en_route",
  "on_site",
  "in_progress",
  "submitted",
  "verified",
  "revision_requested",
] as const;

export const listTaskTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const { data: events, error } = await supabase
      .from("task_status_events")
      .select("id, event_code, note, latitude, longitude, metadata, created_at, actor_id")
      .eq("task_id", data.taskId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const actorIds = Array.from(
      new Set((events ?? []).map((e) => e.actor_id).filter(Boolean) as string[]),
    );
    const { data: profiles } = actorIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, email, profile_photo_url")
          .in("user_id", actorIds)
      : { data: [] as any[] };
    const pmap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

    return {
      events: (events ?? []).map((e) => ({
        ...e,
        actor: e.actor_id ? pmap.get(e.actor_id) ?? null : null,
      })),
    };
  });

export const recordTaskTrackingEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        taskId: z.string().uuid(),
        eventCode: z.enum(EVENT_CODES),
        note: z.string().trim().max(500).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select("id, investor_id, runner_id, status")
      .eq("id", data.taskId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task) throw new Error("Task not found");

    const isRunner = task.runner_id === userId;
    const isInvestor = task.investor_id === userId;
    if (!isRunner && !isInvestor) throw new Error("Not authorized");

    // Authorization: runners drive runner-side events; investors drive verification/revision.
    const runnerEvents = ["accepted", "en_route", "on_site", "in_progress", "submitted"];
    const investorEvents = ["verified", "revision_requested"];
    if (isRunner && !runnerEvents.includes(data.eventCode)) {
      throw new Error("Runners cannot record this event type");
    }
    if (!isRunner && isInvestor && !investorEvents.includes(data.eventCode)) {
      throw new Error("Investors cannot record this event type");
    }

    const { data: row, error } = await supabase
      .from("task_status_events")
      .insert({
        task_id: data.taskId,
        actor_id: userId,
        event_code: data.eventCode,
        note: data.note ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Mirror to tasks.status where it makes sense, so existing screens stay in sync.
    let newStatus: string | null = null;
    if (data.eventCode === "in_progress") newStatus = "in_progress";
    if (data.eventCode === "submitted") newStatus = "submitted";
    if (data.eventCode === "verified") newStatus = "approved";
    if (data.eventCode === "revision_requested") newStatus = "revision_requested";
    if (newStatus && newStatus !== task.status) {
      await supabase.from("tasks").update({ status: newStatus }).eq("id", data.taskId);
    }

    return { id: row.id };
  });