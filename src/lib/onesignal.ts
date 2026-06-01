// Centralized OneSignal wrapper. All OneSignal SDK calls go through this
// module — never import `onesignal-cordova-plugin` directly elsewhere.
//
// Works on iOS and Android via the Capacitor native shell (the Cordova
// plugin is bridge-compatible). On web it is a no-op so the same imports
// are safe from any client code.
import { isNative, nativePlatform } from "./native";
import { getOneSignalIdentity } from "./onesignal-identity.functions";

export const ONESIGNAL_APP_ID = "d352999f-6c2f-4715-b911-8d7edf216025";

let initialized = false;
let welcomeShown = false;

type AnyOneSignal = any;

async function loadPlugin(): Promise<AnyOneSignal | null> {
  if (!isNative()) return null;
  const platform = nativePlatform();
  if (platform !== "ios" && platform !== "android") return null;
  try {
    const mod: any = await import("onesignal-cordova-plugin");
    return mod?.default ?? mod?.OneSignal ?? mod;
  } catch (err) {
    console.warn("[OneSignal] plugin unavailable:", err);
    return null;
  }
}

function showWelcomeDialog(OneSignal: AnyOneSignal) {
  if (welcomeShown) return;
  welcomeShown = true;
  const title = "Your OneSignal integration is complete!";
  const message =
    "Click the button below to trigger your first journey via an in-app message.";
  const trigger = () => {
    try {
      OneSignal?.InAppMessages?.addTrigger?.(
        "ai_implementation_campaign_email_journey",
        "true",
      );
    } catch (err) {
      console.warn("[OneSignal] failed to add IAM trigger:", err);
    }
  };

  // Prefer the Capacitor Dialog plugin for a native alert; fall back to
  // window.confirm so the same flow still runs on web previews.
  (async () => {
    try {
      const { Dialog } = await import("@capacitor/dialog");
      const { value } = await Dialog.confirm({
        title,
        message,
        okButtonTitle: "Trigger your first journey",
        cancelButtonTitle: "Later",
      });
      if (value) trigger();
    } catch {
      if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) {
        trigger();
      }
    }
  })();
}

export async function initOneSignal() {
  if (initialized) return;
  const OneSignal = await loadPlugin();
  if (!OneSignal) return;
  initialized = true;

  try {
    OneSignal.Debug?.setLogLevel?.(6);
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Push subscription observer — fire welcome dialog when the device
    // first registers a real push subscription ID.
    OneSignal.User?.pushSubscription?.addEventListener?.(
      "change",
      (event: any) => {
        const previousId = event?.previous?.id ?? null;
        const currentId = event?.current?.id ?? null;
        if (!previousId && currentId) {
          showWelcomeDialog(OneSignal);
        }
      },
    );
  } catch (err) {
    console.warn("[OneSignal] initialization failed:", err);
  }
}

export async function loginOneSignalUser(externalId: string) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.login?.(externalId);
  } catch (err) {
    console.warn("[OneSignal] login failed:", err);
  }
}

export async function logoutOneSignalUser() {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.logout?.();
  } catch (err) {
    console.warn("[OneSignal] logout failed:", err);
  }
}

export async function addOneSignalEmail(email: string) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.User?.addEmail?.(email);
  } catch (err) {
    console.warn("[OneSignal] addEmail failed:", err);
  }
}

export async function removeOneSignalEmail(email: string) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.User?.removeEmail?.(email);
  } catch (err) {
    console.warn("[OneSignal] removeEmail failed:", err);
  }
}

export async function addOneSignalSms(phone: string) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.User?.addSms?.(phone);
  } catch (err) {
    console.warn("[OneSignal] addSms failed:", err);
  }
}

export async function removeOneSignalSms(phone: string) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.User?.removeSms?.(phone);
  } catch (err) {
    console.warn("[OneSignal] removeSms failed:", err);
  }
}

export async function addOneSignalTags(tags: Record<string, string>) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.User?.addTags?.(tags);
  } catch (err) {
    console.warn("[OneSignal] addTags failed:", err);
  }
}

export async function removeOneSignalTags(keys: string[]) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.User?.removeTags?.(keys);
  } catch (err) {
    console.warn("[OneSignal] removeTags failed:", err);
  }
}

export async function setOneSignalLogLevel(level: number) {
  const OneSignal = await loadPlugin();
  try {
    OneSignal?.Debug?.setLogLevel?.(level);
  } catch {}
}

/**
 * Pulls the current user's role/profile/status from the server and pushes
 * them to OneSignal as external ID + tags. Safe to call from anywhere —
 * on web (no native shell) it is a no-op. Never throws.
 */
export async function syncOneSignalIdentity() {
  if (!isNative()) return;
  try {
    const identity = await getOneSignalIdentity();
    if (!identity?.externalId) return;
    await loginOneSignalUser(identity.externalId);
    const tagStrings: Record<string, string> = {};
    for (const [k, v] of Object.entries(identity.tags)) {
      tagStrings[k] = typeof v === "string" ? v : String(v);
    }
    await addOneSignalTags(tagStrings);
  } catch (err) {
    console.warn("[OneSignal] identity sync failed:", err);
  }
}