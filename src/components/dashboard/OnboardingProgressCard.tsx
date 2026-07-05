import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getRunnerOnboardingStatus } from "@/lib/onboarding.functions";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";

export function OnboardingProgressCard() {
  const fn = useServerFn(getRunnerOnboardingStatus);
  const { data } = useQuery({
    queryKey: ["runner-onboarding"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });
  if (!data || !data.isRunner || data.currentStep === "done") return null;

  const current = data.steps.find((s) => s.key === data.currentStep);
  const inReviewCount = data.steps.filter((s) => s.status === "in_review").length;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">Finish getting set up</h3>
            {inReviewCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300 gap-1">
                <Clock className="size-3" /> {inReviewCount} in review
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Next: <span className="text-foreground font-medium">{current?.title}</span>
            {current?.detail ? <> — <span>{current.detail}</span></> : null}
          </p>
          <div className="mt-3 max-w-md">
            <Progress value={data.percentComplete} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">{data.percentComplete}% complete</div>
          </div>
        </div>
        <Link to="/onboarding" search={{ step: current?.key }}>
          <Button className="gap-2">
            Continue setup <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}