// Cron-triggered sweep: stops tracking on any task whose runner stopped
// pinging more than ~10 minutes ago. Wired up via pg_cron.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sweep-tracking")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("sweep_stale_tracking", { _minutes: 10 });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ ok: true, stopped: data ?? 0 });
      },
      GET: async () => Response.json({ ok: true, status: "sweep endpoint ready" }),
    },
  },
});