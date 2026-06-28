import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

const ENV_SCHEMA = z.enum(["sandbox", "live"]);

type CheckoutResult =
  | {
      clientSecret: string;
      breakdown?: {
        totalCents: number;
        promoAppliedCents: number;
        chargeCents: number;
      };
    }
  | { error: string };

export const createTaskFundingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      taskId: z.string().uuid(),
      returnUrl: z.string().url(),
      environment: ENV_SCHEMA,
    }).parse(i),
  )
  .handler(async ({ context, data }): Promise<CheckoutResult> => {
    try {
      const { supabase, userId } = context;
      const { data: task, error } = await supabase
        .from("tasks")
        .select("id, title, payout_amount, investor_id, funded")
        .eq("id", data.taskId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!task) throw new Error("Task not found");
      if (task.investor_id !== userId) throw new Error("Not your task");
      if (task.funded) throw new Error("Task already funded");
      const payout = Number(task.payout_amount ?? 0);
      if (!payout || payout < 1) throw new Error("Task has no payout amount");

      // Platform fee comes OUT OF the payout (not added on top).
      // Investor pays the task price; runner receives 80%, platform retains 20%.
      const totalCents = Math.round(payout * 100);
      const platformFee = Math.round(totalCents * 0.2);
      const runnerPayoutCents = totalCents - platformFee;

      // ---- Promo credit eligibility (First Task Free) -----------------
      // Silently apply the credit if eligible. Stripe minimum charge is
      // $0.50 — cap the discount so the investor still pays at least 50c.
      let promoCreditId: string | null = null;
      let promoAppliedCents = 0;
      let chargeCents = totalCents;
      try {
        const { data: campaign } = await supabase
          .from("promo_campaigns")
          .select("id, enabled, expires_at")
          .eq("code", "first_task_free")
          .maybeSingle();
        const campaignActive = campaign?.enabled
          && (!campaign.expires_at || new Date(campaign.expires_at).getTime() > Date.now());
        if (campaign && campaignActive) {
          const { data: credit } = await supabase
            .from("promo_credits")
            .select("id, status, remaining_cents")
            .eq("campaign_id", campaign.id)
            .eq("user_id", userId)
            .maybeSingle();
          if (credit && credit.status === "available" && credit.remaining_cents > 0) {
            // Confirm no prior completed task (server-side guard).
            const { count: priorTasks } = await supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("investor_id", userId)
              .in("status", ["approved", "paid", "completed"]);
            if ((priorTasks ?? 0) === 0) {
              let applied = Math.min(credit.remaining_cents, totalCents);
              const remainingCharge = totalCents - applied;
              if (remainingCharge > 0 && remainingCharge < 50) {
                applied = totalCents - 50;
              }
              if (applied > 0) {
                promoCreditId = credit.id;
                promoAppliedCents = applied;
                chargeCents = totalCents - applied;
                await supabase
                  .from("promo_credits")
                  .update({ status: "reserved", task_id: data.taskId })
                  .eq("id", credit.id)
                  .eq("status", "available");
              }
            }
          }
        }
      } catch (e) {
        // Never let promo lookup block checkout
        console.warn("promo lookup failed", e);
      }

      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: `Task escrow: ${task.title}` },
            unit_amount: chargeCents,
          },
          quantity: 1,
        }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        payment_intent_data: { description: `REI Runner — ${task.title}` },
        metadata: {
          task_id: data.taskId,
          investor_id: userId,
          payout_cents: String(runnerPayoutCents),
          platform_fee_cents: String(platformFee),
          total_cents: String(totalCents),
          charge_cents: String(chargeCents),
          promo_credit_cents: String(promoAppliedCents),
          promo_credit_id: promoCreditId ?? "",
          kind: "task",
        },
      });
      return {
        clientSecret: session.client_secret ?? "",
        breakdown: {
          totalCents,
          promoAppliedCents,
          chargeCents,
        },
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const confirmTaskFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      sessionId: z.string().min(1).max(200),
      environment: ENV_SCHEMA,
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    try {
      const { supabase, userId } = context;
      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (session.payment_status !== "paid") {
        return { funded: false, status: session.payment_status };
      }
      const taskId = session.metadata?.task_id;
      const investorId = session.metadata?.investor_id;
      const payoutCents = Number(session.metadata?.payout_cents ?? 0);
      const feeCents = Number(session.metadata?.platform_fee_cents ?? 0);
      const totalCents = Number(session.metadata?.total_cents ?? payoutCents + feeCents);
      if (!taskId || investorId !== userId) throw new Error("Invalid session");

      const pi = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      // Idempotent: only insert if no payment row exists for this session
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      let paymentId = existing?.id as string | undefined;
      if (!paymentId) {
        const { data: ins, error: insErr } = await supabase
          .from("payments")
          .insert({
            task_id: taskId,
            investor_id: userId,
            amount_cents: totalCents,
            platform_fee_cents: feeCents,
            runner_payout_cents: payoutCents,
            status: "funded",
            kind: "task",
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: pi,
          })
          .select("id")
          .single();
        if (insErr) throw new Error(insErr.message);
        paymentId = ins.id;
      }

      await supabase
        .from("tasks")
        .update({ funded: true, funding_payment_id: paymentId })
        .eq("id", taskId)
        .eq("investor_id", userId);

      return { funded: true, taskId };
    } catch (error) {
      return { funded: false, error: getStripeErrorMessage(error) };
    }
  });

export const listPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Admins only");

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const taskIds = [...new Set((data ?? []).map((p) => p.task_id).filter(Boolean))] as string[];
    const runnerIds = [...new Set((data ?? []).map((p) => p.runner_id).filter(Boolean))] as string[];
    const investorIds = [...new Set((data ?? []).map((p) => p.investor_id).filter(Boolean))] as string[];
    const profileIds = [...new Set([...runnerIds, ...investorIds])];

    const [tasksRes, profilesRes] = await Promise.all([
      taskIds.length
        ? supabase.from("tasks").select("id, title, city, state").in("id", taskIds)
        : Promise.resolve({ data: [] as any[] }),
      profileIds.length
        ? supabase.from("profiles").select("user_id, full_name, phone").in("user_id", profileIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const tasksMap = new Map((tasksRes.data ?? []).map((t: any) => [t.id, t]));
    const profilesMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p]));

    return {
      payments: (data ?? []).map((p) => ({
        ...p,
        task: p.task_id ? tasksMap.get(p.task_id) ?? null : null,
        runner: p.runner_id ? profilesMap.get(p.runner_id) ?? null : null,
        investor: p.investor_id ? profilesMap.get(p.investor_id) ?? null : null,
      })),
    };
  });

export const markPayoutPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      paymentId: z.string().uuid(),
      method: z.string().min(1).max(50),
      reference: z.string().max(200).optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Admins only");

    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .select("task_id, status, kind, runner_payout_cents")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!payment) throw new Error("Payment not found");
    // Only released escrow or tips are eligible to be marked paid out.
    // Blocks accidentally paying a 'funded' (still in escrow), 'paid',
    // or 'refunded' row twice.
    if (!["released"].includes(payment.status)) {
      throw new Error(
        `Payment cannot be marked paid from status "${payment.status}". Only released payouts are payable.`,
      );
    }
    if (!payment.runner_payout_cents || payment.runner_payout_cents <= 0) {
      throw new Error("Payment has no runner payout amount.");
    }

    const { error } = await supabase
      .from("payments")
      .update({
        status: "paid",
        payout_method: data.method,
        payout_reference: data.reference ?? null,
        paid_at: new Date().toISOString(),
        paid_by: userId,
      })
      .eq("id", data.paymentId)
      .eq("status", "released");
    if (error) throw new Error(error.message);

    // Only flip the task to "paid" for task escrow payouts — tip payouts
    // shouldn't change the task's lifecycle status.
    if (payment?.task_id && payment.kind === "task") {
      await supabase.from("tasks").update({ status: "paid" }).eq("id", payment.task_id);
    }
    return { ok: true };
  });

// ============================================================================
// Refunds — investor cancels a funded task before payout, OR admin refunds a
// disputed payment. Issues a Stripe refund on the original PaymentIntent and
// flips the payment to 'refunded' + task.funded=false.
// ============================================================================

export const refundTaskFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      paymentId: z.string().uuid(),
      reason: z.string().trim().max(500).optional(),
      cancelTask: z.boolean().default(true),
      environment: ENV_SCHEMA,
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    try {
      const { supabase, userId } = context;
      const { data: payment, error: pErr } = await supabase
        .from("payments")
        .select("id, task_id, investor_id, status, kind, amount_cents, stripe_payment_intent_id")
        .eq("id", data.paymentId)
        .maybeSingle();
      if (pErr) throw new Error(pErr.message);
      if (!payment) throw new Error("Payment not found");

      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", userId);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      const isOwningInvestor = payment.investor_id === userId;
      if (!isAdmin && !isOwningInvestor) throw new Error("Not authorized to refund this payment");

      // Investors can only self-cancel funded escrow before approval.
      // Disputed/released states require admin.
      if (!isAdmin && payment.status !== "funded") {
        throw new Error(`Cannot refund a payment in status "${payment.status}". Contact support.`);
      }
      if (!["funded", "disputed"].includes(payment.status)) {
        throw new Error(`Payment cannot be refunded from status "${payment.status}".`);
      }
      if (payment.kind !== "task") {
        throw new Error("Only task escrow payments can be refunded here.");
      }
      if (!payment.stripe_payment_intent_id) {
        throw new Error("Payment has no Stripe PaymentIntent on file.");
      }

      const stripe = createStripeClient(data.environment as StripeEnv);
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        reason: "requested_by_customer",
        metadata: {
          task_id: payment.task_id ?? "",
          payment_id: payment.id,
          refunded_by: userId,
          note: data.reason ?? "",
        },
      });

      await supabase
        .from("payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", payment.id);

      if (payment.task_id) {
        const taskUpdate = data.cancelTask
          ? { funded: false, status: "cancelled" as const }
          : { funded: false };
        await supabase.from("tasks").update(taskUpdate).eq("id", payment.task_id);

        // Notify the runner if one was assigned
        const { data: task } = await supabase
          .from("tasks").select("runner_id, title").eq("id", payment.task_id).maybeSingle();
        if (task?.runner_id) {
          await supabase.from("notifications").insert({
            user_id: task.runner_id,
            type: "task_cancelled_refunded",
            title: "Task cancelled and refunded",
            body: `"${task.title ?? "A task"}" has been cancelled and the investor was refunded.`,
            link: "/dashboard/runner",
          });
        }
      }

      return { ok: true, refundId: refund.id };
    } catch (error) {
      return { ok: false, error: getStripeErrorMessage(error) };
    }
  });

// ============================================================================
// Tipping — investors can leave a tip for the runner after task completion.
// Tips pass 100% to the runner (no platform fee).
// ============================================================================

export const createTaskTipCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      taskId: z.string().uuid(),
      amountCents: z.number().int().min(100).max(100000),
      returnUrl: z.string().url(),
      environment: ENV_SCHEMA,
    }).parse(i),
  )
  .handler(async ({ context, data }): Promise<CheckoutResult> => {
    try {
      const { supabase, userId } = context;
      const { data: task, error } = await supabase
        .from("tasks")
        .select("id, title, investor_id, runner_id, status")
        .eq("id", data.taskId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!task) throw new Error("Task not found");
      if (task.investor_id !== userId) throw new Error("Not your task");
      if (!task.runner_id) throw new Error("No runner assigned to this task");
      // Tips are only available once the investor has approved the
      // submitted work (or after payout). "submitted" is still pending
      // review and tipping then would muddy the approval decision.
      if (!["approved", "paid"].includes(task.status ?? "")) {
        throw new Error("Tip can only be added after you approve the runner's work.");
      }

      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: `Tip for runner — ${task.title}` },
            unit_amount: data.amountCents,
          },
          quantity: 1,
        }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        payment_intent_data: { description: `REI Runner tip — ${task.title}` },
        metadata: {
          task_id: data.taskId,
          investor_id: userId,
          runner_id: task.runner_id,
          amount_cents: String(data.amountCents),
          kind: "tip",
        },
      });
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const confirmTaskTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      sessionId: z.string().min(1).max(200),
      environment: ENV_SCHEMA,
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    try {
      const { supabase, userId } = context;
      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (session.payment_status !== "paid") {
        return { paid: false, status: session.payment_status };
      }
      const taskId = session.metadata?.task_id;
      const investorId = session.metadata?.investor_id;
      const runnerId = session.metadata?.runner_id;
      const amountCents = Number(session.metadata?.amount_cents ?? 0);
      if (!taskId || !runnerId || investorId !== userId) throw new Error("Invalid session");

      const pi = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (!existing) {
        const { error: insErr } = await supabase
          .from("payments")
          .insert({
            task_id: taskId,
            investor_id: userId,
            runner_id: runnerId,
            amount_cents: amountCents,
            platform_fee_cents: 0,
            runner_payout_cents: amountCents,
            status: "released",
            kind: "tip",
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: pi,
          });
        if (insErr) throw new Error(insErr.message);
      }

      return { paid: true, taskId };
    } catch (error) {
      return { paid: false, error: getStripeErrorMessage(error) };
    }
  });