import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  id: string;
  label: string;
  children: ReactNode;
  hiddenAt?: "md" | "xl";
  className?: string;
};

/**
 * Shared mobile menu used by both marketing and authenticated app shells.
 *
 * Keep this intentionally plain. Some Android Chrome/WebView builds fail to
 * paint children inside animated fixed/translated drawers, which shows users a
 * blank dark screen. A single fixed full-screen surface with no transform is the
 * most reliable rendering path across browser and downloaded-app contexts.
 */
export function MobileDrawer({
  open,
  onClose,
  id,
  label,
  children,
  hiddenAt = "xl",
  className,
}: MobileDrawerProps) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => setMounted(false), 120);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "contain";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const state = open ? "open" : "closed";
  const responsiveClass = hiddenAt === "md" ? "md:hidden" : "xl:hidden";

  return (
    <div
      data-mobile-drawer-root="true"
      data-state={state}
      className={cn(responsiveClass, "fixed inset-0 z-[90] bg-background text-foreground")}
      style={{
        height: "100dvh",
        minHeight: "100vh",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <aside
        id={id}
        data-state={state}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground pt-safe", className)}
      >
        {children}
      </aside>
    </div>
  );
}