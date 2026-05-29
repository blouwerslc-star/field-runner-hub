import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

const ENV_SCHEMA = z.enum(["sandbox", "live"]);
export const BG_CHECK_PRICE_CENTS = 2499; // $24.99

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
      const email = (profile as any).email as string | null;
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
    return { profile: profile ?? null };
  });