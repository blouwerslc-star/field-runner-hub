import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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