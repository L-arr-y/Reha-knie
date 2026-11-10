// Tab "Übungen": Katalog nach Stufen + Detailansicht im Sheet.
import { S } from '../store.js';
import { wirksameDosierung } from '../regeln.js';
import { esc } from '../util.js';
import { icon, statusChip, ytButton, openSheet } from '../ui.js';

const FELD_NAMEN = {
  saetze: 'Sätze',
  wiederholungen: 'Wiederholungen',
  haltezeit_s: 'Haltezeit',
  pause_s: 'Pause',
  tempo: 'Tempo',
  last: 'Last',
  einheiten_pro_tag: 'Häufigkeit',
  einheiten_pro_woche: 'Pro Woche',
  zusatzlast_kg: 'Zusatzlast',
  haeufigkeit: 'Häufigkeit',
  dauer_min: 'Dauer',
};
export const feldName = (k) => FELD_NAMEN[k] || k;
export const einheit = (k) => (k.endsWith('_s') ? ' s' : k.endsWith('_min') ? ' Min.' : k.endsWith('_kg') ? ' kg' : '');
export const eigenText = (k, v) => (typeof v === 'number' ? String(v).replace('.', ',') + einheit(k) : String(v));

export function render() {
  let html = `<h1 class="large-title">Übungen</h1><p class="subtitle">Alle Übungen aus deinen Quellen, nach Stufe.</p>`;
  const begleitIds = new Set();
  for (const p of S.daten.phasen) {
    const ids = [...(p.uebungen || [])];
    for (const v of p.varianten || []) ids.push(...v.uebungen);
    (p.begleitend || []).forEach((id) => begleitIds.add(id));
    if (!ids.length) continue;
    html += `<div class="section"><div class="section-header">Stufe ${p.nr} – ${esc(p.name)}${p.id === S.kv.phase ? ' · aktuell' : ''}</div><div class="list">`;
    for (const id of ids) html += zeile(id);
    html += `</div></div>`;
  }
  html += `<div class="section"><div class="section-header">Begleitend (alle Stufen)</div><div class="list">`;
  for (const id of begleitIds) html += zeile(id);
  html += `</div></div>`;
  return html;
}

function zeile(id) {
  const u = S.ueb[id];
  if (!u) return '';
  return `<button class="cell" data-action="uebung-info" data-id="${esc(id)}">
    <div class="grow"><div class="headline">${esc(u.name)} ${statusChip(u.status)}</div><div class="footnote">${esc(u.name_en)}</div></div>${icon.chev}
  </button>`;
}

function detail(id) {
  const u = S.ueb[id];
  const r = S.daten.regeln;
  const d = wirksameDosierung(u, S.kv.eigeneWerte?.[id] || {});
  let html = `<div class="title2">${esc(u.name)}</div>
    <div class="footnote mt8">${esc(u.name_en)} ${statusChip(u.status)}</div>
    ${u.status === 'ergänzend' ? `<div class="footnote mt8">Ergänzend: schwache Quellenlage.</div>` : ''}
    ${ytButton(u, r, S.online)}
    <div class="section mt16"><div class="section-header">Ausführung</div><div class="list"><div class="cell-block"><ol class="plain" style="padding-left:20px;margin:0">
      ${u.ausfuehrung.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div></div></div>
    <div class="section"><div class="section-header">Dosierung</div><div class="list">`;
  for (const [k, f] of Object.entries(d)) {
    const txt = f.eigen ? esc(eigenText(k, S.kv.eigeneWerte[id][k])) : esc(f.text);
    html += `<div class="cell-block"><div class="footnote">${esc(feldName(k))}</div><div>${txt} ${statusChip(f.status, f.eigen)}</div>
      ${f.eigen ? `<div class="caption">Quelle/JSON: ${esc(u.dosierung[k].text)}</div>` : ''}</div>`;
  }
  html += `</div><div class="section-footer">OFFEN-Werte kannst du mit deinem Physio unter Einstellungen → Eigene Werte eintragen.</div></div>
    <div class="section"><div class="section-header">Intensität</div><div class="list"><div class="cell-block">${esc(u.intensitaet.text)} ${statusChip(u.intensitaet.status)}</div></div></div>
    <div class="section"><div class="section-header">Zielstruktur & Equipment</div><div class="list">
      <div class="cell-block"><div class="footnote">Zielstruktur</div>${esc(u.zielstruktur)}</div>
      <div class="cell-block"><div class="footnote">Equipment</div>${esc(u.equipment)}</div></div></div>
    <div class="section"><div class="section-header">Quelle</div><div class="list"><div class="cell-block footnote">${esc(u.quelle)}</div></div></div>`;
  return html;
}

export function oeffneUebung(id) {
  openSheet('Übung', () => detail(id));
}

export const actions = {
  'uebung-info': (el) => oeffneUebung(el.dataset.id),
};
