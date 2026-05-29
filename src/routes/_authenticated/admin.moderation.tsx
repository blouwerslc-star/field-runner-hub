import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListReports, adminListDisputes, adminResolveReport, adminResolveDispute,
} from "@/lib/safety.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: ModerationPage,
  head: () => ({ meta: [{ title: "Moderation — REI Runner Admin" }] }),
});

function ModerationPage() {
  const rFn = useServerFn(adminListReports);
  const dFn = useServerFn(adminListDisputes);
  const { data: reports, isLoading: rl } = useQuery({ queryKey: ["admin-reports"], queryFn: () => rFn() });
  const { data: disputes, isLoading: dl } = useQuery({ queryKey: ["admin-disputes"], queryFn: () => dFn() });

  return (
    <DashboardShell title="Moderation queue" subtitle="Review and resolve reports and disputes.">
      <Tabs defaultValue="reports">
        <TabsList className="mb-4">
          <TabsTrigger value="reports"><Flag className="size-4 mr-1" /> Reports ({reports?.reports?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="disputes"><ShieldAlert className="size-4 mr-1" /> Disputes ({disputes?.disputes?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          {rl ? <Loader2 className="size-5 animate-spin text-primary" /> :
            (reports?.reports ?? []).length === 0 ? (
              <Empty msg="No reports in the queue." />
            ) : (
              <ul className="space-y-3">
                {(reports!.reports as any[]).map((r) => (
                  <ReportRow key={r.id} r={r} />
                ))}
              </ul>
            )
          }
        </TabsContent>

        <TabsContent value="disputes">
          {dl ? <Loader2 className="size-5 animate-spin text-primary" /> :
            (disputes?.disputes ?? []).length === 0 ? (
              <Empty msg="No disputes in the queue." />
            ) : (
              <ul className="space-y-3">
                {(disputes!.disputes as any[]).map((d) => (
                  <DisputeRow key={d.id} d={d} />
                ))}
              </ul>
            )
          }
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{msg}</div>;
}

function statusColor(s: string) {
  if (s === "open") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  if (s === "under_review" || s === "reviewing") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  if (s === "resolved" || s === "actioned") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  return "bg-muted/30 text-muted-foreground border-border/60";
}

function ReportRow({ r }: { r: any }) {
  const [status, setStatus] = useState<"reviewing"|"dismissed"|"actioned">(r.status === "open" ? "reviewing" : r.status);
  const [notes, setNotes] = useState(r.admin_notes ?? "");
  const fn = useServerFn(adminResolveReport);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => fn({ data: { id: r.id, status, admin_notes: notes || null } }),
    onSuccess: () => { toast.success("Report updated"); qc.invalidateQueries({ queryKey: ["admin-reports"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <li className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{r.reason}</div>
          <div className="text-xs text-muted-foreground">
            {r.target_type} · {r.target_id.slice(0, 8)}… · {new Date(r.created_at).toLocaleString()}
          </div>
        </div>
        <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
      </div>
      {r.details && <p className="mt-2 text-sm text-muted-foreground">{r.details}</p>}
      <div className="mt-3 grid sm:grid-cols-[160px_1fr_auto] gap-2 items-start">
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="dismissed">Dismiss</SelectItem>
            <SelectItem value="actioned">Action taken</SelectItem>
          </SelectContent>
        </Select>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal admin notes…" rows={2} />
        <Button onClick={() => m.mutate()} disabled={m.isPending} size="sm">
          {m.isPending && <Loader2 className="size-4 mr-2 animate-spin" />} Save
        </Button>
      </div>
    </li>
  );
}

function DisputeRow({ d }: { d: any }) {
  const [status, setStatus] = useState<"under_review"|"resolved"|"closed">(d.status === "open" ? "under_review" : d.status);
  const [resolution, setResolution] = useState(d.resolution ?? "");
  const fn = useServerFn(adminResolveDispute);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => fn({ data: { id: d.id, status, resolution: resolution || null } }),
    onSuccess: () => { toast.success("Dispute updated"); qc.invalidateQueries({ queryKey: ["admin-disputes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <li className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{d.tasks?.title ?? "Task dispute"}</div>
          <div className="text-xs text-muted-foreground">
            {[d.tasks?.city, d.tasks?.state].filter(Boolean).join(", ")} · {d.category} · {new Date(d.created_at).toLocaleString()}
          </div>
        </div>
        <Badge variant="outline" className={statusColor(d.status)}>{d.status.replace("_"," ")}</Badge>
      </div>
      <p className="mt-2 text-sm">{d.description}</p>
      <div className="mt-3 grid sm:grid-cols-[160px_1fr_auto] gap-2 items-start">
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="under_review">Under review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution shared with both parties…" rows={2} />
        <Button onClick={() => m.mutate()} disabled={m.isPending} size="sm">
          {m.isPending && <Loader2 className="size-4 mr-2 animate-spin" />} Save
        </Button>
      </div>
    </li>
  );
}