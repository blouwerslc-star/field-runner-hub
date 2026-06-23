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
 * Shared mobile drawer used by both marketing and authenticated app shells.
 *
 * This intentionally does not use a portal or Radix Dialog/Sheet. Android
 * Chrome/WebView was rendering only the scrim layer for those menu surfaces,
 * which made the menu look like an empty dark screen. Fixed layers + explicit
 * z-indexes + inline transform avoid that compositor bug consistently.
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

    const timeout = window.setTimeout(() => setMounted(false), 220);
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
      aria-hidden={!open}
      className={cn(responsiveClass, "fixed inset-0 z-[80]")}
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm"
        style={{
          opacity: open ? 1 : 0,
          transition: "opacity 180ms ease-out",
        }}
      />
      <aside
        id={id}
        data-state={state}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-[81] flex w-[min(22rem,88vw)] max-w-[88vw] flex-col border-l border-border/60 bg-card text-card-foreground shadow-2xl pt-safe",
          className,
        )}
        style={{
          height: "100dvh",
          maxHeight: "100dvh",
          transform: open ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
          transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
          // NOTE: do NOT add `contain: paint/layout` or `backface-visibility`
          // here. Several Android Chrome / WebView builds skip painting the
          // drawer's children (leaving an empty dark panel) when those props
          // combine with `position: fixed` + `transform`. Plain transform is
          // safe everywhere.
          isolation: "isolate",
          opacity: 1,
        }}
      >
        {children}
      </aside>
    </div>
  );
}