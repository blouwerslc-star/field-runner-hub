## Phase 9 — Task-Only GPS Tracking

A privacy-respecting GPS layer that only runs while a runner is actively working an assigned task. Built on the existing tasks/notifications stack, Mapbox (token already configured), and Supabase Realtime.

### 1. Database (one migration)

**Add columns to `tasks`:**
- `property_lat numeric(9,6)`, `property_lng numeric(9,6)` — geocoded once on task post/update
- `geofence_radius_ft integer default 250`
- `runner_state text` — one of `accepted | en_route | arrived | in_progress | completed | verified` (parallel to existing `status`; existing flows untouched)
- `runner_state_at timestamptz` columns per transition (`accepted_at`, `en_route_at`, `arrived_at`, `started_at`, `completed_at`, `verified_at`)
- `tracking_active boolean default false`
- `last_ping_at timestamptz`, `last_ping_within_geofence boolean`

**New table `task_location_pings`:**
- `id uuid pk`, `task_id uuid fk`, `runner_id uuid`, `investor_id uuid`
- `latitude numeric(9,6)`, `longitude numeric(9,6)`, `accuracy_m numeric`, `speed_mps numeric`, `heading_deg numeric`
- `runner_state text`, `within_geofence boolean`, `distance_ft numeric`
- `created_at timestamptz default now()`
- Indexes: `(task_id, created_at desc)`, `(runner_id, created_at desc)`

**New table `task_permission_events`** — logs permission grants/denials/failures for admin audit.

**Realtime:** add both tables to `supabase_realtime` publication.

**RLS (strict):**
- Pings: runner can INSERT only when `runner_id = auth.uid()` AND assigned to that task AND `tracking_active = true`. SELECT visible only to assigned runner, assigned investor, and admin. No anon.
- Tasks geofence columns: read via existing tasks RLS; investor sees `property_lat/lng` only for tasks they own; runner sees only for their assigned tasks. Implemented via a security-definer `get_task_geofence(task_id)` returning the safe subset.
- Admin override RPC: `admin_override_task_completion(task_id, reason)` — admin-only via `has_role`.

**Geofence helper:** SQL function `haversine_ft(lat1, lng1, lat2, lng2)` for distance computation; trigger on ping insert auto-fills `within_geofence` and `distance_ft` and updates `tasks.last_ping_*`.

**Auto-stop trigger:** when `tasks.runner_state` becomes `completed`/`verified` or `tasks.status` becomes `cancelled`, set `tracking_active = false`.

### 2. Server logic (`createServerFn`)

`src/lib/tracking.functions.ts`:
- `startTracking({ taskId })` — verifies caller is assigned runner; sets `runner_state='en_route'`, `tracking_active=true`, stamps `en_route_at`.
- `transitionRunnerState({ taskId, state })` — validates transition (accepted→en_route→arrived→in_progress→completed); stamps the matching timestamp; on `completed` also flips `tracking_active=false`.
- `submitPing({ taskId, lat, lng, accuracy, speed, heading })` — inserts into `task_location_pings`. Server validates assignment + `tracking_active=true`.
- `stopTracking({ taskId, reason })` — runner can stop manually; flips flag, logs reason.
- `logPermissionEvent({ taskId, outcome, error })` — records denied/unavailable.

`src/lib/tracking-admin.functions.ts`:
- `getTaskTrail({ taskId })` — admin/investor/runner-scoped; returns ordered pings.
- `flagSuspiciousTasks()` — admin list: tasks completed with last ping outside geofence.
- `adminOverrideCompletion({ taskId, reason })` — admin-only.

`src/lib/geocoding.server.ts`:
- `geocodeAddress(address, city, state, zip)` via Mapbox forward geocoding using `MAPBOX_PUBLIC_TOKEN`.
- Called from existing task create/update server fns to fill `property_lat/lng` (one-shot, cached).

### 3. Runner UX (mobile-first)

`src/components/tracking/TaskTrackingPanel.tsx` (rendered inside the existing task detail / runner dashboard):
- **Status pill** showing current `runner_state` with action button:
  - Accepted → **Start Navigation** (consent sheet → permission → state=en_route → `watchPosition` starts)
  - En Route → **I've Arrived** (only enabled when geofence-inside)
  - Arrived → **Start Task**
  - In Progress → **Complete Task** (warns + requires confirmation if outside geofence)
- **Consent sheet** (`TrackingConsentSheet.tsx`) — explains exactly what's tracked, when it stops, who sees it. Required before first start.
- **TrackingActiveBanner** — persistent top bar while `tracking_active=true`: pulsing dot + "Tracking active for [task title] · Stop".
- **useTaskTracking() hook** — owns `navigator.geolocation.watchPosition`; throttles to one ping per 20 s OR ≥30 m movement (Haversine). Pings the server fn. Auto-stops on unmount, on `visibilitychange` to hidden for >5 min, on task state transition, and when the page unloads. Backoff and retry on transient network failures; buffers up to 20 pings while offline (already cached by PWA SW) and flushes on reconnect.
- Permission denial / position-unavailable → fallback UI, logs permission event, surfaces "Enable location to continue this task" with retry.

### 4. Investor UX

`src/routes/_authenticated/tasks.$taskId.tracking.tsx`:
- **Map** (Mapbox GL) showing property marker, geofence circle, runner's latest ping with timestamp + accuracy.
- **Status timeline** — accepted → en route → arrived → in progress → completed → verified with timestamps.
- **Inside radius?** badge — green/red.
- Realtime channel subscribed to `task_location_pings` filtered by `task_id` for live updates.
- Submission view augmented: completion photos + GPS verification stamp side-by-side.

### 5. Admin UX

`src/routes/_authenticated/admin/tracking.tsx`:
- Tab: **Flagged tasks** — list of completed tasks where last ping was outside geofence or no pings exist.
- Detail drill-in: full ping trail rendered as polyline on Mapbox, ping list with timestamps/accuracy/distance, permission event log, "Verify" and "Override completion" buttons.

### 6. Privacy guarantees enforced

- Server fn refuses pings when `tasks.runner_state ∈ {completed, verified, cancelled}` or `tracking_active=false`.
- Auto-stop trigger on terminal states.
- `last_active_at` heartbeat on the runner page; if no ping/heartbeat for 10 min, server fn `sweepStaleTracking` (cron, daily-but-can-be-frequent) flips `tracking_active=false` and inserts a `task_status_events` "tracking_auto_stopped" entry.
- RLS scopes pings to (runner, investor, admin) only.
- Runner-visible "Stop tracking" button always available.
- No tracking outside an active task window — there is no `users.location` table at all.

### 7. Geocoding lifecycle

- On task create/update of address fields, call `geocodeAddress` → fill `property_lat/lng`. If geocoding fails, task still posts but tracking marks `geofence_unknown` and skips the inside-radius check (admin gets a "missing coordinates" flag).

### Files to create
- `supabase/migrations/<ts>_task_gps_tracking.sql`
- `src/lib/tracking.functions.ts`
- `src/lib/tracking-admin.functions.ts`
- `src/lib/geocoding.server.ts`
- `src/hooks/useTaskTracking.ts`
- `src/components/tracking/TaskTrackingPanel.tsx`
- `src/components/tracking/TrackingConsentSheet.tsx`
- `src/components/tracking/TrackingActiveBanner.tsx`
- `src/components/tracking/TaskMap.tsx` (Mapbox wrapper — geofence circle + markers + trail polyline)
- `src/routes/_authenticated/tasks.$taskId.tracking.tsx`
- `src/routes/_authenticated/admin/tracking.tsx`

### Files to edit
- `src/lib/tasks.functions.ts` — call geocoder on create/update; expose `runner_state` transitions
- Runner dashboard / task detail — mount `TaskTrackingPanel`
- Investor dashboard / task detail — add "Track runner" link
- Admin nav — add Tracking entry
- `src/routes/__root.tsx` — mount `TrackingActiveBanner` so it persists across routes
- `src/integrations/supabase/types.ts` (regen)

### Out of scope (call out, don't build)
- Background tracking when the PWA tab is fully closed — browsers don't allow it. Tracking pauses when the tab is backgrounded by the OS; we surface this clearly in the consent sheet ("keep this screen open while on the way"). Native background tracking would require Capacitor `@capacitor/geolocation` + a foreground service, which we can add later if needed.

Reply **go** to build, or tell me what to change.
