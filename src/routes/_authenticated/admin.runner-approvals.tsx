import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListRunnerApplications, adminDecideRunnerApplication } from "@/lib/ops.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, MapPin, Mail, Phone, Car, Smartphone, BadgeCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/runner-approvals")({
  component: RunnerApprovalsPage,
  head: () => ({ meta: [{ title: "Runner approvals — Admin" }] }),
});

function RunnerApprovalsPage() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const listFn = useServerFn(adminListRunnerApplications);
  const decideFn = useServerFn(adminDecideRunnerApplication);
  const qc = useQueryClient();

  const apps = useQuery({
    queryKey: ["admin-runner-apps", tab],
    queryFn: () => listFn({ data: { status: tab } }),
  });

  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected"; admin_notes?: string }) =>
      decideFn({ data: v }),
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "approved" ? "Runner approved" : "Application rejected");
      qc.invalidateQueries({ queryKey: ["admin-runner-apps"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Runner approvals" subtitle="Review Field Runner applications and grant marketplace access.">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {apps.isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (apps.data?.applications.length ?? 0) === 0 ? (
            <EmptyApprovals tab={tab as "pending" | "approved" | "rejected"} />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {apps.data!.applications.map((a: any) => (
                <ApplicationCard
                  key={a.id}
                  app={a}
                  status={tab}
                  onDecide={(decision, notes) => decide.mutate({ id: a.id, decision, admin_notes: notes })}
                  pending={decide.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function ApplicationCard({ app, status, onDecide, pending }: {
  app: any; status: string;
  onDecide: (d: "approved" | "rejected", notes?: string) => void;
  pending: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">{app.full_name}</h3>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <div className="flex items-center gap-1.5"><Mail className="size-3" /> {app.email}</div>
            <div className="flex items-center gap-1.5"><Phone className="size-3" /> {app.phone}</div>
            <div className="flex items-center gap-1.5"><MapPin className="size-3" /> {app.city}, {app.state} {app.zip_code}</div>
          </div>
        </div>
        <Badge variant="outline" className="capitalize text-xs">{app.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5"><Car className="size-3 text-muted-foreground" /> {app.has_transportation ?? "—"}</div>
        <div className="flex items-center gap-1.5"><Smartphone className="size-3 text-muted-foreground" /> {app.has_smartphone ?? "—"}</div>
        <div className="text-muted-foreground">Radius: {app.travel_radius_miles ?? "—"} mi</div>
        <div className="text-muted-foreground">Hours/wk: {app.hours_per_week ?? "—"}</div>
      </div>

      {(app.services ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(app.services as string[]).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
        </div>
      )}

      {app.experience && (
        <p className="text-xs text-muted-foreground line-clamp-3 border-l-2 border-border pl-3">{app.experience}</p>
      )}
      {app.admin_notes && (
        <p className="text-xs italic text-muted-foreground">Admin note: {app.admin_notes}</p>
      )}

      {status === "pending" && (
        <div className="flex gap-2 pt-2">
          <Button size="sm" disabled={pending} onClick={() => onDecide("approved")} className="flex-1">
            <CheckCircle2 className="size-4 mr-1.5" /> Approve
          </Button>
          <RejectDialog onSubmit={(notes) => onDecide("rejected", notes)} pending={pending} />
        </div>
      )}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
        Submitted {new Date(app.created_at).toLocaleDateString()}
        {app.reviewed_at && ` · Reviewed ${new Date(app.reviewed_at).toLocaleDateString()}`}
      </div>
    </div>
  );
}

function RejectDialog({ onSubmit, pending }: { onSubmit: (notes: string) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive">
          <XCircle className="size-4 mr-1.5" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reject application</DialogTitle></DialogHeader>
        <Textarea placeholder="Reason (shown to applicant)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={pending} onClick={() => { onSubmit(notes); setOpen(false); }}>
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center text-sm text-muted-foreground">{children}</div>;
}

function EmptyApprovals({ tab }: { tab: "pending" | "approved" | "rejected" }) {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const copy =
    tab === "pending"
      ? "No pending applications."
      : tab === "approved"
        ? "No approved runners yet."
        : "No rejected applications.";
  const detail =
    tab === "pending"
      ? "You're caught up — every application has a decision. Try inviting more applicants or send a follow-up broadcast."
      : tab === "approved"
        ? "Once you approve runners they'll show up here. Open the pending tab to review applicants."
        : "Rejected applicants appear here. Switch tabs to see other states.";
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="size-4 text-primary" />
        <span className="font-medium">{copy}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">Last checked {now}</Badge>
      </div>
      <p className="text-muted-foreground text-xs mb-4">{detail}</p>
      <div className="flex flex-wrap gap-2">
        <a href="/admin/verifications">
          <Button size="sm" variant="outline" className="h-8 text-xs">
            <BadgeCheck className="size-3.5 mr-1.5" /> Verifications <ArrowRight className="size-3 ml-1" />
          </Button>
        </a>
        <a href="/admin/background-checks">
          <Button size="sm" variant="outline" className="h-8 text-xs">
            <ShieldCheck className="size-3.5 mr-1.5" /> Background checks <ArrowRight className="size-3 ml-1" />
          </Button>
        </a>
        <a href="/admin/broadcasts">
          <Button size="sm" variant="outline" className="h-8 text-xs">
            <Mail className="size-3.5 mr-1.5" /> Send broadcast <ArrowRight className="size-3 ml-1" />
          </Button>
        </a>
      </div>
    </div>
  );
}