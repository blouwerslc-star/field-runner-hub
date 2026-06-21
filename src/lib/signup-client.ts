import { supabase } from "@/integrations/supabase/client";

export type SignupRole = "runner" | "investor";

export type PasswordSignupResult = {
  userId: string;
  email: string;
  needsEmailVerification: boolean;
};

export function mapAuthError(code: string | undefined, message: string): string {
  switch (code) {
    case "weak_password":
      return "That password is too weak or has appeared in a known data breach. Please choose a stronger, unique password with letters, numbers, and symbols.";
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Please sign in instead.";
    case "signup_disabled":
      return "New account sign-ups are temporarily disabled. Please try again later.";
    case "validation_failed":
    case "invalid_email":
      return "That email address looks invalid. Please double-check and try again.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    default:
      if (/registered|already.*exists/i.test(message)) {
        return "An account with that email already exists. Please sign in instead.";
      }
      if (/password/i.test(message) && /weak|pwned|breach/i.test(message)) {
        return "That password is too weak or has appeared in a known data breach. Please choose a stronger, unique password.";
      }
      return message || "Could not create your account. Please try again.";
  }
}

export function getPasswordValidationError(password: string, confirmation: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

export async function createPasswordAccount(opts: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: SignupRole;
  redirectTo?: string;
  extra?: Record<string, string | boolean | string[] | null | undefined>;
}): Promise<PasswordSignupResult> {
  const metadata = {
    role: opts.role,
    full_name: opts.fullName.trim(),
    phone: opts.phone?.trim() ?? "",
    ...opts.extra,
  };

  const { data, error } = await supabase.auth.signUp({
    email: opts.email.trim(),
    password: opts.password,
    options: {
      emailRedirectTo: opts.redirectTo,
      data: metadata,
    },
  });

  if (error) {
    throw new Error(mapAuthError((error as { code?: string }).code, error.message));
  }
  if (!data.user) {
    throw new Error("Sign-up did not return a user. Please try again.");
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? opts.email.trim(),
    needsEmailVerification: !data.session,
  };
}
