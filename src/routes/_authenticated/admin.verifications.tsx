import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListVerificationRequests,
  adminDecideVerification,
} from "@/lib/verification.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RouteErrorState } from "@/components/dashboard/UiStates";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, Mail, Phone, BadgeCheck, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { VerificationLevelBadge } from "@/components/profiles/VerificationLevelBadge";

export const Route = createFileRoute("/_authenticated/admin/verifications")({
  component: AdminVerificationsPage,
  head: () => ({ meta: [{ title: "Verifications — Admin" }] }),
  errorComponent: ({ error, reset }) => <RouteErrorState error={error} reset={reset} />,
});

type StatusTab = "pending_review" | "verified" | "rejected" | "all";

function AdminVerificationsPage() {
  const [tab, setTab] = useState<StatusTab>("pending_review");
  const listFn = useServerFn(adminListVerificationRequests);
  const decideFn = useServerFn(adminDecideVerification);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-verifications", tab],
    queryFn: () => listFn({ data: { status: tab } }),
  });

  const decide = useMutation({
    mutationFn: (v: { request_id: string; decision: "verified" | "rejected"; admin_notes?: string }) =>
      decideFn({ data: v }),
    onSuccess: (_d, vars) => {
      toast.success(vars.decision === "verified" ? "Verification approved" : "Request rejected");
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Verifications" subtitle="Review and decide on runner verification requests.">
      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending_review">Pending review</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {query.isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (query.data?.requests.length ?? 0) === 0 ? (
            <EmptyVerifications tab={tab} />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {query.data!.requests.map((r: any) => (
                <RequestCard
                  key={r.id}
                  req={r}
                  onDecide={(decision, notes) => decide.mutate({ request_id: r.id, decision, admin_notes: notes })}
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

function RequestCard({ req, onDecide, pending }: {
  req: any;
  onDecide: (d: "verified" | "rejected", notes?: string) => void;
  pending: boolean;
}) {
  const p = req.profile ?? {};
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">{p.full_name ?? "Unknown user"}</h3>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {p.email && <div className="flex items-center gap-1.5"><Mail className="size-3" /> {p.email}</div>}
            {p.phone && <div className="flex items-center gap-1.5"><Phone className="size-3" /> {p.phone}</div>}
            {(p.city || p.state) && <div className="flex items-center gap-1.5"><BadgeCheck className="size-3" /> {[p.city, p.state].filter(Boolean).join(", ")}</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <VerificationLevelBadge level={p.verification_level ?? 0} />
          <Badge variant="outline" className="text-xs">Requesting L{req.requested_level}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-[10px]">
        <Flag label="Email" on={!!p.email_verified} />
        <Flag label="Phone" on={!!p.phone_verified} />
        <Flag label="ID" on={!!p.identity_verified} />
        <Flag label="Background" on={!!p.background_check_verified} />
      </div>

      {req.notes && (
        <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 italic">
          Runner: {req.notes}
        </p>
      )}
      {req.admin_notes && (
        <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
          Admin: {req.admin_notes}
        </p>
      )}

      {req.status === "pending_review" && (
        <div className="flex gap-2 pt-2">
          <Button size="sm" disabled={pending} onClick={() => onDecide("verified")} className="flex-1">
            <CheckCircle2 className="size-4 mr-1.5" /> Approve
          </Button>
          <RejectDialog onSubmit={(notes) => onDecide("rejected", notes)} pending={pending} />
        </div>
      )}
      <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
        Submitted {new Date(req.created_at).toLocaleString()}
        {req.reviewed_at && ` · Reviewed ${new Date(req.reviewed_at).toLocaleString()}`}
      </div>
    </div>
  );
}

function Flag({ label, on }: { label: string; on: boolean }) {
  return (
    <div className={`rounded border px-2 py-1 text-center ${on ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-border text-muted-foreground"}`}>
      <div className="font-semibold">{label}</div>
      <div>{on ? "✓" : "—"}</div>
    </div>
  );
}

function EmptyVerifications({ tab }: { tab: StatusTab }) {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const copy =
    tab === "pending_review"
      ? "No pending verifications."
      : tab === "verified"
        ? "No verified runners in this view."
        : tab === "rejected"
          ? "No rejected requests."
          : "No verification requests yet.";
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <BadgeCheck className="size-4 text-primary" />
        <span className="font-medium">{copy}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">Last checked {now}</Badge>
      </div>
      <p className="text-muted-foreground text-xs mb-4">
        {tab === "pending_review"
          ? "Nothing is waiting for review right now. You're all caught up."
          : "Try a different tab to see other request states."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to="/admin/runner-approvals"><ShieldCheck className="size-3.5 mr-1.5" /> Runner approvals <ArrowRight className="size-3 ml-1" /></Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to="/admin/background-checks"><Users className="size-3.5 mr-1.5" /> Background checks <ArrowRight className="size-3 ml-1" /></Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to="/admin/broadcasts"><Mail className="size-3.5 mr-1.5" /> Send broadcast <ArrowRight className="size-3 ml-1" /></Link>
        </Button>
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
        <DialogHeader><DialogTitle>Reject verification request</DialogTitle></DialogHeader>
        <Textarea placeholder="Reason (shown to the user)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
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