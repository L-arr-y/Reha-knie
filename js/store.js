// App-Zustand: Inhalte (JSON) + deine lokalen Daten. Änderungen werden sofort in IndexedDB gespeichert.
import { db, keyVon } from './db.js';
import { rehaStatus } from './regeln.js';
import { isoDatum } from './util.js';

export const S = {
  daten: null,          // { stufen, uebungen, plan, regeln, warnzeichen }
  ueb: {},              // Übungen nach id
  kv: {},
  morgenchecks: [],
  einheiten: [],
  stufenwechsel: [],
  rtpchecks: [],
  visap: [],
  online: navigator.onLine,
  persistiert: null,
  standalone: !!(window.navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches),
};

export const KV_STANDARD = {
  startStufe: 1,
  startDatum: null,         // wird beim ersten Start gesetzt
  planStart: null,          // null = Start aus plan.json
  koerpergewicht: null,
  bein: 'rechts',           // betroffenes Bein
  bestaetigt: {},           // bestätigte Stufenkriterien
  eigeneWerte: {},          // { uebungId: { feld: wert } } für OFFEN-Felder
  regelWerte: {},           // eigene Grenzwerte, z. B. { 'ampel.gruenMax': 2 }
  isoVariante: null,        // gewählte Isometrie-Übung
  ersterStartGesehen: false,
  homeHinweisAus: false,
  letzterExportISO: null,
  backupSpaeter: null,
  visapSpaeter: null,
};

/** Grenzwerte, die in den Einstellungen geändert werden können (Pfad in regeln.json). */
export const REGEL_FELDER = [
  { pfad: 'ampel.gruenMax', label: 'Grün bis (Morgentest)', einheit: '/10' },
  { pfad: 'ampel.gelbMax', label: 'Gelb bis (Morgentest)', einheit: '/10' },
  { pfad: 'stufenwechsel.minTageProStufe', label: 'Mindesttage pro Stufe', einheit: 'Tage' },
  { pfad: 'stufenwechsel.minGruenTage', label: 'Grüne Tage für Aufstieg', einheit: 'Tage' },
  { pfad: 'gelb.reduktionProzent', label: 'Gelb: Sätze kürzen um', einheit: '%' },
  { pfad: 'rot.sperreTage', label: 'Rot: Tage nur Iso + Oberkörper', einheit: 'Tage' },
  { pfad: 'rtp.lsiZiel', label: 'Seitenvergleich-Ziel (LSI)', einheit: '%' },
];

const holen = (o, pfad) => pfad.split('.').reduce((x, k) => x?.[k], o);

async function json(pfad) {
  const res = await fetch(pfad, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${pfad}: ${res.status}`);
  return res.json();
}

export async function laden() {
  const [stufen, uebungen, plan, regeln, warnzeichen] = await Promise.all(
    ['stufen', 'uebungen', 'plan', 'regeln', 'warnzeichen'].map((f) => json(`data/${f}.json`)),
  );
  S.daten = { stufen: stufen.stufen, uebungen: uebungen.uebungen, plan, regeln, warnzeichen };
  S.ueb = Object.fromEntries(uebungen.uebungen.map((u) => [u.id, u]));
  S.kv = { ...KV_STANDARD, ...(await db.kvAll()) };
  if (!S.kv.startDatum) await setKV('startDatum', isoDatum());
  for (const st of ['morgenchecks', 'einheiten', 'stufenwechsel', 'rtpchecks', 'visap']) S[st] = await db.getAll(st);
}

export async function setKV(key, value) {
  S.kv[key] = value;
  await db.kvSet(key, value);
}

export async function speichern(store, obj) {
  const k = keyVon(store);
  const i = S[store].findIndex((x) => x[k] === obj[k]);
  if (i >= 0) S[store][i] = obj; else S[store].push(obj);
  await db.put(store, obj);
}

export async function loeschen(store, keyVal) {
  const k = keyVon(store);
  S[store] = S[store].filter((x) => x[k] !== keyVal);
  await db.del(store, keyVal);
}

/** regeln.json mit deinen eigenen Grenzwerten aus den Einstellungen. */
export function R() {
  const r = structuredClone(S.daten.regeln);
  for (const [pfad, wert] of Object.entries(S.kv.regelWerte || {})) {
    if (wert === null || wert === '' || !Number.isFinite(Number(wert))) continue;
    const teile = pfad.split('.');
    const ziel = teile.slice(0, -1).reduce((x, k) => x[k], r);
    ziel[teile.at(-1)] = Number(wert);
  }
  return r;
}
export const regelStandard = (pfad) => holen(S.daten.regeln, pfad);

export function plan() {
  return S.kv.planStart ? { ...S.daten.plan, start: S.kv.planStart } : S.daten.plan;
}

export function status(heute = isoDatum()) {
  return rehaStatus({
    checks: S.morgenchecks.map((c) => ({ datum: c.datum, wert: c.sls, zeit: c.erfasstISO })),
    wechsel: S.stufenwechsel,
    startStufe: S.kv.startStufe,
    startDatum: S.kv.startDatum,
    heute,
  }, R());
}

export function stufeObj(nr) {
  return S.daten.stufen.find((s) => s.nr === nr) || S.daten.stufen[0];
}

/** Dosierung aus der JSON plus deine eigenen Werte für OFFEN-Felder. */
export function dosierung(uebungId) {
  const u = S.ueb[uebungId];
  return { ...(u?.dosierung || {}), ...(S.kv.eigeneWerte?.[uebungId] || {}) };
}

export function aktiveEinheit() {
  return S.einheiten.find((e) => !e.abgeschlossen) || null;
}
