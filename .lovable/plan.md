# Clean up mobile

Based on captures of the home page and `/tasks` on a 390px viewport, plus a sweep of the public route headers, the "crowded" feeling on mobile comes from a few specific places. Plan is to fix the responsive issues, not redesign — same look on desktop, cleaner stack on mobile.

## What's actually broken on mobile

1. **Public page headers don't collapse.** `tasks.tsx`, `profiles.tsx`, `investors.tsx`, `runners.tsx`, and `story.tsx` each render their nav links (`Browse runners / Hire a Runner / Become a Runner / Sign in`) in a flex row with no `md:hidden`. On 390px they overlap the logo and crash into each other. Only `index.tsx` has a hamburger + MobileDrawer.
2. **Landing hero is just a giant video on mobile.** Above-the-fold on a phone shows a black video block with a "Tap for sound" pill — no headline, no value prop, no CTA visible. The "Hire a Runner" button in the header is the only signal.
3. **`/tasks` activity card is dense.** Six stat tiles in a 2-col grid plus a big "Open tasks" headline push the actual listings far below the fold.
4. **State coverage map is unusable on phones.** The US grid renders tiny squares scattered across the width with most cells blank — no meaningful interaction at this size.
5. **No spacing for the safe-area / iOS notch on the bottom nav routes** is OK already; the dashboard shell handles it. Public pages have no bottom nav, which is fine — they just need the headers fixed.

## Changes

### 1. Shared public header (new)
Extract a `PublicHeader` component (`src/components/layout/PublicHeader.tsx`) that:
- Shows logo + primary CTA(s) on every breakpoint.
- Hides the inline nav links at `<md` and shows a hamburger that opens the existing `MobileDrawer`.
- Accepts a `links` prop so each route can pass its own set.
- Replace the inline headers in `tasks.tsx`, `profiles.tsx`, `investors.tsx`, `runners.tsx`, `story.tsx` with `<PublicHeader />`. Keep `index.tsx`'s existing custom header (it already works) or migrate it too in the same pass for consistency.

### 2. Landing hero mobile order
In `src/routes/index.tsx`, on mobile only:
- Render the headline + subhead + primary CTAs **above** the hero video.
- Cap the video to ~60svh on mobile (it currently consumes the full viewport).
- Keep desktop layout unchanged.

### 3. `/tasks` activity card tighten
- Drop from 6 tiles to the 3 most relevant on mobile (Runners, Tasks Posted, Markets) with the others behind a "More stats" expand, OR a single horizontal scroller of stat chips.
- Reduce vertical padding and font sizes one step on `<sm`.
- Reduce the page top padding `py-10` → `py-6 sm:py-10`.

### 4. Coverage map mobile fallback
- At `<md`, hide the grid map and render a compact alternative: a searchable list / chip cloud of states sorted by runner count, with the same click-to-filter behavior. Keep the existing grid for `md+`.

### 5. Small global mobile polish
- Header height `h-16` is fine; tighten container padding `px-5` → `px-4 sm:px-5` on the public pages so cards have a bit more breathing room on a 390px screen.
- Audit any `flex` row that mixes text + fixed-size widgets and apply the responsive-row pattern (`grid-cols-[minmax(0,1fr)_auto]`, `min-w-0`, `shrink-0`, `truncate`) so text never overlaps icons.

## Out of scope

- Visual redesign / new color palette / new typography.
- Authenticated dashboard layout — `DashboardShell` already has bottom nav + drawer and looked fine on review (will spot-check after the public-header fix and only adjust if a specific page is crowded).
- Building a true interactive state map for mobile (replaced by a list/chip fallback instead).

## Files touched

- new `src/components/layout/PublicHeader.tsx`
- `src/routes/tasks.tsx`, `src/routes/profiles.tsx`, `src/routes/investors.tsx`, `src/routes/runners.tsx`, `src/routes/story.tsx` — swap inline header, tighten padding (tasks)
- `src/routes/index.tsx` — mobile hero order + video height
- whichever component renders the coverage map under `/tasks` — add `<md` list fallback
