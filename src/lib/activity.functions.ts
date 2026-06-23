import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
export const listActivity = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      limit: z.number().int().min(1).max(100).default(50),
      event_type: z.string().max(40).optional(),
    }).parse(i ?? {}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("activity_events")
      .select("id, event_type, title, body, link, created_at, actor_id, metadata")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.event_type) q = q.eq("event_type", data.event_type);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const actorIds = Array.from(new Set((rows ?? []).map((r: any) => r.actor_id).filter(Boolean)));
    const actorMap = new Map<string, any>();
    if (actorIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, profile_slug, profile_photo_url, company_name")
        .in("user_id", actorIds);
      for (const p of profs ?? []) actorMap.set((p as any).user_id, p);
    }
    return {
      events: (rows ?? []).map((r: any) => ({ ...r, actor: r.actor_id ? actorMap.get(r.actor_id) ?? null : null })),
    };
  });