import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, UserCog, Compass, Settings, MessageSquare, Store, Briefcase, Wallet, Activity, ShieldAlert, Menu, DollarSign, BarChart3, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUnreadCount } from "@/lib/messages.functions";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/profiles", label: "Browse", icon: Compass },
  { to: "/tasks", label: "Marketplace", icon: Store },
  { to: "/applications", label: "Applications", icon: Briefcase },
  { to: "/earnings", label: "Earnings", icon: DollarSign },
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/billing", label: "Billing", icon: Wallet },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/disputes", label: "Disputes", icon: ShieldAlert },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/profile/verification", label: "Get Verified", icon: ShieldCheck },
  { to: "/profile/edit", label: "My profile", icon: UserCog },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

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
  const [open, setOpen] = useState(false);
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
          {/* Desktop nav (xl+) */}
          <div className="hidden xl:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Button key={item.to} asChild variant="ghost" size="sm" className="relative">
                <Link to={item.to}>
                  <item.icon className="size-4 mr-1.5" /> {item.label}
                  {item.to === "/messages" && unreadTotal > 0 && (
                    <span className="ml-1.5 size-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground grid place-items-center">
                      {unreadTotal > 9 ? "9+" : unreadTotal}
                    </span>
                  )}
                </Link>
              </Button>
            ))}
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4 mr-1.5" /> Sign out
            </Button>
          </div>
          {/* Mobile + tablet nav (<xl) */}
          <div className="flex xl:hidden items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="relative">
              <Link to="/messages" aria-label="Messages">
                <MessageSquare className="size-4" />
                {unreadTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground grid place-items-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </Link>
            </Button>
            <NotificationBell />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 flex flex-col">
                <SheetHeader className="p-5 border-b border-border/60">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors"
                    >
                      <item.icon className="size-4 text-muted-foreground" />
                      <span>{item.label}</span>
                      {item.to === "/messages" && unreadTotal > 0 && (
                        <span className="ml-auto size-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground grid place-items-center">
                          {unreadTotal > 9 ? "9+" : unreadTotal}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
                <div className="p-3 border-t border-border/60">
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setOpen(false); signOut(); }}>
                    <LogOut className="size-4 mr-2" /> Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
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