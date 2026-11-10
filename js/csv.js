// CSV für deutsches Excel/Numbers: UTF-8 mit BOM, Semikolon, Dezimalkomma, Datum TT.MM.JJJJ (+ ISO-Spalte).
// Reine Funktionen (ohne Bildschirm) – dadurch testbar.
import { deDatum, addTage, parseZahl } from './util.js';
import { abgeschlossene, maxSchmerzWaehrend } from './regeln.js';

export const SEP = ';';
export const BOM = '﻿';
const NL = '\r\n';

export const KOPF = {
  einheiten: ['Einheit-ID', 'Datum', 'Datum (ISO)', 'Uhrzeit', 'Stufe', 'Übung-ID', 'Übung', 'Sätze geplant', 'Sätze erledigt',
    'Wiederholungen', 'Haltezeit (s)', 'Pause (s)', 'Zusatzlast (kg)', 'Schmerz während', 'Status'],
  schmerz: ['Einheit-ID', 'Datum', 'Datum (ISO)', 'Uhrzeit', 'Stufe', 'Schmerz vorher', 'Schmerz nachher', 'Stärkster Schmerz während',
    'Beschwerdefrei', 'Muskelkater', 'Notiz', 'Schmerz nächster Morgen', 'Alltagsschmerz nimmt zu (Morgen)', 'Notiz Morgen',
    'Start (ISO)', 'Ende (ISO)'],
  visap: ['VISA-P-ID', 'Datum', 'Datum (ISO)', 'Score', 'Notiz'],
};

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
  const ersteZeile = t.split(/\r?\n/)[0] || '';
  const sep = ersteZeile.includes(';') ? ';' : ',';
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') { f += '"'; i++; } else q = false;
      } else f += c;
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
const stufeNr = (phase) => (phase ? Number(String(phase).replace('stufe', '')) || phase : '');
const status = (u) => (u.abgebrochen ? 'abgebrochen' : u.ausgelassen && u.ausgelassen !== 'manuell_ein' ? 'ausgelassen' : u.erledigt ? 'erledigt' : u.saetzeErledigt > 0 ? 'teilweise' : 'offen');

// ---------------------------------------------------------------- Export
export function exportEinheiten(einheiten) {
  const zeilen = [];
  for (const e of abgeschlossene(einheiten)) {
    for (const u of e.uebungen || []) {
      zeilen.push([e.id, deDatum(e.datumISO), e.datumISO, uhrzeit(e.startISO), stufeNr(e.phase), u.uebungId, u.name || u.uebungId,
        u.saetzeGeplant, u.saetzeErledigt, u.wdh, u.halteS, u.pauseS, u.zusatzlastKg, u.schmerzWaehrend, status(u)]);
    }
  }
  return tabelle(KOPF.einheiten, zeilen);
}

export function exportSchmerz(einheiten, morgen) {
  const zeilen = abgeschlossene(einheiten).map((e) => {
    const m = (morgen || []).find((x) => (x.bezugDatumISO || addTage(x.datumISO, -1)) === e.datumISO);
    return [e.id, deDatum(e.datumISO), e.datumISO, uhrzeit(e.startISO), stufeNr(e.phase), e.schmerzVor, e.schmerzNach,
      maxSchmerzWaehrend(e), e.beschwerdefrei, e.muskelkater, e.notiz || '', m ? m.schmerz : null,
      m ? m.alltagsschmerzZunahme : null, m ? m.notiz || '' : '', e.startISO, e.endeISO || ''];
  });
  return tabelle(KOPF.schmerz, zeilen);
}

export function exportVisap(visap) {
  const zeilen = [...(visap || [])].sort((a, b) => (a.datumISO < b.datumISO ? -1 : 1))
    .map((v) => [v.id, deDatum(v.datumISO), v.datumISO, v.score, v.notiz || '']);
  return tabelle(KOPF.visap, zeilen);
}

export function dateiname(typ, heuteIso) { return `reha_${typ}_${heuteIso}.csv`; }

// ---------------------------------------------------------------- Import
export function erkenneTyp(rows) {
  const k = (rows[0] || []).map((x) => x.trim());
  for (const [typ, kopf] of Object.entries(KOPF)) if (kopf.every((h) => k.includes(h))) return typ;
  return null;
}

function alsObjekte(rows) {
  const kopf = rows[0].map((x) => x.trim());
  return rows.slice(1).map((r) => Object.fromEntries(kopf.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const zahl = (s) => parseZahl(s);
const janein = (s) => (s === 'ja' ? true : s === 'nein' ? false : null);
const isoAus = (o) => o['Datum (ISO)'] || deZuIso(o.Datum);
function deZuIso(de) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(de || '');
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

/**
 * Wandelt eingelesene CSV-Dateien in Datensätze um.
 * dateien: { einheiten?: rows, schmerz?: rows, visap?: rows }
 */
export function importieren(dateien) {
  const einheiten = new Map();
  const morgen = new Map();
  const visap = [];

  if (dateien.schmerz) {
    for (const o of alsObjekte(dateien.schmerz)) {
      const id = o['Einheit-ID'];
      const datumISO = isoAus(o);
      if (!id || !datumISO) continue;
      const startISO = o['Start (ISO)'] || `${datumISO}T${o.Uhrzeit || '12:00'}:00`;
      einheiten.set(id, {
        id, datumISO, startISO, endeISO: o['Ende (ISO)'] || startISO, phase: o.Stufe ? `stufe${o.Stufe}` : 'stufe1',
        abgeschlossen: true, schmerzVor: zahl(o['Schmerz vorher']), schmerzNach: zahl(o['Schmerz nachher']),
        beschwerdefrei: janein(o.Beschwerdefrei), muskelkater: janein(o.Muskelkater), notiz: o.Notiz || '', timer: null, uebungen: [],
        _maxWaehrend: zahl(o['Stärkster Schmerz während']),
      });
      const ms = zahl(o['Schmerz nächster Morgen']);
      const ma = janein(o['Alltagsschmerz nimmt zu (Morgen)']);
      if (ms !== null || ma !== null) {
        const mIso = addTage(datumISO, 1);
        if (!morgen.has(mIso)) {
          morgen.set(mIso, { datumISO: mIso, bezugDatumISO: datumISO, schmerz: ms, alltagsschmerzZunahme: ma === true, notiz: o['Notiz Morgen'] || '', erfasstISO: `${mIso}T07:00:00` });
        }
      }
    }
  }
  if (dateien.einheiten) {
    for (const o of alsObjekte(dateien.einheiten)) {
      const id = o['Einheit-ID'];
      if (!id) continue;
      if (!einheiten.has(id)) {
        const datumISO = isoAus(o);
        einheiten.set(id, { id, datumISO, startISO: `${datumISO}T${o.Uhrzeit || '12:00'}:00`, phase: o.Stufe ? `stufe${o.Stufe}` : 'stufe1', abgeschlossen: true, schmerzVor: null, schmerzNach: null, beschwerdefrei: null, muskelkater: null, notiz: '', timer: null, uebungen: [] });
      }
      const st = o.Status;
      einheiten.get(id).uebungen.push({
        uebungId: o['Übung-ID'], name: o['Übung'], dosis: '', saetzeGeplant: zahl(o['Sätze geplant']), saetzeErledigt: zahl(o['Sätze erledigt']) || 0,
        wdh: zahl(o.Wiederholungen), halteS: zahl(o['Haltezeit (s)']), pauseS: zahl(o['Pause (s)']), zusatzlastKg: zahl(o['Zusatzlast (kg)']),
        schmerzWaehrend: zahl(o['Schmerz während']), erledigt: st === 'erledigt', abgebrochen: st === 'abgebrochen', ausgelassen: st === 'ausgelassen' ? 'import' : null,
      });
    }
  }
  // Fehlt die Übungsdatei, bleibt der stärkste Schmerz trotzdem erhalten.
  for (const e of einheiten.values()) {
    if (!e.uebungen.length && e._maxWaehrend !== null && e._maxWaehrend !== undefined) {
      e.uebungen.push({ uebungId: 'unbekannt', name: '(aus Schmerz-Datei)', dosis: '', saetzeGeplant: null, saetzeErledigt: 0, schmerzWaehrend: e._maxWaehrend, erledigt: false, abgebrochen: false, ausgelassen: null });
    }
    delete e._maxWaehrend;
  }
  if (dateien.visap) {
    for (const o of alsObjekte(dateien.visap)) {
      const datumISO = isoAus(o);
      const score = zahl(o.Score);
      if (!datumISO || score === null) continue;
      visap.push({ id: o['VISA-P-ID'] || `visap-${datumISO}`, datumISO, score, notiz: o.Notiz || '' });
    }
  }
  return { einheiten: [...einheiten.values()], morgen: [...morgen.values()], visap };
}

/** Nur Datensätze, die es noch nicht gibt (gleiche ID bzw. gleiches Datum beim Morgenwert). */
export function nurNeue(vorhanden, neu) {
  const ids = (l, k) => new Set((l || []).map((x) => x[k]));
  const e = ids(vorhanden.einheiten, 'id');
  const m = ids(vorhanden.morgen, 'datumISO');
  const v = ids(vorhanden.visap, 'id');
  return {
    einheiten: neu.einheiten.filter((x) => !e.has(x.id)),
    morgen: neu.morgen.filter((x) => !m.has(x.datumISO)),
    visap: neu.visap.filter((x) => !v.has(x.id)),
  };
}
