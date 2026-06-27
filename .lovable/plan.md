
# REI Runner — Full QA Loop to Production-Ready

## Approach

I'll run a **test → fix → retest** loop until no new blocker/major bugs surface for a full pass. Each pass uses headless Playwright against the live preview, plus database/RLS/security checks, plus build/typecheck. I'll fix anything obviously broken automatically and log everything else as a recommendation.

Heads up: this is a large effort. Expect **many turns**, dozens of file edits, and meaningful credit usage. I'll pause and check in after each full pass so you can stop early if the readiness score is good enough.

## Pass Structure (repeats until clean)

Each pass runs these phases in order:

### Phase 1 — Static & backend audit
- Run security scan, Supabase linter, slow-query check
- Verify RLS + GRANTs on every public table; flag tables missing policies
- Check storage bucket policies (avatars, runner-ids, task-deliverables, etc.)
- Audit server functions: missing `requireSupabaseAuth`, admin client at module scope, missing input validation
- Scan for console errors, broken `<Link>` targets, missing routes, dead imports
- Verify all email templates render (registry coverage)

### Phase 2 — Visitor (logged-out) testing
Routes: `/`, `/about`, `/pricing`, `/runners`, `/investors`, `/coverage`, `/faq`, `/trust`, `/privacy`, `/terms`, `/story`, `/blog/*`, `/markets/*`, `/profiles`, `/profile/$slug`, `/property-*`, `/waitlist`, `/apply`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/sitemap.xml`
- Each page: 200 status, no console errors, H1 + meta tags + OG + canonical, responsive at 411px and 1280px, no broken images
- Forms: blank submit, invalid email, oversized input, XSS payload, duplicate-account attempt
- Sitemap + robots + manifest valid; favicons load; service worker registers cleanly

### Phase 3 — Runner role
Create fresh runner account → onboarding → profile completion → background check intake → ID upload → academy → task browse → apply → accept → en-route → arrived → in-progress → complete → payout request → messaging → notifications → settings → logout
- Permission edge: try accessing investor/admin routes (should redirect)
- Empty states: no tasks, no messages, no notifications, no payouts
- Refresh mid-flow; tab close + reopen; expired session

### Phase 4 — Investor role
Create fresh investor account → onboarding → post task wizard (every field, validation, attachments) → fund task (Stripe sandbox) → discover runners → invite → review submission → approve/reject → tip → review → re-post → cancel → saved runners → analytics
- Try accessing runner/admin routes
- Edit task, change due date, dispute flow, report user

### Phase 5 — Admin role
Promote one account to admin via migration → broadcasts (template editor incl. new market-update template) → user management → task overrides → task type requests → background check review → payout approvals → email queue → eligibility reminders cron → admin daily digest → security findings
- Verify admin-only RLS gates hold

### Phase 6 — Cross-role flows
Runner ↔ investor messaging, task lifecycle end-to-end with real Stripe sandbox payment + webhook, GPS tracking ping with geofence inside/outside, dispute escalation, referral attribution, eligibility reminder send

### Phase 7 — Fix + retest
For each bug found in phases 1–6:
1. Root-cause it
2. Apply minimal fix (code, migration, RLS, template, copy)
3. Re-run the specific failing test
4. Note in pass log

### Phase 8 — Pass report
Bugs found, fixed, deferred. Readiness score 0–100 with rubric (security 25, core flows 25, polish 15, perf 10, SEO 10, accessibility 10, mobile 5). Stop when score ≥ 90 for two consecutive passes with zero new blockers, or when you tell me to stop.

## Test infrastructure I'll create once

- `/tmp/browser/qa/` — Playwright scripts per role, screenshots
- One-time SQL migration to seed a known admin role on a test account I create
- A `qa-report-passN.md` artifact per pass (kept in `/mnt/documents/`, not the repo)

## What I will NOT do without asking

- Charge real money (Stripe stays in sandbox)
- Send real emails to real users (test sends only to `blouwerslc@gmail.com` and synthetic addresses)
- Delete production data
- Touch managed integration files (`supabase/client.ts`, auth-middleware, types.ts, etc.)
- Redesign UI — only fix broken/inconsistent states
- Add new features beyond fixing what's broken

## Stop conditions

- Readiness ≥ 90 two passes in a row, OR
- You say stop, OR
- Three consecutive passes with no new auto-fixable bugs

## First turn after approval

Pass 1, Phase 1 + Phase 2 (static audit + visitor pass). I'll report findings, apply fixes, and continue to Phase 3 in the next turn so you can see progress and abort if needed.
