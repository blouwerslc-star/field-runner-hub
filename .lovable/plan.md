# REI Runner — Trust, Privacy & Conversion Sweep

This is a large multi-area change. Here's how I'd like to sequence it so each piece ships cleanly and you can review along the way. I'll group the 10 items into 4 batches.

## Batch 1 — CTAs, privacy & marketplace empty states (highest user-visible impact)

**1. Audience-specific CTAs (#1)**
- Sweep `index.tsx`, `runners.tsx`, `investors.tsx`, `story.tsx`, `pricing.tsx`, `trust.tsx`, `faq.tsx`, landing components for "Apply Now"-style buttons.
- Replace with paired CTAs: **Hire a Runner** → `/investors`, **Become a Runner** → `/runners` (or `/apply`).

**2. Public `/profiles` privacy (#2)**
- Server side (`src/lib/profiles.functions.ts`): for unauthenticated callers, return `first_name + last_initial` instead of `full_name`, drop `profile_slug`, drop precise identifiers used in URLs.
- `ProfileCard`: when viewer is logged out, render the masked name, no link to detail page, and a "Sign in to view full profile" affordance.
- `/profile/$slug`: if not authenticated, show a gated teaser + "Sign in to view full runner profiles" CTA (keep route public for SEO of authed sharing but block detail).
- Add logged-out banner CTA on `/profiles`.

**3. `/tasks` empty state (#3)**
- New empty-state component: headline, sub-copy, **Become a Runner** + **Post a Task** CTAs.
- Render 2–3 dimmed sample cards with an "Example task" ribbon when the live list is empty.

**9. Logged-out marketplace nav (#9)**
- On `/profiles` and `/tasks`, swap any action buttons that require auth (contact, claim, post) to the specified CTAs when logged out.

## Batch 2 — Trust, pricing & launch-status content

**4. Trust & Safety concreteness (#4)** — extend `/trust` with:
- "Sample deliverables" section: photo checklist, walkthrough video specs, occupancy check report, lockbox install proof (cards with bullet specs + sample thumbnail blocks).
- Plain-language process sections: ID verification, background checks, escrow/payment release, dispute handling, runner conduct rules.

**6. Pricing page upgrades (#6)** — for each service tier on `/pricing`:
- "What's included" bullet list.
- "Typical use case" example.
- "Sample report" preview block (static mocked preview, labeled as sample).
- Fees disclosure block (platform fee, processing, rush, travel).

**7. Launch-status language (#7)**
- Replace "nationwide" copy across landing/story/investors/runners with "Launching market-by-market across the U.S." / "Building runner coverage in priority investor markets".
- On market sections, introduce status chips: **Active**, **Waitlist**, **Coming soon**.

**8. Founder/human trust (#8)**
- Story page already has Brian Louwers — add a real photo asset (generated placeholder portrait + alt text), short operator background, and a founder note about why this matters & how both sides are protected.
- Add a compact founder card on the homepage.

## Batch 3 — Forms & friction

**5. Application form friction (#5)**
- `ApplicationForms.tsx` / `apply.tsx`: drop password from step 1. Collect application/early-access details, submit to existing applications table, then surface a "Verify your email to finish creating your account" step (magic-link or post-submit signup).
- Keep `website_url` honeypot — verify it stays `aria-hidden`, `tabIndex={-1}`, off-screen, `autocomplete="off"`.

## Batch 4 — Technical & a11y cleanup (#10)

- Audit non-form buttons missing `type="button"` and fix (especially toolbar/nav buttons in dashboard, profile filters, map controls).
- Add `aria-label` to every `Select`/`Input` filter on `/profiles` and `/tasks` (visible labels are absent today).
- `MarketplaceMap`: ensure custom controls use `tabIndex={-1}` where they shouldn't dominate tab order, or are properly grouped after main content.
- Add `loading="lazy"` + `decoding="async"` to non-critical `<img>` tags (avatars in lists, cover photos, gallery thumbnails).
- Per-page `head()` audit: confirm every route (`/`, `/profiles`, `/tasks`, `/runners`, `/investors`, `/pricing`, `/trust`, `/story`, `/faq`, `/apply`, `/login`, `/signup`, `/privacy`, `/terms`, `/waitlist`) has a unique title + meta description. Fix any duplicates/missing.

---

## Notes / decisions I'd like to confirm before starting

1. **Privacy of `/profile/$slug`** — should I (a) fully gate the detail page behind auth, or (b) keep a public minimal teaser (masked name, role, city, rating, services) with a "Sign in to see full profile, portfolio, reviews, and contact" wall? Option (b) is better for SEO/social proof; (a) is stricter privacy.

2. **Sample deliverables / sample report previews** — okay to generate lightweight placeholder images (property photo grid, report PDF screenshot, etc.) via the image tool, clearly labeled as examples? Or do you have real samples you want me to wire in?

3. **Founder photo** — do you want me to generate a stylized portrait placeholder for Brian Louwers, or will you supply a real photo later? (I'll wire the slot either way.)

4. **Application step 2** — after the friction-less first step, do you want the email verification + account creation to happen via Supabase magic link (no password ever), or password creation deferred to step 2 (still email-verified first)?

If you want, I can just go ahead with sensible defaults (b / generated placeholders labeled as samples / generated portrait placeholder / magic link). Reply **"go with defaults"** to greenlight everything, or answer the questions and I'll adjust before starting Batch 1.