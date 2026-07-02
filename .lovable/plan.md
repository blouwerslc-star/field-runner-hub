## 1. Fix the runner/investor count mismatch

**Root cause**
- **Browse (`/profiles`)** counts only rows where `profiles.public_profile_enabled = true` AND `profiles.suspended = false`. If a runner never toggled their profile public, they don't appear or count.
- **Admin analytics** counts everyone with the `runner` / `investor` role in `user_roles`, regardless of profile visibility.

Two different populations → the numbers will never match by design.

**Fix**
- Add a new server fn `getPublicDirectoryCounts()` that returns:
  - `total_runners` = users with role `runner` AND `public_profile_enabled=true` AND `suspended=false`
  - `total_investors` = same for `investor`
  - `hidden_runners` / `hidden_investors` = role holders whose profile is hidden (for admin visibility)
- Browse page shows the visible counts (what's actually listable) with a tooltip: *"Verified & public profiles only."*
- Admin analytics page shows **both** numbers side-by-side: "Runners: 42 total · 27 public" so it's obvious what each represents.
- Add an admin-only reconciliation view at `/admin/analytics` listing role-holders who are hidden (so you can nudge them to publish).
- Realtime: browse count already refetches on filter change; add `refetchInterval: 60_000` so it stays live.

## 2. Weekly recurring availability scheduler

Today runners only have a **block-out-a-date** picker (`AvailabilityBlockEditor`). We'll add a full weekly schedule on top, keep the date-blocker for exceptions.

**New table `runner_availability_schedule`**
- `runner_id uuid` (FK auth.users)
- `weekday smallint` (0=Sun … 6=Sat)
- `start_time time`, `end_time time`
- `timezone text` (IANA, default from profile)
- `label text nullable` (e.g. "Morning shift")
- unique index `(runner_id, weekday, start_time, end_time)`
- RLS: runner manages own; anon/authenticated can `SELECT` (needed for public "Next available" chip)
- GRANTs to `authenticated`, `service_role`, and `SELECT` to `anon`

Also add `profiles.timezone text` if missing, and `profiles.scheduling_notes text` for a short freeform note ("48h notice preferred").

**New server fns** (in `profile-extras.functions.ts`)
- `listAvailabilitySchedule({ runnerId })` — public read
- `upsertAvailabilityWindow({ weekday, start, end, label })` — auth, runner only
- `deleteAvailabilityWindow({ id })` — auth, runner only
- `setSchedulingMeta({ timezone, notes })` — auth
- `computeNextAvailableSlot({ runnerId })` — reads schedule + date blocks and returns the next 3 open windows (used on public profile card)

**New component `WeeklyAvailabilityScheduler.tsx`** (settings → profile section for runners)
- Header row: **timezone** dropdown (IANA list, defaults to browser tz), **scheduling notes** input, **Copy Mon → all weekdays** helper.
- 7-column grid (Sun–Sat) — each column shows stacked time-window chips with hover **✕** to delete.
- **"+ Add window"** per day opens a compact popover with two time inputs (15-min steps), optional label, quick presets: *Morning (8–12), Afternoon (12–5), Evening (5–9), All day (8–8)*.
- Live validation: end > start, no overlap on same day (warn + block save).
- **Preview strip** below the grid renders the *next 7 days* with green blocks pulled from schedule, red blocks for date-blocks — so runners visually confirm what investors will see.
- Bulk actions: **Weekdays (Mon–Fri)**, **Weekends**, **Clear day**, **Clear all**.
- Save is optimistic via `useMutation` + `invalidateQueries(['availability-schedule', runnerId])`.
- Mobile: switches to a stacked accordion (one card per day) with the same popover editor.

**Public profile display (`/profile/$slug`)**
- New "Availability" card showing:
  - Weekly grid mini-view (read-only, timezone-aware).
  - "Next available: **Tue 9:00 AM CT**" chip powered by `computeNextAvailableSlot`.
  - Scheduling notes below.
- Investors see this before hiring; drives conversion.

**Integration with existing block-out dates**
- Keep `AvailabilityBlockEditor` — rename its section to **"Time off & blocked dates"**.
- `computeNextAvailableSlot` subtracts blocked dates from the weekly schedule.

## 3. Files touched

- `supabase/migrations/*` — new `runner_availability_schedule` table + GRANTs + RLS + `profiles.timezone`/`scheduling_notes` columns
- `src/lib/profile-extras.functions.ts` — 5 new server fns
- `src/lib/profiles.functions.ts` — add `getPublicDirectoryCounts`
- `src/components/profiles/WeeklyAvailabilityScheduler.tsx` — new
- `src/components/profiles/PublicAvailabilityCard.tsx` — new
- `src/routes/_authenticated/settings.profile.tsx` — mount scheduler for runners
- `src/routes/profile.$slug.tsx` — mount public availability card
- `src/routes/profiles.tsx` — swap in `getPublicDirectoryCounts`, add "public only" tooltip
- `src/routes/_authenticated/admin.analytics.tsx` — show total vs public breakdown + hidden-role-holders panel

## Technical notes

- All schedule writes go through `createServerFn` with `requireSupabaseAuth`, so RLS acts as the runner.
- Public `computeNextAvailableSlot` uses the server publishable client (narrow `TO anon` SELECT on the schedule table + safe column projection).
- Time storage: `time` (no date) + separate IANA timezone → we convert to viewer's local tz on the client with `Intl.DateTimeFormat`.
- No third-party scheduling libs needed — the grid is a light custom component using shadcn `Popover`, `Select`, `Input[type=time]`, and existing `Calendar`.

## Out of scope for this pass
- Investors booking specific time slots directly on a runner (would need reservations + task-linked holds). This plan gets the visual + data foundation in place; slot booking can layer on later.