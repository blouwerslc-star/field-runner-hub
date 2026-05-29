import { ShieldCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<number, { label: string; cls: string }> = {
  0: { label: "Unverified", cls: "bg-muted/40 text-muted-foreground border-border" },
  1: { label: "Level 1 · Email", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  2: { label: "Level 2 · Phone", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  3: { label: "Level 3 · ID", cls: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  4: { label: "Level 4 · Background", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

export function VerificationLevelBadge({
  level,
  size = "sm",
  className,
}: { level: number; size?: "sm" | "md"; className?: string }) {
  const meta = LEVEL_META[Math.max(0, Math.min(4, level))];
  const Icon = level >= 1 ? ShieldCheck : Shield;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        meta.cls,
        className,
      )}
      title={meta.label}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} /> {meta.label}
    </span>
  );
}

export function VerificationStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    not_started: "bg-muted/40 text-muted-foreground border-border",
    pending_payment: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    pending_review: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", map[status] ?? map.not_started)}>
      {label}
    </span>
  );
}