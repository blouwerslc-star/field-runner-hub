import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Store,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { readAuthHint, setAuthHint } from "@/lib/auth-hint";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Store;
};

const PUBLIC_NAV: NavItem[] = [
  { to: "/tasks", label: "Marketplace", icon: Store },
  { to: "/profiles", label: "Browse", icon: Search },
  { to: "/pricing", label: "Pricing", icon: Briefcase },
  { to: "/trust", label: "Trust", icon: ShieldCheck },
];

const AUTH_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Marketplace", icon: Store },
  { to: "/profiles", label: "Browse", icon: Search },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

const JOIN_NAV: NavItem[] = [
  { to: "/investors", label: "For Investors", icon: Users },
  { to: "/runners", label: "For Runners", icon: UserPlus },
];

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SiteHeader({
  currentPath = "",
  className,
}: {
  currentPath?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(() => (readAuthHint() ? "pending" : null));

  useEffect(() => {
    let cancelled = false;

    const applySession = (id: string | null) => {
      setAuthHint(!!id);
      if (!cancelled) setUserId(id);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session?.user.id ?? null))
      .catch(() => applySession(null));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const isAuthed = !!userId;
  const primaryNav = isAuthed ? AUTH_NAV : PUBLIC_NAV;
  const mobileNav = isAuthed ? AUTH_NAV : [...PUBLIC_NAV, ...JOIN_NAV];

  async function signOut() {
    setOpen(false);
    setAuthHint(false);
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className={cn("sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border/60", className)}>
      <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between gap-4">
        <Link to={isAuthed ? "/dashboard" : "/"} aria-label="REI Runner home" className="shrink-0">
          <BrandLogo />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {primaryNav.map((item) => (
            <Button
              key={item.to}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "text-muted-foreground hover:text-foreground",
                isActive(currentPath, item.to) && "text-foreground bg-muted/60",
              )}
            >
              <Link to={item.to as any}>
                <item.icon className="size-4 mr-1.5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {isAuthed ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4 mr-1.5" />
              Sign out
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
                <Link to="/signup" search={{ role: "investor", redirect: "/dashboard/investor" }}>
                  Create account
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="lg:hidden ml-auto">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="min-h-11 min-w-11">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:max-w-sm p-0 flex flex-col">
              <SheetHeader className="p-5 border-b border-border/60">
                <SheetTitle className="text-left">
                  <BrandLogo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {mobileNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors",
                      isActive(currentPath, item.to)
                        ? "bg-muted/70 text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-3 border-t border-border/60">
                {isAuthed ? (
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
                    <LogOut className="size-4 mr-2" />
                    Sign out
                  </Button>
                ) : (
                  <div className="grid gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-gradient-primary shadow-glow">
                      <Link
                        to="/signup"
                        search={{ role: "investor", redirect: "/dashboard/investor" }}
                        onClick={() => setOpen(false)}
                      >
                        Create account
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
