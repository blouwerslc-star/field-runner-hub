import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

type SignupAttempt = {
  id: string;
  created_at: string;
  email: string | null;
  role: string | null;
  blocked: boolean;
  reason: string | null;
  stage: string | null;
  error_code: string | null;
  error_message: string | null;
  user_agent: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/signup-failures")({
  component: SignupFailuresPage,
  head: () => ({ meta: [{ title: "Signup failures — Admin" }] }),
});

function SignupFailuresPage() {
  const [rows, setRows] = useState<SignupAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyFailed, setOnlyFailed] = useState(true);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("signup_attempts")
      .select("id, created_at, email, role, blocked, reason, stage, error_code, error_message, user_agent")
      .order("created_at", { ascending: false })
      .limit(200);
    if (onlyFailed) q = q.eq("blocked", true);
    const { data, error } = await q;
    if (!error && data) setRows(data as SignupAttempt[]);
    setLoading(false);
  }

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [onlyFailed]);

  const totalFailed = rows.filter((r) => r.blocked).length;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-400" /> Signup failures
            </h1>
            <p className="text-sm text-muted-foreground">
              Last 200 signup attempts. Use this to spot new auth/profile errors before users report them.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOnlyFailed((v) => !v)}>
              {onlyFailed ? "Show all" : "Show failures only"}
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-3 text-sm">
          {totalFailed} failed attempts shown.
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 break-all">{r.email ?? "—"}</td>
                  <td className="px-3 py-2">{r.role ?? "—"}</td>
                  <td className="px-3 py-2">{r.stage ?? "—"}</td>
                  <td className="px-3 py-2">
                    {r.blocked ? (
                      <Badge variant="destructive">{r.reason ?? "blocked"}</Badge>
                    ) : (
                      <Badge variant="outline">passed</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-md">
                    {r.error_code ? <div className="font-mono">{r.error_code}</div> : null}
                    {r.error_message ?? ""}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No attempts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}