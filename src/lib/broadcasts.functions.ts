import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
      const { data: rows, error } = await supabaseAdmin
        .from("field_runner_applications")
        .select("id, full_name, email, city, state, user_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return {
        applicants: (rows ?? []).map((r) => ({
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          city: r.city,
          state: r.state,
          has_account: !!r.user_id,
          created_at: r.created_at,
        })),
      };
    }
    const { data: rows, error } = await supabaseAdmin
      .from("real_estate_pro_applications")
      .select("id, full_name, email, market_city, market_state, user_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      applicants: (rows ?? []).map((r) => ({
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        city: r.market_city,
        state: r.market_state,
        has_account: !!r.user_id,
        created_at: r.created_at,
      })),
    };
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
      const { data: rows, error } = await supabaseAdmin
        .from(table)
        .select("id, full_name, email, user_id")
        .in("id", data.recipientIds);
      if (error) throw new Error(error.message);
      recipients = (rows ?? []).filter((r) => {
        if (!r.email) return false;
        if (data.onlyWithoutAccount && r.user_id) return false;
        return true;
      });
    }

    const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";
    const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];
    const seen = new Set<string>();

    for (const r of recipients) {
      const email = r.email!.trim().toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);

      const firstName = (r.full_name ?? "").split(" ")[0] || "there";
      const personalized = data.htmlContent.replaceAll("{{firstName}}", firstName);
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