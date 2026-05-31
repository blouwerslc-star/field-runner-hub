import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!(data ?? []).some((r: any) => r.role === "admin")) {
    throw new Error("Forbidden: admin only");
  }
}

export type EmailMonitorData = {
  queues: Array<{
    queue_name: string;
    queue_length: number;
    oldest_msg_age_sec: number | null;
    total_messages: number;
  }>;
  state: {
    batch_size: number;
    send_delay_ms: number;
    retry_after_until: string | null;
    auth_email_ttl_minutes: number;
    transactional_email_ttl_minutes: number;
    updated_at: string;
  } | null;
  stats: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    dlq: number;
    suppressed: number;
    bounced: number;
    complained: number;
  };
  recent: Array<{
    message_id: string | null;
    template_name: string;
    recipient_email: string;
    status: string;
    error_message: string | null;
    created_at: string;
  }>;
  failuresByRecipient: Array<{
    recipient_email: string;
    failure_count: number;
    last_error: string | null;
    last_failed_at: string;
    template_name: string;
  }>;
};

export const getEmailMonitorData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { hours?: number } | undefined) => ({
    hours: data?.hours ?? 24,
  }))
  .handler(async ({ context, data }): Promise<EmailMonitorData> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const since = new Date(Date.now() - data.hours * 3600 * 1000).toISOString();

    // Queue metrics
    const { data: qm } = await supabaseAdmin.rpc("email_queue_metrics");
    const queues = (qm ?? []).map((r: any) => ({
      queue_name: r.queue_name,
      queue_length: Number(r.queue_length ?? 0),
      oldest_msg_age_sec: r.oldest_msg_age_sec == null ? null : Number(r.oldest_msg_age_sec),
      total_messages: Number(r.total_messages ?? 0),
    }));

    // Send state
    const { data: stateRow } = await supabaseAdmin
      .from("email_send_state")
      .select("batch_size, send_delay_ms, retry_after_until, auth_email_ttl_minutes, transactional_email_ttl_minutes, updated_at")
      .eq("id", 1)
      .maybeSingle();

    // Recent logs (latest 200 in window, then dedupe by message_id)
    const { data: logs } = await supabaseAdmin
      .from("email_send_log")
      .select("message_id, template_name, recipient_email, status, error_message, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const row of logs ?? []) {
      const key = row.message_id ?? `${row.recipient_email}-${row.created_at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
    }

    // Stats by status
    const stats = {
      total: deduped.length,
      sent: 0, pending: 0, failed: 0, dlq: 0, suppressed: 0, bounced: 0, complained: 0,
    } as any;
    for (const r of deduped) {
      if (r.status in stats) stats[r.status]++;
    }

    // Failures grouped by recipient
    const failMap = new Map<string, { count: number; last_error: string | null; last_failed_at: string; template_name: string }>();
    for (const r of deduped) {
      if (["failed", "dlq", "bounced", "complained"].includes(r.status)) {
        const existing = failMap.get(r.recipient_email);
        if (!existing) {
          failMap.set(r.recipient_email, {
            count: 1,
            last_error: r.error_message,
            last_failed_at: r.created_at,
            template_name: r.template_name,
          });
        } else {
          existing.count++;
          if (r.created_at > existing.last_failed_at) {
            existing.last_failed_at = r.created_at;
            existing.last_error = r.error_message;
            existing.template_name = r.template_name;
          }
        }
      }
    }
    const failuresByRecipient = Array.from(failMap.entries())
      .map(([recipient_email, v]) => ({
        recipient_email,
        failure_count: v.count,
        last_error: v.last_error,
        last_failed_at: v.last_failed_at,
        template_name: v.template_name,
      }))
      .sort((a, b) => b.failure_count - a.failure_count)
      .slice(0, 50);

    return {
      queues,
      state: stateRow ?? null,
      stats,
      recent: deduped.slice(0, 100),
      failuresByRecipient,
    };
  });