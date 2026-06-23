// Client-side helpers for capturing and reading a pending referral code.
const KEY = "rei_referral_code";

export function captureReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("ref") || params.get("referral") || "").toUpperCase().trim();
    if (code && /^[A-Z0-9]{4,16}$/.test(code)) {
      window.localStorage.setItem(KEY, code);
      return code;
    }
  } catch {}
  return null;
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function clearPendingReferralCode(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(KEY); } catch {}
}