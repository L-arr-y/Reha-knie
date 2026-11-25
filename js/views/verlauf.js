// Tab "Verlauf": Morgentest-Kurve mit Stufen-Zeitleiste, Lastkurve (getrennt), Einheiten pro Woche, VISA-P, Einheiten.
import { S, R, status, speichern, loeschen } from '../store.js';
import { abgeschlossene, faellig } from '../regeln.js';
import { esc, deDatum, isoDatum, addTage, diffTage, wochenStart, uid, parseZahl, zahlDE } from '../util.js';
import { icon, ampelChip, schmerzAmpel, statusChip, openSheet, closeSheet, toast, kopf } from '../ui.js';

const ui = { bereich: 28, sel: null, lastSel: null, uebung: null, wSel: null, tabelle: false };
const BEREICHE = [{ tage: 28, label: '4 Wochen' }, { tage: 56, label: '8 Wochen' }, { tage: 0, label: 'Alles' }];
const W = 340; const L = 26; const R_ = 52;

function zeitraum(daten, h) {
  const von = ui.bereich ? addTage(h, -ui.bereich + 1) : (daten[0] || h);
  return { von, span: Math.max(1, diffTage(von, h)) };
}

// ---------------------------------------------------------------- Morgentest-Kurve
function morgenDiagramm(st, r, h) {
  const { von, span } = zeitraum(st.verlauf.map((v) => v.datum), h);
  const pts = st.verlauf.filter((v) => v.datum >= von);
  if (!pts.length) return `<div class="cell-block muted">Noch keine Morgentests in diesem Zeitraum.</div>`;
  const H = 190; const T = 10; const B = 22;
  const x = (d) => L + (diffTage(von, d) / span) * (W - L - R_);
  const y = (v) => T + (1 - v / 10) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Morgentest-Verlauf, ${pts.length} Werte">`;
  for (const v of [0, 5, 10]) s += `<line x1="${L}" x2="${W - R_}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
  for (const [v, t] of [[r.ampel.gruenMax, 'grün'], [r.ampel.gelbMax, 'gelb']]) {
    s += `<line x1="${L}" x2="${W - R_}" y1="${y(v)}" y2="${y(v)}" class="schwelle"/><text x="${W - R_ + 5}" y="${y(v) + 4}" class="ax">≤${v} ${t}</text>`;
  }
  s += `<text x="${L}" y="${H - 6}" class="ax">${deDatum(von).slice(0, 6)}</text><text x="${W - R_}" y="${H - 6}" class="ax" text-anchor="end">${deDatum(h).slice(0, 6)}</text>`;
  if (pts.length > 1) s += `<polyline points="${pts.map((p) => `${x(p.datum).toFixed(1)},${y(p.wert).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round"/>`;
  const sel = pts.find((p) => p.datum === ui.sel);
  if (sel) s += `<line x1="${x(sel.datum)}" x2="${x(sel.datum)}" y1="${T}" y2="${H - B}" class="cross"/>`;
  // Punkte in Ampelfarbe mit Symbol (Status nie nur über Farbe)
  for (const p of pts) {
    const cx = x(p.datum).toFixed(1); const cy = y(p.wert).toFixed(1);
    s += `<circle cx="${cx}" cy="${cy}" r="6" class="pt-${p.ampel}" stroke="var(--bg2)" stroke-width="2"/>`;
    if (pts.length <= 31) s += `<text x="${cx}" y="${(+cy + 3).toFixed(1)}" class="pt-sym ${p.ampel}" text-anchor="middle">${r.ampel.stufen[p.ampel].symbol}</text>`;
  }
  const breite = Math.max(22, (W - L - R_) / Math.max(pts.length, 1));
  for (const p of pts) s += `<rect x="${(x(p.datum) - breite / 2).toFixed(1)}" y="0" width="${breite.toFixed(1)}" height="${H}" fill="transparent" data-action="chart-sel" data-datum="${p.datum}"/>`;
  s += `</svg>` + stufenLeiste(st, von, span, h);
  if (sel) s += `<div class="tip"><b>${deDatum(sel.datum)}</b> · Morgentest <b>${sel.wert}/10</b> · ${ampelChip(sel.ampel, r)} · Stufe ${sel.stufe}</div>`;
  return s;
}

/** Stufen-Zeitleiste unter der Kurve (gleiche Zeitachse). */
function stufenLeiste(st, von, span, h) {
  const x = (d) => L + (Math.max(0, diffTage(von, d)) / span) * (W - L - R_);
  const segs = [];
  const v = st.stufenVerlauf;
  for (let i = 0; i < v.length; i++) {
    const start = v[i].datum < von ? von : v[i].datum;
    const ende = i + 1 < v.length ? v[i + 1].datum : addTage(h, 1);
    if (ende <= von) continue;
    segs.push({ nach: v[i].nach, x0: x(start), x1: Math.min(x(ende > h ? h : ende), W - R_) });
  }
  let s = `<svg viewBox="0 0 ${W} 26" class="chart" role="img" aria-label="Stufen im Zeitraum">`;
  s += `<text x="${L - 6}" y="17" class="ax" text-anchor="end">Stufe</text>`;
  segs.forEach((g) => {
    const wd = Math.max(2, g.x1 - g.x0 - 2);
    s += `<rect x="${g.x0.toFixed(1)}" y="4" width="${wd.toFixed(1)}" height="18" rx="4" class="stufe-seg s${Math.min(g.nach, 5)}"/>`;
    if (wd > 18) s += `<text x="${(g.x0 + wd / 2).toFixed(1)}" y="17" class="seg-lbl" text-anchor="middle">${g.nach <= 4 ? g.nach : 'E'}</text>`;
  });
  return s + `</svg>`;
}

// ---------------------------------------------------------------- Lastkurve
function lastUebungen() {
  const ids = new Map();
  for (const e of abgeschlossene(S.einheiten)) for (const u of e.uebungen) {
    if (u.saetze?.some((x) => x.erledigt && x.kg != null)) ids.set(u.uebungId, u.name);
  }
  return [...ids.entries()];
}

function lastDiagramm(h) {
  const liste = lastUebungen();
  if (!liste.length) return `<div class="cell-block muted">Noch keine Sätze mit Gewicht geloggt.</div>`;
  if (!ui.uebung || !liste.some(([id]) => id === ui.uebung)) ui.uebung = (liste.find(([id]) => S.ueb[id]?.hsr) || liste[0])[0];
  const punkte = [];
  for (const e of abgeschlossene(S.einheiten)) {
    const u = e.uebungen.find((x) => x.uebungId === ui.uebung);
    const kgs = (u?.saetze || []).filter((x) => x.erledigt && x.kg != null).map((x) => Number(x.kg));
    if (kgs.length) {
      const wdh = u.saetze.filter((x) => x.erledigt).map((x) => x.wdh).filter((x) => x != null);
      punkte.push({ datum: e.datum, kg: Math.max(...kgs), saetze: u.saetze.filter((x) => x.erledigt).length, wdh: wdh.length ? Math.min(...wdh) : null });
    }
  }
  const { von, span } = zeitraum(punkte.map((p) => p.datum), h);
  const pts = punkte.filter((p) => p.datum >= von);
  let html = `<select class="mb8" data-input="last-uebung" aria-label="Übung für die Lastkurve" style="width:100%;min-height:44px;border-radius:10px;border:0;background:var(--fill);padding:0 12px;font-size:17px">
    ${liste.map(([id, name]) => `<option value="${esc(id)}" ${id === ui.uebung ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select>`;
  if (!pts.length) return html + `<div class="cell-block muted">Keine Werte in diesem Zeitraum.</div>`;
  const H = 170; const T = 12; const B = 22;
  const max = Math.max(...pts.map((p) => p.kg)); const min = Math.min(...pts.map((p) => p.kg));
  const lo = Math.max(0, Math.floor((min - (max - min) * 0.2 - 1) / 5) * 5); const hi = Math.ceil((max + (max - min) * 0.1 + 1) / 5) * 5;
  const x = (d) => L + (diffTage(von, d) / span) * (W - L - R_);
  const y = (v) => T + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Lastverlauf in kg">`;
  for (const v of [lo, hi]) s += `<line x1="${L}" x2="${W - R_}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
  s += `<text x="${W - R_ + 5}" y="${y(hi) + 4}" class="ax">kg</text>`;
  if (pts.length > 1) s += `<polyline points="${pts.map((p) => `${x(p.datum).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--s2)" stroke-width="2" stroke-linejoin="round"/>`;
  for (const p of pts) s += `<circle cx="${x(p.datum).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="5" fill="var(--s2)" stroke="var(--bg2)" stroke-width="2"/>`;
  const letzte = pts[pts.length - 1];
  s += `<text x="${x(letzte.datum).toFixed(1)}" y="${(y(letzte.kg) - 10).toFixed(1)}" class="ax val" text-anchor="middle">${zahlDE(letzte.kg)}</text>`;
  const breite = Math.max(22, (W - L - R_) / pts.length);
  for (const p of pts) s += `<rect x="${(x(p.datum) - breite / 2).toFixed(1)}" y="0" width="${breite.toFixed(1)}" height="${H}" fill="transparent" data-action="last-sel" data-datum="${p.datum}"/>`;
  s += `</svg>`;
  const sel = pts.find((p) => p.datum === ui.lastSel);
  if (sel) s += `<div class="tip"><b>${deDatum(sel.datum)}</b> · ${zahlDE(sel.kg)} kg · ${sel.saetze} Sätze${sel.wdh != null ? ` · mind. ${sel.wdh} Wdh.` : ''}</div>`;
  return html + s;
}

// ---------------------------------------------------------------- Einheiten pro Woche
function wochenDiagramm(h, wertVon = () => 1, { selKey = 'wSel', action = 'woche-sel', label = (n) => `${n} ${n === 1 ? 'Einheit' : 'Einheiten'}`, minMax = 4 } = {}) {
  const ws = wochenStart(h);
  const wochen = [];
  for (let i = 7; i >= 0; i--) wochen.push({ start: addTage(ws, -7 * i), n: 0 });
  for (const e of abgeschlossene(S.einheiten)) { const w = wochen.find((x) => x.start === wochenStart(e.datum)); if (w) w.n += wertVon(e); }
  const max = Math.max(minMax, ...wochen.map((w) => w.n));
  const H = 150; const B = 22; const T = 16; const bw = (W - L) / wochen.length;
  const y = (v) => T + (1 - v / max) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Einheiten pro Woche, letzte 8 Wochen">`;
  for (const v of [0, max]) s += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
  wochen.forEach((w, i) => {
    const x0 = L + i * bw + 3; const wd = bw - 6;
    if (w.n > 0) {
      const top = y(w.n); const bot = y(0); const rr = Math.min(4, (bot - top) / 2);
      s += `<path d="M${x0},${bot} V${top + rr} Q${x0},${top} ${x0 + rr},${top} H${x0 + wd - rr} Q${x0 + wd},${top} ${x0 + wd},${top + rr} V${bot} Z" fill="var(--s1)" opacity="${ui[selKey] && ui[selKey] !== w.start ? 0.45 : 1}"/>`;
    }
    if (i === wochen.length - 1 || ui[selKey] === w.start) s += `<text x="${x0 + wd / 2}" y="${y(w.n) - 4}" class="ax val" text-anchor="middle">${w.n}</text>`;
    if (i % 2 === 1) s += `<text x="${x0 + wd / 2}" y="${H - 6}" class="ax" text-anchor="middle">${deDatum(w.start).slice(0, 6)}</text>`;
    s += `<rect x="${L + i * bw}" y="0" width="${bw}" height="${H}" fill="transparent" data-action="${action}" data-start="${w.start}"/>`;
  });
  s += `</svg>`;
  const sel = wochen.find((w) => w.start === ui[selKey]);
  return s + (sel ? `<div class="tip">Woche ab ${deDatum(sel.start)}: <b>${label(sel.n)}</b></div>` : '');
}

// ---------------------------------------------------------------- VISA-P
const visapEntwurf = { id: null, datum: '', score: '', notiz: '' };

function visapAbschnitt(r) {
  const v = r.visap;
  const liste = [...S.visap].sort((a, b) => (a.datum < b.datum ? -1 : 1));
  const erster = liste[0]; const letzter = liste[liste.length - 1];
  let html = `<div class="section"><div class="section-header">VISA-P (0–${v.max} Punkte) ${statusChip(v.status)}</div><div class="list">`;
  if (letzter) {
    const diff = letzter.score - erster.score;
    html += `<div class="cell-block"><div class="hero mono">${zahlDE(letzter.score)}</div>
      <div class="footnote">zuletzt am ${deDatum(letzter.datum)}${liste.length > 1 ? ` · ${diff >= 0 ? '+' : ''}${zahlDE(diff)} seit ${deDatum(erster.datum)}` : ''}</div></div>`;
    for (const x of [...liste].reverse()) {
      html += `<button class="cell" data-action="visap-bearbeiten" data-id="${esc(x.id)}"><div class="grow">${deDatum(x.datum)}${x.notiz ? `<div class="footnote">${esc(x.notiz)}</div>` : ''}</div><div class="value mono">${zahlDE(x.score)}</div>${icon.chev}</button>`;
    }
  } else html += `<div class="cell-block muted">Noch kein Score eingetragen.</div>`;
  html += `<div class="cell-block"><button class="btn block" data-action="visap-neu">VISA-P eintragen</button></div></div>
    <div class="section-footer">${esc(v.text)} Erinnerung alle ${v.erinnerung_tage} Tage. Die Fragen des Fragebogens stehen nicht im Leitfaden – Score z. B. mit dem Physio erheben.</div></div>`;
  return html;
}

function visapSheet() {
  const v = S.daten.regeln.visap;
  return `<div class="title2">VISA-P eintragen</div><div class="footnote mt8">Score von ${v.min} bis ${v.max} (${v.max} = beschwerdefrei).</div>
    <div class="section mt16"><div class="list">
      <div class="cell-block"><div class="headline">Datum</div><input type="date" class="mt8" data-input="visap-datum" value="${esc(visapEntwurf.datum)}"></div>
      <div class="cell-block"><div class="headline">Score</div><input inputmode="decimal" class="mt8" data-input="visap-score" value="${esc(visapEntwurf.score)}" placeholder="z. B. 62"></div>
      <div class="cell-block"><div class="headline">Notiz (optional)</div><input type="text" class="mt8" data-input="visap-notiz" value="${esc(visapEntwurf.notiz)}"></div>
    </div></div>
    <button class="btn filled lg" data-action="visap-speichern">Speichern</button>
    ${visapEntwurf.id ? `<button class="btn danger block mt12" data-action="visap-loeschen">Eintrag löschen</button>` : ''}`;
}

export function visapFaellig() {
  const letzter = [...S.visap].sort((a, b) => (a.datum < b.datum ? -1 : 1)).pop();
  return faellig(letzter?.datum || null, isoDatum(), S.daten.regeln.visap.erinnerung_tage);
}

export function oeffneVisap(id = null) {
  const x = id ? S.visap.find((v) => v.id === id) : null;
  Object.assign(visapEntwurf, x ? { id: x.id, datum: x.datum, score: zahlDE(x.score), notiz: x.notiz || '' } : { id: null, datum: isoDatum(), score: '', notiz: '' });
  openSheet('VISA-P', visapSheet);
}

// ---------------------------------------------------------------- Einheit-Details
function einheitSheet(id) {
  const e = S.einheiten.find((x) => x.id === id);
  if (!e) return '<div class="muted">Einheit nicht gefunden.</div>';
  const r = R();
  const zeit = new Date(e.startISO).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  let html = `<div class="title2">${deDatum(e.datum)}, ${zeit} Uhr</div><div class="footnote mt8">Stufe ${e.stufe} · ${ampelChip(e.ampel, r)} · Schmerz danach ${e.schmerzDanach ?? '–'}/10</div>
    <div class="section mt16"><div class="list">`;
  for (const u of e.uebungen) {
    const fertig = (u.saetze || []).filter((s) => s.erledigt);
    const satzText = fertig.map((s) => `${s.wdh ?? s.dauer ?? '–'}${s.dauer != null && s.wdh == null ? ' s' : ''}${s.kg != null ? ` × ${zahlDE(s.kg)} kg` : ''}`).join(' · ');
    const a = schmerzAmpel(u.schmerzWaehrend, r);
    html += `<div class="cell-block"><div class="headline">${esc(u.name)}</div>
      <div class="footnote">${u.erledigt ? '✓ erledigt' : fertig.length ? `${fertig.length}/${u.saetze.length} Sätze` : 'nicht gemacht'}${u.variante ? ` · ${esc(u.variante)}` : ''}${u.rir != null ? ` · RIR ${u.rir}` : ''}</div>
      ${satzText ? `<div class="footnote mono">${esc(satzText)}</div>` : ''}${a ? `<div class="mt8">${ampelChip(a, r, `${u.schmerzWaehrend}/10`)}</div>` : ''}</div>`;
  }
  html += `</div></div>${e.notiz ? `<div class="section"><div class="section-header">Notiz</div><div class="list"><div class="cell-block">${esc(e.notiz)}</div></div></div>` : ''}
    <button class="btn danger block" data-action="einheit-loeschen" data-id="${esc(e.id)}">Einheit löschen</button>`;
  return html;
}

// ---------------------------------------------------------------- Ansicht
export function render() {
  const r = R();
  const h = isoDatum();
  const st = status(h);
  let html = kopf('Verlauf');
  html += `<button class="btn filled lg mb8" data-action="export">${icon.share}Daten exportieren (CSV)</button>
    <div class="footnote center mb8">${S.kv.letzterExportISO ? `Letzter Export: ${deDatum(S.kv.letzterExportISO.slice(0, 10))}` : 'Noch nie exportiert.'}</div>
    <div class="seg mt16 mb8">${BEREICHE.map((b) => `<button data-action="bereich" data-tage="${b.tage}" aria-pressed="${ui.bereich === b.tage}">${b.label}</button>`).join('')}</div>`;

  html += `<div class="section"><div class="section-header">Morgentest und Stufe</div><div class="card viz">
    ${ui.tabelle ? morgenTabelle(st, r) : morgenDiagramm(st, r, h)}
    <button class="link-btn" data-action="tabelle">${ui.tabelle ? 'Als Diagramm anzeigen' : 'Als Tabelle anzeigen'}</button></div>
    <div class="section-footer">Tippe auf einen Tag für Details. Punkte zeigen die Ampel (✓ ! ✕), die Leiste darunter die Stufe.</div></div>`;

  html += `<div class="section"><div class="section-header">Last (höchstes Gewicht pro Einheit)</div><div class="card viz">${lastDiagramm(h)}</div>
    <div class="section-footer">Bewusst getrennt von der Schmerzkurve: zwei Diagramme statt zwei Skalen in einem.</div></div>`;

  html += `<div class="section"><div class="section-header">Einheiten pro Woche</div><div class="card viz">${wochenDiagramm(h)}</div></div>`;
  if (S.einheiten.some((e) => e.bbMinuten != null && e.bbAnstrengung != null)) {
    html += `<div class="section"><div class="section-header">Basketball-Belastung pro Woche</div><div class="card viz">${wochenDiagramm(h,
      (e) => (e.bbMinuten != null && e.bbAnstrengung != null ? e.bbMinuten * e.bbAnstrengung : 0),
      { selKey: 'bbSel', action: 'bb-sel', label: (n) => `Belastung ${n}`, minMax: 100 })}</div>
      <div class="section-footer">${esc(r.basketball.text)}</div></div>`;
  }
  html += visapAbschnitt(r);

  const liste = abgeschlossene(S.einheiten).reverse();
  html += `<div class="section"><div class="section-header">Alle Einheiten</div><div class="list">`;
  if (!liste.length) html += `<div class="cell-block muted">Noch keine Einheiten.</div>`;
  for (const e of liste) {
    const n = e.uebungen.filter((u) => u.erledigt || u.saetze?.some((s) => s.erledigt)).length;
    html += `<button class="cell" data-action="einheit-details" data-id="${esc(e.id)}"><div class="grow"><div class="headline">${deDatum(e.datum)} · Stufe ${e.stufe}</div>
      <div class="footnote">${(e.teile || []).join(' + ')} · ${n} Übungen · Schmerz danach ${e.schmerzDanach ?? '–'}</div></div>${icon.chev}</button>`;
  }
  return html + `</div></div>`;
}

function morgenTabelle(st, r) {
  if (!st.verlauf.length) return `<div class="cell-block muted">Noch keine Werte.</div>`;
  return `<table class="tbl"><thead><tr><th>Datum</th><th>Test</th><th>Ampel</th><th>Stufe</th></tr></thead><tbody>
    ${[...st.verlauf].reverse().map((v) => `<tr><td>${deDatum(v.datum)}</td><td>${v.wert}</td><td>${r.ampel.stufen[v.ampel].symbol} ${r.ampel.stufen[v.ampel].titel}</td><td>${v.stufe}</td></tr>`).join('')}</tbody></table>`;
}

export const actions = {
  bereich: (el) => { ui.bereich = Number(el.dataset.tage); ui.sel = null; ui.lastSel = null; },
  tabelle: () => { ui.tabelle = !ui.tabelle; },
  'chart-sel': (el) => { ui.sel = ui.sel === el.dataset.datum ? null : el.dataset.datum; },
  'last-sel': (el) => { ui.lastSel = ui.lastSel === el.dataset.datum ? null : el.dataset.datum; },
  'woche-sel': (el) => { ui.wSel = ui.wSel === el.dataset.start ? null : el.dataset.start; },
  'bb-sel': (el) => { ui.bbSel = ui.bbSel === el.dataset.start ? null : el.dataset.start; },
  'einheit-details': (el) => openSheet('Einheit', () => einheitSheet(el.dataset.id)),
  'einheit-loeschen': async (el) => {
    if (!confirm('Diese Einheit endgültig löschen? Das kann nicht rückgängig gemacht werden.')) return;
    await loeschen('einheiten', el.dataset.id);
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
    await speichern('visap', { id: visapEntwurf.id || uid(), datum: visapEntwurf.datum, score, notiz: visapEntwurf.notiz.trim() });
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
  'last-uebung': (el) => { ui.uebung = el.value; ui.lastSel = null; return true; },
  'visap-datum': (el) => { visapEntwurf.datum = el.value; return false; },
  'visap-score': (el) => { visapEntwurf.score = el.value; return false; },
  'visap-notiz': (el) => { visapEntwurf.notiz = el.value; return false; },
};
