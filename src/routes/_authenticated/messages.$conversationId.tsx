import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Paperclip, Send, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  createMessageAttachmentUploadUrl,
  getConversation,
  sendMessage,
} from "@/lib/messages.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages/$conversationId")({
  component: ConversationView,
});

type Pending = { path: string; filename: string; mime_type: string; size_bytes: number };

function ConversationView() {
  const { conversationId } = Route.useParams();
  const getFn = useServerFn(getConversation);
  const sendFn = useServerFn(sendMessage);
  const uploadFn = useServerFn(createMessageAttachmentUploadUrl);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getFn({ data: { conversationId } }),
    refetchInterval: 15_000,
  });

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const [body, setBody] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [data?.messages.length]);

  const send = useMutation({
    mutationFn: () =>
      sendFn({
        data: {
          conversationId,
          body,
          attachments: pending.map((p) => ({
            path: p.path,
            filename: p.filename,
            mime_type: p.mime_type,
            size_bytes: p.size_bytes,
          })),
        },
      }),
    onSuccess: () => {
      setBody("");
      setPending([]);
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages-unread"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to send"),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 25MB limit`);
          continue;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._\- ]/g, "_");
        const { path, bucket, token } = await uploadFn({ data: { filename: safeName } });
        const { error } = await supabase.storage
          .from(bucket)
          .uploadToSignedUrl(path, token, file);
        if (error) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        setPending((prev) => [
          ...prev,
          { path, filename: file.name, mime_type: file.type, size_bytes: file.size },
        ]);
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Not found.</div>;

  const others = data.participants.filter((p) => p.user_id !== userId);
  const heading =
    data.conversation.subject ||
    others.map((p) => p.profile?.full_name || p.profile?.email || "User").join(", ");

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base">{heading}</h2>
          {data.task && (
            <p className="text-xs text-muted-foreground">
              Task: <span className="text-foreground">{data.task.title}</span>
              {data.task.city ? ` · ${data.task.city}` : ""}
            </p>
          )}
        </div>
        <div className="flex -space-x-2">
          {others.slice(0, 4).map((p) => (
            <Link
              key={p.user_id}
              to="/profile/$slug"
              params={{ slug: p.profile?.profile_slug || p.user_id }}
              className="size-7 rounded-full bg-muted border border-background grid place-items-center text-xs font-medium overflow-hidden"
              title={p.profile?.full_name || ""}
            >
              {p.profile?.profile_photo_url ? (
                <img src={p.profile.profile_photo_url} alt="" className="size-full object-cover" />
              ) : (
                (p.profile?.full_name || p.profile?.email || "U").charAt(0).toUpperCase()
              )}
            </Link>
          ))}
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        {data.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          data.messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {!mine && (
                    <div className="text-[11px] font-medium opacity-75 mb-1">
                      {m.sender?.full_name || m.sender?.email || "User"}
                    </div>
                  )}
                  {m.body}
                  {m.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.attachments.map((a: any) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs underline underline-offset-2"
                        >
                          <FileText className="size-3" />
                          {a.filename || a.path.split("/").pop()}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {format(new Date(m.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border/60 p-3 space-y-2">
        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <span
                key={p.path}
                className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-md px-2 py-1"
              >
                <FileText className="size-3" /> {p.filename}
                <button
                  type="button"
                  onClick={() => setPending((prev) => prev.filter((x) => x.path !== p.path))}
                  aria-label="Remove"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            aria-label="Attach file"
          >
            <Paperclip className="size-4" />
          </Button>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            rows={2}
            maxLength={5000}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (body.trim()) send.mutate();
              }
            }}
          />
          <Button
            onClick={() => send.mutate()}
            disabled={send.isPending || body.trim().length === 0}
            size="icon"
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
