// Tab "Übungen": Bibliothek nach Bereich, ausgegraut über der aktuellen Stufe, Details + eigene Werte für OFFEN-Felder.
import { S, R, setKV, status, dosierung } from '../store.js';
import { gesperrtDurchStufe } from '../regeln.js';
import { esc, parseZahl, zahlDE } from '../util.js';
import { icon, statusChip, ytButton, openSheet, kopf } from '../ui.js';
import { pauseText } from './heute.js';

const BEREICHE = [
  ['sehne', 'Sehne'], ['unterkoerper', 'Unterkörper'], ['oberkoerper', 'Oberkörper – Kraft'], ['power', 'Oberkörper – Power'],
  ['kontakt', 'Oberkörper – Kontaktkraft'], ['prehab', 'Schulter-Prehab'], ['basketball', 'Basketball'],
];
const FELDER = {
  uebung: 'Konkrete Übung', saetze: 'Sätze', wdh: 'Wiederholungen', haltezeit_s: 'Haltezeit (s)', dauer_s: 'Dauer (s)',
  pause_s: 'Pause (s)', dauer_min: 'Dauer (Min.)', wuerfe: 'Würfe', tempo: 'Tempo', intensitaet: 'Intensität',
};
const TEXT_FELDER = ['uebung'];

export function render() {
  const st = status();
  let html = kopf('Übungen', 'Ausgegraut = erst ab einer höheren Stufe freigeschaltet.');
  for (const [kat, titel] of BEREICHE) {
    const liste = S.daten.uebungen.filter((u) => u.kategorie === kat);
    html += `<div class="section"><div class="section-header">${esc(titel)}</div><div class="list">`;
    for (const u of liste) {
      const gesp = gesperrtDurchStufe(u, st.stufe);
      const meta = [`ab Stufe ${u.minStufe}`, u.abWoche ? `Planwoche ${u.abWoche}${u.bisWoche ? `–${u.bisWoche}` : '+'}` : '', u.mitGewicht ? 'mit kg' : '', u.kniebelastend ? 'kniebelastend' : ''].filter(Boolean).join(' · ');
      html += `<button class="cell ${gesp ? 'gesperrt' : ''}" data-action="uebung-info" data-id="${esc(u.id)}">
        <div class="grow"><div class="headline">${esc(u.name)} ${statusChip(u.status)}</div><div class="footnote">${esc(meta)}</div></div>
        ${gesp ? '<span class="lock">gesperrt</span>' : ''}${icon.chev}</button>`;
    }
    html += `</div></div>`;
  }
  return html;
}

function detail(id) {
  const u = S.ueb[id];
  if (!u) return '<div class="muted">Diese Übung gibt es in der aktuellen Version nicht mehr.</div>';
  const r = R();
  const d = dosierung(id);
  const eigene = S.kv.eigeneWerte?.[id] || {};
  const st = status();
  let html = `<div class="title2">${esc(u.name)}</div>
    <div class="footnote mt8">${statusChip(u.status)} ab Stufe ${u.minStufe}${u.abWoche ? ` · Planwoche ${u.abWoche}` : ''}${u.kniebelastend ? ' · kniebelastend (bei Gelb gekürzt)' : ''}</div>
    ${gesperrtDurchStufe(u, st.stufe) ? `<div class="hinweis-box">Erst ab Stufe ${u.minStufe} freigeschaltet – du bist auf Stufe ${st.stufe}.</div>` : ''}
    ${ytButton(u, r, S.online)}
    <div class="section mt16"><div class="section-header">Dosierung</div><div class="list">`;
  const zeilen = [];
  if (d.saetze != null || d.wdh != null || d.haltezeit_s != null || d.dauer_s != null) {
    const s = `${d.saetze ?? '?'}${d.saetze_max ? `–${d.saetze_max}` : ''}`;
    const w = d.haltezeit_s ? `${d.haltezeit_s} s halten` : d.dauer_s ? `${d.dauer_s}${d.dauer_max_s ? `–${d.dauer_max_s}` : ''} s` : d.wdh != null ? `${d.wdh}${d.wdh_max ? `–${d.wdh_max}` : ''} Wdh.` : '';
    zeilen.push(['Umfang', `${s} × ${w}`]);
  }
  if (d.strecke) zeilen.push(['Strecke', d.strecke]);
  if (d.pause_s != null) zeilen.push(['Pause', pauseText(d.pause_s, d.pause_max_s)]);
  if (u.proWoche) zeilen.push(['Häufigkeit', `${u.proWoche.min === u.proWoche.max ? u.proWoche.min : `${u.proWoche.min}–${u.proWoche.max}`}× pro Woche`]);
  if (u.gelbKuerzen) zeilen.push(['Bei Gelb', `${R().gelb.reduktionProzent} % weniger Sätze bzw. Minuten (abgerundet)`]);
  if (u.nurBelastungstag) zeilen.push(['Wann', 'Ab Stufe 3 nur an Sprung-/Sporttagen']);
  if (u.wechsel) zeilen.push(['Einsatz', 'Wechselübung: ersetzt eine der drei HSR-Standardübungen (im Training „Übung tauschen“)']);
  if (d.tempo) zeilen.push(['Tempo', d.tempo]);
  if (d.intensitaet) zeilen.push(['Intensität', d.intensitaet]);
  if (d.text) zeilen.push(['Hinweis', d.text]);
  if (u.hsr) zeilen.push(['Steigerung', r.hsr.text]);
  if (u.hinweis) zeilen.push(['Tipp', u.hinweis]);
  for (const [k, v] of zeilen) html += `<div class="cell-block"><div class="footnote">${esc(k)}</div>${esc(v)}</div>`;
  if (!zeilen.length) html += `<div class="cell-block muted">Keine Dosierung im Leitfaden.</div>`;
  html += `</div></div>`;

  if (u.offen?.length) {
    html += `<div class="section"><div class="section-header">OFFEN – mit Physio festlegen</div><div class="list">`;
    for (const f of u.offen) {
      const txt = TEXT_FELDER.includes(f);
      html += `<div class="cell"><div class="grow">${esc(FELDER[f] || f)} <span class="chip OFFEN">OFFEN</span></div>
        <input class="num-input" style="width:${txt ? '150px' : '96px'} !important" ${txt ? 'type="text"' : 'inputmode="decimal"'} data-input="eigener-wert" data-id="${esc(id)}" data-feld="${esc(f)}"
          value="${eigene[f] != null ? esc(txt ? eigene[f] : zahlDE(eigene[f], 2)) : ''}" placeholder="eintragen"></div>`;
    }
    html += `</div><div class="section-footer">Deine Werte gelten nur auf diesem iPhone und werden beim Training benutzt. Die JSON-Datei bleibt unverändert.</div></div>`;
  }
  if (u.abgeleitet?.length) html += `<div class="footnote mb8">Abgeleitet (nicht wörtlich im Leitfaden): ${esc(u.abgeleitet.join(', '))} aus dem 8-Wochen-Plan.</div>`;
  html += `<div class="section"><div class="section-header">Quelle</div><div class="list"><div class="cell-block footnote">${esc(u.quelle)}</div></div></div>`;
  return html;
}

export function oeffneUebung(id) { openSheet('Übung', () => detail(id)); }

export const actions = {
  'uebung-info': (el) => oeffneUebung(el.dataset.id),
};

export const inputs = {
  'eigener-wert': async (el) => {
    const { id, feld } = el.dataset;
    const ew = { ...S.kv.eigeneWerte, [id]: { ...(S.kv.eigeneWerte[id] || {}) } };
    const roh = el.value.trim();
    if (roh === '') delete ew[id][feld];
    else if (TEXT_FELDER.includes(feld)) ew[id][feld] = roh;
    else {
      const n = parseZahl(roh);
      if (n === null || n < 0) return false;
      ew[id][feld] = n;
    }
    if (!Object.keys(ew[id]).length) delete ew[id];
    await setKV('eigeneWerte', ew);
    return false;
  },
};

