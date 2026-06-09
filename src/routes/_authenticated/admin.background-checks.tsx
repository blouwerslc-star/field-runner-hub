import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListBackgroundChecks,
  adminSetBackgroundCheckStatus,
} from "@/lib/verification.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, Clock, Mail, Phone, ExternalLink, BadgeCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/background-checks")({
  component: AdminBackgroundChecksPage,
  head: () => ({ meta: [{ title: "Background Checks — Admin" }] }),
});

type Tab = "pending" | "passed" | "failed" | "all";

function AdminBackgroundChecksPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const listFn = useServerFn(adminListBackgroundChecks);
  const setFn = useServerFn(adminSetBackgroundCheckStatus);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-bg-checks", tab],
    queryFn: () => listFn({ data: { status: tab } }),
  });

  const mutate = useMutation({
    mutationFn: (v: { user_id: string; status: "pending" | "passed" | "failed"; admin_notes?: string }) =>
      setFn({ data: v }),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "passed"
          ? "Marked as passed — runner is now verified"
          : vars.status === "failed"
            ? "Marked as failed"
            : "Marked as pending",
      );
      qc.invalidateQueries({ queryKey: ["admin-bg-checks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell
      title="Background Checks"
      subtitle="Runners who paid for verification. Run their check in Checkr's dashboard, then mark the result here."
    >
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Run the check in Checkr</div>
          <div className="text-xs text-muted-foreground">
            Open Checkr's dashboard, order a report for the runner, then come back and update their status below.
          </div>
        </div>
        <a href="https://dashboard.checkr.com" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            Open Checkr <ExternalLink className="size-3.5" />
          </Button>
        </a>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {query.isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (query.data?.profiles.length ?? 0) === 0 ? (
            <EmptyBgChecks tab={tab} />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {query.data!.profiles.map((p: any) => (
                <BgCheckCard
                  key={p.user_id}
                  profile={p}
                  pending={mutate.isPending}
                  onSet={(status, notes) =>
                    mutate.mutate({ user_id: p.user_id, status, admin_notes: notes })
                  }
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
  return <Badge variant="outline"><Clock className="size-3 mr-1" /> Pending</Badge>;
}

function EmptyBgChecks({ tab }: { tab: Tab }) {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const copy =
    tab === "pending"
      ? "No runners pending background checks."
      : tab === "passed"
        ? "No passed background checks yet."
        : tab === "failed"
          ? "No failed background checks."
          : "No background checks on record.";
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="size-4 text-primary" />
        <span className="font-medium">{copy}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">Last checked {now}</Badge>
      </div>
      <p className="text-muted-foreground text-xs mb-4">
        {tab === "pending"
          ? "Runners only land here after paying for a background check. Approve more runners or invite applicants to grow this queue."
          : "Switch tabs to see other states, or open Checkr to run a new report."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to="/admin/verifications"><BadgeCheck className="size-3.5 mr-1.5" /> Verifications <ArrowRight className="size-3 ml-1" /></Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to="/admin/runner-approvals"><ShieldCheck className="size-3.5 mr-1.5" /> Runner approvals <ArrowRight className="size-3 ml-1" /></Link>
        </Button>
        <a href="https://dashboard.checkr.com" target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            Open Checkr <ExternalLink className="size-3" />
          </Button>
        </a>
      </div>
    </div>
  );
}

function BgCheckCard({
  profile,
  pending,
  onSet,
}: {
  profile: any;
  pending: boolean;
  onSet: (status: "pending" | "passed" | "failed", notes?: string) => void;
}) {
  const [notes, setNotes] = useState("");
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">{profile.full_name ?? "Unknown user"}</h3>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {profile.email && (
              <div className="flex items-center gap-1.5"><Mail className="size-3" /> {profile.email}</div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-1.5"><Phone className="size-3" /> {profile.phone}</div>
            )}
            {(profile.city || profile.state) && (
              <div>{[profile.city, profile.state].filter(Boolean).join(", ")}</div>
            )}
          </div>
        </div>
        <StatusBadge status={profile.checkr_status} />
      </div>

      <div className="text-xs text-muted-foreground">
        Paid {profile.background_check_paid_at ? new Date(profile.background_check_paid_at).toLocaleString() : "—"}
      </div>

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
          variant="ghost"
          disabled={pending}
          onClick={() => onSet("pending", notes.trim() || undefined)}
        >
          <Clock className="size-4 mr-1.5" /> Reset to Pending
        </Button>
      </div>
    </div>
  );
}