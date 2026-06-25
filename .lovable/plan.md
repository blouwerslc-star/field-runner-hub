## Goal
Replace the Checkr-based background check flow with a secure manual intake form. Runner pays the $13.99 fee, fills a detailed encrypted intake form, and you (admin) run the check externally and post the result back. Nothing changes about pricing or the Verified badge logic.

## What's wrong today
- `/profile/background-check` only shows a Stripe checkout. After payment we just wait for a Checkr webhook that will never fire — runners get stuck on "in progress" forever.
- No structured PII (legal name, DOB, SSN, address history, license) is ever captured.
- Admin page links to dashboard.checkr.com and has no way to see the submitted info.

## New flow

```text
Runner side                          Admin side
-----------                          ----------
1. Pay $13.99 (existing Stripe)
2. Fill secure intake form  ───►     3. See submission in admin queue
                                     4. Run check externally (LLC of your choice)
5. See "In review" status     ◄───   6. Mark Passed / Failed + notes
7. Verified badge appears
```

## Intake form fields (collected AFTER payment, on a new step)

Required:
- Legal first / middle / last name, suffix
- Other names used (aliases / maiden) — repeatable
- Date of birth
- SSN (last 4 by default; full SSN optional, stored encrypted)
- Driver's license number + issuing state + expiration
- Current address (street, unit, city, state, zip, since-date)
- Prior addresses (last 7 years) — repeatable
- Phone (re-confirmed) + email
- ID photo upload (front + back) → private `runner-ids` bucket (already exists)
- Selfie holding ID → same bucket

Consent block (must check all):
- FCRA disclosure & authorization
- Consent to background check
- Certification that info is true
- E-signature (typed full name) + IP + timestamp captured server-side

## Security model
- New table `background_check_submissions` — service-role only, RLS denies everyone; runner inserts/reads their own row via server functions, admin reads via `has_role('admin')` server fn.
- SSN full value stored encrypted using `pgcrypto` `pgp_sym_encrypt` keyed by a new `BG_CHECK_ENCRYPTION_KEY` secret. The intake server fn encrypts on insert; admin server fn decrypts on demand and never returns SSN in list views (only on a "Reveal SSN" action that's audit-logged).
- All file uploads go to existing private `runner-ids` bucket under `bg-check/<user_id>/...` — signed URLs only, 5-min expiry, generated server-side for admin.
- Audit log: every admin view / reveal / status change writes to a new `background_check_audit` table.
- Rate-limit: one active submission per runner; resubmission only allowed if admin marks "needs more info".

## Status state machine
`paid → awaiting_info → submitted → in_review → passed | failed | needs_info`

`background_check_verified=true` only when status=`passed` (existing logic preserved). Drop reliance on `checkr_status`; keep the column but treat `submission.status` as source of truth.

## UI changes

`/profile/background-check`:
- Renamed sub-steps in a stepper: **Pay → Submit Info → Review → Result**
- After payment, show the secure intake form (multi-section, autosaves draft locally only — never localStorage for SSN).
- After submit, show "In review — typically 1–3 business days" with timestamp and what was submitted (masked SSN, address summary).
- "Needs info" state shows admin's note + reopens the form.

`/admin/background-checks`:
- Replace Checkr CTA with internal review panel.
- Card shows: identity summary, masked SSN, address history, ID photo thumbnails (signed URLs), consent record, e-signature, IP, submitted-at.
- Buttons: Reveal SSN (audited), Download ID, Mark Passed / Failed / Needs Info + note → runner gets notified.
- Tabs: Awaiting Info, Submitted, In Review, Passed, Failed.

## Files / migrations

New migration:
- `background_check_submissions` (with GRANTs + RLS deny-all + service_role full).
- `background_check_audit` (admin-read via `has_role`).
- Enable `pgcrypto`; add helper SQL functions `bg_encrypt_ssn(text)` / `bg_decrypt_ssn(bytea)` (SECURITY DEFINER, restricted).

New / edited code:
- `src/lib/background-check.functions.ts` — add `submitBackgroundCheckIntake`, `getMyBackgroundCheckSubmission`, `requestMoreInfo`.
- `src/lib/verification.functions.ts` — update `adminListBackgroundChecks` / `adminSetBackgroundCheckStatus` to read submission table + write audit rows; add `adminRevealSsn`, `adminGetIdPhotoUrls`.
- `src/components/profiles/BackgroundCheckIntakeForm.tsx` — new multi-section zod-validated form (react-hook-form), with file upload via existing storage helpers.
- `src/routes/_authenticated/profile.background-check.tsx` — wire stepper + intake form + state-machine UI.
- `src/routes/_authenticated/admin.background-checks.tsx` — new review panel.

Secret to add: `BG_CHECK_ENCRYPTION_KEY` (random 64-char, generated, not user-provided).

## Out of scope (intentionally)
- Automatic background check vendor integration (Checkr deferred; columns kept for later).
- Cross-state monitoring / continuous checks.
- Re-running the check after Passed (would be a separate "renew" flow later).

## Open question
Default capture is **SSN last 4 only**, with an optional toggle to provide full SSN encrypted. Want me to require full SSN for everyone, or keep last-4 as the default and only ask for full SSN if you mark a submission "Needs info"?
