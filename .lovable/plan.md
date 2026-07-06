
# Cross-Platform Parity Audit Plan

Goal: verify REI Runner behaves and looks the same across three surfaces — desktop web, mobile web, and the Capacitor iOS/Android app — and produce a prioritized fix list. No code changes in this pass; the deliverable is a written audit + issue log. Fixes ship in follow-up plans grouped by severity.

## Scope

In scope:
- Public marketing routes (`/`, `/investors`, `/runners`, `/pricing`, `/apply`, `/waitlist`, `/coverage`, `/about`, `/faq`, `/trust`, `/story`, `/profiles`, `/profile/$slug`, blog + service pages)
- Auth flows (`/signup`, `/login`, `/forgot-password`, `/reset-password`, Google OAuth)
- Authenticated investor + runner dashboards, tasks, messaging, onboarding wizard, profile pages
- Global chrome: `AnnouncementBar`, `PublicHeader`, `MobileDrawer`, `MobileBottomNav`, `BackButton`, `InstallPrompt`, `TrackingActiveBanner`
- Native-only paths: deep links, Android hardware back, push notifications (OneSignal), camera/photo capture, Stripe/Checkr external browser handoff, splash + status bar

Out of scope for this audit: backend logic changes, new features, redesigns, admin tools.

## Audit dimensions (checked on all three surfaces)

1. Rendering & layout — no overflow, safe-area insets respected, no clipped CTAs, drawer opens/closes cleanly, bottom nav doesn't overlap content.
2. Navigation — every header/footer/drawer link resolves, back button behaves, deep links open the right route, no 404s on refresh.
3. Auth — email + Google signup/login, session persistence across reload and app relaunch, logout clears state, redirect after login lands on the right dashboard.
4. Forms — signup, waitlist, apply, post-task wizard, onboarding wizard, profile edit, messaging: keyboard behavior, validation, submit success, error states.
5. External handoffs — Stripe Connect, Stripe Checkout, Checkr background check, external doc links open in in-app browser on native, new tab on web, and return correctly.
6. Media capture — ID/selfie upload uses camera on native, file picker on web; portfolio + avatar upload paths.
7. Notifications — OneSignal identity sync on login/logout, push permission prompt on native, in-app notification bell.
8. Performance — first paint, route transitions, image loading, obvious jank on mid-tier Android.
9. Announcement + gating — runner signup paused messaging visible and consistent; runner-role signup blocked everywhere (client + server).
10. SEO/meta — titles, descriptions, og tags per route (web only; native N/A).

## Method

1. Route inventory — enumerate every route under `src/routes/` and every nav link in `PublicHeader`, `MobileDrawer`, `MobileBottomNav`, dashboard shells, and footers. Build one checklist reused across surfaces.
2. Desktop web pass — Playwright at 1280x1800 against `http://localhost:8080`, walk the checklist, screenshot each route, capture console + network errors.
3. Mobile web pass — Playwright at 390x844 (iPhone) and 360x800 (Android) against the same URL, repeat the checklist, focus on drawer, bottom nav, safe-area, form keyboard behavior.
4. Authenticated pass — restore the injected Supabase session, repeat the checklist for investor and runner dashboards on desktop + mobile viewports.
5. Native app pass — this sandbox can't run iOS/Android binaries, so native coverage is done by:
   - Static review of `capacitor.config.ts`, `src/lib/native.ts`, `initNativeShell`, back-button handler, deep link handler, OneSignal init, camera helpers.
   - Verifying every branch guarded by `isNative()` has a working web fallback and vice versa.
   - Cross-referencing `docs/MOBILE_BUILD.md` against current code for drift.
   - Listing anything that requires a physical device or TestFlight/Play internal build to verify, so the user can run those checks or hand them off.
6. Findings log — one table per surface: route/area, symptom, severity (P0 broken, P1 degraded, P2 polish), suspected cause, proposed fix.
7. Prioritized remediation plan — grouped follow-up plans, P0 first.

## Deliverable

A single audit report posted in chat containing:
- Route inventory + coverage matrix (desktop / mobile web / native)
- Screenshot evidence for each surface (stored under `/tmp/browser/audit/`)
- Findings log with severity + proposed fixes
- A short list of native-only checks the user needs to run on a real device

## Technical notes

- Playwright script lives at `/tmp/browser/audit/run.py`; screenshots at `/tmp/browser/audit/screenshots/`.
- Session restore uses `LOVABLE_BROWSER_SUPABASE_*` env vars per project browser-use conventions.
- Native review is source-only — do not attempt `npx cap run` in the sandbox.
- No code, migrations, or config changes in this pass.

## Out of scope / non-goals

- Redesign, copy rewrites, new features.
- Backend/RLS changes.
- App Store / Play Store submission steps.
