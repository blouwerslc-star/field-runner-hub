import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { sendOneSignalTest, type TestEventKey } from "@/lib/onesignal-admin.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/push-test")({
  component: PushTestPage,
});

const EVENTS: { key: TestEventKey; label: string; desc: string }[] = [
  { key: "runner_signup", label: "New runner signup", desc: "Fires when a new runner joins." },
  { key: "runner_approval", label: "Runner approval", desc: "Sent to a runner when approved." },
  { key: "task_posted", label: "New assignment posted", desc: "Sent to runners in market." },
  { key: "task_accepted", label: "Assignment accepted", desc: "Sent to the investor." },
  { key: "task_completed", label: "Assignment completed", desc: "Sent to the investor." },
  { key: "message_investor", label: "Message → investor", desc: "Sent to the investor." },
  { key: "message_runner", label: "Message → runner", desc: "Sent to the runner." },
];

function PushTestPage() {
  const send = useServerFn(sendOneSignalTest);
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState<TestEventKey | null>(null);

  async function fire(event: TestEventKey) {
    setPending(event);
    try {
      const res = await send({
        data: { event, targetExternalId: target.trim() || undefined },
      });
      if (res.ok) toast.success(`Sent: ${event}`);
      else toast.error(res.error ?? "Send failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Push notification tests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sends real OneSignal pushes to a target external user ID (defaults to you).
          The recipient must have opened the native iOS/Android app at least once and granted push permission.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target user</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="target">External user ID (Supabase user UUID)</Label>
          <Input
            id="target"
            placeholder="Leave blank to send to yourself"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {EVENTS.map((e) => (
          <Card key={e.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{e.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{e.desc}</p>
              <Button
                size="sm"
                onClick={() => fire(e.key)}
                disabled={pending !== null}
              >
                {pending === e.key ? "Sending…" : "Send test"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}