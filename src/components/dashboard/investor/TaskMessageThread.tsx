import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getOrCreateTaskConversation } from "@/lib/task-conversations.functions";
import { getConversation, sendMessage } from "@/lib/messages.functions";
import { Link } from "@tanstack/react-router";

export function TaskMessageThread({
  taskId,
  hasRunner,
}: {
  taskId: string;
  hasRunner: boolean;
}) {
  const qc = useQueryClient();
  const ensureFn = useServerFn(getOrCreateTaskConversation);
  const fetchConv = useServerFn(getConversation);
  const sendFn = useServerFn(sendMessage);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ["task-conv", taskId],
    queryFn: () => ensureFn({ data: { taskId } }),
    enabled: hasRunner,
    staleTime: 30_000,
  });
  const conversationId = convData?.conversationId ?? null;

  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ["task-conv-thread", conversationId],
    queryFn: () => fetchConv({ data: { conversationId: conversationId! } }),
    enabled: !!conversationId,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread?.messages?.length]);

  const send = useMutation({
    mutationFn: (text: string) =>
      sendFn({ data: { conversationId: conversationId!, body: text } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["task-conv-thread", conversationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!hasRunner) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground flex items-center gap-2">
        <MessageSquare className="size-4" />
        Messaging unlocks once a runner is assigned.
      </div>
    );
  }

  if (convLoading || threadLoading) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading thread…
      </div>
    );
  }

  const messages = thread?.messages ?? [];
  const meSenderId = messages.find(() => true)?.sender_id; // placeholder; we just compare via class below

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4 text-primary" /> Task messages
        </div>
        {conversationId && (
          <Link
            to="/messages/$conversationId"
            params={{ conversationId }}
            className="text-xs text-primary hover:underline"
          >
            Open in inbox →
          </Link>
        )}
      </div>
      <div ref={scrollRef} className="max-h-72 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No messages yet. Send the first one.
          </p>
        ) : (
          messages.map((m: any) => {
            const mine = m.sender_id === (thread as any)?.conversation?.created_by
              ? false
              : undefined;
            // visual differentiation by sender id
            const senderName = m.sender?.full_name ?? m.sender?.email ?? "User";
            return (
              <div key={m.id} className="text-sm">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  {senderName} · {new Date(m.created_at).toLocaleString()}
                </div>
                <div className="rounded-lg bg-muted/30 px-3 py-2 whitespace-pre-wrap">{m.body}</div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-3 border-t border-border flex gap-2 items-end">
        <Textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Send a quick note…"
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && body.trim()) {
              send.mutate(body.trim());
            }
          }}
        />
        <Button
          size="sm"
          disabled={!body.trim() || send.isPending || !conversationId}
          onClick={() => send.mutate(body.trim())}
        >
          {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}