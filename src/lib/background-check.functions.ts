import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

const ENV_SCHEMA = z.enum(["sandbox", "live"]);
export const BG_CHECK_PRICE_CENTS = 1399; // $13.99

type CheckoutResult = { clientSecret: string } | { error: string };

export const startBackgroundCheckCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      returnUrl: z.string().url(),
      environment: ENV_SCHEMA,
    }).parse(i),
  )
  .handler(async ({ context, data }): Promise<CheckoutResult> => {
    try {
      const { supabase, userId } = context;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, background_check_verified")
        .eq("user_id", userId)
        .maybeSingle();
      if (!profile) throw new Error("Profile not found");
      if ((profile as any).background_check_verified) {
        throw new Error("Background check is already verified");
      }
      const claimsEmail = (context as any).claims?.email as string | undefined;
      const email = ((profile as any).email as string | null) || claimsEmail || null;
      if (!email) throw new Error("Please add an email to your profile first");

      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "REI Runner — Background Check Verification",
              description: "One-time identity & criminal background screening.",
            },
            unit_amount: BG_CHECK_PRICE_CENTS,
          },
          quantity: 1,
        }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer_email: email,
        payment_intent_data: { description: "REI Runner — Background Check" },
        metadata: {
          kind: "background_check",
          user_id: userId,
          runner_email: email,
          runner_name: (profile as any).full_name ?? "",
        },
      });
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const getBackgroundCheckStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "background_check_verified, background_check_paid_at, checkr_status, checkr_invitation_url, checkr_candidate_id, checkr_report_id",
      )
      .eq("user_id", userId)
      .maybeSingle();
    const { data: submission } = await supabase
      .from("background_check_submissions")
      .select(
        "id, status, submitted_at, reviewed_at, needs_info_reason, admin_notes, ssn_last4, legal_first_name, legal_last_name, current_city, current_state",
      )
      .eq("user_id", userId)
      .maybeSingle();
    return { profile: profile ?? null, submission: submission ?? null };
  });

// ============================================================
// Intake form — runner submits identity info for manual check
// ============================================================

const addressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().length(2),
  zip: z.string().trim().min(3).max(20),
  from: z.string().trim().max(20).optional().nullable(),
  to: z.string().trim().max(20).optional().nullable(),
});

const intakeSchema = z.object({
  legal_first_name: z.string().trim().min(1).max(80),
  legal_middle_name: z.string().trim().max(80).optional().nullable(),
  legal_last_name: z.string().trim().min(1).max(80),
  name_suffix: z.string().trim().max(20).optional().nullable(),
  other_names: z.array(z.string().trim().max(160)).max(10).default([]),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  ssn_last4: z.string().regex(/^\d{4}$/, "Enter the last 4 digits of your SSN"),
  ssn_full: z
    .string()
    .regex(/^\d{3}-?\d{2}-?\d{4}$/, "Use 123-45-6789")
    .optional()
    .nullable(),
  drivers_license_number: z.string().trim().max(40).optional().nullable(),
  drivers_license_state: z.string().trim().length(2).optional().nullable(),
  drivers_license_expiration: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(200),
  current_address: addressSchema,
  prior_addresses: z.array(addressSchema).max(8).default([]),
  id_front_path: z.string().trim().max(500).optional().nullable(),
  id_back_path: z.string().trim().max(500).optional().nullable(),
  selfie_path: z.string().trim().max(500).optional().nullable(),
  fcra_consent: z.literal(true),
  background_check_consent: z.literal(true),
  info_truthful_consent: z.literal(true),
  signature_full_name: z.string().trim().min(2).max(160),
});

export const submitBackgroundCheckIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => intakeSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const ip =
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      getRequestHeader("cf-connecting-ip") ||
      null;

    // Verify paid + not already verified
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("background_check_paid_at, background_check_verified")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile?.background_check_paid_at) {
      throw new Error("Please complete the $13.99 payment before submitting your information.");
    }
    if (profile.background_check_verified) {
      throw new Error("Background check is already verified.");
    }

    // Block resubmission unless current row is in needs_info
    const { data: existing } = await supabaseAdmin
      .from("background_check_submissions")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing && existing.status !== "needs_info") {
      throw new Error("Your submission is already on file. We'll reach out if we need more info.");
    }

    // Encrypt full SSN if provided
    let ssnEncrypted: string | null = null;
    if (data.ssn_full) {
      const key = process.env.BG_CHECK_ENCRYPTION_KEY;
      if (!key) throw new Error("Encryption key is not configured");
      const { data: enc, error: encErr } = await supabaseAdmin.rpc("bg_encrypt_ssn", {
        _ssn: data.ssn_full.replace(/-/g, ""),
        _key: key,
      });
      if (encErr) throw new Error(encErr.message);
      ssnEncrypted = enc as unknown as string;
    }

    const payload = {
      user_id: userId,
      status: "submitted" as const,
      legal_first_name: data.legal_first_name,
      legal_middle_name: data.legal_middle_name ?? null,
      legal_last_name: data.legal_last_name,
      name_suffix: data.name_suffix ?? null,
      other_names: data.other_names,
      date_of_birth: data.date_of_birth,
      ssn_last4: data.ssn_last4,
      ssn_full_encrypted: ssnEncrypted,
      drivers_license_number: data.drivers_license_number ?? null,
      drivers_license_state: data.drivers_license_state ?? null,
      drivers_license_expiration: data.drivers_license_expiration ?? null,
      phone: data.phone,
      email: data.email,
      current_address_line1: data.current_address.line1,
      current_address_line2: data.current_address.line2 ?? null,
      current_city: data.current_address.city,
      current_state: data.current_address.state.toUpperCase(),
      current_zip: data.current_address.zip,
      current_address_since: data.current_address.from ?? null,
      prior_addresses: data.prior_addresses,
      id_front_path: data.id_front_path ?? null,
      id_back_path: data.id_back_path ?? null,
      selfie_path: data.selfie_path ?? null,
      fcra_consent: data.fcra_consent,
      background_check_consent: data.background_check_consent,
      info_truthful_consent: data.info_truthful_consent,
      signature_full_name: data.signature_full_name,
      signature_ip: ip,
      signed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      needs_info_reason: null,
    };

    const { data: row, error } = existing
      ? await supabaseAdmin
          .from("background_check_submissions")
          .update(payload)
          .eq("id", existing.id)
          .select("id")
          .single()
      : await supabaseAdmin
          .from("background_check_submissions")
          .insert(payload)
          .select("id")
          .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("background_check_audit").insert({
      submission_id: row.id,
      subject_user_id: userId,
      actor_id: userId,
      action: existing ? "resubmit" : "view",
      metadata: { event: existing ? "resubmit" : "initial_submit" },
      ip,
    });

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.user_id,
          type: "background_check_submitted",
          title: "New background check submission",
          body: `${data.legal_first_name} ${data.legal_last_name} submitted intake.`,
          link: "/admin/background-checks",
        })),
      );
    }

    return { ok: true };
  });