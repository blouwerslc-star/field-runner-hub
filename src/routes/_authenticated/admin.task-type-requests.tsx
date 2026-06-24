import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListTaskTypeRequests,
  reviewTaskTypeRequest,
  type TaskTypeRequest,
} from "@/lib/task-type-requests.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/task-type-requests")({
  component: AdminTaskTypeRequestsPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-6 text-sm">
      <p className="text-destructive">{error.message}</p>
      <Button size="sm" variant="ghost" onClick={reset} className="mt-2">Retry</Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Not found.</div>,
});

function AdminTaskTypeRequestsPage() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(adminListTaskTypeRequests);
  const reviewFn = useServerFn(reviewTaskTypeRequest);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-task-type-requests"],
    queryFn: () => fetchFn(),
  });

  const review = useMutation({
    mutationFn: reviewFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-task-type-requests"] });
      toast.success("Request reviewed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Task type requests</h1>
      {data.requests.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No pending or completed task type requests yet.
        </div>
      )}
      <ul className="space-y-3">
        {data.requests.map((r) => (
          <RequestRow
            key={r.id}
            req={r}
            onSubmit={(payload) => review.mutate({ data: payload })}
            isPending={review.isPending}
          />
        ))}
      </ul>
    </div>
  );
}

function RequestRow({
  req,
  onSubmit,
  isPending,
}: {
  req: TaskTypeRequest;
  onSubmit: (data: {
    id: string;
    status: "approved" | "rejected" | "needs_info";
    admin_notes?: string | null;
    create_template: boolean;
    default_payout?: number | null;
  }) => void;
  isPending: boolean;
}) {
  const [notes, setNotes] = useState(req.admin_notes ?? "");
  const [createTemplate, setCreateTemplate] = useState(true);
  const [payout, setPayout] = useState<string>(
    req.suggested_payout != null ? String(req.suggested_payout) : "",
  );

  const colorByStatus =
    req.status === "approved" ? "bg-emerald-500" :
    req.status === "rejected" ? "bg-destructive" :
    req.status === "needs_info" ? "bg-amber-500" : "bg-slate-500";

  return (
    <li className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{req.proposed_name}</h3>
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(req.created_at).toLocaleString()}
          </p>
        </div>
        <Badge className={`${colorByStatus} text-white capitalize`}>{req.status}</Badge>
      </div>
      <p className="text-sm whitespace-pre-wrap">{req.description}</p>
      {req.deliverables.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground">Deliverables:</span>{" "}
          {req.deliverables.join(", ")}
        </div>
      )}
      {req.suggested_payout != null && (
        <div className="text-xs text-muted-foreground">
          Suggested payout: ${Number(req.suggested_payout).toFixed(2)}
        </div>
      )}
      {req.status === "pending" && (
        <div className="space-y-2 border-t border-border/40 pt-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Admin notes (visible to requester)"
            rows={2}
          />
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={createTemplate}
              onCheckedChange={(v) => setCreateTemplate(v === true)}
            />
            On approve, create a system template (steps can be added later)
          </label>
          {createTemplate && (
            <Input
              value={payout}
              onChange={(e) => setPayout(e.target.value)}
              placeholder="Default payout (optional)"
              inputMode="decimal"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                onSubmit({
                  id: req.id,
                  status: "approved",
                  admin_notes: notes || null,
                  create_template: createTemplate,
                  default_payout: payout ? Number(payout) : null,
                })
              }
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                onSubmit({
                  id: req.id,
                  status: "needs_info",
                  admin_notes: notes || null,
                  create_template: false,
                })
              }
            >
              Needs info
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                onSubmit({
                  id: req.id,
                  status: "rejected",
                  admin_notes: notes || null,
                  create_template: false,
                })
              }
            >
              Reject
            </Button>
          </div>
        </div>
      )}
      {req.admin_notes && req.status !== "pending" && (
        <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">
          Admin note: {req.admin_notes}
        </p>
      )}
    </li>
  );
}