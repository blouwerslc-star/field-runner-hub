import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export type Applicant = {
  id: string;
  full_name: string;
  email: string;
  city: string | null;
  state: string | null;
  has_account: boolean;
  created_at: string;
};

export const listApplicants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { audience: "runner" | "investor" | "lead" }) =>
    z.object({ audience: z.enum(["runner", "investor", "lead"]) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ applicants: Applicant[] }> => {
    await assertAdmin(context.supabase, context.userId);
    if (data.audience === "lead") {
      const [{ data: leads, error: lErr }, { data: runnerApps }, { data: investorApps }, { data: profs }] = await Promise.all([
        supabaseAdmin
          .from("facebook_leads")
          .select("id, full_name, email, lead_created_at, imported_at")
          .order("lead_created_at", { ascending: false }),
        supabaseAdmin.from("field_runner_applications").select("email"),
        supabaseAdmin.from("real_estate_pro_applications").select("email"),
        supabaseAdmin.from("profiles").select("email"),
      ]);
      if (lErr) throw new Error(lErr.message);
      const norm = (e?: string | null) => (e ?? "").trim().toLowerCase();
      const existing = new Set<string>();
      for (const r of runnerApps ?? []) existing.add(norm(r.email));
      for (const r of investorApps ?? []) existing.add(norm(r.email));
      const accounts = new Set<string>();
      for (const p of profs ?? []) if (p.email) accounts.add(norm(p.email));
      return {
        applicants: (leads ?? [])
          .filter((l) => l.email && !existing.has(norm(l.email)))
          .map((l) => ({
            id: l.id,
            full_name: l.full_name,
            email: l.email,
            city: null,
            state: null,
            has_account: accounts.has(norm(l.email)),
            created_at: l.lead_created_at ?? l.imported_at,
          })),
      };
    }
    if (data.audience === "runner") {
      const [{ data: rows, error }, { data: roleRows }] = await Promise.all([
        supabaseAdmin
          .from("field_runner_applications")
          .select("id, full_name, email, city, state, user_id, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("user_id").eq("role", "runner"),
      ]);
      if (error) throw new Error(error.message);
      const runnerIds = (roleRows ?? []).map((r) => r.user_id);
      const { data: profs } = runnerIds.length
        ? await supabaseAdmin
            .from("profiles")
            .select("user_id, full_name, email, city, state, created_at")
            .in("user_id", runnerIds)
        : { data: [] as any[] };
      const norm = (e?: string | null) => (e ?? "").trim().toLowerCase();
      const merged = new Map<string, Applicant>();
      for (const r of rows ?? []) {
        if (!r.email) continue;
        merged.set(norm(r.email), {
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          city: r.city,
          state: r.state,
          has_account: !!r.user_id,
          created_at: r.created_at,
        });
      }
      for (const p of profs ?? []) {
        if (!p.email) continue;
        const key = norm(p.email);
        const existing = merged.get(key);
        if (existing) {
          existing.has_account = true;
          continue;
        }
        merged.set(key, {
          id: p.user_id,
          full_name: p.full_name ?? p.email,
          email: p.email,
          city: p.city,
          state: p.state,
          has_account: true,
          created_at: p.created_at,
        });
      }
      return { applicants: Array.from(merged.values()) };
    }
    const [{ data: rows, error }, { data: roleRows }] = await Promise.all([
      supabaseAdmin
        .from("real_estate_pro_applications")
        .select("id, full_name, email, market_city, market_state, user_id, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "investor"),
    ]);
    if (error) throw new Error(error.message);
    const investorIds = (roleRows ?? []).map((r) => r.user_id);
    const { data: profs } = investorIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("user_id, full_name, email, city, state, created_at")
          .in("user_id", investorIds)
      : { data: [] as any[] };
    const norm = (e?: string | null) => (e ?? "").trim().toLowerCase();
    const merged = new Map<string, Applicant>();
    for (const r of rows ?? []) {
      if (!r.email) continue;
      merged.set(norm(r.email), {
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        city: r.market_city,
        state: r.market_state,
        has_account: !!r.user_id,
        created_at: r.created_at,
      });
    }
    for (const p of profs ?? []) {
      if (!p.email) continue;
      const key = norm(p.email);
      const existing = merged.get(key);
      if (existing) {
        existing.has_account = true;
        continue;
      }
      merged.set(key, {
        id: p.user_id,
        full_name: p.full_name ?? p.email,
        email: p.email,
        city: p.city,
        state: p.state,
        has_account: true,
        created_at: p.created_at,
      });
    }
    return { applicants: Array.from(merged.values()) };
  });

const sendSchema = z.object({
  audience: z.enum(["runner", "investor", "lead"]),
  subject: z.string().min(1).max(300),
  htmlContent: z.string().min(1).max(100_000),
  senderEmail: z.string().email(),
  senderName: z.string().min(1).max(200),
  recipientIds: z.array(z.string().uuid()).min(1).max(2000),
  onlyWithoutAccount: z.boolean().default(true),
});

export const sendBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY is not configured");

    let recipients: { full_name: string | null; email: string; user_id?: string | null }[] = [];
    if (data.audience === "lead") {
      const { data: rows, error } = await supabaseAdmin
        .from("facebook_leads")
        .select("id, full_name, email")
        .in("id", data.recipientIds);
      if (error) throw new Error(error.message);
      let accountEmails = new Set<string>();
      if (data.onlyWithoutAccount) {
        const { data: profs } = await supabaseAdmin.from("profiles").select("email");
        for (const p of profs ?? []) if (p.email) accountEmails.add(p.email.trim().toLowerCase());
      }
      recipients = (rows ?? [])
        .filter((r) => r.email && (!data.onlyWithoutAccount || !accountEmails.has(r.email.trim().toLowerCase())))
        .map((r) => ({ full_name: r.full_name, email: r.email }));
    } else {
      const table =
        data.audience === "runner"
          ? "field_runner_applications"
          : "real_estate_pro_applications";
      // Recipient IDs may come from either the application table or
      // directly from profiles.user_id (signed-up users). Look up both.
      const [{ data: appRows, error }, { data: profRows }] = await Promise.all([
        supabaseAdmin
          .from(table)
          .select("id, full_name, email, user_id")
          .in("id", data.recipientIds),
        supabaseAdmin
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", data.recipientIds),
      ]);
      if (error) throw new Error(error.message);
      const norm = (e?: string | null) => (e ?? "").trim().toLowerCase();
      const byEmail = new Map<string, { full_name: string | null; email: string; user_id?: string | null }>();
      for (const r of appRows ?? []) {
        if (!r.email) continue;
        if (data.onlyWithoutAccount && r.user_id) continue;
        byEmail.set(norm(r.email), { full_name: r.full_name, email: r.email, user_id: r.user_id });
      }
      for (const p of profRows ?? []) {
        if (!p.email) continue;
        if (data.onlyWithoutAccount) continue; // signed-up profile = has account
        if (!byEmail.has(norm(p.email))) {
          byEmail.set(norm(p.email), { full_name: p.full_name, email: p.email, user_id: p.user_id });
        }
      }
      recipients = Array.from(byEmail.values());
    }

    // Fetch live company progress stats to append to every broadcast.
    const [{ count: runnersCount }, { count: investorsCount }, { count: tasksCount }, { count: leadsCount }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "runner"),
      supabaseAdmin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "investor"),
      supabaseAdmin.from("tasks").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("facebook_leads").select("id", { count: "exact", head: true }),
    ]);
    const totalSignups = (runnersCount ?? 0) + (investorsCount ?? 0);
    const totalInterest = totalSignups + (leadsCount ?? 0);
    const footerHtml = `
<hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px" />
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#334155">
  <p style="margin:0 0 8px;font-weight:600;color:#0f172a">📈 REI Runner — where we are right now</p>
  <ul style="margin:0 0 8px 18px;padding:0;line-height:1.6">
    <li><strong>${(runnersCount ?? 0).toLocaleString()}</strong> runners signed up</li>
    <li><strong>${(investorsCount ?? 0).toLocaleString()}</strong> investors signed up</li>
    <li><strong>${totalInterest.toLocaleString()}</strong> total people on the early-access list</li>
    <li><strong>${(tasksCount ?? 0).toLocaleString()}</strong> tasks posted to date</li>
  </ul>
  <p style="margin:0;color:#475569">We're still building the user base before we start launching live tasks at scale. Thanks for your patience — every signup gets us closer to a busy marketplace in your area.</p>
</div>
<p style="font-size:12px;color:#64748b;margin:8px 0 0;line-height:1.5">
  This is an automated message from REI Runner. If you've already completed the steps suggested above, please disregard — your account is in good standing and no action is needed.
</p>`;

    const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";
    const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];
    const seen = new Set<string>();

    for (const r of recipients) {
      const email = r.email!.trim().toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);

      const firstName = (r.full_name ?? "").split(" ")[0] || "there";
      const personalized =
        data.htmlContent.replaceAll("{{firstName}}", firstName) + footerHtml;
      let status: "sent" | "failed" = "sent";
      let errorMessage: string | null = null;
      let providerMessageId: string | null = null;

      try {
        const res = await fetch(`${GATEWAY_URL}/smtp/email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: data.senderName, email: data.senderEmail },
            to: [{ email, name: r.full_name ?? undefined }],
            subject: data.subject,
            htmlContent: personalized,
          }),
        });
        const text = await res.text();
        if (!res.ok) {
          status = "failed";
          errorMessage = `Brevo ${res.status}: ${text.slice(0, 500)}`;
        } else {
          try {
            const parsed = JSON.parse(text);
            providerMessageId = parsed?.messageId ?? null;
          } catch {
            providerMessageId = null;
          }
        }
      } catch (e: any) {
        status = "failed";
        errorMessage = e?.message ?? "Network error";
      }

      results.push({ email, status, error: errorMessage ?? undefined });

      await supabaseAdmin.from("broadcast_sends").insert({
        audience: data.audience,
        subject: data.subject,
        recipient_email: email,
        recipient_name: r.full_name,
        status,
        error_message: errorMessage,
        provider_message_id: providerMessageId,
        sent_by: context.userId,
      });
    }

    return {
      total: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    };
  });

export const listBroadcastHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("broadcast_sends")
      .select("id, audience, subject, recipient_email, recipient_name, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { sends: data ?? [] };
  });