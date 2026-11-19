const CACHE = "poac-unified-v18-gdc-services-display-only-v1";
const SHELL = [
  "./index.html",
  "./login.html",
  "./welcome.html",
  "./menu.html",
  "./manifest.webmanifest",
  "./assets/poac-portal.css",
  "./assets/app.js",
  "./assets/config.js",
  "./assets/style.css",
  "./assets/gm-login.css",
  "./assets/dina-branch-maps.js",
  "./assets/tenant-config.js",
  "./assets/tenant-branding.js",
  "./assets/dina-brand-identity.css",
  "./assets/dina-theme.css",
  "./assets/dina-welcome.css",
  "./assets/dina-welcome.js",
  "./assets/menu-display.js",
  "./assets/menu-display.css",
  "./assets/public-menu-client.js",
  "./assets/public-menu-premium.css",
  "./assets/dina-best-sellers.js",
  "./assets/public-menu-review-link.js",
  "./Dina'sCorner/index.html",
  "./Dina'sCorner/login.html",
  "./Dina'sCorner/welcome.html",
  "./Dina'sCorner/dashboard.html",
  "./Dina'sCorner/categories.html",
  "./Dina'sCorner/home.html",
  "./Dina'sCorner/locations.html",
  "./Dina'sCorner/menu.html",
  "./GrandDryClean/index.html",
  "./GrandDryClean/order.html",
  "./GrandDryClean/login.html",
  "./GrandDryClean/gm.html",
  "./GrandDryClean/dashboard.html",
  "./GrandDryClean/css/management-home.css",
  "./GrandDryClean/assets/grand-dry-clean-logo.png",
  "./GrandDryClean/js/session-guard.js",
  "./GrandDryClean/js/management-home.js",
  "./GrandDryClean/css/customer.css",
  "./GrandDryClean/css/order.css",
  "./GrandDryClean/css/login.css",
  "./GrandDryClean/css/poac.css",
  "./GrandDryClean/css/gm.css",
  "./GrandDryClean/js/customer.js",
  "./GrandDryClean/js/order.js",
  "./GrandDryClean/js/dashboard.js",
  "./GrandDryClean/js/gm.js",
  "./POAC-Admin/index.html",
  "./POAC-Admin/login.html",
  "./POAC-Admin/poac-admin.css",
  "./POAC-Admin/poac-admin.js",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key =>
          (key.startsWith("dinas-corner-gm-") || key.startsWith("poac-")) && key !== CACHE
        ).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  // Always fetch the protected dashboard and its auth guard from GitHub Pages.
  // Never let a stale service-worker cache keep the authorization overlay alive.
  const protectedAuthAsset =
    url.pathname.endsWith("/GrandDryClean/dashboard.html") ||
    url.pathname.endsWith("/GrandDryClean/js/session-guard.js");
  if (protectedAuthAsset) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        return cache.match(new URL("index.html", self.registration.scope));
      }
      return Response.error();
    }
  })());
});
