# Daily admin activity digest

Send one summary email per day at 8am to **blouwerslc@gmail.com** covering everything that happened in the platform over the last 24 hours.

## What's covered

Each digest groups activity into four sections:

- **Signups & applications** — new accounts (runner/investor) + field runner applications submitted
- **Verification & academy** — background checks paid, ID docs uploaded, verifications approved/rejected, academy certifications earned
- **Task lifecycle** — tasks posted, accepted, submitted, completed/approved
- **Money & support** — payments funded, payout requests, support requests, reports, disputes

Each section shows a count plus a short list (name + timestamp + link to the admin record). If nothing happened in a section, it's hidden. If nothing happened anywhere in 24h, no email is sent (so your inbox stays clean).

## Pieces being built

1. **New email template** `admin-daily-digest.tsx` — branded React Email layout with collapsible sections and counts, registered in the template registry as `admin_daily_digest`.

2. **New server route** `src/routes/api/public/hooks/admin-daily-digest.ts` — queries the last 24h from existing tables (`profiles`, `field_runner_applications`, `background_check_submissions`, `verification_requests`, `runner_profiles`, `tasks`, `payments`, `payout_requests`, `support_requests`, `reports`, `disputes`, `activity_events`), assembles the digest data, and sends one email via `sendTransactionalEmail` to `blouwerslc@gmail.com`.

3. **Cron job** scheduled at `0 13 * * *` (8am Central / 13:00 UTC) calling the hook with an empty body.

4. **Recipient is hardcoded** to `blouwerslc@gmail.com` in the hook — easy to change later, no admin UI needed.

## Technical notes

- Uses existing `sendTransactionalEmail` helper and `notify.reirunner.com` sender
- No new tables required — all data already exists in the schema
- Hook is idempotent: queries by `created_at >= now() - interval '24 hours'`, so duplicate runs just resend the same digest
- No suppression issues since `blouwerslc@gmail.com` is an internal address
