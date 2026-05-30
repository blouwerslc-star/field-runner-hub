import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getModuleDetail } from "@/lib/academy.functions";
import {
  Loader2, ArrowLeft, ArrowRight, CheckCircle2, Circle, Lock, BookOpen,
  Award, ClipboardList, PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/academy/$courseSlug")({
  component: CoursePage,
  head: ({ params }) => ({ meta: [{ title: `${params.courseSlug} — REI Runner Academy` }] }),
});

function CoursePage() {
  const { courseSlug } = Route.useParams();
  const fetchDetail = useServerFn(getModuleDetail);
  const { data, isLoading, error } = useQuery({
    queryKey: ["academy-course", courseSlug],
    queryFn: () => fetchDetail({ data: { moduleId: courseSlug } }),
  });

  if (isLoading) {
    return (
      <DashboardShell title="Loading course…" subtitle="">
        <Loader2 className="size-6 animate-spin text-primary" />
      </DashboardShell>
    );
  }
  if (error || !data) {
    return (
      <DashboardShell title="Course not found" subtitle="">
        <Link to="/academy" className="text-primary text-sm">← Back to Academy</Link>
      </DashboardShell>
    );
  }

  const mod = data.module as any;
  const completed: string[] = data.progress?.sections_completed ?? [];
  const completedCount = completed.length;
  const total = mod.sections.length;
  const progressPct = Math.round((completedCount / total) * 100);
  const allLessonsDone = completedCount === total;
  const passed = !!data.progress?.passed;
  const firstIncomplete = mod.sections.find((s: any) => !completed.includes(s.id)) ?? mod.sections[0];

  return (
    <DashboardShell title={mod.title} subtitle={mod.summary}>
      <Link to="/academy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Back to Academy
      </Link>

      {/* Course header */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Course M{mod.order}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {total} lessons · {mod.quiz.length}-question quiz · {mod.duration}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="text-lg font-semibold">{completedCount}/{total} lessons · {progressPct}%</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/academy/$courseSlug/$lessonSlug"
            params={{ courseSlug, lessonSlug: firstIncomplete.id }}
          >
            <Button size="sm">
              <PlayCircle className="size-4 mr-1.5" />
              {completedCount === 0 ? "Start course" : completedCount === total ? "Review lessons" : "Continue course"}
            </Button>
          </Link>
          <Link to="/academy/$courseSlug/quiz" params={{ courseSlug }}>
            <Button size="sm" variant="outline" disabled={!allLessonsDone && !passed}>
              <ClipboardList className="size-4 mr-1.5" />
              {passed ? `Quiz passed (${data.progress?.quiz_score}%)` : "Take quiz"}
              {!allLessonsDone && !passed && <Lock className="size-3 ml-1.5" />}
            </Button>
          </Link>
          {passed && (
            <Link to="/academy/$courseSlug/certificate" params={{ courseSlug }}>
              <Button size="sm" variant="outline">
                <Award className="size-4 mr-1.5" /> Certificate
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Lesson list */}
      <h2 className="text-lg font-semibold mb-3">Lessons</h2>
      <ol className="space-y-2 mb-8">
        {mod.sections.map((s: any, i: number) => {
          const done = completed.includes(s.id);
          return (
            <li key={s.id}>
              <Link
                to="/academy/$courseSlug/$lessonSlug"
                params={{ courseSlug, lessonSlug: s.id }}
                className="block rounded-xl border border-border bg-card/60 backdrop-blur p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`size-9 rounded-full grid place-items-center shrink-0 ${done ? "bg-emerald-500/15 text-emerald-300" : "bg-primary/10 text-primary"}`}>
                    {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono text-muted-foreground">Lesson {i + 1}</div>
                    <div className="text-sm font-semibold">{s.title}</div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          );
        })}
        {/* Quiz row */}
        <li>
          <Link
            to="/academy/$courseSlug/quiz"
            params={{ courseSlug }}
            className={`block rounded-xl border p-4 transition-colors ${
              allLessonsDone || passed
                ? "border-border bg-card/60 hover:border-primary/50"
                : "border-border bg-card/30 opacity-60 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full grid place-items-center shrink-0 bg-amber-500/15 text-amber-300">
                {passed ? <CheckCircle2 className="size-4" /> : <ClipboardList className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-mono text-muted-foreground">Final assessment</div>
                <div className="text-sm font-semibold">
                  Knowledge quiz {passed && `· Passed with ${data.progress?.quiz_score}%`}
                </div>
              </div>
              {!allLessonsDone && !passed ? <Lock className="size-4 text-muted-foreground" /> : <ArrowRight className="size-4 text-muted-foreground" />}
            </div>
          </Link>
        </li>
        {/* Certificate row */}
        <li>
          <Link
            to="/academy/$courseSlug/certificate"
            params={{ courseSlug }}
            className={`block rounded-xl border p-4 transition-colors ${
              passed
                ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                : "border-border bg-card/30 opacity-60 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full grid place-items-center shrink-0 bg-emerald-500/15 text-emerald-300">
                <Award className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-mono text-muted-foreground">Reward</div>
                <div className="text-sm font-semibold">Certificate of completion</div>
              </div>
              {passed ? <ArrowRight className="size-4 text-muted-foreground" /> : <Lock className="size-4 text-muted-foreground" />}
            </div>
          </Link>
        </li>
      </ol>
    </DashboardShell>
  );
}
