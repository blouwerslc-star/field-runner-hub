import { Award, ShieldCheck, Crown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const META: Record<number, { label: string; cls: string; Icon: any }> = {
  0: { label: "Not Certified", cls: "bg-muted/40 text-muted-foreground border-border", Icon: GraduationCap },
  1: { label: "Certified Runner", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30", Icon: Award },
  2: { label: "Verified Runner", cls: "bg-violet-500/15 text-violet-300 border-violet-500/30", Icon: ShieldCheck },
  3: { label: "Elite Runner", cls: "bg-amber-500/15 text-amber-200 border-amber-500/40", Icon: Crown },
};

export function CertificationBadge({
  level,
  size = "sm",
  className,
  hideWhenZero = false,
}: {
  level: number;
  size?: "sm" | "md";
  className?: string;
  hideWhenZero?: boolean;
}) {
  const lvl = Math.max(0, Math.min(3, level ?? 0));
  if (hideWhenZero && lvl === 0) return null;
  const { label, cls, Icon } = META[lvl];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        cls,
        className,
      )}
      title={`REI Runner Academy — ${label}`}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} /> {label}
    </span>
  );
}

export const CERTIFICATION_LABELS = META;