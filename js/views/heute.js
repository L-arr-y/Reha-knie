// Tab "Heute": Morgentest → Ampel → Vorschlag → Training (Satz-Logger mit kg und Timer).
import { S, R, setKV, speichern, loeschen, status, stufeObj, plan, dosierung, aktiveEinheit } from '../store.js';
import {
  planWoche, tagesvorschlag, uebungenFuer, gesperrtDurchStufe, saetzeHeute, hsrNaechste, letzterEintrag, letzteKg, GRUND_TEXT, bbBelastung,
} from '../regeln.js';
import { segmentStatus, audioFreischalten, signal, bildschirmWach } from '../timer.js';
import { esc, isoDatum, deDatum, wochentag, uid, mmss, parseZahl, zahlDE } from '../util.js';
import { icon, statusChip, ampelChip, schmerzAmpel, schmerzSkala, ytButton, banner, toast, kopf, openSheet, closeSheet } from '../ui.js';
import { oeffneUebung } from './uebungen.js';
import { visapFaellig } from './verlauf.js';
import { faellig } from '../regeln.js';

const heute = () => isoDatum();
const ui = { morgen: { sls: null, steif: null, notiz: '', steifOffen: false }, bearbeiten: false, auswahl: { datum: null, sel: {} }, satzEdit: null };

const TYP_TITEL = { iso: 'Isometrie', hsr: 'Heavy Slow Resistance (HSR)', sprung: 'Sprung-/Energiespeicher-Übungen', sport: 'Basketballspezifisch' };
const TEIL_TITEL = { sehne: 'Sehne', hsrtest: 'HSR-Test', uk: 'Unterkörper', ok: 'Oberkörper', bb: 'Basketball' };
const kgText = (kg) => (kg === null || kg === undefined || kg === '' ? '' : `${zahlDE(kg)} kg`);

// ======================================================================== Ansicht
export function render() {
  const e = aktiveEinheit();
  return e ? renderTraining(e) : renderHeute();
}

function renderHeute() {
  const r = R();
  const h = heute();
  const st = status(h);
  const so = stufeObj(st.stufe);
  const pl = plan();
  const v = tagesvorschlag({ status: st, einheiten: S.einheiten, heute: h, stufen: S.daten.stufen, plan: pl, ueb: S.ueb, letzterOkBlock: letzterOkBlock() }, r);
  const pwInfo = planWoche(pl, h);
  const pwText = pwInfo ? (pwInfo.vorPlan ? 'Plan startet bald' : pwInfo.nachPlan ? 'nach dem 8-Wochen-Plan' : `Woche ${pwInfo.nr} von 8`) : '';
  let html = kopf('Heute', `${esc(wochentag(h))}, ${deDatum(h)} · Stufe ${st.stufe} – ${esc(so.name)}${pwText ? ` · ${pwText}` : ''}`);

  if (st.physioHinweis) {
    html += banner('rot', '✕', 'Physio/Arzt kontaktieren', esc(r.rot.physioText) + ' ' + esc(r.hinweise.keine_diagnose),
      `<button class="btn small" data-action="warn-open">Warnzeichen ansehen</button>`);
  }

  if (!st.morgencheckHeute || ui.bearbeiten) {
    html += morgentestKarte(r);
    html += `<div class="footnote center mb8">Ohne Morgentest gibt es keinen Trainingsvorschlag (Regel 1 im Leitfaden).</div>`;
  } else {
    html += ampelKarte(st, r);
    html += vorschlagKarten(v, st, r);
  }

  // Erinnerungen: Sicherung (CSV) und VISA-P
  const hatDaten = S.morgenchecks.length > 0;
  if (hatDaten && faellig(S.kv.letzterExportISO, h, r.backup.erinnerung_tage) && S.kv.backupSpaeter !== h) {
    html += banner('info', '⇪', r.backup.text, S.kv.letzterExportISO ? `Letzter Export: ${deDatum(S.kv.letzterExportISO.slice(0, 10))}.` : 'Du hast noch nie exportiert.',
      `<button class="btn small" data-action="export">Jetzt exportieren</button><button class="btn small" data-action="backup-spaeter">Später</button>`);
  }
  if (hatDaten && visapFaellig() && S.kv.visapSpaeter !== h) {
    const letzter = [...S.visap].sort((a, b) => (a.datum < b.datum ? -1 : 1)).pop();
    html += banner('info', 'V', letzter ? 'Zeit für einen neuen VISA-P-Wert' : 'VISA-P-Ausgangswert eintragen',
      letzter ? `Letzter Wert ${zahlDE(letzter.score)} am ${deDatum(letzter.datum)}.` : `Erinnerung alle ${r.visap.erinnerung_tage} Tage.`,
      `<button class="btn small" data-action="visap-neu">Eintragen</button><button class="btn small" data-action="visap-spaeter">Später</button>`);
  }

  if (!S.standalone && !S.kv.homeHinweisAus) {
    html += banner('info', 'i', 'Tipp: Zum Home-Bildschirm hinzufügen', 'Dann läuft die App im Vollbild und Safari löscht deine Daten nicht so leicht.',
      `<button class="btn small" data-action="home-anleitung">So geht's</button><button class="btn small" data-action="home-aus">Ausblenden</button>`);
  }

  const fertig = S.einheiten.filter((x) => x.abgeschlossen && x.datum === h);
  if (fertig.length) {
    html += `<div class="section mt16"><div class="section-header">Heute erledigt</div><div class="list">`;
    for (const x of fertig) {
      const n = x.uebungen.filter((u) => u.erledigt || u.saetze.some((s) => s.erledigt)).length;
      html += `<div class="cell-block"><div class="headline">${x.teile.map((t) => esc(TEIL_TITEL[t] || t)).join(' + ')}</div>
        <div class="footnote">${n} Übungen · Schmerz danach ${x.schmerzDanach ?? '–'}/10${x.notiz ? ` · „${esc(x.notiz)}“` : ''}</div></div>`;
    }
    html += `</div></div>`;
  }
  return html;
}

function morgentestKarte(r) {
  const m = r.morgentest;
  const d = ui.morgen;
  return `<div class="card">
    <div class="title3">${esc(m.titel)}</div>
    <div class="footnote mt8" style="color:var(--label)">${esc(m.anleitung)}</div>
    ${schmerzSkala('morgen-sls', d.sls, r, { mitAmpel: false })}
    ${d.steifOffen ? `<div class="label-small mt16">Morgensteifigkeit (optional)</div>${schmerzSkala('morgen-steif', d.steif, r, { mitAmpel: false })}`
      : `<button class="link-btn" data-action="morgen-steif-auf">+ Morgensteifigkeit eintragen (optional)</button>`}
    <div class="label-small mt12">Notiz (optional)</div>
    <textarea class="mt8" data-input="morgen-notiz" placeholder="z. B. Schrägbrett 25°, leichtes Ziehen">${esc(d.notiz)}</textarea>
    <div class="row mt12">
      ${ui.bearbeiten ? `<button class="btn" data-action="morgen-abbrechen">Abbrechen</button>` : ''}
      <button class="btn filled" data-action="morgen-speichern" ${d.sls === null ? 'disabled' : ''}>Speichern</button>
    </div>
  </div>`;
}

function ampelKarte(st, r) {
  const a = st.ampelHeute;
  const s = r.ampel.stufen[a];
  const check = S.morgenchecks.find((c) => c.datum === heute());
  const wechselHeute = st.stufenVerlauf.at(-1);
  const zurueck = wechselHeute && wechselHeute.datum === heute() && wechselHeute.grund === 'rot';
  return `<div class="card">
    <div class="ampel-gross"><div class="kreis ${a}" aria-hidden="true">${esc(s.symbol)}</div>
      <div><div class="title2">Ampel ${esc(s.titel)}</div><div class="footnote">${esc(GRUND_TEXT[st.grundHeute] || '')}</div></div></div>
    <div class="mt12">${esc(s.konsequenz)}</div>
    ${zurueck ? `<div class="hinweis-box"><b>Stufe zurückgesetzt:</b> von Stufe ${wechselHeute.von} auf Stufe ${wechselHeute.nach}.</div>` : ''}
    ${st.sperreAktiv ? `<div class="hinweis-box">${esc(r.rot.sperreText)} (bis ${deDatum(st.sperreBis)})</div>` : ''}
    <div class="row mt12" style="align-items:center"><div class="footnote">Morgentest: <b>${check.sls}/10</b>${check.steifigkeit != null ? ` · Steifigkeit ${check.steifigkeit}/10` : ''}</div>
      <button class="link-btn" style="flex:none" data-action="morgen-aendern">Ändern</button></div>
  </div>`;
}

// ---------------------------------------------------------------- Vorschlag
function teileFuer(v, st) {
  const teile = [];
  const iso = S.ueb[S.kv.isoVariante] || S.ueb.iso_beinpresse;
  const hsrOpt = { stufe: st.stufe, planWocheNr: v.planWoche.nr, hsrAnzahl: v.hsrAnzahl, hsrStandard: R().hsr.standard, tausch: S.kv.hsrTausch || {} };
  if (v.sehne.typ) {
    const ue = v.sehne.typ === 'iso' ? [iso] : uebungenFuer(v.sehne.typ, S.ueb, hsrOpt);
    const grund = v.sehne.grund === 'sperre' ? 'Nach Rot: nur Isometrie' : v.sehne.grund === 'faellig' ? 'Laut Rhythmus heute dran' : 'Isometrie füllt die freien Tage';
    teile.push({ key: 'sehne', titel: `Sehne: ${TYP_TITEL[v.sehne.typ]}`, info: grund, uebungen: ue, standard: true });
  }
  if (v.hsrTest) teile.push({ key: 'hsrtest', titel: `HSR-Test ${R().hsr.saetze} × 15 (optional)`, info: stufeObj(st.stufe).hsrTest.text, uebungen: uebungenFuer('hsr', S.ueb, { ...hsrOpt, stufe: 1 }), standard: false });
  if (v.unterkoerper.length) {
    const bl = Object.entries(v.ukBloecke).map(([b, x]) => `${BLOCK_NAME[b] || b} ${x.anzahl}/${x.min === x.max ? x.min : `${x.min}–${x.max}`}${x.heute ? ' ✓' : ''}`).join(' · ');
    // Vorausgewählt an Isometrie-Tagen (Erholungstage der Sehne), damit HSR-/Sprungtage nicht überladen werden.
    const isoTag = v.sehne.typ === 'iso' || v.sehne.erledigt === 'iso';
    teile.push({ key: 'uk', titel: 'Unterkörper', info: `Diese Woche: ${bl}${isoTag ? '' : ' · am besten an Isometrie-Tagen'}`, uebungen: v.unterkoerper.map((id) => S.ueb[id]), standard: v.ukFaellig && isoTag });
  }
  const okUe = uebungenFuer('ok', S.ueb, { planWocheNr: v.planWoche.nr, okBloecke: v.oberkoerper.bloecke });
  if (okUe.length) {
    const info = v.oberkoerper.heuteGemacht ? 'Heute schon gemacht' : v.oberkoerper.faellig ? `${v.planWoche.woche.oberkoerper} · heute dran` : `Nächste Oberkörper-Einheit eher in ${R().oberkoerper.alleTage} Tagen nach der letzten`;
    teile.push({ key: 'ok', titel: `Oberkörper: ${v.oberkoerper.bloecke.map(blockName).join(' + ')}`, info, uebungen: okUe, standard: v.oberkoerper.faellig && !v.oberkoerper.heuteGemacht, okBlock: v.oberkoerper.bloecke.join('+') });
  }
  if (v.basketball.length) {
    const m = v.bbMinuten;
    const bl = bbBelastung(S.einheiten, heute(), R());
    const minText = m ? (m.max ? ` · ${m.min}–${m.max} Min.${m.gelb ? ' (Gelb: −40 %)' : ''}` : ` · ${m.text}`) : '';
    const lastText = bl.max !== null ? ` · Belastung diese Woche ${bl.diese} von max. ${bl.max}` : '';
    teile.push({ key: 'bb', titel: 'Basketball', info: `${v.planWoche.woche.basketball}${minText}${lastText}`, uebungen: v.basketball.map((id) => S.ueb[id]), standard: v.stufe >= 3 });
  }
  return teile;
}

const BLOCK_NAME = { waden: 'Waden', huefte: 'Hüfte', hamstrings: 'Hamstrings', rumpf: 'Rumpf' };
const blockName = (b) => ({ ok_a: 'Grundkraft A', ok_b: 'Grundkraft B', ok_power: 'Power', ok_kontakt: 'Kontaktkraft', ok_erhaltung: 'Erhaltung' }[b] || b);

function auswahl(teile) {
  if (ui.auswahl.datum !== heute()) ui.auswahl = { datum: heute(), sel: {} };
  for (const t of teile) if (!(t.key in ui.auswahl.sel)) ui.auswahl.sel[t.key] = t.standard;
  return ui.auswahl.sel;
}

function vorschlagKarten(v, st, r) {
  let html = '';
  if (v.gelb) html += banner('gelb', '!', 'Gelb: kniebelastende Übungen heute gekürzt', esc(r.gelb.text));
  if (v.sehne.erledigt) html += banner('gruen', '✓', `Sehne heute erledigt (${TYP_TITEL[v.sehne.erledigt] || v.sehne.erledigt})`, 'Oberkörper oder Basketball kannst du trotzdem noch machen.');
  if (v.basketballVerschoben) html += banner('info', 'i', 'Basketball und Sprints heute nicht', esc(S.daten.plan.hinweisSprungtage));
  const bl = bbBelastung(S.einheiten, heute(), r);
  if (bl.ueber) html += banner('gelb', '!', `Basketball-Belastung diese Woche: ${bl.diese} (Vorwoche ${bl.letzte})`, `Mehr als +${r.basketball.lastSteigerungMaxProzent} % zur Vorwoche. ${esc(r.basketball.text)}`);
  const teile = teileFuer(v, st);
  const sel = auswahl(teile);
  html += `<div class="section"><div class="section-header">Heute dran – antippen zum Auswählen</div>`;
  for (const t of teile) {
    const an = !!sel[t.key];
    const liste = t.uebungen.map((u) => {
      const gesperrt = gesperrtDurchStufe(u, st.stufe);
      return `<li class="${gesperrt ? 'gesperrt' : ''}">${esc(u.name)}${gesperrt ? ` <span class="lock">ab Stufe ${u.minStufe}</span>` : ''}${u.status === 'OFFEN' ? ' ' + statusChip('OFFEN') : ''}</li>`;
    }).join('');
    html += `<div class="card"><div class="teil">
      <button class="teil-check" aria-pressed="${an}" aria-label="${esc(t.titel)} auswählen" data-action="teil" data-key="${t.key}">${icon.check}</button>
      <div class="grow"><div class="headline">${esc(t.titel)}</div><div class="footnote">${esc(t.info || '')}</div>
        <ul class="plain footnote" style="color:var(--label)">${liste}</ul>
        ${t.key === 'sehne' && v.sehne.typ === 'iso' ? `<button class="link-btn" data-action="iso-variante">Isometrie-Übung wechseln</button>` : ''}
      </div></div></div>`;
  }
  html += `</div>`;
  const n = teile.filter((t) => sel[t.key]).length;
  html += `<button class="btn filled lg" data-action="einheit-start" ${n ? '' : 'disabled'}>${icon.play}${n ? `Einheit starten (${n} ${n === 1 ? 'Teil' : 'Teile'})` : 'Mindestens einen Teil auswählen'}</button>`;
  return html;
}

function letzterOkBlock() {
  const l = S.einheiten.filter((e) => e.abgeschlossen && e.okBlock).sort((a, b) => (a.startISO < b.startISO ? -1 : 1)).pop();
  return l?.okBlock || null;
}

// ---------------------------------------------------------------- Einheit anlegen
function eintrag(def, teil, ampel, r, planWocheNr = 1, bbMinuten = null) {
  const d = { ...dosierung(def.id) };
  const wo = d.nachWoche?.[String(Math.min(planWocheNr, 8))];
  if (wo) Object.assign(d, wo);
  const eigene = S.kv.eigeneWerte?.[def.id] || {};
  let zielSaetze = def.hsr && eigene.saetze == null ? r.hsr.saetze : (d.saetze ?? null);
  const vorGelb = zielSaetze;
  if (zielSaetze != null) zielSaetze = saetzeHeute({ ...def, dosierung: { ...d, saetze: zielSaetze } }, ampel, r);
  let zielWdh = d.wdh ?? null;
  let kg = def.mitGewicht ? letzteKg(S.einheiten, def.id) : null;
  let hsrInfo = null;
  if (def.hsr) {
    hsrInfo = hsrNaechste(letzterEintrag(S.einheiten, def.id), r, { heuteGelb: ampel === 'gelb' });
    if (eigene.wdh == null) zielWdh = hsrInfo.zielWdh;
    if (hsrInfo.kg != null) kg = hsrInfo.kg;
  }
  const letzte = def.sprung ? letzterEintrag(S.einheiten, def.id) : null;
  return {
    uebungId: def.id, name: def.name, teil, typ: def.typ, mitGewicht: !!def.mitGewicht,
    kg, zielSaetze, vorGelb: vorGelb !== zielSaetze ? vorGelb : null, zielWdh, zielWdhMax: d.wdh_max ?? null,
    zielDauer: d.haltezeit_s ?? d.dauer_s ?? null, pauseS: d.pause_s ?? null, pauseMaxS: d.pause_max_s ?? null,
    intensitaetWoche: wo?.intensitaet || null,
    slot: def.hsr ? (Object.entries(S.kv.hsrTausch || {}).find(([, v]) => v === def.id)?.[0] || def.id) : null,
    zielMinuten: def.kategorie === 'basketball' && bbMinuten ? bbMinuten : null,
    variante: def.sprung ? (letzte?.variante || 'beidbeinig') : null,
    saetze: Array.from({ length: zielSaetze || 0 }, () => ({ erledigt: false })),
    schmerzWaehrend: null, rir: null, erledigt: false, hsrInfo,
  };
}

function neueEinheit() {
  const r = R();
  const h = heute();
  const st = status(h);
  const v = tagesvorschlag({ status: st, einheiten: S.einheiten, heute: h, stufen: S.daten.stufen, plan: plan(), ueb: S.ueb, letzterOkBlock: letzterOkBlock() }, r);
  const teile = teileFuer(v, st).filter((t) => ui.auswahl.sel[t.key]);
  const uebungen = [];
  for (const t of teile) for (const def of t.uebungen) if (!gesperrtDurchStufe(def, st.stufe)) uebungen.push(eintrag(def, t.key, st.ampelHeute, r, v.planWoche.nr, v.bbMinuten));
  return {
    id: uid(), datum: h, startISO: new Date().toISOString(), stufe: st.stufe, ampel: st.ampelHeute,
    teile: teile.map((t) => t.key), okBlock: teile.find((t) => t.key === 'ok')?.okBlock || null,
    planWoche: v.planWoche.nr, schritt: 'training', abgeschlossen: false, schmerzDanach: null, notiz: '', timer: null, uebungen,
  };
}

// ======================================================================== Training
function renderTraining(e) {
  const r = R();
  const titel = e.schritt === 'nach' ? 'Nach dem Training' : 'Training';
  let html = kopf(titel, `Stufe ${e.stufe} · ${ampelChip(e.ampel, r)}`);
  if (e.schritt === 'nach') return html + nachKarte(e, r);
  if (e.ampel === 'gelb') html += banner('gelb', '!', 'Gelb: kniebelastende Sätze gekürzt', esc(r.gelb.text));
  let letzterTeil = null;
  e.uebungen.forEach((u, i) => {
    if (u.teil !== letzterTeil) { html += `<div class="section-header mt16">${esc(TEIL_TITEL[u.teil] || u.teil)}</div>`; letzterTeil = u.teil; }
    html += uebungKarte(e, u, i, r);
  });
  html += `<button class="btn filled lg mt8" data-action="schritt-nach">Training beenden</button>
    <div class="center mt16"><button class="link-btn" style="color:var(--red)" data-action="einheit-verwerfen">Einheit verwerfen</button></div>`;
  return html;
}

export function pauseText(a, b) {
  const minuten = a >= 60 && a % 60 === 0 && (!b || (b >= 60 && b % 60 === 0));
  if (minuten) return b ? `${a / 60}–${b / 60} Min.` : `${a / 60} Min.`;
  return b ? `${a}–${b} s` : `${a} s`;
}

function zielText(u, def) {
  const d = dosierung(u.uebungId);
  const offen = '<b class="offen-txt">OFFEN</b>';
  const s = u.zielSaetze != null ? `${u.zielSaetze}` : `Sätze ${offen}`;
  const teile = [];
  if (u.typ === 'halten') teile.push(`${s} × ${u.zielDauer ?? offen} s halten`);
  else if (u.typ === 'dauer') teile.push(`${s} × ${u.zielDauer != null ? `${u.zielDauer}${d.dauer_max_s ? `–${d.dauer_max_s}` : ''} s` : offen}`);
  else if (u.typ === 'wiederholungen' && d.strecke) teile.push(`${s} × ${esc(d.strecke)}`);
  else if (u.typ === 'wiederholungen') teile.push(`${s} × ${u.zielWdh != null ? `${u.zielWdh}${u.zielWdhMax ? `–${u.zielWdhMax}` : ''}` : `Wdh. ${offen}`}`);
  else if (u.zielMinuten) teile.push(u.zielMinuten.max ? `${u.zielMinuten.min}–${u.zielMinuten.max} Min.${u.zielMinuten.gelb ? ' (Gelb: −40 %)' : ''}` : esc(u.zielMinuten.text));
  else teile.push(esc(d.text || '') || `Dosierung ${offen}`);
  if (u.intensitaetWoche) teile.push(esc(u.intensitaetWoche));
  if (d.tempo) teile.push(esc(d.tempo));
  if (u.hsrInfo?.bewegungsumfang) teile.push(esc(u.hsrInfo.bewegungsumfang));
  if (d.intensitaet) teile.push(esc(d.intensitaet));
  if (u.typ !== 'frei') teile.push(u.pauseS != null ? `Pause ${pauseText(u.pauseS, u.pauseMaxS)}` : `Pause ${offen}`);
  if (d.uebung) teile.unshift(`<b>${esc(d.uebung)}</b>`);
  return teile.join(' · ');
}

function uebungKarte(e, u, i, r) {
  const def = S.ueb[u.uebungId];
  const fertig = u.erledigt;
  let html = `<div class="ex ${fertig ? 'done' : ''}"><div class="ex-head"><div class="grow">
      <div class="ex-name">${esc(u.name)} ${statusChip(def.status)}</div><div class="ex-dose">${zielText(u, def)}</div></div>
      <button class="info-btn" aria-label="Infos zu ${esc(u.name)}" data-action="uebung-info" data-id="${esc(u.uebungId)}">i</button></div>`;

  if (u.hsrInfo?.gelbGesperrt) html += `<div class="hinweis-box">Gelb: gleiche Sätze und Last wie zuletzt, heute keine Steigerung.</div>`;
  else if (u.hsrInfo?.erfolg) html += `<div class="hinweis-box">↑ Letztes Mal alles geschafft: jetzt <b>${u.zielSaetze} × ${u.zielWdh}</b>${u.hsrInfo.kgMin != null ? `, Last +5–10 % (<b>${zahlDE(u.hsrInfo.kgMin)}–${zahlDE(u.hsrInfo.kgMax)} kg</b>)` : ''}.</div>`;
  else if (u.hsrInfo?.erfolg === false) html += `<div class="hinweis-box">Gleiche Ziel-Wiederholungen wie letztes Mal – Steigerung erst, wenn alle Sätze bei Schmerz ≤ ${r.hsr.schmerzMax} klappen.</div>`;
  if (u.slot && !u.saetze.some((x) => x.erledigt)) html += `<button class="link-btn" data-action="hsr-tausch" data-i="${i}">Übung tauschen (${R().hsr.wechsel.map((id) => esc(S.ueb[id].name.replace(' (HSR)', ''))).join(' / ')})</button>`;
  if (u.vorGelb) html += `<div class="hinweis-box">Gelb: ${u.zielSaetze} statt ${u.vorGelb} Sätze.</div>`;

  if (u.mitGewicht) {
    html += `<div class="kg-zeile"><label for="kg-${i}">Gewicht</label>
      <input id="kg-${i}" inputmode="decimal" data-input="kg" data-i="${i}" value="${u.kg != null ? zahlDE(u.kg, 2) : ''}" placeholder="–"><span class="einh">kg</span></div>`;
  }
  if (def.sprung) {
    html += `<div class="seg mt12">${['beidbeinig', 'einbeinig'].map((vv) => `<button data-action="variante" data-i="${i}" data-wert="${vv}" aria-pressed="${u.variante === vv}">${vv}</button>`).join('')}</div>`;
  }

  if (u.typ === 'frei') {
    html += `<button class="btn ${fertig ? 'green filled' : ''} block mt12" data-action="frei-erledigt" data-i="${i}">${icon.check}${fertig ? 'Erledigt' : 'Als erledigt markieren'}</button>`;
  } else {
    html += `<div class="satz-reihe">`;
    u.saetze.forEach((s, k) => {
      const unter = s.erledigt ? (u.typ === 'wiederholungen' ? `${s.wdh ?? '–'} Wdh.` : `${s.dauer ?? '–'} s`) + (s.kg != null ? `<small>${zahlDE(s.kg)} kg</small>` : '') : '<small>offen</small>';
      html += `<button class="satz-btn ${s.erledigt ? 'on' : ''}" data-action="satz" data-i="${i}" data-k="${k}" aria-label="Satz ${k + 1}${s.erledigt ? ' erledigt, zum Bearbeiten antippen' : ''}">${s.erledigt ? '✓ ' : ''}${k + 1}<small>${unter}</small></button>`;
    });
    html += `<button class="satz-btn" data-action="satz-plus" data-i="${i}" aria-label="Satz hinzufügen">+<small>Satz</small></button></div>`;

    const t = e.timer && e.timer.i === i ? e.timer : null;
    const naechster = u.saetze.findIndex((s) => !s.erledigt);
    if (t) {
      const sst = segmentStatus(t, Date.now());
      html += `<div class="timer"><div class="phase ${sst.phase}" data-timer-phase>${sst.phase === 'halten' ? 'Halten' : 'Pause'}</div>
        <div class="zeit" data-timer-zeit>${mmss(sst.rest)}</div>
        <button class="btn small danger mt8" data-action="timer-stopp">${icon.stop}Stopp</button></div>`;
    } else if ((u.typ === 'halten' || u.typ === 'dauer') && u.zielDauer && naechster >= 0) {
      html += `<button class="btn filled block mt8" data-action="satz-timer" data-i="${i}">${icon.play}Satz ${naechster + 1} starten · ${u.zielDauer} s</button>`;
    } else if (u.typ === 'wiederholungen' && naechster >= 0) {
      html += `<div class="footnote mt8">Satz antippen, wenn geschafft. Erledigten Satz antippen, um kg/Wdh. zu ändern.</div>`;
    }
  }

  if (u.typ !== 'frei' && def.kategorie === 'oberkoerper' && /RIR/.test(dosierung(u.uebungId).intensitaet || '')) {
    html += `<div class="kg-zeile"><label for="rir-${i}">Wdh. in Reserve (RIR, optional)</label>
      <input id="rir-${i}" inputmode="numeric" data-input="rir" data-i="${i}" value="${u.rir ?? ''}" placeholder="–"><span class="einh"></span></div>`;
  }

  if (def.kniebelastend) {
    const a = schmerzAmpel(u.schmerzWaehrend, r);
    html += `<div class="divider"></div><div class="label-small">Stärkster Knieschmerz während der Übung</div>
      ${schmerzSkala('ueb-schmerz', u.schmerzWaehrend, r, { extra: `data-i="${i}"` })}
      ${a ? `<div class="mt8">${ampelChip(a, r, `${u.schmerzWaehrend}/10`)}</div>${a === 'rot' ? `<div class="hinweis-box">Über ${r.ampel.gelbMax}/10: Übung beenden. Laut Leitfaden sind während/direkt nach Belastung höchstens 5/10 in Ordnung.</div>` : ''}` : ''}`;
  }
  html += ytButton(def, r, S.online) + `</div>`;
  return html;
}

function nachKarte(e, r) {
  const mitBb = e.uebungen.some((u) => S.ueb[u.uebungId]?.kategorie === 'basketball' && (u.erledigt || u.saetze.some((x) => x.erledigt)));
  const ok = e.schmerzDanach !== null;
  const bbKarte = mitBb ? `<div class="card"><div class="title3">Basketball: Dauer und Anstrengung</div>
      <div class="footnote mt8">${esc(r.basketball.text)}</div>
      <div class="kg-zeile"><label for="bb-min">Dauer</label><input id="bb-min" inputmode="numeric" data-input="bb-minuten" value="${e.bbMinuten ?? ''}" placeholder="–"><span class="einh">Min.</span></div>
      <div class="label-small mt12">Anstrengung (0 = locker, 10 = maximal)</div>${schmerzSkala('bb-anstrengung', e.bbAnstrengung, r, { mitAmpel: false })}
      ${e.bbMinuten != null && e.bbAnstrengung != null ? `<div class="hinweis-box">Belastung dieser Einheit: <b>${e.bbMinuten * e.bbAnstrengung}</b></div>` : ''}</div>` : '';
  return `<div class="card"><div class="title3">Knieschmerz direkt nach dem Training</div>
      <div class="footnote mt8">Laut Leitfaden während/direkt nach Belastung höchstens 5/10. Der nächste Morgentest zeigt, ob es zurück aufs Ausgangsniveau geht.</div>
      ${schmerzSkala('nach-schmerz', e.schmerzDanach, r)}</div>
    ${bbKarte}
    <div class="card"><div class="title3">Notiz (optional)</div><textarea class="mt12" data-input="einheit-notiz" placeholder="z. B. Beinpresse Gerät 3, Sitz Position 5">${esc(e.notiz || '')}</textarea></div>
    <div class="row"><button class="btn" data-action="schritt-training">Zurück</button>
      <button class="btn filled" data-action="einheit-speichern" ${ok ? '' : 'disabled'}>Einheit speichern</button></div>`;
}

// ---------------------------------------------------------------- Satz bearbeiten (Sheet)
function satzSheet() {
  const e = aktiveEinheit();
  if (!e || !ui.satzEdit) return '';
  const { i, k } = ui.satzEdit;
  const u = e.uebungen[i];
  const s = u.saetze[k];
  const wdhFeld = u.typ === 'wiederholungen';
  return `<div class="title2">${esc(u.name)} – Satz ${k + 1}</div>
    <div class="section mt16"><div class="list">
      ${u.mitGewicht ? `<div class="cell"><div class="grow">Gewicht (kg)</div><input class="num-input" inputmode="decimal" data-input="satz-kg" value="${s.kg != null ? zahlDE(s.kg, 2) : ''}"></div>` : ''}
      <div class="cell"><div class="grow">${wdhFeld ? 'Wiederholungen' : 'Dauer (s)'}</div><input class="num-input" inputmode="numeric" data-input="satz-wert" value="${(wdhFeld ? s.wdh : s.dauer) ?? ''}"></div>
    </div></div>
    <button class="btn filled lg" data-action="sheet-close">Fertig</button>
    <button class="btn danger block mt12" data-action="satz-zurueck">Satz zurücknehmen</button>`;
}

// ======================================================================== Timer-Takt
export function tick() {
  const e = aktiveEinheit();
  if (!e || !e.timer) return false;
  const t = e.timer;
  const sst = segmentStatus(t, Date.now());
  let neu = false;
  if (sst.halteFertig && !t.gezaehlt) {
    t.gezaehlt = true;
    const u = e.uebungen[t.i];
    const k = u.saetze.findIndex((s) => !s.erledigt);
    if (k >= 0) u.saetze[k] = { erledigt: true, dauer: t.halteS, kg: u.kg ?? null };
    if (u.saetze.every((s) => s.erledigt)) u.erledigt = true;
    signal(sst.phase === 'fertig' ? 3 : 2);
    neu = true;
  }
  if (sst.phase === 'fertig') {
    if (t.halteS === 0) signal(3);
    e.timer = null;
    bildschirmWach(false);
    neu = true;
  }
  if (neu) { speichern('einheiten', e); return true; }
  const z = document.querySelector('[data-timer-zeit]');
  const p = document.querySelector('[data-timer-phase]');
  if (z) z.textContent = mmss(sst.rest);
  if (p) { p.textContent = sst.phase === 'halten' ? 'Halten' : 'Pause'; p.className = `phase ${sst.phase}`; }
  return false;
}

// ======================================================================== Aktionen
const aktiv = () => aktiveEinheit();
const save = (e) => speichern('einheiten', e);
const istLetzter = (u) => u.saetze.filter((s) => !s.erledigt).length <= 1;

function pauseStarten(e, i) {
  const u = e.uebungen[i];
  if (!u.pauseS || istLetzter(u) && u.saetze.every((s) => s.erledigt)) return;
  audioFreischalten();
  bildschirmWach(true);
  e.timer = { i, startMs: Date.now(), halteS: 0, pauseS: u.pauseS, ohnePause: false, gezaehlt: true };
}

export const actions = {
  'morgen-sls': (el) => { ui.morgen.sls = Number(el.dataset.wert); },
  'morgen-steif': (el) => { ui.morgen.steif = Number(el.dataset.wert); },
  'morgen-steif-auf': () => { ui.morgen.steifOffen = true; },
  'morgen-aendern': () => {
    const c = S.morgenchecks.find((x) => x.datum === heute());
    ui.morgen = { sls: c.sls, steif: c.steifigkeit ?? null, notiz: c.notiz || '', steifOffen: c.steifigkeit != null };
    ui.bearbeiten = true;
  },
  'morgen-abbrechen': () => { ui.bearbeiten = false; },
  'morgen-speichern': async () => {
    const h = heute();
    const d = ui.morgen;
    const rec = { datum: h, sls: d.sls, steifigkeit: d.steif, notiz: d.notiz.trim(), erfasstISO: new Date().toISOString() };
    await speichern('morgenchecks', rec);
    const st = status(h);
    await speichern('morgenchecks', { ...rec, ampel: st.ampelHeute });
    ui.morgen = { sls: null, steif: null, notiz: '', steifOffen: false };
    ui.bearbeiten = false;
    ui.auswahl = { datum: null, sel: {} };
    window.scrollTo(0, 0);
  },
  teil: (el) => { ui.auswahl.sel[el.dataset.key] = !ui.auswahl.sel[el.dataset.key]; },
  'iso-variante': () => openSheet('Isometrie-Übung', () => {
    const akt = S.kv.isoVariante || 'iso_beinpresse';
    return `<div class="footnote mb8">Alle mit 5 × 45 s bei ca. 70 % Maximalkraft. Mit Gewicht: Beinpresse und Beinstrecker.</div><div class="list">
      ${Object.values(S.ueb).filter((u) => u.gruppe === 'iso').map((u) => `<button class="cell" data-action="iso-wahl" data-id="${u.id}"><div class="grow">${esc(u.name)}</div>${u.id === akt ? '<span class="value">✓</span>' : ''}</button>`).join('')}</div>`;
  }),
  'iso-wahl': async (el) => { await setKV('isoVariante', el.dataset.id); closeSheet(); },
  'einheit-start': async () => {
    if (aktiv()) return;
    const e = neueEinheit();
    if (!e.uebungen.length) { toast('Keine freigeschalteten Übungen ausgewählt.'); return; }
    await save(e);
    window.scrollTo(0, 0);
  },
  'uebung-info': (el) => oeffneUebung(el.dataset.id),
  variante: async (el) => { const e = aktiv(); e.uebungen[+el.dataset.i].variante = el.dataset.wert; await save(e); },
  'frei-erledigt': async (el) => { const e = aktiv(); const u = e.uebungen[+el.dataset.i]; u.erledigt = !u.erledigt; await save(e); },
  satz: async (el) => {
    const e = aktiv(); const i = +el.dataset.i; const k = +el.dataset.k; const u = e.uebungen[i];
    const s = u.saetze[k];
    if (s.erledigt) { ui.satzEdit = { i, k }; openSheet('Satz', satzSheet); return; }
    if (u.typ === 'halten' || u.typ === 'dauer') u.saetze[k] = { erledigt: true, dauer: u.zielDauer, kg: u.kg ?? null };
    else u.saetze[k] = { erledigt: true, wdh: u.zielWdh, kg: u.kg ?? null };
    if (u.saetze.every((x) => x.erledigt)) u.erledigt = true;
    else pauseStarten(e, i);
    await save(e);
  },
  'satz-plus': async (el) => { const e = aktiv(); const u = e.uebungen[+el.dataset.i]; u.saetze.push({ erledigt: false }); u.erledigt = false; await save(e); },
  'satz-zurueck': async () => {
    const e = aktiv(); const { i, k } = ui.satzEdit; const u = e.uebungen[i];
    if (k >= (u.zielSaetze || 0)) u.saetze.splice(k, 1); else u.saetze[k] = { erledigt: false };
    u.erledigt = false;
    await save(e); closeSheet();
  },
  'satz-timer': async (el) => {
    const e = aktiv(); const i = +el.dataset.i; const u = e.uebungen[i];
    audioFreischalten();
    bildschirmWach(true);
    e.timer = { i, startMs: Date.now(), halteS: u.zielDauer, pauseS: u.pauseS || 0, ohnePause: istLetzter(u), gezaehlt: false };
    await save(e);
  },
  'timer-stopp': async () => { const e = aktiv(); e.timer = null; bildschirmWach(false); await save(e); },
  'ueb-schmerz': async (el) => { const e = aktiv(); e.uebungen[+el.dataset.i].schmerzWaehrend = Number(el.dataset.wert); await save(e); },
  'schritt-nach': async () => { const e = aktiv(); e.schritt = 'nach'; if (e.timer) { e.timer = null; bildschirmWach(false); } await save(e); window.scrollTo(0, 0); },
  'schritt-training': async () => { const e = aktiv(); e.schritt = 'training'; await save(e); },
  'bb-anstrengung': async (el) => { const e = aktiv(); e.bbAnstrengung = Number(el.dataset.wert); await save(e); },
  'hsr-tausch': (el) => {
    const i = +el.dataset.i;
    openSheet('Übung tauschen', () => {
      const e = aktiv(); const u = e.uebungen[i];
      const opts = [u.slot, ...R().hsr.wechsel].filter((id, k, a) => a.indexOf(id) === k);
      return `<div class="footnote mb8">Beinstrecker oder Split Squat ersetzen eine der drei Standardübungen, nicht zusätzlich. Die Wahl bleibt für die nächsten Einheiten gespeichert.</div><div class="list">
        ${opts.map((id) => { const x = S.ueb[id]; const gesp = (x.abWoche || 1) > Math.max(1, e.planWoche || 1);
          return `<button class="cell ${gesp ? 'gesperrt' : ''}" data-action="hsr-tausch-wahl" data-i="${i}" data-id="${id}" ${gesp ? 'disabled' : ''}><div class="grow">${esc(x.name)}${id === u.slot ? ' <span class="footnote">(Standard)</span>' : ''}${gesp ? ` <span class="lock">ab Woche ${x.abWoche}</span>` : ''}</div>${id === u.uebungId ? '<span class="value">✓</span>' : ''}</button>`; }).join('')}</div>`;
    });
  },
  'hsr-tausch-wahl': async (el) => {
    const e = aktiv(); const i = +el.dataset.i; const u = e.uebungen[i]; const id = el.dataset.id;
    const tausch = { ...(S.kv.hsrTausch || {}) };
    for (const [k, v] of Object.entries(tausch)) if (v === id && k !== u.slot) delete tausch[k];
    if (id === u.slot) delete tausch[u.slot]; else tausch[u.slot] = id;
    await setKV('hsrTausch', tausch);
    const neu = eintrag(S.ueb[id], u.teil, e.ampel, R(), e.planWoche || 1);
    e.uebungen[i] = { ...neu, slot: u.slot };
    await save(e); closeSheet();
  },
  'nach-schmerz': async (el) => { const e = aktiv(); e.schmerzDanach = Number(el.dataset.wert); await save(e); },
  'einheit-speichern': async () => {
    const e = aktiv(); const r = R();
    for (const u of e.uebungen) if (u.typ !== 'frei') u.erledigt = u.saetze.length > 0 && u.saetze.every((s) => s.erledigt);
    e.abgeschlossen = true; e.timer = null; e.endeISO = new Date().toISOString(); delete e.schritt;
    await save(e);
    bildschirmWach(false);
    const steig = e.uebungen.filter((u) => S.ueb[u.uebungId]?.hsr).map((u) => ({ u, n: hsrNaechste(letzterEintrag(S.einheiten, u.uebungId), r) })).filter((x) => x.n.erfolg);
    toast(steig.length ? `Gespeichert. Nächstes Mal: ${steig.map((x) => `${x.u.name.replace(' (HSR)', '')} ${r.hsr.saetze}×${x.n.zielWdh}`).join(', ')}.` : 'Einheit gespeichert.');
    window.scrollTo(0, 0);
  },
  'einheit-verwerfen': async () => {
    if (!confirm('Diese Einheit wirklich verwerfen? Die Eingaben dieser Einheit gehen verloren.')) return;
    bildschirmWach(false);
    await loeschen('einheiten', aktiv().id);
  },
  'home-aus': async () => { await setKV('homeHinweisAus', true); },
  'backup-spaeter': async () => { await setKV('backupSpaeter', heute()); },
  'visap-spaeter': async () => { await setKV('visapSpaeter', heute()); },
};

export const inputs = {
  'morgen-notiz': (el) => { ui.morgen.notiz = el.value; return false; },
  'einheit-notiz': (el) => { const e = aktiv(); e.notiz = el.value; save(e); return false; },
  kg: (el) => {
    const e = aktiv(); const u = e.uebungen[+el.dataset.i];
    u.kg = parseZahl(el.value);
    save(e); return false;
  },
  'bb-minuten': (el) => { const e = aktiv(); e.bbMinuten = parseZahl(el.value); save(e); return false; },
  rir: (el) => { const e = aktiv(); e.uebungen[+el.dataset.i].rir = parseZahl(el.value); save(e); return false; },
  'satz-kg': (el) => { const e = aktiv(); const { i, k } = ui.satzEdit; e.uebungen[i].saetze[k].kg = parseZahl(el.value); save(e); return false; },
  'satz-wert': (el) => {
    const e = aktiv(); const { i, k } = ui.satzEdit; const u = e.uebungen[i];
    u.saetze[k][u.typ === 'wiederholungen' ? 'wdh' : 'dauer'] = parseZahl(el.value);
    save(e); return false;
  },
};
