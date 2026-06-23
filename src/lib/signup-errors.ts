// Translate raw Supabase auth / server errors into friendly, actionable
// messages users can act on. Keep this UI-only — server logging keeps the
// original error text for admins.

export type FriendlyError = {
  title: string;
  message: string;
  action?: "sign_in" | "reset_password" | "contact_support" | "retry";
};

const SUPPORT_LINE =
  "If this keeps happening, email support@reirunner.com and we'll get you in.";

export function friendlySignupError(raw: unknown): FriendlyError {
  const msg = (raw instanceof Error ? raw.message : String(raw ?? "")).toLowerCase();

  if (!msg) {
    return {
      title: "Sign-up failed",
      message: `Something went wrong creating your account. ${SUPPORT_LINE}`,
      action: "contact_support",
    };
  }

  if (msg.includes("already registered") || msg.includes("user already") || msg.includes("already been registered")) {
    return {
      title: "That email already has an account",
      message: "Try signing in instead, or reset your password if you forgot it.",
      action: "sign_in",
    };
  }

  if (msg.includes("password") && (msg.includes("short") || msg.includes("weak") || msg.includes("6 characters") || msg.includes("8 characters"))) {
    return {
      title: "Password is too weak",
      message: "Use at least 8 characters. Mixing letters, numbers, and a symbol helps.",
      action: "retry",
    };
  }

  if (msg.includes("invalid") && msg.includes("email")) {
    return {
      title: "That email doesn't look right",
      message: "Double-check the address for typos and try again.",
      action: "retry",
    };
  }

  if (msg.includes("rate limit") || msg.includes("too many")) {
    return {
      title: "Too many attempts",
      message: `Please wait a minute and try again. ${SUPPORT_LINE}`,
      action: "contact_support",
    };
  }

  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return {
      title: "Connection problem",
      message: "Check your internet connection and try again.",
      action: "retry",
    };
  }

  if (msg.includes("profile insert failed") || msg.includes("role insert failed") || msg.includes("runner profile insert failed")) {
    return {
      title: "Account created, finishing setup",
      message: "Your account was created but we hit a snag finishing your profile. Sign in and we'll complete it automatically.",
      action: "sign_in",
    };
  }

  return {
    title: "Sign-up failed",
    message: `${raw instanceof Error ? raw.message : "Unexpected error."} ${SUPPORT_LINE}`,
    action: "contact_support",
  };
}

export function errorCodeFor(raw: unknown): string {
  if (raw && typeof raw === "object" && "code" in raw && typeof (raw as { code: unknown }).code === "string") {
    return (raw as { code: string }).code;
  }
  if (raw && typeof raw === "object" && "status" in raw) {
    return String((raw as { status: unknown }).status);
  }
  return "";
}