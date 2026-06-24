## Goal

Make GPS verification rock-solid on both the website and the iOS/Android app, with background tracking on native so a runner's drive to the property is captured even when the phone is locked. Auto-mark the runner as "Arrived" the moment they cross into the geofence.

## What already works (keep)

- Server-side ping intake (`submitPing`), distance + inside/outside computation (DB trigger), audit log of permission outcomes, geofence enforcement on "Complete," investor-visible map and trail, "Tracking active" top-of-screen banner, admin override + flagged-tasks view, stale-tracking sweep.
- Web foreground tracking via `useTaskTracking` (`navigator.geolocation.watchPosition`).

## What's missing

1. The Capacitor wrapper never calls the native Geolocation plugin, so on iOS/Android we're using the WebView's `navigator.geolocation`. That stops the moment the screen locks or the runner switches apps — exactly when we most need to prove they drove to the property.
2. No background-location permission strings in `Info.plist` / `AndroidManifest.xml`.
3. No automatic state transition when the runner enters the geofence — they have to remember to tap "I've Arrived."
4. No clear in-app diagnostic when permission is blocked at the OS level (only at the browser API level).

## Changes

### 1. Native background-capable GPS

- Install `@capacitor/geolocation` (foreground permission flow on both platforms) and `@capacitor-community/background-geolocation` (keeps pinging when the app is backgrounded or screen is off).
- Rewrite `src/hooks/useTaskTracking.ts` into a thin dispatcher:
  - **Web:** existing `navigator.geolocation.watchPosition` path, unchanged.
  - **Native:** request `Geolocation.requestPermissions({ permissions: ['location'] })` on consent; then start a `BackgroundGeolocation.addWatcher` with `requestPermissions: true`, `stale: false`, `distanceFilter: 30` (meters), and a foreground notification ("REI Runner is verifying you're on-site"). Pipe each fix into the same `submitPing` server fn.
  - Keep the same buffer-and-flush behavior (offline retry, throttle to one ping per 20s or 30m of movement).
- Stop the watcher when `active` goes false, on task complete, on `stopTracking`.

### 2. Permission strings (one-time native shell edits)

Update `docs/MOBILE_BUILD.md` instructions and the actual `Info.plist` / `AndroidManifest.xml` (committed under `ios/` and `android/` once those folders are scaffolded). The keys we'll add:

- iOS: keep `NSLocationWhenInUseUsageDescription`; add `NSLocationAlwaysAndWhenInUseUsageDescription` and `UIBackgroundModes` → `location`.
- Android: add `ACCESS_BACKGROUND_LOCATION` and `FOREGROUND_SERVICE_LOCATION` (Android 14+), plus the `FOREGROUND_SERVICE` permission the background plugin needs.

### 3. Auto-arrive on geofence entry

- In `useTaskTracking`, after each successful ping, if the response says the runner is now inside the geofence and `runner_state === 'en_route'`, call `transitionRunnerState({ to: 'arrived' })` once. Guard with a local "already auto-arrived for this task" flag so it doesn't fire repeatedly.
- Server side: extend `submitPing` to return `{ ok, inside, runner_state }` so the client can react without an extra round trip.
- Investor still gets the existing notification path because the transition writes a timeline event.

### 4. Diagnostics

- On the runner's task tracking panel, surface OS-level permission state for native (using `Geolocation.checkPermissions()`), so a runner who denied at install time sees a clear "Open settings to enable location" link instead of a generic "denied" error.
- Add a small "Test location" button in `/settings` that asks for a single fix and reports lat/lng + accuracy. Useful for support.

## Technical details

- `useTaskTracking` becomes a `switch (Capacitor.getPlatform())` at the top of the effect, importing the native plugins dynamically (so the web bundle stays clean).
- Background plugin's `addWatcher` callback runs in a special JS context — the existing `useServerFn(submitPing)` won't work there directly. We'll call the server fn through a tiny module-level adapter that takes `(taskId, position)` and uses the bare `submitPing` import, which is fine since server fns are also callable without `useServerFn`.
- Auto-arrive guard lives in a `useRef<Set<string>>()` keyed by `taskId` so re-renders don't double-fire.
- No DB migrations needed — schema already has `tracking_active`, `runner_state`, `last_ping_within_geofence`, geofence radius, and audit tables.
- Mapbox token already comes from `getMapboxToken`; no new secrets.

## Verification

- Web: open `/tasks/$taskId/tracking`, start tracking, watch pings land in `task_location_pings` with the right `within_geofence` flag.
- Native simulator (iOS + Android): use the simulator's location-spoof tool to drive a route into the geofence; confirm:
  1. Permission prompt appears.
  2. Pings continue after locking the screen / sending the app to background.
  3. State auto-flips to "Arrived" when crossing the radius.
  4. Foreground service notification is visible on Android.
- Confirm `last_ping_at` keeps advancing every ~20s and `sweep_stale_tracking` doesn't kill it mid-drive.

## Out of scope

- Web background tracking (browsers don't support it reliably; foreground-only on web is intentional).
- Anti-spoofing detection beyond what we already have (accuracy + speed are stored on each ping; flagging logic can come later).
- Pre-task "find runners near me" geolocation (separate marketplace feature, not verification).
