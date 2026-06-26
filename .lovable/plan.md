## Goal

When a visitor browses `/profiles`, applies filters (state, service, role, etc.), opens a profile, and presses Back (browser or Android hardware back), they should return to the same filtered results — not a reset list. Also replace the free-text State and Service inputs with proper dropdowns.

## Changes

### 1. Move filter state into the URL (search params)

Currently `src/routes/profiles.tsx` keeps `q`, `role`, `city`, `state`, `zip`, `service`, `availability`, `sort`, `certs` in local `useState`. When the user navigates to `/profile/:slug` and returns, React re-mounts the route with empty state.

Fix: store all filters as TanStack Router search params on `/profiles`.

- Add `validateSearch` with a Zod schema using `fallback(...).default(...)` for each filter (per `tanstack-search-params` rules).
- Replace `useState` with `Route.useSearch()` for reads and `navigate({ search: prev => ({ ...prev, ... }) })` for writes (debounced for text inputs so we don't spam history).
- Use `replace: true` on filter updates so the history entry for `/profiles` is a single, latest-filters entry — pressing Back from a profile detail returns to those exact filters.
- Use `react-query`'s queryKey derived from search params (already keyed by `filters` — will still work).

Result: Back from `/profile/$slug` → browser restores `/profiles?state=TX&service=...` and the page renders the same filtered grid + scroll position (scroll restoration is already enabled per `tanstack-navigation`).

### 2. Replace text inputs with dropdowns

**State dropdown**: use a `Select` populated from the existing US-state list already used by `StateCoverageMap` (will import/extract the list it uses, or fall back to a constant of 50 states + DC). Include an "All states" option.

**Service dropdown**: use the existing service catalog. Source priority:
1. `src/lib/landing-service-examples.ts` / `src/lib/sample-task-templates.ts` if they already enumerate services
2. Otherwise the canonical list in `src/lib/profile-constants.ts`

I'll pick whichever already represents the runner service taxonomy so the dropdown matches what profiles list. Include "All services".

Both selects will be searchable using the existing `Command`-based combobox pattern (shadcn `Popover` + `Command`) so long lists stay usable on mobile — same pattern used elsewhere in the app where applicable; otherwise plain `Select`.

### 3. Keep other behavior intact

- Clearing filters resets search params to defaults (and strips defaults from URL via `stripSearchParams` middleware so the URL stays clean).
- The `StateCoverageMap` click handler updates the `state` search param instead of local state.
- Cert chips also move into search params (`certs` as array).

## Files to edit

- `src/routes/profiles.tsx` — add `validateSearch`, swap `useState`→`useSearch`/`navigate`, replace State + Service `Input`s with dropdown components, replace local handlers.
- (Possibly) `src/lib/profile-constants.ts` — export `US_STATES` and `RUNNER_SERVICES` constants if not already present, for the dropdown options.

## Out of scope

- Changing the profile detail page itself.
- Changing the back button component (`BackButton.tsx`) — native browser/Android back already works once filters live in the URL.
- Persisting filters across full browser sessions (URL-based restore is enough for the reported issue).
