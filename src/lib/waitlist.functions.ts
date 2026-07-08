import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { sendTransactionalEmail } from "./email-sender.server";

export const runnerWaitlistSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(50).optional().default(""),
  market: z.string().trim().max(150).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  source: z.string().trim().max(60).optional().default("waitlist_page"),
  // honeypot — must remain empty
  website: z.string().max(0).optional().default(""),
});

export const joinRunnerWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => runnerWaitlistSchema.parse(input))
  .handler(async ({ data }) => {
    const { website: _hp, ...row } = data;

    const { error } = await supabaseAdmin
      .from("runner_waitlist")
      .insert({
        full_name: row.full_name,
        email: row.email,
        phone: row.phone || null,
        city: row.city || null,
        state: row.state || null,
        market: row.market || null,
        notes: row.notes || null,
        source: row.source || "waitlist_page",
      });

    if (error) {
      // Duplicate email → treat as soft success so the UX doesn't punish repeats.
      const isDuplicate =
        error.code === "23505" ||
        /duplicate key|unique/i.test(error.message ?? "");
      if (!isDuplicate) {
        console.error("runner_waitlist insert failed", error);
        throw new Error("Could not add you to the waitlist. Please try again.");
      }
    }

    // Confirmation email to the applicant — reuse the applicant_welcome template.
    sendTransactionalEmail({
      templateName: "applicant_welcome",
      recipientEmail: row.email,
      templateData: {
        fullName: row.full_name,
        role: "runner",
        signupUrl: "https://reirunner.com/waitlist?submitted=1",
      },
    }).catch((e) => console.error("waitlist welcome email failed", e));

    return { ok: true };
  });