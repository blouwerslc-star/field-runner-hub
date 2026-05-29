import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const reviewableStatuses = ["submitted", "approved", "completed", "paid"];

export const listReviewsForUser = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("reviews")
      .select("id, task_id, reviewer_id, reviewee_id, direction, rating, comment, created_at")
      .eq("reviewee_id", data.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const reviewerIds = Array.from(new Set((rows ?? []).map((r) => r.reviewer_id)));
    let names = new Map<string, { name: string | null; photo: string | null; slug: string | null }>();
    if (reviewerIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, profile_photo_url, profile_slug")
        .in("user_id", reviewerIds);
      for (const p of profs ?? []) {
        names.set(p.user_id as string, {
          name: (p as any).full_name,
          photo: (p as any).profile_photo_url,
          slug: (p as any).profile_slug,
        });
      }
    }
    return {
      reviews: (rows ?? []).map((r) => ({
        ...r,
        reviewer: names.get(r.reviewer_id) ?? { name: null, photo: null, slug: null },
      })),
    };
  });

export const listReviewableTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title, investor_id, runner_id, status, city, state, updated_at")
      .in("status", reviewableStatuses)
      .or(`investor_id.eq.${userId},runner_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const existing = await supabase
      .from("reviews")
      .select("task_id, reviewer_id")
      .eq("reviewer_id", userId);
    const reviewed = new Set((existing.data ?? []).map((r) => r.task_id));
    return {
      tasks: (tasks ?? [])
        .filter((t) => !reviewed.has(t.id))
        .map((t) => ({
          ...t,
          direction: t.investor_id === userId ? "investor_to_runner" : "runner_to_investor",
          counterparty: t.investor_id === userId ? t.runner_id : t.investor_id,
        }))
        .filter((t) => !!t.counterparty),
    };
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        taskId: z.string().uuid(),
        revieweeId: z.string().uuid(),
        direction: z.enum(["investor_to_runner", "runner_to_investor"]),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(2000).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("reviews")
      .insert({
        task_id: data.taskId,
        reviewer_id: userId,
        reviewee_id: data.revieweeId,
        direction: data.direction,
        rating: data.rating,
        comment: data.comment ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { review: row };
  });