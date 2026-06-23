import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "open", label: "Posted" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "On site" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
] as const;

export function StatusTimeline({ status }: { status: string }) {
  const normalized =
    status === "paid" ? "approved" :
    status === "revision_requested" ? "in_progress" :
    status;

  const idx = STEPS.findIndex((s) => s.key === normalized);
  const isRevision = status === "revision_requested";

  return (
    <div className="flex items-center gap-1.5 w-full">
      {STEPS.map((step, i) => {
        const done = idx > i;
        const active = idx === i;
        return (
          <div key={step.key} className="flex items-center gap-1.5 min-w-0 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5 min-w-0">
              {done ? (
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
              ) : active ? (
                isRevision ? (
                  <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
                ) : (
                  <span className="size-3.5 rounded-full bg-primary shadow-glow shrink-0" />
                )
              ) : (
                <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className={cn(
                "text-[10px] uppercase tracking-wider whitespace-nowrap",
                done && "text-emerald-300/80",
                active && !isRevision && "text-primary font-semibold",
                active && isRevision && "text-amber-300 font-semibold",
                !done && !active && "text-muted-foreground/60",
              )}>
                {active && isRevision ? "Changes requested" : step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={cn(
                "h-px flex-1 min-w-2",
                done ? "bg-emerald-400/40" : "bg-border",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}