import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  Icon,
  label,
  value,
  sublabel,
  accent = "primary",
  className,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "primary" | "emerald" | "amber" | "violet";
  className?: string;
}) {
  const accentCls = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-200",
    violet: "bg-violet-500/15 text-violet-300",
  }[accent];
  return (
    <div className={cn("rounded-2xl border border-border bg-card/60 backdrop-blur p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
        </div>
        <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", accentCls)}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}