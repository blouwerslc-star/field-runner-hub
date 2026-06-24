import { useState, type ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Briefcase, ClipboardCheck, DollarSign, Clock } from "lucide-react";
import type { ServiceExample } from "@/lib/landing-service-examples";

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
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          aria-label={`Preview example: ${title}`}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
        >
          {children}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
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
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <div tabIndex={0} aria-label={`Preview example: ${title}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-96 p-4" align="center" side="top">
        <div className="mb-2">
          <p className="text-xs uppercase tracking-wide text-foreground/60">Example template</p>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <ExampleBody example={example} />
      </HoverCardContent>
    </HoverCard>
  );
}