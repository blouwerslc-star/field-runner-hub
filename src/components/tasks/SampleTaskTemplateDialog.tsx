import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Briefcase, ClipboardCheck, Camera, DollarSign, MapPin, Clock } from "lucide-react";
import type { SampleTemplate } from "@/lib/sample-task-templates";

export type SampleSummary = {
  task_type: string;
  title: string;
  city: string;
  state: string;
  payout: number;
};

export function SampleTaskTemplateDialog({
  open,
  onOpenChange,
  sample,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sample: SampleSummary | null;
  template: SampleTemplate | null;
}) {
  const isMobile = useIsMobile();
  if (!sample || !template) return null;

  const header = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/15 text-primary border border-primary/40 px-2.5 py-1 text-xs font-medium">
          {sample.task_type}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-muted/40 text-foreground/80 px-2 py-0.5 text-[11px] uppercase tracking-wide">
          Example template
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/75">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {sample.city}, {sample.state}</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary"><DollarSign className="size-3.5" /> ~${sample.payout}</span>
      </div>
    </div>
  );

  const body = (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="size-4 text-primary" />
          <h3 className="font-semibold text-base">Investor brief</h3>
        </div>
        <p className="text-sm text-foreground/80">{template.investor.summary}</p>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/70">What you fill in</h4>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/85 list-disc pl-5 marker:text-primary/70">
          {template.investor.fields.map((f) => <li key={f}>{f}</li>)}
        </ul>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/70">What you get back</h4>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/85 list-disc pl-5 marker:text-primary/70">
          {template.investor.deliverables.map((d) => <li key={d}>{d}</li>)}
        </ul>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 text-xs font-medium">
          <DollarSign className="size-3.5" /> Typical payout {template.investor.typicalPayout}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCheck className="size-4 text-primary" />
          <h3 className="font-semibold text-base">Runner checklist</h3>
        </div>
        <p className="text-sm text-foreground/80">{template.runner.summary}</p>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/70">Step-by-step</h4>
        <ol className="mt-2 space-y-1.5 text-sm text-foreground/85 list-decimal pl-5 marker:text-primary marker:font-semibold">
          {template.runner.checklist.map((s) => <li key={s}>{s}</li>)}
        </ol>

        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/70 inline-flex items-center gap-1.5">
          <Camera className="size-3.5" /> Required captures
        </h4>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/85 list-disc pl-5 marker:text-primary/70">
          {template.runner.photoRequirements.map((p) => <li key={p}>{p}</li>)}
        </ul>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 text-xs font-medium">
          <Clock className="size-3.5" /> {template.runner.estTime}
        </div>
      </section>
    </div>
  );

  const footer = (
    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-foreground/65">Example only — not a live task. Real tasks open as markets launch.</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          <Link to="/runners">Become a Runner</Link>
        </Button>
        <Button asChild size="sm" onClick={() => onOpenChange(false)}>
          <Link to="/investors">Post a Task</Link>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg">{sample.title}</SheetTitle>
            <SheetDescription asChild><div>{header}</div></SheetDescription>
          </SheetHeader>
          <div className="mt-4">{body}</div>
          <div className="mt-4">{footer}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{sample.title}</DialogTitle>
          <DialogDescription asChild><div>{header}</div></DialogDescription>
        </DialogHeader>
        <div className="mt-2">{body}</div>
        {footer}
      </DialogContent>
    </Dialog>
  );
}