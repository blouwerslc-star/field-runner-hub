import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyApplications, listApplicationsForMyTasks, withdrawApplication, decideApplication, listSavedTasks } from "@/lib/marketplace.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, BadgeCheck, DollarSign, Calendar } from "lucide-react";
import { DashboardLoadingSkeleton, RouteErrorState } from "@/components/dashboard/UiStates";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/applications")({
  component: ApplicationsPage,
  head: () => ({ meta: [{ title: "Applications — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorState error={error} reset={reset} title="Couldn't load applications" />
  ),
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
    withdrawn: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
}

function ApplicationsPage() {
  const mineFn = useServerFn(listMyApplications);
  const incomingFn = useServerFn(listApplicationsForMyTasks);
  const savedFn = useServerFn(listSavedTasks);
  const withdrawFn = useServerFn(withdrawApplication);
  const decideFn = useServerFn(decideApplication);
  const qc = useQueryClient();

  const mine = useQuery({ queryKey: ["my-applications"], queryFn: () => mineFn() });
  const incoming = useQuery({ queryKey: ["incoming-applications"], queryFn: () => incomingFn() });
  const saved = useQuery({ queryKey: ["saved-tasks"], queryFn: () => savedFn() });

  const withdraw = useMutation({
    mutationFn: (id: string) => withdrawFn({ data: { applicationId: id } }),
    onSuccess: () => { toast.success("Withdrawn"); qc.invalidateQueries({ queryKey: ["my-applications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected" }) =>
      decideFn({ data: { applicationId: v.id, decision: v.decision } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["incoming-applications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Applications" subtitle="Track tasks you've applied to, manage incoming applications, and review saved opportunities.">
      <Tabs defaultValue="mine">
        <TabsList className="mb-6">
          <TabsTrigger value="mine">My applications ({mine.data?.applications.length ?? 0})</TabsTrigger>
          <TabsTrigger value="incoming">Incoming ({incoming.data?.applications.length ?? 0})</TabsTrigger>
          <TabsTrigger value="saved">Saved ({saved.data?.saved.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-3">
          {mine.isLoading ? <DashboardLoadingSkeleton tiles={0} rows={3} /> :
            (mine.data?.applications.length ?? 0) === 0 ? (
              <Empty label="You haven't applied to any tasks yet." cta={<Button asChild><Link to="/tasks">Browse open tasks</Link></Button>} />
            ) : (
              mine.data!.applications.map((a: any) => (
                <div key={a.id} className="rounded-2xl border border-border bg-card/50 p-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to="/tasks/$taskId" params={{ taskId: a.task_id }} className="font-semibold hover:text-primary">{a.tasks?.title}</Link>
                      <Badge variant="outline" className={statusBadge(a.status)}>{a.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {[a.tasks?.city, a.tasks?.state].filter(Boolean).join(", ")}</span>
                      {a.tasks?.payout_amount != null && <span className="inline-flex items-center gap-1 text-primary"><DollarSign className="size-3" />{Number(a.tasks.payout_amount).toFixed(0)}</span>}
                      <span>Applied {new Date(a.created_at).toLocaleDateString()}</span>
                    </p>
                    {a.message && <p className="text-xs text-muted-foreground italic mt-2">"{a.message}"</p>}
                  </div>
                  {a.status === "pending" && (
                    <Button variant="outline" size="sm" onClick={() => withdraw.mutate(a.id)} disabled={withdraw.isPending}>Withdraw</Button>
                  )}
                </div>
              ))
            )
          }
        </TabsContent>

        <TabsContent value="incoming" className="space-y-3">
          {incoming.isLoading ? <DashboardLoadingSkeleton tiles={0} rows={3} /> :
            (incoming.data?.applications.length ?? 0) === 0 ? (
              <Empty label="No applications on your tasks yet." />
            ) : (
              incoming.data!.applications.map((a: any) => (
                <div key={a.id} className="rounded-2xl border border-border bg-card/50 p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{a.tasks?.title}</span>
                        <Badge variant="outline" className={statusBadge(a.status)}>{a.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="size-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold">
                          {a.runner?.profile_photo_url ? (
                            <img src={a.runner.profile_photo_url} alt="" className="size-full object-cover" />
                          ) : (
                            (a.runner?.full_name ?? "?").slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium flex items-center gap-1">
                            {a.runner?.profile_slug ? (
                              <Link to="/profile/$slug" params={{ slug: a.runner.profile_slug }} className="hover:underline">{a.runner?.full_name ?? "Runner"}</Link>
                            ) : a.runner?.full_name ?? "Runner"}
                            {a.runner?.verified_status && <BadgeCheck className="size-3.5 text-emerald-400" />}
                          </div>
                          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1"><Star className="size-3 fill-yellow-400 text-yellow-400" />{Number(a.runner?.average_rating ?? 0).toFixed(1)} ({a.runner?.review_count ?? 0})</span>
                            <span>{a.runner?.completed_tasks_count ?? 0} done</span>
                            {(a.runner?.city || a.runner?.state) && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{[a.runner?.city, a.runner?.state].filter(Boolean).join(", ")}</span>}
                          </div>
                        </div>
                      </div>
                      {a.message && <p className="text-sm text-muted-foreground italic mt-3">"{a.message}"</p>}
                    </div>
                    {a.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => decide.mutate({ id: a.id, decision: "approved" })} disabled={decide.isPending}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: a.id, decision: "rejected" })} disabled={decide.isPending}>Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          }
        </TabsContent>

        <TabsContent value="saved" className="space-y-3">
          {saved.isLoading ? <DashboardLoadingSkeleton tiles={0} rows={3} /> :
            (saved.data?.saved.length ?? 0) === 0 ? (
              <Empty label="No saved tasks." cta={<Button asChild><Link to="/tasks">Browse open tasks</Link></Button>} />
            ) : (
              saved.data!.saved.map((s: any) => (
                <Link key={s.id} to="/tasks/$taskId" params={{ taskId: s.task_id }} className="block rounded-2xl border border-border bg-card/50 p-5 hover:border-primary/40">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold">{s.tasks?.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{[s.tasks?.city, s.tasks?.state].filter(Boolean).join(", ")}</span>
                        {s.tasks?.payout_amount != null && <span className="inline-flex items-center gap-1 text-primary"><DollarSign className="size-3" />{Number(s.tasks.payout_amount).toFixed(0)}</span>}
                        {s.tasks?.due_date && <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{new Date(s.tasks.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{s.tasks?.status}</Badge>
                  </div>
                </Link>
              ))
            )
          }
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function Empty({ label, cta }: { label: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
      <p className="text-sm text-muted-foreground mb-4">{label}</p>
      {cta}
    </div>
  );
}