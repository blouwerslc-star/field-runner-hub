import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const yesNo = z.enum(["yes", "no"]);

export const fieldRunnerSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(2).max(50),
  has_transportation: yesNo,
  has_smartphone: yesNo,
  services: z.array(z.string().min(1).max(80)).min(1).max(20),
  availability: z.string().min(1).max(50),
  experience: z.string().max(2000).optional().default(""),
  sample_url: z.string().max(500).optional().default(""),
  disclaimer_agreed: z.literal(true),
  // honeypot — must remain empty
  website: z.string().max(0).optional().default(""),
});

export const proSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  company_name: z.string().max(150).optional().default(""),
  role: z.string().min(1).max(50),
  market_city: z.string().trim().min(1).max(100),
  market_state: z.string().trim().min(2).max(50),
  services_needed: z.array(z.string().min(1).max(80)).min(1).max(20),
  frequency: z.string().min(1).max(50),
  budget: z.string().max(50).optional().default(""),
  urgency: z.string().min(1).max(50),
  details: z.string().max(2000).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export const submitFieldRunner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => fieldRunnerSchema.parse(input))
  .handler(async ({ data }) => {
    const { website: _hp, ...row } = data;
    const { error } = await supabaseAdmin
      .from("field_runner_applications")
      .insert({
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        city: row.city,
        state: row.state,
        has_transportation: row.has_transportation,
        has_smartphone: row.has_smartphone,
        services: row.services,
        availability: row.availability,
        experience: row.experience || null,
        sample_url: row.sample_url || null,
        disclaimer_agreed: row.disclaimer_agreed,
      });
    if (error) {
      console.error("field_runner insert failed", error);
      throw new Error("Could not save your application. Please try again.");
    }
    return { ok: true };
  });

export const submitPro = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => proSchema.parse(input))
  .handler(async ({ data }) => {
    const { website: _hp, ...row } = data;
    const { error } = await supabaseAdmin
      .from("real_estate_pro_applications")
      .insert({
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        company_name: row.company_name || null,
        role: row.role,
        market_city: row.market_city,
        market_state: row.market_state,
        services_needed: row.services_needed,
        frequency: row.frequency,
        budget: row.budget || null,
        urgency: row.urgency,
        details: row.details || null,
      });
    if (error) {
      console.error("pro insert failed", error);
      throw new Error("Could not save your application. Please try again.");
    }
    return { ok: true };
  });