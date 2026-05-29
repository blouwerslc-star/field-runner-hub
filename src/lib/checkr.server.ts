import { Buffer } from "node:buffer";

const CHECKR_BASE = "https://api.checkr.com/v1";
const DEFAULT_PACKAGE = "tasker_standard";

function getApiKey(): string {
  const key = process.env.CHECKR_API_KEY;
  if (!key) throw new Error("CHECKR_API_KEY is not configured");
  return key;
}

function authHeader(): string {
  // Checkr uses HTTP Basic auth: api_key as username, blank password
  return "Basic " + Buffer.from(`${getApiKey()}:`).toString("base64");
}

async function checkrFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${CHECKR_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* not json */ }
  if (!res.ok) {
    const msg = json?.error || json?.errors?.join?.(", ") || `Checkr ${res.status}`;
    throw new Error(`Checkr API error: ${msg}`);
  }
  return json;
}

function toForm(body: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== "") params.append(k, v);
  }
  return params.toString();
}

export interface CheckrCandidate {
  id: string;
  invitation_url?: string;
}

export async function createCandidate(input: {
  email: string;
  fullName?: string | null;
  phone?: string | null;
}): Promise<CheckrCandidate> {
  const [first, ...rest] = (input.fullName ?? "").trim().split(/\s+/);
  const last = rest.length ? rest.join(" ") : "Runner";
  return checkrFetch("/candidates", {
    method: "POST",
    body: toForm({
      email: input.email,
      first_name: first || "Runner",
      last_name: last,
      phone: input.phone ?? undefined,
      no_middle_name: "true",
      work_locations: "[]",
    }),
  });
}

export async function createInvitation(candidateId: string): Promise<{ id: string; invitation_url: string }> {
  const pkg = process.env.CHECKR_PACKAGE || DEFAULT_PACKAGE;
  return checkrFetch("/invitations", {
    method: "POST",
    body: toForm({ candidate_id: candidateId, package: pkg }),
  });
}

/** Verify Checkr webhook HMAC SHA-256 signature. */
export async function verifyCheckrSignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = process.env.CHECKR_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Buffer.from(new Uint8Array(sig)).toString("hex");
  // constant-time compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}