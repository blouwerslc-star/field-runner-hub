import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { appendFieldRunner, appendPro } from "./sheets.server";
import { sendTransactionalEmail } from "./email-sender.server";

const yesNo = z.enum(["yes", "no"]);

export const fieldRunnerSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(2).max(50),
  street_address: z.string().trim().min(2).max(200),
  zip_code: z.string().trim().min(3).max(20),
  date_of_birth: z.string().trim().min(4).max(20),
  has_transportation: yesNo,
  has_drivers_license: yesNo,
  vehicle_type: z.string().min(1).max(50),
  travel_radius_miles: z.string().min(1).max(20),
  has_smartphone: yesNo,
  services: z.array(z.string().min(1).max(80)).min(1).max(20),
  availability: z.string().min(1).max(50),
  hours_per_week: z.string().min(1).max(30),
  preferred_payout: z.string().min(1).max(40),
  background_check_consent: z.literal(true),
  heard_about: z.string().min(1).max(50),
  referral_code: z.string().max(50).optional().default(""),
  social_links: z.string().max(500).optional().default(""),
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
        street_address: row.street_address,
        zip_code: row.zip_code,
        date_of_birth: row.date_of_birth,
        has_transportation: row.has_transportation,
        has_drivers_license: row.has_drivers_license,
        vehicle_type: row.vehicle_type,
        travel_radius_miles: row.travel_radius_miles,
        has_smartphone: row.has_smartphone,
        services: row.services,
        availability: row.availability,
        hours_per_week: row.hours_per_week,
        preferred_payout: row.preferred_payout,
        background_check_consent: row.background_check_consent,
        heard_about: row.heard_about,
        referral_code: row.referral_code || null,
        social_links: row.social_links || null,
        experience: row.experience || null,
        sample_url: row.sample_url || null,
        disclaimer_agreed: row.disclaimer_agreed,
      });
    if (error) {
      console.error("field_runner insert failed", error);
      throw new Error("Could not save your application. Please try again.");
    }
    await appendFieldRunner({
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      state: row.state,
      street_address: row.street_address,
      zip_code: row.zip_code,
      date_of_birth: row.date_of_birth,
      has_transportation: row.has_transportation,
      has_drivers_license: row.has_drivers_license,
      vehicle_type: row.vehicle_type,
      travel_radius_miles: row.travel_radius_miles,
      has_smartphone: row.has_smartphone,
      services: row.services,
      availability: row.availability,
      hours_per_week: row.hours_per_week,
      preferred_payout: row.preferred_payout,
      background_check_consent: row.background_check_consent,
      heard_about: row.heard_about,
      referral_code: row.referral_code || "",
      social_links: row.social_links || "",
      experience: row.experience || "",
      sample_url: row.sample_url || "",
      disclaimer_agreed: row.disclaimer_agreed,
    });
    // Fire-and-forget welcome email — never block the form on email errors.
    sendTransactionalEmail({
      templateName: "applicant_welcome",
      recipientEmail: row.email,
      templateData: {
        fullName: row.full_name,
        role: "runner",
        signupUrl: "https://reirunner.com/signup?role=runner",
      },
    }).catch((e) => console.error("applicant welcome email failed", e));
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
    await appendPro({
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      company_name: row.company_name || "",
      role: row.role,
      market_city: row.market_city,
      market_state: row.market_state,
      services_needed: row.services_needed,
      frequency: row.frequency,
      budget: row.budget || "",
      urgency: row.urgency,
      details: row.details || "",
    });
    sendTransactionalEmail({
      templateName: "applicant_welcome",
      recipientEmail: row.email,
      templateData: {
        fullName: row.full_name,
        role: "investor",
        signupUrl: "https://reirunner.com/signup?role=investor",
      },
    }).catch((e) => console.error("applicant welcome email failed", e));
    return { ok: true };
  });