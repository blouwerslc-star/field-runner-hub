# REI Runner — Mobile App Readiness Plan

You picked "Do everything now" + Capacitor wrap + wipe test data. Honest framing: this is genuinely multiple days of work and risk. I'll execute in ordered batches below, pausing only for destructive actions (DB wipe) and store-account specifics that require your input (bundle IDs, signing, icons).

## Batch 1 — Mobile responsiveness & UX states audit
- Sweep every route under `src/routes/` for: viewport overflow, tap-target sizes (<44px), tables that don't collapse, modals/sheets that break <375px, and missing safe-area padding.
- Add/standardize Empty, Loading (skeleton), and Error states for: tasks list, task detail, messages, profiles, applications, dashboards (investor/runner/admin), earnings, billing, notifications.
- Ensure `MobileBottomNav` works on every authed route; verify content has `pb-20` to clear it.
- Fix any horizontal scroll, fixed widths, oversized hero images on mobile.

## Batch 2 — Marketplace flow completeness check
For each flow, verify happy path + error path + empty state on mobile:
- Runner signup → profile → verification → background check
- Investor signup → post task → fund task → review submission → release payment
- Runner: browse tasks → apply → accept assignment → upload deliverables (photo/video) → submit
- Messaging: start convo, send message, attachment upload, unread badge
- Notifications: realtime delivery, mark-as-read, deep links
- Admin: moderation, approvals, dispute resolution
- Static/legal: privacy, terms, support — confirm present, current date, contact info

I'll fix gaps inline, not rebuild what works.

## Batch 3 — Capacitor wrap
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`, `@capacitor/preferences`, `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/push-notifications`.
- Create `capacitor.config.ts` with `appId: com.reirunner.app`, `appName: REI Runner`, `webDir: dist`, `server.url` pointing to production for live updates (toggleable for offline bundle).
- Add `npm` scripts: `cap:sync`, `cap:open:ios`, `cap:open:android`.
- Add a `Capacitor.isNativePlatform()` guard layer in `src/lib/native.ts` that:
  - swaps web file inputs for `Camera.getPhoto()` on native
  - routes external links through `Browser.open()`
  - handles deep links (`reirunner://`) → router navigate
  - configures status bar style for dark theme
  - shows splash, hides on app-ready
- Document the build/submit flow in `docs/MOBILE_BUILD.md` (Xcode + Android Studio steps, signing, screenshots, App Store/Play Store metadata you still need to provide).

## Batch 4 — App-store readiness
- Add app icons + splash assets pipeline (`@capacitor/assets`) — needs a 1024×1024 source icon from you, or I'll generate a placeholder.
- Privacy: confirm `/privacy` and `/terms` cover data collection, location, camera, photos, push, in-app purchases. Add an "Account deletion" screen (Apple requires it) wired to `account_status`.
- Add NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSLocationWhenInUseUsageDescription strings to `ios/App/App/Info.plist` (Capacitor-generated, I'll patch).
- Android permissions in `AndroidManifest.xml`.

## Batch 5 — Test data wipe (destructive, will pause for re-confirm)
I'll query the DB first to show exactly what would be deleted, then issue a migration. Targets:
- `tasks`, `task_submissions`, `task_files`, `applications`, `payments`, `invoices`, `payout_requests`
- `conversations`, `conversation_participants`, `messages`, `message_attachments`
- `reviews`, `reports`, `disputes`, `notifications`, `activity_events`, `favorite_runners`, `runner_availability_blocks`
- Keep: `profiles`, `user_roles`, academy content, app_settings
- Optionally clear test `field_runner_applications` / `real_estate_pro_applications` — your call.

## What I need from you to fully ship
1. **Bundle IDs**: confirm `com.reirunner.app` for both iOS and Android.
2. **App icon**: upload a 1024×1024 PNG, or I generate one from the brand.
3. **Apple Developer + Google Play accounts**: required to actually submit; I can't create those.
4. **Push provider**: OneSignal vs Firebase Cloud Messaging vs Apple-only APNs — pick one for Batch 3.
5. **Test-data wipe re-confirm**: I'll show row counts before running.

## Out of scope (call out)
- React Native/Expo rebuild (you chose Capacitor — good call, ~10× faster).
- Actual binary upload to App Store Connect / Google Play Console — requires your developer accounts and a Mac with Xcode for iOS.
- App Store screenshots, marketing copy, ASO keywords — I can draft, you submit.

## Execution order on next message
Reply "go" and I start Batch 1. I'll commit per batch and surface anything that needs your input before continuing. If you want a different order (e.g., Capacitor first), say so.