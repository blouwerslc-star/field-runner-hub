import { createFileRoute } from "@tanstack/react-router";

type Body = { notification_id?: string };

// Best-effort SMS fanout for a freshly-inserted notification.
// Called by the AFTER INSERT trigger on public.notifications via pg_net.
export const Route = createFileRoute("/api/public/hooks/dispatch-sms")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedKey = process.env.HOOK_SECRET;
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        if (!expectedKey || apikey !== expectedKey) {
          return new Response("Unauthorized", { status: 401 });
        }
        let body: Body = {};
        try { body = (await request.json()) as Body; } catch { /* ignore */ }
        const notificationId = body.notification_id;
        if (!notificationId) return new Response("Missing notification_id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendSms } = await import("@/lib/sms.server");

        const { data: notif, error: nErr } = await supabaseAdmin
          .from("notifications")
          .select("id, user_id, type, title, body, link")
          .eq("id", notificationId)
          .maybeSingle();
        if (nErr || !notif) return new Response("notification not found", { status: 404 });

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("phone, phone_verified, notification_prefs")
          .eq("user_id", notif.user_id)
          .maybeSingle();
        if (!profile?.phone || !profile.phone_verified) return new Response("no phone", { status: 200 });
        const prefs = (profile.notification_prefs ?? {}) as Record<string, boolean>;
        if (prefs.sms_enabled === false) return new Response("opted out", { status: 200 });

        // Per-event toggle: sms_<type> overrides; otherwise default true when sms_enabled
        const perEvent = prefs[`sms_${notif.type}`];
        if (perEvent === false) return new Response("opted out (event)", { status: 200 });

        // Idempotency
        const { data: existing } = await supabaseAdmin
          .from("sms_send_log")
          .select("id")
          .eq("notification_id", notif.id)
          .maybeSingle();
        if (existing) return new Response("already sent", { status: 200 });

        const text = `REI Runner: ${notif.title}${notif.body ? ` — ${notif.body}` : ""}`;
        const result = await sendSms({ to: profile.phone, body: text });
        await supabaseAdmin.from("sms_send_log").insert({
          user_id: notif.user_id,
          notification_id: notif.id,
          phone: profile.phone,
          body: text,
          provider: "twilio",
          provider_message_id: result.ok ? result.messageSid : null,
          status: result.ok ? "sent" : result.skipped ? "skipped" : "failed",
          error: result.ok ? null : result.error,
        });
        return new Response(JSON.stringify({ ok: result.ok }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});