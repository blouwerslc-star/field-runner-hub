// Helper for /api/public/hooks/* cron endpoints to record run status in
// public.job_runs for admin observability. Server-only.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type JobRunResult = { ok: boolean; result?: unknown; error?: string };

export async function withJobRun<T extends JobRunResult>(
  jobName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const { data: started } = await (supabaseAdmin as any)
    .from("job_runs")
    .insert({ job_name: jobName, status: "running" })
    .select("id")
    .single();
  const runId = started?.id as string | undefined;
  try {
    const result = await fn();
    if (runId) {
      await (supabaseAdmin as any)
        .from("job_runs")
        .update({
          status: result.ok ? "success" : "failed",
          finished_at: new Date().toISOString(),
          result: result.result ?? null,
          error_message: result.error ?? null,
        })
        .eq("id", runId);
    }
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (runId) {
      await (supabaseAdmin as any)
        .from("job_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: msg,
        })
        .eq("id", runId);
    }
    throw err;
  }
}