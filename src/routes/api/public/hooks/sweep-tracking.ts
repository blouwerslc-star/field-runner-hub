// Cron-triggered sweep: stops tracking on any task whose runner stopped
// pinging more than ~10 minutes ago. Wired up via pg_cron.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sweep-tracking")({
  server: {
    handlers: {
      POST: async () => {
        const { withJobRun } = await import("@/lib/job-runs.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const result = await withJobRun("sweep-tracking", async () => {
          const { data, error } = await supabaseAdmin.rpc("sweep_stale_tracking", { _minutes: 10 });
          if (error) return { ok: false, error: error.message };
          return { ok: true, result: { stopped: data ?? 0 } };
        });
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
      GET: async () => Response.json({ ok: true, status: "sweep endpoint ready" }),
    },
  },
});