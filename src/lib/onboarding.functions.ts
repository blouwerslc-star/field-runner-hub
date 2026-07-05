import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OnboardingStepKey =
  | "basics"
  | "about"
  | "identity"
  | "background"
  | "payouts";

export type OnboardingStepStatus =
  | "complete"
  | "in_review"
  | "needs_info"
  | "action_required"
  | "locked";

export interface OnboardingStep {
  key: OnboardingStepKey;
  title: string;
  description: string;
  status: OnboardingStepStatus;
  detail?: string | null;
}

export interface RunnerOnboardingStatus {
  steps: OnboardingStep[];
  currentStep: OnboardingStepKey | "done";
  percentComplete: number;
  isRunner: boolean;
}

export const getRunnerOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RunnerOnboardingStatus> => {
    const { supabase, userId } = context;

    const [{ data: roles }, { data: profile }, { data: idDocs }, { data: bgSub }, { data: rp }] =
      await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("profiles")
          .select(
            "full_name, phone, city, state, profile_photo_url, bio, headline, services_offered, service_radius, transportation_available, verification_level, verification_status, background_check_verified, background_check_paid_at",
          )
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("runner_id_documents").select("kind, status").eq("user_id", userId),
        supabase
          .from("background_check_submissions")
          .select("status, needs_info_reason, admin_notes")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("runner_profiles")
          .select("stripe_account_id, payouts_enabled, onboarding_completed")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    const isRunner = (roles ?? []).some((r: any) => r.role === "runner");
    const p = (profile ?? {}) as any;

    // Step 1 — basics
    const basicsComplete = !!(p.full_name && p.phone && p.city && p.state && p.profile_photo_url);
    const basicsMissing: string[] = [];
    if (!p.full_name) basicsMissing.push("full name");
    if (!p.phone) basicsMissing.push("phone");
    if (!p.city || !p.state) basicsMissing.push("city & state");
    if (!p.profile_photo_url) basicsMissing.push("profile photo");

    // Step 2 — about
    const aboutComplete = !!(p.bio && (p.services_offered?.length ?? 0) > 0);
    const aboutMissing: string[] = [];
    if (!p.bio) aboutMissing.push("short bio");
    if (!(p.services_offered?.length ?? 0)) aboutMissing.push("services you offer");

    // Step 3 — identity
    const kinds = new Set((idDocs ?? []).map((d: any) => d.kind));
    const anyRejected = (idDocs ?? []).some((d: any) => d.status === "rejected");
    const uploaded = kinds.size;
    const level = (p.verification_level ?? 0) as number;
    const vStatus = (p.verification_status as string | null) ?? null;
    let identity: OnboardingStep;
    if (level >= 1) {
      identity = { key: "identity", title: "Verify identity", description: "Government-issued ID + selfie.", status: "complete", detail: "ID verified" };
    } else if (anyRejected) {
      identity = { key: "identity", title: "Verify identity", description: "One of your documents needs to be re-uploaded.", status: "needs_info", detail: "Re-upload required" };
    } else if (vStatus === "pending_review" && uploaded >= 3) {
      identity = { key: "identity", title: "Verify identity", description: "Our team is reviewing your ID (usually within 1 business day).", status: "in_review", detail: "In review" };
    } else {
      identity = {
        key: "identity",
        title: "Verify identity",
        description: "Upload front of ID, back of ID, and a selfie holding it.",
        status: "action_required",
        detail: `${uploaded}/3 uploaded`,
      };
    }

    // Step 4 — background check
    const bgVerified = !!p.background_check_verified;
    const bgPaid = !!p.background_check_paid_at;
    const bgStatus = (bgSub as any)?.status as string | null;
    let background: OnboardingStep;
    if (bgVerified || bgStatus === "passed") {
      background = { key: "background", title: "Background check", description: "Unlocks interior-access tasks (lockbox, walkthroughs).", status: "complete", detail: "Passed" };
    } else if (bgStatus === "failed") {
      background = { key: "background", title: "Background check", description: (bgSub as any)?.admin_notes ?? "Did not pass.", status: "needs_info", detail: "Not approved" };
    } else if (bgStatus === "needs_info") {
      background = { key: "background", title: "Background check", description: (bgSub as any)?.needs_info_reason ?? "We need more information.", status: "needs_info", detail: "More info needed" };
    } else if (bgStatus === "submitted" || bgStatus === "in_review") {
      background = { key: "background", title: "Background check", description: "In review — typically 1–3 business days.", status: "in_review", detail: "In review" };
    } else if (bgPaid) {
      background = { key: "background", title: "Background check", description: "You paid — fill out the secure intake form.", status: "action_required", detail: "Intake form pending" };
    } else {
      background = { key: "background", title: "Background check", description: "One-time $13.99 — unlocks interior-access tasks.", status: "action_required", detail: "Optional but recommended" };
    }

    // Step 5 — payouts
    const payoutsEnabled = !!(rp as any)?.payouts_enabled;
    const onboardingStarted = !!(rp as any)?.stripe_account_id;
    const payouts: OnboardingStep = payoutsEnabled
      ? { key: "payouts", title: "Set up payouts", description: "Direct deposit is active.", status: "complete", detail: "Ready" }
      : {
          key: "payouts",
          title: "Set up payouts",
          description: "Connect your bank so we can pay you.",
          status: "action_required",
          detail: onboardingStarted ? "Finish Stripe onboarding" : "Not started",
        };

    const steps: OnboardingStep[] = [
      {
        key: "basics",
        title: "Your basics",
        description: "Name, phone, city, profile photo.",
        status: basicsComplete ? "complete" : "action_required",
        detail: basicsComplete ? "Complete" : `Missing: ${basicsMissing.join(", ")}`,
      },
      {
        key: "about",
        title: "About you",
        description: "Short bio and services you offer.",
        status: aboutComplete ? "complete" : "action_required",
        detail: aboutComplete ? "Complete" : `Missing: ${aboutMissing.join(", ")}`,
      },
      identity,
      background,
      payouts,
    ];

    // "Current step" = first non-complete, non-in-review step.
    // In-review steps don't block the runner from moving on.
    const current = steps.find((s) => s.status === "action_required" || s.status === "needs_info");
    const completeCount = steps.filter((s) => s.status === "complete").length;
    const currentStep: OnboardingStepKey | "done" = current ? current.key : "done";
    const percentComplete = Math.round((completeCount / steps.length) * 100);

    return { steps, currentStep, percentComplete, isRunner };
  });