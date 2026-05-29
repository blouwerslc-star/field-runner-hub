import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyVerification,
  requestVerification,
  VERIFICATION_LEVELS,
} from "@/lib/verification.functions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Loader2, ShieldCheck, Sparkles, Star, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VerificationLevelBadge, VerificationStatusPill } from "@/components/profiles/VerificationLevelBadge";

export const Route = createFileRoute("/_authenticated/profile/verification")({
  component: VerificationPage,
  head: () => ({ meta: [{ title: "Get Verified — REI Runner" }] }),
});

function VerificationPage() {
  const getFn = useServerFn(getMyVerification);
  const reqFn = useServerFn(requestVerification);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-verification"], queryFn: () => getFn() });
  const [notes, setNotes] = useState("");

  const profile = data?.profile as any;
  const currentLevel = profile?.verification_level ?? 0;
  const status = (profile?.verification_status as string) ?? "not_started";
  const nextLevel = Math.min(4, currentLevel + 1);
  const isPending = status === "pending_review" || status === "pending_payment";

  const submit = useMutation({
    mutationFn: () => reqFn({ data: { requested_level: nextLevel, notes: notes.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Verification submitted. We'll review shortly.");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["my-verification"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Get Verified" subtitle="Build trust, earn premium tasks, and stand out in search.">
      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Status Header */}
            <div className="rounded-2xl border border-border bg-card/60 p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <VerificationLevelBadge level={currentLevel} size="md" />
                <VerificationStatusPill status={status} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {currentLevel === 4
                  ? "You're fully verified."
                  : currentLevel === 0
                    ? "Start your verification"
                    : `You're Level ${currentLevel}. Keep going.`}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Each level unlocks more visibility, trust, and access to higher-paying tasks.
              </p>
            </div>

            {/* Level steps */}
            <div className="rounded-2xl border border-border bg-card/40 divide-y divide-border">
              {VERIFICATION_LEVELS.map((lvl) => {
                const achieved = currentLevel >= lvl.level;
                const isNext = !achieved && lvl.level === nextLevel;
                return (
                  <div key={lvl.level} className="p-5 flex items-start gap-4">
                    <div className="pt-0.5">
                      {achieved ? (
                        <CheckCircle2 className="size-6 text-emerald-400" />
                      ) : isNext ? (
                        <ShieldCheck className="size-6 text-primary" />
                      ) : (
                        <Circle className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">Level {lvl.level} · {lvl.title}</h3>
                        {achieved && (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-xs">
                            Complete
                          </Badge>
                        )}
                        {isNext && isPending && (
                          <Badge variant="outline" className="border-yellow-500/30 text-yellow-300 text-xs">
                            In review
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{lvl.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Request form */}
            {currentLevel < 4 && (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
                <h3 className="font-semibold text-lg">
                  {isPending ? "Verification in review" : `Request Level ${nextLevel} verification`}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isPending
                    ? "An admin is reviewing your request. You'll be notified once it's decided."
                    : nextLevel === 3
                      ? "Make sure you've uploaded your ID first."
                      : nextLevel === 4
                        ? "Background check requires consent and may take 2–5 business days."
                        : "Optional context for our team."}
                </p>
                {nextLevel === 3 && !isPending && (
                  <Link
                    to="/profile/id-verification"
                    className="inline-flex text-sm text-primary hover:underline mt-2"
                  >
                    Upload ID documents →
                  </Link>
                )}
                {!isPending && (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="Notes for the admin (optional)"
                      rows={3}
                      maxLength={1000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary/80"
                      disabled={submit.isPending}
                      onClick={() => submit.mutate()}
                    >
                      {submit.isPending ? (
                        <><Loader2 className="size-4 mr-2 animate-spin" /> Submitting…</>
                      ) : (
                        <><ShieldCheck className="size-4 mr-2" /> Get Verified — Level {nextLevel}</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {(data?.requests?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-border bg-card/40 p-5">
                <h3 className="font-semibold mb-3">Request history</h3>
                <div className="space-y-2">
                  {data!.requests.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-sm border-t border-border/40 pt-2 first:border-0 first:pt-0">
                      <div>
                        <div className="font-medium">Level {r.requested_level}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                          {r.admin_notes ? ` · ${r.admin_notes}` : ""}
                        </div>
                      </div>
                      <VerificationStatusPill status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Perks */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <h3 className="font-semibold mb-3">Verified perks</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2"><ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" /> Verified badge across the marketplace</li>
                <li className="flex gap-2"><Sparkles className="size-4 text-primary shrink-0 mt-0.5" /> Access to premium tasks</li>
                <li className="flex gap-2"><Star className="size-4 text-primary shrink-0 mt-0.5" /> Priority in search results</li>
                <li className="flex gap-2"><Eye className="size-4 text-primary shrink-0 mt-0.5" /> Increased profile visibility</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}