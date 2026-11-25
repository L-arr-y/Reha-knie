// Service Worker: macht die App offline nutzbar.
// Strategie "erst Netz, sonst Speicher": Mit Internet kommt immer die aktuelle Datei (kein Mix aus alten und
// neuen Dateien nach einem Update); ohne Internet startet die App aus dem Speicher.
// Bei Code-Änderungen VERSION erhöhen und neue Dateien in DATEIEN eintragen.
const VERSION = 'reha-v5';
const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/version.js',
  './js/util.js',
  './js/regeln.js',
  './js/timer.js',
  './js/db.js',
  './js/store.js',
  './js/ui.js',
  './js/csv.js',
  './js/daten.js',
  './js/views/heute.js',
  './js/views/uebersicht.js',
  './js/views/uebungen.js',
  './js/views/verlauf.js',
  './js/views/mehr.js',
  './data/stufen.json',
  './data/uebungen.json',
  './data/plan.json',
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
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (_) {
      const treffer = await cache.match(req, { ignoreSearch: true });
      if (treffer) return treffer;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
