
# Full Marketplace Backend & Dashboards

Your project already has: auth (runners/investors/admin via `user_roles`), `profiles`, `field_runner_applications`, `real_estate_pro_applications`, `tasks`, and an admin dashboard that creates/assigns tasks. This plan fills in the rest.

## 1. Database migration

New tables (all with RLS + GRANTs):

- **`task_submissions`** — runner deliverables per task: `task_id`, `runner_id`, `notes`, `status` (pending/approved/rejected), `reviewed_by`, `reviewed_at`, `rejection_reason`.
- **`task_files`** — file attachments: `task_id`, `submission_id` (nullable), `uploader_id`, `bucket`, `path`, `mime_type`, `size_bytes`, `kind` (photo/video/id/deliverable/other).
- **`payments`** — `task_id`, `investor_id`, `runner_id`, `amount_cents`, `platform_fee_cents`, `runner_payout_cents`, `status` (pending/charged/released/refunded/failed), `stripe_payment_intent_id`, `stripe_transfer_id`.
- **`notifications`** — `user_id`, `type`, `title`, `body`, `link`, `read_at`, `created_at`.
- **`runner_profiles`** — Stripe Connect account id, payout enabled flag. (Investor Stripe customer id stored on `profiles`.)

RLS summary (plain English):
- Runners see only their assigned tasks, their submissions, their payments, their notifications.
- Investors see only their tasks, payments for them, their notifications.
- Admins see and manage everything (existing `has_role(..., 'admin')` pattern).
- Triggers create notifications on task assigned / submitted / approved / rejected / payment released.

Realtime enabled on `tasks` and `notifications`.

## 2. Storage buckets

- `task-photos` (private) — runner-uploaded photos/videos per task
- `task-deliverables` (private) — final deliverables
- `runner-ids` (private) — ID verification docs (runner + admin only)
- `avatars` (public) — profile pictures

RLS on `storage.objects` keyed by `(bucket, taskId-or-userId-prefix)` so each user only touches their own folder; admins full access.

## 3. Stripe payments (seamless, no keys needed from you)

I'll first run `recommend_payment_provider`, then enable Stripe payments. Flow:
- Investor funds a task → Stripe PaymentIntent (held).
- Admin/auto-approve releases → transfer to runner's Stripe Connect account minus platform fee.
- Server functions: `createTaskCheckout`, `releaseTaskPayment`, `onboardRunnerStripe`. Webhook at `/api/public/webhooks/stripe`.

## 4. Functional dashboards

**Runner** (`/dashboard/runner`):
- Stats: assigned / in-progress / submitted / paid
- Tabs: Available (open tasks in market) · Assigned · Submitted · Completed
- Task detail drawer: address, payout, due, description; upload photos/video, add notes, submit
- Stripe Connect onboarding banner if not yet onboarded
- Notifications bell

**Investor** (`/dashboard/investor`):
- Stats: open / in-progress / submitted / completed; total spent
- "Post a task" wizard with Stripe checkout to fund payout
- Tabs by status; view submission deliverables; Approve / Request changes (releases payment on approve)
- Notifications bell

**Admin** (existing) — extended to also see submissions, payments, force-approve.

## 5. Notifications UI
Bell in `DashboardShell` with unread count, dropdown list, mark-as-read, realtime updates.

## Technical details

- Server functions in `src/lib/tasks.functions.ts`, `src/lib/payments.functions.ts`, `src/lib/notifications.functions.ts`, `src/lib/storage.functions.ts` (signed URLs).
- All protected with `requireSupabaseAuth`; `supabaseAdmin` only for webhook + Stripe transfers.
- New routes: `/dashboard/runner/tasks/$taskId`, `/dashboard/investor/tasks/new`, `/dashboard/investor/tasks/$taskId`.
- Server route: `src/routes/api/public/webhooks/stripe.ts` with signature verification.
- Bumps to existing `tasks` schema: add `funded` boolean + `funding_payment_id` for fund-before-assign flow.

## Order of operations

1. Approve this plan.
2. Run Stripe eligibility check → enable Stripe payments (you'll fill a short form).
3. Migration for all new tables + storage + RLS.
4. Build server functions + Stripe webhook.
5. Build runner, investor, admin UI + notifications bell.

This is a substantial buildout (~10–15 new files). Approve and I'll proceed.
