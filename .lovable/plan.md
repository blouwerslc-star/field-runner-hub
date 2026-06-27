# Closing the 8-point gap to 100/100

These are the issues I deferred or noted during the QA passes. None are launch blockers individually, but together they're the gap between "production-ready" and "polished."

## 1. Observability & operational safety (3 pts)

- **Stripe webhook idempotency log**: today the unique index prevents duplicate rows, but we silently swallow conflict errors. Add a `webhook_events` table (event_id PK) so retries are observable and we can replay failures.
- **Background job error surfacing**: cron hooks (`sweep-tracking`, `email-nurture`, `recurring-tasks`, `admin-daily-digest`, `eligibility-reminders`) log to stdout only. Wire failures into the `notifications` table for admins, or a lightweight `job_runs` table with status + last error.
- **Server-function error normalization**: a handful of server functions still throw raw `Error` (caught by TanStack's global middleware → generic 500). Standardize on `{ error: string }` returns for user-facing failures so the UI shows real messages.

## 2. Security hardening (2 pts)

- **11 linter warnings** from the security scan (mostly `SECURITY DEFINER` functions without explicit `search_path` on a few, and the one permissive `USING (true)` policy on `app_settings`). Audit and tighten or document each.
- **Rate limiting** on public surfaces: signup, password reset, `applyToTask`, `createReview`, OTP request. Today nothing throttles a script.
- **File upload validation**: `task-deliverables` and `runner-ids` buckets accept any mime/size from the client. Add server-side size + mime checks before issuing signed upload URLs.

## 3. Data integrity & edge cases (2 pts)

- **Refund / cancellation flow**: investor cancels a funded task → today the payment row stays `funded` and money is stuck. Add a Stripe refund path + payment status transition.
- **Dispute → payout interaction**: `disputes` table exists but doesn't freeze the payment. A runner could request payout on a disputed task.
- **Tip before approval edge**: now fixed to require `approved`/`paid`, but the UI on `/dashboard/investor` still shows the Tip button on `submitted` tasks. Hide it in the UI to match.
- **Email unsubscribe enforcement**: `suppressed_emails` table exists; verify every transactional and broadcast sender checks it before sending.

## 4. UX & accessibility polish (1 pt)

- **Form-level loading states**: a few admin mutation buttons (broadcasts, pricing) don't disable during the request — double-click risk.
- **Empty states**: marketplace, runner dashboard, and admin lists render bare when empty. Add CTAs.
- **Keyboard / a11y audit**: tab order on the multi-step signup, focus traps on modals, missing `aria-label` on icon-only buttons.
- **Mobile review** at 411px (current viewport): a few admin tables overflow horizontally without a scroll hint.

## What this plan delivers

Pick any subset:
- Subset A (security + integrity, ~6 pts): items 2 + 3 — what most launch reviewers would flag.
- Subset B (observability, ~3 pts): item 1 — pays off post-launch when something goes wrong.
- Subset C (polish, ~1 pt): item 4 — visible to users.

I'd recommend **A first, then B**, leaving C as an ongoing backlog.

## Technical notes

- New tables (`webhook_events`, optional `job_runs`) — migrations with RLS + GRANTs per project conventions.
- Rate limiting: simple `signup_attempts`-style table already exists; extend the pattern to other endpoints rather than adding a new dependency.
- Refund flow: add `refundTask` server function that calls `stripe.refunds.create`, updates `payments.status = 'refunded'`, sets `tasks.funded = false`, notifies the investor.
- No new third-party services needed.
