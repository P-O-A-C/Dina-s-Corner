const CACHE = "dinas-corner-gm-v16-best-sellers-autoplay-2s";
const SHELL = [
  "./", "./index.html", "./login.html", "./menu.html", "./welcome.html", "./manifest.webmanifest",
  "./GM/index.html", "./GM/gm-login.html", "./GM/gm-dashboard.html",
  "./GM/gm-menu.html", "./GM/gm-categories.html", "./GM/gm-home-products.html",
  "./GM/gm-locations.html",
  "./assets/style.css", "./assets/gm-login.css", "./assets/app.js", "./assets/config.js",
  "./assets/tenant-config.js", "./assets/tenant-branding.js",
  "./assets/dina-corner-logo.png", "./assets/dina-corner-logo-transparent.png", "./assets/dina-corner-icon.png",
  "./assets/dina-corner-icon-192.png", "./assets/dina-corner-icon-512.png",
  "./assets/dina-floral-tl.png", "./assets/dina-floral-tr.png",
  "./assets/dina-floral-bl.png", "./assets/dina-floral-br.png",
  "./assets/dina-theme.css", "./assets/dina-welcome.css", "./assets/dina-welcome.js",
  "./assets/dina-welcome-approved-artwork.jpg", "./assets/dina-best-sellers.js", "./assets/menu-display.css",
  "./assets/menu-display.js", "./assets/public-menu-client.js",
  "./assets/public-menu-premium.css", "./assets/public-menu-review-link.js"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith("dinas-corner-gm-") && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
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
