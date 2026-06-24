// Cross-platform location tracker.
// Web: navigator.geolocation.watchPosition (foreground only).
// Native (iOS/Android): @capacitor-community/background-geolocation, which
// keeps emitting fixes when the app is backgrounded or the screen is locked.
import { Capacitor } from "@capacitor/core";

export type Fix = {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  ts: number;
};

export type StartOptions = {
  taskTitle: string;
  onFix: (fix: Fix) => void;
  onError: (code: "denied" | "unavailable" | "timeout" | "error", message?: string) => void;
};

export type Tracker = { stop: () => Promise<void> };

const isNative = () => Capacitor.isNativePlatform();

/** Ask the OS for foreground + background location permission (native only). */
export async function requestLocationPermission(): Promise<"granted" | "denied" | "prompt"> {
  if (!isNative()) {
    // The browser only exposes a permission state read.
    if (typeof navigator !== "undefined" && navigator.permissions) {
      try {
        const p = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        return p.state as "granted" | "denied" | "prompt";
      } catch {
        return "prompt";
      }
    }
    return "prompt";
  }
  const { Geolocation } = await import("@capacitor/geolocation");
  const res = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
  const loc = res.location;
  if (loc === "granted") return "granted";
  if (loc === "denied") return "denied";
  return "prompt";
}

/** Read the current OS-level permission state without prompting. */
export async function checkLocationPermission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const res = await Geolocation.checkPermissions();
      const v = res.location;
      if (v === "granted") return "granted";
      if (v === "denied") return "denied";
      return "prompt";
    } catch {
      return "unknown";
    }
  }
  if (typeof navigator !== "undefined" && navigator.permissions) {
    try {
      const p = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return p.state as "granted" | "denied" | "prompt";
    } catch {
      return "unknown";
    }
  }
  return "unknown";
}

/** Get one fix on demand. Useful for the "Test location" button. */
export async function getCurrentLocation(): Promise<Fix> {
  if (isNative()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
    return {
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      accuracy: p.coords.accuracy ?? null,
      speed: p.coords.speed ?? null,
      heading: p.coords.heading ?? null,
      ts: p.timestamp || Date.now(),
    };
  }
  return new Promise<Fix>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          speed: pos.coords.speed ?? null,
          heading: pos.coords.heading ?? null,
          ts: pos.timestamp || Date.now(),
        }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

/** Start a continuous tracker. Web = foreground only; native = background-capable. */
export async function startTracker(opts: StartOptions): Promise<Tracker> {
  if (isNative()) {
    const { BackgroundGeolocation } = await import("@capacitor-community/background-geolocation");
    const watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "REI Runner is verifying you're on-site for this task.",
        backgroundTitle: `Tracking: ${opts.taskTitle}`,
        requestPermissions: true,
        stale: false,
        distanceFilter: 30,
      },
      (location, error) => {
        if (error) {
          const code = (error.code as string) || "";
          if (code === "NOT_AUTHORIZED" || code === "PERMISSION_DENIED") {
            opts.onError("denied", error.message);
          } else if (code === "NOT_AVAILABLE") {
            opts.onError("unavailable", error.message);
          } else {
            opts.onError("error", error.message);
          }
          return;
        }
        if (!location) return;
        opts.onFix({
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy ?? null,
          speed: location.speed ?? null,
          heading: location.bearing ?? null,
          ts: location.time || Date.now(),
        });
      },
    );
    return {
      stop: async () => {
        try {
          await BackgroundGeolocation.removeWatcher({ id: watcherId });
        } catch {
          // ignore
        }
      },
    };
  }

  // Web path
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    opts.onError("unavailable");
    return { stop: async () => {} };
  }
  const watchId = navigator.geolocation.watchPosition(
    (pos) =>
      opts.onFix({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
        ts: pos.timestamp || Date.now(),
      }),
    (err) => {
      const map: Record<number, "denied" | "unavailable" | "timeout"> = {
        1: "denied",
        2: "unavailable",
        3: "timeout",
      };
      opts.onError(map[err.code] ?? "error", err.message);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
  return {
    stop: async () => {
      navigator.geolocation.clearWatch(watchId);
    },
  };
}