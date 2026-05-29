## Settings Section for REI Runner

Build a `/settings` hub with role-aware sections, persisted preferences, and links into existing systems (profile, auth, payments). Keep dashboards, public profiles, and task workflow untouched.

---

### 1. Database

One migration adds settings/preferences columns to `profiles` (no new table — keeps one row per user, matches existing pattern):

- `notification_prefs jsonb default '{}'::jsonb` — email/SMS/task/payout/marketing/weekly toggles
- `privacy_prefs jsonb default '{}'::jsonb` — show city/state, completed count, ratings, allow contact, allow invites
- `timezone text` — IANA tz string
- `dashboard_prefs jsonb default '{}'::jsonb` — display prefs
- `theme_preference text` — 'system' | 'light' | 'dark'
- `preferred_task_radius text`
- `preferred_markets text`
- `account_status text default 'active'` — active | pending_deletion | suspended
- `deletion_requested_at timestamptz`

Reuses existing `task_types`, `services_offered`, `markets_served`, `availability_status`, `public_profile_enabled`, `phone_public`, `verified_status`, `featured` for the other toggles.

Admin platform settings go into existing `app_settings` table (key/value) — e.g. `platform_fee_percentage`.

### 2. Server functions (`src/lib/settings.functions.ts`)

- `getMySettings()` — returns profile + roles + auth user (email, created_at, last_sign_in_at)
- `updateAccountSettings()` — full_name, phone, city, state (NOT role, NOT email-change here)
- `updateNotificationPrefs()`
- `updatePrivacyPrefs()`
- `updatePreferences()` — timezone, theme, radius, markets, task_types, dashboard_prefs
- `requestAccountDeletion()` — sets account_status='pending_deletion', deletion_requested_at=now()
- `cancelAccountDeletion()`
- `submitSupportRequest({ category, subject, message })` — inserts into existing notifications for admins (or new `support_requests` table — see below)
- Admin: `getPlatformSettings()`, `updatePlatformSetting(key, value)`

Email changes use `supabase.auth.updateUser({ email })` from the client (Supabase handles confirmation). Password change uses `supabase.auth.updateUser({ password })` client-side. Password reset uses `supabase.auth.resetPasswordForEmail`.

Adds one small table `support_requests` (id, user_id, category, subject, message, status, created_at) with RLS: user inserts/views own, admin sees all.

### 3. Routes

- `src/routes/_authenticated/settings.tsx` — layout with sidebar nav (desktop) + Tabs (mobile), `<Outlet />`
- `src/routes/_authenticated/settings.index.tsx` — redirect to `account`
- `src/routes/_authenticated/settings.account.tsx`
- `src/routes/_authenticated/settings.profile.tsx` — reuses photo uploaders + key profile fields; links to `/profile/edit` for the full editor, plus "View Public Profile" button
- `src/routes/_authenticated/settings.security.tsx`
- `src/routes/_authenticated/settings.notifications.tsx`
- `src/routes/_authenticated/settings.privacy.tsx`
- `src/routes/_authenticated/settings.payments.tsx` — role-aware (runner vs investor); payout/billing history pulled from existing `payments` table; Stripe Connect shown as placeholder card
- `src/routes/_authenticated/settings.preferences.tsx`
- `src/routes/_authenticated/settings.support.tsx` — contact form + FAQ/legal links
- `src/routes/_authenticated/settings.admin.tsx` — admin-only, gated by `has_role('admin')`

### 4. Navigation

Add a "Settings" link with `Settings` icon to `DashboardShell` header next to "My profile". Visible to all authenticated users (Runner/Investor/Admin dashboards all use this shell).

### 5. Design

- shadcn `Card`, `Switch`, `Tabs`, `Button`, `Input`, `Textarea`, `Select`, `Separator`
- Desktop: 2-column with sticky left nav (`md:grid-cols-[220px_1fr]`)
- Mobile: horizontal scroll Tabs at top
- Each section: section header → cards with form rows → "Save changes" footer button per card
- `toast.success/error` from sonner for save feedback
- React Query mutations with `isPending` loading states
- Placeholder sections rendered as muted cards labeled "Coming soon" (2FA, sessions, login history, Stripe Connect, tax forms, dispute flow)

### 6. Out of scope (placeholders only)

- Real 2FA / session listing / login history
- Stripe Connect onboarding / tax forms
- Actual account-deletion processing (only records the request; admin handles)
- Dispute resolution flow

### Technical notes

- Server fns under `_authenticated` layout — safe to call from loaders
- All JSON pref columns default to `{}`; client merges defaults
- Theme toggle persists to profile AND `localStorage` for immediate apply
- Email/password changes use browser `supabase` client directly (auth-only ops)
- Support requests table follows the standard 4-step migration shape (CREATE → GRANT → RLS → POLICY)
