import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type RunnerState =
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "verified";

const RUNNER_STATES = [
  "accepted",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
  "verified",
] as const;

const ALLOWED_TRANSITIONS: Record<RunnerState, RunnerState[]> = {
  accepted: ["en_route"],
  en_route: ["arrived"],
  arrived: ["in_progress"],
  in_progress: ["completed"],
  completed: ["verified"],
  verified: [],
};

function stampField(state: RunnerState): string | null {
  switch (state) {
    case "accepted": return "accepted_at";
    case "en_route": return "en_route_at";
    case "arrived": return "arrived_at";
    case "in_progress": return "started_at";
    case "completed": return "completed_at";
    case "verified": return "verified_at";
    default: return null;
  }
}

/** Start tracking — runner accepts then taps Start Navigation. */
export const startTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: task, error } = await supabase
      .from("tasks")
      .select("id, runner_id, status, runner_state")
      .eq("id", data.taskId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!task) throw new Error("Task not found");
    if (task.runner_id !== userId) throw new Error("Not assigned to this task");

    const now = new Date().toISOString();
    const patch: TaskUpdate = {
      runner_state: "en_route",
      en_route_at: now,
      tracking_active: true,
    };
    if (!task.runner_state) patch.accepted_at = now;

    const { error: upErr } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", data.taskId)
      .eq("runner_id", userId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true, runner_state: "en_route" as RunnerState };
  });

/** Transition runner state through the workflow. */
export const transitionRunnerState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      taskId: z.string().uuid(),
      to: z.enum(RUNNER_STATES),
      forceOutsideGeofence: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: task, error } = await supabase
      .from("tasks")
      .select("id, runner_id, investor_id, runner_state, status, last_ping_within_geofence, property_lat")
      .eq("id", data.taskId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!task) throw new Error("Task not found");

    const isRunner = task.runner_id === userId;
    const isInvestor = task.investor_id === userId;
    // verified can be triggered by investor; everything else by runner
    if (data.to === "verified") {
      if (!isInvestor) {
        const { data: roles } = await supabase
          .from("user_roles").select("role").eq("user_id", userId);
        const isAdmin = (roles ?? []).some((r) => r.role === "admin");
        if (!isAdmin) throw new Error("Only investor or admin can verify");
      }
    } else if (!isRunner) {
      throw new Error("Not assigned to this task");
    }

    const current = (task.runner_state ?? "accepted") as RunnerState;
    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(data.to)) {
      throw new Error(`Cannot move from ${current} to ${data.to}`);
    }

    if (data.to === "completed"
        && task.property_lat !== null
        && task.last_ping_within_geofence === false
        && !data.forceOutsideGeofence) {
      throw new Error("Outside property radius — confirm to complete anyway");
    }

    const stamp = stampField(data.to);
    const patch: TaskUpdate = { runner_state: data.to };
    if (stamp) (patch as Record<string, unknown>)[stamp] = new Date().toISOString();
    if (data.to === "completed" || data.to === "verified") {
      patch.tracking_active = false;
    }

    const { error: upErr } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", data.taskId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true, runner_state: data.to };
  });

/** Submit one GPS ping. Throttling happens client-side. */
export const submitPing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      taskId: z.string().uuid(),
      latitude: z.number().gte(-90).lte(90),
      longitude: z.number().gte(-180).lte(180),
      accuracy_m: z.number().nullable().optional(),
      speed_mps: z.number().nullable().optional(),
      heading_deg: z.number().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: task, error } = await supabase
      .from("tasks")
      .select("id, runner_id, investor_id, tracking_active, runner_state, status")
      .eq("id", data.taskId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!task || task.runner_id !== userId) throw new Error("Not assigned");
    if (!task.tracking_active) throw new Error("Tracking not active");
    if (
      task.runner_state === "completed" ||
      task.runner_state === "verified" ||
      task.status === "cancelled"
    ) {
      throw new Error("Task is no longer active");
    }

    const { error: insErr } = await supabase.from("task_location_pings").insert({
      task_id: data.taskId,
      runner_id: userId,
      investor_id: task.investor_id,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy_m: data.accuracy_m ?? null,
      speed_mps: data.speed_mps ?? null,
      heading_deg: data.heading_deg ?? null,
      runner_state: task.runner_state,
    });
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });

/** Runner manually stops tracking (e.g. cancel mid-task). */
export const stopTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("tasks")
      .update({ tracking_active: false })
      .eq("id", data.taskId)
      .eq("runner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Log a geolocation permission outcome for admin audit. */
export const logPermissionEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      taskId: z.string().uuid().optional(),
      outcome: z.enum(["granted", "denied", "unavailable", "timeout", "error"]),
      error_message: z.string().max(500).optional(),
      user_agent: z.string().max(500).optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("task_permission_events").insert({
      task_id: data.taskId ?? null,
      runner_id: userId,
      outcome: data.outcome,
      error_message: data.error_message ?? null,
      user_agent: data.user_agent ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get GPS trail for a task (RLS-scoped). */
export const getTaskTrail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().uuid(), limit: z.number().min(1).max(1000).optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("task_location_pings")
      .select("id, latitude, longitude, accuracy_m, distance_ft, within_geofence, runner_state, created_at")
      .eq("task_id", data.taskId)
      .order("created_at", { ascending: true })
      .limit(data.limit ?? 500);
    if (error) throw new Error(error.message);
    return { pings: rows ?? [] };
  });

/** Admin: list completed tasks flagged as suspicious. */
export const listFlaggedTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Not authorized");
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, runner_id, investor_id, runner_state, status, completed_at, last_ping_within_geofence, last_ping_distance_ft, property_lat, property_lng, city, state")
      .in("runner_state", ["completed", "verified"])
      .or("last_ping_within_geofence.eq.false,last_ping_within_geofence.is.null")
      .order("completed_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { tasks: data ?? [] };
  });

/** Admin override: mark a task verified despite missing GPS confirmation. */
export const adminOverrideCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().uuid(), reason: z.string().min(3).max(500) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("admin_override_task_completion", {
      _task_id: data.taskId,
      _reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get task geofence metadata (small DTO for the runner panel + investor map). */
export const getTaskTrackingState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ taskId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: t, error } = await supabase
      .from("tasks")
      .select("id,title,runner_id,investor_id,status,runner_state,tracking_active,property_lat,property_lng,geofence_radius_ft,last_ping_at,last_ping_lat,last_ping_lng,last_ping_within_geofence,last_ping_distance_ft,accepted_at,en_route_at,arrived_at,started_at,completed_at,verified_at")
      .eq("id", data.taskId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!t) throw new Error("Task not found");
    return { task: t };
  });

/** Returns the runner's currently active task, if any (for the global banner). */
export const getMyActiveTrackingTask = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, runner_state")
      .eq("runner_id", userId)
      .eq("tracking_active", true)
      .order("en_route_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { task: data ?? null };
  });