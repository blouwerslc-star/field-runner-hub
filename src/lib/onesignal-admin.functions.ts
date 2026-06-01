import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ONESIGNAL_APP_ID = "d352999f-6c2f-4715-b911-8d7edf216025";

const TEST_EVENTS = {
  runner_signup: { title: "New runner signup", body: "A new runner just joined REI Runner." },
  runner_approval: { title: "You're approved!", body: "Your runner account has been approved. Welcome aboard." },
  task_posted: { title: "New assignment posted", body: "A new task in your area is ready to claim." },
  task_accepted: { title: "Assignment accepted", body: "A runner has accepted your task." },
  task_completed: { title: "Assignment completed", body: "Your runner just submitted a completed task." },
  message_investor: { title: "New message from investor", body: "You have a new message." },
  message_runner: { title: "New message from runner", body: "You have a new message." },
} as const;

export type TestEventKey = keyof typeof TEST_EVENTS;

export const sendOneSignalTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      event: z.enum(
        Object.keys(TEST_EVENTS) as [TestEventKey, ...TestEventKey[]],
      ),
      targetExternalId: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Admin gate
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error:
          "ONESIGNAL_REST_API_KEY is not configured. Add it in project settings to send real pushes.",
      };
    }

    const target = data.targetExternalId ?? userId;
    const payload = TEST_EVENTS[data.event];

    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: "push",
        include_aliases: { external_id: [target] },
        headings: { en: payload.title },
        contents: { en: payload.body },
        data: { test_event: data.event },
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: `OneSignal ${res.status}: ${JSON.stringify(json)}` };
    }
    return { ok: true, response: json };
  });