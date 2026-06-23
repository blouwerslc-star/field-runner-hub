import { createFileRoute } from "@tanstack/react-router";

// Nightly nurture sweep — enqueues welcome / reminder / digest / re-engagement
// emails based on state in profiles, applications, tasks, and email_send_log.
// Idempotency: each (user, template, day-bucket) is logged in email_send_log,
// so a re-run on the same day is a no-op.

export const Route = createFileRoute("/api/public/hooks/email-nurture")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        if (!expectedKey || apikey !== expectedKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendTransactionalEmail } = await import("@/lib/email-sender.server");

        const now = Date.now();
        const days = (n: number) => new Date(now - n * 86_400_000).toISOString();

        const counts = {
          welcome_runner: 0,
          welcome_investor: 0,
          incomplete_application_reminder: 0,
          re_engagement: 0,
          weekly_digest: 0,
          skipped: 0,
        };

        // Helper: has this template already been sent to this email recently?
        async function alreadySent(email: string, template: string, sinceIso: string) {
          const { data } = await supabaseAdmin
            .from("email_send_log")
            .select("id")
            .eq("template_name", template)
            .ilike("recipient_email", email)
            .gte("created_at", sinceIso)
            .limit(1);
          return (data?.length ?? 0) > 0;
        }

        async function send(template: string, email: string, data: Record<string, unknown>, suppressWindowDays = 7) {
          if (!email) { counts.skipped++; return; }
          const since = days(suppressWindowDays);
          if (await alreadySent(email, template, since)) { counts.skipped++; return; }
          await sendTransactionalEmail({ templateName: template, recipientEmail: email, templateData: data });
          (counts as Record<string, number>)[template] = ((counts as Record<string, number>)[template] ?? 0) + 1;
        }

        // 1) Welcome emails — profiles created in the last day, never sent welcome
        const { data: newProfiles } = await supabaseAdmin
          .from("profiles")
          .select("user_id, email, full_name, created_at")
          .gte("created_at", days(2))
          .not("email", "is", null)
          .limit(500);
        for (const p of newProfiles ?? []) {
          if (!p.email) continue;
          const { data: roles } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", p.user_id);
          const roleSet = new Set((roles ?? []).map((r) => r.role as string));
          const template = roleSet.has("investor") ? "welcome_investor" : "welcome_runner";
          await send(template, p.email, { recipientName: p.full_name ?? "there" }, 30);
        }

        // 2) Incomplete runner applications — 24h and 72h old, not converted to profile
        const { data: stalledApps } = await supabaseAdmin
          .from("field_runner_applications")
          .select("email, full_name, created_at, status")
          .lte("created_at", days(1))
          .gte("created_at", days(4))
          .neq("status", "converted")
          .not("email", "is", null)
          .limit(500);
        for (const a of stalledApps ?? []) {
          if (!a.email) continue;
          await send(
            "profile_completion_reminder",
            a.email,
            {
              recipientName: a.full_name ?? "there",
              ctaUrl: "https://reirunner.com/apply",
              ctaLabel: "Finish your application",
            },
            3,
          );
          counts.incomplete_application_reminder++;
        }

        // 3) Re-engagement — last_active_at older than 14 days, not sent in 21d
        const { data: dormant } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name, last_active_at")
          .lte("last_active_at", days(14))
          .gte("last_active_at", days(60))
          .not("email", "is", null)
          .limit(500);
        for (const d of dormant ?? []) {
          if (!d.email || !d.last_active_at) continue;
          const daysAway = Math.floor((now - new Date(d.last_active_at).getTime()) / 86_400_000);
          await send("re_engagement", d.email, { recipientName: d.full_name ?? "there", daysAway }, 21);
        }

        // 4) Weekly digest — Mondays only, active users with activity
        const isMonday = new Date().getUTCDay() === 1;
        if (isMonday) {
          const { data: active } = await supabaseAdmin
            .from("profiles")
            .select("user_id, email, full_name")
            .gte("last_active_at", days(30))
            .not("email", "is", null)
            .limit(1000);
          for (const u of active ?? []) {
            if (!u.email) continue;
            // Per-user weekly stats
            const [{ count: tasksPosted }, { count: tasksCompleted }] = await Promise.all([
              supabaseAdmin.from("tasks").select("id", { count: "exact", head: true })
                .eq("investor_id", u.user_id).gte("created_at", days(7)),
              supabaseAdmin.from("tasks").select("id", { count: "exact", head: true })
                .eq("runner_id", u.user_id).in("status", ["completed", "approved", "paid"]).gte("updated_at", days(7)),
            ]);
            const summary = `Past 7 days: ${tasksPosted ?? 0} tasks posted • ${tasksCompleted ?? 0} tasks completed.`;
            await send("weekly_digest", u.email, { recipientName: u.full_name ?? "there", summary }, 6);
          }
        }

        return new Response(JSON.stringify({ ok: true, counts }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});