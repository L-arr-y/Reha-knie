// Datensicherung: CSV-Export über das Teilen-Menü (Fallback: Download) und CSV-Import.
import { S, R, setKV, speichern, status, KV_STANDARD } from './store.js';
import {
  exportMorgenchecks, exportEinheiten, exportSaetze, exportStufen, exportRtp, exportVisap, exportEinstellungen,
  dateiname, parse, erkenneTyp, importieren, nurNeue,
} from './csv.js';
import { rtpAuswertung } from './regeln.js';
import { esc, isoDatum } from './util.js';
import { icon, openSheet, closeSheet, toast } from './ui.js';

// Einstellungen, die mit gesichert werden (keine Erinnerungs-/Anzeige-Zustände).
const EINSTELLUNGEN = ['startStufe', 'startDatum', 'planStart', 'koerpergewicht', 'bein', 'bestaetigt', 'eigeneWerte', 'regelWerte', 'isoVariante'];
const NAMEN = { morgenchecks: 'Morgentests', einheiten: 'Einheiten (je Übung)', saetze: 'Sätze', stufen: 'Stufenwechsel', rtp: 'Return-to-Play', visap: 'VISA-P', einstellungen: 'Einstellungen' };

function dateien() {
  const h = isoDatum();
  const st = status(h);
  const infoAm = (d) => st.verlauf.find((v) => v.datum === d) || {};
  const auswerten = (c) => rtpAuswertung(c, { verlauf: st.verlauf, heute: c.datum, bein: S.kv.bein }, R());
  const mk = (typ, text) => new File([text], dateiname(typ, h), { type: 'text/csv' });
  return [
    mk('morgenchecks', exportMorgenchecks(S.morgenchecks, infoAm)),
    mk('einheiten', exportEinheiten(S.einheiten)),
    mk('saetze', exportSaetze(S.einheiten)),
    mk('stufen', exportStufen(st.stufenVerlauf, S.stufenwechsel)),
    mk('rtp', exportRtp(S.rtpchecks, auswerten)),
    mk('visap', exportVisap(S.visap)),
    mk('einstellungen', exportEinstellungen(S.kv, EINSTELLUNGEN)),
  ];
}

async function exportiert() { await setKV('letzterExportISO', new Date().toISOString()); }

/** Muss direkt aus einem Antippen heraus aufgerufen werden (Safari verlangt das fürs Teilen). */
export async function exportieren() {
  const files = dateien();
  if (navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({ files, title: 'Reha-Daten (CSV)' });
      await exportiert();
      toast('Export geteilt.');
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  downloadSheet(files);
}

const urls = [];
function downloadSheet(files) {
  urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  const links = files.map((f) => { const u = URL.createObjectURL(f); urls.push(u); return { u, name: f.name }; });
  openSheet('Export', () => `
    <div class="title2">Dateien speichern</div>
    <div class="footnote mt8">Tippe nacheinander auf die ${links.length} Dateien. Auf dem iPhone landen sie in der App <b>Dateien</b> → <b>Downloads</b>.</div>
    <div class="section mt16"><div class="list">
      ${links.map((l) => `<a class="cell" href="${l.u}" download="${esc(l.name)}" data-action="download"><div class="grow" style="color:var(--blue)">${esc(l.name)}</div>${icon.chev}</a>`).join('')}
    </div></div>`);
}

// ---------------------------------------------------------------- Import
const imp = { gelesen: {}, namen: [], fehler: [], neu: null };

function importSheet() {
  let html = `<div class="title2">Daten importieren</div>
    <div class="footnote mt8">Wähle die CSV-Dateien aus einem früheren Export – am besten alle zusammen. Vorhandene Einträge bleiben erhalten, doppelte werden übersprungen.</div>
    <label class="btn filled lg file-pick mt16" style="display:flex">Dateien auswählen
      <input type="file" accept=".csv,text/csv,text/comma-separated-values" multiple data-input="import-dateien"></label>`;
  if (imp.namen.length) {
    html += `<div class="section mt16"><div class="section-header">Gelesen</div><div class="list">
      ${imp.namen.map((n) => `<div class="cell"><div class="grow">${esc(n.name)}</div><div class="value">${n.typ ? esc(NAMEN[n.typ]) : '✕ unbekannt'}</div></div>`).join('')}</div></div>`;
  }
  if (imp.fehler.length) html += `<div class="banner rot"><div class="sym">!</div><div class="body">${imp.fehler.map(esc).join('<br>')}</div></div>`;
  if (imp.neu) {
    const n = imp.neu;
    const zeilen = [['Morgentests', n.morgenchecks.length], ['Einheiten', n.einheiten.length], ['Stufenwechsel', n.stufenwechsel.length], ['Return-to-Play', n.rtpchecks.length], ['VISA-P', n.visap.length]];
    const leer = zeilen.every(([, z]) => z === 0) && !imp.einstellungenUebernehmen;
    html += `<div class="section"><div class="section-header">Wird übernommen</div><div class="list">
      ${zeilen.map(([t, z]) => `<div class="cell"><div class="grow">${t}</div><div class="value">${z}</div></div>`).join('')}
      <div class="cell"><div class="grow">Einstellungen</div><div class="value">${imp.einstellungenUebernehmen ? 'ja' : imp.gelesen.einstellungen ? 'nein (schon vorhanden)' : '–'}</div></div></div>
      ${imp.gelesen.einheiten && !imp.gelesen.saetze ? '<div class="section-footer">Ohne Sätze-Datei fehlen die einzelnen Sätze (kg je Satz).</div>' : ''}</div>
      <button class="btn filled lg" data-action="import-ok" ${leer ? 'disabled' : ''}>${leer ? 'Nichts Neues zu übernehmen' : 'Zusammenführen'}</button>`;
  }
  return html;
}

export function oeffneImport() {
  Object.assign(imp, { gelesen: {}, namen: [], fehler: [], neu: null, einstellungenUebernehmen: false });
  openSheet('Import', importSheet);
}

async function dateienLesen(el) {
  Object.assign(imp, { gelesen: {}, namen: [], fehler: [], neu: null, einstellungenUebernehmen: false });
  for (const f of el.files) {
    try {
      const rows = parse(await f.text());
      const typ = erkenneTyp(rows);
      imp.namen.push({ name: f.name, typ });
      if (typ) imp.gelesen[typ] = rows;
      else imp.fehler.push(`${f.name}: Kopfzeile nicht erkannt – ist das eine Export-Datei dieser App?`);
    } catch (e) { imp.fehler.push(`${f.name}: ${e.message}`); }
  }
  if (Object.keys(imp.gelesen).length) {
    imp.neu = nurNeue(S, importieren(imp.gelesen));
    // Einstellungen nur auf einem „leeren“ Gerät übernehmen (neues iPhone / nach Datenverlust).
    imp.einstellungenUebernehmen = !!imp.gelesen.einstellungen && S.morgenchecks.length === 0 && S.einheiten.length === 0;
  }
  return true;
}

async function importUebernehmen() {
  const n = imp.neu;
  for (const store of ['morgenchecks', 'einheiten', 'stufenwechsel', 'rtpchecks', 'visap']) for (const x of n[store]) await speichern(store, x);
  if (imp.einstellungenUebernehmen) {
    for (const [k, v] of Object.entries(n.einstellungen)) if (k in KV_STANDARD && EINSTELLUNGEN.includes(k)) await setKV(k, v);
  }
  closeSheet();
  toast(`Importiert: ${n.morgenchecks.length} Morgentests, ${n.einheiten.length} Einheiten, ${n.visap.length} VISA-P.`);
}

export const actions = {
  export: () => exportieren(),
  download: () => { exportiert(); },
  import: () => oeffneImport(),
  'import-ok': () => importUebernehmen(),
};

export const inputs = {
  'import-dateien': (el) => dateienLesen(el),
};
