// Offline shell. Rates themselves come from the data layer.
const C = "ap-shell-v8";
const FILES = ["./", "index.html", "css/app.css", "js/icons.js", "js/store.js", "js/app.js", "manifest.webmanifest",
  "fonts/archivo-latin-wdth-normal.woff2", "fonts/fraunces-latin-standard-normal.woff2",
  "icons/icon.svg", "icons/icon-192.png", "img/ganesh-murti.webp", "js/tune.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((r) => { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(clients.openWindow("./#alerts")); });
