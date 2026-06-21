const AUTH_HINT_KEY = "rei-runner-authenticated";

export function readAuthHint() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTH_HINT_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAuthHint(isAuthenticated: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (isAuthenticated) {
      window.localStorage.setItem(AUTH_HINT_KEY, "true");
    } else {
      window.localStorage.removeItem(AUTH_HINT_KEY);
    }
  } catch {
    // Storage can be blocked in some privacy modes; the live Supabase session is still authoritative.
  }
}
