// Korean Teacher service worker.
//
// Strategy: network-first for code (HTML/JS), cache-first for static ballast.
// Bump CACHE_VERSION when you change any asset to force re-fetch on next load.

const CACHE_VERSION = "v6";
const CACHE_NAME = `korean-teacher-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./homework.html",
  "./homework.css",
  "./homework.js",
  "./homework-data.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Deliberately NOT cache.addAll: that is atomic, so a single 404 (CDN
      // propagation lag on a fresh deploy) rejects the whole install, the new
      // version never activates, and the old cache serves the old app forever.
      // It presents as "I deployed and nothing changed".
      Promise.allSettled(
        ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn("precache failed:", asset, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isCodeRequest(url) {
  return url.pathname.endsWith("/") || /\.(html|js)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never touch cross-origin traffic. API calls are POST so they were never
  // intercepted anyway, but this keeps the handler out of the way entirely.
  if (url.origin !== self.location.origin) return;

  if (isCodeRequest(url)) {
    // Network-first for HTML and JS. A pure cache-first policy returns a cached
    // file forever with no revalidation, which means a bug fix can never reach a
    // device that already installed the app.
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(req).then(
            (cached) =>
              cached ||
              new Response("Offline and not cached.", {
                status: 503,
                statusText: "Offline",
                headers: { "Content-Type": "text/plain; charset=utf-8" },
              })
          )
        )
    );
    return;
  }

  // Cache-first for everything else (CSS, icons, manifest).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(
          () =>
            // Always resolve with a real Response. The old handler resolved with
            // `undefined` here, which surfaces as an opaque network error.
            new Response("Offline and not cached.", {
              status: 503,
              statusText: "Offline",
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
        );
    })
  );
});
