// Paste your IDs here once created. Both are publishable (safe in client code).
// Meta Pixel ID — a long number, e.g. "1234567890123456"
export const META_PIXEL_ID = "1916193709038747";
// GA4 Measurement ID — starts with "G-", e.g. "G-XXXXXXXXXX"
export const GA4_MEASUREMENT_ID = "G-G8HR1RLMKV";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackLead(value?: number, currency = "USD") {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", "Lead", value ? { value, currency } : undefined);
    window.gtag?.("event", "generate_lead", value ? { value, currency } : {});
  } catch {
    // no-op
  }
}

export function trackSignup(method: "investor" | "runner" | "email" | "google" = "email") {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", "CompleteRegistration", { content_name: method });
    window.gtag?.("event", "sign_up", { method });
  } catch {
    // no-op
  }
}

export function trackContact(channel: "email" | "phone" | "form" = "form") {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", "Contact", { content_name: channel });
    window.gtag?.("event", "contact", { method: channel });
  } catch {
    // no-op
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
    window.fbq?.("trackCustom", name, params);
  } catch {
    // no-op
  }
}