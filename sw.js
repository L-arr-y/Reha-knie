// Service Worker: macht die App offline nutzbar.
// Strategie "erst Speicher, im Hintergrund aktualisieren": Die App startet immer sofort aus dem Speicher;
// gibt es online eine neuere Datei (z. B. eine geänderte JSON), wird sie beim nächsten Start benutzt.
// Bei Code-Änderungen VERSION erhöhen, dann wird alles neu geladen.
const VERSION = 'reha-v1';
const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/util.js',
  './js/regeln.js',
  './js/timer.js',
  './js/db.js',
  './js/store.js',
  './js/ui.js',
  './js/csv.js',
  './js/daten.js',
  './js/views/heute.js',
  './js/views/uebungen.js',
  './js/views/verlauf.js',
  './js/views/warnzeichen.js',
  './js/views/einstellungen.js',
  './data/phasen.json',
  './data/uebungen.json',
  './data/regeln.json',
  './data/warnzeichen.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // fremde Seiten (YouTube) nie anfassen
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const treffer = await cache.match(req, { ignoreSearch: true });
      const netz = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (treffer) { event.waitUntil(netz); return treffer; }
      const res = await netz;
      if (res) return res;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }),
  );
});
