import { cn } from "@/lib/utils";
import type { SkillBadge as SkillBadgeT } from "@/lib/academy/badges";

export function SkillBadge({
  badge,
  earned,
  size = "sm",
  className,
}: {
  badge: SkillBadgeT;
  earned: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const { Icon } = badge;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        earned ? badge.cls : "bg-muted/30 text-muted-foreground border-border opacity-70",
        className,
      )}
      title={`${badge.label}${earned ? "" : " — locked"}`}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      {badge.label}
    </span>
  );
}