# Background check approval — what's actually happening

## Diagnosis

There are 3 runners who paid the $13.99 fee. **None of them have submitted the encrypted intake form.** That's why the Pass / Fail / Needs Info buttons on the admin page won't press — the card renders from the `profiles` row (payment record), but there's no `background_check_submissions` row to act on, so every action button is disabled (`disabled={!sub.id}`).

Paid, no intake form on file:
- Karl Duncan — kedmsd@att.net — paid Jul 6
- Lakesha Actkinson — lakesha_actkinson@yahoo.com — paid Jul 6
- Jason Richards — jrich1642@gmail.com — paid Jun 18 (already flagged verified manually)

So there is **no encrypted form hiding somewhere** — they simply never filled it out after paying. They land on `/profile/background-check`, see the intake form, and drop off.

## Plan

Two-part fix: unblock these three runners today, then prevent future dropoff.

### 1. Unblock the three current runners
- Add an **"Email runner to finish intake"** button on every "Awaiting info" card (paid, no submission). Sends a templated reminder with a deep link back to `/profile/background-check`.
- Add an **admin "Refund & cancel"** button on the same card (clears `background_check_paid_at`, records audit event) for cases where the runner has ghosted and we want to close the loop.
- Keep Pass/Fail/Needs-info disabled on these cards — but replace the greyed buttons with a clear inline explainer: *"Runner paid but hasn't submitted the encrypted intake form yet. Nudge them below."* Right now it looks broken; it should look intentional.

### 2. Reduce dropoff after payment
- On successful checkout return (`/profile/background-check?paid=1`), auto-scroll to the intake form and show a one-time toast: *"Payment received. Complete the secure intake form below to start your check (takes ~5 min)."*
- Add an automated reminder: if `background_check_paid_at` is set and no submission exists after 24h / 72h / 7d, send an email nudge. Piggyback on the existing `runner_eligibility_reminders` / email queue infra.
- Show a persistent banner on the runner dashboard: *"Finish your background check — $13.99 paid, intake form pending."*

### 3. Small admin UX cleanup
- "Awaiting info" tab already exists but the empty/no-action state on paid-no-form cards is the confusing part. Reword the tab hint and card copy so it's obvious the ball is in the runner's court.
- Show `submitted_at` vs `paid_at` more prominently so admins can tell at a glance which stage a runner is in.

## Technical notes

- `src/routes/_authenticated/admin.background-checks.tsx` — add nudge/refund buttons + explainer block for `!sub.id` cards.
- `src/lib/verification.functions.ts` — new server fns `adminNudgeBackgroundCheckIntake` and `adminRefundBackgroundCheck` (both `requireSupabaseAuth` + admin role check). Nudge writes a `notifications` row and enqueues an email; refund clears `background_check_paid_at` and writes an audit event (does **not** issue a Stripe refund — flagged for manual refund in Stripe with a link).
- `src/lib/email-templates/` — add `background-check-intake-reminder.tsx`.
- `src/routes/api/public/hooks/eligibility-reminders.ts` — extend to include paid-but-no-intake at 24h / 72h / 7d cadence.
- Runner dashboard banner — reuse `ProfileCompletionBanner` pattern.

## Out of scope

- Automatic Stripe refunds (do those by hand in the Stripe dashboard — safer).
- Changing the intake form itself.
- Anything to do with the signup pause / investor-only flow.
