import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const VERIFICATION_LEVELS = [
  {
    level: 1,
    key: "identity_verified",
    title: "ID Verified",
    description: "Upload a government-issued photo ID. Our team reviews it and unlocks your Verified badge.",
  },
  {
    level: 2,
    key: "background_check_verified",
    title: "Background Check Verified",
    description:
      "Required to accept tasks that involve entering inside a property (lockbox access, interior walkthroughs, occupied-unit visits). One-time $13.99.",
  },
] as const;

const PROFILE_COLUMNS =
  "user_id, full_name, email, phone, city, state, profile_photo_url, email_verified, phone_verified, identity_verified, background_check_verified, verification_status, verification_level, verification_requested_at, verification_reviewed_at, verification_notes";

export const getMyVerification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const { data: requests } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return { profile, requests: requests ?? [] };
  });

const requestSchema = z.object({
  requested_level: z.number().int().min(1).max(2),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const requestVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => requestSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Block if already an open request
    const { data: existing } = await supabase
      .from("verification_requests")
      .select("id, status, requested_level")
      .eq("user_id", userId)
      .in("status", ["pending_payment", "pending_review"])
      .limit(1);
    if ((existing ?? []).length) {
      throw new Error("You already have a verification request in review. Please wait for the decision.");
    }

    const { data: req, error } = await supabase
      .from("verification_requests")
      .insert({
        user_id: userId,
        requested_level: data.requested_level,
        status: "pending_review",
        notes: data.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("profiles")
      .update({
        verification_status: "pending_review",
        verification_requested_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.user_id,
          type: "verification_requested",
          title: "New verification request",
          body: `A runner requested Level ${data.requested_level} verification.`,
          link: "/admin/verifications",
        })),
      );
    }

    return { request: req };
  });

const adminListSchema = z.object({
  status: z.enum(["pending_payment", "pending_review", "verified", "rejected", "all"]).default("pending_review"),
});

export const adminListVerificationRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => adminListSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    let q = supabaseAdmin
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select(PROFILE_COLUMNS).in("user_id", userIds)
      : { data: [] as any[] };

    const byUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    return {
      requests: (rows ?? []).map((r) => ({ ...r, profile: byUser.get(r.user_id) ?? null })),
    };
  });

const decideSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  admin_notes: z.string().trim().max(2000).optional().nullable(),
});

export const adminDecideVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => decideSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    const { data: req, error: reqErr } = await supabaseAdmin
      .from("verification_requests")
      .select("*")
      .eq("id", data.request_id)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);
    if (!req) throw new Error("Verification request not found");

    const now = new Date().toISOString();

    const { error: updErr } = await supabaseAdmin
      .from("verification_requests")
      .update({
        status: data.decision,
        admin_notes: data.admin_notes ?? null,
        reviewed_by: userId,
        reviewed_at: now,
      })
      .eq("id", data.request_id);
    if (updErr) throw new Error(updErr.message);

    const patch: Record<string, any> = {
      verification_status: data.decision,
      verification_reviewed_at: now,
      verification_reviewed_by: userId,
      verification_notes: data.admin_notes ?? null,
    };

    if (data.decision === "verified") {
      // Flip booleans up to requested level and bump verification_level.
      // Two-step system: level 1 = identity verified, level 2 = background check verified.
      const lvl = req.requested_level as number;
      if (lvl >= 1) patch.identity_verified = true;
      if (lvl >= 2) patch.background_check_verified = true;
      patch.verification_level = lvl;
      patch.verified_status = true;
    }

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update(patch as any)
      .eq("user_id", req.user_id);
    if (profErr) throw new Error(profErr.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: req.user_id,
      type: data.decision === "verified" ? "verification_approved" : "verification_rejected",
      title:
        data.decision === "verified"
          ? `Level ${req.requested_level} verification approved`
          : "Verification request was rejected",
      body: data.admin_notes ?? null,
      link: "/profile/verification",
    });

    return { ok: true };
  });

// ============================================================
// Background-check admin functions (manual Checkr workflow)
// ============================================================

const bgListSchema = z.object({
  status: z.enum(["pending", "passed", "failed", "all"]).default("pending"),
});

export const adminListBackgroundChecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => bgListSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    let q = supabaseAdmin
      .from("profiles")
      .select(
        "user_id, full_name, email, phone, city, state, profile_photo_url, background_check_paid_at, background_check_verified, checkr_status, verification_level",
      )
      .not("background_check_paid_at", "is", null)
      .order("background_check_paid_at", { ascending: false })
      .limit(200);

    if (data.status === "pending") q = q.eq("checkr_status", "pending");
    else if (data.status === "passed") q = q.eq("checkr_status", "passed");
    else if (data.status === "failed") q = q.eq("checkr_status", "failed");

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { profiles: rows ?? [] };
  });

const bgDecideSchema = z.object({
  user_id: z.string().uuid(),
  status: z.enum(["pending", "passed", "failed"]),
  admin_notes: z.string().trim().max(2000).optional().nullable(),
});

export const adminSetBackgroundCheckStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => bgDecideSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    const now = new Date().toISOString();
    const patch: Record<string, any> = {
      checkr_status: data.status,
      verification_reviewed_at: now,
      verification_reviewed_by: userId,
      verification_notes: data.admin_notes ?? null,
    };

    if (data.status === "passed") {
      patch.background_check_verified = true;
      patch.verification_level = 2;
      patch.verified_status = true;
      patch.verification_status = "verified";
    } else if (data.status === "failed") {
      patch.background_check_verified = false;
      patch.verification_status = "rejected";
    } else {
      patch.verification_status = "pending_review";
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch as any)
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);

    const title =
      data.status === "passed"
        ? "Background check passed — you're Verified!"
        : data.status === "failed"
          ? "Background check did not pass"
          : "Background check is being reviewed";
    await supabaseAdmin.from("notifications").insert({
      user_id: data.user_id,
      type: `background_check_${data.status}`,
      title,
      body: data.admin_notes ?? null,
      link: "/profile/background-check",
    });

    return { ok: true };
  });