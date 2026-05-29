import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";
import { createCandidate, createInvitation } from "@/lib/checkr.server";

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

  // Idempotency: skip if we already invited this candidate
  const { data: existing } = await supabase
    .from("profiles")
    .select("checkr_candidate_id, checkr_invitation_url")
    .eq("user_id", userId)
    .maybeSingle();

  let candidateId = (existing as any)?.checkr_candidate_id as string | undefined;
  let invitationUrl = (existing as any)?.checkr_invitation_url as string | undefined;

  try {
    if (!candidateId) {
      const candidate = await createCandidate({ email, fullName });
      candidateId = candidate.id;
    }
    if (!invitationUrl) {
      const invite = await createInvitation(candidateId);
      invitationUrl = invite.invitation_url;
    }
  } catch (e) {
    console.error("Checkr invitation failed", e);
    // Still record payment so we can retry from admin
  }

  await supabase
    .from("profiles")
    .update({
      background_check_paid_at: new Date().toISOString(),
      checkr_candidate_id: candidateId ?? null,
      checkr_invitation_url: invitationUrl ?? null,
      checkr_status: invitationUrl ? "invitation_sent" : "payment_received",
      verification_status: "pending_review",
      verification_requested_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "background_check_invite",
    title: invitationUrl ? "Complete your background check" : "Background check payment received",
    body: invitationUrl
      ? "Click to finish your Checkr background check."
      : "We received your payment. We'll email you a Checkr link shortly.",
    link: "/profile/verification",
  });
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