import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Plus, Inbox } from "lucide-react";
import { listConversations } from "@/lib/messages.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesLayout,
});

function MessagesLayout() {
  const fetchFn = useServerFn(listConversations);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchFn(),
    refetchInterval: 30_000,
  });

  const params = useParams({ strict: false }) as { conversationId?: string };
  const activeId = params.conversationId;

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`msgs-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          qc.invalidateQueries({ queryKey: ["conversations"] });
          qc.invalidateQueries({ queryKey: ["conversation", activeId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, activeId]);

  const convs = data?.conversations ?? [];

  return (
    <DashboardShell title="Messages" subtitle="Chat with admins, investors, and runners">
      <div className="grid md:grid-cols-[320px_1fr] gap-4 min-h-[600px]">
        <aside className="border border-border/60 rounded-xl bg-card/40 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Inbox className="size-4" /> Inbox
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link to="/messages/new"><Plus className="size-4 mr-1" /> New</Link>
            </Button>
          </div>
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            ) : convs.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No conversations yet. Start one with the New button.
              </div>
            ) : (
              <ul>
                {convs.map((c: any) => {
                  const others = c.participants.filter((p: any) => p.user_id !== userId);
                  const title =
                    c.subject ||
                    others
                      .map((p: any) => p.profile?.full_name || p.profile?.email || "User")
                      .join(", ") ||
                    "Conversation";
                  return (
                    <li key={c.id}>
                      <Link
                        to="/messages/$conversationId"
                        params={{ conversationId: c.id }}
                        className={cn(
                          "block px-3 py-3 border-b border-border/60 hover:bg-muted/40",
                          activeId === c.id && "bg-muted/60",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{title}</span>
                          {c.unread_count > 0 && (
                            <span className="shrink-0 size-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground grid place-items-center">
                              {c.unread_count > 9 ? "9+" : c.unread_count}
                            </span>
                          )}
                        </div>
                        {c.last_message_preview && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {c.last_message_preview}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNowStrict(new Date(c.last_message_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
        <section className="border border-border/60 rounded-xl bg-card/40 overflow-hidden">
          <Outlet />
        </section>
      </div>
    </DashboardShell>
  );
}
