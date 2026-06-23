const APP_CACHE_NAMES = new Set(["rr-pages", "rr-assets", "rr-images", "rr-fonts"]);

function isAppCacheForThisRegistration(name) {
  const isKnownReiRunnerCache = APP_CACHE_NAMES.has(name);
  const isWorkboxCache = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return isKnownReiRunnerCache || (isWorkboxCache && name.endsWith(self.registration.scope));
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const appCacheNames = cacheNames.filter(isAppCacheForThisRegistration);
        await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  );
});