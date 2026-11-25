// Tab "Übersicht": Wo stehe ich? Stufe, grüne Tage, Ampel-Verlauf, Kriterien, Idealplan, HSR-Stand.
import { S, R, setKV, speichern, status, stufeObj, plan } from '../store.js';
import { aufstiegStatus, stufenKriterium, planWoche, prognose, hsrNaechste, letzterEintrag, rtpAuswertung, bbBelastung } from '../regeln.js';
import { esc, isoDatum, deDatum, addTage, uid, zahlDE, WOCHENTAGE, parseIso } from '../util.js';
import { ampelChip, kopf, toast } from '../ui.js';

const GRUND = { start: 'Start', aufstieg: 'Freigeschaltet', rot: 'Zurück wegen Rot', manuell: 'Manuell gesetzt' };

function kriteriumFuer(st) {
  const h = isoDatum();
  const letzterRtp = [...S.rtpchecks].sort((a, b) => (a.datum < b.datum ? -1 : 1)).pop();
  const rtp = rtpAuswertung(letzterRtp, { verlauf: st.verlauf, heute: h, bein: S.kv.bein }, R());
  return stufenKriterium(stufeObj(st.stufe), {
    einheiten: S.einheiten, stufeSeit: st.stufeSeit, bestaetigt: S.kv.bestaetigt, koerpergewicht: S.kv.koerpergewicht, rtp,
  }, R(), S.ueb);
}

export function render() {
  const r = R();
  const h = isoDatum();
  const st = status(h);
  const so = stufeObj(st.stufe);
  const pl = plan();
  const pw = planWoche(pl, h);
  const kr = kriteriumFuer(st);
  const auf = aufstiegStatus(st, kr, r);
  const minG = r.stufenwechsel.minGruenTage;

  let html = kopf('Übersicht', 'Wo stehe ich gerade?');

  // ---------- Stufe
  html += `<div class="card">
    <div class="footnote">Aktuelle Stufe</div>
    <div class="row" style="align-items:flex-end"><div class="stufe-gross">${so.nr <= 4 ? `Stufe ${so.nr}` : esc(so.name)}</div>
      <div style="text-align:right">${ampelChip(st.ampelHeute, r, st.ampelHeute ? 'heute' : '')}${st.ampelHeute ? '' : '<span class="footnote">Morgentest fehlt</span>'}</div></div>
    <div class="title3 mt8">${esc(so.name)}</div>
    <div class="footnote">${esc(so.ziel)}</div>
    <div class="footnote mt8">Seit ${deDatum(st.stufeSeit)} · Tag ${st.tageInStufe} · ${esc(so.rhythmusText)}</div>
    ${so.nr < 5 ? `<div class="label-small mt12">Grüne Tage in Folge: ${st.gruenTageInFolge} von ${minG}</div>
      <div class="fortschritt" role="progressbar" aria-valuemin="0" aria-valuemax="${minG}" aria-valuenow="${Math.min(st.gruenTageInFolge, minG)}"><span style="width:${Math.min(100, (st.gruenTageInFolge / minG) * 100)}%"></span></div>
      <div class="caption mt8">Gelb pausiert den Zähler, Rot setzt ihn auf 0.</div>` : ''}
    ${st.sperreAktiv ? `<div class="hinweis-box">${esc(r.rot.sperreText)} (bis ${deDatum(st.sperreBis)})</div>` : ''}
  </div>`;

  // ---------- Ampel 14 Tage
  const byDate = Object.fromEntries(st.verlauf.map((v) => [v.datum, v]));
  let boxes = '';
  for (let i = 13; i >= 0; i--) {
    const d = addTage(h, -i);
    const v = byDate[d];
    const sym = v ? r.ampel.stufen[v.ampel].symbol : '·';
    boxes += `<div class="tag-box ${v ? v.ampel : ''}" title="${deDatum(d)}${v ? `: ${v.wert}/10` : ': kein Test'}" aria-label="${deDatum(d)} ${v ? `${r.ampel.stufen[v.ampel].titel}, ${v.wert} von 10` : 'kein Morgentest'}">${sym}</div>`;
  }
  html += `<div class="section"><div class="section-header">Ampel der letzten 14 Tage</div><div class="card">
    <div class="tage-leiste">${boxes}</div>
    <div class="tage-labels"><span>${WOCHENTAGE[parseIso(addTage(h, -13)).getDay()]} ${deDatum(addTage(h, -13)).slice(0, 6)}</span><span>heute</span></div>
    <div class="caption mt8">✓ grün · ! gelb · ✕ rot · · kein Morgentest</div></div></div>`;

  // ---------- Nächste Stufe
  if (so.kriterium) {
    const naechste = stufeObj(st.stufe + 1);
    html += `<div class="section"><div class="section-header">Weiter zu ${st.stufe < 4 ? `Stufe ${st.stufe + 1} – ${esc(naechste.name)}` : esc(naechste.name)}</div><div class="card">`;
    for (const p of auf.punkte) {
      html += `<div class="punkt ${p.ok ? 'ok' : ''}"><span class="sym" aria-hidden="true">${p.ok ? '✓' : '·'}</span><div>${esc(p.text)}${p.id === 'kriterium' ? `<div class="footnote">${esc(kr.detail)}</div>` : ''}</div>${p.wert ? `<span class="wert">${esc(p.wert)}</span>` : ''}</div>`;
    }
    html += `<div class="divider"></div>
      <div class="checkrow"><button class="checkrow-btn" data-action="bestaetigen" data-id="${esc(kr.id)}" aria-label="Bestätigen"><span class="check" aria-pressed="${kr.bestaetigt}" style="width:32px;height:32px">✓</span></button>
        <div class="grow" style="padding-top:8px">${esc(kr.bestaetigung)}<div class="footnote">Deine Bestätigung (z. B. nach Rücksprache mit Physio).</div></div></div>
      ${so.kriterium.automatisch === 'beinpresse_150' && !S.kv.koerpergewicht ? `<button class="btn block mt8" data-action="tab" data-tab="mehr">Körpergewicht eintragen</button>` : ''}
      ${so.kriterium.automatisch === 'rtp' ? `<button class="btn block mt8" data-action="tab" data-tab="mehr">Zum Return-to-Play-Check</button>` : ''}
      <button class="btn filled lg mt12" data-action="aufsteigen" ${auf.moeglich ? '' : 'disabled'}>${st.stufe < 4 ? `Stufe ${st.stufe + 1} freischalten` : 'Erhaltung starten (Wettkampf)'}</button>
      <div class="footnote center mt8">${auf.moeglich ? 'Bewusste Entscheidung – am besten mit Physio abgestimmt.' : 'Wird aktiv, wenn alle Punkte erfüllt sind.'}</div>
    </div></div>`;
  }

  // ---------- Idealplan
  const prog = prognose(st, h, r);
  if (!pw.vorPlan) {
    const w = pw.woche;
    const soll = w.sollStufe;
    const vergleich = pw.nachPlan ? 'Der 8-Wochen-Plan ist vorbei.' : st.stufe >= soll ? `✓ Im Plan (Soll: Stufe ${soll})` : `Soll laut Plan: Stufe ${soll} – du bist auf Stufe ${st.stufe}. Das ist normal: die Ampel bestimmt das Tempo.`;
    html += `<div class="section"><div class="section-header">8-Wochen-Idealplan · ${pw.nachPlan ? 'abgeschlossen' : `Woche ${pw.nr} von 8`}</div><div class="card">
      <div class="headline">${esc(vergleich)}</div>
      <div class="list mt12" style="background:var(--fill)">
        <div class="cell-block"><div class="footnote">Sehne</div>${esc(w.sehne)}</div>
        <div class="cell-block"><div class="footnote">Unterkörper</div>${esc(w.unterkoerper)}</div>
        <div class="cell-block"><div class="footnote">Oberkörper</div>${esc(w.oberkoerper)}</div>
        <div class="cell-block"><div class="footnote">Basketball</div>${esc(w.basketball)}</div>
      </div>
      ${prog ? `<div class="mt12"><b>Erstes Spiel – Schätzung:</b> frühestens ${deDatum(prog.fruehestens)}, realistisch ${deDatum(prog.realistisch)}</div>
      <div class="footnote">Rest-Mindestdauer ${prog.restTage} Tage${prog.plusTage ? ` + ${prog.plusTage} Tage (${prog.gelbTage} gelbe Tage, ${prog.rotEpisoden} Rot-Episoden in dieser Stufe)` : ''}. ${esc(r.prognose.text)}</div>` : '<div class="mt12"><b>Erhaltung:</b> Rückkehr geschafft – Spielminuten und Sprungvolumen über 2–3 Wochen steigern.</div>'}
      <div class="footnote mt8">${esc(pl.hinweis)}</div></div></div>`;
  } else {
    html += `<div class="section"><div class="section-header">8-Wochen-Idealplan</div><div class="card">Start am ${deDatum(pl.start)} (in ${pw.tageBisStart} Tagen).</div></div>`;
  }

  // ---------- Basketball-Belastung
  const bl = bbBelastung(S.einheiten, h, r);
  if (bl.diese || bl.letzte) {
    html += `<div class="section"><div class="section-header">Basketball-Belastung (Minuten × Anstrengung)</div><div class="list">
      <div class="cell"><div class="grow">Diese Woche</div><div class="value mono">${bl.diese}</div></div>
      <div class="cell"><div class="grow">Vorwoche</div><div class="value mono">${bl.letzte}</div></div>
      ${bl.max !== null ? `<div class="cell"><div class="grow">Höchstens diese Woche (+${r.basketball.lastSteigerungMaxProzent} %)</div><div class="value mono">${bl.ueber ? '! ' : ''}${bl.max}</div></div>` : ''}
    </div><div class="section-footer">${esc(r.basketball.text)}</div></div>`;
  }

  // ---------- HSR-Stand
  const hsrIds = Object.values(S.ueb).filter((u) => u.hsr).map((u) => u.id);
  const zeilen = hsrIds.map((id) => ({ id, e: letzterEintrag(S.einheiten, id) })).filter((x) => x.e);
  if (zeilen.length) {
    html += `<div class="section"><div class="section-header">HSR-Stand (nächste Einheit)</div><div class="list">`;
    for (const { id, e } of zeilen) {
      const n = hsrNaechste(e, r);
      html += `<div class="cell"><div class="grow">${esc(S.ueb[id].name.replace(' (HSR)', ''))}<div class="footnote">zuletzt ${deDatum(e.datum)}</div></div>
        <div class="value mono">${r.hsr.saetze} × ${n.zielWdh}${n.kg != null ? ` · ${zahlDE(n.kg)} kg` : ''}</div></div>`;
    }
    html += `</div></div>`;
  }

  // ---------- Stufenverlauf
  html += `<div class="section"><div class="section-header">Stufen-Zeitleiste</div><div class="list">`;
  for (const w of [...st.stufenVerlauf].reverse()) {
    html += `<div class="cell"><div class="grow">${w.nach <= 4 ? `Stufe ${w.nach}` : 'Erhaltung'}<div class="footnote">${esc(GRUND[w.grund] || w.grund)}${w.von ? ` (vorher Stufe ${w.von})` : ''}</div></div><div class="value">${deDatum(w.datum)}</div></div>`;
  }
  html += `</div></div>`;
  html += `<div class="footnote center">${esc(r.hinweise.geduld)}</div>`;
  return html;
}

export const actions = {
  bestaetigen: async (el) => {
    await setKV('bestaetigt', { ...S.kv.bestaetigt, [el.dataset.id]: !S.kv.bestaetigt[el.dataset.id] });
  },
  aufsteigen: async () => {
    const st = status();
    const nach = st.stufe + 1;
    if (!confirm(`${nach <= 4 ? `Stufe ${nach}` : 'Erhaltung'} freischalten? Das ist eine bewusste Entscheidung – am besten mit Physio abgestimmt.`)) return;
    await speichern('stufenwechsel', { id: uid(), datum: isoDatum(), nach, grund: 'aufstieg', zeitISO: new Date().toISOString() });
    await setKV('bestaetigt', {});
    toast(`${nach <= 4 ? `Stufe ${nach}` : 'Erhaltung'} freigeschaltet.`);
  },
};
