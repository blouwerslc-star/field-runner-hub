## Goal
Temporarily close runner signups site-wide and clearly communicate that only investor signups are open.

## Changes

### 1. Gate runner signup paths
- **`src/routes/signup.tsx`**: If `role=runner` is in the URL, redirect to a new "Runners paused" info state (or force role to `investor` with a notice). Remove/disable the runner role toggle in the signup form. Default role becomes `investor`.
- **`src/routes/apply.tsx`** (field runner application): Replace the form with a "Runner applications paused" notice + email capture (waitlist) or link to the investor side. Keep the Pro/Investor application intact.
- **`src/routes/runners.tsx`**: Add a prominent banner at the top: "Runner signups are temporarily paused — join the waitlist." Keep informational content.
- **`src/routes/login.tsx`**: Change the "New here?" link to default to `role=investor`.

### 2. Site-wide announcement bar
- **New `src/components/layout/AnnouncementBar.tsx`**: Dismissible top banner: "Runner signups are temporarily paused. We're currently onboarding investors only. [Join the runner waitlist]."
- Mount in **`src/routes/__root.tsx`** (or `PublicHeader.tsx`) so it appears across public pages.
- Dismissal persisted in `localStorage` so it doesn't nag on every visit.

### 3. Landing page CTAs
- **`src/routes/index.tsx`** and **`src/components/landing/ApplicationForms.tsx`**: Any "Become a runner" / "Apply as a runner" CTAs → change label to "Join runner waitlist" and route to the waitlist page (or replace the runner form tab with a waitlist form). Investor CTAs stay unchanged and get slightly more prominence.

### 4. Waitlist reuse
- Point all runner CTAs to the existing **`src/routes/waitlist.tsx`** (add a `?role=runner` param if needed) so we still capture interest.

### 5. Backend safeguard
- **`src/lib/signup.functions.ts`** (`finalizeSignupProfile`): Server-side reject `role === "runner"` with a clear error ("Runner signups are temporarily paused"). Prevents anyone bypassing the UI.
- **`src/lib/applications.functions.ts`** (`submitFieldRunner`): Same server-side rejection, or route submissions into a "waitlist" table/flag. Simplest: reject with a friendly message and instruct to join the waitlist.

### Out of scope
- Existing runner accounts continue to work (login, onboarding, dashboard all untouched).
- Admin ability to manually invite/create runners is unchanged.
- No changes to onboarding wizard, availability scheduler, or profile pages.

## Copy (draft)
> **Runner signups are temporarily paused.** We're focused on onboarding investors right now to make sure every new runner has paid tasks waiting. Interested in running? [Join the waitlist] and we'll notify you the moment signups reopen.
