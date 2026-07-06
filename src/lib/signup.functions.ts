import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// NOTE: supabaseAdmin import at module top-level is left as-is for backward
// compatibility with existing handler code below. New handlers in this file
// dynamic-import it inside the handler per the modern stack rules.
const finalizeSignupSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().trim().email().max(200),
  full_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional().default(""),
  role: z.enum(["runner", "investor"]),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(50).optional().default(""),
  company_name: z.string().trim().max(150).optional().default(""),
  markets_served: z.string().trim().max(300).optional().default(""),
  monthly_deal_volume: z.string().trim().max(80).optional().default(""),
  service_radius: z.string().trim().max(80).optional().default(""),
  transportation_available: z.boolean().optional().nullable(),
  task_types: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
});

const emptyToNull = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const finalizeSignupProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => finalizeSignupSchema.parse(input))
  .handler(async ({ context, data }) => {
    if (data.userId !== context.userId) {
      throw new Error("Signup session does not match the created user.");
    }

    // Runner signups are temporarily paused site-wide.
    if (data.role === "runner") {
      throw new Error(
        "Runner signups are temporarily paused. Please join the waitlist at /waitlist and we'll notify you when we reopen.",
      );
    }

    const profile = {
      user_id: context.userId,
      email: data.email,
      full_name: data.full_name,
      phone: emptyToNull(data.phone),
      city: emptyToNull(data.city),
      state: emptyToNull(data.state),
      service_radius: data.role === "runner" ? emptyToNull(data.service_radius) : null,
      transportation_available: data.role === "runner" ? data.transportation_available ?? null : null,
      task_types: data.role === "runner" ? data.task_types : [],
      company_name: data.role === "investor" ? emptyToNull(data.company_name) : null,
      markets_served: data.role === "investor" ? emptyToNull(data.markets_served) : null,
      monthly_deal_volume: data.role === "investor" ? emptyToNull(data.monthly_deal_volume) : null,
    };

    const { error: profileError } = await context.supabase
      .from("profiles")
      .upsert(profile, { onConflict: "user_id" })
      .select("user_id")
      .single();
    if (profileError) throw new Error(`Profile insert failed: ${profileError.message}`);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(`Role insert failed: ${roleError.message}`);

    if (data.role === "runner") {
      const { error: runnerError } = await supabaseAdmin
        .from("runner_profiles")
        .upsert({ user_id: context.userId }, { onConflict: "user_id" });
      if (runnerError) throw new Error(`Runner profile insert failed: ${runnerError.message}`);
    }

    return { profileStatus: "success" };
  });

// Self-healing profile/role check.
// Called on every login + on _authenticated mount. If the database trigger
// failed to create a profile or role row for any reason (e.g. transient DB
// error, missing metadata on social sign-in), this fills in the gap so the
// user is never stranded in a half-created state.
const ensureSchema = z.object({
  // Hints for newly-created accounts where profile metadata may be missing.
  preferred_role: z.enum(["runner", "investor"]).optional(),
  full_name: z.string().trim().max(100).optional(),
});

export const ensureUserSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ensureSchema.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // 1) Read auth user for fallback metadata
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
    const email = authUser?.user?.email ?? "";

    // 2) Ensure profile row exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const fullName =
        data.full_name ||
        (typeof meta.full_name === "string" ? meta.full_name : "") ||
        (typeof meta.name === "string" ? meta.name : "") ||
        email.split("@")[0] ||
        "Member";
      const { error: insertErr } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          email,
          full_name: fullName,
          phone: typeof meta.phone === "string" ? meta.phone : null,
        });
      if (insertErr && !insertErr.message.includes("duplicate key")) {
        throw new Error(`Self-heal profile insert failed: ${insertErr.message}`);
      }
    }

    // 3) Ensure at least one role row exists
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!roles || roles.length === 0) {
      const role =
        data.preferred_role ||
        (meta.role === "investor" || meta.role === "runner" ? meta.role : "runner");
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

      if (role === "runner") {
        await supabaseAdmin
          .from("runner_profiles")
          .upsert({ user_id: userId }, { onConflict: "user_id" });
      }
    }

    return { healed: !existingProfile || !roles || roles.length === 0 };
  });