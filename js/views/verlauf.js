// Tab "Verlauf": Schmerz über Zeit, Trainings pro Woche, VISA-P, Liste der Einheiten.
import { S, speichern, loeschen } from '../store.js';
import { abgeschlossene, maxSchmerzWaehrend, faellig } from '../regeln.js';
import { esc, deDatum, isoDatum, addTage, diffTage, wochenStart, uid, parseZahl, zahlDE } from '../util.js';
import { icon, ampelChip, statusChip, openSheet, closeSheet, toast } from '../ui.js';

const ui = { bereich: 28, sel: null, tabelle: false, wSel: null };
const BEREICHE = [{ tage: 28, label: '4 Wochen' }, { tage: 91, label: '3 Monate' }, { tage: 0, label: 'Alles' }];
const SERIEN = [
  { key: 'waehrend', label: 'Während (stärkster)', farbe: 'var(--s1)', dash: '' },
  { key: 'nach', label: 'Direkt danach', farbe: 'var(--s2)', dash: '6 4' },
  { key: 'morgen', label: 'Nächster Morgen', farbe: 'var(--s3)', dash: '2 3' },
];

/** Tageswerte: höchster Wert je Tag. */
export function tageswerte(einheiten, morgen) {
  const tage = new Map();
  const max = (a, b) => (a === null || a === undefined ? b : b === null || b === undefined ? a : Math.max(a, b));
  for (const e of abgeschlossene(einheiten)) {
    const t = tage.get(e.datumISO) || { datum: e.datumISO, waehrend: null, nach: null, morgen: null, anzahl: 0 };
    t.waehrend = max(t.waehrend, maxSchmerzWaehrend(e));
    t.nach = max(t.nach, e.schmerzNach);
    t.anzahl++;
    tage.set(e.datumISO, t);
  }
  for (const m of morgen) {
    const d = m.bezugDatumISO || addTage(m.datumISO, -1);
    const t = tage.get(d);
    if (t) t.morgen = m.schmerz;
  }
  return [...tage.values()].sort((a, b) => (a.datum < b.datum ? -1 : 1));
}

function schmerzDiagramm(daten, r) {
  const h = isoDatum();
  const von = ui.bereich ? addTage(h, -ui.bereich + 1) : daten[0]?.datum || h;
  const pts = daten.filter((d) => d.datum >= von);
  if (!pts.length) return `<div class="cell-block muted">Noch keine Werte in diesem Zeitraum.</div>`;
  const W = 340; const H = 190; const L = 26; const R = 46; const T = 10; const B = 24;
  const span = Math.max(1, diffTage(von, h));
  const x = (iso) => L + (diffTage(von, iso) / span) * (W - L - R);
  const y = (v) => T + (1 - v / 10) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Schmerzverlauf: ${pts.length} Trainingstage">`;
  // Raster + Achse (zurückhaltend)
  for (const v of [0, 5, 10]) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
  // Schwellen aus regeln.json (grün bis …, gelb bis …) – grau, mit Text
  for (const [v, t] of [[r.ampel.gruen_max, 'grün'], [r.ampel.gelb_max, 'gelb']]) {
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="schwelle"/><text x="${W - R + 5}" y="${y(v) + 4}" class="ax">≤${v} ${t}</text>`;
  }
  s += `<text x="${L}" y="${H - 6}" class="ax">${deDatum(von).slice(0, 6)}</text><text x="${W - R}" y="${H - 6}" class="ax" text-anchor="end">${deDatum(h).slice(0, 6)}</text>`;
  for (const se of SERIEN) {
    const p = pts.filter((d) => d[se.key] !== null && d[se.key] !== undefined);
    if (p.length > 1) s += `<polyline points="${p.map((d) => `${x(d.datum).toFixed(1)},${y(d[se.key]).toFixed(1)}`).join(' ')}" fill="none" stroke="${se.farbe}" stroke-width="2" stroke-dasharray="${se.dash}" stroke-linejoin="round" stroke-linecap="round"/>`;
    for (const d of p) s += `<circle cx="${x(d.datum).toFixed(1)}" cy="${y(d[se.key]).toFixed(1)}" r="4" fill="${se.farbe}" stroke="var(--bg2)" stroke-width="2"/>`;
  }
  // Auswahl (Fadenkreuz) + Tooltip
  const sel = pts.find((d) => d.datum === ui.sel);
  if (sel) s += `<line x1="${x(sel.datum)}" x2="${x(sel.datum)}" y1="${T}" y2="${H - B}" class="cross"/>`;
  // Tippfläche je Tag (größer als die Punkte)
  const breite = Math.max(24, (W - L - R) / Math.max(pts.length, 1));
  for (const d of pts) s += `<rect x="${(x(d.datum) - breite / 2).toFixed(1)}" y="0" width="${breite.toFixed(1)}" height="${H}" fill="transparent" data-action="chart-sel" data-datum="${d.datum}"/>`;
  s += `</svg>`;
  let tip = '';
  if (sel) {
    tip = `<div class="tip"><b>${deDatum(sel.datum)}</b>${sel.anzahl > 1 ? ` · ${sel.anzahl} Einheiten` : ''}<br>
      ${SERIEN.map((se) => `<span class="lg-line" style="--c:${se.farbe}"><svg width="22" height="8"><line x1="1" y1="4" x2="21" y2="4" stroke="${se.farbe}" stroke-width="2" stroke-dasharray="${se.dash}"/></svg>${se.label}: <b>${sel[se.key] ?? '–'}</b></span>`).join('<br>')}</div>`;
  }
  return s + tip;
}

function legende() {
  return `<div class="legend">${SERIEN.map((se) => `<span class="lg-line"><svg width="22" height="8" aria-hidden="true"><line x1="1" y1="4" x2="21" y2="4" stroke="${se.farbe}" stroke-width="2" stroke-dasharray="${se.dash}"/></svg>${se.label}</span>`).join('')}</div>`;
}

function wochenDiagramm() {
  const h = isoDatum();
  const ws = wochenStart(h);
  const wochen = [];
  for (let i = 7; i >= 0; i--) wochen.push({ start: addTage(ws, -7 * i), n: 0 });
  for (const e of abgeschlossene(S.einheiten)) {
    const w = wochen.find((x) => x.start === wochenStart(e.datumISO));
    if (w) w.n++;
  }
  const max = Math.max(4, ...wochen.map((w) => w.n));
  const W = 340; const H = 150; const L = 22; const B = 22; const T = 16;
  const bw = (W - L) / wochen.length;
  const y = (v) => T + (1 - v / max) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Einheiten pro Woche, letzte 8 Wochen">`;
  for (const v of [0, max]) s += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
  wochen.forEach((w, i) => {
    const x0 = L + i * bw + 3; const wd = bw - 6;
    if (w.n > 0) {
      const top = y(w.n); const bot = y(0); const rr = Math.min(4, (bot - top) / 2);
      s += `<path d="M${x0},${bot} V${top + rr} Q${x0},${top} ${x0 + rr},${top} H${x0 + wd - rr} Q${x0 + wd},${top} ${x0 + wd},${top + rr} V${bot} Z" fill="var(--s1)" opacity="${ui.wSel && ui.wSel !== w.start ? 0.45 : 1}"/>`;
    }
    if (i === wochen.length - 1 || ui.wSel === w.start) s += `<text x="${x0 + wd / 2}" y="${y(w.n) - 4}" class="ax val" text-anchor="middle">${w.n}</text>`;
    if (i % 2 === 1) s += `<text x="${x0 + wd / 2}" y="${H - 6}" class="ax" text-anchor="middle">${deDatum(w.start).slice(0, 6)}</text>`;
    s += `<rect x="${L + i * bw}" y="0" width="${bw}" height="${H}" fill="transparent" data-action="woche-sel" data-start="${w.start}"/>`;
  });
  s += `</svg>`;
  const sel = wochen.find((w) => w.start === ui.wSel);
  return s + (sel ? `<div class="tip">Woche ab ${deDatum(sel.start)}: <b>${sel.n} ${sel.n === 1 ? 'Einheit' : 'Einheiten'}</b></div>` : '');
}

function visapAbschnitt(r) {
  const v = r.visap;
  const liste = [...S.visap].sort((a, b) => (a.datumISO < b.datumISO ? -1 : 1));
  const erster = liste[0]; const letzter = liste[liste.length - 1];
  let html = `<div class="section"><div class="section-header">VISA-P (0–${v.max} Punkte)</div><div class="list">`;
  if (letzter) {
    const diff = letzter.score - erster.score;
    html += `<div class="cell-block"><div class="hero mono">${zahlDE(letzter.score)}</div>
      <div class="footnote">zuletzt am ${deDatum(letzter.datumISO)}${liste.length > 1 ? ` · ${diff >= 0 ? '+' : ''}${zahlDE(diff)} seit ${deDatum(erster.datumISO)}` : ''}</div>
      ${liste.length > 1 ? `<div class="footnote mt8">${diff >= v.klinisch_relevant_plus ? `✓ Verbesserung um mindestens ${v.klinisch_relevant_plus} Punkte – laut Quellen klinisch bedeutsam.` : `Klinisch bedeutsam laut Quellen: +${v.klinisch_relevant_plus} Punkte.`}</div>` : ''}</div>`;
    for (const x of [...liste].reverse()) {
      html += `<button class="cell" data-action="visap-bearbeiten" data-id="${esc(x.id)}"><div class="grow">${deDatum(x.datumISO)}${x.notiz ? `<div class="footnote">${esc(x.notiz)}</div>` : ''}</div><div class="value mono">${zahlDE(x.score)}</div>${icon.chev}</button>`;
    }
  } else {
    html += `<div class="cell-block muted">Noch kein Score eingetragen. Trage einen Ausgangswert ein.</div>`;
  }
  html += `<div class="cell-block"><button class="btn block" data-action="visap-neu">VISA-P eintragen</button></div></div>
    <div class="section-footer">${esc(v.text)} Erinnerung alle ${v.erinnerung_tage} Tage. Die Fragen des Fragebogens stehen nicht in deinen Quellen – Score z. B. mit dem Physio erheben und hier eintragen.</div></div>`;
  return html;
}

export function render() {
  const r = S.daten.regeln;
  const daten = tageswerte(S.einheiten, S.morgen);
  const liste = abgeschlossene(S.einheiten).reverse();
  let html = `<h1 class="large-title">Verlauf</h1>`;
  html += `<button class="btn filled lg mb8" data-action="export">${icon.share}Daten exportieren (CSV)</button>
    <div class="footnote center mb8">${S.kv.letzterExportISO ? `Letzter Export: ${deDatum(S.kv.letzterExportISO.slice(0, 10))}` : 'Noch nie exportiert.'}</div>`;

  html += `<div class="section mt16"><div class="section-header">Schmerz über Zeit (0–10)</div><div class="card viz">
    <div class="seg mb8">${BEREICHE.map((b) => `<button data-action="bereich" data-tage="${b.tage}" aria-pressed="${ui.bereich === b.tage}">${b.label}</button>`).join('')}</div>
    ${legende()}
    ${ui.tabelle ? tabelle(daten) : schmerzDiagramm(daten, r)}
    <button class="link-btn" data-action="tabelle">${ui.tabelle ? 'Als Diagramm anzeigen' : 'Als Tabelle anzeigen'}</button>
  </div><div class="section-footer">Tippe auf einen Tag für die Werte. Je Tag zählt der höchste Wert. Folgetag-Schmerz wird nur angezeigt, nicht bewertet (${esc(r.folgetag_schmerz.status)}).</div></div>`;

  html += `<div class="section"><div class="section-header">Einheiten pro Woche</div><div class="card viz">${wochenDiagramm()}</div>
    <div class="section-footer">Letzte 8 Wochen, Montag bis Sonntag.</div></div>`;

  html += visapAbschnitt(r);

  html += `<div class="section"><div class="section-header">Alle Einheiten</div><div class="list">`;
  if (!liste.length) html += `<div class="cell-block muted">Noch keine Einheiten gespeichert.</div>`;
  for (const e of liste) {
    const m = S.morgen.find((x) => x.bezugDatumISO === e.datumISO);
    html += `<button class="cell" data-action="einheit-details" data-id="${esc(e.id)}"><div class="grow">
      <div class="headline">${deDatum(e.datumISO)} · Stufe ${esc(String(e.phase).replace('stufe', ''))}</div>
      <div class="footnote">Vorher ${e.schmerzVor ?? '–'} · Während ${maxSchmerzWaehrend(e) ?? '–'} · Danach ${e.schmerzNach ?? '–'} · Morgen ${m ? m.schmerz : '–'}</div>
    </div>${icon.chev}</button>`;
  }
  html += `</div></div>`;
  return html;
}

function tabelle(daten) {
  if (!daten.length) return `<div class="cell-block muted">Noch keine Werte.</div>`;
  return `<table class="tbl"><thead><tr><th>Datum</th><th>Während</th><th>Danach</th><th>Morgen</th></tr></thead><tbody>
    ${[...daten].reverse().map((d) => `<tr><td>${deDatum(d.datum)}</td><td>${d.waehrend ?? '–'}</td><td>${d.nach ?? '–'}</td><td>${d.morgen ?? '–'}</td></tr>`).join('')}</tbody></table>`;
}

// ---------- Sheets ----------
function einheitSheet(id) {
  const e = S.einheiten.find((x) => x.id === id);
  if (!e) return '<div class="muted">Einheit nicht gefunden.</div>';
  const r = S.daten.regeln;
  const m = S.morgen.find((x) => x.bezugDatumISO === e.datumISO);
  const zeit = new Date(e.startISO).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  let html = `<div class="title2">${deDatum(e.datumISO)}, ${zeit} Uhr</div><div class="footnote mt8">Stufe ${esc(String(e.phase).replace('stufe', ''))}</div>
    <div class="section mt16"><div class="section-header">Schmerz</div><div class="list">
      <div class="cell"><div class="grow">Vorher</div><div class="value">${e.schmerzVor ?? '–'}</div></div>
      <div class="cell"><div class="grow">Danach</div><div class="value">${e.schmerzNach ?? '–'}</div></div>
      <div class="cell"><div class="grow">Nächster Morgen</div><div class="value">${m ? m.schmerz : '–'}${m?.alltagsschmerzZunahme ? ' · Alltagsschmerz ↑' : ''}</div></div>
      <div class="cell"><div class="grow">Beschwerdefrei</div><div class="value">${e.beschwerdefrei === true ? 'ja' : e.beschwerdefrei === false ? 'nein' : '–'}</div></div>
    </div></div>
    <div class="section"><div class="section-header">Übungen</div><div class="list">`;
  for (const u of e.uebungen) {
    const st = u.abgebrochen ? 'abgebrochen' : u.ausgelassen && u.ausgelassen !== 'manuell_ein' ? 'ausgelassen' : u.erledigt ? 'erledigt' : `${u.saetzeErledigt || 0} Sätze`;
    html += `<div class="cell-block"><div class="headline">${esc(u.name || u.uebungId)}</div>
      <div class="footnote">${esc(st)}${u.saetzeGeplant ? ` · ${u.saetzeErledigt}/${u.saetzeGeplant} Sätze` : ''}${u.zusatzlastKg ? ` · +${zahlDE(u.zusatzlastKg)} kg` : ''}</div>
      ${u.schmerzWaehrend !== null && u.schmerzWaehrend !== undefined ? `<div class="mt8">${ampelChip(u.schmerzWaehrend, r)}</div>` : ''}</div>`;
  }
  html += `</div></div>${e.notiz ? `<div class="section"><div class="section-header">Notiz</div><div class="list"><div class="cell-block">${esc(e.notiz)}</div></div></div>` : ''}
    <button class="btn danger block" data-action="einheit-loeschen" data-id="${esc(e.id)}">Einheit löschen</button>`;
  return html;
}

const visapEntwurf = { id: null, datum: '', score: '', notiz: '' };
function visapSheet() {
  const v = S.daten.regeln.visap;
  return `<div class="title2">VISA-P eintragen</div>
    <div class="footnote mt8">Score von ${v.min} bis ${v.max} (${v.max} = beschwerdefrei). ${statusChip(v.status)}</div>
    <div class="section mt16"><div class="list">
      <div class="cell-block"><div class="headline">Datum</div><input type="date" class="mt8" data-input="visap-datum" value="${esc(visapEntwurf.datum)}"></div>
      <div class="cell-block"><div class="headline">Score</div><input inputmode="decimal" class="mt8" data-input="visap-score" value="${esc(visapEntwurf.score)}" placeholder="z. B. 62"></div>
      <div class="cell-block"><div class="headline">Notiz (optional)</div><input type="text" class="mt8" data-input="visap-notiz" value="${esc(visapEntwurf.notiz)}"></div>
    </div></div>
    <button class="btn filled lg" data-action="visap-speichern">Speichern</button>
    ${visapEntwurf.id ? `<button class="btn danger block mt12" data-action="visap-loeschen">Eintrag löschen</button>` : ''}`;
}

export function visapFaellig() {
  const letzter = [...S.visap].sort((a, b) => (a.datumISO < b.datumISO ? -1 : 1)).pop();
  return faellig(letzter?.datumISO || null, isoDatum(), S.daten.regeln.visap.erinnerung_tage);
}

export function oeffneVisap(id = null) {
  const x = id ? S.visap.find((v) => v.id === id) : null;
  Object.assign(visapEntwurf, x ? { id: x.id, datum: x.datumISO, score: zahlDE(x.score), notiz: x.notiz || '' } : { id: null, datum: isoDatum(), score: '', notiz: '' });
  openSheet('VISA-P', visapSheet);
}

export const actions = {
  bereich: (el) => { ui.bereich = Number(el.dataset.tage); ui.sel = null; },
  tabelle: () => { ui.tabelle = !ui.tabelle; },
  'chart-sel': (el) => { ui.sel = ui.sel === el.dataset.datum ? null : el.dataset.datum; },
  'woche-sel': (el) => { ui.wSel = ui.wSel === el.dataset.start ? null : el.dataset.start; },
  'einheit-details': (el) => openSheet('Einheit', () => einheitSheet(el.dataset.id)),
  'einheit-loeschen': async (el) => {
    if (!confirm('Diese Einheit endgültig löschen? Das kann nicht rückgängig gemacht werden.')) return;
    const id = el.dataset.id;
    await loeschen('einheiten', id);
    for (const ev of S.ereignisse.filter((x) => x.einheitId === id)) await loeschen('ereignisse', ev.id);
    closeSheet();
    toast('Einheit gelöscht.');
  },
  'visap-neu': () => oeffneVisap(),
  'visap-bearbeiten': (el) => oeffneVisap(el.dataset.id),
  'visap-speichern': async () => {
    const v = S.daten.regeln.visap;
    const score = parseZahl(visapEntwurf.score);
    if (score === null || score < v.min || score > v.max) { toast(`Bitte einen Score von ${v.min} bis ${v.max} eingeben.`); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visapEntwurf.datum)) { toast('Bitte ein Datum wählen.'); return; }
    await speichern('visap', { id: visapEntwurf.id || uid(), datumISO: visapEntwurf.datum, score, notiz: visapEntwurf.notiz.trim() });
    closeSheet();
    toast('VISA-P gespeichert.');
  },
  'visap-loeschen': async () => {
    if (!confirm('Diesen VISA-P-Eintrag löschen?')) return;
    await loeschen('visap', visapEntwurf.id);
    closeSheet();
  },
};

export const inputs = {
  'visap-datum': (el) => { visapEntwurf.datum = el.value; return false; },
  'visap-score': (el) => { visapEntwurf.score = el.value; return false; },
  'visap-notiz': (el) => { visapEntwurf.notiz = el.value; return false; },
};
