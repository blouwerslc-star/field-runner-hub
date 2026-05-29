import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyDisputes, listMyReports, openDispute } from "@/lib/safety.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Flag, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/disputes")({
  component: DisputesPage,
  head: () => ({ meta: [{ title: "Disputes & reports — REI Runner" }] }),
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
          {dl ? <Loader2 className="size-5 animate-spin text-primary" /> :
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
          {rl ? <Loader2 className="size-5 animate-spin text-primary" /> :
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

function OpenDisputeDialog() {
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [category, setCategory] = useState<"payment"|"quality"|"scope"|"communication"|"other">("quality");
  const [description, setDescription] = useState("");
  const fn = useServerFn(openDispute);
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
            <label className="text-xs font-medium text-muted-foreground">Task ID</label>
            <Input value={taskId} onChange={(e) => setTaskId(e.target.value)} placeholder="UUID of the task" />
            <p className="text-[11px] text-muted-foreground mt-1">Find the task in your dashboard and paste its ID here.</p>
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