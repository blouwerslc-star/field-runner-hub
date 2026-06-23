import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "crypto";
import { z } from "zod";
const precheckSchema = z.object({
  email: z.string().trim().email().max(200),
  role: z.enum(["runner", "investor"]),
  // Legacy field kept for old clients, but ignored because browser autofill
  // and password managers were filling it for real applicants.
  honeypot: z.string().max(200).optional().default(""),
  // Milliseconds the form was visible before submit. Bots submit instantly.
  elapsed_ms: z.number().int().min(0).max(60 * 60 * 1000),
});

// Sliding window limits. Keep these generous enough that a real applicant can
// retry after correcting validation/auth issues without getting locked out.
const MAX_ATTEMPTS_PER_IP_PER_HOUR = 30;
const MAX_ATTEMPTS_PER_EMAIL_PER_DAY = 20;
// Minimum human fill time. Lower than typical form completion.
const MIN_ELAPSED_MS = 2000;

function getClientIp(): string | null {
  try {
    const req = getRequest();
    const headers = req.headers;
    const fwd =
      headers.get("cf-connecting-ip") ||
      headers.get("x-real-ip") ||
      headers.get("x-forwarded-for");
    if (!fwd) return null;
    return fwd.split(",")[0].trim() || null;
  } catch {
    return null;
  }
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function getUserAgent(): string | null {
  try {
    return getRequest().headers.get("user-agent")?.slice(0, 500) ?? null;
  } catch {
    return null;
  }
}

async function logAttempt(opts: {
  ipHash: string | null;
  email: string;
  role: string;
  blocked: boolean;
  reason: string | null;
  userAgent: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("signup_attempts").insert({
    ip_hash: opts.ipHash,
    email: opts.email.toLowerCase(),
    role: opts.role,
    blocked: opts.blocked,
    reason: opts.reason,
    user_agent: opts.userAgent,
  });
}

export type PrecheckResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Server-side spam precheck. Called from signup forms BEFORE the client invokes
 * supabase.auth.signUp(). Blocks obvious automated abuse (instant submit,
 * IP/email flood) without requiring a third-party CAPTCHA.
 */
export const precheckSignupAttempt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => precheckSchema.parse(input))
  .handler(async ({ data }): Promise<PrecheckResult> => {
    const ip = getClientIp();
    const ipHash = hashIp(ip);
    const userAgent = getUserAgent();
    const email = data.email.toLowerCase();

    // 1) Instant submit — almost certainly automated.
    if (data.elapsed_ms < MIN_ELAPSED_MS) {
      await logAttempt({
        ipHash,
        email,
        role: data.role,
        blocked: true,
        reason: "too_fast",
        userAgent,
      });
      return {
        ok: false,
        reason: "Please take a moment to review the form before submitting.",
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 2) Per-IP rate limit (last hour). Only count prechecks that passed;
    // blocked attempts should not make a legitimate user permanently stuck.
    if (ipHash) {
      const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: ipCount } = await supabaseAdmin
        .from("signup_attempts")
        .select("id", { head: true, count: "exact" })
        .eq("ip_hash", ipHash)
        .eq("blocked", false)
        .gte("created_at", sinceHour);

      if ((ipCount ?? 0) >= MAX_ATTEMPTS_PER_IP_PER_HOUR) {
        await logAttempt({
          ipHash,
          email,
          role: data.role,
          blocked: true,
          reason: "ip_rate_limit",
          userAgent,
        });
        return {
          ok: false,
          reason: "Too many signup attempts from your network. Please try again in an hour.",
        };
      }
    }

    // 3) Per-email rate limit (last day). Only count prechecks that passed.
    const sinceDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: emailCount } = await supabaseAdmin
      .from("signup_attempts")
      .select("id", { head: true, count: "exact" })
      .eq("email", email)
      .eq("blocked", false)
      .gte("created_at", sinceDay);

    if ((emailCount ?? 0) >= MAX_ATTEMPTS_PER_EMAIL_PER_DAY) {
      await logAttempt({
        ipHash,
        email,
        role: data.role,
        blocked: true,
        reason: "email_rate_limit",
        userAgent,
      });
      return {
        ok: false,
        reason: "Too many signup attempts for this email. Please try again later.",
      };
    }

    // Passed — log as accepted attempt (counts toward future rate limits).
    await logAttempt({
      ipHash,
      email,
      role: data.role,
      blocked: false,
      reason: null,
      userAgent,
    });

    return { ok: true };
  });