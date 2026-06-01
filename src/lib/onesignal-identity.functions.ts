import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns everything needed to identify the current user in OneSignal and
 * tag them by role / status. RLS-scoped read against the user's own rows.
 */
export const getOneSignalIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "user_id, city, state, account_status, checkr_status, verification_status, notification_prefs",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const roles = (rolesRes.data ?? []).map((r) => r.role as string);
    const role = roles.includes("admin")
      ? "admin"
      : roles.includes("runner")
        ? "runner"
        : roles.includes("investor")
          ? "investor"
          : "unknown";

    // Best-effort academy status: completed if any cert exists, else in_progress
    // if any progress row, else not_started. Failures default to not_started.
    let academyStatus: "not_started" | "in_progress" | "completed" = "not_started";
    try {
      const { count: certCount } = await supabase
        .from("academy_certifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((certCount ?? 0) > 0) {
        academyStatus = "completed";
      } else {
        const { count: progCount } = await supabase
          .from("academy_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        if ((progCount ?? 0) > 0) academyStatus = "in_progress";
      }
    } catch {
      // ignore — academy_status defaults to not_started
    }

    const profile = profileRes.data;
    const prefs = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
    const pushOptIn = prefs.push === false ? false : true;

    return {
      externalId: userId,
      tags: {
        user_role: role,
        account_status: profile?.account_status ?? "active",
        academy_status: academyStatus,
        market_city: profile?.city ?? "",
        market_state: profile?.state ?? "",
        background_check_status: profile?.checkr_status ?? "not_started",
        notification_opt_in: pushOptIn ? "true" : "false",
      } satisfies Record<string, string | boolean>,
    };
  });