import { Sparkles } from "lucide-react";
import { levelTitle } from "@/lib/academy/xp";

export function XPBar({
  xp,
  level,
  currentLevelXp,
  nextLevelXp,
  progressPct,
}: {
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progressPct: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-primary/40 grid place-items-center shadow-lg">
            <span className="text-lg font-black text-primary-foreground">{level}</span>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-primary">Level {level}</div>
            <div className="text-base font-semibold leading-tight">{levelTitle(level)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="size-3.5" /> {xp.toLocaleString()} XP
          </div>
          <div className="text-xs text-muted-foreground">
            {nextLevelXp ? `${(nextLevelXp - xp).toLocaleString()} XP to Level ${level + 1}` : "Max level reached"}
          </div>
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        <span>{currentLevelXp.toLocaleString()}</span>
        <span>{nextLevelXp ? nextLevelXp.toLocaleString() : "MAX"}</span>
      </div>
    </div>
  );
}