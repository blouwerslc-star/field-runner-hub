import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getAcademyState } from "@/lib/academy.functions";
import { CertificationBadge, CERTIFICATION_LABELS } from "@/components/academy/CertificationBadge";
import { Loader2, BookOpen, CheckCircle2, ArrowRight, Lock, Award, ShieldCheck, Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/academy")({
  component: AcademyIndex,
  head: () => ({ meta: [{ title: "REI Runner Academy" }] }),
});

function AcademyIndex() {
  const fn = useServerFn(getAcademyState);
  const { data, isLoading } = useQuery({ queryKey: ["academy-state"], queryFn: () => fn() });

  if (isLoading || !data) {
    return (
      <DashboardShell title="REI Runner Academy" subtitle="Training & certification for field runners.">
        <Loader2 className="size-6 animate-spin text-primary" />
      </DashboardShell>
    );
  }

  const level = data.runner?.certification_level ?? 0;
  const passedCount = data.modules.filter((m: any) => m.passed).length;
  const totalCount = data.modules.length;
  const idVerified = !!data.profile?.identity_verified;
  const bgVerified = !!data.profile?.background_check_verified;
  const rating = Number(data.profile?.average_rating ?? 0);
  const completedTasks = Number(data.profile?.completed_tasks_count ?? 0);

  return (
    <DashboardShell
      title="REI Runner Academy"
      subtitle="Complete the training to become a Certified Runner. Required before accepting paid tasks."
    >
      {/* CURRENT STATUS */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Your status</div>
            <div className="flex items-center gap-3">
              <CertificationBadge level={level} size="md" />
              <div className="text-sm text-muted-foreground">
                {passedCount} of {totalCount} modules passed
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Pass threshold</div>
            <div className="text-lg font-semibold">{data.pass_threshold}%</div>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* MODULES */}
      <h2 className="text-lg font-semibold mb-3">Modules</h2>
      <ul className="space-y-3 mb-10">
        {data.modules.map((m: any) => {
          const sectionsDone = (m.sections_completed?.length ?? 0);
          const progressPct = Math.round(((sectionsDone + (m.passed ? 1 : 0)) / (m.section_count + 1)) * 100);
          return (
            <li key={m.id}>
              <Link
                to="/academy/$moduleId"
                params={{ moduleId: m.id }}
                className="block rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                    {m.passed ? (
                      <CheckCircle2 className="size-5 text-emerald-400" />
                    ) : (
                      <BookOpen className="size-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">M{m.order}</span>
                      <h3 className="text-base font-semibold">{m.title}</h3>
                      {m.passed && (
                        <span className="text-[10px] uppercase tracking-widest text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Passed · {m.quiz_score}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{m.summary}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{m.section_count} lessons · {m.quiz_question_count}-question quiz</span>
                      <span>· {m.duration}</span>
                      {m.quiz_attempts > 0 && <span>· {m.quiz_attempts} attempt{m.quiz_attempts === 1 ? "" : "s"}</span>}
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground self-center" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* CERTIFICATION LEVELS */}
      <h2 className="text-lg font-semibold mb-3">Certification Levels</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <LevelCard
          level={1}
          unlocked={level >= 1}
          requirements={[{ ok: passedCount === totalCount, text: `Pass all ${totalCount} Academy modules (${passedCount}/${totalCount})` }]}
        />
        <LevelCard
          level={2}
          unlocked={level >= 2}
          requirements={[
            { ok: level >= 1, text: "Certified Runner status" },
            { ok: idVerified, text: "Identity verification complete" },
            { ok: bgVerified, text: "Background check complete" },
          ]}
        />
        <LevelCard
          level={3}
          unlocked={level >= 3}
          requirements={[
            { ok: level >= 2, text: "Verified Runner status" },
            { ok: completedTasks >= 25, text: `25+ completed tasks (${completedTasks})` },
            { ok: rating >= 4.7, text: `Average rating ≥ 4.7 (${rating.toFixed(2)}★)` },
          ]}
        />
      </div>
    </DashboardShell>
  );
}

function LevelCard({
  level,
  unlocked,
  requirements,
}: {
  level: 1 | 2 | 3;
  unlocked: boolean;
  requirements: { ok: boolean; text: string }[];
}) {
  const meta = CERTIFICATION_LABELS[level];
  const Icon = level === 1 ? Award : level === 2 ? ShieldCheck : Crown;
  return (
    <div className={`rounded-2xl border p-5 ${unlocked ? "border-primary/40 bg-card/80" : "border-border bg-card/40"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-5 text-primary" />
        <div className="text-sm font-semibold">Level {level} · {meta.label}</div>
        {unlocked ? (
          <CheckCircle2 className="size-4 text-emerald-400 ml-auto" />
        ) : (
          <Lock className="size-4 text-muted-foreground ml-auto" />
        )}
      </div>
      <ul className="space-y-1.5 text-xs">
        {requirements.map((r, i) => (
          <li key={i} className={`flex items-start gap-2 ${r.ok ? "text-foreground" : "text-muted-foreground"}`}>
            <span className={`mt-0.5 inline-block size-3.5 rounded-full grid place-items-center text-[10px] ${r.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"}`}>
              {r.ok ? "✓" : "·"}
            </span>
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}