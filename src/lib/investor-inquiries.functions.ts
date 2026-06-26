import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "crypto";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  investment_range: z.string().trim().max(80).optional().default(""),
  accredited_status: z.enum(["yes", "no", "not_sure"]).optional().nullable(),
  interest_type: z.enum(["equity", "safe", "revenue_share", "strategic_partner"]).optional().nullable(),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.string().trim().max(80).optional().default("homepage"),
});

function getClientMeta() {
  try {
    const req = getRequest();
    const h = req.headers;
    const ip =
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      (h.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      null;
    const ip_hash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null;
    return { ip_hash, user_agent: h.get("user-agent")?.slice(0, 300) ?? null };
  } catch {
    return { ip_hash: null, user_agent: null };
  }
}

export const submitInvestorInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const meta = getClientMeta();
    const { error } = await supabaseAdmin.from("investor_inquiries").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      investment_range: data.investment_range || null,
      accredited_status: data.accredited_status ?? null,
      interest_type: data.interest_type ?? null,
      message: data.message || null,
      source: data.source || "homepage",
      ip_hash: meta.ip_hash,
      user_agent: meta.user_agent,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });