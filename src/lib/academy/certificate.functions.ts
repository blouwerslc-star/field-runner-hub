import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ACADEMY_MODULES, getModule } from "@/lib/academy/modules";
import { getBadgeForModule } from "@/lib/academy/badges";

const moduleIds = ACADEMY_MODULES.map((m) => m.id) as [string, ...string[]];

export const generateCertificatePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ moduleId: z.enum(moduleIds) }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const mod = getModule(data.moduleId);
    if (!mod) throw new Error("Module not found");

    const { data: progress } = await supabaseAdmin
      .from("academy_progress")
      .select("passed, quiz_score, completed_at")
      .eq("user_id", userId)
      .eq("module_id", mod.id)
      .maybeSingle();

    if (!progress || !(progress as any).passed) {
      throw new Error("You haven't passed this module yet.");
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    const fullName: string = ((profile as any)?.full_name ?? (profile as any)?.email ?? "REI Runner").trim();
    const score = (progress as any).quiz_score ?? 100;
    const completedAt = (progress as any).completed_at ?? new Date().toISOString();
    const badge = getBadgeForModule(mod.id);
    const certTitle = badge?.label ?? `${mod.title} Certificate`;
    const dateLabel = new Date(completedAt).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([792, 612]); // US Letter landscape
    const { width, height } = page.getSize();
    const helv = await pdf.embedFont(StandardFonts.HelveticaBold);
    const helvReg = await pdf.embedFont(StandardFonts.Helvetica);
    const helvItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const navy = rgb(0.06, 0.09, 0.18);
    const gold = rgb(0.79, 0.66, 0.30);
    const muted = rgb(0.42, 0.46, 0.55);
    const ink = rgb(0.10, 0.12, 0.18);

    // Border
    page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: navy, borderWidth: 3 });
    page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: gold, borderWidth: 1 });

    // Header
    page.drawText("REI RUNNER ACADEMY", {
      x: width / 2 - helv.widthOfTextAtSize("REI RUNNER ACADEMY", 16) / 2,
      y: height - 80,
      size: 16, font: helv, color: navy,
    });
    page.drawText("CERTIFICATE OF COMPLETION", {
      x: width / 2 - helvReg.widthOfTextAtSize("CERTIFICATE OF COMPLETION", 11) / 2,
      y: height - 100,
      size: 11, font: helvReg, color: muted,
    });

    // Recipient
    const presented = "This certifies that";
    page.drawText(presented, {
      x: width / 2 - helvItalic.widthOfTextAtSize(presented, 14) / 2,
      y: height - 170,
      size: 14, font: helvItalic, color: muted,
    });
    const nameSize = 36;
    const nameWidth = helv.widthOfTextAtSize(fullName, nameSize);
    page.drawText(fullName, {
      x: width / 2 - nameWidth / 2,
      y: height - 220,
      size: nameSize, font: helv, color: ink,
    });
    // Underline under name
    page.drawLine({
      start: { x: width / 2 - Math.max(nameWidth, 220) / 2 - 20, y: height - 232 },
      end: { x: width / 2 + Math.max(nameWidth, 220) / 2 + 20, y: height - 232 },
      thickness: 1, color: gold,
    });

    // Has earned
    const has = "has successfully completed the requirements for";
    page.drawText(has, {
      x: width / 2 - helvReg.widthOfTextAtSize(has, 13) / 2,
      y: height - 270,
      size: 13, font: helvReg, color: muted,
    });
    const titleSize = 22;
    page.drawText(certTitle, {
      x: width / 2 - helv.widthOfTextAtSize(certTitle, titleSize) / 2,
      y: height - 305,
      size: titleSize, font: helv, color: navy,
    });
    const moduleSub = `Module: ${mod.title}`;
    page.drawText(moduleSub, {
      x: width / 2 - helvReg.widthOfTextAtSize(moduleSub, 11) / 2,
      y: height - 325,
      size: 11, font: helvReg, color: muted,
    });

    // Score + date
    const scoreLine = `Final quiz score: ${score}%`;
    page.drawText(scoreLine, {
      x: width / 2 - helvReg.widthOfTextAtSize(scoreLine, 12) / 2,
      y: height - 360,
      size: 12, font: helvReg, color: ink,
    });

    // Signatures
    const sigY = 120;
    page.drawLine({ start: { x: 110, y: sigY }, end: { x: 310, y: sigY }, thickness: 0.8, color: ink });
    page.drawText("Issued on", { x: 110, y: sigY - 16, size: 9, font: helvReg, color: muted });
    page.drawText(dateLabel, { x: 110, y: sigY - 32, size: 11, font: helv, color: ink });

    page.drawLine({ start: { x: width - 310, y: sigY }, end: { x: width - 110, y: sigY }, thickness: 0.8, color: ink });
    page.drawText("Brian Louwers, Founder", { x: width - 310, y: sigY - 16, size: 9, font: helvReg, color: muted });
    page.drawText("REI Runner", { x: width - 310, y: sigY - 32, size: 11, font: helv, color: ink });

    // Footer
    const cert_id = `Certificate ID: ${mod.id.toUpperCase()}-${userId.slice(0, 8).toUpperCase()}`;
    page.drawText(cert_id, {
      x: width / 2 - helvReg.widthOfTextAtSize(cert_id, 8) / 2,
      y: 56,
      size: 8, font: helvReg, color: muted,
    });

    const bytes = await pdf.save();
    // Convert to base64 for safe transport over server-fn boundary
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    const filename = `rei-runner-${mod.id}-certificate.pdf`;
    return { base64, filename, contentType: "application/pdf" };
  });