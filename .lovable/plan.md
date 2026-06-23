# REI Runner Growth & Scale Rollout

This is an 8-system platform upgrade. I'll ship it in phased milestones so each phase is shippable on its own and the next builds on solid ground. Each phase is roughly one focused build pass.

## Sequencing (why this order)

```text
Foundations → Trust/Proof → Engagement → Growth loops
  1. Real-time task tracking      ← schema everything else hangs off
  2. Coverage / growth map        ← public proof + SEO surface
  3. Academy certifications       ← runner trust + investor filter
  4. Investor analytics dashboard ← retention + sales surface
  5. Referral program             ← growth loop
  6. SMS notifications            ← lifecycle channel
  7. Automated email nurturing    ← lifecycle channel (uses Lovable Emails)
  8. PWA polish (already started) ← push notifications + offline shell
```

PWA installability was wired this turn (manifest + icons + meta). Phase 8 finishes it (push + offline shell) once push-worthy events from phases 1, 5, 6 exist.

## Phase 1 — Real-time task tracking (Uber-style)

- Extend `tasks.status` enum: `posted, accepted, en_route, on_site, in_progress, completed, verified` (keep existing values mapped).
- New `task_status_events` table (task_id, from_status, to_status, actor_id, note, location?, created_at) — append-only timeline.
- Trigger on `tasks` status change → insert event row + notification.
- Runner detail view: status action buttons gated by current status. Optional geolocation capture on `en_route` / `on_site`.
- Investor task view: vertical timeline component subscribed to `task_status_events` via Supabase Realtime.
- Add `verified` action for investors after `completed`.

## Phase 2 — Public coverage & marketplace growth map

- New public route `/coverage` (SSR, full head/OG metadata).
- Server fn aggregates from `profiles` + `tasks`: runners per state/city, tasks completed, states covered, cities covered, recent signups, 7-day deltas. Cached in a materialized view refreshed hourly via pg_cron.
- Mapbox map (token already in secrets) with state choropleth + city density bubbles + "recently joined" pins.
- Live stat strip (totals + weekly growth) reused on homepage hero.
- "Underserved markets" panel: cities with investor demand but <N runners → CTA to apply.

## Phase 3 — Academy certifications

- Tables already exist (`academy_courses`, `lessons`, `quizzes`, `quiz_results`, `certifications`). Wire the missing pieces:
  - Certification definitions for Photography, Occupancy Verification, Lockbox Install, Property Walkthroughs, Field Safety.
  - Award flow: pass quiz ≥80% → insert `academy_certifications` row → badge appears on runner profile.
  - PDF certificate generator (server fn, html-to-pdf via a Worker-compatible lib or simple printable page).
  - Investor-side runner directory: filter chips by certification.

## Phase 4 — Investor analytics dashboard

- New tab on investor dashboard `/dashboard/investor/analytics`.
- Server fns return: task counts by status, completion rate, avg time-to-complete, active runners in their served markets, spend total + monthly trend, coverage map of their tasks.
- Charts via Recharts. Date-range picker, CSV export.

## Phase 5 — Referral program

- `referrals` table (referrer_id, code unique, referred_user_id?, role, signed_up_at, qualified_at, reward_status).
- Generate code on profile create. Public `/r/:code` page sets cookie, attribution captured at signup.
- Referral dashboard widget for both roles: link, copy/share buttons, list of invited users, status pills.
- Hooks for future reward payouts (status enum: `pending → qualified → rewarded`).

## Phase 6 — SMS notifications

- Use **Twilio connector** (already preferred path on Lovable).
- `user_notification_preferences` table: per-channel (email/sms/push) per-event toggles.
- Phone verification flow (send code, verify).
- Server-side dispatcher fn called from existing notification triggers — fans out to SMS when user has phone verified + opted in.
- Settings page for prefs.

## Phase 7 — Automated email nurturing

- Use Lovable Emails (infra already set up per the email_send_log table).
- Scaffold templates: welcome (runner), welcome (investor), incomplete-application reminder (24h/72h), academy progress nudges, task posted/assigned/completed, weekly digest, re-engagement (14d/30d inactive).
- Trigger via pg_cron job that scans state tables and enqueues into `transactional_emails` queue with idempotency keys.
- Admin segment view (read-only) backed by existing `email_send_log` for visibility.

## Phase 8 — PWA finish

- Web push via OneSignal (already integrated — `initOneSignal` exists). Wire push events for task status changes, messages, referrals.
- Optional: vite-plugin-pwa with `generateSW`, NetworkFirst for navigations, guarded registration for preview safety (per the PWA skill).
- Pull-to-refresh + bottom-tab nav for installed-app feel on mobile dashboards.

## Cross-cutting

- **Marketplace stats** surfaced from a shared `useMarketplaceStats()` hook (homepage, coverage page, footer, dashboards).
- **SEO**: every new public route gets head() with title, description, og:title/desc/image, twitter card.
- **RLS**: every new table ships with grants + policies in the same migration.
- **Mobile-first**: every new screen designed at 411px first.

## What I need from you to start

Pick the entry point — I recommend starting with **Phase 1 (real-time task tracking)** because the status timeline is referenced by phases 4, 6, 7, and 8. Reply with the phase number (or "1" to start there) and I'll begin building immediately. If you'd rather I reshuffle the order (e.g. coverage map first for marketing), say so.
