import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listReviewableTasks } from "@/lib/reviews.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReviewComposer } from "@/components/reviews/ReviewComposer";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  component: ReviewsPage,
  head: () => ({ meta: [{ title: "Reviews — REI Runner" }] }),
});

function ReviewsPage() {
  const fn = useServerFn(listReviewableTasks);
  const { data, isLoading } = useQuery({ queryKey: ["reviewable-tasks"], queryFn: () => fn() });
  const tasks = data?.tasks ?? [];
  return (
    <DashboardShell title="Leave a review" subtitle="Rate completed tasks. Your feedback helps build trust across the marketplace.">
      {isLoading ? <Loader2 className="size-5 animate-spin text-primary" /> :
        tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Nothing to review right now. Once a task is completed you can leave a review here.
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((t: any) => (
              <div key={t.id} className="rounded-2xl border border-border bg-card/50 p-5">
                <div className="mb-3">
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{[t.city, t.state].filter(Boolean).join(", ")}</div>
                </div>
                <ReviewComposer
                  taskId={t.id}
                  revieweeId={t.counterparty}
                  direction={t.direction}
                />
              </div>
            ))}
          </div>
        )
      }
    </DashboardShell>
  );
}