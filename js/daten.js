// Datensicherung: CSV-Export über das Teilen-Menü (Fallback: Download) und CSV-Import.
import { S, setKV, speichern } from './store.js';
import { exportEinheiten, exportSchmerz, exportVisap, dateiname, parse, erkenneTyp, importieren, nurNeue } from './csv.js';
import { abgeschlossene } from './regeln.js';
import { esc, isoDatum } from './util.js';
import { icon, openSheet, closeSheet, toast } from './ui.js';

function dateien() {
  const h = isoDatum();
  const mk = (typ, text) => new File([text], dateiname(typ, h), { type: 'text/csv' });
  return [
    mk('einheiten', exportEinheiten(S.einheiten)),
    mk('schmerz', exportSchmerz(S.einheiten, S.morgen)),
    mk('visap', exportVisap(S.visap)),
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
      if (err && err.name === 'AbortError') return; // abgebrochen – nichts tun
      // anderer Fehler → Download-Variante anbieten
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
    <div class="footnote mt8">Tippe nacheinander auf die drei Dateien. Auf dem iPhone landen sie in der App <b>Dateien</b> → <b>Downloads</b>.</div>
    <div class="section mt16"><div class="list">
      ${links.map((l) => `<a class="cell" href="${l.u}" download="${esc(l.name)}" data-action="download"><div class="grow" style="color:var(--blue)">${esc(l.name)}</div>${icon.chev}</a>`).join('')}
    </div></div>`);
}

// ---------------------------------------------------------------- Import
const imp = { gelesen: {}, namen: [], fehler: [], neu: null };

function importSheet() {
  let html = `<div class="title2">Daten importieren</div>
    <div class="footnote mt8">Wähle die CSV-Dateien aus einem früheren Export (Einheiten, Schmerz, VISA-P – alle drei zusammen ist am besten). Vorhandene Daten bleiben erhalten; doppelte Einträge werden übersprungen.</div>
    <label class="btn filled lg file-pick mt16" style="display:flex">Dateien auswählen
      <input type="file" accept=".csv,text/csv,text/comma-separated-values" multiple data-input="import-dateien"></label>`;
  if (imp.namen.length) {
    html += `<div class="section mt16"><div class="section-header">Gelesen</div><div class="list">
      ${imp.namen.map((n) => `<div class="cell"><div class="grow">${esc(n.name)}</div><div class="value">${n.typ ? esc(n.typ) : '✕ unbekannt'}</div></div>`).join('')}</div></div>`;
  }
  if (imp.fehler.length) html += `<div class="banner rot"><div class="sym">!</div><div class="body">${imp.fehler.map(esc).join('<br>')}</div></div>`;
  if (imp.neu) {
    const n = imp.neu;
    const leer = !n.einheiten.length && !n.morgen.length && !n.visap.length;
    html += `<div class="section"><div class="section-header">Wird übernommen</div><div class="list">
      <div class="cell"><div class="grow">Einheiten</div><div class="value">${n.einheiten.length}</div></div>
      <div class="cell"><div class="grow">Morgenwerte</div><div class="value">${n.morgen.length}</div></div>
      <div class="cell"><div class="grow">VISA-P</div><div class="value">${n.visap.length}</div></div></div>
      ${!imp.gelesen.einheiten && imp.gelesen.schmerz ? '<div class="section-footer">Ohne Einheiten-Datei fehlen die Details zu den Übungen.</div>' : ''}</div>
      <button class="btn filled lg" data-action="import-ok" ${leer ? 'disabled' : ''}>${leer ? 'Nichts Neues zu übernehmen' : 'Zusammenführen'}</button>`;
  }
  return html;
}

export function oeffneImport() {
  Object.assign(imp, { gelesen: {}, namen: [], fehler: [], neu: null });
  openSheet('Import', importSheet);
}

async function dateienLesen(el) {
  imp.gelesen = {}; imp.namen = []; imp.fehler = []; imp.neu = null;
  for (const f of el.files) {
    try {
      const rows = parse(await f.text());
      const typ = erkenneTyp(rows);
      imp.namen.push({ name: f.name, typ });
      if (typ) imp.gelesen[typ] = rows;
      else imp.fehler.push(`${f.name}: Kopfzeile nicht erkannt – ist das eine Export-Datei dieser App?`);
    } catch (e) {
      imp.fehler.push(`${f.name}: ${e.message}`);
    }
  }
  if (Object.keys(imp.gelesen).length) imp.neu = nurNeue(S, importieren(imp.gelesen));
  return true;
}

async function importUebernehmen() {
  const n = imp.neu;
  const vorherLeer = abgeschlossene(S.einheiten).length === 0;
  for (const e of n.einheiten) await speichern('einheiten', e);
  for (const m of n.morgen) await speichern('morgen', m);
  for (const v of n.visap) await speichern('visap', v);
  // Nach Datenverlust: Stufe aus der letzten importierten Einheit übernehmen
  if (vorherLeer && n.einheiten.length) {
    const letzte = abgeschlossene(n.einheiten).pop();
    if (letzte?.phase && S.daten.phasen.some((p) => p.id === letzte.phase)) await setKV('phase', letzte.phase);
  }
  closeSheet();
  toast(`Importiert: ${n.einheiten.length} Einheiten, ${n.morgen.length} Morgenwerte, ${n.visap.length} VISA-P.`);
}

export const actions = {
  export: () => exportieren(),
  download: () => { exportiert(); return 'kein-render'; },
  import: () => oeffneImport(),
  'import-ok': () => importUebernehmen(),
};

export const inputs = {
  'import-dateien': (el) => dateienLesen(el),
};
