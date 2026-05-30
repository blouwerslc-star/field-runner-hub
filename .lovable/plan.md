# REI Runner Academy — Complete Rebuild Plan

The current Academy has working infrastructure (6 modules, quiz engine, 3-tier certification, gating in `applyToTask`). This rebuild expands content, adds per-skill badges + gamification, and ships a venture-grade dashboard — without rewriting the parts that already work.

## What's already shipping (keep)
- `academy_progress` table, `getAcademyState`, `submitQuiz`, `markSectionComplete`
- 3-tier certification (Certified / Verified / Elite Runner) with auto-recompute
- Marketplace gating: `certification_level < 1` blocks `applyToTask`
- Quiz engine (80% pass, retake, per-question feedback)

## New scope

### 1. Content expansion (8 modules total)
Add 2 new modules to `src/lib/academy/modules.ts`:
- **Property Condition Reporting** — damage ID, occupancy indicators, safety, repair docs
- **Client Communication** — investor comms, response times, messaging, escalation

Rename/refresh existing 6 to match the spec (Orientation, Photography, Video, Occupancy, Lockbox, Safety).

### 2. Per-skill certification badges
Beyond the 3 tier levels, award skill badges automatically on module pass:
- Certified Property Photographer (Photography module)
- Certified Lockbox Installer (Lockbox module)
- Property Inspection Certified (Condition Reporting module)
- Safety Certified (Safety module)
- Communication Certified (Client Comms module)

Derived from `academy_progress` — no new table needed. New helper `getEarnedSkillBadges(userId)`.

### 3. Gamification (XP + Levels)
- 100 XP per lesson section completed, 250 XP per module quiz passed
- Levels: 1 (0 XP) → 10 (5000 XP), linear thresholds
- Pure derivation from `academy_progress` — no schema change

### 4. Enhanced dashboard (`/academy`)
Redesign with:
- Welcome header with user name + current level + XP progress bar
- Stat cards: Modules Passed, Skill Badges, Certification Tier, Locked/Unlocked Job Types
- "Continue training" CTA pointing to next incomplete module
- Earned skill badges grid + locked badges (greyed)
- Existing tier requirements card (kept)
- Verification status mini-card (ID + background check) with CTAs

### 5. Certificate PDF download
New server fn `generateCertificatePdf({ moduleId })` using `pdf-lib` (Worker-safe). Returns base64; client triggers download. Button appears on passed modules in the module page and on a new "My Certificates" section of the dashboard.

### 6. Profile integration
On public profile (`/profile/$slug`) and `ProfileCard`, render:
- Current `CertificationBadge` (already exists)
- Earned skill badges row

Add to `getPublicProfile` server fn: include `academy_progress` summary.

### 7. Job unlock display
On `tasks.$taskId.tsx` for runners: if missing required cert, show a "Locked — complete X module to apply" banner with link to that module. Initial mapping (in code): all paid tasks require Level 1; future task_type-specific gates can be added later.

## Out of scope (call out, defer)
- Investor training track — defer; investors don't need gating today
- Admin course-upload UI — content stays in `src/lib/academy/modules.ts` (versioned in code); avoids building a CMS
- Video lesson hosting — modules keep optional `videoUrl` field; no player rebuild
- Quiz authoring UI — same reason

## Files

**New**
- `src/lib/academy/badges.ts` — skill-badge definitions + `getEarnedSkillBadges`
- `src/lib/academy/xp.ts` — XP/level calc helpers
- `src/lib/academy/certificate.functions.ts` — `generateCertificatePdf` server fn (pdf-lib)
- `src/components/academy/SkillBadge.tsx`
- `src/components/academy/XPBar.tsx`
- `src/components/academy/StatCard.tsx`

**Edited**
- `src/lib/academy/modules.ts` — add 2 modules, refresh content
- `src/lib/academy.functions.ts` — extend `getAcademyState` to return XP, level, earned skill badges, next module
- `src/routes/_authenticated/academy.tsx` — full dashboard rebuild
- `src/routes/_authenticated/academy.$moduleId.tsx` — add certificate download button when passed
- `src/routes/profile.$slug.tsx` + `src/lib/profiles.functions.ts` — surface skill badges
- `src/routes/tasks.$taskId.tsx` — cert-gate banner
- `package.json` — add `pdf-lib`

**No DB migration needed.** All new state derives from existing `academy_progress` + `runner_profiles`.

## Risks
- pdf-lib bundle size (~400KB) — acceptable, Worker-compatible
- Module content changes mid-stream don't invalidate past passes (intended)
