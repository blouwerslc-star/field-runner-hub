import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listMessageableUsers, startConversation } from "@/lib/messages.functions";
import { X } from "lucide-react";

const searchSchema = z
  .object({
    taskId: z.string().uuid().optional(),
    to: z.string().uuid().optional(),
  })
  .partial();

export const Route = createFileRoute("/_authenticated/messages/new")({
  validateSearch: (s) => searchSchema.parse(s),
  component: NewMessage,
});

function NewMessage() {
  const navigate = useNavigate();
  const { taskId, to } = useSearch({ from: "/_authenticated/messages/new" });
  const listFn = useServerFn(listMessageableUsers);
  const startFn = useServerFn(startConversation);

  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<Array<{ user_id: string; full_name: string | null; email: string | null }>>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data } = useQuery({
    queryKey: ["messageable-users", search],
    queryFn: () => listFn({ data: { search } }),
  });

  // Pre-fill recipient if `?to=<userId>` is provided
  useEffect(() => {
    if (!to) return;
    if (recipients.some((r) => r.user_id === to)) return;
    listFn({ data: { search: "" } }).then((res) => {
      const match = (res?.users ?? []).find((u: any) => u.user_id === to);
      if (match) {
        setRecipients((prev) =>
          prev.some((r) => r.user_id === to) ? prev : [...prev, match],
        );
      } else {
        // Fallback: add a stub so the message can still send
        setRecipients((prev) =>
          prev.some((r) => r.user_id === to)
            ? prev
            : [...prev, { user_id: to, full_name: "Selected user", email: null }],
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  const start = useMutation({
    mutationFn: () =>
      startFn({
        data: {
          recipientIds: recipients.map((r) => r.user_id),
          subject: subject || null,
          taskId: taskId ?? null,
          body,
        },
      }),
    onSuccess: ({ conversationId }) => {
      toast.success("Message sent");
      navigate({ to: "/messages/$conversationId", params: { conversationId } });
    },
    onError: (e: any) => toast.error(e.message || "Failed to send"),
  });

  const users = data?.users ?? [];

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">New conversation</h2>
        {taskId && (
          <p className="text-xs text-muted-foreground mt-1">Linked to task {taskId.slice(0, 8)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Recipients</Label>
        {recipients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {recipients.map((r) => (
              <Badge key={r.user_id} variant="secondary" className="gap-1">
                {r.full_name || r.email || "User"}
                <button
                  type="button"
                  onClick={() => setRecipients((prev) => prev.filter((x) => x.user_id !== r.user_id))}
                  aria-label="Remove"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <div className="border border-border/60 rounded-md max-h-48 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No matches</div>
            ) : (
              users
                .filter((u: any) => !recipients.some((r) => r.user_id === u.user_id))
                .map((u: any) => (
                  <button
                    key={u.user_id}
                    type="button"
                    onClick={() => {
                      setRecipients((prev) => [...prev, u]);
                      setSearch("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted/40 text-sm"
                  >
                    <div className="font-medium">{u.full_name || u.email}</div>
                    {u.city && (
                      <div className="text-xs text-muted-foreground">
                        {u.city}{u.state ? `, ${u.state}` : ""}
                      </div>
                    )}
                  </button>
                ))
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Subject (optional)</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
      </div>

      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Write your message…"
        />
      </div>

      <Button
        onClick={() => start.mutate()}
        disabled={start.isPending || recipients.length === 0 || body.trim().length === 0}
      >
        {start.isPending ? "Sending…" : "Send message"}
      </Button>
    </div>
  );
}
