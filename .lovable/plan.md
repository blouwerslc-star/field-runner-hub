
## Why John is stuck

His screenshot ("submitted ID… keeps asking to repeat it") is a real bug, not confusion. The app has **three separate ID/verification surfaces that don't share state**:

1. **Runner Dashboard → "Identity verification" card** (`RunnerVerificationCard`)
   Uploads to the `task_files` table with `kind=id`. **This never touches `runner_id_documents`, never creates a `verification_request`, and never flips `identity_verified` on the profile.** So an admin will never see it in the verification queue, and the profile stays at level 0.

2. **`/profile/id-verification`** — uploads front/back/selfie to `runner_id_documents`. Uploading here **still doesn't submit anything for review**; the runner has to leave the page, go to `/profile/verification`, and click "Submit for ID review" for the request row to be created.

3. **`/profile/verification`** — the "Request Level 1" button. Only after clicking this does an admin get notified.

4. **`/profile/background-check`** — a fourth, disconnected flow (pay → intake → review) with its own stepper.

Meanwhile `ProfileCompletionBanner` re-reads `verification_level < 1` on every dashboard visit and keeps pushing him back to `/profile/verification` — that's the "keeps asking me to redo it" symptom. There is no single "you are on step N of M" state anywhere.

## Goal

One linear onboarding wizard. One state machine. One progress bar. One place the runner ever needs to visit until they're cleared. Everything else links into it.

## The new flow: `/onboarding` (runner)

A single route at `src/routes/_authenticated/onboarding.tsx` with a step machine derived from the profile row — no local state, no "keeps asking" because progress is computed server-side.

```
Step 1  Basics          full_name, phone, city, state, profile photo
Step 2  About you       headline, bio, services, service radius, transportation
Step 3  Identity (ID)   front + back + selfie  → auto-creates verification_request on last upload
Step 4  Background      pay $13.99 → intake form → in review
Step 5  Payouts         Stripe Connect onboarding
Done    "You're ready" screen with link to /dashboard/runner
```

Rules:
- The wizard **computes current step from the DB** (`profile` + `runner_id_documents` + `verification_requests` + `background_check_submissions` + Stripe Connect status). Refreshing, closing the tab, or coming back tomorrow always resumes on the correct step — never asks for something already saved.
- A completed step shows a green check and a "Review / edit" link but is skipped by "Continue".
- Steps in `pending_review` (ID or background) display a waiting card with ETA and a "You can move on to the next step" CTA — they don't block Step 5.
- Persistent top progress bar: `Step 3 of 5 • Identity verification`.

## Fixing the "resubmit" bug directly

- **Delete `RunnerVerificationCard` from the runner dashboard.** Replace with a single `OnboardingProgressCard` that reads the same server-side status and links to `/onboarding`. Only shows while any step is incomplete.
- **Auto-submit on Step 3.** When all three ID docs (front, back, selfie) are recorded, the server function calls the equivalent of `requestVerification({ requested_level: 1 })` in the same transaction. Runner never has to find a second button.
- **Idempotent submit.** `requestVerification` already blocks duplicates when a `pending_review` row exists — surface that as "Already submitted — in review" instead of throwing.
- **Consolidate storage.** ID uploads from anywhere in the app write to `runner_id_documents` only. Old rows in `task_files` with `kind=id` get a one-time migration to `runner_id_documents` (upsert on `user_id,kind` if we can infer the kind from filename, otherwise imported as `front_id` with a note).
- **ProfileCompletionBanner** stops linking to `/profile/verification`. It links to `/onboarding` and its checklist mirrors the wizard steps 1-1 so it can never disagree.

## Old routes

- `/profile/verification`, `/profile/id-verification`, `/profile/background-check` all keep working (deep links from emails, admin, etc.) but are turned into **thin wrappers that redirect to `/onboarding?step=identity|background`**. Removes them as independent entry points without breaking anything.

## Admin side

- Admin `/admin/verifications` and `/admin/background-checks` already exist and are unchanged — the wizard just makes sure they get the right rows in the right order.
- Add a small "Onboarding progress" column to `/admin/profiles` (`1/5`, `3/5 (ID in review)`, etc.) so ops can see where a runner is stuck.

## Files

**New**
- `src/routes/_authenticated/onboarding.tsx` — the wizard shell + step router
- `src/components/onboarding/OnboardingStepper.tsx`
- `src/components/onboarding/steps/StepBasics.tsx`
- `src/components/onboarding/steps/StepAbout.tsx`
- `src/components/onboarding/steps/StepIdentity.tsx` (wraps existing `UploadCard` logic from `profile.id-verification.tsx`)
- `src/components/onboarding/steps/StepBackgroundCheck.tsx` (wraps existing checkout + `BackgroundCheckIntakeForm`)
- `src/components/onboarding/steps/StepPayouts.tsx` (wraps existing Stripe Connect start)
- `src/components/dashboard/OnboardingProgressCard.tsx`
- `src/lib/onboarding.functions.ts` — one server fn `getRunnerOnboardingStatus()` that returns `{ steps: [{ key, status, cta }], currentStep, percentComplete }`, plus `submitIdentityForReview()` called automatically after the third ID upload

**Edited**
- `src/lib/ops.functions.ts` — `recordIdDocument` auto-fires `requestVerification` when all three kinds are on file and no pending request exists
- `src/lib/verification.functions.ts` — `requestVerification` returns the existing pending request instead of throwing when one exists
- `src/routes/_authenticated/dashboard.runner.tsx` — replace `RunnerVerificationCard` with `OnboardingProgressCard`
- `src/components/dashboard/ProfileCompletionBanner.tsx` — link to `/onboarding`, use same status source
- `src/routes/_authenticated/profile.verification.tsx`, `profile.id-verification.tsx`, `profile.background-check.tsx` — redirect to `/onboarding?step=...`

**Deleted**
- `src/components/dashboard/RunnerVerificationCard.tsx`

**Migration**
- One SQL migration: copy `task_files` rows with `bucket = 'runner-ids'` into `runner_id_documents` (best-effort kind detection from filename), then leave the old rows in place for audit.

## Out of scope

- Investor onboarding (separate follow-up; investors don't hit this bug)
- Redesign of the admin verification queue
- Changing what a background check actually costs or what data it collects
- Weekly availability scheduler (already shipped)
