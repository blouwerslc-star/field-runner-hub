import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getModuleDetail, submitQuiz } from "@/lib/academy.functions";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Lock, Award } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/academy/$courseSlug/quiz")({
  component: QuizPage,
  head: ({ params }) => ({ meta: [{ title: `${params.courseSlug} quiz — Academy` }] }),
});

function QuizPage() {
  const { courseSlug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getModuleDetail);
  const submitFn = useServerFn(submitQuiz);

  const { data, isLoading, error } = useQuery({
    queryKey: ["academy-course", courseSlug],
    queryFn: () => fetchFn({ data: { moduleId: courseSlug } }),
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitFn>> | null>(null);

  const submitMut = useMutation({
    mutationFn: () => submitFn({ data: { moduleId: courseSlug, answers } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["academy-state"] });
      qc.invalidateQueries({ queryKey: ["academy-course", courseSlug] });
      if (r.passed) toast.success(`Passed with ${r.score}%`);
      else toast.error(`Score ${r.score}% — need ${r.pass_threshold}% to pass`);
    },
  });

  if (isLoading) {
    return (
      <DashboardShell title="Loading quiz…" subtitle="">
        <Loader2 className="size-6 animate-spin text-primary" />
      </DashboardShell>
    );
  }
  if (error || !data) {
    return (
      <DashboardShell title="Quiz not found" subtitle="">
        <Link to="/academy" className="text-primary text-sm">← Back to Academy</Link>
      </DashboardShell>
    );
  }

  const mod = data.module as any;
  const completed: string[] = data.progress?.sections_completed ?? [];
  const allSectionsDone = mod.sections.every((s: any) => completed.includes(s.id));
  const alreadyPassed = !!data.progress?.passed;
  const allAnswered = mod.quiz.every((q: any) => typeof answers[q.id] === "number");

  if (!allSectionsDone && !alreadyPassed) {
    return (
      <DashboardShell title={`${mod.title} — Quiz`} subtitle="Locked until all lessons are complete.">
        <Link to="/academy/$courseSlug" params={{ courseSlug }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> Back to course
        </Link>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-8 text-center">
          <Lock className="size-8 mx-auto text-muted-foreground mb-3" />
          <div className="text-base font-semibold mb-1">Complete all lessons first</div>
          <p className="text-sm text-muted-foreground mb-4">
            You've completed {completed.length} of {mod.sections.length} lessons.
          </p>
          <Button size="sm" asChild>
            <Link to="/academy/$courseSlug" params={{ courseSlug }}>Continue lessons</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={`${mod.title} — Knowledge Quiz`}
      subtitle={`Pass with ${data.pass_threshold}% or higher to earn certification.`}
    >
      <Link to="/academy/$courseSlug" params={{ courseSlug }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Back to course
      </Link>

      {alreadyPassed && !result && (
        <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-emerald-200">
            You already passed with {data.progress?.quiz_score}%. You may retake to improve your score.
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/academy/$courseSlug/certificate" params={{ courseSlug }}>
              <Award className="size-4 mr-1.5" /> View certificate
            </Link>
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
        <ol className="space-y-5">
          {mod.quiz.map((q: any, i: number) => {
            const perQ = result?.per_question?.find((p) => p.id === q.id);
            return (
              <li key={q.id}>
                <div className="text-sm font-medium mb-2">{i + 1}. {q.prompt}</div>
                <div className="space-y-2">
                  {q.options.map((opt: string, idx: number) => {
                    const checked = answers[q.id] === idx;
                    const showResult = !!result;
                    let cls = "border-border bg-background/40 hover:border-primary/40";
                    if (showResult && checked) cls = perQ?.correct ? "border-emerald-500/60 bg-emerald-500/10" : "border-red-500/60 bg-red-500/10";
                    else if (checked) cls = "border-primary/60 bg-primary/10";
                    return (
                      <label key={idx} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${cls}`}>
                        <input
                          type="radio"
                          name={q.id}
                          checked={checked}
                          disabled={!!result}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                          className="mt-0.5"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {data.progress?.quiz_attempts ? `Best: ${data.progress.quiz_score}% · ${data.progress.quiz_attempts} attempt(s)` : "First attempt"}
          </div>
          {result ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>
                Retake
              </Button>
              {result.passed ? (
                <Button asChild>
                  <Link to="/academy/$courseSlug/certificate" params={{ courseSlug }}>
                    <Award className="size-4 mr-1.5" /> Get certificate <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/academy/$courseSlug" params={{ courseSlug }}>Review lessons</Link>
                </Button>
              )}
            </div>
          ) : (
            <Button onClick={() => submitMut.mutate()} disabled={!allAnswered || submitMut.isPending}>
              {submitMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit quiz"}
            </Button>
          )}
        </div>

        {result && (
          <div className={`mt-5 rounded-xl border p-4 text-sm ${result.passed ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-red-500/40 bg-red-500/10 text-red-200"}`}>
            {result.passed
              ? `Passed with ${result.score}%. Certificate unlocked.`
              : `Scored ${result.score}%. You need ${result.pass_threshold}% to pass — review the lessons and try again.`}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
