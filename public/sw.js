/* SONARA service worker — instant launch + offline shell. */
const CACHE = "sonara-v4";
const SHELL = ["/", "/offline.html", "/icons/icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => undefined)),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Offline audio downloads: cache-first. A cached full 200 response can satisfy
  // media playback even if the browser asks with Range while offline.
  if (url.pathname === "/api/stream") {
    e.respondWith(
      caches.open("sonara-downloads-v1").then((cache) =>
        cache.match(req.url).then((hit) => hit || fetch(req)),
      ),
    );
    return;
  }

  // Other APIs / audio stay live.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/download/") ||
    req.destination === "audio" ||
    req.headers.has("range")
  ) return;

  // Images: cache-first (fast art, saves data)
  if (req.destination === "image") {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy).catch(() => undefined));
              return res;
            })
            .catch(() => hit),
      ),
    );
    return;
  }

  // Pages/assets: network-first with cache fallback (never a dead screen)
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy).catch(() => undefined));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("/offline.html")),
      ),
  );
});
