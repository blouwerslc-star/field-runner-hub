# Landing Page Cleanup + Progress & Markets Update

## Goals
1. Show real progress and the markets we're actually live in (driven by live data, not a hardcoded list).
2. Fix the hover/tap preview popovers that still don't trigger on several cards.
3. Consolidate the homepage so it isn't a wall of overlapping strips.

---

## 1. Fix broken hover previews

Audit of `src/routes/index.tsx` shows several card grids are NOT wrapped in a popover, which is why "hover does nothing" on parts of the page:

- **Example Field Tasks** (`EXAMPLE_TASKS`, the Property Photo Set / Walkthrough Video / etc. cards) — no popover at all.
- **Why Runners Join** (`BENEFITS`) — no popover.
- **Operational Standards** (`TASK_STANDARDS`) — no popover.
- **Two-Path CTA** ("I'm a Runner" / "I'm an Investor") — fine as buttons, leave alone.

Fixes:
- Wrap each `EXAMPLE_TASKS` card and each `BENEFITS` card with `LandingExamplePopover`, feeding from a new `EXAMPLE_TASK_EXAMPLES` and `BENEFIT_EXAMPLES` map appended to `src/lib/landing-section-examples.ts`.
- Remove `hover:-translate-y-1` from those cards (the translate fights the popover's hover hit-testing on the trailing edge — the same root cause as the earlier round of fixes on Services / How It Works).
- In `ServiceExamplePopover.tsx`, add `onPointerEnter`/`onPointerLeave` as fallbacks alongside `onMouseEnter`/`onMouseLeave` so trackpad + touch laptops fire reliably, and bump the close delay to `180ms` so brief gaps between trigger and content don't auto-close.

## 2. Real progress + markets

Replace the static `MARKETS` array and the four-card "Beta Status" board with data already exposed by `getPublicStats` and `getStateCoverage` (both already in `src/lib/public-stats.functions.ts`).

New combined section **"Where we are today"** (replaces both the Beta Status block and the static Markets chip list):
- Left: live stats grid (investors, runners, tasks posted, tasks completed, active cities, avg rating) — moved from the separate `PlatformStatsStrip` so it lives inside this section.
- Right: live state list from `getStateCoverage` (state + runner count + "View runners" link to `/coverage`). If a state has 0 runners we omit it; if the list is empty we show "We're onboarding our first runners — apply to be founding in your city."
- Below: small milestone timeline (founded, beta opened, first task posted, first market w/ ≥3 runners) — sourced from `getPublicStats` totals with honest copy ("Marketplace open — beta", "X tasks posted to date", "Active in N states"). No fabricated numbers.

The existing `CoverageMapSection` stays directly under this block as the visual companion.

## 3. Consolidation pass

Current homepage stacks: hero → video → ticker → beta board → stats strip → coverage map → trust badges → standards → example tasks → payments → vetting → testimonials → deliverables → two-path CTA → how it works → why join → services → markets → about → founder → safety → contact → faq → footer.

That's too many strips and several duplicate each other. New order:

1. Hero
2. Explainer video
3. Live ticker
4. **"Where we are today"** (new: stats + live state list + milestones) — replaces Beta Status + Platform Stats + Markets
5. Coverage map
6. How It Works (4 steps, with previews)
7. Services (with previews)
8. Example Field Tasks (with previews — newly wired)
9. How Payments Work (with previews)
10. How We Vet Runners + Trust Badges row merged into one **Trust & Safety** section (badges become a sub-row under the vetting steps; removes the standalone Trust Badges strip and the Operational Standards strip — standards become 5 small chips inside this section)
11. Why Runners Join (with previews — newly wired)
12. Sample Deliverables
13. Testimonials
14. Two-path CTA
15. About + Founder (merged into one section, founder block on the right)
16. Safety scope (kept)
17. FAQ
18. Contact + footer

Net effect: ~6 fewer top-level sections, no duplicate "stats" or "markets" blocks, every card grid has working hover/tap previews.

## Technical details

Files touched:
- `src/routes/index.tsx` — reorder sections per #3, wrap `EXAMPLE_TASKS` + `BENEFITS` in `LandingExamplePopover`, delete standalone `BetaStatusBoard`, `PlatformStatsStrip`, `TASK_STANDARDS` section, and the static `MARKETS` chip section; add new `WhereWeAreToday` component.
- `src/lib/landing-section-examples.ts` — add `EXAMPLE_TASK_EXAMPLES` and `BENEFIT_EXAMPLES` maps.
- `src/components/landing/ServiceExamplePopover.tsx` — add `onPointerEnter`/`onPointerLeave` handlers, bump close delay to 180ms.
- `src/lib/public-stats.functions.ts` — no schema change, but the new section will call `getPublicStats` and `getStateCoverage` together (both already exist).

No DB migrations. No new dependencies. No changes to auth, routing, or any other page.

## Verification

- Desktop (1332px): hover any card in Example Field Tasks, Why Runners Join, Services, How It Works, Payments, Vetting, Trust Badges → preview appears within ~120ms, stays open while mouse traverses into the popover, closes on leave.
- Mobile (375px): tap each → bottom sheet opens.
- "Where we are today" renders honest live numbers; if all counts are 0 the section still reads sensibly ("Marketplace open — beta. Apply to be founding in your city.").
- No console errors, no layout shift, no duplicate sections.
