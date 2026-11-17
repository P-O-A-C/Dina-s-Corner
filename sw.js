/* POAC repository service worker.
 * Precache only files that currently exist in this repository snapshot.
 * Missing historical GM routes were removed because one missing URL makes addAll fail.
 */
const CACHE = "poac-users-shell-v1";
const SHELL = [
  "./", "./index.html", "./login.html", "./welcome.html", "./menu.html", "./manifest.webmanifest",
  "./Dina'sCorner/index.html", "./Dina'sCorner/login.html", "./Dina'sCorner/home.html",
  "./Dina'sCorner/dashboard.html", "./Dina'sCorner/categories.html", "./Dina'sCorner/locations.html",
  "./Dina'sCorner/menu.html",
  "./GrandDryClean/index.html", "./GrandDryClean/dashboard.html", "./GrandDryClean/gm.html",
  "./GrandDryClean/css/poac.css", "./GrandDryClean/css/gm.css",
  "./GrandDryClean/js/login.js", "./GrandDryClean/js/dashboard.js", "./GrandDryClean/js/gm.js",
  "./assets/style.css", "./assets/gm-login.css", "./assets/app.js", "./assets/config.js",
  "./assets/dina-branch-maps.js", "./assets/tenant-config.js", "./assets/tenant-branding.js",
  "./assets/dina-corner-logo.png", "./assets/dina-corner-logo-transparent.png",
  "./assets/dina-corner-logo-approved.png", "./assets/dina-corner-icon.png",
  "./assets/dina-corner-icon-192.png", "./assets/dina-corner-icon-512.png",
  "./assets/dina-floral-tl.png", "./assets/dina-floral-tr.png", "./assets/dina-floral-bl.png",
  "./assets/dina-floral-br.png", "./assets/dina-theme.css", "./assets/dina-welcome.css",
  "./assets/dina-brand-identity.css", "./assets/dina-welcome.js",
  "./assets/dina-welcome-approved-artwork.jpg", "./assets/dina-best-sellers.js",
  "./assets/menu-display.css", "./assets/menu-display.js", "./assets/public-menu-client.js",
  "./assets/public-menu-premium.css", "./assets/public-menu-review-link.js"
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
      .then(keys => Promise.all(keys
        .filter(key => (key.startsWith("dinas-corner-gm-") || key.startsWith("poac-users-")) && key !== CACHE)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return cache.match(new URL("index.html", self.registration.scope));
      return Response.error();
    }
  })());
});
