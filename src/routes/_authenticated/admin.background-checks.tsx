import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListBackgroundChecks,
  adminSetBackgroundCheckStatus,
  adminGetBackgroundCheckSubmission,
  adminRevealSsn,
  adminNudgeBackgroundCheckIntake,
  adminCancelBackgroundCheckPayment,
} from "@/lib/verification.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RouteErrorState } from "@/components/dashboard/UiStates";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, CheckCircle2, XCircle, Clock, Mail, Phone, BadgeCheck, ShieldCheck, ArrowRight,
  Eye, EyeOff, FileText, MessageCircleWarning, AlertCircle, BellRing, Trash2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/background-checks")({
  component: AdminBackgroundChecksPage,
  head: () => ({ meta: [{ title: "Background Checks — Admin" }] }),
  errorComponent: ({ error, reset }) => <RouteErrorState error={error} reset={reset} />,
});

type Tab = "awaiting_info" | "submitted" | "in_review" | "needs_info" | "passed" | "failed" | "all";

function AdminBackgroundChecksPage() {
  const [tab, setTab] = useState<Tab>("awaiting_info");
  const listFn = useServerFn(adminListBackgroundChecks);
  const setFn = useServerFn(adminSetBackgroundCheckStatus);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-bg-checks", tab],
    queryFn: () => listFn({ data: { status: tab } }),
  });

  const mutate = useMutation({
    mutationFn: (v: { user_id: string; status: "in_review" | "needs_info" | "passed" | "failed"; admin_notes?: string }) =>
      setFn({ data: v }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-bg-checks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell
      title="Background Checks"
      subtitle="Review runner intake submissions, run checks externally, then mark the result here."
    >
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
        <div className="font-medium flex items-center gap-2"><ShieldCheck className="size-4" /> Manual review workflow</div>
        <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc pl-5">
          <li>Runner pays $13.99, then fills the encrypted intake form below.</li>
          <li>Review their info, run a check externally, then mark Passed / Failed / Needs Info.</li>
          <li>Every SSN reveal and status change is recorded in the audit log.</li>
        </ul>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="awaiting_info">Awaiting info</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="in_review">In review</TabsTrigger>
          <TabsTrigger value="needs_info">Needs info</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {query.isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (query.data?.submissions.length ?? 0) === 0 ? (
            <EmptyBgChecks tab={tab} />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {query.data!.submissions.map((s: any) => (
                <BgCheckCard
                  key={s.id ?? s.user_id}
                  sub={s}
                  pending={mutate.isPending}
                  onSet={(status, notes) => mutate.mutate({ user_id: s.user_id, status, admin_notes: notes })}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "passed")
    return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30"><CheckCircle2 className="size-3 mr-1" /> Passed</Badge>;
  if (status === "failed")
    return <Badge variant="outline" className="text-destructive border-destructive/40"><XCircle className="size-3 mr-1" /> Failed</Badge>;
  if (status === "needs_info")
    return <Badge variant="outline" className="text-amber-300 border-amber-500/40"><MessageCircleWarning className="size-3 mr-1" /> Needs info</Badge>;
  if (status === "in_review")
    return <Badge variant="outline" className="text-primary border-primary/40"><Clock className="size-3 mr-1" /> In review</Badge>;
  if (status === "awaiting_info")
    return <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="size-3 mr-1" /> Awaiting intake</Badge>;
  return <Badge variant="outline"><Clock className="size-3 mr-1" /> Submitted</Badge>;
}

function EmptyBgChecks({ tab }: { tab: Tab }) {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const copy = `No ${tab.replace("_", " ")} background checks.`;
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="size-4 text-primary" />
        <span className="font-medium">{copy}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">Last checked {now}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to="/admin/verifications"><BadgeCheck className="size-3.5 mr-1.5" /> Verifications <ArrowRight className="size-3 ml-1" /></Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to="/admin/runner-approvals"><ShieldCheck className="size-3.5 mr-1.5" /> Runner approvals <ArrowRight className="size-3 ml-1" /></Link>
        </Button>
      </div>
    </div>
  );
}

function BgCheckCard({
  sub,
  pending,
  onSet,
}: {
  sub: any;
  pending: boolean;
  onSet: (status: "in_review" | "needs_info" | "passed" | "failed", notes?: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const profile = sub.profile ?? {};
  const fullName =
    [sub.legal_first_name, sub.legal_last_name].filter(Boolean).join(" ") ||
    profile.full_name || "Unknown";
  const awaitingIntake = !sub.id;
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">{fullName}</h3>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {(sub.email || profile.email) && (
              <div className="flex items-center gap-1.5"><Mail className="size-3" /> {sub.email || profile.email}</div>
            )}
            {(sub.phone || profile.phone) && (
              <div className="flex items-center gap-1.5"><Phone className="size-3" /> {sub.phone || profile.phone}</div>
            )}
            {(sub.current_city || profile.city) && (
              <div>{[sub.current_city || profile.city, sub.current_state || profile.state].filter(Boolean).join(", ")}</div>
            )}
          </div>
        </div>
        <StatusBadge status={sub.status} />
      </div>

      <div className="text-xs text-muted-foreground">
        {sub.submitted_at ? `Submitted ${new Date(sub.submitted_at).toLocaleString()}` : null}
        {!sub.submitted_at && (profile.background_check_paid_at || sub.background_check_paid_at)
          ? `Paid ${new Date(profile.background_check_paid_at).toLocaleString()} — awaiting intake form`
          : null}
      </div>

      {awaitingIntake ? (
        <AwaitingIntakeActions userId={sub.user_id} name={fullName} />
      ) : (
        <>
          <SubmissionDetailsButton submissionId={sub.id} />
          <Textarea
            placeholder="Internal note or message to the runner (optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => onSet("passed", notes.trim() || undefined)}
              className="bg-emerald-600 hover:bg-emerald-600/90"
            >
              <CheckCircle2 className="size-4 mr-1.5" /> Mark Passed
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/40"
              disabled={pending}
              onClick={() => onSet("failed", notes.trim() || undefined)}
            >
              <XCircle className="size-4 mr-1.5" /> Mark Failed
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => onSet("needs_info", notes.trim() || undefined)}
            >
              <MessageCircleWarning className="size-4 mr-1.5" /> Request more info
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => onSet("in_review", notes.trim() || undefined)}
            >
              <Clock className="size-4 mr-1.5" /> Mark in review
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AwaitingIntakeActions({ userId, name }: { userId: string; name: string }) {
  const qc = useQueryClient();
  const nudgeFn = useServerFn(adminNudgeBackgroundCheckIntake);
  const cancelFn = useServerFn(adminCancelBackgroundCheckPayment);
  const [msg, setMsg] = useState("");

  const nudge = useMutation({
    mutationFn: () => nudgeFn({ data: { user_id: userId, message: msg.trim() || null } }),
    onSuccess: (r: any) => {
      toast.success(r?.emailedTo ? `Nudge sent to ${r.emailedTo}` : "Nudge sent");
      setMsg("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: () => cancelFn({ data: { user_id: userId, reason: msg.trim() || null } }),
    onSuccess: () => {
      toast.success(`Cancelled ${name}'s background check request`);
      qc.invalidateQueries({ queryKey: ["admin-bg-checks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200 flex items-start gap-2">
        <AlertCircle className="size-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-medium">Runner paid but hasn't submitted the encrypted intake form yet.</div>
          <div className="text-amber-200/70 mt-1">
            Nothing to approve until they finish it. Nudge them below, or cancel if they've abandoned it (refund manually in Stripe).
          </div>
        </div>
      </div>
      <Textarea
        placeholder="Optional message to the runner (nudge) or internal reason (cancel)"
        rows={2}
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={nudge.isPending || cancel.isPending}
          onClick={() => nudge.mutate()}
          className="bg-primary hover:bg-primary/90"
        >
          <BellRing className="size-4 mr-1.5" /> Email runner to finish intake
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/40"
          disabled={nudge.isPending || cancel.isPending}
          onClick={() => {
            if (confirm(`Cancel ${name}'s background check request? Refund $13.99 manually in Stripe.`)) {
              cancel.mutate();
            }
          }}
        >
          <Trash2 className="size-4 mr-1.5" /> Cancel request
        </Button>
      </div>
    </>
  );
}

function SubmissionDetailsButton({ submissionId }: { submissionId: string }) {
  const [open, setOpen] = useState(false);
  const detailFn = useServerFn(adminGetBackgroundCheckSubmission);
  const revealFn = useServerFn(adminRevealSsn);
  const [ssn, setSsn] = useState<string | null>(null);
  const [showSsn, setShowSsn] = useState(false);

  const q = useQuery({
    queryKey: ["bg-check-detail", submissionId],
    queryFn: () => detailFn({ data: { submission_id: submissionId } }),
    enabled: open,
  });

  async function reveal() {
    try {
      const r = await revealFn({ data: { submission_id: submissionId } });
      setSsn(r.ssn);
      setShowSsn(true);
      if (!r.ssn) toast.message("Runner did not provide full SSN — only last 4 captured");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="size-3.5" /> View intake details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Background check submission</DialogTitle>
        </DialogHeader>
        {q.isLoading || !q.data ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <div className="space-y-5 text-sm">
            <Row label="Legal name">
              {[q.data.submission.legal_first_name, q.data.submission.legal_middle_name, q.data.submission.legal_last_name, q.data.submission.name_suffix]
                .filter(Boolean).join(" ")}
            </Row>
            {(q.data.submission.other_names ?? []).length > 0 && (
              <Row label="Other names">{(q.data.submission.other_names as string[]).join(", ")}</Row>
            )}
            <Row label="Date of birth">{q.data.submission.date_of_birth}</Row>
            <Row label="SSN">
              <div className="flex items-center gap-2">
                <span className="font-mono">
                  {showSsn && ssn ? ssn : `***-**-${q.data.submission.ssn_last4}`}
                </span>
                {q.data.submission.has_full_ssn && (
                  <Button size="sm" variant="ghost" onClick={showSsn ? () => setShowSsn(false) : reveal}>
                    {showSsn ? <EyeOff className="size-3.5 mr-1" /> : <Eye className="size-3.5 mr-1" />}
                    {showSsn ? "Hide" : "Reveal (audited)"}
                  </Button>
                )}
              </div>
            </Row>
            {q.data.submission.drivers_license_number && (
              <Row label="Driver's license">
                {q.data.submission.drivers_license_number} ({q.data.submission.drivers_license_state})
                {q.data.submission.drivers_license_expiration ? ` — exp ${q.data.submission.drivers_license_expiration}` : ""}
              </Row>
            )}
            <Row label="Phone / email">{q.data.submission.phone} · {q.data.submission.email}</Row>
            <Row label="Current address">
              {q.data.submission.current_address_line1}
              {q.data.submission.current_address_line2 ? `, ${q.data.submission.current_address_line2}` : ""}<br />
              {q.data.submission.current_city}, {q.data.submission.current_state} {q.data.submission.current_zip}
              {q.data.submission.current_address_since ? ` — since ${q.data.submission.current_address_since}` : ""}
            </Row>
            {(q.data.submission.prior_addresses ?? []).length > 0 && (
              <Row label="Prior addresses">
                <ul className="space-y-1">
                  {(q.data.submission.prior_addresses as any[]).map((a, i) => (
                    <li key={i}>{a.line1}, {a.city}, {a.state} {a.zip} {a.from ? `(${a.from} → ${a.to ?? "—"})` : ""}</li>
                  ))}
                </ul>
              </Row>
            )}
            <div>
              <div className="text-xs text-muted-foreground mb-2">ID & selfie</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Front", url: q.data.idFrontUrl },
                  { label: "Back", url: q.data.idBackUrl },
                  { label: "Selfie", url: q.data.selfieUrl },
                ].map((f) => (
                  <a key={f.label} href={f.url ?? undefined} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-border overflow-hidden aspect-[3/2] bg-muted">
                    {f.url ? <img src={f.url} alt={f.label} className="size-full object-cover" /> : <div className="size-full grid place-items-center text-[10px] text-muted-foreground">{f.label} not uploaded</div>}
                  </a>
                ))}
              </div>
            </div>
            <Row label="Consent">
              Signed by <strong>{q.data.submission.signature_full_name}</strong> at{" "}
              {new Date(q.data.submission.signed_at).toLocaleString()}
              {q.data.submission.signature_ip ? ` from ${q.data.submission.signature_ip}` : ""}
            </Row>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}