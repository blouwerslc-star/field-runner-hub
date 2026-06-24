## What's wrong

Two complaints, both valid, both covered by this re-do (no extra charge — this is finishing the work already paid for):

1. **Hovering the service cards does nothing.** The current implementation uses Radix `HoverCard` wrapped around a `<div>` with a `hover:-translate-y-1` transform. The combination of `asChild` + a transforming child + `openDelay: 120` is unreliable — many users see no popup at all, and there's no click fallback on desktop, so the card looks broken.
2. **Other landing-page sections still have no preview popups.** Only the 6 service cards got wired up last turn. How It Works, Payment Flow, Trust Badges, Sample Deliverables, Vetting Steps, and Stats tiles are still bare.

## Fix

### 1. Replace `HoverCard` with a hover-OR-click `Popover` (`src/components/landing/ServiceExamplePopover.tsx`)

Rebuild the component on top of shadcn `Popover` (already in the project) with controlled `open` state:

- **Desktop**: opens on `onMouseEnter` / `onFocus` AND on click. Closes on `onMouseLeave` after a short delay (so the user can move into the popover content). Clicking the card toggles it so touch-screen laptops and keyboard users always have a way in.
- **Mobile** (`useIsMobile`): tap opens the existing bottom `Sheet`. Unchanged.
- Drop the transforming wrapper — the trigger becomes a `<button>`-styled `<div role="button">` and the hover-lift `hover:-translate-y-1` moves to an inner element so it never breaks pointer hit-testing on the trigger.
- Keep keyboard support: `Enter` / `Space` toggles; `Esc` closes.

### 2. Extend the same popover pattern to every other section that lists items

Add a small, content-typed wrapper for each section so each item shows a relevant example on hover/tap. Same `Popover` + `Sheet` UX as services.

New data file: **`src/lib/landing-section-examples.ts`** — one typed map per section, keyed by the section's item title/step. Hand-written, ~2 sentences + 2-3 bullets each. No business logic.

Sections to wire (in `src/routes/index.tsx`):

| Section | What pops up |
|---|---|
| How It Works steps | What happens at that step, with a 2–3 bullet example |
| Payment Flow (4 steps) | Concrete dollar/timing example for that step |
| Trust Badges | One-paragraph plain-English explanation of the badge |
| Vetting Steps | What the team actually checks at that stage |
| Sample Deliverables thumbnails | Larger preview caption + context (handled inside `SampleDeliverablesSection.tsx`) |
| Stats tiles (if present) | How the number is calculated / what it means |

Component reuse: introduce one generic `<LandingExamplePopover title body bullets>` in `src/components/landing/ServiceExamplePopover.tsx` (export alongside the service-specific one) so each section uses the same hover/click/sheet UX without 6 near-duplicate components.

### 3. Visual affordance

Every wrapped item gets a small "Preview →" hint in the bottom-right corner (already present on service cards). Consistent cue so users know hover/tap reveals more.

## Files

- **edit** `src/components/landing/ServiceExamplePopover.tsx` — rewrite on `Popover`; add hover+click+focus open logic; export a generic `LandingExamplePopover` for non-service sections.
- **new** `src/lib/landing-section-examples.ts` — example content for How It Works, Payment Flow, Trust Badges, Vetting Steps, Stats.
- **edit** `src/routes/index.tsx` — wrap How It Works, Payment Flow, Trust Badges, Vetting Steps, and Stats items with `LandingExamplePopover`.
- **edit** `src/components/landing/SampleDeliverablesSection.tsx` — wrap each thumbnail in `LandingExamplePopover` showing a larger preview + caption.

## Verification

- Desktop (1332px, the user's current viewport): hover any service card, How It Works step, Payment Flow step, Trust Badge, Vetting Step, Stat tile, or Sample Deliverable → popover appears within ~100ms. Clicking also opens it. Tab key cycles through and opens via Enter/Space.
- Mobile (375px): tap each → bottom sheet slides up. No accidental hover-opens.
- No console errors. Existing `/tasks` dialog popups remain untouched.

## Not in scope

Testimonials, FAQ, and the coverage map already have native expand/click behavior — leaving them alone to avoid double-popup noise.
