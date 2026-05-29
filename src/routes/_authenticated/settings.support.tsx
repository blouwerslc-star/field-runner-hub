import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send, FileText, ExternalLink } from "lucide-react";
import { listMySupportRequests, submitSupportRequest } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SettingsCard, SettingsHeader } from "@/components/settings/SettingsSection";

export const Route = createFileRoute("/_authenticated/settings/support")({
  component: SupportSettings,
});

type Cat = "question" | "bug" | "dispute" | "billing" | "other";

function SupportSettings() {
  const submit = useServerFn(submitSupportRequest);
  const list = useServerFn(listMySupportRequests);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["mySupportRequests"], queryFn: () => list() });

  const [category, setCategory] = useState<Cat>("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const mut = useMutation({
    mutationFn: () => submit({ data: { category, subject, message } }),
    onSuccess: () => {
      toast.success("Support request submitted");
      setSubject("");
      setMessage("");
      setCategory("question");
      qc.invalidateQueries({ queryKey: ["mySupportRequests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requests = data?.requests ?? [];

  return (
    <div>
      <SettingsHeader title="Help & Support" description="Get help, report problems, or open a dispute." />

      <SettingsCard
        title="Contact support"
        footer={
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || subject.length < 3 || message.length < 10}
          >
            {mut.isPending ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Send className="size-3.5 mr-1.5" />}
            Submit
          </Button>
        }
      >
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v: Cat) => setCategory(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="question">General question</SelectItem>
              <SelectItem value="bug">Report a problem</SelectItem>
              <SelectItem value="dispute">Dispute a task</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} />
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={4000} />
        </div>
      </SettingsCard>

      <SettingsCard title="Your recent requests">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No support requests yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {requests.map((r) => (
              <li key={r.id} className="py-3 flex items-start gap-3">
                <FileText className="size-4 mt-0.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-sm truncate">{r.subject}</div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {r.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {r.category} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title="Resources">
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/faq" className="inline-flex items-center gap-1.5 hover:underline">
              <ExternalLink className="size-3.5" /> FAQ
            </Link>
          </li>
          <li>
            <Link to="/terms" className="inline-flex items-center gap-1.5 hover:underline">
              <ExternalLink className="size-3.5" /> Terms of Service
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="inline-flex items-center gap-1.5 hover:underline">
              <ExternalLink className="size-3.5" /> Privacy Policy
            </Link>
          </li>
          <li className="text-muted-foreground">
            Contractor agreement — available on request via support.
          </li>
        </ul>
      </SettingsCard>
    </div>
  );
}