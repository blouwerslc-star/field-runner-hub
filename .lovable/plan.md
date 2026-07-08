## Problem

`/waitlist` currently renders only a "You're on the waitlist" confirmation screen — there's no form. Anyone clicking "Join the runner waitlist" from the announcement bar, the `/apply?role=runner` paused screen, or elsewhere lands on a thank-you page without ever submitting anything, so no waitlist entries are captured.

## Fix

Turn `/waitlist` into a real form-first page, and move the existing thank-you UI to a `?submitted=1` success state on the same route.

### 1. Storage
Add a `runner_waitlist` table (Lovable Cloud migration):
- `id uuid pk`, `created_at timestamptz`, `full_name text`, `email citext unique`, `phone text`, `city text`, `state text`, `market text`, `notes text`, `source text` (defaults to `waitlist_page`), `user_agent text`, `referrer text`.
- GRANTs: `INSERT` to `anon` + `authenticated` (public form), `ALL` to `service_role`. RLS enabled; policy allows anon insert only. No public SELECT.

### 2. Server function
`joinRunnerWaitlist` in `src/lib/waitlist.functions.ts`:
- Public (no auth middleware), Zod-validated payload.
- Uses server publishable client for insert; handles duplicate-email as a soft success ("already on the list").
- Fires an admin notification email (reuse `email-sender.server.ts` + a lightweight template) and a confirmation email to the applicant (reuse existing `applicant-welcome` styling for brand consistency).

### 3. Route UI (`src/routes/waitlist.tsx`)
- Default view: hero + short-form with Name, Email, Phone (optional), City, State, Market focus (optional), "Anything we should know?" textarea. Submits via the server fn, then navigates to `/waitlist?submitted=1`.
- `?submitted=1` view: current "You're on the waitlist" confirmation card, unchanged copy.
- Reuses existing form primitives (`Input`, `Button`, `Textarea`, `toast`) and matches the dark theme used on `/apply`.
- Keeps `noindex` meta.

### 4. Wire-up
- `AnnouncementBar`, `/apply?role=runner` paused card, `/runners`, home hero, and `PublicHeader` "Runner Waitlist" already link to `/waitlist` — no changes needed once the form is on that route.

## Out of scope
- Investor waitlist (investors are still open for signup).
- Admin dashboard view of waitlist entries (query the table directly for now; can add UI later).
- Automated "we're reopening" broadcast (will hook into `broadcasts.functions.ts` when signups reopen).
