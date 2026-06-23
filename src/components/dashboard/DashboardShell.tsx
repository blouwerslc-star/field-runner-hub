import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, UserCog, Compass, Settings, MessageSquare, Store, Briefcase, Wallet, Activity, ShieldAlert, Menu, DollarSign, BarChart3, ShieldCheck, GraduationCap, ShieldEllipsis, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUnreadCount } from "@/lib/messages.functions";
import { useEffect, useState } from "react";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { MobileDrawer } from "@/components/navigation/MobileDrawer";

const NAV_ITEMS = [
  { to: "/profiles", label: "Browse", icon: Compass },
  { to: "/tasks", label: "Marketplace", icon: Store },
  { to: "/academy", label: "Academy", icon: GraduationCap },
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

const ADMIN_NAV_ITEM = { to: "/admin", label: "Admin", icon: ShieldEllipsis } as const;

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
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const unreadFn = useServerFn(getUnreadCount);
  const { data: unread } = useQuery({
    queryKey: ["messages-unread"],
    queryFn: async () => {
      try {
        return await unreadFn();
      } catch {
        return { total: 0 };
      }
    },
    refetchInterval: 60_000,
    retry: false,
    enabled: typeof window !== "undefined",
  });
  const unreadTotal = unread?.total ?? 0;

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!roles);
    })();
    return () => { cancelled = true; };
  }, []);

  const navItems = isAdmin ? [ADMIN_NAV_ITEM, ...NAV_ITEMS] : NAV_ITEMS;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-safe">
      <Toaster richColors closeButton position="top-center" theme="dark" />
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/dashboard" aria-label="REI Runner home">
            <BrandLogo />
          </Link>
          {/* Desktop nav (xl+) */}
          <div className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <Button key={item.to} asChild variant="ghost" size="sm" className="relative">
                <Link to={item.to}>
                  <item.icon className={`size-4 mr-1.5 ${item.to === "/admin" ? "text-primary" : ""}`} /> {item.label}
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
            <Button asChild variant="ghost" size="icon" className="relative min-h-11 min-w-11">
              <Link to="/messages" aria-label="Messages">
                <MessageSquare className="size-5" />
                {unreadTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground grid place-items-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </Link>
            </Button>
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-drawer"
              className="min-h-11 min-w-11"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} id="mobile-drawer" label="Menu">
          <div className="flex items-center justify-between p-5 border-b border-border/60">
            <span className="text-lg font-semibold">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-muted/60 transition-colors"
              >
                <item.icon className={`size-4 ${item.to === "/admin" ? "text-primary" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
                {item.to === "/messages" && unreadTotal > 0 && (
                  <span className="ml-auto size-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground grid place-items-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-border/60 pb-safe">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setOpen(false); signOut(); }}>
              <LogOut className="size-4 mr-2" /> Sign out
            </Button>
          </div>
      </MobileDrawer>

      <main className="mx-auto max-w-5xl px-5 pt-8 pb-28 md:py-14">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
      <MobileBottomNav onOpenMenu={() => setOpen(true)} unreadTotal={unreadTotal} />
    </div>
  );
}