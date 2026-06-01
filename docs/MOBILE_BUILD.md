# REI Runner — Mobile Build & Submit Guide

REI Runner is wrapped for iOS and Android with **Capacitor**. The web app
(TanStack Start, deployed to `reirunner.com`) is the source of truth; the
native shells just embed it. This doc covers the full path from local
development to App Store / Google Play submission.

## 1. Prerequisites

| Target  | You need                                                                 |
| ------- | ------------------------------------------------------------------------ |
| iOS     | macOS, Xcode 15+, Apple Developer account ($99/yr), CocoaPods (`brew install cocoapods`) |
| Android | Android Studio (Hedgehog+), JDK 17, Google Play Console account ($25 one-time) |
| Both    | Node 20+, `bun` (already used in this repo)                             |

## 2. One-time setup

From the project root:

```bash
bun install
bun run build                  # produces dist/
bun run cap:add:ios            # creates ios/ folder (run on macOS only)
bun run cap:add:android        # creates android/ folder
bun run cap:sync               # copies web build into both native projects
```

After the first `cap:add:ios`, open `ios/App/App/Info.plist` and add:

```xml
<key>NSCameraUsageDescription</key>
<string>REI Runner uses the camera to capture property photos and videos for task deliverables.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>REI Runner needs photo library access to attach existing property photos to your task submissions.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>REI Runner can save task deliverables back to your photo library.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>REI Runner uses your location to show nearby tasks and verify on-site presence at properties.</string>
<key>NSMicrophoneUsageDescription</key>
<string>REI Runner records audio with property walkthrough videos.</string>
```

After the first `cap:add:android`, open `android/app/src/main/AndroidManifest.xml`
and add inside `<manifest>` (before `<application>`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

## 3. Dev loop

- **Live reload against hosted preview:**
  ```bash
  CAP_LIVE_RELOAD=1 bun run cap:sync
  bun run cap:open:ios       # then ▶ Run in Xcode
  bun run cap:open:android   # then ▶ Run in Android Studio
  ```
  This sets `server.url` in `capacitor.config.ts` to `https://reirunner.com` so
  every change you publish via Lovable shows up instantly inside the simulator.
- **Production-style build (bundled web assets, what you submit to stores):**
  ```bash
  bun run cap:sync           # without CAP_LIVE_RELOAD
  bun run cap:open:ios
  ```
  Archive in Xcode (Product → Archive) and upload via the Organizer.

## 4. App icons & splash

Drop a 1024×1024 PNG at `resources/icon.png` and a 2732×2732 PNG at
`resources/splash.png`, then:

```bash
bunx @capacitor/assets generate --iconBackgroundColor "#0a0a0a" --splashBackgroundColor "#0a0a0a"
```

This populates `ios/App/App/Assets.xcassets/` and `android/app/src/main/res/`.

## 5. Signing

- **iOS:** Xcode → target `App` → Signing & Capabilities → select your Apple
  Developer team. Bundle ID is `com.reirunner.app` (matches
  `capacitor.config.ts`).
- **Android:** Generate an upload keystore once:
  ```bash
  keytool -genkey -v -keystore reirunner-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
  ```
  Add it to `android/app/build.gradle` `signingConfigs` and reference it from
  `buildTypes.release`. Keep the keystore in a password manager — losing it
  means you can never push another update.

## 6. App Store / Play Store metadata you still need

- App name: **REI Runner**
- Short description (≤80 chars): "Hire local runners for real estate field tasks."
- Long description: pull from `/story` + `/investors` + `/runners` pages.
- Primary category: **Business**. Secondary: **Productivity**.
- Privacy policy URL: `https://reirunner.com/privacy`
- Terms of service URL: `https://reirunner.com/terms`
- Support URL: `https://reirunner.com/support`
- Account deletion URL (Apple requires): `https://reirunner.com/settings/account` (deletion request flow lives there)
- Data collection disclosures: see `/privacy` — covers email, name, phone,
  location, photos, payment info.

## 7. Push notifications (optional, defer until launch)

The `@capacitor/push-notifications` plugin is installed but not wired to a
provider yet. Pick one:
- **Apple Push Notification service (APNs)** for iOS — requires APNs auth key
  from Apple Developer Console.
- **Firebase Cloud Messaging (FCM)** for Android — requires `google-services.json`
  in `android/app/`.
- **OneSignal** unifies both behind one SDK — easiest if you want one provider.

Wire the token registration to a new `device_tokens` table and a server
function that sends pushes via the chosen provider's REST API.

## 8. Submit

- **iOS:** Xcode → Product → Archive → Distribute App → App Store Connect →
  Upload. Then in App Store Connect, attach the build to a new version,
  fill in screenshots (6.7", 6.5", 5.5" iPhone + 12.9" iPad), submit for
  review. Apple reviews in ~24–48h.
- **Android:** Android Studio → Build → Generate Signed App Bundle (.aab).
  Upload to Play Console → Production → Create new release. Fill in store
  listing, content rating questionnaire, data safety form. Google reviews
  in ~1–7 days for new apps.

## 9. Updating without re-submitting

Because the app loads `reirunner.com` content (when `server.url` is set) or
the bundled `dist/` (default), most updates ship via the web. You only
resubmit binaries when:
- you bump Capacitor / native plugin versions,
- you change `Info.plist` / `AndroidManifest.xml` permissions,
- Apple/Google require it.