import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SLABadge({ dueDate, status }: { dueDate: string | null; status: string }) {
  if (!dueDate) return null;
  if (status === "approved" || status === "paid") return null;

  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round(diffMs / dayMs);
  const overdue = diffMs < 0;
  const urgent = !overdue && diffMs < 2 * dayMs;

  let text: string;
  if (overdue) {
    const od = Math.abs(days);
    text = od === 0 ? "Overdue today" : `${od}d overdue`;
  } else if (days === 0) {
    text = "Due today";
  } else if (days === 1) {
    text = "Due tomorrow";
  } else {
    text = `Due in ${days}d`;
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
      overdue && "border-red-500/40 bg-red-500/10 text-red-300",
      urgent && !overdue && "border-amber-500/40 bg-amber-500/10 text-amber-300",
      !urgent && !overdue && "border-border bg-muted/30 text-muted-foreground",
    )}>
      {overdue ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {text}
    </span>
  );
}