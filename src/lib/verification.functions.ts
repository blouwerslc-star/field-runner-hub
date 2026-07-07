import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

    // Idempotent: if an open request already exists, return it instead of throwing.
    const { data: existing } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending_payment", "pending_review"])
      .order("created_at", { ascending: false })
      .limit(1);
    if ((existing ?? []).length) {
      return { request: existing![0], alreadyPending: true as const };
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
  status: z.enum(["awaiting_info", "submitted", "in_review", "needs_info", "passed", "failed", "all"]).default("submitted"),
});

export const adminListBackgroundChecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => bgListSchema.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    // "awaiting_info" = paid but no submission yet
    if (data.status === "awaiting_info") {
      const { data: subs } = await supabaseAdmin
        .from("background_check_submissions")
        .select("user_id");
      const submittedIds = new Set((subs ?? []).map((s: any) => s.user_id));
      const { data: paid } = await supabaseAdmin
        .from("profiles")
        .select(
          "user_id, full_name, email, phone, city, state, profile_photo_url, background_check_paid_at, background_check_verified",
        )
        .not("background_check_paid_at", "is", null)
        .eq("background_check_verified", false)
        .order("background_check_paid_at", { ascending: false })
        .limit(200);
      const awaiting = (paid ?? []).filter((p: any) => !submittedIds.has(p.user_id));
      return {
        submissions: awaiting.map((p: any) => ({
          id: null,
          user_id: p.user_id,
          status: "awaiting_info",
          submitted_at: null,
          legal_first_name: p.full_name?.split(" ")[0] ?? null,
          legal_last_name: p.full_name?.split(" ").slice(1).join(" ") || null,
          current_city: p.city,
          current_state: p.state,
          profile: p,
          background_check_paid_at: p.background_check_paid_at,
        })),
      };
    }

    let q = supabaseAdmin
      .from("background_check_submissions")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    const { data: profiles } = userIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select(
            "user_id, full_name, email, phone, city, state, profile_photo_url, background_check_paid_at, background_check_verified",
          )
          .in("user_id", userIds)
      : { data: [] as any[] };
    const byUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    return {
      submissions: (rows ?? []).map((r: any) => ({
        ...r,
        ssn_full_encrypted: r.ssn_full_encrypted ? true : false, // boolean: was encrypted SSN stored?
        profile: byUser.get(r.user_id) ?? null,
      })),
    };
  });

const bgDecideSchema = z.object({
  user_id: z.string().uuid(),
  status: z.enum(["in_review", "needs_info", "passed", "failed"]),
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

    // Update submission row first
    const { data: sub } = await supabaseAdmin
      .from("background_check_submissions")
      .select("id")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (sub) {
      await supabaseAdmin
        .from("background_check_submissions")
        .update({
          status: data.status,
          admin_notes: data.admin_notes ?? null,
          needs_info_reason: data.status === "needs_info" ? data.admin_notes ?? null : null,
          reviewed_at: now,
          reviewed_by: userId,
        })
        .eq("id", sub.id);
      await supabaseAdmin.from("background_check_audit").insert({
        submission_id: sub.id,
        subject_user_id: data.user_id,
        actor_id: userId,
        action: data.status === "needs_info" ? "request_more_info" : "status_change",
        metadata: { to: data.status, note: data.admin_notes ?? null },
      });
    }

    const patch: Record<string, any> = {
      checkr_status: data.status === "in_review" ? "pending" : data.status,
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
          : data.status === "needs_info"
            ? "We need more info for your background check"
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

// =====================================================================
// Admin: full submission detail (logs a 'view' audit row)
// =====================================================================

export const adminGetBackgroundCheckSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ submission_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    const { data: row, error } = await supabaseAdmin
      .from("background_check_submissions")
      .select("*")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Submission not found");

    // Signed URLs for ID photos
    const sign = async (p: string | null) => {
      if (!p) return null;
      const { data: s } = await supabaseAdmin.storage.from("runner-ids").createSignedUrl(p, 300);
      return s?.signedUrl ?? null;
    };
    const idFrontUrl = await sign(row.id_front_path);
    const idBackUrl = await sign(row.id_back_path);
    const selfieUrl = await sign(row.selfie_path);

    await supabaseAdmin.from("background_check_audit").insert({
      submission_id: row.id,
      subject_user_id: row.user_id,
      actor_id: userId,
      action: "view",
      metadata: {},
    });

    const { ssn_full_encrypted: _omit, ...safe } = row as any;
    return {
      submission: { ...safe, has_full_ssn: !!_omit },
      idFrontUrl,
      idBackUrl,
      selfieUrl,
    };
  });

export const adminRevealSsn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ submission_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    const key = process.env.BG_CHECK_ENCRYPTION_KEY;
    if (!key) throw new Error("Encryption key is not configured");

    const { data: row } = await supabaseAdmin
      .from("background_check_submissions")
      .select("id, user_id, ssn_full_encrypted")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (!row) throw new Error("Submission not found");
    if (!row.ssn_full_encrypted) return { ssn: null };

    const { data: ssn, error } = await supabaseAdmin.rpc("bg_decrypt_ssn", {
      _submission_id: row.id,
      _key: key,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("background_check_audit").insert({
      submission_id: row.id,
      subject_user_id: row.user_id,
      actor_id: userId,
      action: "reveal_ssn",
      metadata: {},
    });
    return { ssn: ssn as string | null };
  });

// =====================================================================
// Admin: nudge a runner who paid but hasn't filled the intake form
// =====================================================================

const nudgeSchema = z.object({
  user_id: z.string().uuid(),
  message: z.string().trim().max(500).optional().nullable(),
});

export const adminNudgeBackgroundCheckIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => nudgeSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, email, background_check_paid_at, background_check_verified")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (!profile) throw new Error("Runner not found");
    if (!profile.background_check_paid_at) throw new Error("Runner hasn't paid yet");
    if (profile.background_check_verified) throw new Error("Runner is already verified");

    const body =
      data.message?.trim() ||
      "You've already paid for your background check — please finish the secure intake form (takes ~5 min) so we can run your check and unlock your Verified badge.";

    await supabaseAdmin.from("notifications").insert({
      user_id: data.user_id,
      type: "background_check_intake_reminder",
      title: "Finish your background check intake form",
      body,
      link: "/profile/background-check",
    });

    return { ok: true, emailedTo: profile.email ?? null };
  });

// =====================================================================
// Admin: cancel a paid-but-abandoned background check
// (Clears the paid flag so the card falls off the "Awaiting info" list.
//  Does NOT issue a Stripe refund — do that manually in the dashboard.)
// =====================================================================

const cancelSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const adminCancelBackgroundCheckPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => cancelSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, background_check_paid_at, background_check_verified")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (!profile) throw new Error("Runner not found");
    if (profile.background_check_verified) throw new Error("Cannot cancel — runner is already verified");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ background_check_paid_at: null, checkr_status: null })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("background_check_audit").insert({
      submission_id: null,
      subject_user_id: data.user_id,
      actor_id: userId,
      action: "status_change",
      metadata: {
        event: "admin_cancel_payment",
        reason: data.reason ?? null,
        prior_paid_at: profile.background_check_paid_at,
      },
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: data.user_id,
      type: "background_check_cancelled",
      title: "Background check request cancelled",
      body:
        data.reason?.trim() ||
        "Your background check request was cancelled by our team. Contact support if you'd like to restart it.",
      link: "/help",
    });

    return { ok: true };
  });