import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

function pickEnv(): StripeEnv {
  return process.env.STRIPE_LIVE_API_KEY ? "live" : "sandbox";
}

async function getOrCreateAccount(userId: string, email: string | null) {
  const env = pickEnv();
  const stripe = createStripeClient(env);

  const { data: rp } = await supabaseAdmin
    .from("runner_profiles")
    .select("stripe_account_id, payouts_enabled, onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  let accountId = rp?.stripe_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: email ?? undefined,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { userId },
    });
    accountId = account.id;

    await supabaseAdmin
      .from("runner_profiles")
      .upsert(
        { user_id: userId, stripe_account_id: accountId },
        { onConflict: "user_id" },
      );
  }

  return { stripe, accountId, env };
}

export const startConnectOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ returnUrl: z.string().url(), refreshUrl: z.string().url() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    try {
      const { stripe, accountId } = await getOrCreateAccount(userId, prof?.email ?? null);
      const link = await stripe.accountLinks.create({
        account: accountId,
        return_url: data.returnUrl,
        refresh_url: data.refreshUrl,
        type: "account_onboarding",
      });
      return { url: link.url };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export const getConnectStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rp } = await supabaseAdmin
      .from("runner_profiles")
      .select("stripe_account_id, payouts_enabled, onboarding_completed")
      .eq("user_id", userId)
      .maybeSingle();

    if (!rp?.stripe_account_id) {
      return { connected: false, payouts_enabled: false, details_submitted: false };
    }

    try {
      const stripe = createStripeClient(pickEnv());
      const acct = await stripe.accounts.retrieve(rp.stripe_account_id);
      const payouts_enabled = Boolean(acct.payouts_enabled);
      const details_submitted = Boolean(acct.details_submitted);

      if (payouts_enabled !== rp.payouts_enabled || details_submitted !== rp.onboarding_completed) {
        await supabaseAdmin
          .from("runner_profiles")
          .update({ payouts_enabled, onboarding_completed: details_submitted })
          .eq("user_id", userId);
      }

      return {
        connected: true,
        payouts_enabled,
        details_submitted,
        requirements_due: acct.requirements?.currently_due ?? [],
      };
    } catch (e) {
      return { connected: true, payouts_enabled: false, details_submitted: false, error: getStripeErrorMessage(e) };
    }
  });

export const openConnectDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rp } = await supabaseAdmin
      .from("runner_profiles")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!rp?.stripe_account_id) return { error: "No Stripe account connected" };
    try {
      const stripe = createStripeClient(pickEnv());
      const login = await stripe.accounts.createLoginLink(rp.stripe_account_id);
      return { url: login.url };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });