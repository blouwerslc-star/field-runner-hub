import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ACADEMY_MODULES, getModule, PASS_THRESHOLD } from "@/lib/academy/modules";
import { earnedSkillBadges } from "@/lib/academy/badges";
import { computeXp, levelFromXp } from "@/lib/academy/xp";

const moduleIds = ACADEMY_MODULES.map((m) => m.id) as [string, ...string[]];

const LEVEL_LABELS: Record<number, string> = {
  0: "Not Certified",
  1: "Certified Runner",
  2: "Verified Runner",
  3: "Elite Runner",
};

async function ensureRunnerProfile(userId: string) {
  const { data: existing } = await supabaseAdmin
    .from("runner_profiles")
    .select("user_id, certification_level, certified_at, verified_at, elite_at, certification_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing as any;
  const { data, error } = await supabaseAdmin
    .from("runner_profiles")
    .insert({ user_id: userId })
    .select("user_id, certification_level, certified_at, verified_at, elite_at, certification_status")
    .single();
  if (error) throw new Error(error.message);
  return data as any;
}

async function recomputeCertification(userId: string) {
  // Gather inputs
  const [{ data: progress }, { data: profile }, { data: runner }, tasksRes] = await Promise.all([
    supabaseAdmin.from("academy_progress").select("module_id, passed").eq("user_id", userId),
    supabaseAdmin
      .from("profiles")
      .select("identity_verified, background_check_verified, average_rating, completed_tasks_count")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("runner_profiles")
      .select("certification_level, certified_at, verified_at, elite_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("tasks")
      .select("id", { head: true, count: "exact" })
      .eq("runner_id", userId)
      .in("status", ["approved", "paid", "completed"]),
  ]);

  const passedSet = new Set((progress ?? []).filter((p: any) => p.passed).map((p: any) => p.module_id));
  const allPassed = ACADEMY_MODULES.every((m) => passedSet.has(m.id));

  const idVerified = !!(profile as any)?.identity_verified;
  const bgVerified = !!(profile as any)?.background_check_verified;
  const tasksCount = (tasksRes as any)?.count ?? (profile as any)?.completed_tasks_count ?? 0;
  const rating = Number((profile as any)?.average_rating ?? 0);

  let level = 0;
  if (allPassed) level = 1;
  if (level >= 1 && idVerified && bgVerified) level = 2;
  if (level >= 2 && tasksCount >= 25 && rating >= 4.7) level = 3;

  const now = new Date().toISOString();
  const patch: any = {
    certification_level: level,
    certification_status: level === 0 ? "in_progress" : LEVEL_LABELS[level].toLowerCase().replace(/\s+/g, "_"),
    updated_at: now,
  };
  if (level >= 1 && !(runner as any)?.certified_at) patch.certified_at = now;
  if (level >= 2 && !(runner as any)?.verified_at) patch.verified_at = now;
  if (level >= 3 && !(runner as any)?.elite_at) patch.elite_at = now;

  const { error } = await supabaseAdmin
    .from("runner_profiles")
    .update(patch)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  return { level, allPassed, idVerified, bgVerified, tasksCount, rating };
}

export const getAcademyState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await ensureRunnerProfile(userId);
    const [{ data: progress }, { data: runner }, { data: profile }] = await Promise.all([
      supabaseAdmin
        .from("academy_progress")
        .select("module_id, status, sections_completed, quiz_score, quiz_attempts, passed, completed_at")
        .eq("user_id", userId),
      supabaseAdmin
        .from("runner_profiles")
        .select("certification_level, certification_status, certified_at, verified_at, elite_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("identity_verified, background_check_verified, average_rating, completed_tasks_count")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const byModule = new Map<string, any>();
    for (const row of progress ?? []) byModule.set((row as any).module_id, row);

    const modules = ACADEMY_MODULES.map((m) => {
        const p = byModule.get(m.id);
        return {
          id: m.id,
          order: m.order,
          title: m.title,
          summary: m.summary,
          duration: m.duration,
          section_count: m.sections.length,
          quiz_question_count: m.quiz.length,
          sections_completed: (p?.sections_completed as string[]) ?? [],
          quiz_score: p?.quiz_score ?? null,
          quiz_attempts: p?.quiz_attempts ?? 0,
          passed: !!p?.passed,
          completed_at: p?.completed_at ?? null,
        };
      });

    const passedIds = modules.filter((m) => m.passed).map((m) => m.id);
    const sectionsCompletedTotal = modules.reduce((acc, m) => acc + m.sections_completed.length, 0);
    const xp = computeXp({ sectionsCompleted: sectionsCompletedTotal, modulesPassed: passedIds.length });
    const lvl = levelFromXp(xp);
    const nextModule = modules.find((m) => !m.passed) ?? null;
    const earned = earnedSkillBadges(passedIds).map((b) => ({ id: b.id, moduleId: b.moduleId, label: b.label }));

    return {
      modules,
      runner: (runner as any) ?? { certification_level: 0, certification_status: "none" },
      profile: (profile as any) ?? {},
      pass_threshold: PASS_THRESHOLD,
      xp,
      level: lvl.level,
      level_progress: lvl,
      next_module: nextModule ? { id: nextModule.id, title: nextModule.title } : null,
      earned_badges: earned,
    };
  });

export const getModuleDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ moduleId: z.enum(moduleIds) }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const mod = getModule(data.moduleId);
    if (!mod) throw new Error("Module not found");
    const { data: p } = await supabaseAdmin
      .from("academy_progress")
      .select("status, sections_completed, quiz_score, quiz_attempts, passed, completed_at")
      .eq("user_id", userId)
      .eq("module_id", mod.id)
      .maybeSingle();
    // Strip correct answers before returning quiz to the client.
    const quiz = mod.quiz.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options }));
    return {
      module: { ...mod, quiz },
      progress: (p as any) ?? null,
      pass_threshold: PASS_THRESHOLD,
    };
  });

export const markSectionComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ moduleId: z.enum(moduleIds), sectionId: z.string().min(1).max(80) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const mod = getModule(data.moduleId);
    if (!mod) throw new Error("Module not found");
    if (!mod.sections.find((s) => s.id === data.sectionId)) throw new Error("Section not found");
    const { data: existing } = await supabaseAdmin
      .from("academy_progress")
      .select("id, sections_completed")
      .eq("user_id", userId)
      .eq("module_id", mod.id)
      .maybeSingle();
    const current: string[] = ((existing as any)?.sections_completed as string[]) ?? [];
    const next = current.includes(data.sectionId) ? current : [...current, data.sectionId];
    if (existing) {
      await supabaseAdmin
        .from("academy_progress")
        .update({ sections_completed: next, status: "in_progress" })
        .eq("id", (existing as any).id);
    } else {
      await supabaseAdmin.from("academy_progress").insert({
        user_id: userId,
        module_id: mod.id,
        sections_completed: next,
        status: "in_progress",
      });
    }
    return { ok: true, sections_completed: next };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        moduleId: z.enum(moduleIds),
        answers: z.record(z.string().min(1).max(40), z.number().int().min(0).max(20)),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const mod = getModule(data.moduleId);
    if (!mod) throw new Error("Module not found");

    let correct = 0;
    const perQuestion: { id: string; correct: boolean }[] = [];
    for (const q of mod.quiz) {
      const picked = data.answers[q.id];
      const ok = typeof picked === "number" && picked === q.correct;
      if (ok) correct++;
      perQuestion.push({ id: q.id, correct: ok });
    }
    const score = Math.round((correct / mod.quiz.length) * 100);
    const passed = score >= PASS_THRESHOLD;

    const { data: existing } = await supabaseAdmin
      .from("academy_progress")
      .select("id, quiz_attempts, quiz_score, passed, sections_completed")
      .eq("user_id", userId)
      .eq("module_id", mod.id)
      .maybeSingle();

    const now = new Date().toISOString();
    const bestScore = Math.max(score, (existing as any)?.quiz_score ?? 0);
    const wasPassed = !!(existing as any)?.passed;
    const nowPassed = wasPassed || passed;

    if (existing) {
      await supabaseAdmin
        .from("academy_progress")
        .update({
          quiz_attempts: ((existing as any).quiz_attempts ?? 0) + 1,
          quiz_score: bestScore,
          passed: nowPassed,
          status: nowPassed ? "completed" : "in_progress",
          completed_at: nowPassed ? ((existing as any).completed_at ?? now) : null,
        })
        .eq("id", (existing as any).id);
    } else {
      await supabaseAdmin.from("academy_progress").insert({
        user_id: userId,
        module_id: mod.id,
        quiz_attempts: 1,
        quiz_score: bestScore,
        passed: nowPassed,
        status: nowPassed ? "completed" : "in_progress",
        completed_at: nowPassed ? now : null,
      });
    }

    const cert = await recomputeCertification(userId);

    return {
      score,
      best_score: bestScore,
      passed,
      pass_threshold: PASS_THRESHOLD,
      per_question: perQuestion,
      certification_level: cert.level,
    };
  });

export const recomputeMyCertification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return recomputeCertification(context.userId);
  });

export const getLessonContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        courseSlug: z.enum(moduleIds),
        lessonSlug: z.string().min(1).max(80),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const mod = getModule(data.courseSlug);
    if (!mod) throw new Error("Course not found");
    const idx = mod.sections.findIndex((s) => s.id === data.lessonSlug);
    if (idx === -1) throw new Error("Lesson not found");
    const lesson = mod.sections[idx];
    const prev = idx > 0 ? mod.sections[idx - 1] : null;
    const next = idx < mod.sections.length - 1 ? mod.sections[idx + 1] : null;

    const { data: p } = await supabaseAdmin
      .from("academy_progress")
      .select("sections_completed, passed, quiz_score")
      .eq("user_id", userId)
      .eq("module_id", mod.id)
      .maybeSingle();

    const sectionsCompleted: string[] = (p as any)?.sections_completed ?? [];
    const allSectionsDone = mod.sections.every((s) => sectionsCompleted.includes(s.id));

    return {
      course: {
        slug: mod.id,
        title: mod.title,
        order: mod.order,
        total_lessons: mod.sections.length,
      },
      lesson: {
        slug: lesson.id,
        title: lesson.title,
        body: lesson.body,
        videoUrl: lesson.videoUrl ?? null,
        pdfUrl: lesson.pdfUrl ?? null,
        index: idx + 1,
      },
      prev: prev ? { slug: prev.id, title: prev.title } : null,
      next: next ? { slug: next.id, title: next.title } : null,
      completed: sectionsCompleted.includes(lesson.id),
      sections_completed: sectionsCompleted,
      all_sections_done: allSectionsDone,
      passed: !!(p as any)?.passed,
      quiz_score: (p as any)?.quiz_score ?? null,
    };
  });