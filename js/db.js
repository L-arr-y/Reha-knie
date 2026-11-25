// Speichert deine persönlichen Daten lokal auf dem Gerät (IndexedDB). Nichts wird hochgeladen.
const DB_NAME = 'reha-assistent';
const DB_VERSION = 2; // Version 2: neues Datenmodell (Morgentest, Stufenwechsel, Sätze mit kg)
export const STORES = ['morgenchecks', 'einheiten', 'stufenwechsel', 'rtpchecks', 'visap', 'kv'];
const KEYS = { morgenchecks: 'datum', kv: 'key' };
export const keyVon = (store) => KEYS[store] || 'id';

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Neues Datenmodell: alte Tabellen aus Version 1 werden verworfen (so abgesprochen).
      for (const name of [...db.objectStoreNames]) if (!STORES.includes(name) || req.oldVersion < 2) db.deleteObjectStore(name);
      for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: keyVon(s) });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    let result;
    if (r && 'onsuccess' in r) r.onsuccess = () => { result = r.result; };
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const db = {
  getAll: (store) => tx(store, 'readonly', (s) => s.getAll()),
  put: (store, obj) => tx(store, 'readwrite', (s) => s.put(JSON.parse(JSON.stringify(obj)))),
  del: (store, key) => tx(store, 'readwrite', (s) => s.delete(key)),
  clear: (store) => tx(store, 'readwrite', (s) => s.clear()),
  async kvAll() {
    const rows = await this.getAll('kv');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
  kvSet: (key, value) => tx('kv', 'readwrite', (s) => s.put({ key, value: JSON.parse(JSON.stringify(value ?? null)) })),
};
