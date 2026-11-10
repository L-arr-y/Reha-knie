// Tab "Einstellungen": Stufe, Varianten, Progression, Wochenplan, eigene Werte (OFFEN-Felder), Speicher, Daten.
import { S, setKV, aktuellePhase } from '../store.js';
import { db, STORES } from '../db.js';
import { phasenwechselStatus } from '../regeln.js';
import { esc, WOCHENTAGE, parseZahl } from '../util.js';
import { icon, statusChip, openSheet, closeSheet, toast } from '../ui.js';
import { feldName, einheit, eigenText } from './uebungen.js';

const NUM_FELDER = ['saetze', 'wiederholungen', 'haltezeit_s', 'pause_s', 'dauer_min', 'einheiten_pro_woche'];
const TEXT_FELDER = ['tempo', 'last', 'haeufigkeit'];

export function render() {
  const r = S.daten.regeln;
  const phase = aktuellePhase();
  let html = `<h1 class="large-title">Einstellungen</h1>`;

  html += `<div class="section"><div class="list"><div class="cell-block">
    <div class="headline">Wichtiger Hinweis</div><div class="footnote mt8" style="color:var(--label)">${esc(r.hinweise.disclaimer)}</div>
    <div class="footnote mt8">${esc(r.hinweise.keine_diagnose)}</div></div></div></div>`;

  // Stufe
  html += `<div class="section"><div class="section-header">Reha-Stufe</div><div class="list">
    <button class="cell" data-action="stufen-oeffnen"><div class="grow"><div class="headline">Stufe ${phase.nr} – ${esc(phase.name)}</div>
      <div class="footnote">Kriterien für den Wechsel ansehen</div></div>${icon.chev}</button>
  </div><div class="section-footer">Keine feste Dauer: Gewechselt wird nur nach Kriterien und in Absprache mit Physio/Arzt.</div></div>`;

  // Varianten Stufe 2
  const st2 = S.daten.phasen.find((p) => p.id === 'stufe2');
  if (st2?.varianten) {
    html += `<div class="section"><div class="section-header">Stufe 2 – Varianten</div><div class="list">`;
    for (const v of st2.varianten) {
      const an = S.kv.varianten[v.id] ?? v.standard_aktiv;
      html += `<div class="cell"><div class="grow">${esc(v.name)} ${statusChip(v.status)}</div>
        <label class="switch"><input type="checkbox" role="switch" data-input="variante" data-id="${esc(v.id)}" ${an ? 'checked' : ''} aria-label="${esc(v.name)}"><span></span></label></div>`;
    }
    html += `</div><div class="section-footer">Mit Physio festlegen, welche Variante du in Stufe 2 trainierst.</div></div>`;
  }

  // Progression Exzentrik
  const p = r.progression_exzentrik;
  html += `<div class="section"><div class="section-header">Exzentrik – aktuelle Stufe</div><div class="list"><div class="cell-block">
    <div class="seg">${p.stufen.map((s, i) => `<button data-action="exz-stufe" data-wert="${i}" aria-pressed="${(S.kv.exzStufe || 0) === i}">${s.saetze}×${s.wiederholungen}</button>`).join('')}</div></div>
    <div class="cell"><div class="grow">Zusatzlast-Feld anzeigen<div class="footnote">${esc(r.zusatzlast.text)}</div></div>
      <label class="switch"><input type="checkbox" role="switch" data-input="zusatzlast-frei" ${S.kv.zusatzlastFrei ? 'checked' : ''} aria-label="Zusatzlast-Feld"><span></span></label></div>
  </div><div class="section-footer">Steigerung nur, wenn die Einheit beschwerdefrei war. Schrittweite der Zusatzlast: OFFEN.</div></div>`;

  // Wochenplan
  const order = [1, 2, 3, 4, 5, 6, 0];
  html += `<div class="section"><div class="section-header">Wochenplan – Trainingstage ${statusChip(r.wochenstruktur.status)}</div><div class="list"><div class="cell-block">
    <div class="days">${order.map((d) => `<button data-action="tag" data-tag="${d}" aria-pressed="${S.kv.wochenplan.includes(d)}" aria-label="${WOCHENTAGE[d]}">${WOCHENTAGE[d]}</button>`).join('')}</div></div></div>
    <div class="section-footer">${esc(r.wochenstruktur.text)} Blau = Trainingstag.</div></div>`;

  // Eigene Werte
  html += `<div class="section"><div class="section-header">Eigene Werte (OFFEN-Felder)</div><div class="list">`;
  for (const u of S.daten.uebungen) {
    const felder = editierbar(u);
    if (!felder.length) continue;
    const offen = felder.filter((k) => u.dosierung[k].status === 'OFFEN').length;
    const eigen = Object.keys(S.kv.eigeneWerte[u.id] || {}).length;
    html += `<button class="cell" data-action="eigene-werte" data-id="${esc(u.id)}"><div class="grow"><div>${esc(u.name)}</div>
      <div class="footnote">${offen ? `${offen} OFFEN` : 'alles aus Quellen'}${eigen ? ` · ${eigen} eigene` : ''}</div></div>${icon.chev}</button>`;
  }
  html += `</div><div class="section-footer">Hier trägst du Werte ein, die du mit deinem Physio festlegst. Sie gelten nur auf diesem Gerät; die JSON-Datei bleibt unverändert.</div></div>`;

  // Speicher
  html += `<div class="section"><div class="section-header">Speicher</div><div class="list">
    <div class="cell"><div class="grow">Dauerhafter Speicher</div><div class="value">${S.persistiert === true ? '✓ gewährt' : S.persistiert === false ? 'nicht gewährt' : 'unbekannt'}</div></div>
    <div class="cell"><div class="grow">Als App installiert</div><div class="value">${S.standalone ? '✓ ja' : 'nein'}</div></div>
    <button class="cell" data-action="home-anleitung"><div class="grow" style="color:var(--blue)">Zum Home-Bildschirm hinzufügen – Anleitung</div>${icon.chev}</button>
  </div><div class="section-footer">Deine Daten liegen nur auf diesem iPhone. Safari kann Webdaten löschen, wenn eine Seite lange nicht genutzt wird – als Home-Bildschirm-App ist das Risiko deutlich geringer. Exportiere trotzdem regelmäßig.</div></div>`;

  // Daten
  html += `<div class="section"><div class="section-header">Daten</div><div class="list">
    <button class="cell" data-action="export"><div class="grow" style="color:var(--blue)">Daten exportieren (CSV)</div>${icon.chev}</button>
    <button class="cell" data-action="import"><div class="grow" style="color:var(--blue)">Daten importieren (CSV)</div>${icon.chev}</button>
    <button class="cell" data-action="alles-loeschen"><div class="grow" style="color:var(--red)">Alle meine Daten löschen</div></button>
  </div><div class="section-footer">Export: 3 Dateien (Einheiten, Schmerz, VISA-P) für Excel/Numbers. ${S.kv.letzterExportISO ? `Letzter Export: ${new Date(S.kv.letzterExportISO).toLocaleDateString('de-DE')}.` : 'Noch nie exportiert.'} Kein Tracking, keine Analytics, keine externen Dienste. Nichts wird hochgeladen.</div></div>`;
  return html;
}

function editierbar(u) {
  const exz = u.id === S.daten.regeln.progression_exzentrik.uebung;
  return Object.keys(u.dosierung).filter((k) => (NUM_FELDER.includes(k) && !(exz && k === 'saetze')) || TEXT_FELDER.includes(k));
}

// ---------- Sheet: eigene Werte ----------
function eigeneWerteSheet(id) {
  const u = S.ueb[id];
  const eig = S.kv.eigeneWerte[id] || {};
  let html = `<div class="title2">${esc(u.name)}</div><div class="footnote mt8">Leer lassen = Wert aus der JSON-Datei. Mit Physio abstimmen.</div>
    <div class="section mt16"><div class="list">`;
  for (const k of editierbar(u)) {
    const d = u.dosierung[k];
    const num = NUM_FELDER.includes(k);
    const v = eig[k];
    html += `<div class="cell-block">
      <div class="headline">${esc(feldName(k))}${num && einheit(k) ? ` (${einheit(k).trim()})` : ''} ${statusChip(d.status)}</div>
      <div class="footnote">Quelle/JSON: ${esc(d.text)}</div>
      <input class="mt8" ${num ? 'inputmode="decimal"' : 'type="text"'} data-input="eigener-wert" data-id="${esc(id)}" data-feld="${esc(k)}"
        value="${v !== undefined ? esc(eigenText(k, v).replace(einheit(k), '')) : ''}" placeholder="${d.wert != null ? esc(d.wert) : 'OFFEN'}">
    </div>`;
  }
  html += `</div></div><button class="btn block" data-action="eigene-werte-reset" data-id="${esc(id)}">Eigene Werte entfernen</button>`;
  return html;
}

// ---------- Sheet: Stufen ----------
function stufenSheet() {
  const r = S.daten.regeln;
  const phase = aktuellePhase();
  const st = phasenwechselStatus(phase.id, S.einheiten, S.kv.kriterien, S.daten.phasen, r);
  let html = `<div class="title2">Stufe ${phase.nr} – ${esc(phase.name)}</div>
    <div class="footnote mt8">${esc(phase.ziel)}</div>
    <div class="section mt16"><div class="section-header">Orientierung (keine feste Dauer)</div><div class="list"><div class="cell-block">${esc(phase.orientierung_dauer.text)} ${statusChip(phase.orientierung_dauer.status)}</div></div></div>`;

  const krit = st ? st.kriterien : (phase.abschluss?.kriterien || []).map((k) => ({ ...k, erfuellt: !!S.kv.kriterien[k.id] }));
  const ziel = st ? S.daten.phasen.find((p) => p.id === st.nach) : null;
  html += `<div class="section"><div class="section-header">${ziel ? `Kriterien für Stufe ${ziel.nr} – ${esc(ziel.name)}` : 'Kriterien für den Abschluss'}</div><div class="list">`;
  for (const k of krit) {
    let links;
    if (k.status === 'OFFEN') links = `<div class="checkrow-btn"><span class="chip OFFEN">OFFEN</span></div>`;
    else if (k.automatisch === 'schmerz') {
      links = `<div class="checkrow-btn"><span class="check" aria-pressed="${k.erfuellt === true}" style="width:32px;height:32px">${k.erfuellt ? icon.check : ''}</span></div>`;
    } else {
      links = `<button class="checkrow-btn" data-action="kriterium" data-id="${esc(k.id)}" aria-label="Kriterium abhaken"><span class="check" aria-pressed="${!!k.erfuellt}" style="width:32px;height:32px">${icon.check}</span></button>`;
    }
    let zusatz = '';
    if (k.automatisch === 'schmerz') {
      zusatz = `<div class="footnote">${st.letzterWert === null ? 'Noch keine Einheit in dieser Stufe.' : `Letzte Einheit: stärkster Schmerz ${st.letzterWert}/10 – ${k.erfuellt ? '✓ erfüllt' : '✕ noch nicht erfüllt'}`} (automatisch)</div>`;
    }
    html += `<div class="cell-block"><div class="checkrow">${links}<div class="grow" style="padding-top:8px">${esc(k.text)}${zusatz}</div></div></div>`;
  }
  html += `</div>${st ? `<div class="section-footer">${esc(st.regel.text)}</div>` : ''}</div>`;

  if (ziel) {
    html += `<button class="btn filled lg" data-action="stufe-wechseln" data-ziel="${esc(ziel.id)}" ${st.bereit ? '' : 'disabled'}>Zu Stufe ${ziel.nr} wechseln</button>
      ${st.bereit ? '' : `<div class="footnote center mt8">Erst möglich, wenn alle Kriterien erfüllt sind.</div>`}`;
  }

  html += `<div class="section mt16"><div class="section-header">Stufe manuell festlegen</div><div class="list">`;
  for (const p of S.daten.phasen) {
    html += `<button class="cell" data-action="stufe-manuell" data-ziel="${esc(p.id)}"><div class="grow">Stufe ${p.nr} – ${esc(p.name)}</div>${p.id === phase.id ? '<span class="value">✓ aktuell</span>' : ''}</button>`;
  }
  html += `</div><div class="section-footer">Nur nach Rücksprache mit Physio/Arzt, z. B. wenn er dich eine Stufe zurück- oder vorsetzt.</div></div>`;
  return html;
}

export function oeffneStufen() { openSheet('Reha-Stufe', stufenSheet); }

export function oeffneHomeAnleitung() {
  openSheet('Zum Home-Bildschirm', () => `
    <div class="title2">App installieren</div>
    <div class="footnote mt8">So verhält sich die Seite wie eine App: Vollbild, eigenes Symbol, offline nutzbar – und Safari löscht deine Daten nicht so leicht.</div>
    <div class="section mt16"><div class="list">
      <div class="cell-block"><b>1.</b> Seite in <b>Safari</b> öffnen (nicht in einer anderen App).</div>
      <div class="cell-block"><b>2.</b> Unten auf <span style="color:var(--blue);display:inline-flex;vertical-align:middle;width:22px">${icon.share}</span> <b>Teilen</b> tippen (bei manchen iOS-Versionen erst auf „…“).</div>
      <div class="cell-block"><b>3.</b> Nach unten wischen und <b>„Zum Home-Bildschirm“</b> wählen.</div>
      <div class="cell-block"><b>4.</b> „Als Web-App öffnen“ eingeschaltet lassen und <b>Hinzufügen</b> tippen.</div>
      <div class="cell-block"><b>5.</b> Ab jetzt die App immer über das neue Symbol starten.</div>
    </div></div>
    <div class="footnote">Wichtig: Die installierte App hat einen eigenen Speicher. Daten aus dem Safari-Tab werden nicht übernommen – also am besten gleich zu Beginn installieren.</div>`);
}

export const actions = {
  'stufen-oeffnen': () => oeffneStufen(),
  'home-anleitung': () => oeffneHomeAnleitung(),
  'eigene-werte': (el) => openSheet('Eigene Werte', () => eigeneWerteSheet(el.dataset.id)),
  'eigene-werte-reset': async (el) => {
    const ew = { ...S.kv.eigeneWerte };
    delete ew[el.dataset.id];
    await setKV('eigeneWerte', ew);
    toast('Eigene Werte entfernt.');
  },
  kriterium: async (el) => {
    const k = { ...S.kv.kriterien, [el.dataset.id]: !S.kv.kriterien[el.dataset.id] };
    await setKV('kriterien', k);
  },
  'stufe-wechseln': async (el) => {
    const ziel = S.daten.phasen.find((p) => p.id === el.dataset.ziel);
    if (!confirm(`Zu Stufe ${ziel.nr} – ${ziel.name} wechseln? Bitte nur nach Absprache mit Physio/Arzt.`)) return;
    await setKV('phase', ziel.id);
    await setKV('kriterien', {});
    closeSheet();
    toast(`Stufe ${ziel.nr} aktiv.`);
  },
  'stufe-manuell': async (el) => {
    const ziel = S.daten.phasen.find((p) => p.id === el.dataset.ziel);
    if (ziel.id === S.kv.phase) return;
    if (!confirm(`Stufe ${ziel.nr} – ${ziel.name} festlegen? Nur nach Rücksprache mit Physio/Arzt.`)) return;
    await setKV('phase', ziel.id);
    await setKV('kriterien', {});
    toast(`Stufe ${ziel.nr} aktiv.`);
  },
  'exz-stufe': async (el) => { await setKV('exzStufe', Number(el.dataset.wert)); },
  tag: async (el) => {
    const d = Number(el.dataset.tag);
    const plan = S.kv.wochenplan.includes(d) ? S.kv.wochenplan.filter((x) => x !== d) : [...S.kv.wochenplan, d];
    await setKV('wochenplan', plan);
  },
  'alles-loeschen': async () => {
    if (!confirm('Alle deine Einheiten, Schmerzwerte und Einstellungen auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.')) return;
    if (!confirm('Wirklich endgültig löschen? Tipp: vorher exportieren.')) return;
    for (const s of STORES) await db.clear(s);
    location.reload();
  },
};

export const inputs = {
  variante: async (el) => {
    await setKV('varianten', { ...S.kv.varianten, [el.dataset.id]: el.checked });
    return true;
  },
  'zusatzlast-frei': async (el) => { await setKV('zusatzlastFrei', el.checked); return true; },
  'eigener-wert': async (el) => {
    const { id, feld } = el.dataset;
    const ew = { ...S.kv.eigeneWerte, [id]: { ...(S.kv.eigeneWerte[id] || {}) } };
    const raw = el.value.trim();
    if (raw === '') delete ew[id][feld];
    else if (NUM_FELDER.includes(feld)) {
      const n = parseZahl(raw);
      if (n === null || n < 0) return false; // ungültig: nicht speichern
      ew[id][feld] = n;
    } else ew[id][feld] = raw;
    if (!Object.keys(ew[id]).length) delete ew[id];
    await setKV('eigeneWerte', ew);
    return false;
  },
};
