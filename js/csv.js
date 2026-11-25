// CSV für deutsches Excel/Numbers: UTF-8 mit BOM, Semikolon, Dezimalkomma, Datum TT.MM.JJJJ (+ ISO-Spalte).
// Je Tabelle eine Datei. Reine Funktionen (ohne Bildschirm) – dadurch testbar.
import { deDatum, parseZahl } from './util.js';

export const SEP = ';';
export const BOM = '﻿';
const NL = '\r\n';

export const KOPF = {
  morgenchecks: ['Datum', 'Datum (ISO)', 'Morgentest (0–10)', 'Morgensteifigkeit (0–10)', 'Ampel', 'Stufe', 'Notiz', 'Erfasst (ISO)'],
  einheiten: ['Einheit-ID', 'Datum', 'Datum (ISO)', 'Uhrzeit', 'Stufe', 'Ampel', 'Teile', 'Oberkörper-Block', 'Planwoche',
    'Übung-ID', 'Übung', 'Teil', 'Gewicht (kg)', 'Ziel-Sätze', 'Ziel-Wdh.', 'Ziel-Dauer (s)', 'Variante', 'Schmerz während', 'RIR',
    'Übung erledigt', 'Schmerz danach', 'Notiz', 'Start (ISO)', 'Ende (ISO)', 'Basketball-Dauer (min)', 'Basketball-Anstrengung (0–10)'],
  saetze: ['Einheit-ID', 'Datum', 'Datum (ISO)', 'Übung-ID', 'Übung', 'Satz', 'Wiederholungen', 'Dauer (s)', 'Gewicht (kg)', 'Erledigt'],
  stufen: ['Wechsel-ID', 'Datum', 'Datum (ISO)', 'Von Stufe', 'Nach Stufe', 'Grund', 'Zeit (ISO)'],
  rtp: ['RTP-ID', 'Datum', 'Datum (ISO)', 'Sprungweite links (cm)', 'Sprungweite rechts (cm)', 'Sprung-Schmerz (0–10)',
    '6-m-Hop links (s)', '6-m-Hop rechts (s)', 'Hop ohne Schmerzanstieg', 'Teamtraining 2× ohne Gelb', 'Selbsteinschätzung (%)',
    'LSI Sprung (%)', 'LSI Hop (%)', 'Alle Kriterien erfüllt'],
  visap: ['VISA-P-ID', 'Datum', 'Datum (ISO)', 'Score', 'Notiz'],
  einstellungen: ['Schlüssel', 'Wert (JSON)'],
};

const AMPEL = { gruen: 'grün', gelb: 'gelb', rot: 'rot' };
const AMPEL_ZURUECK = { 'grün': 'gruen', gelb: 'gelb', rot: 'rot' };

/** Ein Feld formatieren: Zahl mit Komma, ja/nein, Anführungszeichen wenn nötig. */
export function feld(v) {
  if (v === null || v === undefined) return '';
  let s;
  if (typeof v === 'number') s = Number.isFinite(v) ? String(v).replace('.', ',') : '';
  else if (typeof v === 'boolean') s = v ? 'ja' : 'nein';
  else s = String(v);
  if (/[;"\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function tabelle(kopf, zeilen) {
  return BOM + [kopf, ...zeilen].map((z) => z.map(feld).join(SEP)).join(NL) + NL;
}

/** CSV-Text in Zeilen/Felder zerlegen (Anführungszeichen, Zeilenumbrüche im Feld, BOM, ; oder ,). */
export function parse(text) {
  let t = String(text);
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  const sep = (t.split(/\r?\n/)[0] || '').includes(';') ? ';' : ',';
  const rows = [];
  let row = []; let f = ''; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

const uhrzeit = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};
const sortDatum = (l) => [...(l || [])].sort((a, b) => ((a.datum + (a.startISO || '')) < (b.datum + (b.startISO || '')) ? -1 : 1));

// ======================================================================== Export
/** infoAm: Funktion datum → { ampel, stufe } aus dem Reha-Status (berechnet, nicht gespeichert). */
export function exportMorgenchecks(checks, infoAm = () => ({})) {
  return tabelle(KOPF.morgenchecks, sortDatum(checks).map((c) => {
    const i = infoAm(c.datum) || {};
    return [deDatum(c.datum), c.datum, c.sls, c.steifigkeit ?? null, AMPEL[i.ampel || c.ampel] || '', i.stufe ?? null, c.notiz || '', c.erfasstISO || ''];
  }));
}

export function exportEinheiten(einheiten) {
  const z = [];
  for (const e of sortDatum(einheiten).filter((x) => x.abgeschlossen)) {
    for (const u of e.uebungen) {
      z.push([e.id, deDatum(e.datum), e.datum, uhrzeit(e.startISO), e.stufe, AMPEL[e.ampel] || '', (e.teile || []).join('+'), e.okBlock || '', e.planWoche ?? null,
        u.uebungId, u.name, u.teil, u.kg ?? null, u.zielSaetze ?? null, u.zielWdh ?? null, u.zielDauer ?? null, u.variante || '', u.schmerzWaehrend ?? null, u.rir ?? null,
        !!u.erledigt, e.schmerzDanach ?? null, e.notiz || '', e.startISO || '', e.endeISO || '', e.bbMinuten ?? null, e.bbAnstrengung ?? null]);
    }
  }
  return tabelle(KOPF.einheiten, z);
}

export function exportSaetze(einheiten) {
  const z = [];
  for (const e of sortDatum(einheiten).filter((x) => x.abgeschlossen)) {
    for (const u of e.uebungen) {
      (u.saetze || []).forEach((s, k) => z.push([e.id, deDatum(e.datum), e.datum, u.uebungId, u.name, k + 1, s.wdh ?? null, s.dauer ?? null, s.kg ?? null, !!s.erledigt]));
    }
  }
  return tabelle(KOPF.saetze, z);
}

/** stufenVerlauf aus dem Reha-Status (inkl. automatischer Rot-Rückstufungen) + gespeicherte Wechsel (mit ID). */
export function exportStufen(stufenVerlauf, wechsel) {
  const byKey = new Map((wechsel || []).map((w) => [`${w.datum}|${w.nach}|${w.grund}`, w]));
  return tabelle(KOPF.stufen, (stufenVerlauf || []).map((s) => {
    const w = byKey.get(`${s.datum}|${s.nach}|${s.grund}`);
    return [w?.id || '', deDatum(s.datum), s.datum, s.von ?? null, s.nach, s.grund, w?.zeitISO || ''];
  }));
}

/** auswerten: Funktion check → { lsiSprung, lsiHop, alleErfuellt } */
export function exportRtp(checks, auswerten = () => ({})) {
  return tabelle(KOPF.rtp, sortDatum(checks).map((c) => {
    const a = auswerten(c) || {};
    return [c.id, deDatum(c.datum), c.datum, c.sprungweiteL ?? null, c.sprungweiteR ?? null, c.sprungSchmerz ?? null, c.hop6mL ?? null, c.hop6mR ?? null,
      c.hopOhneAnstieg ?? null, c.teamtraining ?? null, c.selbsteinschaetzung ?? null, a.lsiSprung ?? null, a.lsiHop ?? null, a.alleErfuellt ?? null];
  }));
}

export function exportVisap(visap) {
  return tabelle(KOPF.visap, sortDatum(visap).map((v) => [v.id, deDatum(v.datum), v.datum, v.score, v.notiz || '']));
}

export function exportEinstellungen(kv, schluessel) {
  return tabelle(KOPF.einstellungen, schluessel.filter((k) => k in kv).map((k) => [k, JSON.stringify(kv[k])]));
}

export function dateiname(typ, heuteIso) { return `reha_${typ}_${heuteIso}.csv`; }

// ======================================================================== Import
export function erkenneTyp(rows) {
  const k = (rows[0] || []).map((x) => x.trim());
  for (const [typ, kopf] of Object.entries(KOPF)) if (kopf.every((h) => k.includes(h))) return typ;
  return null;
}

function objekte(rows) {
  const kopf = rows[0].map((x) => x.trim());
  return rows.slice(1).map((r) => Object.fromEntries(kopf.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const zahl = (s) => parseZahl(s);
const janein = (s) => (s === 'ja' ? true : s === 'nein' ? false : null);
function isoAus(o) {
  if (o['Datum (ISO)']) return o['Datum (ISO)'];
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(o.Datum || '');
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

/** Eingelesene Dateien { typ: rows } → Datensätze je Tabelle. */
export function importieren(dateien) {
  const out = { morgenchecks: [], einheiten: [], stufenwechsel: [], rtpchecks: [], visap: [], einstellungen: {} };

  for (const o of dateien.morgenchecks ? objekte(dateien.morgenchecks) : []) {
    const datum = isoAus(o); const sls = zahl(o['Morgentest (0–10)']);
    if (!datum || sls === null) continue;
    out.morgenchecks.push({ datum, sls, steifigkeit: zahl(o['Morgensteifigkeit (0–10)']), ampel: AMPEL_ZURUECK[o.Ampel] || null, notiz: o.Notiz || '', erfasstISO: o['Erfasst (ISO)'] || `${datum}T07:00:00` });
  }

  const einheiten = new Map();
  for (const o of dateien.einheiten ? objekte(dateien.einheiten) : []) {
    const id = o['Einheit-ID']; const datum = isoAus(o);
    if (!id || !datum) continue;
    if (!einheiten.has(id)) {
      einheiten.set(id, {
        id, datum, startISO: o['Start (ISO)'] || `${datum}T${o.Uhrzeit || '12:00'}:00`, endeISO: o['Ende (ISO)'] || null,
        stufe: zahl(o.Stufe) ?? 1, ampel: AMPEL_ZURUECK[o.Ampel] || null, teile: o.Teile ? o.Teile.split('+') : [], okBlock: o['Oberkörper-Block'] || null,
        planWoche: zahl(o.Planwoche), abgeschlossen: true, schmerzDanach: zahl(o['Schmerz danach']), notiz: o.Notiz || '', timer: null, uebungen: [],
        bbMinuten: zahl(o['Basketball-Dauer (min)']), bbAnstrengung: zahl(o['Basketball-Anstrengung (0–10)']),
      });
    }
    einheiten.get(id).uebungen.push({
      uebungId: o['Übung-ID'], name: o['Übung'], teil: o.Teil, kg: zahl(o['Gewicht (kg)']), zielSaetze: zahl(o['Ziel-Sätze']), zielWdh: zahl(o['Ziel-Wdh.']),
      zielDauer: zahl(o['Ziel-Dauer (s)']), variante: o.Variante || null, schmerzWaehrend: zahl(o['Schmerz während']), rir: zahl(o.RIR),
      erledigt: janein(o['Übung erledigt']) === true, saetze: [],
    });
  }
  for (const o of dateien.saetze ? objekte(dateien.saetze) : []) {
    const e = einheiten.get(o['Einheit-ID']);
    const u = e?.uebungen.find((x) => x.uebungId === o['Übung-ID']);
    if (!u) continue;
    u.saetze[(zahl(o.Satz) || u.saetze.length + 1) - 1] = { wdh: zahl(o.Wiederholungen), dauer: zahl(o['Dauer (s)']), kg: zahl(o['Gewicht (kg)']), erledigt: janein(o.Erledigt) === true };
  }
  for (const e of einheiten.values()) for (const u of e.uebungen) u.saetze = Array.from(u.saetze, (s) => s || { erledigt: false });
  out.einheiten = [...einheiten.values()];

  // Nur bewusste Wechsel übernehmen; Rückstufungen wegen Rot rechnet die App aus den Morgentests neu aus.
  for (const o of dateien.stufen ? objekte(dateien.stufen) : []) {
    if (!['aufstieg', 'manuell'].includes(o.Grund)) continue;
    const datum = isoAus(o);
    out.stufenwechsel.push({ id: o['Wechsel-ID'] || `w-${datum}-${o['Nach Stufe']}`, datum, nach: zahl(o['Nach Stufe']), grund: o.Grund, zeitISO: o['Zeit (ISO)'] || `${datum}T12:00:00` });
  }
  for (const o of dateien.rtp ? objekte(dateien.rtp) : []) {
    const datum = isoAus(o);
    if (!datum) continue;
    out.rtpchecks.push({
      id: o['RTP-ID'] || `rtp-${datum}`, datum, sprungweiteL: zahl(o['Sprungweite links (cm)']), sprungweiteR: zahl(o['Sprungweite rechts (cm)']),
      sprungSchmerz: zahl(o['Sprung-Schmerz (0–10)']), hop6mL: zahl(o['6-m-Hop links (s)']), hop6mR: zahl(o['6-m-Hop rechts (s)']),
      hopOhneAnstieg: janein(o['Hop ohne Schmerzanstieg']), teamtraining: janein(o['Teamtraining 2× ohne Gelb']), selbsteinschaetzung: zahl(o['Selbsteinschätzung (%)']),
    });
  }
  for (const o of dateien.visap ? objekte(dateien.visap) : []) {
    const datum = isoAus(o); const score = zahl(o.Score);
    if (!datum || score === null) continue;
    out.visap.push({ id: o['VISA-P-ID'] || `visap-${datum}`, datum, score, notiz: o.Notiz || '' });
  }
  for (const o of dateien.einstellungen ? objekte(dateien.einstellungen) : []) {
    try { out.einstellungen[o['Schlüssel']] = JSON.parse(o['Wert (JSON)']); } catch (_) { /* Zeile überspringen */ }
  }
  return out;
}

/** Nur Datensätze, die es noch nicht gibt (gleiche ID bzw. gleiches Datum beim Morgentest). */
export function nurNeue(vorhanden, neu) {
  const ids = (l, k) => new Set((l || []).map((x) => x[k]));
  const filt = (store, k) => neu[store].filter((x) => !ids(vorhanden[store], k).has(x[k]));
  return {
    morgenchecks: filt('morgenchecks', 'datum'),
    einheiten: filt('einheiten', 'id'),
    stufenwechsel: filt('stufenwechsel', 'id'),
    rtpchecks: filt('rtpchecks', 'id'),
    visap: filt('visap', 'id'),
    einstellungen: neu.einstellungen,
  };
}
