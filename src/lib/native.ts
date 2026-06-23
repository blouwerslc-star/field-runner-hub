// Capacitor native-platform helpers. Safe to import from any client code:
// each helper degrades to a no-op or web fallback when not running inside
// the iOS/Android shell.
import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();
export const nativePlatform = () => Capacitor.getPlatform(); // "ios" | "android" | "web"

/** Open an external URL in the in-app browser on native, new tab on web. */
export async function openExternal(url: string) {
  if (isNative()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url, presentationStyle: "popover" });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Take or pick a photo. Falls back to a hidden <input type=file> on web. */
export async function takePhoto(opts?: { source?: "camera" | "photos" }) {
  if (isNative()) {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: opts?.source === "photos" ? CameraSource.Photos : CameraSource.Prompt,
    });
    return photo.dataUrl ?? null;
  }
  return new Promise<string | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (opts?.source === "camera") input.capture = "environment" as never;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

/** Light haptic tap on native; no-op on web. */
export async function tapHaptic() {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Initialize native shell: status bar, splash hide, deep links. Call once on mount. */
export async function initNativeShell(onDeepLink?: (path: string) => void) {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (nativePlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0a0a0a" });
    }
  } catch {}
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {}
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("appUrlOpen", (event) => {
      try {
        const url = new URL(event.url);
        const path = `${url.pathname}${url.search}${url.hash}` || "/";
        onDeepLink?.(path);
      } catch {}
    });
    // Android hardware back button. Without this, the default behavior can
    // reload the WebView start URL or exit unexpectedly, which on a logged-in
    // dashboard looks like a sign-out. Priority:
    //  1. If a Radix overlay (Sheet/Dialog/Popover) is open, close it.
    //  2. Else if browser has history, go back.
    //  3. Else minimize the app (don't exit; don't sign user out).
    App.addListener("backButton", async () => {
      try {
        // Close any open Radix overlay by dispatching Escape — Radix listens
        // for it on document and unmounts the topmost layer.
        const hasOverlay = document.querySelector(
          '[data-state="open"][role="dialog"], [data-mobile-drawer-root][data-state="open"], [data-radix-popper-content-wrapper]',
        );
        if (hasOverlay) {
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
          );
          return;
        }
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        await App.minimizeApp().catch(async () => {
          // iOS has no minimizeApp; fall through silently. Never exit the app
          // automatically — it confuses users into thinking they were signed out.
        });
      } catch {}
    });
  } catch {}
}