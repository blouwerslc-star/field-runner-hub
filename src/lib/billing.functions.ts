import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listPayoutMethods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("payout_methods")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { methods: data ?? [] };
  });

const payoutMethodSchema = z.object({
  method_type: z.enum(["bank_account", "debit_card", "paypal", "venmo", "cashapp", "other"]),
  display_name: z.string().trim().max(120).optional().nullable(),
  details: z.record(z.string(), z.string().max(200)).default({}),
  is_default: z.boolean().default(false),
});

export const addPayoutMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => payoutMethodSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.is_default) {
      await supabase
        .from("payout_methods")
        .update({ is_default: false })
        .eq("user_id", userId);
    }
    const { data: row, error } = await supabase
      .from("payout_methods")
      .insert({
        user_id: userId,
        method_type: data.method_type,
        display_name: data.display_name ?? null,
        details: data.details,
        is_default: data.is_default,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { method: row };
  });

export const removePayoutMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("payout_methods")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("investor_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { invoices: data ?? [] };
  });

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        amount_cents: z.number().int().min(100).max(100_000_00),
        payout_method_id: z.string().uuid().optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("payout_requests")
      .insert({
        runner_id: userId,
        amount_cents: data.amount_cents,
        payout_method_id: data.payout_method_id ?? null,
        notes: data.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { request: row };
  });

export const listMyPayoutRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("runner_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

export const getEarningsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: payments } = await supabase
      .from("payments")
      .select("runner_payout_cents, status, created_at")
      .eq("runner_id", userId);
    let paid = 0;
    let pending = 0;
    let count = 0;
    for (const p of payments ?? []) {
      const cents = Number((p as any).runner_payout_cents ?? 0);
      count += 1;
      if ((p as any).status === "paid") paid += cents;
      else pending += cents;
    }
    return { paid_cents: paid, pending_cents: pending, count };
  });

// Admin
export const adminListPayoutRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Admin only");
    const { data, error } = await supabaseAdmin
      .from("payout_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

export const adminDecidePayoutRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "processing", "paid", "rejected"]),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Admin only");
    const { error } = await supabaseAdmin
      .from("payout_requests")
      .update({
        status: data.status,
        processed_at: data.status === "paid" ? new Date().toISOString() : null,
        processed_by: userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });