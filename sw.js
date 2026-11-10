/* Network first so updates arrive, cache fallback so it works offline. Bump VERSION on every release. */
const VERSION = "ptdaily-v2-2";
const FILES = ["/portuguese-daily/", "/portuguese-daily/index.html", "/portuguese-daily/style.css?v=3", "/portuguese-daily/content.js?v=3", "/portuguese-daily/app.js?v=3", "/portuguese-daily/manifest.webmanifest", "/portuguese-daily/favicon.svg", "/portuguese-daily/icon-192.png", "/portuguese-daily/icon-512.png", "/portuguese-daily/apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: false }).then((m) => m || caches.match("/portuguese-daily/"))));
});
