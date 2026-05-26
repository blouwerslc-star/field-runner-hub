## REI Runner Landing Page Overhaul — Phased Plan

This is a large brief (15 sections). I'll ship it in 3 phases so we can review progress and avoid one giant unreviewable change. You can approve phase 1 now; phases 2 & 3 follow automatically after.

---

### Phase 1 — Landing page rebuild (core visual + content)

Rebuild `src/routes/index.tsx` as a modular landing page with these sections, in order:

1. **Sticky top nav** — logo, How It Works, Why Join, FAQ, "Apply Now" CTA
2. **Hero** — new headline "Get Paid Finding Real Estate Opportunities", subhead, Apply Now + See How It Works CTAs, animated background (CSS map grid + glowing city nodes + floating property pins, no heavy libs)
3. **Stats bar** — animated counters: Applications Submitted, Cities Covered, Active Investors, Leads Reviewed (founding beta numbers, count-up on scroll)
4. **How It Works** — 4-step cards with icons (Find → Submit → Investors Review → Earn)
5. **Why People Join** — 6 benefit cards
6. **Markets** — "Launching in major markets" chips: Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, Chicago
7. **Video section** — "What Is REI Runner?" placeholder embed slot (YouTube iframe ready, swap URL later)
8. **About / Mission** — dark glassmorphism panel with founder mission statement
9. **Investor waitlist strip** — "Are you an investor?" with Join Investor Waitlist CTA (opens email mailto for now)
10. **Application form** — keep existing `<ApplicationForms />`, add "Applications reviewed weekly • Founding Runner spots limited" urgency banner above
11. **FAQ** — accordion with 8 questions from brief
12. **Footer** — logo, mission, contact email, Terms/Privacy/FAQ links, "Built in the USA", copyright

Components created in `src/components/landing/`: `Nav.tsx`, `Hero.tsx`, `StatsBar.tsx`, `HowItWorks.tsx`, `WhyJoin.tsx`, `Markets.tsx`, `VideoSection.tsx`, `About.tsx`, `InvestorStrip.tsx`, `FAQ.tsx`, `Footer.tsx`.

Design tokens (`src/styles.css`): add subtle gradient + glow utilities to support the dark proptech aesthetic. Keep existing palette.

### Phase 2 — Engagement & trust

- **Sticky mobile CTA bar** — fixed bottom "Apply Now" on mobile only
- **Exit-intent email popup** — "Join the Founding Runner Waitlist", captures email to new `waitlist_signups` table + appends to Google Sheet (new tab "Waitlist")
- **Routes**: `/terms`, `/privacy`, `/faq` (basic standalone pages so footer links work)
- **Investor waitlist** — promote from mailto to same popup form with a `type` field (`runner` | `investor`)

### Phase 3 — Analytics & polish

- **Analytics**: GA4, Meta Pixel, TikTok Pixel, Microsoft Clarity — added via `<script>` tags in `__root.tsx` head, gated by env vars so they only fire when IDs are set. I'll ask you for the tracking IDs before wiring them.
- **SEO**: tighten `<head>` title/description/OG tags on home + new routes
- **Mobile pass**: spacing, type scale, tap targets, image sizes

---

### Out of scope / needs your input

- **Real video** — I'll wire an empty 16:9 slot; you provide YouTube/Vimeo URL later
- **Real stats numbers** — I'll seed plausible founding-beta numbers (e.g. 240 applications, 12 cities, 38 investors, 410 leads). Tell me if you have real ones.
- **Tracking IDs** — needed before Phase 3
- **Founder photo / name** — using a generic "From the Founder" block unless you share one

### Technical notes

- All new components are presentation-only React + Tailwind + lucide-react icons (already installed). No new deps for Phase 1.
- Animated counters use a tiny `useInView` + `requestAnimationFrame` hook — no library.
- Hero background animation is pure CSS (radial gradients + keyframe-animated pins). No canvas/three.
- Form submission flow stays unchanged — still flows through `submitFieldRunner` → DB → Google Sheets.
- Footer links to `/terms`, `/privacy`, `/faq` will 404 until Phase 2; I'll temporarily anchor them to `#` in Phase 1 to avoid broken links.