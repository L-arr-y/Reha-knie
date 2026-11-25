// Regelwerk als reine Funktionen (ohne Bildschirm, ohne Datenbank) – dadurch testbar.
// Grundlage: docs/reha_leitfaden.md (Schmerzampel, Phasenmodell, Logikregeln 1–9).
// Alle Grenzwerte kommen aus data/regeln.json (Parameter r).
import { diffTage, addTage, wochenStart } from './util.js';

const istZahl = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const nachDatum = (a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0);

// ======================================================================== Ampel
/** Median einer Zahlenliste (oder null). */
export function median(werte) {
  const l = werte.filter(istZahl).map(Number).sort((a, b) => a - b);
  if (!l.length) return null;
  const m = Math.floor(l.length / 2);
  return l.length % 2 ? l[m] : (l[m - 1] + l[m]) / 2;
}

/**
 * Ampel für einen Morgentest (Logikregel 2 + Ergänzung).
 * vorherige = Werte der letzten Morgentests davor (neueste zuletzt); verglichen wird mit dem Median
 * der letzten `vergleichAnzahl` (3). +1 gilt als Messrauschen und bleibt grün.
 * gelbVorher = so viele Gelb direkt davor (2× Gelb in Folge = Rot).
 */
export function ampelFuer(wert, vorherige, gelbVorher, r) {
  if (!istZahl(wert)) return null;
  const a = r.ampel;
  const v = Number(wert);
  const liste = Array.isArray(vorherige) ? vorherige : [vorherige];
  const basis = median(liste.slice(-(a.vergleichAnzahl || 1)));
  const anstieg = basis === null ? 0 : v - basis;
  if (v > a.gelbMax) return { ampel: 'rot', grund: 'test_hoch', anstieg, basis };
  if (anstieg > a.anstiegGelbMax) return { ampel: 'rot', grund: 'anstieg_gross', anstieg, basis };
  if (v <= a.gruenMax && anstieg <= (a.anstiegToleranz ?? 0)) return { ampel: 'gruen', grund: 'ok', anstieg, basis };
  if ((gelbVorher || 0) + 1 >= a.gelbInFolgeRot) return { ampel: 'rot', grund: 'gelb_in_folge', anstieg, basis };
  return { ampel: 'gelb', grund: v > a.gruenMax ? 'test_mittel' : 'anstieg_klein', anstieg, basis };
}

export const GRUND_TEXT = {
  test_hoch: 'Morgentest über der Gelb-Grenze',
  anstieg_gross: 'Mehr als 2 Punkte über dem Median der letzten 3 Tests',
  gelb_in_folge: '2× Gelb in Folge',
  test_mittel: 'Morgentest im gelben Bereich',
  anstieg_klein: '2 Punkte über dem Median der letzten 3 Tests',
  ok: 'Im grünen Bereich, höchstens +1 (Messrauschen)',
};

// ======================================================================== Reha-Status
/**
 * Spielt alle Morgentests und Stufenwechsel der Reihe nach durch (Logikregeln 2, 3, 5 + Ergänzung).
 * checks: [{ datum, wert, zeit? }]  ·  wechsel: [{ datum, nach, grund: 'aufstieg' | 'manuell', zeitISO? }]
 * Rot setzt die Stufe einmal pro Rot-Episode zurück (mind. 1). Eine neue Episode beginnt erst nach
 * mindestens einem grünen Tag. Jeder Rot-Tag verlängert die Sperre (nur Iso + Oberkörper).
 * Gelb pausiert den Grün-Zähler, Rot und Stufenwechsel setzen ihn auf 0.
 */
export function rehaStatus({ checks = [], wechsel = [], startStufe = 1, startDatum = null, heute }, r) {
  const sortiert = [...checks].filter((c) => istZahl(c.wert)).sort(nachDatum);
  let stufe = startStufe;
  let stufeSeit = startDatum || sortiert[0]?.datum || heute;
  let gruen = 0;
  let gelbSerie = 0;
  const vorherige = [];
  let sperreBis = null;
  let rotSerieStart = null;
  let episodeAktiv = false;
  const rotEpisoden = [];
  const verlauf = [];
  const stufenVerlauf = [{ datum: stufeSeit, von: null, nach: stufe, grund: 'start' }];

  // Gleicher Tag: nach Uhrzeit (z. B. Morgentest nach einem Stufenwechsel geändert); ohne Uhrzeit zuerst der Test.
  const items = [
    ...sortiert.map((c) => ({ art: 0, datum: c.datum, c, zeit: c.zeit || '' })),
    ...wechsel.map((w) => ({ art: 1, datum: w.datum, w, zeit: w.zeitISO || '' })),
  ].sort((a, b) => {
    if (a.datum !== b.datum) return a.datum < b.datum ? -1 : 1;
    if (a.zeit && b.zeit && a.zeit !== b.zeit) return a.zeit < b.zeit ? -1 : 1;
    return a.art - b.art;
  });

  for (const it of items) {
    if (it.art === 1) {
      const nach = it.w.nach;
      if (nach !== stufe) {
        stufenVerlauf.push({ datum: it.datum, von: stufe, nach, grund: it.w.grund || 'manuell' });
        stufe = nach;
        stufeSeit = it.datum;
        gruen = 0;
      }
      continue;
    }
    const { datum } = it.c;
    const a = ampelFuer(it.c.wert, vorherige, gelbSerie, r);
    if (a.ampel === 'gruen') { gruen++; gelbSerie = 0; rotSerieStart = null; episodeAktiv = false; }
    else if (a.ampel === 'gelb') { gelbSerie++; }
    else {
      gelbSerie = 0;
      gruen = 0;
      if (!episodeAktiv) {
        episodeAktiv = true;
        rotEpisoden.push(datum);
        if (stufe > 1) {
          stufenVerlauf.push({ datum, von: stufe, nach: stufe - 1, grund: 'rot' });
          stufe -= 1;
          stufeSeit = datum;
        }
      }
      sperreBis = addTage(datum, r.rot.sperreTage - 1);
      if (!rotSerieStart) rotSerieStart = datum;
    }
    vorherige.push(Number(it.c.wert));
    verlauf.push({ datum, wert: Number(it.c.wert), ampel: a.ampel, grund: a.grund, basis: a.basis, stufe, gruenTage: gruen });
  }

  const heuteEintrag = verlauf.find((v) => v.datum === heute) || null;
  return {
    stufe,
    stufeSeit,
    tageInStufe: diffTage(stufeSeit, heute) + 1,
    gruenTageInFolge: gruen,
    morgencheckHeute: !!heuteEintrag,
    ampelHeute: heuteEintrag?.ampel || null,
    grundHeute: heuteEintrag?.grund || null,
    basisHeute: heuteEintrag?.basis ?? null,
    letzteAmpel: verlauf[verlauf.length - 1]?.ampel || null,
    sperreBis,
    sperreAktiv: !!(sperreBis && heute <= sperreBis),
    physioHinweis: !!(rotSerieStart && diffTage(rotSerieStart, heute) >= r.rot.physioNachTagen),
    rotSerieStart,
    rotEpisoden,
    verlauf,
    stufenVerlauf,
  };
}

// ======================================================================== Stufenaufstieg
/** Prüft Logikregel 3: Mindesttage, grüne Tage, Ampel heute grün, Stufenkriterium. */
export function aufstiegStatus(status, kriterium, r, maxStufe = 5) {
  const s = r.stufenwechsel;
  const punkte = [
    { id: 'tage', text: `Mindestens ${s.minTageProStufe} Tage in der Stufe`, ok: status.tageInStufe >= s.minTageProStufe, wert: `${status.tageInStufe}/${s.minTageProStufe}` },
    { id: 'gruen', text: `${s.minGruenTage} grüne Tage in Folge`, ok: status.gruenTageInFolge >= s.minGruenTage, wert: `${status.gruenTageInFolge}/${s.minGruenTage}` },
    { id: 'heute', text: 'Ampel heute grün', ok: status.ampelHeute === 'gruen' },
    { id: 'kriterium', text: kriterium?.text || 'Stufenkriterium', ok: !!kriterium?.erfuellt },
  ];
  const moeglich = status.stufe < maxStufe && !status.sperreAktiv && punkte.every((p) => p.ok);
  return { moeglich, punkte };
}

/** Stufenkriterium (Spalte „Weiter, wenn …“), soweit möglich automatisch aus den Einheiten erkannt. */
export function stufenKriterium(stufeObj, { einheiten = [], stufeSeit, bestaetigt = {}, koerpergewicht = null, rtp = null }, r, ueb) {
  const k = stufeObj?.kriterium;
  if (!k) return null;
  const inStufe = abgeschlossene(einheiten).filter((e) => !stufeSeit || e.datum >= stufeSeit);
  let auto = false;
  let detail = '';
  if (k.automatisch === 'iso_mit_last') {
    const kr = r.kriterien.s1;
    auto = inStufe.some((e) => e.uebungen.some((u) => ueb[u.uebungId]?.gruppe === 'iso'
      && u.saetze.filter((s) => s.erledigt && (s.dauer ?? 0) >= kr.minHaltezeit_s && (s.kg ?? 0) >= kr.minKg).length >= kr.minSaetze));
    detail = auto ? '5 × 45 s mit Zusatzlast geloggt' : 'Noch keine Iso-Einheit mit 5 × 45 s und Zusatzlast (kg) geloggt';
  } else if (k.automatisch === 'beinpresse_150') {
    const kr = r.kriterien.s2;
    if (!istZahl(koerpergewicht)) {
      detail = 'Körpergewicht in den Einstellungen eintragen';
    } else {
      const ziel = kr.faktorKoerpergewicht * koerpergewicht;
      auto = inStufe.some((e) => e.uebungen.some((u) => u.uebungId === kr.uebung
        && u.saetze.filter((s) => s.erledigt && (s.wdh ?? 0) >= kr.wdh && (s.kg ?? 0) >= ziel).length >= kr.saetze));
      detail = `Ziel: ${kr.saetze} × ${kr.wdh} mit mind. ${Math.round(ziel * 10) / 10} kg${auto ? ' – geschafft' : ''}`;
    }
  } else if (k.automatisch === 'sprung_einbeinig') {
    const kr = r.kriterien.s3;
    const letzte = [...inStufe].reverse().find((e) => e.uebungen.some((u) => ueb[u.uebungId]?.sprung));
    if (letzte) {
      const sp = letzte.uebungen.filter((u) => ueb[u.uebungId]?.sprung);
      auto = sp.length > 0 && sp.every((u) => u.variante === 'einbeinig' && u.saetze.some((s) => s.erledigt)
        && istZahl(u.schmerzWaehrend) && u.schmerzWaehrend <= kr.schmerzMax);
    }
    detail = auto ? 'Letzte Sprung-Einheit komplett einbeinig bei Schmerz ≤ 3' : 'Letzte Sprung-Einheit noch nicht komplett einbeinig bei Schmerz ≤ 3';
  } else if (k.automatisch === 'rtp') {
    auto = !!rtp?.alleErfuellt;
    detail = auto ? 'Return-to-Play-Check erfüllt' : 'Return-to-Play-Check noch offen';
  }
  const best = !!bestaetigt[k.id];
  return { id: k.id, text: k.text, bestaetigung: k.bestaetigung, auto, bestaetigt: best, erfuellt: auto && best, detail };
}

// ======================================================================== Einheiten / Rhythmus
export function abgeschlossene(einheiten) {
  return (einheiten || []).filter((e) => e.abgeschlossen).sort(nachDatum);
}

const typVon = (u, ueb) => {
  const t = ueb[u.uebungId]?.einheitTyp;
  return t && t.startsWith('ok_') ? 'ok' : t;
};
const gemacht = (u) => (u.saetze || []).some((s) => s.erledigt) || u.erledigt;

/** Alle Tage, an denen eine Übung dieses Typs gemacht wurde (aufsteigend, ohne Doppelte). */
export function tageMitTyp(einheiten, typ, ueb) {
  const set = new Set();
  for (const e of abgeschlossene(einheiten)) if (e.uebungen.some((u) => typVon(u, ueb) === typ && gemacht(u))) set.add(e.datum);
  return [...set].sort();
}

/** Alle Tage, an denen eine Übung aus diesem Unterkörper-Block gemacht wurde. */
export function tageMitBlock(einheiten, block, ueb) {
  const set = new Set();
  for (const e of abgeschlossene(einheiten)) if (e.uebungen.some((u) => ueb[u.uebungId]?.block === block && gemacht(u))) set.add(e.datum);
  return [...set].sort();
}

export function regelFaellig(regel, einheiten, heute, ueb) {
  const tage = tageMitTyp(einheiten, regel.typ, ueb).filter((d) => d <= heute);
  const letzter = tage[tage.length - 1] || null;
  const seit = letzter ? diffTage(letzter, heute) : Infinity;
  if (regel.alleTage) return { faellig: seit >= regel.alleTage, letzter, seit };
  if (regel.proWoche) {
    const inWoche = tage.filter((d) => diffTage(d, heute) < 7).length;
    return { faellig: inWoche < regel.proWoche && seit >= (regel.minAbstandTage || 1), letzter, seit, inWoche };
  }
  return { faellig: true, letzter, seit };
}

/** Logikregel 6: welche Sehnen-Einheit ist heute dran? */
export function sehneVorschlag(stufeObj, einheiten, heute, ueb) {
  const regeln = stufeObj.rhythmus || [];
  const sehneTypen = new Set(['iso', 'hsr', 'sprung', 'sport']);
  const heuteGemacht = abgeschlossene(einheiten).filter((e) => e.datum === heute)
    .flatMap((e) => e.uebungen.filter(gemacht).map((u) => typVon(u, ueb))).filter((t) => sehneTypen.has(t));
  if (heuteGemacht.length) return { typ: null, erledigt: heuteGemacht[0] };
  for (const rg of regeln.filter((x) => !x.fuellt)) {
    const f = regelFaellig(rg, einheiten, heute, ueb);
    if (f.faellig) return { typ: rg.typ, grund: 'faellig', letzter: f.letzter };
  }
  const fill = regeln.find((x) => x.fuellt);
  return fill ? { typ: fill.typ, grund: regeln.length === 1 ? 'faellig' : 'auffuellen' } : { typ: null };
}

// ======================================================================== Plan
export function planWoche(plan, heute) {
  const d = diffTage(plan.start, heute);
  if (d < 0) return { nr: 0, vorPlan: true, woche: plan.wochen[0], tageBisStart: -d };
  const nr = Math.floor(d / 7) + 1;
  if (nr > plan.wochen.length) return { nr, nachPlan: true, woche: plan.wochen[plan.wochen.length - 1] };
  return { nr, woche: plan.wochen[nr - 1], tagInWoche: (d % 7) + 1 };
}

/**
 * Schätzung fürs erste Spiel (Ergänzung): Mindestdauern der restlichen Stufen (S1 7, S2 21, S3 14, S4 14 Tage)
 * abzüglich der Tage in der aktuellen Stufe, plus 1 Tag je gelbem Tag und 7 Tage je Rot-Episode in der aktuellen Stufe.
 * Spanne: frühestens / realistisch (+14 Tage). In der Erhaltung: null.
 */
export function prognose(status, heute, r) {
  const p = r.prognose;
  if (status.stufe > 4) return null;
  let rest = 0;
  for (let s = status.stufe; s <= 4; s++) rest += p.mindestTage[String(s)] || 0;
  const vergangen = Math.max(0, status.tageInStufe - 1);
  rest = Math.max(0, rest - Math.min(vergangen, p.mindestTage[String(status.stufe)] || 0));
  const gelbTage = status.verlauf.filter((v) => v.datum >= status.stufeSeit && v.ampel === 'gelb').length;
  const rotEpisoden = (status.rotEpisoden || []).filter((d) => d >= status.stufeSeit).length;
  const plus = gelbTage * p.plusProGelbTag + rotEpisoden * p.plusProRotEpisode;
  const fruehestens = addTage(heute, rest + plus);
  return { fruehestens, realistisch: addTage(fruehestens, p.realistischPlusTage), restTage: rest, plusTage: plus, gelbTage, rotEpisoden };
}

/** Basketball-Belastung (Ergänzung): Dauer × Anstrengung je Woche (Mo–So) und Vergleich mit der Vorwoche (max. +20 %). */
export function bbBelastung(einheiten, heute, r) {
  const ws = wochenStart(heute);
  const vorher = addTage(ws, -7);
  let diese = 0; let letzte = 0;
  for (const e of abgeschlossene(einheiten)) {
    if (!istZahl(e.bbMinuten) || !istZahl(e.bbAnstrengung)) continue;
    const last = Number(e.bbMinuten) * Number(e.bbAnstrengung);
    const w = wochenStart(e.datum);
    if (w === ws) diese += last; else if (w === vorher) letzte += last;
  }
  const max = letzte > 0 ? Math.round(letzte * (1 + r.basketball.lastSteigerungMaxProzent / 100)) : null;
  return { diese, letzte, max, ueber: max !== null && diese > max, rest: max !== null ? Math.max(0, max - diese) : null };
}

/** Nächste Oberkörper-Einheit im Wechsel (z. B. A, B, A …). */
export function naechsteOkEinheit(okEinheiten, letzterBlock) {
  if (!okEinheiten?.length) return [];
  const keys = okEinheiten.map((x) => x.join('+'));
  const i = keys.indexOf(letzterBlock);
  return okEinheiten[i >= 0 ? (i + 1) % okEinheiten.length : 0];
}

// ======================================================================== Tagesvorschlag
/**
 * Logikregeln 1, 4, 5, 6, 9: Was steht heute an?
 * Ohne Morgencheck kein Vorschlag. Bei Sperre nach Rot nur Isometrie und Oberkörper.
 */
export function tagesvorschlag({ status, einheiten, heute, stufen, plan, ueb, letzterOkBlock = null }, r) {
  if (!status.morgencheckHeute) return { morgencheckFehlt: true };
  const stufeObj = stufen.find((s) => s.nr === status.stufe) || stufen[0];
  const pw = planWoche(plan, heute);
  const sperre = status.sperreAktiv;
  const normal = sehneVorschlag(stufeObj, einheiten, heute, ueb);
  const sehne = sperre && !normal.erledigt ? { typ: 'iso', grund: 'sperre' } : normal;

  let hsrTest = false;
  if (stufeObj.hsrTest && !sperre && status.ampelHeute === 'gruen' && status.tageInStufe >= stufeObj.hsrTest.abTagInStufe) {
    hsrTest = tageMitTyp(einheiten, 'hsr', ueb).filter((d) => d >= status.stufeSeit).length === 0;
  }

  // Ergänzung: Sprints und Basketball ab Stufe 3 nur an Sprung-/Sporttagen (dazwischen Erholung für die Sehne).
  const lastTyp = (t) => t === 'sprung' || t === 'sport';
  const belastungstag = status.stufe < 3 || status.stufe > 4 || lastTyp(sehne.typ) || lastTyp(sehne.erledigt);
  const ukListe = sperre ? [] : (pw.woche.ukUebungen || []).filter((id) => belastungstag || !ueb[id]?.nurBelastungstag);
  const ukBloecke = {};
  for (const id of ukListe) {
    const u = ueb[id];
    if (!u?.block || ukBloecke[u.block]) continue;
    const tage = tageMitBlock(einheiten, u.block, ueb).filter((d) => diffTage(d, heute) < 7 && d <= heute);
    ukBloecke[u.block] = { anzahl: tage.length, min: u.proWoche?.min ?? 0, max: u.proWoche?.max ?? 7, heute: tage.includes(heute) };
  }
  const unterkoerper = ukListe.filter((id) => { const b = ukBloecke[ueb[id]?.block]; return !b || (b.anzahl < b.max && !b.heute); });
  const ukFaellig = Object.values(ukBloecke).some((b) => b.anzahl < b.min && !b.heute);
  const bbMin = pw.woche.bbMinuten && status.ampelHeute === 'gelb' && pw.woche.bbMinuten.max
    ? { ...pw.woche.bbMinuten, max: Math.floor(pw.woche.bbMinuten.max * (1 - r.gelb.reduktionProzent / 100)), min: Math.floor(pw.woche.bbMinuten.min * (1 - r.gelb.reduktionProzent / 100)), gelb: true }
    : pw.woche.bbMinuten || null;

  const okTage = tageMitTyp(einheiten, 'ok', ueb);
  const okLetzter = okTage[okTage.length - 1] || null;
  const okFaellig = !okLetzter || diffTage(okLetzter, heute) >= r.oberkoerper.alleTage;
  const okHeuteGemacht = okLetzter === heute;

  return {
    morgencheckFehlt: false,
    stufe: status.stufe,
    ampel: status.ampelHeute,
    gelb: status.ampelHeute === 'gelb',
    sperre,
    planWoche: pw,
    sehne,
    hsrTest,
    hsrAnzahl: pw.woche.hsrAnzahl || 3,
    belastungstag,
    unterkoerper,
    ukBloecke,
    ukFaellig,
    bbMinuten: bbMin,
    oberkoerper: { faellig: okFaellig, heuteGemacht: okHeuteGemacht, letzter: okLetzter, bloecke: naechsteOkEinheit(pw.woche.okEinheiten, letzterOkBlock) },
    basketball: sperre || !belastungstag ? [] : pw.woche.bbUebungen,
    basketballVerschoben: !sperre && !belastungstag && (pw.woche.bbUebungen || []).length > 0,
  };
}

/**
 * Übungen für einen Einheitentyp (Sehne) bzw. eine Liste von Oberkörper-Blöcken.
 * HSR (Ergänzung): die ersten `hsrAnzahl` aus r.hsr.standard; `tausch` ersetzt eine davon durch eine Wechselübung.
 */
export function uebungenFuer(typ, ueb, { stufe, planWocheNr = 1, okBloecke = [], hsrAnzahl = 3, hsrStandard = null, tausch = {} } = {}) {
  const alle = Object.values(ueb);
  if (typ === 'iso') return alle.filter((u) => u.gruppe === 'iso' && u.standard);
  if (typ === 'hsr') {
    const std = hsrStandard || alle.filter((u) => u.hsr && !u.wechsel).map((u) => u.id);
    const wahl = std.slice(0, hsrAnzahl).map((id) => {
      const ersatz = ueb[tausch[id]];
      return ersatz && (ersatz.abWoche || 1) <= Math.max(1, planWocheNr) ? ersatz : ueb[id];
    }).filter(Boolean);
    return [...wahl, ...alle.filter((u) => u.einheitTyp === 'hsr' && u.optional && stufe >= u.minStufe)];
  }
  if (typ === 'sprung') return alle.filter((u) => u.sprung);
  if (typ === 'sport') return alle.filter((u) => u.einheitTyp === 'sport');
  if (typ === 'ok') {
    const wk = Math.max(1, planWocheNr);
    const imPlan = (u) => (u.abWoche || 1) <= wk && (!u.bisWoche || wk <= u.bisWoche);
    return [
      ...alle.filter((u) => u.einheitTyp === 'prehab'),
      ...alle.filter((u) => okBloecke.includes(u.einheitTyp) && imPlan(u)),
    ];
  }
  return [];
}

/** Logikregel 9: über der aktuellen Stufe ausgegraut. */
export function gesperrtDurchStufe(uebung, stufe) {
  return (uebung.minStufe || 1) > Math.min(stufe, 4);
}

/** Logikregel 4 + Ergänzung: Gelb kürzt nur Sprünge, Sprints und Basketball (gelbKuerzen), abgerundet, mind. 1 Satz. */
export function saetzeHeute(uebung, ampel, r) {
  const s = uebung.dosierung?.saetze;
  if (!istZahl(s)) return null;
  if (ampel !== 'gelb' || !uebung.gelbKuerzen) return s;
  return Math.max(1, Math.floor(s * (1 - r.gelb.reduktionProzent / 100)));
}

// ======================================================================== HSR-Progression
const runden = (x, schritt) => Math.round(x / schritt) * schritt;

/** Letzter Eintrag einer Übung (mit mindestens einem erledigten Satz). */
export function letzterEintrag(einheiten, uebungId) {
  const l = abgeschlossene(einheiten);
  for (let i = l.length - 1; i >= 0; i--) {
    const u = l[i].uebungen.find((x) => x.uebungId === uebungId && gemacht(x));
    if (u) return { ...u, datum: l[i].datum, ampel: l[i].ampel };
  }
  return null;
}

/** Zuletzt benutztes Gewicht einer Übung (zum Vorausfüllen). */
export function letzteKg(einheiten, uebungId) {
  const e = letzterEintrag(einheiten, uebungId);
  if (!e) return null;
  const kgs = e.saetze.filter((s) => s.erledigt && istZahl(s.kg)).map((s) => Number(s.kg));
  return kgs.length ? Math.max(...kgs) : (istZahl(e.kg) ? Number(e.kg) : null);
}

/**
 * Logikregel 7: Alle Sätze mit Ziel-Wiederholungen bei Schmerz ≤ 3 geschafft
 * → nächste Einheit weniger Wiederholungen (15 → 12 → 10 → 8 → 6) und Last +5–10 %.
 */
export function hsrNaechste(eintrag, r, { heuteGelb = false } = {}) {
  const h = r.hsr;
  if (!eintrag) return { zielWdh: h.wdhLeiter[0], kg: null, erfolg: null, bewegungsumfang: h.bewegungsumfang[h.wdhLeiter[0]] };
  const ziel = eintrag.zielWdh ?? h.wdhLeiter[0];
  const fertig = (eintrag.saetze || []).filter((s) => s.erledigt);
  const kgBasis = fertig.filter((s) => istZahl(s.kg)).reduce((m, s) => Math.max(m, Number(s.kg)), istZahl(eintrag.kg) ? Number(eintrag.kg) : 0) || null;
  // Ergänzung: an Gelb-Tagen gleiche Sätze und Last, aber keine Steigerung – weder heute noch aufgrund einer Gelb-Einheit.
  if (heuteGelb || eintrag.ampel === 'gelb') return { zielWdh: ziel, kg: kgBasis, erfolg: false, gelbGesperrt: true, bewegungsumfang: h.bewegungsumfang[ziel] };
  const erfolg = fertig.length >= h.saetze && fertig.every((s) => (s.wdh ?? ziel) >= ziel)
    && istZahl(eintrag.schmerzWaehrend) && Number(eintrag.schmerzWaehrend) <= h.schmerzMax;
  if (!erfolg) return { zielWdh: ziel, kg: kgBasis, erfolg: false, bewegungsumfang: h.bewegungsumfang[ziel] };
  const i = h.wdhLeiter.indexOf(ziel);
  const naechste = h.wdhLeiter[Math.min(i + 1, h.wdhLeiter.length - 1)];
  const kgMin = kgBasis ? runden(kgBasis * (1 + h.lastPlusMinProzent / 100), h.rundenKg) : null;
  const kgMax = kgBasis ? runden(kgBasis * (1 + h.lastPlusMaxProzent / 100), h.rundenKg) : null;
  return { zielWdh: naechste, kg: kgMin, kgMin, kgMax, erfolg: true, bewegungsumfang: h.bewegungsumfang[naechste] };
}

// ======================================================================== Return to Play
/** LSI in %: betroffen / gesund (Weite) bzw. gesund / betroffen (Zeit, kleiner ist besser). */
export function lsi(betroffen, gesund, kleinerBesser = false) {
  if (!istZahl(betroffen) || !istZahl(gesund) || Number(betroffen) <= 0 || Number(gesund) <= 0) return null;
  const v = kleinerBesser ? Number(gesund) / Number(betroffen) : Number(betroffen) / Number(gesund);
  return Math.round(v * 1000) / 10;
}

/** Morgenschmerz an N Tagen in Folge (bis heute) vorhanden und nie gestiegen? */
export function morgenStabil(verlauf, heute, tage) {
  const byDate = Object.fromEntries((verlauf || []).map((v) => [v.datum, v.wert]));
  for (let i = tage - 1; i >= 0; i--) {
    const d = addTage(heute, -i);
    if (!istZahl(byDate[d])) return false;
    const vorher = byDate[addTage(d, -1)];
    if (i < tage - 1 && byDate[d] > vorher) return false;
  }
  return true;
}

/**
 * Return-to-Play-Checkliste. check: { sprungweiteL, sprungweiteR, sprungSchmerz, hop6mL, hop6mR, hopOhneAnstieg,
 * teamtraining, selbsteinschaetzung }, bein: 'links' | 'rechts' (betroffen).
 */
export function rtpAuswertung(check, { verlauf = [], heute, bein = 'rechts' }, r) {
  const c = check || {};
  const k = r.rtp;
  const betr = (l, rr) => (bein === 'links' ? [l, rr] : [rr, l]);
  const [swB, swG] = betr(c.sprungweiteL, c.sprungweiteR);
  const [hpB, hpG] = betr(c.hop6mL, c.hop6mR);
  const lsiSprung = lsi(swB, swG);
  const lsiHop = lsi(hpB, hpG, true);
  const heuteWert = verlauf.find((v) => v.datum === heute)?.wert;
  const res = {
    sls: istZahl(heuteWert) && heuteWert <= k.slsMax,
    morgen: morgenStabil(verlauf, heute, k.morgenStabilTage),
    sprungweite: lsiSprung !== null && lsiSprung >= k.lsiZiel && istZahl(c.sprungSchmerz) && Number(c.sprungSchmerz) <= k.slsMax,
    hop6m: istZahl(hpB) && istZahl(hpG) && c.hopOhneAnstieg === true,
    teamtraining: c.teamtraining === true,
    selbst: istZahl(c.selbsteinschaetzung) && Number(c.selbsteinschaetzung) >= k.selbsteinschaetzungMin,
  };
  const punkte = k.checkliste.map((p) => ({ ...p, ok: !!res[p.id] }));
  return { punkte, lsiSprung, lsiHop, alleErfuellt: punkte.every((p) => p.ok) };
}

// ======================================================================== Sonstiges
export function faellig(letzteIso, heuteIso, tage) {
  if (!letzteIso) return true;
  return diffTage(letzteIso.slice(0, 10), heuteIso) >= tage;
}

export function youtubeUrl(begriff) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(begriff || '');
}
