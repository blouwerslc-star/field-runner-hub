import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listNotifications, markNotificationRead } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";

export function NotificationBell() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(listNotifications);
  const markFn = useServerFn(markNotificationRead);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchFn(),
    refetchInterval: 60_000,
    enabled: !!userId,
  });

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const notifs = data?.notifications ?? [];
  const unread = notifs.filter((n) => !n.read_at).length;

  async function markAll() {
    await markFn({ data: { all: true } });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function markOne(id: string) {
    await markFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 size-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAll}>
              <Check className="size-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        {notifs.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          <ul>
            {notifs.map((n) => (
              <li
                key={n.id}
                className={`px-3 py-2.5 border-b border-border/60 hover:bg-muted/40 cursor-pointer ${
                  n.read_at ? "opacity-60" : ""
                }`}
                onClick={() => {
                  if (!n.read_at) markOne(n.id);
                  if (n.link) window.location.href = n.link;
                }}
              >
                <div className="text-sm font-medium">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
