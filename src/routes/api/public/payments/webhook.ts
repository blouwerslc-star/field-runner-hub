import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any) {
  // Route by metadata.kind — verification payments bypass the task escrow flow.
  if (session.metadata?.kind === "background_check") {
    return handleBackgroundCheckPaid(session);
  }

  const taskId = session.metadata?.task_id;
  const investorId = session.metadata?.investor_id;
  const payoutCents = Number(session.metadata?.payout_cents ?? 0);
  const feeCents = Number(session.metadata?.platform_fee_cents ?? 0);
  if (!taskId || !investorId) return;

  const supabase = getSupabase() as any;
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  let paymentId = (existing as { id?: string } | null)?.id;
  if (!paymentId) {
    const { data: ins, error } = await supabase
      .from("payments")
      .insert({
        task_id: taskId,
        investor_id: investorId,
        amount_cents: payoutCents + feeCents,
        platform_fee_cents: feeCents,
        runner_payout_cents: payoutCents,
        status: "funded",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string"
          ? session.payment_intent : null,
      })
      .select("id")
      .single();
    if (error) {
      console.error("payments insert failed", error);
      return;
    }
    paymentId = (ins as { id: string }).id;
  }

  await supabase
    .from("tasks")
    .update({ funded: true, funding_payment_id: paymentId })
    .eq("id", taskId);
}

async function handleBackgroundCheckPaid(session: any) {
  const userId = session.metadata?.user_id;
  const email = session.metadata?.runner_email || session.customer_details?.email;
  const fullName = session.metadata?.runner_name || session.customer_details?.name;
  if (!userId || !email) {
    console.error("background_check session missing user_id or email", session.id);
    return;
  }
  const supabase = getSupabase() as any;

  await supabase
    .from("profiles")
    .update({
      background_check_paid_at: new Date().toISOString(),
      checkr_status: "pending",
      verification_status: "pending_review",
      verification_requested_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  // Notify the runner
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "background_check_paid",
    title: "Background check payment received",
    body: "Thanks! Our team will start your background check within 1 business day.",
    link: "/profile/background-check",
  });

  // Notify all admins so they can manually start the check in Checkr's dashboard
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (admins?.length) {
    await supabase.from("notifications").insert(
      admins.map((a: any) => ({
        user_id: a.user_id,
        type: "background_check_requested",
        title: "New background check to run",
        body: `${fullName || email} paid for a background check. Run it in Checkr's dashboard.`,
        link: "/admin/background-checks",
      })),
    );
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          if (event.type === "checkout.session.completed") {
            await handleCheckoutCompleted(event.data.object);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});