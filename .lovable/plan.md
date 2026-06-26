## Goal

Translate Semrush keyword research into real, on-page SEO changes: refresh titles/descriptions/H1s on existing pages around the highest-intent terms, add 3 new keyword-targeted landing pages (2 investor-side, 1 runner-side), and stand up 8 priority-market city pages.

## Target keywords (from Semrush, US database)

**Investor / hirer side** (warm to hot intent)
- `property preservation services` — 880/mo, KD low
- `property preservation` — 1,600/mo, KD 12 (very easy)
- `property preservation company / companies` — 1,300/mo combined
- `property inspection service` — 320/mo, KD 37
- `property management vendors` — 170/mo
- `banks looking for property preservation vendors` — 210/mo
- Long-tail: `what is property preservation` — 210/mo (question intent)

**Runner / supply side** (high volume, fills network)
- `property preservation jobs` — 720/mo, KD 19
- `property preservation work` — 590/mo
- `property preservation jobs near me` — 140/mo
- `property preservation contractor` — 260/mo
- `how to become a property preservation contractor` — 70/mo
- `how to start a property preservation company` — 50/mo

**Branded comparison** (already done) — `WeGoLook alternative` lives on the new `/blog/comparison-wegolook`.

## What we'll change

### 1. New landing pages (3)
- `/property-preservation-services` — investor pillar page; targets "property preservation services", "property preservation company". Sections: what it is, what's included, how REI Runner delivers it on-demand with escrowed payments + geotagged proof, CTA to `/investors`.
- `/property-inspection-service` — investor secondary; targets "property inspection service", "property inspection". Sections: drive-bys, walkthrough video, vacancy verification, occupancy checks; CTA to `/investors`.
- `/property-preservation-jobs` — runner-side; targets "property preservation jobs / work / contractor". Sections: how runner gigs work, payout flow, REI Runner Academy, "how to become a property preservation contractor" answer; CTA to `/apply`.

Each page ships with: route-specific `head()` (title, description, og:title, og:description, og:url, canonical), Article/Service + BreadcrumbList JSON-LD, and FAQPage JSON-LD answering 3–4 top question keywords.

### 2. City landing pages (priority markets)
Add a dynamic route `/markets/$city` rendering pages for the 8 markets already on `/about`: Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, Chicago. Content is templated but per-city: H1 "Real Estate Field Services in {City}", a paragraph mentioning local task types (drive-bys, vacancy checks, lockbox installs, contractor meetups), local CTAs to `/investors` and `/apply`. Each city emits its own canonical, og:url, and LocalBusiness JSON-LD with `areaServed`.

### 3. Metadata + H1 refresh on existing pages
No body-copy rewrites; only the visible H1/intro line and head() tags.

| Route | New title (≤60 chars) | New H1 / intro tweak | Primary keyword |
|---|---|---|---|
| `/` (index) | "On-Demand Property Field Services & Inspections" | keep hero; tweak subhead to mention "property preservation & inspection services" | property field services |
| `/investors` | "Hire Local Property Runners for Field Services" | Add "property preservation & inspection tasks" in intro line | property inspection service |
| `/runners` | "Property Preservation Jobs & Field Runner Gigs" | H1 mentions "property preservation jobs" | property preservation jobs |
| `/apply` | "Apply: Property Preservation Contractor & Runner Jobs" | intro line mentions "become a property preservation contractor" | property preservation contractor |
| `/pricing` | "Property Field Services Pricing — Flat Per-Task" | unchanged H1, refresh meta only | property field services pricing |
| `/coverage` | "Nationwide Property Field Service Coverage Map" | unchanged H1, refresh meta only | property field services coverage |
| `/about` | "About REI Runner — Property Field Services Marketplace" | minor intro tweak | property field services marketplace |

### 4. Sitemap
Add the 3 new landing pages + 8 city URLs to `src/routes/sitemap[.]xml.ts`.

### 5. Internal linking
- Add a "Services" link block in the public header dropdown (or footer if header is full) linking to the 3 new landing pages.
- Add a "Coverage" list of the 8 city pages on `/coverage` (the existing map page).
- Cross-link investor landing pages → `/pricing` and `/investors`; runner page → `/apply` and `/runners`.

## Out of scope (intentionally)
- Body-copy rewrites of `/investors`, `/runners`, `/about` etc. (only H1 + intro + head tags).
- All-50-states programmatic pages — high thin-content risk; revisit after the 8 markets prove out.
- New blog posts beyond `/blog/comparison-wegolook` (already shipped).
- Backlink outreach / off-page SEO.

## Technical notes
- All new routes follow the existing TanStack pattern (file-based, `createFileRoute`, per-route `head()` with canonical on leaf only, JSON-LD via `scripts`).
- City route is one file: `src/routes/markets.$city.tsx` with a hardcoded city map (slug → display name, state, blurb). Unknown slugs throw `notFound()`.
- No backend, no schema, no auth changes.
- After publish, you'll need to re-crawl in Google Search Console and resubmit `/sitemap.xml` for the new URLs to get picked up faster.

## Rollout
One batch: create 3 service pages + 1 dynamic city route + sitemap update + metadata/H1 refresh on 7 existing routes + header link addition. Single publish.
