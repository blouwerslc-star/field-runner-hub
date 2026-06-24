import { useRef, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Briefcase, ClipboardCheck, DollarSign, Clock, Sparkles } from "lucide-react";
import type { ServiceExample } from "@/lib/landing-service-examples";

/**
 * Shared hover-or-click popover behavior used across landing-page items.
 * - Desktop: opens on mouseenter/focus AND on click, closes after a brief delay on mouseleave.
 * - Mobile: tap opens a bottom sheet (no hover).
 * - Keyboard: Enter / Space toggles, Esc closes.
 */
function useHoverClickPopover() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return {
    open,
    setOpen,
    triggerHandlers: {
      onMouseEnter: () => {
        clearClose();
        setOpen(true);
      },
      onMouseLeave: scheduleClose,
      onFocus: () => {
        clearClose();
        setOpen(true);
      },
      onBlur: scheduleClose,
      onClick: () => {
        clearClose();
        setOpen((v) => !v);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
        } else if (e.key === "Escape") {
          setOpen(false);
        }
      },
    },
    contentHandlers: {
      onMouseEnter: clearClose,
      onMouseLeave: scheduleClose,
    },
  };
}

function ExampleBody({ example }: { example: ServiceExample }) {
  return (
    <div className="grid gap-3">
      <section className="rounded-lg border border-border bg-card/60 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Briefcase className="size-3.5 text-primary" />
          <h4 className="text-sm font-semibold">Investor posts</h4>
        </div>
        <p className="text-xs text-foreground/80">{example.investor.summary}</p>
        <ul className="mt-2 space-y-1 text-xs text-foreground/85 list-disc pl-4 marker:text-primary/70">
          {example.investor.fields.map((f) => <li key={f}>{f}</li>)}
        </ul>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 text-[11px] font-medium">
          <DollarSign className="size-3" /> {example.investor.typicalPayout}
        </div>
      </section>
      <section className="rounded-lg border border-border bg-card/60 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <ClipboardCheck className="size-3.5 text-primary" />
          <h4 className="text-sm font-semibold">Runner does</h4>
        </div>
        <p className="text-xs text-foreground/80">{example.runner.summary}</p>
        <ol className="mt-2 space-y-1 text-xs text-foreground/85 list-decimal pl-4 marker:text-primary marker:font-semibold">
          {example.runner.checklist.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[11px] font-medium">
          <Clock className="size-3" /> {example.runner.estTime}
        </div>
      </section>
    </div>
  );
}

export function ServiceExamplePopover({
  title,
  example,
  children,
}: {
  title: string;
  example: ServiceExample;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const hov = useHoverClickPopover();

  if (isMobile) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => hov.setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              hov.setOpen(true);
            }
          }}
          aria-label={`Preview example: ${title}`}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
        >
          {children}
        </div>
        <Sheet open={hov.open} onOpenChange={hov.setOpen}>
          <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="text-left">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>Example of what investors post and what runners do.</SheetDescription>
            </SheetHeader>
            <div className="mt-4"><ExampleBody example={example} /></div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={hov.open} onOpenChange={hov.setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Preview example: ${title}`}
          aria-expanded={hov.open}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
          {...hov.triggerHandlers}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-4"
        align="center"
        side="top"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...hov.contentHandlers}
      >
        <div className="mb-2">
          <p className="text-xs uppercase tracking-wide text-foreground/60">Example template</p>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <ExampleBody example={example} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Generic hover/tap example popover for any landing-page item.
 * Renders a small panel with a 1-line body and optional bullets / footer.
 */
export type LandingExample = {
  title: string;
  eyebrow?: string;
  body: string;
  bullets?: string[];
  footer?: string;
};

function GenericExampleBody({ ex }: { ex: LandingExample }) {
  return (
    <div>
      <p className="text-xs text-foreground/80">{ex.body}</p>
      {ex.bullets && ex.bullets.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-foreground/85 list-disc pl-4 marker:text-primary/70">
          {ex.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}
      {ex.footer && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 text-[11px] font-medium">
          <Sparkles className="size-3" /> {ex.footer}
        </div>
      )}
    </div>
  );
}

export function LandingExamplePopover({
  example,
  children,
  contentClassName,
}: {
  example: LandingExample;
  children: ReactNode;
  contentClassName?: string;
}) {
  const isMobile = useIsMobile();
  const hov = useHoverClickPopover();

  if (isMobile) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => hov.setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              hov.setOpen(true);
            }
          }}
          aria-label={`Preview example: ${example.title}`}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
        >
          {children}
        </div>
        <Sheet open={hov.open} onOpenChange={hov.setOpen}>
          <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="text-left">
              <SheetTitle>{example.title}</SheetTitle>
              {example.eyebrow && <SheetDescription>{example.eyebrow}</SheetDescription>}
            </SheetHeader>
            <div className="mt-4"><GenericExampleBody ex={example} /></div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={hov.open} onOpenChange={hov.setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Preview example: ${example.title}`}
          aria-expanded={hov.open}
          className={`cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl ${contentClassName ?? ""}`}
          {...hov.triggerHandlers}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4"
        align="center"
        side="top"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...hov.contentHandlers}
      >
        <div className="mb-2">
          {example.eyebrow && <p className="text-xs uppercase tracking-wide text-foreground/60">{example.eyebrow}</p>}
          <h3 className="text-base font-semibold">{example.title}</h3>
        </div>
        <GenericExampleBody ex={example} />
      </PopoverContent>
    </Popover>
  );
}