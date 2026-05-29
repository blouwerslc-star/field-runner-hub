# Fiverr-Style Public Profile System

Build a marketplace-style profile layer on top of the existing `profiles` table without disrupting the task workflow or dashboards.

## 1. Database migration

Extend `public.profiles` with nullable columns (safe defaults, no breaking changes):

- `profile_slug` text UNIQUE
- `profile_photo_url` text
- `cover_photo_url` text
- `headline` text
- `bio` text
- `services_offered` text[] default '{}'
- `experience_level` text (`beginner|intermediate|expert`)
- `years_experience` int
- `hourly_rate` numeric
- `task_rate` numeric
- `availability_status` text default 'available' (`available|busy|unavailable`)
- `average_rating` numeric default 0
- `review_count` int default 0
- `completed_tasks_count` int default 0
- `response_time` text
- `verified_status` boolean default false
- `public_profile_enabled` boolean default true
- `phone_public` boolean default false
- `featured` boolean default false
- `suspended` boolean default false
- `turnaround_time` text
- `preferred_payout_min` numeric, `preferred_payout_max` numeric
- `company_description` text

(`markets_served`, `service_radius`, `transportation_available`, `task_types`, `company_name`, `monthly_deal_volume`, `city`, `state`, `full_name`, `avatar_url` already exist.)

Auto-generate `profile_slug` from `full_name` + short id via a trigger on insert/update when null.

### RLS additions

Add a public-read policy scoped to safe columns via a SECURITY DEFINER view `public.public_profiles` that exposes only non-sensitive columns and filters by `public_profile_enabled = true AND suspended = false`. Grant SELECT on the view to `anon` and `authenticated`. Keep the base `profiles` table policies unchanged (user/admin only).

Admin policy: add UPDATE policy on profiles for admins (already covered? add if missing for `featured`, `verified_status`, `suspended`).

### Storage

Reuse `avatars` bucket for profile + cover photos. Add policy allowing public read for files under `public/` prefix or make a new `profile-media` public bucket. **Decision**: create a new public bucket `profile-media` with public read, authenticated insert/update/delete scoped to the user's own folder (`{user_id}/...`).

## 2. Server functions (`src/lib/profiles.functions.ts`)

- `getMyProfile()` — auth required, returns full profile + role
- `updateMyProfile(input)` — auth, validates with Zod, updates allowed fields
- `getPublicProfileBySlug(slug)` — public, queries the view
- `listPublicProfiles({ q, role, city, state, service, availability, sort, page })` — public
- Admin: `adminListProfiles`, `adminSetVerified`, `adminSetFeatured`, `adminSetSuspended`

## 3. Routes

- `/_authenticated/profile.edit.tsx` — edit form with photo upload, all role-specific fields rendered conditionally
- `/profile.$slug.tsx` — public profile page (Fiverr-style hero + sidebar)
- `/profiles.tsx` — directory with search/filters/sort and marketplace cards
- `/_authenticated/admin.profiles.tsx` — admin moderation table

Add links to: dashboards ("Edit Public Profile"), navbar ("Browse Profiles"), admin sidebar.

## 4. Components

- `ProfileCard` — Fiverr-style card (photo, name, headline, rating stars, location, starting rate, service badges, View Profile CTA)
- `VerifiedBadge`, `RoleBadge`, `AvailabilityBadge`, `StarRating`
- `ProfileMediaUploader` — wraps Supabase storage upload to `profile-media/{user_id}/...`

## 5. Privacy

Public view exposes only: slug, full_name, role (joined), city, state, headline, bio, profile_photo_url, cover_photo_url, services_offered, markets_served, experience_level, years_experience, task_rate, availability_status, average_rating, review_count, completed_tasks_count, response_time, verified_status, featured, created_at (member since), company_name, company_description, turnaround_time.
Excludes: email, phone (unless `phone_public`), address, IDs, payment info.

## 6. Trust

- `average_rating`, `review_count`, `completed_tasks_count` are read-only from the edit form (system-managed).
- Member since = `created_at`.
- Reviews section: render an empty state ("No reviews yet — earned after completed tasks") since review creation comes later.

## 7. Out of scope (explicit)

- Actual review writing flow (placeholder UI only)
- "Invite Runner To Task" / "Connect With Investor" CTAs wire to existing task-create / messaging flows where available; otherwise open a toast "Coming soon" so we don't block this milestone.

## Technical notes

- Use TanStack Query + `useSuspenseQuery` per the project's data pattern.
- Zod validation on all `updateMyProfile` inputs (length caps, slug regex `^[a-z0-9-]{3,40}$`).
- Slug uniqueness enforced at DB level; on conflict during auto-gen, append random suffix.
- Storage uploads go through browser client; server fn only stores resulting public URL.

Ready to implement on approval.
