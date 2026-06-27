// Server-only rate limiter. Wraps the public.check_rate_limit RPC.
// Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
// Identifier is typically the auth.uid() of the caller, or an IP string for
// unauthenticated surfaces.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds?: number };

export async function checkRateLimit(
  action: string,
  identifier: string,
  max: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!identifier) return { allowed: true };
  const { data, error } = await (supabaseAdmin as any).rpc("check_rate_limit", {
    _action: action,
    _identifier: identifier,
    _max: max,
    _window_seconds: windowSeconds,
  });
  if (error) {
    // Fail-open on infrastructure errors so legitimate traffic isn't blocked.
    console.error("[rate-limit] rpc error", error);
    return { allowed: true };
  }
  return data === true
    ? { allowed: true }
    : { allowed: false, retryAfterSeconds: windowSeconds };
}

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Too many requests. Please try again later.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function enforceRateLimit(
  action: string,
  identifier: string,
  max: number,
  windowSeconds: number,
): Promise<void> {
  const res = await checkRateLimit(action, identifier, max, windowSeconds);
  if (!res.allowed) throw new RateLimitError(res.retryAfterSeconds ?? windowSeconds);
}