import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getModuleDetail, markSectionComplete, submitQuiz } from "@/lib/academy.functions";
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight, FileText, Video, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/academy/$moduleId")({
  component: ModulePage,
  head: () => ({ meta: [{ title: "Academy module — REI Runner" }] }),
});

function ModulePage() {
  const { moduleId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getModuleDetail);
  const completeFn = useServerFn(markSectionComplete);
  const submitFn = useServerFn(submitQuiz);

  const { data, isLoading } = useQuery({
    queryKey: ["academy-module", moduleId],
    queryFn: () => fetchDetail({ data: { moduleId } }),
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitFn>> | null>(null);

  const completeMut = useMutation({
    mutationFn: (sectionId: string) => completeFn({ data: { moduleId, sectionId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-module", moduleId] }),
  });

  const submitMut = useMutation({
    mutationFn: () => submitFn({ data: { moduleId, answers } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["academy-state"] });
      qc.invalidateQueries({ queryKey: ["academy-module", moduleId] });
      if (r.passed) toast.success(`Passed with ${r.score}%`);
      else toast.error(`Score ${r.score}% — need ${r.pass_threshold}% to pass`);
    },
  });

  if (isLoading || !data) {
    return (
      <DashboardShell title="Loading module…" subtitle="">
        <Loader2 className="size-6 animate-spin text-primary" />
      </DashboardShell>
    );
  }

  const mod = data.module as any;
  const done: string[] = data.progress?.sections_completed ?? [];
  const allSectionsDone = mod.sections.every((s: any) => done.includes(s.id));
  const allAnswered = mod.quiz.every((q: any) => typeof answers[q.id] === "number");

  return (
    <DashboardShell title={mod.title} subtitle={mod.summary}>
      <Link to="/academy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Back to Academy
      </Link>

      {/* LESSONS */}
      <div className="space-y-3 mb-8">
        {mod.sections.map((s: any, idx: number) => {
          const isDone = done.includes(s.id);
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
              <div className="flex items-start gap-3">
                <div className={`size-8 rounded-full grid place-items-center text-xs font-mono shrink-0 ${isDone ? "bg-emerald-500/20 text-emerald-300" : "bg-primary/10 text-primary"}`}>
                  {isDone ? <CheckCircle2 className="size-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{s.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {s.videoUrl && (
                      <a href={s.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                        <Video className="size-3.5" /> Watch lesson video
                      </a>
                    )}
                    {s.pdfUrl && (
                      <a href={s.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                        <FileText className="size-3.5" /> PDF resource
                      </a>
                    )}
                    {!s.videoUrl && !s.pdfUrl && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="size-3.5" /> Reading lesson
                      </span>
                    )}
                    {!isDone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto"
                        disabled={completeMut.isPending}
                        onClick={() => completeMut.mutate(s.id)}
                      >
                        Mark complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUIZ */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Knowledge quiz</h2>
          <div className="text-xs text-muted-foreground">Pass with {data.pass_threshold}% or higher</div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {allSectionsDone ? "Answer all questions to complete this module." : "Complete the lessons above before taking the quiz."}
        </p>

        <ol className="space-y-5">
          {mod.quiz.map((q: any, i: number) => {
            const perQ = result?.per_question?.find((p) => p.id === q.id);
            return (
              <li key={q.id}>
                <div className="text-sm font-medium mb-2">
                  {i + 1}. {q.prompt}
                </div>
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
            {data.progress?.quiz_attempts ? `Best score: ${data.progress.quiz_score}% · ${data.progress.quiz_attempts} attempt(s)` : "No attempts yet"}
          </div>
          {result ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                Retake quiz
              </Button>
              <Button onClick={() => navigate({ to: "/academy" })}>
                Back to Academy <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => submitMut.mutate()}
              disabled={!allSectionsDone || !allAnswered || submitMut.isPending}
            >
              {submitMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit quiz"}
            </Button>
          )}
        </div>

        {result && (
          <div className={`mt-5 rounded-xl border p-4 text-sm ${result.passed ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-red-500/40 bg-red-500/10 text-red-200"}`}>
            {result.passed
              ? `Passed with ${result.score}%. You earned credit for this module.`
              : `Scored ${result.score}%. You need ${result.pass_threshold}% to pass — review the lessons and try again.`}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}