/* ------------------------------------------------------------------
   Service worker

   Two jobs:
   1. keep the app openable with no signal (cache the shell)
   2. pick up new versions without anyone reinstalling anything

   Strategy is network-first for the shell: on a normal launch the phone
   fetches the current files, so a fix published today is live tomorrow.
   Cache is the fallback, not the default, which avoids the classic PWA
   trap of users being stuck on an old build for weeks.

   Supabase calls are never cached here. The app handles its own data
   caching in localStorage, where it can also track how old the data is.
------------------------------------------------------------------ */

const CACHE = "lb-shell-v1";

const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  // let API traffic through untouched
  const url = new URL(req.url);
  if (url.pathname.includes("/rest/v1/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
