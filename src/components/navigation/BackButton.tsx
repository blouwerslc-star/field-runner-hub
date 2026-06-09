import { useRouter, useLocation } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

// Top-level routes that use the DashboardShell (which has its own nav).
// The floating Back button is redundant noise on these — hide it on desktop.
const SHELL_PREFIXES = [
  "/dashboard",
  "/admin",
  "/applications",
  "/earnings",
  "/performance",
  "/billing",
  "/activity",
  "/disputes",
  "/settings",
  "/tasks",
  "/profiles",
  "/academy",
  "/messages",
  "/templates",
  "/reviews",
  "/runner-rates",
];

function isShellRoute(pathname: string) {
  // Exact match or prefix match (with /, so "/admin" matches "/admin/foo" but not "/administrate")
  return SHELL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Floating Back button rendered globally. Hidden on the home page.
 * Also hidden on top-level dashboard-shell routes (which have their own nav).
 */
export function BackButton() {
  const router = useRouter();
  const location = useLocation();

  if (location.pathname === "/") return null;
  if (isShellRoute(location.pathname)) return null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="hidden md:inline-flex fixed bottom-4 left-4 z-50 items-center gap-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur px-3.5 py-2 text-sm font-medium text-foreground shadow-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <ArrowLeft className="size-4" />
      <span>Back</span>
    </button>
  );
}