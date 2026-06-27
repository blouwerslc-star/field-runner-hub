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

// Lighter-weight wrapper for cron handlers that return a Response directly.
// Records a job_runs row with success/failed status based on whether the
// handler throws or returns a non-2xx response.
export async function recordJobRun(
  jobName: string,
  fn: () => Promise<Response>,
): Promise<Response> {
  const { data: started } = await (supabaseAdmin as any)
    .from("job_runs")
    .insert({ job_name: jobName, status: "running" })
    .select("id")
    .single();
  const runId = started?.id as string | undefined;
  const finish = async (status: "success" | "failed", error?: string) => {
    if (!runId) return;
    await (supabaseAdmin as any)
      .from("job_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        error_message: error ?? null,
      })
      .eq("id", runId);
  };
  try {
    const res = await fn();
    await finish(res.ok ? "success" : "failed", res.ok ? undefined : `HTTP ${res.status}`);
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await finish("failed", msg);
    throw err;
  }
}