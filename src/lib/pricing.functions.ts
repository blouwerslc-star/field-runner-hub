import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase as anonClient } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PricingTemplate = {
  id: string;
  name: string;
  task_type: string;
  title: string;
  description: string | null;
  category: string | null;
  investor_price: number | null;
  runner_payout: number | null;
  platform_fee: number | null;
  est_minutes: number | null;
  deliverables: string[];
  includes_notes: string | null;
  excludes_notes: string | null;
  available_addons: string[];
  sort_order: number;
  active: boolean;
};

export type PricingAddon = {
  key: string;
  name: string;
  description: string | null;
  price_type: string;
  investor_price: number | null;
  runner_payout: number | null;
  platform_fee: number | null;
  investor_price_min: number | null;
  investor_price_max: number | null;
  unit_label: string | null;
  runner_pct: number | null;
  platform_pct: number | null;
  active: boolean;
  sort_order: number;
};

export const getPricingCatalog = createServerFn({ method: "GET" }).handler(
  async () => {
    const [tplRes, addonRes] = await Promise.all([
      anonClient
        .from("task_templates")
        .select("*")
        .eq("is_system", true)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      anonClient
        .from("pricing_addons")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
    ]);
    if (tplRes.error) throw new Error(tplRes.error.message);
    if (addonRes.error) throw new Error(addonRes.error.message);
    return {
      templates: (tplRes.data ?? []) as unknown as PricingTemplate[],
      addons: (addonRes.data ?? []) as unknown as PricingAddon[],
    };
  },
);

const pricingTemplateSchema = z.object({
  id: z.string().uuid(),
  investor_price: z.number().min(0).max(100000).nullable(),
  runner_payout: z.number().min(0).max(100000).nullable(),
  platform_fee: z.number().min(0).max(100000).nullable(),
  est_minutes: z.number().int().min(0).max(1440).nullable(),
  deliverables: z.array(z.string().min(1).max(200)).max(40),
  includes_notes: z.string().max(2000).nullable(),
  excludes_notes: z.string().max(2000).nullable(),
  available_addons: z.array(z.string().min(1).max(60)).max(20),
  category: z.string().max(60).nullable(),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(10000),
});

export const adminUpdatePricingTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => pricingTemplateSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");
    const { id, ...patch } = data;
    const { error } = await supabase
      .from("task_templates")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const addonSchema = z.object({
  key: z.string().min(1).max(60),
  investor_price: z.number().min(0).max(100000).nullable(),
  runner_payout: z.number().min(0).max(100000).nullable(),
  platform_fee: z.number().min(0).max(100000).nullable(),
  investor_price_min: z.number().min(0).max(100000).nullable(),
  investor_price_max: z.number().min(0).max(100000).nullable(),
  runner_pct: z.number().min(0).max(1).nullable(),
  platform_pct: z.number().min(0).max(1).nullable(),
  active: z.boolean(),
});

export const adminUpdatePricingAddon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => addonSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");
    const { key, ...patch } = data;
    const { error } = await supabase
      .from("pricing_addons")
      .update(patch)
      .eq("key", key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const overrideSchema = z.object({
  id: z.string().uuid().optional(),
  template_id: z.string().uuid().nullable(),
  addon_key: z.string().max(60).nullable(),
  market_state: z.string().max(50).nullable(),
  market_city: z.string().max(100).nullable(),
  urgency: z.string().max(30).nullable(),
  experience_level: z.string().max(30).nullable(),
  investor_price: z.number().min(0).max(100000).nullable(),
  runner_payout: z.number().min(0).max(100000).nullable(),
  platform_fee: z.number().min(0).max(100000).nullable(),
  notes: z.string().max(500).nullable(),
  active: z.boolean(),
});

export const listPricingOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");
    const { data, error } = await supabase
      .from("pricing_market_overrides")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { overrides: data ?? [] };
  });

export const upsertPricingOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => overrideSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await supabase
        .from("pricing_market_overrides")
        .update(patch)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabase.from("pricing_market_overrides").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePricingOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");
    const { error } = await supabase
      .from("pricing_market_overrides")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const PRICING_DISCLAIMER =
  "Final pricing may vary by location, urgency, property access, assignment complexity, mileage, and runner availability.";