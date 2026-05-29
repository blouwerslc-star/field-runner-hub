import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { cn } from "@/lib/utils";
import {
  User, UserCircle, ShieldCheck, Bell, Lock, Wallet, Settings as SettingsIcon, LifeBuoy, ShieldAlert,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsLayout,
  head: () => ({ meta: [{ title: "Settings — REI Runner" }] }),
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Couldn't load settings: {error.message}</div>
  ),
});

const NAV = [
  { to: "/settings/account", label: "Account", icon: User },
  { to: "/settings/profile", label: "Profile", icon: UserCircle },
  { to: "/settings/security", label: "Security", icon: ShieldCheck },
  { to: "/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/settings/privacy", label: "Privacy", icon: Lock },
  { to: "/settings/payments", label: "Payments", icon: Wallet },
  { to: "/settings/preferences", label: "Preferences", icon: SettingsIcon },
  { to: "/settings/support", label: "Help & Support", icon: LifeBuoy },
] as const;

function SettingsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const fetchSettings = useServerFn(getMySettings);
  const { data } = useQuery({ queryKey: ["mySettings"], queryFn: () => fetchSettings() });
  const roles = data?.roles ?? [];
  const isAdmin = roles.includes("admin");

  const nav = [
    ...NAV,
    ...(isAdmin
      ? [{ to: "/settings/admin", label: "Admin", icon: ShieldAlert } as const]
      : []),
  ];

  return (
    <DashboardShell title="Settings" subtitle="Manage your account, preferences and platform options.">
      {/* Mobile tabs */}
      <nav className="md:hidden -mx-5 px-5 mb-6 overflow-x-auto">
        <ul className="flex gap-1 min-w-max">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap border",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <nav className="sticky top-24 space-y-1">
            {nav.map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </DashboardShell>
  );
}