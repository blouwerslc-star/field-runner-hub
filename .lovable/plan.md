
## Goal
The Browse page (`/profiles`) currently loads every public profile on first visit, which is slow and overwhelming. Rework it so an investor lands on a fast, focused page and only sees the full runner grid after they actually search or filter.

## Behavior changes

1. **Deferred loading of the full directory**
   - On first visit (no search, no filters applied), do NOT query `listPublicProfiles` for the full list.
   - Instead, fetch a small curated preview: **top 6 featured runners** (Top Runner badge first, then highest-rated verified profiles, then most jobs completed).
   - Only run the full `listPublicProfiles` query once the investor performs at least one meaningful action:
     - types in the search box and submits
     - selects a Role / State / Service / Availability / Sort filter
     - clicks a state on the coverage map
     - toggles an Academy certification chip
   - Track this with a derived `hasActiveFilters` boolean (any search param differs from defaults) plus a "Show all runners" button for investors who want to browse without filtering.

2. **Investor-first page layout (top → bottom)**
   - Hero block: H1 + one-line value prop ("Hire a vetted local runner in minutes").
   - Trust strip (keep existing badges — ID verified, escrow, nationwide, rated).
   - **Search form promoted above the map** so the primary CTA is "search", not "scroll".
   - Coverage map collapsed into an accordion titled "Browse by state" (closed by default on mobile, open on desktop) — the map is heavy and not what an investor needs first.
   - Featured runners strip (6 cards, horizontal scroll on mobile, grid on desktop) with heading "Featured runners" and a small "See all" button that triggers the full query.
   - Results grid + Academy chips only render once `hasActiveFilters` is true or "Show all" was clicked.
   - Stats dl (Profiles / Verified / Top / Avg rating) moves to only render alongside results, not on the empty landing state.

3. **Performance**
   - Add `staleTime: 60_000` to the featured-preview query and the full-directory query so back-navigation from a profile is instant.
   - Add `placeholderData: (prev) => prev` to the directory query so filter changes don't blank the grid.
   - Add a lightweight new server function `listFeaturedPublicProfiles({ limit: 6 })` in `src/lib/profiles.functions.ts` that reuses the existing selection logic but returns only the curated slice — avoids sending the entire directory over the wire on first paint.

4. **Copy / polish (investor voice)**
   - Page H1: "Hire a vetted real estate runner near you".
   - Subhead: "Search verified field runners by city, state, or service. Pay only when the work is approved."
   - Empty state (before search): a short "How hiring works" 3-step mini-list (Search → Post task → Approve & pay) instead of a dumped grid.
   - Keep the sign-in banner for anonymous viewers.

## Files to touch

- `src/lib/profiles.functions.ts` — add `listFeaturedPublicProfiles`.
- `src/routes/profiles.tsx` — restructure layout, gate full query on `hasActiveFilters`, add featured strip, collapse map, tighten copy, add "Show all runners" toggle stored in a `search.showAll` param (so back navigation still restores it).
- `searchSchema` in `profiles.tsx` — add `showAll: boolean` (default false) alongside existing params.

## Out of scope

- Admin counts and Weekly Availability scheduler stay as-is.
- No changes to `ProfileCard`, `StateCoverageMap`, or backend RLS.
