import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, UserCog, Compass, Settings, MessageSquare, Store, Briefcase, Wallet } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUnreadCount } from "@/lib/messages.functions";

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const unreadFn = useServerFn(getUnreadCount);
  const { data: unread } = useQuery({
    queryKey: ["messages-unread"],
    queryFn: () => unreadFn(),
    refetchInterval: 60_000,
  });
  const unreadTotal = unread?.total ?? 0;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/profiles"><Compass className="size-4 mr-1.5" /> Browse</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks"><Store className="size-4 mr-1.5" /> Marketplace</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/applications"><Briefcase className="size-4 mr-1.5" /> Applications</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/billing"><Wallet className="size-4 mr-1.5" /> Billing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="relative">
              <Link to="/messages">
                <MessageSquare className="size-4 mr-1.5" /> Messages
                {unreadTotal > 0 && (
                  <span className="ml-1.5 size-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground grid place-items-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/profile/edit"><UserCog className="size-4 mr-1.5" /> My profile</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/settings"><Settings className="size-4 mr-1.5" /> Settings</Link>
            </Button>
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 md:py-14">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}