import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RATE_WINDOW_MS = 60_000; // 1 min between sends
const CODE_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const requestPhoneVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ phone: z.string().trim().min(7).max(20) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Hard cap: 5 SMS verification codes per user per hour (prevents SMS-bombing abuse).
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    await enforceRateLimit("requestPhoneVerification", userId, 5, 3600);
    const { normalizeE164, sendSms } = await import("./sms.server");
    const phone = normalizeE164(data.phone);
    if (!phone) throw new Error("Invalid phone number");

    // Rate-limit recent sends
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { data: recent } = await supabase
      .from("phone_verification_codes")
      .select("id, created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(1);
    if (recent && recent.length > 0) {
      throw new Error("Please wait a moment before requesting another code.");
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(`${userId}:${code}`);
    const expires_at = new Date(Date.now() + CODE_TTL_MS).toISOString();

    const { error: insErr } = await supabase
      .from("phone_verification_codes")
      .insert({ user_id: userId, phone, code_hash, expires_at });
    if (insErr) throw new Error(insErr.message);

    const result = await sendSms({
      to: phone,
      body: `Your REI Runner verification code is ${code}. Expires in 10 minutes.`,
    });
    if (!result.ok && !result.skipped) throw new Error(result.error);
    return { ok: true, smsSent: result.ok, phone };
  });

export const confirmPhoneVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ code: z.string().trim().regex(/^\d{6}$/) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("phone_verification_codes")
      .select("id, phone, code_hash, attempts, expires_at, consumed_at")
      .eq("user_id", userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No active verification code. Request a new one.");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Code expired. Request a new one.");
    if (row.attempts >= MAX_ATTEMPTS) throw new Error("Too many attempts. Request a new code.");

    const expected = await sha256(`${userId}:${data.code}`);
    if (expected !== row.code_hash) {
      await supabase
        .from("phone_verification_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("Incorrect code.");
    }
    await supabase
      .from("phone_verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ phone: row.phone, phone_verified: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true, phone: row.phone };
  });

export const removePhoneNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ phone: null, phone_verified: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });