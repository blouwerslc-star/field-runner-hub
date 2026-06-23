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
import { supabase } from "@/integrations/supabase/client";

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
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`task-conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["task-conv-thread", conversationId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["task-conv-thread", conversationId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

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
  const meId = (thread as any)?.currentUserId as string | undefined;
  const participants = ((thread as any)?.participants ?? []) as Array<{
    user_id: string;
    last_read_at: string | null;
  }>;
  // Earliest "last_read_at" among the OTHER participants determines what they've all seen.
  const otherReads = participants
    .filter((p) => p.user_id !== meId)
    .map((p) => (p.last_read_at ? new Date(p.last_read_at).getTime() : 0));
  const othersLastReadMs = otherReads.length ? Math.min(...otherReads) : 0;
  // Find the latest of my messages that's been seen — we only render the receipt under that one.
  let lastSeenMineId: string | null = null;
  for (const m of messages) {
    if (m.sender_id === meId && new Date(m.created_at).getTime() <= othersLastReadMs) {
      lastSeenMineId = m.id;
    }
  }

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
            const mine = meId ? m.sender_id === meId : false;
            const senderName = m.sender?.full_name ?? m.sender?.email ?? "User";
            const showSeen = mine && m.id === lastSeenMineId;
            return (
              <div key={m.id} className={`text-sm flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  {senderName} · {new Date(m.created_at).toLocaleString()}
                </div>
                <div
                  className={`rounded-lg px-3 py-2 whitespace-pre-wrap max-w-[85%] ${
                    mine ? "bg-primary/15 text-foreground" : "bg-muted/30"
                  }`}
                >
                  {m.body}
                </div>
                {showSeen && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">Seen</div>
                )}
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