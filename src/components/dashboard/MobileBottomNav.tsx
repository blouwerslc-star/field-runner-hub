import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Store, MessageSquare, UserCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  match?: (path: string) => boolean;
};

const ITEMS: Item[] = [
  {
    to: "/dashboard",
    label: "Home",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard" || p.startsWith("/dashboard/") || p.endsWith("-dashboard"),
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: Store,
    match: (p) => p === "/tasks" || p.startsWith("/tasks/"),
  },
  {
    to: "/messages",
    label: "Inbox",
    icon: MessageSquare,
    match: (p) => p.startsWith("/messages"),
  },
  {
    to: "/profile/edit",
    label: "Profile",
    icon: UserCircle,
    match: (p) => p.startsWith("/profile"),
  },
];

export function MobileBottomNav({
  onOpenMenu,
  unreadTotal = 0,
}: {
  onOpenMenu: () => void;
  unreadTotal?: number;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="xl:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto max-w-md grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match ? item.match(path) : path === item.to;
          const isMessages = item.to === "/messages";
          return (
            <li key={item.to} className="contents">
              <Link
                to={item.to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 min-h-14 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                <span className="leading-none">{item.label}</span>
                {isMessages && unreadTotal > 0 && (
                  <span className="absolute top-1.5 right-[28%] size-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground grid place-items-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                  />
                )}
              </Link>
            </li>
          );
        })}
        <li className="contents">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open full menu"
            className="flex flex-col items-center justify-center gap-0.5 min-h-14 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="size-5" aria-hidden />
            <span className="leading-none">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}