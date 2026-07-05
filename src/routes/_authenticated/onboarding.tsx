import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useMemo } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import {
  getRunnerOnboardingStatus,
  type OnboardingStep,
  type OnboardingStepKey,
} from "@/lib/onboarding.functions";
import { StepBasics } from "@/components/onboarding/steps/StepBasics";
import { StepAbout } from "@/components/onboarding/steps/StepAbout";
import { StepIdentity } from "@/components/onboarding/steps/StepIdentity";
import { StepBackgroundCheck } from "@/components/onboarding/steps/StepBackgroundCheck";
import { StepPayouts } from "@/components/onboarding/steps/StepPayouts";

const stepSchema = z.object({
  step: z.enum(["basics", "about", "identity", "background", "payouts"]).optional(),
});

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
  validateSearch: (s) => stepSchema.parse(s),
  head: () => ({ meta: [{ title: "Get set up — REI Runner" }] }),
});

function OnboardingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fn = useServerFn(getRunnerOnboardingStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["runner-onboarding"],
    queryFn: () => fn(),
    refetchInterval: 20000,
  });

  const activeKey: OnboardingStepKey | "done" = useMemo(() => {
    if (search.step) return search.step;
    return data?.currentStep ?? "basics";
  }, [search.step, data?.currentStep]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["runner-onboarding"] });
  const goto = (step: OnboardingStepKey) =>
    navigate({ to: "/onboarding", search: { step } });

  if (isLoading || !data) {
    return (
      <DashboardShell title="Get set up">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your progress…
        </div>
      </DashboardShell>
    );
  }

  if (!data.isRunner) {
    return (
      <DashboardShell title="Get set up">
        <p className="text-sm text-muted-foreground">
          This onboarding flow is for runners. Head to your{" "}
          <Link to="/dashboard/investor" className="text-primary hover:underline">
            investor dashboard
          </Link>{" "}
          instead.
        </p>
      </DashboardShell>
    );
  }

  const activeStep = data.steps.find((s) => s.key === activeKey);
  const nextIncomplete = data.steps.find(
    (s) => s.key !== activeKey && (s.status === "action_required" || s.status === "needs_info"),
  );

  return (
    <DashboardShell
      title="Get set up"
      subtitle="One place to finish everything you need to accept tasks."
    >
      {/* Progress header */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 mb-6">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium">Onboarding progress</span>
          <span className="text-muted-foreground">{data.percentComplete}% complete</span>
        </div>
        <Progress value={data.percentComplete} className="h-2" />
        {activeKey === "done" && (
          <p className="mt-3 text-sm text-emerald-400">
            You're all set. Head to your <Link to="/dashboard/runner" className="underline">runner dashboard</Link>.
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Left rail */}
        <nav className="space-y-2">
          {data.steps.map((s, i) => (
            <StepRail
              key={s.key}
              index={i + 1}
              step={s}
              active={s.key === activeKey}
              onClick={() => goto(s.key)}
            />
          ))}
        </nav>

        {/* Active step body */}
        <div className="space-y-4">
          {activeStep ? (
            <>
              <StepHeader step={activeStep} />
              <StepBody stepKey={activeStep.key} onDone={refresh} />
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="size-10 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-xl font-semibold">You're ready</h2>
              <p className="text-sm text-muted-foreground mt-2">
                All required steps are complete. You'll be notified as tasks come in for your area.
              </p>
              <Link to="/dashboard/runner">
                <Button className="mt-4">Open runner dashboard</Button>
              </Link>
            </div>
          )}

          {activeStep && nextIncomplete && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => goto(nextIncomplete.key)}>
                Next: {nextIncomplete.title} <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function StepRail({
  index,
  step,
  active,
  onClick,
}: {
  index: number;
  step: OnboardingStep;
  active: boolean;
  onClick: () => void;
}) {
  const icon =
    step.status === "complete" ? (
      <CheckCircle2 className="size-5 text-emerald-400" />
    ) : step.status === "in_review" ? (
      <Clock className="size-5 text-amber-400" />
    ) : step.status === "needs_info" ? (
      <AlertTriangle className="size-5 text-red-400" />
    ) : (
      <Circle className="size-5 text-muted-foreground" />
    );
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-colors " +
        (active
          ? "border-primary/60 bg-primary/10"
          : "border-border bg-card/40 hover:bg-card/70")
      }
    >
      <div className="pt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Step {index}</span>
          {step.status === "in_review" && (
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300">
              In review
            </Badge>
          )}
        </div>
        <div className="font-medium text-sm truncate">{step.title}</div>
        {step.detail && (
          <div className="text-xs text-muted-foreground truncate">{step.detail}</div>
        )}
      </div>
    </button>
  );
}

function StepHeader({ step }: { step: OnboardingStep }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
    </div>
  );
}

function StepBody({ stepKey, onDone }: { stepKey: OnboardingStepKey; onDone: () => void }) {
  switch (stepKey) {
    case "basics":
      return <StepBasics onDone={onDone} />;
    case "about":
      return <StepAbout onDone={onDone} />;
    case "identity":
      return <StepIdentity onDone={onDone} />;
    case "background":
      return <StepBackgroundCheck onDone={onDone} />;
    case "payouts":
      return <StepPayouts onDone={onDone} />;
  }
}