import type { CapacitorConfig } from "@capacitor/cli";

const useLiveReload = process.env.CAP_LIVE_RELOAD === "1";

const config: CapacitorConfig = {
  appId: "com.reirunner.app",
  appName: "REI Runner",
  webDir: "dist",
  // For App Store / Play Store submission, BUILD WITHOUT `server.url` so the
  // bundled web assets ship inside the binary. Set CAP_LIVE_RELOAD=1 only
  // during local dev against the hosted preview.
  server: useLiveReload
    ? {
        url: "https://reirunner.com",
        cleartext: false,
      }
    : undefined,
  ios: {
    contentInset: "always",
    backgroundColor: "#0a0a0a",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: "#0a0a0a",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;