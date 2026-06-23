## Goal
Lift investor signups and funded tasks. Reinforce one message everywhere:
**"REI Runner is the nationwide boots-on-the-ground network for real estate investors."**

Keep the existing visual design language. Changes are copy, structure, metadata, and small UX additions only.

---

## 1. Investor-first conversion funnel (highest leverage)

**`src/routes/index.tsx` (home)**
- Rewrite hero H1 + subhead around the positioning line above.
- Make the primary CTA "Post Your First Task" (investor) and the secondary "Apply as a Runner". Currently they're balanced — investors should be the dominant path.
- Add a trust strip directly under the hero: escrow-protected payments, ID-verified runners, nationwide coverage, no platform fee on top of task price.
- Add a 3-step "How it works (for investors)" section before the runner pitch.
- Add a results/proof section (live counts of runners, cities covered, tasks completed) pulled from `public-stats.functions.ts` if available; otherwise static placeholders flagged with a TODO.

**`src/routes/investors.tsx`**
- Tighten hero, add concrete sample tasks with price ranges, emphasize the 80/20 split from total (already correct backend-side).
- Add an FAQ block (pulled from `/faq` content) addressing the top 5 investor objections: trust, payment safety, runner vetting, dispute process, coverage area.
- End with a strong "Fund your first task" CTA.

**`src/routes/runners.tsx`**
- Lighter touch — keep current structure, sharpen headline + benefits copy.

**`src/components/landing/ApplicationForms.tsx`**
- Add a one-line "what happens next" reassurance below the submit button (account created, immediate dashboard access, confirmation email sent).
- No structural changes to fields.

---

## 2. SEO + metadata sweep

Audit every public route's `head()` and ensure each has unique title, description, og:title, og:description, og:url, canonical. Currently several routes share or omit these.

Routes to update:
- `/` (index), `/investors`, `/runners`, `/about`, `/trust`, `/faq`, `/pricing`, `/story`, `/apply`, `/login`, `/signup`, `/privacy`, `/terms`

Add JSON-LD where applicable:
- `__root.tsx` — Organization (already present? verify) + WebSite with SearchAction.
- `/faq` — FAQPage schema generated from the actual FAQ items.
- `/investors`, `/runners` — Service schema.
- `/about` — already has AboutPage + BreadcrumbList (keep).

Verify `public/robots.txt` allows crawl + references sitemap. Verify `src/routes/sitemap[.]xml.ts` includes all public routes (the index file shows it exists).

Titles target investor-intent keywords: "boots on the ground real estate", "property inspection service", "real estate runner near me", "remote real estate investor tools".

---

## 3. Marketplace/browse UX (`/profiles`)

Light touches — don't redesign:
- Add a trust microcopy bar above the grid ("All runners ID-verified · Escrow-protected payments · Nationwide coverage").
- Add an empty-state for filters that return 0 results with a "Clear filters" action.
- Ensure mobile map+list collapse works (already changed recently).
- Add count + "Showing X of Y runners nationwide" microcopy.

---

## 4. What I will NOT change

- No visual redesign or new design tokens.
- No backend logic, schema, or payment flow changes.
- No new routes beyond what already exists.
- No changes to authenticated dashboard surfaces.
- No image generation unless a specific page is missing an og:image and would clearly benefit (will ask first).

---

## Technical notes

- TanStack Start route `head()` pattern; canonical only on leaves, og:url self-referencing each route.
- JSON-LD via `scripts` array, stringified.
- Stats pulled via existing `getPublicStats` server fn if it exists; otherwise hard-coded values with a comment so they're easy to wire later.
- No new dependencies.

---

## Order of execution

1. SEO sweep across all listed public routes (mechanical, low risk).
2. Home page rewrite (investor-first).
3. Investors page tightening + FAQ block.
4. Profiles page trust strip + empty-state.
5. Runners page + ApplicationForms small polish.

Estimated files touched: ~12–15. No migrations.

Reply "go" to start, or tell me which sections to drop/add.