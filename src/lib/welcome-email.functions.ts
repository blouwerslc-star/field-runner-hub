import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmail } from "./email-sender.server";

const schema = z.object({
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().min(1).max(150),
  role: z.enum(["runner", "investor"]),
});

export const sendApplicantWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    try {
      await sendTransactionalEmail({
        templateName: "applicant_welcome",
        recipientEmail: data.email,
        templateData: {
          fullName: data.fullName,
          role: data.role,
          signupUrl: `https://reirunner.com/signup?role=${data.role}`,
        },
      });
      return { ok: true };
    } catch (e) {
      console.error("applicant welcome email failed", e);
      return { ok: false };
    }
  });