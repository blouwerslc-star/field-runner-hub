import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

const ENV_SCHEMA = z.enum(["sandbox", "live"]);

type CheckoutResult = { clientSecret: string } | { error: string };

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

      const platformFee = Math.round(payout * 100 * 0.2);
      const totalCents = Math.round(payout * 100) + platformFee;

      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: `Task escrow: ${task.title}` },
            unit_amount: totalCents,
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
          payout_cents: String(Math.round(payout * 100)),
          platform_fee_cents: String(platformFee),
        },
      });
      return { clientSecret: session.client_secret ?? "" };
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
            amount_cents: payoutCents + feeCents,
            platform_fee_cents: feeCents,
            runner_payout_cents: payoutCents,
            status: "funded",
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

    const { error } = await supabase
      .from("payments")
      .update({
        status: "paid",
        payout_method: data.method,
        payout_reference: data.reference ?? null,
        paid_at: new Date().toISOString(),
        paid_by: userId,
      })
      .eq("id", data.paymentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });