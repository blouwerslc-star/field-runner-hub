// Paste your IDs here once created. Both are publishable (safe in client code).
// Meta Pixel ID — a long number, e.g. "1234567890123456"
export const META_PIXEL_ID = "";
// GA4 Measurement ID — starts with "G-", e.g. "G-XXXXXXXXXX"
export const GA4_MEASUREMENT_ID = "";

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