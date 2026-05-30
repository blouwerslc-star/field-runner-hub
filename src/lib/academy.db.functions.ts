import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Public (auth-gated) listing of DB courses with per-user progress ----------

export const listCoursesWithProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [{ data: courses }, { data: lessons }, { data: progress }, { data: certs }, { data: results }] =
      await Promise.all([
        supabaseAdmin
          .from("academy_courses")
          .select("id, title, slug, description, category, required, sort_order")
          .order("sort_order", { ascending: true }),
        supabaseAdmin.from("academy_lessons").select("id, course_id"),
        supabaseAdmin
          .from("academy_lesson_progress")
          .select("course_id, lesson_id, completed")
          .eq("user_id", userId),
        supabaseAdmin
          .from("academy_certifications")
          .select("course_id, certification_name, issued_at")
          .eq("user_id", userId),
        supabaseAdmin
          .from("academy_quiz_results")
          .select("course_id, score, passed")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false }),
      ]);

    const lessonCount = new Map<string, number>();
    for (const l of lessons ?? []) lessonCount.set((l as any).course_id, (lessonCount.get((l as any).course_id) ?? 0) + 1);

    const completedCount = new Map<string, number>();
    for (const p of progress ?? []) {
      if ((p as any).completed) {
        const k = (p as any).course_id;
        completedCount.set(k, (completedCount.get(k) ?? 0) + 1);
      }
    }

    const certByCourse = new Map<string, any>();
    for (const c of certs ?? []) certByCourse.set((c as any).course_id, c);

    const bestScoreByCourse = new Map<string, { score: number; passed: boolean }>();
    for (const r of results ?? []) {
      const k = (r as any).course_id;
      const cur = bestScoreByCourse.get(k);
      const score = (r as any).score;
      if (!cur || score > cur.score) bestScoreByCourse.set(k, { score, passed: (r as any).passed });
    }

    return {
      courses: (courses ?? []).map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        required: c.required,
        total_lessons: lessonCount.get(c.id) ?? 0,
        completed_lessons: completedCount.get(c.id) ?? 0,
        certification: certByCourse.get(c.id) ?? null,
        best_quiz: bestScoreByCourse.get(c.id) ?? null,
      })),
    };
  });

// ---------- Course detail ----------

export const getCourseDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: course } = await supabaseAdmin
      .from("academy_courses")
      .select("id, title, slug, description, category, required, sort_order")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!course) throw new Error("Course not found");
    const courseId = (course as any).id;

    const [{ data: lessons }, { data: progress }, { data: quiz }, { data: cert }, { data: results }, { data: products }] =
      await Promise.all([
        supabaseAdmin
          .from("academy_lessons")
          .select("id, title, slug, lesson_number, sort_order")
          .eq("course_id", courseId)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("academy_lesson_progress")
          .select("lesson_id, completed, completed_at")
          .eq("user_id", userId)
          .eq("course_id", courseId),
        supabaseAdmin
          .from("academy_quizzes")
          .select("id, title, passing_score")
          .eq("course_id", courseId)
          .maybeSingle(),
        supabaseAdmin
          .from("academy_certifications")
          .select("certification_name, issued_at")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .maybeSingle(),
        supabaseAdmin
          .from("academy_quiz_results")
          .select("score, passed, completed_at")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .order("completed_at", { ascending: false }),
        supabaseAdmin
          .from("academy_products" as any)
          .select("id, title, description, vendor, image_url, affiliate_url, price_display, audience, sort_order, lesson_id")
          .eq("course_id", courseId)
          .is("lesson_id", null)
          .eq("active", true)
          .order("sort_order", { ascending: true }),
      ]);

    const completedSet = new Set((progress ?? []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));
    const lessonsOut = (lessons ?? []).map((l: any) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      lesson_number: l.lesson_number,
      completed: completedSet.has(l.id),
    }));
    const allLessonsDone = lessonsOut.length > 0 && lessonsOut.every((l) => l.completed);
    const bestScore = (results ?? []).reduce((acc: number, r: any) => Math.max(acc, r.score), 0);
    const attempts = (results ?? []).length;
    const passed = (results ?? []).some((r: any) => r.passed);

    return {
      course: {
        id: courseId,
        slug: (course as any).slug,
        title: (course as any).title,
        description: (course as any).description,
        category: (course as any).category,
      },
      lessons: lessonsOut,
      quiz: quiz ? { id: (quiz as any).id, title: (quiz as any).title, passing_score: (quiz as any).passing_score } : null,
      certification: cert ?? null,
      best_score: bestScore || null,
      attempts,
      passed,
      all_lessons_done: allLessonsDone,
      products: (products ?? []) as any[],
    };
  });

// ---------- Lesson detail ----------

export const getLessonDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ courseSlug: z.string().min(1).max(80), lessonSlug: z.string().min(1).max(80) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: course } = await supabaseAdmin
      .from("academy_courses")
      .select("id, slug, title")
      .eq("slug", data.courseSlug)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const { data: lessons } = await supabaseAdmin
      .from("academy_lessons")
      .select("id, title, slug, lesson_number, video_url, content, checklist, sort_order")
      .eq("course_id", (course as any).id)
      .order("sort_order", { ascending: true });

    const idx = (lessons ?? []).findIndex((l: any) => l.slug === data.lessonSlug);
    if (idx === -1) throw new Error("Lesson not found");
    const lesson = (lessons as any[])[idx];
    const prev = idx > 0 ? (lessons as any[])[idx - 1] : null;
    const next = idx < (lessons!.length - 1) ? (lessons as any[])[idx + 1] : null;

    const { data: progress } = await supabaseAdmin
      .from("academy_lesson_progress")
      .select("lesson_id, completed")
      .eq("user_id", userId)
      .eq("course_id", (course as any).id);

    const completedSet = new Set((progress ?? []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));

    return {
      course: { slug: (course as any).slug, title: (course as any).title, total_lessons: lessons?.length ?? 0 },
      lesson: {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        lesson_number: lesson.lesson_number,
        video_url: lesson.video_url ?? null,
        content: lesson.content ?? "",
        checklist: (lesson.checklist as string[]) ?? [],
        index: idx + 1,
      },
      prev: prev ? { slug: prev.slug, title: prev.title } : null,
      next: next ? { slug: next.slug, title: next.title } : null,
      completed: completedSet.has(lesson.id),
      completed_lessons: completedSet.size,
      products: await (async () => {
        const { data: products } = await supabaseAdmin
          .from("academy_products" as any)
          .select("id, title, description, vendor, image_url, affiliate_url, price_display, audience, sort_order")
          .eq("lesson_id", lesson.id)
          .eq("active", true)
          .order("sort_order", { ascending: true });
        return (products ?? []) as any[];
      })(),
    };
  });

// ---------- Mark lesson complete ----------

export const markLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ courseSlug: z.string().min(1).max(80), lessonSlug: z.string().min(1).max(80) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: course } = await supabaseAdmin
      .from("academy_courses")
      .select("id")
      .eq("slug", data.courseSlug)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const { data: lesson } = await supabaseAdmin
      .from("academy_lessons")
      .select("id")
      .eq("course_id", (course as any).id)
      .eq("slug", data.lessonSlug)
      .maybeSingle();
    if (!lesson) throw new Error("Lesson not found");

    const now = new Date().toISOString();
    const { data: existing } = await supabaseAdmin
      .from("academy_lesson_progress")
      .select("id, completed")
      .eq("user_id", userId)
      .eq("lesson_id", (lesson as any).id)
      .maybeSingle();

    if (existing) {
      if (!(existing as any).completed) {
        await supabaseAdmin
          .from("academy_lesson_progress")
          .update({ completed: true, completed_at: now })
          .eq("id", (existing as any).id);
      }
    } else {
      await supabaseAdmin.from("academy_lesson_progress").insert({
        user_id: userId,
        course_id: (course as any).id,
        lesson_id: (lesson as any).id,
        completed: true,
        completed_at: now,
      });
    }

    return { ok: true };
  });

// ---------- Quiz: fetch (no correct answers leaked) ----------

export const getCourseQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ courseSlug: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: course } = await supabaseAdmin
      .from("academy_courses")
      .select("id, title, slug")
      .eq("slug", data.courseSlug)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const [{ data: quiz }, { data: lessons }, { data: progress }, { data: results }] = await Promise.all([
      supabaseAdmin
        .from("academy_quizzes")
        .select("id, title, passing_score")
        .eq("course_id", (course as any).id)
        .maybeSingle(),
      supabaseAdmin.from("academy_lessons").select("id").eq("course_id", (course as any).id),
      supabaseAdmin
        .from("academy_lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", userId)
        .eq("course_id", (course as any).id),
      supabaseAdmin
        .from("academy_quiz_results")
        .select("score, passed, completed_at")
        .eq("user_id", userId)
        .eq("course_id", (course as any).id)
        .order("completed_at", { ascending: false }),
    ]);

    if (!quiz) throw new Error("Quiz not configured");

    const { data: questions } = await supabaseAdmin
      .from("academy_quiz_questions")
      .select("id, question, answers, sort_order")
      .eq("quiz_id", (quiz as any).id)
      .order("sort_order", { ascending: true });

    const totalLessons = lessons?.length ?? 0;
    const completedLessons = (progress ?? []).filter((p: any) => p.completed).length;
    const allLessonsDone = totalLessons > 0 && completedLessons >= totalLessons;
    const bestScore = (results ?? []).reduce((acc: number, r: any) => Math.max(acc, r.score), 0);
    const attempts = (results ?? []).length;
    const passed = (results ?? []).some((r: any) => r.passed);

    return {
      course: { slug: (course as any).slug, title: (course as any).title },
      quiz: { id: (quiz as any).id, title: (quiz as any).title, passing_score: (quiz as any).passing_score },
      questions: (questions ?? []).map((q: any) => ({ id: q.id, question: q.question, answers: q.answers })),
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      all_lessons_done: allLessonsDone,
      best_score: bestScore || null,
      attempts,
      passed,
    };
  });

// ---------- Submit quiz ----------

export const submitCourseQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1).max(80),
        answers: z.record(z.string().uuid(), z.number().int().min(0).max(20)),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: course } = await supabaseAdmin
      .from("academy_courses")
      .select("id, title, slug")
      .eq("slug", data.courseSlug)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const { data: quiz } = await supabaseAdmin
      .from("academy_quizzes")
      .select("id, title, passing_score")
      .eq("course_id", (course as any).id)
      .maybeSingle();
    if (!quiz) throw new Error("Quiz not configured");

    const { data: questions } = await supabaseAdmin
      .from("academy_quiz_questions")
      .select("id, correct_answer")
      .eq("quiz_id", (quiz as any).id);
    if (!questions || questions.length === 0) throw new Error("Quiz has no questions");

    let correct = 0;
    const perQuestion: { id: string; correct: boolean }[] = [];
    for (const q of questions as any[]) {
      const picked = data.answers[q.id];
      const ok = typeof picked === "number" && picked === q.correct_answer;
      if (ok) correct++;
      perQuestion.push({ id: q.id, correct: ok });
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (quiz as any).passing_score;
    const now = new Date().toISOString();

    await supabaseAdmin.from("academy_quiz_results").insert({
      user_id: userId,
      course_id: (course as any).id,
      quiz_id: (quiz as any).id,
      score,
      passed,
    });

    if (passed) {
      // Insert certification (idempotent via unique(user_id, course_id))
      const { data: existingCert } = await supabaseAdmin
        .from("academy_certifications")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", (course as any).id)
        .maybeSingle();
      if (!existingCert) {
        await supabaseAdmin.from("academy_certifications").insert({
          user_id: userId,
          course_id: (course as any).id,
          certification_name: `${(course as any).title} — Certified`,
          issued_at: now,
        });
      }

      // Mirror to legacy module-level academy_progress so XP / certification math stays in sync.
      const moduleId = (course as any).slug as string;
      const { data: legacy } = await supabaseAdmin
        .from("academy_progress")
        .select("id, quiz_attempts, quiz_score, passed")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .maybeSingle();
      const bestScore = Math.max(score, (legacy as any)?.quiz_score ?? 0);
      if (legacy) {
        await supabaseAdmin
          .from("academy_progress")
          .update({
            quiz_attempts: ((legacy as any).quiz_attempts ?? 0) + 1,
            quiz_score: bestScore,
            passed: true,
            status: "completed",
            completed_at: now,
          })
          .eq("id", (legacy as any).id);
      } else {
        await supabaseAdmin.from("academy_progress").insert({
          user_id: userId,
          module_id: moduleId,
          quiz_attempts: 1,
          quiz_score: bestScore,
          passed: true,
          status: "completed",
          completed_at: now,
        });
      }
    }

    return {
      score,
      passed,
      passing_score: (quiz as any).passing_score,
      per_question: perQuestion,
    };
  });

// ---------- Certification detail ----------

export const getCourseCertification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ courseSlug: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: course } = await supabaseAdmin
      .from("academy_courses")
      .select("id, title, slug")
      .eq("slug", data.courseSlug)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const [{ data: cert }, { data: results }] = await Promise.all([
      supabaseAdmin
        .from("academy_certifications")
        .select("certification_name, issued_at, certificate_url")
        .eq("user_id", userId)
        .eq("course_id", (course as any).id)
        .maybeSingle(),
      supabaseAdmin
        .from("academy_quiz_results")
        .select("score, passed")
        .eq("user_id", userId)
        .eq("course_id", (course as any).id)
        .order("completed_at", { ascending: false }),
    ]);

    const bestScore = (results ?? []).reduce((acc: number, r: any) => Math.max(acc, r.score), 0);
    const passed = (results ?? []).some((r: any) => r.passed);

    return {
      course: { slug: (course as any).slug, title: (course as any).title },
      certification: cert ?? null,
      best_score: bestScore || null,
      passed,
    };
  });