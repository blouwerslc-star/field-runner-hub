import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyDisputes, listMyReports, openDispute } from "@/lib/safety.functions";
import { listMyTasks } from "@/lib/tasks.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Flag, ShieldAlert, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RouteErrorState } from "@/components/dashboard/UiStates";

export const Route = createFileRoute("/_authenticated/disputes")({
  component: DisputesPage,
  head: () => ({ meta: [{ title: "Disputes & reports — REI Runner" }] }),
  errorComponent: ({ error, reset }) => (
    <RouteErrorState error={error} reset={reset} title="Couldn't load disputes" />
  ),
});

function statusColor(s: string) {
  if (s === "open") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  if (s === "under_review" || s === "reviewing") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  if (s === "resolved" || s === "actioned") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  return "bg-muted/30 text-muted-foreground border-border/60";
}

function DisputesPage() {
  const dFn = useServerFn(listMyDisputes);
  const rFn = useServerFn(listMyReports);
  const { data: disputes, isLoading: dl } = useQuery({ queryKey: ["my-disputes"], queryFn: () => dFn() });
  const { data: reports, isLoading: rl } = useQuery({ queryKey: ["my-reports"], queryFn: () => rFn() });

  return (
    <DashboardShell title="Disputes & reports" subtitle="Open a dispute on a task, or review the status of your reports.">
      <div className="flex justify-end mb-4">
        <OpenDisputeDialog />
      </div>
      <Tabs defaultValue="disputes">
        <TabsList className="mb-4">
          <TabsTrigger value="disputes"><ShieldAlert className="size-4 mr-1" /> My disputes</TabsTrigger>
          <TabsTrigger value="reports"><Flag className="size-4 mr-1" /> My reports</TabsTrigger>
        </TabsList>
        <TabsContent value="disputes">
          {dl ? <ListSkeleton /> :
            (disputes?.disputes ?? []).length === 0 ? (
              <Empty message="No disputes opened. Use the button above if you need to escalate an issue on a task." />
            ) : (
              <ul className="space-y-3">
                {(disputes!.disputes as any[]).map((d) => (
                  <li key={d.id} className="rounded-2xl border border-border bg-card/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{d.tasks?.title ?? "Task"}</div>
                        <div className="text-xs text-muted-foreground">{[d.tasks?.city, d.tasks?.state].filter(Boolean).join(", ")}</div>
                      </div>
                      <Badge variant="outline" className={statusColor(d.status)}>{d.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Category:</span> {d.category}</p>
                    <p className="mt-1 text-sm">{d.description}</p>
                    {d.resolution && (
                      <div className="mt-3 rounded-lg bg-muted/30 border border-border/60 p-3 text-xs">
                        <div className="font-semibold mb-1">Resolution</div>
                        {d.resolution}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )
          }
        </TabsContent>
        <TabsContent value="reports">
          {rl ? <ListSkeleton /> :
            (reports?.reports ?? []).length === 0 ? (
              <Empty message="No reports submitted yet." />
            ) : (
              <ul className="space-y-3">
                {(reports!.reports as any[]).map((r) => (
                  <li key={r.id} className="rounded-2xl border border-border bg-card/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{r.reason}</div>
                        <div className="text-xs text-muted-foreground">Reported {r.target_type} · {new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                    </div>
                    {r.details && <p className="mt-2 text-sm text-muted-foreground">{r.details}</p>}
                    {r.admin_notes && (
                      <div className="mt-3 rounded-lg bg-muted/30 border border-border/60 p-3 text-xs">
                        <div className="font-semibold mb-1">Admin response</div>
                        {r.admin_notes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )
          }
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{message}</div>;
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function OpenDisputeDialog() {
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [category, setCategory] = useState<"payment"|"quality"|"scope"|"communication"|"other">("quality");
  const [description, setDescription] = useState("");
  const fn = useServerFn(openDispute);
  const tasksFn = useServerFn(listMyTasks);
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["my-tasks-for-dispute"],
    queryFn: () => tasksFn(),
    enabled: open,
  });
  const eligibleTasks = ((tasksData?.tasks ?? []) as any[]).filter(
    (t) => t.status !== "draft" && t.status !== "cancelled",
  );
  const selectedTask = eligibleTasks.find((t) => t.id === taskId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => fn({ data: { task_id: taskId, category, description } }),
    onSuccess: () => {
      toast.success("Dispute opened. We'll review it shortly.");
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
      setOpen(false);
      setTaskId(""); setDescription("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4 mr-1" /> Open dispute</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Open a dispute</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Task</label>
            {tasksLoading ? (
              <Skeleton className="h-10 w-full mt-1" />
            ) : eligibleTasks.length === 0 ? (
              <div className="mt-1 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                You don't have any tasks eligible for dispute yet. Disputes can be opened on tasks you've posted or accepted.
              </div>
            ) : (
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between mt-1 font-normal"
                  >
                    {selectedTask ? (
                      <span className="truncate text-left">
                        {selectedTask.title || "Untitled task"}
                        {selectedTask.city ? ` — ${selectedTask.city}${selectedTask.state ? ", " + selectedTask.state : ""}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select a task…</span>
                    )}
                    <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                  <Command
                    filter={(value, search) => {
                      const t = eligibleTasks.find((x) => x.id === value);
                      if (!t) return 0;
                      const hay = [t.title, t.city, t.state, t.property_address, t.status, t.id.slice(0, 8)]
                        .filter(Boolean).join(" ").toLowerCase();
                      return hay.includes(search.toLowerCase()) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Search by title, address, status…" />
                    <CommandList>
                      <CommandEmpty>No matching tasks.</CommandEmpty>
                      <CommandGroup>
                        {eligibleTasks.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.id}
                            onSelect={(v) => { setTaskId(v); setPickerOpen(false); }}
                          >
                            <Check className={cn("mr-2 size-4", taskId === t.id ? "opacity-100" : "opacity-0")} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {t.title || "Untitled task"} <span className="text-muted-foreground font-normal">#{t.id.slice(0, 8)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[t.city, t.state].filter(Boolean).join(", ") || t.property_address || "No location"} · {t.status?.replace("_", " ")}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="quality">Quality of work</SelectItem>
                <SelectItem value="scope">Scope</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">What happened?</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} minLength={10} maxLength={4000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || description.length < 10 || !taskId}>
            {m.isPending && <Loader2 className="size-4 mr-2 animate-spin" />} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}