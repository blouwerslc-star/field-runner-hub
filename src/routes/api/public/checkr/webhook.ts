import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyCheckrSignature } from "@/lib/checkr.server";

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

async function findProfileByCandidate(candidateId: string) {
  const supabase = getSupabase() as any;
  const { data } = await supabase
    .from("profiles")
    .select("user_id, verification_level")
    .eq("checkr_candidate_id", candidateId)
    .maybeSingle();
  return data as { user_id: string; verification_level: number } | null;
}

async function applyReportResult(obj: any) {
  const candidateId = obj.candidate_id;
  const reportId = obj.id;
  const result = (obj.result || obj.status || "").toLowerCase();
  if (!candidateId) return;

  const profile = await findProfileByCandidate(candidateId);
  if (!profile) {
    console.error("Checkr report for unknown candidate", candidateId);
    return;
  }

  const supabase = getSupabase() as any;
  const isClear = result === "clear";
  const isFail = ["consider", "suspended", "dispute"].includes(result);

  const patch: Record<string, any> = {
    checkr_report_id: reportId,
    checkr_status: result || "pending",
  };

  if (isClear) {
    patch.background_check_verified = true;
    patch.email_verified = true;
    patch.phone_verified = true;
    patch.identity_verified = true;
    patch.verification_level = 4;
    patch.verified_status = true;
    patch.verification_status = "verified";
    patch.verification_reviewed_at = new Date().toISOString();
  } else if (isFail) {
    patch.verification_status = "rejected";
    patch.verification_reviewed_at = new Date().toISOString();
    patch.verification_notes = `Background check result: ${result}`;
  }

  await supabase.from("profiles").update(patch).eq("user_id", profile.user_id);

  await supabase.from("notifications").insert({
    user_id: profile.user_id,
    type: isClear ? "verification_approved" : isFail ? "verification_rejected" : "background_check_update",
    title: isClear
      ? "Background check passed — you're fully verified"
      : isFail
        ? "Background check needs review"
        : "Background check update",
    body: isClear
      ? "You now have a Level 4 Verified badge on your profile."
      : isFail
        ? `Result: ${result}. Contact support if you believe this is in error.`
        : `Current status: ${result || "pending"}`,
    link: "/profile/verification",
  });
}

export const Route = createFileRoute("/api/public/checkr/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature = request.headers.get("x-checkr-signature");
        const ok = await verifyCheckrSignature(body, signature);
        if (!ok) {
          console.error("Checkr webhook: invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }
        try {
          const event = JSON.parse(body);
          const type: string = event.type || "";
          const obj = event.data?.object ?? {};
          if (type.startsWith("report.")) {
            await applyReportResult(obj);
          } else if (type.startsWith("invitation.")) {
            // Could update checkr_status for invitation lifecycle if needed
            console.log("Checkr invitation event:", type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Checkr webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});