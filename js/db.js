// Speichert deine persönlichen Daten lokal auf dem Gerät (IndexedDB). Nichts wird hochgeladen.
const DB_NAME = 'reha-assistent';
const DB_VERSION = 1;
export const STORES = ['einheiten', 'morgen', 'visap', 'ereignisse', 'kv'];

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('einheiten')) db.createObjectStore('einheiten', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('morgen')) db.createObjectStore('morgen', { keyPath: 'datumISO' });
      if (!db.objectStoreNames.contains('visap')) db.createObjectStore('visap', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('ereignisse')) db.createObjectStore('ereignisse', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    const r = fn(s);
    if (r && 'onsuccess' in r) r.onsuccess = () => { result = r.result; };
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const db = {
  getAll: (store) => tx(store, 'readonly', (s) => s.getAll()),
  get: (store, key) => tx(store, 'readonly', (s) => s.get(key)),
  put: (store, obj) => tx(store, 'readwrite', (s) => s.put(JSON.parse(JSON.stringify(obj)))),
  del: (store, key) => tx(store, 'readwrite', (s) => s.delete(key)),
  clear: (store) => tx(store, 'readwrite', (s) => s.clear()),
  async kvAll() {
    const rows = await this.getAll('kv');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
  kvSet: (key, value) => tx('kv', 'readwrite', (s) => s.put({ key, value: JSON.parse(JSON.stringify(value ?? null)) })),
};
