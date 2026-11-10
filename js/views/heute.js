// Tab "Heute": Hinweise, Morgenwert, Tagesplan und der Ablauf einer Trainingseinheit.
import { S, setKV, speichern, loeschen, aktuellePhase, aktiveEinheit, planWerte, dosisText, heutigerPlan } from '../store.js';
import {
  ampel, einheitRot, maxSchmerzWaehrend, reduktionAktiv, faelligePruefung, pauseStatus,
  phasenwechselStatus, exzProgression, plyoEinheitenWoche, plyoErlaubt, istTrainingstag, letzteAbgeschlossene,
} from '../regeln.js';
import { segmentStatus, audioFreischalten, signal, bildschirmWach } from '../timer.js';
import { esc, isoDatum, deDatum, addTage, wochentag, uid, mmss, parseZahl } from '../util.js';
import { icon, statusChip, ampelChip, schmerzSkala, ytButton, banner, toast } from '../ui.js';
import { oeffneUebung } from './uebungen.js';
import { oeffneStufen } from './einstellungen.js';
import { visapFaellig, oeffneVisap } from './verlauf.js';
import { faellig } from '../regeln.js';

const R = () => S.daten.regeln;
const heute = () => isoDatum();
const draft = { morgen: { schmerz: null, alltag: null, notiz: '' } };

// ---------------------------------------------------------------- Ansicht
export function render() {
  const e = aktiveEinheit();
  return e ? renderEinheit(e) : renderUebersicht();
}

function renderUebersicht() {
  const r = R();
  const phase = aktuellePhase();
  const h = heute();
  let html = `<h1 class="large-title">Heute</h1>
    <p class="subtitle">${esc(wochentag(h))}, ${deDatum(h)} · Stufe ${phase.nr} – ${esc(phase.name)}</p>`;

  html += hinweise();
  html += morgenKarte();

  const plan = heutigerPlan();
  const trainingstag = istTrainingstag(S.kv.wochenplan, h);
  if (!trainingstag) {
    html += banner('info', 'i', 'Laut deinem Wochenplan ist heute Ruhetag.', 'Du kannst trotzdem eine Einheit starten.');
  }

  html += `<div class="section"><div class="section-header">Dein Plan · ${esc(phase.frequenz.text)} ${statusChip(phase.frequenz.status)}</div><div class="list">`;
  for (const id of plan.haupt) html += planZeile(id);
  if (!plan.haupt.length) html += `<div class="cell-block muted">Für diese Stufe sind keine Übungen hinterlegt.</div>`;
  html += `</div></div>`;
  if (plan.begleitend.length) {
    html += `<div class="section"><div class="section-header">Begleitend</div><div class="list">`;
    for (const id of plan.begleitend) html += planZeile(id);
    html += `</div></div>`;
  }

  html += `<button class="btn filled lg" data-action="einheit-start">${icon.play}Einheit starten</button>`;

  const heuteFertig = S.einheiten.filter((x) => x.abgeschlossen && x.datumISO === h).sort((a, b) => (a.startISO < b.startISO ? -1 : 1));
  html += `<div class="section mt16"><div class="section-header">Heute erledigt</div><div class="list">`;
  if (!heuteFertig.length) html += `<div class="cell-block muted">Noch keine Einheit.</div>`;
  heuteFertig.forEach((x, i) => { html += einheitZeile(x, i + 1); });
  html += `</div></div>`;
  return html;
}

function planZeile(id) {
  const u = S.ueb[id];
  if (!u) return '';
  return `<button class="cell" data-action="uebung-info" data-id="${esc(id)}">
    <div class="grow"><div class="headline">${esc(u.name)} ${statusChip(u.status)}</div><div class="footnote">${dosisText(id)}</div></div>${icon.chev}
  </button>`;
}

function einheitZeile(x, nr) {
  const max = maxSchmerzWaehrend(x);
  const zeit = new Date(x.startISO).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `<div class="cell-block">
    <div class="headline">Einheit ${nr} · ${zeit} Uhr</div>
    <div class="footnote">Vorher ${x.schmerzVor ?? '–'}/10 · Nachher ${x.schmerzNach ?? '–'}/10${x.beschwerdefrei === true ? ' · beschwerdefrei' : ''}</div>
    ${max !== null ? `<div class="mt8">Stärkster Schmerz während: ${ampelChip(max, R())}</div>` : ''}
  </div>`;
}

// ---------------------------------------------------------------- Hinweise / Regeln
function hinweise() {
  const r = R();
  const h = heute();
  let html = '';

  const pause = pauseStatus({ ereignisse: S.ereignisse, morgen: S.morgen, quittiertISO: S.kv.pauseQuittiertISO });
  if (pause.aktiv) {
    const text = pause.grund === 'alltagsschmerz' ? r.alltagsschmerz.ja_text : r.reduktion.keine_besserung_text;
    html += banner('rot', '✕', 'Programm pausieren – Arzt kontaktieren', esc(text) + ' ' + esc(r.hinweise.keine_diagnose),
      `<button class="btn small" data-action="tab" data-tab="warnzeichen">Warnzeichen ansehen</button>
       <button class="btn small" data-action="pause-quittieren">Mit Arzt besprochen</button>`);
  }

  const pruef = faelligePruefung(S.ereignisse, h, r);
  if (pruef) {
    html += banner('gelb', '?', r.reduktion.pruefung_frage, `Schmerz ${esc(pruef.wert)}/10 am ${deDatum(pruef.datumISO)}.`,
      `<button class="btn small" data-action="pruefung" data-antwort="besser">Ja, besser</button>
       <button class="btn small danger" data-action="pruefung" data-antwort="nicht_besser">Nein</button>`);
  }

  const red = reduktionAktiv(S.einheiten, r);
  if (red) {
    html += banner('gelb', '!', `Letzte Einheit: Schmerz ${red.wert}/10 – heute Belastung reduzieren`, esc(r.reduktion.optionen_text));
  }

  // Progression Exzentrik
  const letzteExz = letzteAbgeschlossene(S.einheiten, (e) => e.uebungen.some((u) => u.uebungId === r.progression_exzentrik.uebung));
  const prog = exzProgression(letzteExz, S.kv.exzStufe, r);
  if (prog && S.kv.progressionGesehen !== letzteExz.id) {
    if (prog.typ === 'steigern') {
      html += banner('gruen', '↑', `Exzentrik: ${prog.von.saetze}×${prog.von.wiederholungen} beschwerdefrei`,
        esc(r.progression_exzentrik.steigerung_text),
        `<button class="btn small green filled" data-action="progression" data-wert="steigern">Auf ${prog.nach.saetze}×${prog.nach.wiederholungen} erhöhen</button>
         <button class="btn small" data-action="progression" data-wert="nein">Noch nicht</button>`);
    } else if (!S.kv.zusatzlastFrei) {
      html += banner('gruen', '↑', 'Zusatzlast möglich', esc(r.zusatzlast.text),
        `<button class="btn small green filled" data-action="progression" data-wert="zusatzlast">Zusatzlast-Feld einschalten</button>
         <button class="btn small" data-action="progression" data-wert="nein">Noch nicht</button>`);
    }
  }

  // Phasenwechsel-Hinweis (nur wenn das automatische Schmerzkriterium erfüllt ist)
  const st = phasenwechselStatus(S.kv.phase, S.einheiten, S.kv.kriterien, S.daten.phasen, r);
  const letztePh = letzteAbgeschlossene(S.einheiten, (e) => e.phase === S.kv.phase);
  if (st && st.schmerzOk === true && letztePh && S.kv.phasenHinweisGesehen !== letztePh.id) {
    html += banner('gruen', '✓', `Schmerzkriterium erreicht: ${st.letzterWert}/10 (höchstens ${st.regel.schmerz_max})`,
      esc(st.regel.text),
      `<button class="btn small" data-action="stufen-oeffnen">Checkliste ansehen</button>
       <button class="btn small" data-action="phasenhinweis-aus">Ausblenden</button>`);
  }

  // Erinnerungen: Sicherung (CSV) und VISA-P
  const hatDaten = S.einheiten.some((e) => e.abgeschlossen);
  if (hatDaten && faellig(S.kv.letzterExportISO, h, r.backup.erinnerung_tage) && S.kv.backupSpaeter !== h) {
    html += banner('info', '⇪', r.backup.text,
      S.kv.letzterExportISO ? `Letzter Export: ${deDatum(S.kv.letzterExportISO.slice(0, 10))}.` : 'Du hast noch nie exportiert.',
      `<button class="btn small" data-action="export">Jetzt exportieren</button>
       <button class="btn small" data-action="backup-spaeter">Später</button>`);
  }
  if (visapFaellig() && S.kv.visapSpaeter !== h) {
    const letzter = [...S.visap].sort((a, b) => (a.datumISO < b.datumISO ? -1 : 1)).pop();
    html += banner('info', 'V', letzter ? 'Zeit für einen neuen VISA-P-Wert' : 'VISA-P-Ausgangswert eintragen',
      letzter ? `Letzter Wert ${letzter.score} am ${deDatum(letzter.datumISO)}.` : `Erinnerung alle ${r.visap.erinnerung_tage} Tage.`,
      `<button class="btn small" data-action="visap-neu-heute">Eintragen</button>
       <button class="btn small" data-action="visap-spaeter">Später</button>`);
  }

  if (!S.standalone && !S.kv.homeHinweisAus) {
    html += banner('info', 'i', 'Tipp: Zum Home-Bildschirm hinzufügen',
      'Dann läuft die App im Vollbild und Safari löscht deine Daten nicht so leicht.',
      `<button class="btn small" data-action="home-anleitung">So geht's</button>
       <button class="btn small" data-action="home-aus">Ausblenden</button>`);
  }
  return html;
}

// ---------------------------------------------------------------- Morgenwert
function morgenKarte() {
  const h = heute();
  const gestern = addTage(h, -1);
  const hatteGestern = S.einheiten.some((e) => e.abgeschlossen && e.datumISO === gestern);
  const eintrag = S.morgen.find((m) => m.datumISO === h);
  if (!hatteGestern || eintrag || S.kv.morgenUebersprungen === h) return '';
  const r = R();
  const d = draft.morgen;
  return `<div class="card">
    <div class="title3">Guten Morgen – wie geht's dem Knie?</div>
    <div class="footnote mt8">Schmerz heute Morgen (nach der Einheit von gestern). ${esc(r.folgetag_schmerz.text)}</div>
    ${schmerzSkala('morgen-schmerz', d.schmerz, r, { mitAmpel: false })}
    <div class="label-small mt16">${esc(r.alltagsschmerz.frage)}</div>
    <div class="seg mt8">
      <button data-action="morgen-alltag" data-wert="nein" aria-pressed="${d.alltag === false}">Nein</button>
      <button data-action="morgen-alltag" data-wert="ja" aria-pressed="${d.alltag === true}">Ja</button>
    </div>
    <div class="label-small mt16">Notiz (optional)</div>
    <textarea class="mt8" data-input="morgen-notiz" placeholder="z. B. Treppe ok, leichtes Ziehen">${esc(d.notiz)}</textarea>
    <div class="row mt12">
      <button class="btn" data-action="morgen-skip">Heute nicht</button>
      <button class="btn filled" data-action="morgen-speichern" ${d.schmerz === null || d.alltag === null ? 'disabled' : ''}>Speichern</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- Einheit
function schritte(e) {
  const order = ['vor', 'training', 'nach'];
  const i = order.indexOf(e.schritt);
  return `<div class="steps" aria-label="Schritt ${i + 1} von 3">${order.map((_, k) => `<span class="${k <= i ? 'on' : ''}"></span>`).join('')}</div>`;
}

function renderEinheit(e) {
  const r = R();
  const titel = { vor: 'Vor dem Training', training: 'Training', nach: 'Nach dem Training' }[e.schritt];
  let html = `<h1 class="large-title">${titel}</h1><p class="subtitle">Stufe ${aktuellePhase().nr} · gestartet ${new Date(e.startISO).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</p>${schritte(e)}`;

  if (e.schritt === 'vor') {
    const red = reduktionAktiv(S.einheiten, r);
    if (red) html += banner('gelb', '!', `Heute Belastung reduzieren (letzte Einheit ${red.wert}/10)`, esc(r.reduktion.optionen_text));
    html += `<div class="card"><div class="title3">Schmerz jetzt</div><div class="footnote mt8">Vor dem Training, 0–10.</div>
      ${schmerzSkala('vor-schmerz', e.schmerzVor, r, { mitAmpel: false })}</div>`;
    const hatPlyo = e.uebungen.some((u) => S.ueb[u.uebungId]?.plyometrie);
    if (hatPlyo) {
      html += `<div class="card"><div class="title3">${esc(r.muskelkater.frage)}</div>
        <div class="seg mt12">
          <button data-action="muskelkater" data-wert="nein" aria-pressed="${e.muskelkater === false}">Nein</button>
          <button data-action="muskelkater" data-wert="ja" aria-pressed="${e.muskelkater === true}">Ja</button>
        </div>
        ${e.muskelkater ? `<div class="mt12">${banner('gelb', '!', r.muskelkater.ja_text, '')}</div>` : ''}</div>`;
    }
    const ok = e.schmerzVor !== null && (!hatPlyo || e.muskelkater !== null);
    html += `<button class="btn filled lg" data-action="schritt" data-wert="training" ${ok ? '' : 'disabled'}>Weiter zum Training</button>`;
  } else if (e.schritt === 'training') {
    e.uebungen.forEach((u, i) => { html += uebungKarte(e, u, i); });
    html += `<button class="btn filled lg" data-action="schritt" data-wert="nach">Training beenden</button>`;
  } else {
    const max = maxSchmerzWaehrend(e);
    if (max !== null) html += `<div class="card"><div class="headline">Stärkster Schmerz während der Übungen</div><div class="mt8">${ampelChip(max, r, true)}</div></div>`;
    html += `<div class="card"><div class="title3">Schmerz jetzt</div><div class="footnote mt8">Direkt nach dem Training. ${esc(r.nach_training.text)}</div>
      ${schmerzSkala('nach-schmerz', e.schmerzNach, r, { mitAmpel: false })}</div>`;
    html += `<div class="card"><div class="title3">War die Einheit beschwerdefrei?</div>
      <div class="footnote mt8">Grundlage für die Steigerung (z. B. 1×15 → 2×15). Ehrlich bleiben ;-)</div>
      <div class="seg mt12">
        <button data-action="beschwerdefrei" data-wert="nein" aria-pressed="${e.beschwerdefrei === false}">Nein</button>
        <button data-action="beschwerdefrei" data-wert="ja" aria-pressed="${e.beschwerdefrei === true}">Ja</button>
      </div></div>`;
    html += `<div class="card"><div class="title3">Notiz (optional)</div><textarea class="mt12" data-input="einheit-notiz" placeholder="z. B. Brett 25°, rechtes Bein">${esc(e.notiz || '')}</textarea></div>`;
    const ok = e.schmerzNach !== null && e.beschwerdefrei !== null;
    html += `<div class="row"><button class="btn" data-action="schritt" data-wert="training">Zurück</button>
      <button class="btn filled" data-action="einheit-speichern" ${ok ? '' : 'disabled'}>Einheit speichern</button></div>`;
  }
  html += `<div class="center mt16"><button class="link-btn" style="color:var(--red)" data-action="einheit-verwerfen">Einheit verwerfen</button></div>`;
  return html;
}

function uebungKarte(e, u, i) {
  const r = R();
  const def = S.ueb[u.uebungId];
  const a = ampel(u.schmerzWaehrend, r);
  const ausgelassen = u.ausgelassen && u.ausgelassen !== 'manuell_ein';
  const fertig = u.erledigt || u.abgebrochen || ausgelassen;
  let html = `<div class="ex ${fertig ? 'done' : ''}">
    <div class="ex-head">
      <div class="grow">
        <div class="ex-name">${esc(def.name)} ${statusChip(def.status)}</div>
        <div class="ex-dose">${u.dosis}</div>
      </div>
      <button class="check" aria-label="Übung erledigt" aria-pressed="${!!u.erledigt}" data-action="ueb-erledigt" data-i="${i}">${icon.check}</button>
    </div>`;

  if (ausgelassen) {
    html += `<div class="mt12">${banner('gelb', '!', u.ausgelassen === 'muskelkater' ? 'Heute ausgelassen (Muskelkater/Ermüdung)' : `Ausgelassen: ${esc(r.plyometrie.text)}`, esc(u.ausgelassen === 'muskelkater' ? r.muskelkater.ja_text : ''))}</div>
      <button class="btn small mt8" data-action="ueb-trotzdem" data-i="${i}">Trotzdem einblenden</button></div>`;
    return html;
  }
  if (u.abgebrochen) {
    html += `<div class="mt12">${banner('rot', '✕', 'Übung abgebrochen', esc(r.ampel.stufen.rot.text))}</div>
      <button class="btn small mt8" data-action="ueb-fortsetzen" data-i="${i}">Doch fortsetzen</button></div>`;
    return html;
  }

  // Sätze
  if (def.typ !== 'frei') {
    const geplant = u.saetzeGeplant;
    const n = Math.max(geplant || 0, u.saetzeErledigt);
    html += `<div class="sets" aria-label="${u.saetzeErledigt} von ${geplant ?? 'offen'} Sätzen">`;
    for (let k = 0; k < n; k++) html += `<span class="set-dot ${k < u.saetzeErledigt ? 'on' : ''}">${k + 1}</span>`;
    if (!geplant) html += `<span class="footnote" style="align-self:center">Satzzahl OFFEN – zählt frei</span>`;
    html += `</div>`;

    const t = e.timer && e.timer.i === i ? e.timer : null;
    if (t) {
      const st = segmentStatus(t, Date.now());
      html += `<div class="timer"><div class="phase ${st.phase}" data-timer-phase>${st.phase === 'halten' ? 'Halten' : 'Pause'}</div>
        <div class="zeit" data-timer-zeit>${mmss(st.rest)}</div>
        <button class="btn small danger mt8" data-action="timer-stopp">${icon.stop}Stopp</button></div>`;
    } else if (!u.erledigt) {
      if (def.typ === 'halten' && u.halteS) {
        html += `<button class="btn filled block mt8" data-action="satz-start" data-i="${i}">${icon.play}Satz ${u.saetzeErledigt + 1} starten · ${u.halteS} s halten</button>`;
      } else {
        html += `<button class="btn filled block mt8" data-action="satz-erledigt" data-i="${i}">${icon.check}Satz ${u.saetzeErledigt + 1} erledigt${u.wdh ? ` (${u.wdh} Wdh.)` : ''}</button>`;
      }
      if (u.saetzeErledigt > 0) html += `<button class="link-btn" data-action="satz-minus" data-i="${i}">Letzten Satz zurücknehmen</button>`;
    }
    if (u.uebungId === r.progression_exzentrik.uebung && S.kv.zusatzlastFrei) {
      html += `<div class="cell" style="padding:8px 0"><div class="grow">Zusatzlast (kg)</div>
        <input class="num-input" inputmode="decimal" data-input="ueb-zusatzlast" data-i="${i}" value="${u.zusatzlastKg != null ? String(u.zusatzlastKg).replace('.', ',') : ''}" placeholder="0"></div>`;
    }
  }

  // Schmerz während + Ampel
  html += `<div class="divider"></div><div class="label-small">Stärkster Schmerz während der Übung</div>
    ${schmerzSkala('ueb-schmerz', u.schmerzWaehrend, r, { extra: `data-i="${i}"` })}`;
  if (a) {
    html += `<div class="mt12">${ampelChip(u.schmerzWaehrend, r, true)}</div>`;
    if (a === 'rot') html += `<button class="btn danger filled block mt12" data-action="ueb-abbrechen" data-i="${i}">${icon.stop}Übung abbrechen</button>`;
  }
  html += ytButton(def, r, S.online);
  html += `</div>`;
  return html;
}

// ---------------------------------------------------------------- Timer-Takt
export function tick() {
  const e = aktiveEinheit();
  if (!e || !e.timer) return false;
  const t = e.timer;
  const st = segmentStatus(t, Date.now());
  const u = e.uebungen[t.i];
  let neuZeichnen = false;
  if (st.halteFertig && !t.gezaehlt) {
    t.gezaehlt = true;
    u.saetzeErledigt += 1;
    if (u.saetzeGeplant && u.saetzeErledigt >= u.saetzeGeplant) u.erledigt = true;
    signal(st.phase === 'fertig' ? 3 : 2);
    neuZeichnen = true;
  }
  if (st.phase === 'fertig') {
    if (t.halteS === 0) signal(3); // Ende einer reinen Pause
    e.timer = null;
    bildschirmWach(false);
    neuZeichnen = true;
  }
  if (neuZeichnen) { speichern('einheiten', e); return true; }
  const z = document.querySelector('[data-timer-zeit]');
  const p = document.querySelector('[data-timer-phase]');
  if (z) z.textContent = mmss(st.rest);
  if (p) {
    p.textContent = st.phase === 'halten' ? 'Halten' : 'Pause';
    p.className = `phase ${st.phase}`;
  }
  return false;
}

// ---------------------------------------------------------------- Aktionen
function neueEinheit() {
  const plan = heutigerPlan();
  const ids = [...plan.haupt, ...plan.begleitend];
  return {
    id: uid(),
    datumISO: heute(),
    startISO: new Date().toISOString(),
    phase: S.kv.phase,
    varianten: { ...S.kv.varianten },
    schritt: 'vor',
    abgeschlossen: false,
    schmerzVor: null,
    schmerzNach: null,
    beschwerdefrei: null,
    muskelkater: null,
    notiz: '',
    timer: null,
    uebungen: ids.map((id) => {
      const w = planWerte(id);
      return {
        uebungId: id,
        name: w.u.name,
        dosis: dosisText(id),
        saetzeGeplant: w.u.typ === 'frei' ? null : w.saetze,
        wdh: w.wdh,
        halteS: w.halteS,
        pauseS: w.pauseS,
        zusatzlastKg: w.zusatzlastKg,
        saetzeErledigt: 0,
        schmerzWaehrend: null,
        erledigt: false,
        abgebrochen: false,
        ausgelassen: null,
      };
    }),
  };
}

const aktiv = () => aktiveEinheit();
const save = (e) => speichern('einheiten', e);

export const actions = {
  'einheit-start': async () => {
    if (aktiv()) return;
    await save(neueEinheit());
    window.scrollTo(0, 0);
  },
  'uebung-info': (el) => oeffneUebung(el.dataset.id),
  'stufen-oeffnen': () => oeffneStufen(),
  'vor-schmerz': async (el) => { const e = aktiv(); e.schmerzVor = Number(el.dataset.wert); await save(e); },
  'nach-schmerz': async (el) => { const e = aktiv(); e.schmerzNach = Number(el.dataset.wert); await save(e); },
  muskelkater: async (el) => { const e = aktiv(); e.muskelkater = el.dataset.wert === 'ja'; await save(e); },
  beschwerdefrei: async (el) => { const e = aktiv(); e.beschwerdefrei = el.dataset.wert === 'ja'; await save(e); },
  schritt: async (el) => {
    const e = aktiv();
    if (el.dataset.wert === 'training' && e.schritt === 'vor') {
      // Plyometrie-Regeln anwenden
      const r = R();
      const proWoche = plyoEinheitenWoche(S.einheiten, heute(), S.ueb);
      for (const u of e.uebungen) {
        if (!S.ueb[u.uebungId]?.plyometrie || u.ausgelassen === 'manuell_ein') continue;
        if (e.muskelkater) u.ausgelassen = 'muskelkater';
        else if (!plyoErlaubt(proWoche, r)) u.ausgelassen = 'limit';
        else u.ausgelassen = null;
      }
    }
    if (el.dataset.wert === 'nach' && e.timer) { e.timer = null; bildschirmWach(false); }
    e.schritt = el.dataset.wert;
    await save(e);
    window.scrollTo(0, 0);
  },
  'ueb-schmerz': async (el) => {
    const e = aktiv(); const u = e.uebungen[+el.dataset.i];
    u.schmerzWaehrend = Number(el.dataset.wert);
    await save(e);
  },
  'ueb-abbrechen': async (el) => {
    const e = aktiv(); const i = +el.dataset.i;
    e.uebungen[i].abgebrochen = true;
    if (e.timer?.i === i) { e.timer = null; bildschirmWach(false); }
    await save(e);
    toast('Übung abgebrochen. Nächste Einheit Belastung reduzieren.');
  },
  'ueb-fortsetzen': async (el) => { const e = aktiv(); e.uebungen[+el.dataset.i].abgebrochen = false; await save(e); },
  'ueb-trotzdem': async (el) => {
    if (!confirm('Die Regel empfiehlt, diese Übung heute auszulassen. Trotzdem einblenden?')) return;
    const e = aktiv(); e.uebungen[+el.dataset.i].ausgelassen = 'manuell_ein'; await save(e);
  },
  'ueb-erledigt': async (el) => {
    const e = aktiv(); const u = e.uebungen[+el.dataset.i];
    u.erledigt = !u.erledigt;
    if (u.ausgelassen === 'manuell_ein') u.ausgelassen = null;
    await save(e);
  },
  'satz-start': async (el) => {
    const e = aktiv(); const i = +el.dataset.i; const u = e.uebungen[i];
    audioFreischalten();
    bildschirmWach(true);
    const letzter = u.saetzeGeplant ? u.saetzeErledigt + 1 >= u.saetzeGeplant : false;
    e.timer = { i, startMs: Date.now(), halteS: u.halteS, pauseS: u.pauseS || 0, ohnePause: letzter, gezaehlt: false };
    await save(e);
  },
  'satz-erledigt': async (el) => {
    const e = aktiv(); const i = +el.dataset.i; const u = e.uebungen[i];
    u.saetzeErledigt += 1;
    const fertig = u.saetzeGeplant && u.saetzeErledigt >= u.saetzeGeplant;
    if (fertig) u.erledigt = true;
    if (!fertig && u.pauseS) {
      audioFreischalten();
      bildschirmWach(true);
      e.timer = { i, startMs: Date.now(), halteS: 0, pauseS: u.pauseS, ohnePause: false, gezaehlt: true };
    }
    await save(e);
  },
  'satz-minus': async (el) => {
    const e = aktiv(); const u = e.uebungen[+el.dataset.i];
    u.saetzeErledigt = Math.max(0, u.saetzeErledigt - 1);
    u.erledigt = false;
    await save(e);
  },
  'timer-stopp': async () => { const e = aktiv(); e.timer = null; bildschirmWach(false); await save(e); },
  'einheit-speichern': async () => {
    const e = aktiv(); const r = R();
    e.abgeschlossen = true;
    e.timer = null;
    e.endeISO = new Date().toISOString();
    delete e.schritt;
    await save(e);
    bildschirmWach(false);
    if (einheitRot(e, r)) {
      await speichern('ereignisse', { id: uid(), typ: 'rot', datumISO: e.datumISO, einheitId: e.id, wert: maxSchmerzWaehrend(e), antwort: null, antwortISO: null });
      toast('Gespeichert. Schmerz über 5: nächste Einheit Belastung reduzieren.');
    } else {
      toast('Einheit gespeichert.');
    }
    window.scrollTo(0, 0);
  },
  'einheit-verwerfen': async () => {
    if (!confirm('Diese Einheit wirklich verwerfen? Die Eingaben dieser Einheit gehen verloren.')) return;
    const e = aktiv();
    bildschirmWach(false);
    await loeschen('einheiten', e.id);
  },
  'morgen-schmerz': (el) => { draft.morgen.schmerz = Number(el.dataset.wert); },
  'morgen-alltag': (el) => { draft.morgen.alltag = el.dataset.wert === 'ja'; },
  'morgen-skip': async () => { await setKV('morgenUebersprungen', heute()); },
  'morgen-speichern': async () => {
    const d = draft.morgen;
    const h = heute();
    await speichern('morgen', {
      datumISO: h, bezugDatumISO: addTage(h, -1), schmerz: d.schmerz, alltagsschmerzZunahme: d.alltag,
      notiz: d.notiz.trim(), erfasstISO: new Date().toISOString(),
    });
    draft.morgen = { schmerz: null, alltag: null, notiz: '' };
    toast('Morgenwert gespeichert.');
  },
  pruefung: async (el) => {
    const antwort = el.dataset.antwort;
    const jetzt = new Date().toISOString();
    const h = heute();
    for (const ev of S.ereignisse.filter((x) => x.typ === 'rot' && !x.antwort && x.datumISO <= h)) {
      await speichern('ereignisse', { ...ev, antwort, antwortISO: jetzt });
    }
    if (antwort === 'besser') toast('Gut. Weiter mit Physio abgestimmt trainieren.');
  },
  'pause-quittieren': async () => {
    if (!confirm('Hast du die Beschwerden mit deinem Arzt besprochen? Der Hinweis wird dann ausgeblendet, bis ein neuer Auslöser auftritt.')) return;
    await setKV('pauseQuittiertISO', new Date().toISOString());
  },
  progression: async (el) => {
    const r = R();
    const letzteExz = letzteAbgeschlossene(S.einheiten, (e) => e.uebungen.some((u) => u.uebungId === r.progression_exzentrik.uebung));
    if (el.dataset.wert === 'steigern') {
      const prog = exzProgression(letzteExz, S.kv.exzStufe, r);
      if (prog?.typ === 'steigern') await setKV('exzStufe', prog.naechsterIdx);
      toast('Neue Stufe gespeichert.');
    }
    if (el.dataset.wert === 'zusatzlast') await setKV('zusatzlastFrei', true);
    await setKV('progressionGesehen', letzteExz?.id || null);
  },
  'phasenhinweis-aus': async () => {
    const l = letzteAbgeschlossene(S.einheiten, (e) => e.phase === S.kv.phase);
    await setKV('phasenHinweisGesehen', l?.id || null);
  },
  'home-aus': async () => { await setKV('homeHinweisAus', true); },
  'backup-spaeter': async () => { await setKV('backupSpaeter', heute()); },
  'visap-spaeter': async () => { await setKV('visapSpaeter', heute()); },
  'visap-neu-heute': () => oeffneVisap(),
};

export const inputs = {
  'morgen-notiz': (el) => { draft.morgen.notiz = el.value; return false; },
  'einheit-notiz': (el) => { const e = aktiv(); e.notiz = el.value; save(e); return false; },
  'ueb-zusatzlast': (el) => {
    const e = aktiv(); const kg = parseZahl(el.value);
    e.uebungen[+el.dataset.i].zusatzlastKg = kg;
    save(e);
    setKV('zusatzlastKg', kg); // Vorschlag für die nächste Einheit
    return false;
  },
};
