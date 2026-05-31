import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import {
  listApplicants,
  sendBroadcast,
  listBroadcastHistory,
} from "@/lib/broadcasts.functions";

export const Route = createFileRoute("/_authenticated/admin/broadcasts")({
  component: BroadcastsPage,
  head: () => ({ meta: [{ title: "Broadcasts — Admin — REI Runner" }] }),
});

type Audience = "runner" | "investor";

const DEFAULTS: Record<Audience, { subject: string; html: string }> = {
  runner: {
    subject:
      "Your spot is waiting, {{firstName}} — finish setting up your Runner account",
    html: `<p>Hi {{firstName}},</p>
<p>Thanks again for applying to be a REI Runner. We're rolling out access market by market, and we want you ready to take jobs the moment they hit your area.</p>
<p>The next step is quick: create your account, verify your details, and complete your runner profile so investors can start sending work your way.</p>
<p><a href="https://reirunner.com/signup?role=runner" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Finish setting up my Runner account</a></p>
<p>Questions? Just reply to this email.</p>
<p>— The REI Runner Team</p>`,
  },
  investor: {
    subject: "{{firstName}}, finish setting up your REI Runner investor account",
    html: `<p>Hi {{firstName}},</p>
<p>Thanks for your interest in REI Runner. You're on the early access list for investors — the next step is to create your account so you can post tasks and start working with vetted runners in your market.</p>
<p><a href="https://reirunner.com/signup?role=investor" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Finish setting up my Investor account</a></p>
<p>If you have questions about pricing, markets, or how runners are vetted, just reply to this email.</p>
<p>— The REI Runner Team</p>`,
  },
};

function BroadcastsPage() {
  const [audience, setAudience] = useState<Audience>("runner");
  const [subject, setSubject] = useState(DEFAULTS.runner.subject);
  const [html, setHtml] = useState(DEFAULTS.runner.html);
  const [senderEmail, setSenderEmail] = useState("noreply@reirunner.com");
  const [senderName, setSenderName] = useState("REI Runner");
  const [onlyWithoutAccount, setOnlyWithoutAccount] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  const list = useServerFn(listApplicants);
  const send = useServerFn(sendBroadcast);
  const history = useServerFn(listBroadcastHistory);

  const applicantsQ = useQuery({
    queryKey: ["broadcast-applicants", audience],
    queryFn: () => list({ data: { audience } }),
  });
  const historyQ = useQuery({
    queryKey: ["broadcast-history"],
    queryFn: () => history(),
  });

  const applicants = applicantsQ.data?.applicants ?? [];
  const eligible = useMemo(
    () => applicants.filter((a) => (onlyWithoutAccount ? !a.has_account : true)),
    [applicants, onlyWithoutAccount],
  );

  const selectedIds = useMemo(
    () => eligible.filter((a) => selected[a.id]).map((a) => a.id),
    [eligible, selected],
  );

  function switchAudience(a: Audience) {
    setAudience(a);
    setSubject(DEFAULTS[a].subject);
    setHtml(DEFAULTS[a].html);
    setSelected({});
    setLastResult(null);
  }

  function toggleAll(checked: boolean) {
    if (!checked) return setSelected({});
    const next: Record<string, boolean> = {};
    for (const a of eligible) next[a.id] = true;
    setSelected(next);
  }

  async function handleSend() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    if (
      !confirm(
        `Send "${subject}" to ${selectedIds.length} ${audience} applicant(s)?`,
      )
    )
      return;
    setSending(true);
    setLastResult(null);
    try {
      const res = await send({
        data: {
          audience,
          subject,
          htmlContent: html,
          senderEmail,
          senderName,
          recipientIds: selectedIds,
          onlyWithoutAccount,
        },
      });
      setLastResult({ sent: res.sent, failed: res.failed, total: res.total });
      if (res.failed === 0) {
        toast.success(`Sent ${res.sent} email(s)`);
      } else {
        toast.warning(`Sent ${res.sent}, failed ${res.failed}`);
      }
      historyQ.refetch();
      setSelected({});
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardShell
      title="Broadcasts"
      subtitle="Re-engage applicants who haven't created an account yet."
    >
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin">
            <ArrowLeft className="size-4 mr-1" /> Back to Admin
          </Link>
        </Button>
      </div>

      <Tabs value={audience} onValueChange={(v) => switchAudience(v as Audience)}>
        <TabsList className="mb-6">
          <TabsTrigger value="runner">Runner applicants</TabsTrigger>
          <TabsTrigger value="investor">Investor applicants</TabsTrigger>
        </TabsList>

        <TabsContent value={audience} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
              <h3 className="font-semibold">Email content</h3>
              <div>
                <Label htmlFor="from-name">From name</Label>
                <Input
                  id="from-name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="from-email">From email (must be verified in Brevo)</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="html">HTML body</Label>
                <Textarea
                  id="html"
                  rows={14}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use <code>{"{{firstName}}"}</code> for personalization.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
              <h3 className="font-semibold">Live preview</h3>
              <div className="rounded-lg border border-border bg-background p-4 text-sm">
                <div className="text-xs text-muted-foreground mb-2">
                  From: {senderName} &lt;{senderEmail}&gt;
                </div>
                <div className="font-semibold mb-3">{subject}</div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold">Recipients</h3>
                <p className="text-xs text-muted-foreground">
                  {eligible.length} eligible · {selectedIds.length} selected
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="without-account"
                    checked={onlyWithoutAccount}
                    onCheckedChange={(v) => {
                      setOnlyWithoutAccount(v);
                      setSelected({});
                    }}
                  />
                  <Label htmlFor="without-account" className="text-xs">
                    Only applicants without an account
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(selectedIds.length !== eligible.length)}
                  disabled={eligible.length === 0}
                >
                  {selectedIds.length === eligible.length && eligible.length > 0
                    ? "Clear"
                    : "Select all"}
                </Button>
              </div>
            </div>

            {applicantsQ.isLoading ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : eligible.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No eligible applicants.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 w-10"></th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Market</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligible.map((a) => (
                      <tr key={a.id} className="border-t border-border/60">
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={!!selected[a.id]}
                            onCheckedChange={(v) =>
                              setSelected((s) => ({ ...s, [a.id]: !!v }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{a.full_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.email}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {[a.city, a.state].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {a.has_account ? (
                            <Badge variant="outline">Has account</Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">
                              No account
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-5">
              {lastResult ? (
                <div className="text-sm">
                  Last send: <span className="text-emerald-400">{lastResult.sent} sent</span>
                  {lastResult.failed > 0 && (
                    <span className="text-red-400 ml-2">{lastResult.failed} failed</span>
                  )}
                </div>
              ) : (
                <div />
              )}
              <Button onClick={handleSend} disabled={sending || selectedIds.length === 0}>
                {sending ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Send className="size-4 mr-2" />
                )}
                Send to {selectedIds.length} recipient{selectedIds.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-2xl border border-border bg-card/50 p-5 mt-8">
        <h3 className="font-semibold mb-4">Recent sends</h3>
        {historyQ.isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (historyQ.data?.sends ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No broadcasts sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Audience</th>
                  <th className="py-2 pr-3">Recipient</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(historyQ.data?.sends ?? []).map((s: any) => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">{s.audience}</td>
                    <td className="py-2 pr-3">{s.recipient_email}</td>
                    <td className="py-2 pr-3 truncate max-w-[280px]">{s.subject}</td>
                    <td className="py-2 pr-3">
                      {s.status === "sent" ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                          sent
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/40 text-red-300" title={s.error_message ?? ""}>
                          failed
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}