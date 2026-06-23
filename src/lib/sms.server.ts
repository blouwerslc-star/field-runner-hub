// Server-only Twilio SMS sender via the Lovable connector gateway.
// No-ops gracefully when Twilio is not yet connected.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export type SmsSendResult =
  | { ok: true; messageSid: string }
  | { ok: false; error: string; skipped?: boolean };

export async function sendSms(opts: {
  to: string;
  body: string;
  from?: string;
}): Promise<SmsSendResult> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const twilioKey = process.env.TWILIO_API_KEY;
  const fromNumber = opts.from ?? process.env.TWILIO_FROM_NUMBER;
  if (!lovableKey || !twilioKey || !fromNumber) {
    return { ok: false, skipped: true, error: "SMS not configured" };
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: opts.to, From: fromNumber, Body: opts.body.slice(0, 480) }),
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` };
    return { ok: true, messageSid: data.sid ?? "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export function normalizeE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+") && digits.length >= 8 && digits.length <= 16) return digits;
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  return null;
}