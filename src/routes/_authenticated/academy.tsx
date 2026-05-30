import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getAcademyState } from "@/lib/academy.functions";
import { CertificationBadge, CERTIFICATION_LABELS } from "@/components/academy/CertificationBadge";
import { XPBar } from "@/components/academy/XPBar";
import { StatCard } from "@/components/academy/StatCard";
import { SkillBadge } from "@/components/academy/SkillBadge";
import { SKILL_BADGES } from "@/lib/academy/badges";
import { Button } from "@/components/ui/button";
import {
  Loader2, BookOpen, CheckCircle2, ArrowRight, Lock, Award, ShieldCheck, Crown,
  Trophy, Sparkles, Briefcase, ShieldQuestion,
} from "lucide-react";

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
  const xp: number = (data as any).xp ?? 0;
  const lp = (data as any).level_progress ?? { level: 1, currentLevelXp: 0, nextLevelXp: 500, progressPct: 0 };
  const xpLevel: number = (data as any).level ?? 1;
  const nextModule = (data as any).next_module as { id: string; title: string } | null;
  const earnedBadgeIds = new Set(((data as any).earned_badges ?? []).map((b: any) => b.id));
  const earnedCount = earnedBadgeIds.size;

  return (
    <DashboardShell
      title="REI Runner Academy"
      subtitle="Train, certify, and unlock investor-grade tasks. Required before accepting paid work."
    >
      {/* HERO: XP + status */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <XPBar xp={xp} level={xpLevel} {...lp} />
        </div>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Certification tier</div>
            <div className="mt-2"><CertificationBadge level={level} size="md" /></div>
            <div className="mt-2 text-xs text-muted-foreground">
              {passedCount}/{totalCount} modules · {earnedCount} skill badges
            </div>
          </div>
          {nextModule ? (
            <Link to="/academy/$courseSlug" params={{ courseSlug: nextModule.id }}>
              <Button size="sm" className="w-full mt-4">
                Continue: {nextModule.title} <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          ) : (
            <div className="mt-4 text-xs text-emerald-300 inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> All modules complete
            </div>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard Icon={Trophy} label="Modules Passed" value={`${passedCount}/${totalCount}`} sublabel={`${data.pass_threshold}% to pass`} accent="primary" />
        <StatCard Icon={Award} label="Skill Badges" value={earnedCount} sublabel={`of ${SKILL_BADGES.length} available`} accent="amber" />
        <StatCard
          Icon={Briefcase}
          label="Paid Tasks"
          value={level >= 1 ? "Unlocked" : "Locked"}
          sublabel={level >= 1 ? "You can apply" : "Reach Certified"}
          accent={level >= 1 ? "emerald" : "violet"}
        />
        <StatCard Icon={Sparkles} label="Total XP" value={xp.toLocaleString()} sublabel={`Level ${xpLevel}`} accent="violet" />
      </div>

      {/* VERIFICATION STATUS */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Account verification</div>
            <div className="text-sm font-semibold mt-1">Needed to reach Verified Runner</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <VerifyChip ok={idVerified} label="Identity" href="/profile/id-verification" />
            <VerifyChip ok={bgVerified} label="Background check" href="/profile/background-check" />
          </div>
        </div>
      </div>

      {/* MODULES */}
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-lg font-semibold">Training modules</h2>
        <div className="text-xs text-muted-foreground">8 modules · ~90 min total</div>
      </div>
      <ul className="space-y-3 mb-10">
        {data.modules.map((m: any) => {
          const sectionsDone = (m.sections_completed?.length ?? 0);
          const progressPct = Math.round(((sectionsDone + (m.passed ? 1 : 0)) / (m.section_count + 1)) * 100);
          return (
            <li key={m.id}>
              <Link
                to="/academy/$courseSlug"
                params={{ courseSlug: m.id }}
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

      {/* SKILL BADGES */}
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-lg font-semibold">Skill badges</h2>
        <div className="text-xs text-muted-foreground">{earnedCount}/{SKILL_BADGES.length} earned</div>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {SKILL_BADGES.map((b) => {
          const earned = earnedBadgeIds.has(b.id);
          const { Icon } = b;
          return (
            <div
              key={b.id}
              className={`rounded-2xl border p-4 flex items-start gap-3 ${earned ? "border-primary/40 bg-card/80" : "border-border bg-card/40 opacity-80"}`}
            >
              <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${earned ? b.cls : "bg-muted/30 text-muted-foreground border border-border"}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold flex items-center gap-2">
                  {b.label}
                  {!earned && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{b.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CERTIFICATION LEVELS */}
      <h2 className="text-lg font-semibold mb-3">Certification tiers</h2>
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

function VerifyChip({ ok, label, href }: { ok: boolean; label: string; href: string }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 font-semibold">
        <CheckCircle2 className="size-3.5" /> {label} verified
      </span>
    );
  }
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card hover:border-primary/40 px-2.5 py-1 text-xs font-semibold transition-colors"
    >
      <ShieldQuestion className="size-3.5" /> Start {label} <ArrowRight className="size-3" />
    </Link>
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