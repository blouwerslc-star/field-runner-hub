// Pure XP / level helpers. Derives gamification state from raw academy progress.

export const XP_PER_SECTION = 100;
export const XP_PER_MODULE_PASS = 250;

// Level thresholds (cumulative XP required to *reach* that level).
// Level 1 = 0 XP. Each subsequent level adds 500 XP.
export const LEVEL_STEP = 500;
export const MAX_LEVEL = 10;

export function computeXp(opts: {
  sectionsCompleted: number;
  modulesPassed: number;
}): number {
  return opts.sectionsCompleted * XP_PER_SECTION + opts.modulesPassed * XP_PER_MODULE_PASS;
}

export function levelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progressPct: number;
} {
  const level = Math.min(MAX_LEVEL, 1 + Math.floor(xp / LEVEL_STEP));
  const currentLevelXp = (level - 1) * LEVEL_STEP;
  const nextLevelXp = level >= MAX_LEVEL ? null : level * LEVEL_STEP;
  const span = nextLevelXp ? nextLevelXp - currentLevelXp : 1;
  const progressPct = nextLevelXp
    ? Math.min(100, Math.round(((xp - currentLevelXp) / span) * 100))
    : 100;
  return { level, currentLevelXp, nextLevelXp, progressPct };
}

export function levelTitle(level: number): string {
  if (level >= 10) return "Elite Field Operator";
  if (level >= 7) return "Veteran Runner";
  if (level >= 4) return "Established Runner";
  if (level >= 2) return "Rising Runner";
  return "New Runner";
}