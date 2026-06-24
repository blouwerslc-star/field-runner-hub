## Goal

On the landing page (`/`), the **"Tasks You Can Get Paid For"** service cards currently have no preview affordance. Add a popup example for each of the 6 service types showing what an investor posts and what a runner does — hover-card on desktop, bottom sheet on tap for mobile.

Out of scope this turn (per your answers): How It Works steps, deliverables, stats, map, testimonials, FAQ. We can wire those next once this pattern is approved.

## UX

- **Desktop**: hover (or keyboard focus) opens a Radix `HoverCard` anchored to the card. Opens ~150ms in, closes when the pointer leaves. Card stays fully clickable as a link to `/tasks`.
- **Mobile** (`useIsMobile`): tap opens a bottom `Sheet`. Hover-card is disabled on touch — no accidental opens.
- **Affordance**: tiny "Preview example →" hint appears at the bottom of each card so users know there's more.

## Popup content (per service)

Each popup shows two compact sections in one panel (not a giant dialog):

- **Investor posts** — 1-line summary, 3 bullet fields they fill in, typical payout chip.
- **Runner does** — 1-line summary, 3-step checklist, estimated time chip.

Content is hand-written per service type to match the real task experience (mirrors the structure already in `src/lib/sample-task-templates.ts`).

## Files

- **new** `src/lib/landing-service-examples.ts` — typed map keyed by service title with the 6 entries (Property Photos, Walkthrough Videos, Drive-By Reports, Occupancy Checks, Sign & Lockbox Placement, Custom Field Tasks). Reuses the lighter `{ investor, runner }` shape; not the full `SampleTemplate` because hover-cards need less density.
- **new** `src/components/landing/ServiceExamplePopover.tsx` — a single component that wraps its `children` (the service card) and renders either a `HoverCard` (desktop) or a `Sheet` (mobile) with the example content. Uses existing `useIsMobile`. Keyboard accessible (focus opens hover-card; sheet opens on click).
- **edit** `src/routes/index.tsx` — wrap each `SERVICES.map(...)` card in `<ServiceExamplePopover example={...}>`; add the "Preview example →" hint inside the card.

## Technical notes (for devs)

- Reuses shadcn `HoverCard` (already present at `src/components/ui/hover-card.tsx`) and `Sheet`. No new deps.
- HoverCard content is `w-80` with the two-column investor/runner block, icons from existing lucide-react imports.
- Card itself remains a `<div>` (not a button) so we don't break the visual — the popover handles `onClick` for mobile and `onFocus`/`onMouseEnter` for desktop via Radix primitives.
- No business logic, no data fetching, no route changes.

## Verification

- Desktop: hover each of the 6 cards → popover appears with investor + runner content; tab key also opens it.
- Mobile preview (375px): tap each card → bottom sheet slides up; close via X / backdrop.
- No console errors; existing `/tasks` page popup still works (untouched).

## Next (not this plan)

Once approved, follow-ups can extend the same `ServiceExamplePopover` pattern to: How It Works steps, Payment Flow steps, Trust Badges, and Sample Deliverables thumbnails.
