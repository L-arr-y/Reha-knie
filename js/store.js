// App-Zustand: Inhalte (JSON) + deine lokalen Daten. Änderungen werden sofort in IndexedDB gespeichert.
import { db } from './db.js';
import { wirksameDosierung, planUebungen } from './regeln.js';
import { esc } from './util.js';

export const S = {
  daten: null,          // { phasen, uebungen, regeln, warnzeichen }
  ueb: {},              // Übungen nach id
  kv: {},               // Einstellungen
  einheiten: [],
  morgen: [],
  visap: [],
  ereignisse: [],
  online: navigator.onLine,
  persistiert: null,
  standalone: !!(window.navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches),
};

export const KV_STANDARD = {
  phase: 'stufe1',
  varianten: {},            // { exzentrik: true, hsr: false }
  wochenplan: null,         // wird aus regeln.json gesetzt
  eigeneWerte: {},          // { uebungId: { feld: wert } }
  exzStufe: 0,
  zusatzlastFrei: false,
  zusatzlastKg: null,
  kriterien: {},            // abgehakte Kriterien
  ersterStartGesehen: false,
  homeHinweisAus: false,
  pauseQuittiertISO: null,
  progressionGesehen: null,
  phasenHinweisGesehen: null,
  morgenUebersprungen: null,
  letzterExportISO: null,
};

async function json(pfad) {
  const res = await fetch(pfad, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${pfad}: ${res.status}`);
  return res.json();
}

export async function laden() {
  const [phasen, uebungen, regeln, warnzeichen] = await Promise.all([
    json('data/phasen.json'), json('data/uebungen.json'), json('data/regeln.json'), json('data/warnzeichen.json'),
  ]);
  S.daten = { phasen: phasen.phasen, uebungen: uebungen.uebungen, regeln, warnzeichen };
  S.ueb = Object.fromEntries(uebungen.uebungen.map((u) => [u.id, u]));
  const kv = await db.kvAll();
  S.kv = { ...KV_STANDARD, wochenplan: regeln.wochenstruktur.standard_trainingstage, ...kv };
  [S.einheiten, S.morgen, S.visap, S.ereignisse] = await Promise.all([
    db.getAll('einheiten'), db.getAll('morgen'), db.getAll('visap'), db.getAll('ereignisse'),
  ]);
}

export async function setKV(key, value) {
  S.kv[key] = value;
  await db.kvSet(key, value);
}

function upsert(list, obj, key = 'id') {
  const i = list.findIndex((x) => x[key] === obj[key]);
  if (i >= 0) list[i] = obj; else list.push(obj);
}

export async function speichern(store, obj) {
  const key = store === 'morgen' ? 'datumISO' : 'id';
  upsert(S[store], obj, key);
  await db.put(store, obj);
}

export async function loeschen(store, keyVal) {
  const key = store === 'morgen' ? 'datumISO' : 'id';
  S[store] = S[store].filter((x) => x[key] !== keyVal);
  await db.del(store, keyVal);
}

export function aktuellePhase() {
  return S.daten.phasen.find((p) => p.id === S.kv.phase) || S.daten.phasen[0];
}

export function aktiveEinheit() {
  return S.einheiten.find((e) => !e.abgeschlossen) || null;
}

/** Werte für eine Übung im Plan (inkl. Exzentrik-Progression und eigener Werte). */
export function planWerte(uebungId) {
  const u = S.ueb[uebungId];
  const d = wirksameDosierung(u, S.kv.eigeneWerte?.[uebungId] || {});
  const r = S.daten.regeln;
  const v = (k) => d[k]?.wert ?? null;
  let saetze = v('saetze');
  let wdh = v('wiederholungen');
  let zusatzlastKg = null;
  if (uebungId === r.progression_exzentrik.uebung) {
    const st = r.progression_exzentrik.stufen[Math.min(S.kv.exzStufe || 0, r.progression_exzentrik.stufen.length - 1)];
    saetze = st.saetze;
    if (!d.wiederholungen?.eigen) wdh = st.wiederholungen;
    if (S.kv.zusatzlastFrei) zusatzlastKg = S.kv.zusatzlastKg ?? null;
  }
  return { u, d, saetze, wdh, halteS: v('haltezeit_s'), pauseS: v('pause_s'), zusatzlastKg };
}

const bereich = (f) => (f?.wert_max && f.wert_max !== f.wert ? `${f.wert}–${f.wert_max}` : `${f.wert}`);

/** Kurzer Dosierungstext, z. B. "5 × 45 s halten · Pause 60 s". OFFEN wird ausgeschrieben. */
export function dosisText(uebungId) {
  const { u, d, saetze, wdh, halteS, pauseS, zusatzlastKg } = planWerte(uebungId);
  const teile = [];
  const offen = '<b class="offen-txt">OFFEN</b>';
  const isExz = uebungId === S.daten.regeln.progression_exzentrik.uebung;
  const s = isExz ? `${saetze}` : d.saetze?.wert != null ? bereich({ ...d.saetze, wert: saetze }) : null;
  if (u.typ === 'halten') {
    teile.push(`${s ?? offen} × ${halteS != null ? `${halteS} s halten` : `Haltezeit ${offen}`}`);
  } else if (u.typ === 'wiederholungen') {
    const w = isExz || d.wiederholungen?.eigen ? (wdh != null ? `${wdh}` : null) : d.wiederholungen?.wert != null ? bereich(d.wiederholungen) : null;
    teile.push(`${s ?? `Sätze ${offen}`} × ${w != null ? `${w} Wdh.` : `Wdh. ${offen}`}`);
    if (zusatzlastKg != null) teile.push(`+${String(zusatzlastKg).replace('.', ',')} kg`);
  } else {
    const h = d.haeufigkeit;
    teile.push(h && h.status !== 'OFFEN' ? esc(h.text) : `Dosierung ${offen}`);
  }
  if (u.typ !== 'frei') teile.push(pauseS != null ? `Pause ${pauseS >= 60 && pauseS % 60 === 0 ? `${pauseS / 60} Min.` : `${pauseS} s`}` : `Pause ${offen}`);
  return teile.join(' · ');
}

export function heutigerPlan() {
  return planUebungen(aktuellePhase(), S.kv.varianten);
}
