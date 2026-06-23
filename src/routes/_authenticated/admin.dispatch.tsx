import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDispatchBoard, adminRankRunnersForTask, adminAssignTask } from "@/lib/ops.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RouteErrorState } from "@/components/dashboard/UiStates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Users, Star, Car, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/dispatch")({
  component: DispatchPage,
  head: () => ({ meta: [{ title: "Dispatch board — Admin" }] }),
  errorComponent: ({ error, reset }) => <RouteErrorState error={error} reset={reset} />,
});

function DispatchPage() {
  const boardFn = useServerFn(adminDispatchBoard);
  const rankFn = useServerFn(adminRankRunnersForTask);
  const assignFn = useServerFn(adminAssignTask);
  const qc = useQueryClient();

  const board = useQuery({ queryKey: ["admin-dispatch"], queryFn: () => boardFn() });
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const ranking = useQuery({
    queryKey: ["admin-rank", selectedTask],
    queryFn: () => rankFn({ data: { task_id: selectedTask! } }),
    enabled: !!selectedTask,
  });

  const assign = useMutation({
    mutationFn: (v: { task_id: string; runner_id: string }) => assignFn({ data: v }),
    onSuccess: () => {
      toast.success("Runner assigned");
      setSelectedTask(null);
      qc.invalidateQueries({ queryKey: ["admin-dispatch"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tasks = board.data?.tasks ?? [];
  const runners = board.data?.runners ?? [];

  return (
    <DashboardShell title="Dispatch board" subtitle="Match open tasks with the best available runners.">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Open tasks" value={tasks.length} icon={MapPin} />
        <Stat label="Available runners" value={runners.filter((r: any) => r.availability_status === "available").length} icon={Users} />
        <Stat label="Total runners" value={runners.length} icon={Users} />
      </div>

      {board.isLoading ? <Loader2 className="size-5 animate-spin text-primary" /> : (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Open tasks</h2>
            {tasks.length === 0 ? <Empty>No open tasks right now.</Empty> : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {tasks.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTask(t.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition ${
                      selectedTask === t.id ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                          <MapPin className="size-3" /> {t.city}, {t.state}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">${Number(t.payout_amount ?? 0).toFixed(0)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs capitalize">{t.task_type}</Badge>
                      {t.due_date && <span>Due {new Date(t.due_date).toLocaleDateString()}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {selectedTask ? "Ranked runners for this task" : "Select a task to see ranked runners"}
            </h2>
            {!selectedTask ? (
              <Empty>Pick a task on the left to view the best-matched runners.</Empty>
            ) : ranking.isLoading ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (ranking.data?.ranked.length ?? 0) === 0 ? (
              <Empty>No runners available.</Empty>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {ranking.data!.ranked.map((r: any) => (
                  <div key={r.user_id} className="rounded-2xl border border-border bg-card/50 p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{r.full_name ?? "Runner"}</span>
                        <Badge variant="outline" className="text-xs">{r.match_label}</Badge>
                        {r.availability_status === "available" && (
                          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/40">Available</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="size-3" /> {r.city ?? "—"}, {r.state ?? "—"}</span>
                        <span className="flex items-center gap-1"><Star className="size-3" /> {Number(r.average_rating ?? 0).toFixed(1)} ({r.completed_tasks_count ?? 0})</span>
                        {r.transportation_available && <span className="flex items-center gap-1"><Car className="size-3" /> Vehicle</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Score</div>
                      <div className="font-bold text-primary">{r.score}</div>
                    </div>
                    <Button
                      size="sm"
                      disabled={assign.isPending}
                      onClick={() => assign.mutate({ task_id: selectedTask, runner_id: r.user_id })}
                    >
                      <CheckCircle2 className="size-4 mr-1.5" /> Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">{children}</div>;
}