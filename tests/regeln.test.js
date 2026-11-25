import { gleich, wahr } from './runner.js';
import {
  ampelFuer, rehaStatus, aufstiegStatus, stufenKriterium, sehneVorschlag, regelFaellig, planWoche, prognose,
  naechsteOkEinheit, tagesvorschlag, uebungenFuer, gesperrtDurchStufe, saetzeHeute, hsrNaechste, letzteKg, median, bbBelastung,
  lsi, morgenStabil, rtpAuswertung, youtubeUrl,
} from '../js/regeln.js';
import { segmentStatus } from '../js/timer.js';
import { addTage, diffTage, wochenStart, deDatum, parseZahl } from '../js/util.js';

const START = '2026-11-23';
/** Morgentests ab START mit den gegebenen Werten (ein Tag pro Wert). */
const checks = (werte, start = START) => werte.map((w, i) => ({ datum: addTage(start, i), wert: w }));
const tag = (n) => addTage(START, n);

/** Abgeschlossene Einheit mit einer Übung. */
const einheit = (datum, uebungId, saetze, extra = {}) => ({
  id: `${datum}-${uebungId}`, datum, abgeschlossen: true,
  uebungen: [{ uebungId, saetze, schmerzWaehrend: 2, ...extra }],
});
const satz = (o) => ({ erledigt: true, ...o });

export function tests({ regeln: r, stufen, plan, uebungen }) {
  const ueb = Object.fromEntries(uebungen.map((u) => [u.id, u]));
  const st = (werte, opts = {}) => rehaStatus({ checks: checks(werte), heute: tag(werte.length - 1), startDatum: START, ...opts }, r);

  return {
    // ------------------------------------------------------------ Ampel (Regel 2)
    'Ampel: 0–3 ohne Anstieg → grün': () => { gleich(ampelFuer(3, 3, 0, r).ampel, 'gruen'); gleich(ampelFuer(0, null, 0, r).ampel, 'gruen'); },
    'Ampel: 3 nach 1 (Anstieg 2) → gelb': () => gleich(ampelFuer(3, 1, 0, r).ampel, 'gelb'),
    'Ampel: 4 und 5 → gelb': () => { gleich(ampelFuer(4, 4, 0, r).ampel, 'gelb'); gleich(ampelFuer(5, 5, 0, r).ampel, 'gelb'); },
    'Ampel: 6 → rot': () => gleich(ampelFuer(6, 6, 0, r).ampel, 'rot'),
    'Ampel: Anstieg um 3 (0 → 3) → rot': () => { const a = ampelFuer(3, 0, 0, r); gleich(a.ampel, 'rot'); gleich(a.grund, 'anstieg_gross'); },
    'Ampel: 2× Gelb in Folge → rot': () => { const a = ampelFuer(4, 4, 1, r); gleich(a.ampel, 'rot'); gleich(a.grund, 'gelb_in_folge'); },
    'Ampel: niedriger als gestern im grünen Bereich → grün': () => gleich(ampelFuer(1, 3, 0, r).ampel, 'gruen'),
    'Ampel: Grenzen kommen aus regeln.json': () => {
      const r2 = { ...r, ampel: { ...r.ampel, gruenMax: 2 } };
      gleich(ampelFuer(3, 3, 0, r2).ampel, 'gelb');
    },

    // ------------------------------------------------------------ Status / Zähler (Regeln 3, 5)
    'Status: 7 grüne Tage → Zähler 7': () => { const s = st([2, 2, 2, 1, 1, 1, 1]); gleich(s.gruenTageInFolge, 7); gleich(s.stufe, 1); },
    'Status: Gelb pausiert den Zähler (setzt nicht zurück)': () => gleich(st([2, 2, 4, 2]).gruenTageInFolge, 3),
    'Status: 2× Gelb in Folge zählt als Rot (Zähler 0)': () => { const s = st([2, 2, 4, 4]); gleich(s.letzteAmpel, 'rot'); gleich(s.gruenTageInFolge, 0); },
    'Status: Rot in Stufe 1 → bleibt Stufe 1, Zähler 0, Sperre': () => {
      const s = st([2, 2, 7]);
      gleich([s.stufe, s.gruenTageInFolge, s.sperreAktiv], [1, 0, true]);
    },
    'Status: Rot in Stufe 2 → zurück auf Stufe 1': () => {
      const s = st([2, 2, 2, 7], { wechsel: [{ datum: tag(1), nach: 2, grund: 'aufstieg' }] });
      gleich(s.stufe, 1); gleich(s.stufenVerlauf.at(-1).grund, 'rot'); gleich(s.stufeSeit, tag(3));
    },
    'Status: Morgentest nach Aufstieg am selben Tag auf Rot geändert → Stufe zurück': () => {
      const c = [...checks([2, 2]).slice(0, 1), { datum: tag(1), wert: 7, zeit: `${tag(1)}T10:00:00Z` }];
      const s = rehaStatus({ checks: c, wechsel: [{ datum: tag(1), nach: 2, grund: 'aufstieg', zeitISO: `${tag(1)}T08:00:00Z` }], heute: tag(1), startDatum: START }, r);
      gleich(s.stufe, 1);
    },
    'Status: zweiter Rot-Tag in der Sperre senkt nicht erneut': () => {
      const s = st([2, 7, 7], { wechsel: [{ datum: tag(0), nach: 3, grund: 'manuell' }] });
      gleich(s.stufe, 2);
    },
    'Status: Rot nach Ende der Sperre senkt erneut': () => {
      const s = st([2, 7, 2, 2, 7], { wechsel: [{ datum: tag(0), nach: 3, grund: 'manuell' }] });
      gleich(s.stufe, 1);
    },
    'Status: Sperre gilt 2 Tage (Rot-Tag + Folgetag)': () => {
      const s = rehaStatus({ checks: checks([7]), heute: tag(1), startDatum: START }, r);
      gleich(s.sperreAktiv, true);
      gleich(rehaStatus({ checks: checks([7]), heute: tag(2), startDatum: START }, r).sperreAktiv, false);
    },
    'Status: Physio-Hinweis nach 7 Tagen ohne Grün seit Rot': () => {
      gleich(st([7, 4, 5, 4, 5, 4, 5]).physioHinweis, false); // 6 Tage
      gleich(st([7, 4, 5, 4, 5, 4, 5, 4]).physioHinweis, true); // 7 Tage
      gleich(st([7, 4, 5, 2, 2, 2, 2, 2]).physioHinweis, false); // wieder grün
    },
    'Status: Stufenwechsel setzt Grün-Zähler zurück': () => {
      const s = st([2, 2, 2, 2], { wechsel: [{ datum: tag(1), nach: 2, grund: 'aufstieg' }] });
      gleich(s.gruenTageInFolge, 2); gleich(s.tageInStufe, 3);
    },
    'Status: ohne Morgencheck heute → kein Vorschlag': () => {
      const s = rehaStatus({ checks: checks([2]), heute: tag(1), startDatum: START }, r);
      gleich(s.morgencheckHeute, false);
      gleich(tagesvorschlag({ status: s, einheiten: [], heute: tag(1), stufen, plan, ueb }, r).morgencheckFehlt, true);
    },

    // ------------------------------------------------------------ Aufstieg
    'Aufstieg nach 7 grünen Tagen + Kriterium': () => {
      const s = st([2, 2, 2, 1, 1, 1, 1]);
      gleich(aufstiegStatus(s, { erfuellt: true }, r).moeglich, true);
    },
    'Kein Aufstieg nach 6 grünen Tagen': () => gleich(aufstiegStatus(st([2, 2, 2, 1, 1, 1]), { erfuellt: true }, r).moeglich, false),
    'Kein Aufstieg ohne Kriterium': () => gleich(aufstiegStatus(st([2, 2, 2, 1, 1, 1, 1]), { erfuellt: false }, r).moeglich, false),
    'Kein Aufstieg, wenn heute gelb (trotz 7 grüner Tage davor)': () =>
      gleich(aufstiegStatus(st([2, 2, 2, 1, 1, 1, 1, 4]), { erfuellt: true }, r).moeglich, false),
    'Kriterium S1: 5 × 45 s mit kg erkannt + Bestätigung nötig': () => {
      const e = [einheit(tag(2), 'iso_beinpresse', Array(5).fill(satz({ dauer: 45, kg: 40 })))];
      const k = stufenKriterium(stufen[0], { einheiten: e, stufeSeit: START }, r, ueb);
      gleich([k.auto, k.erfuellt], [true, false]);
      gleich(stufenKriterium(stufen[0], { einheiten: e, stufeSeit: START, bestaetigt: { s1: true } }, r, ueb).erfuellt, true);
    },
    'Kriterium S1: ohne kg nicht erfüllt': () => {
      const e = [einheit(tag(2), 'iso_beinpresse', Array(5).fill(satz({ dauer: 45, kg: null })))];
      gleich(stufenKriterium(stufen[0], { einheiten: e, stufeSeit: START }, r, ueb).auto, false);
    },
    'Kriterium S2: 4 × 8 mit 150 % Körpergewicht automatisch': () => {
      const ok = [einheit(tag(3), 'test_beinpresse_einbeinig', Array(4).fill(satz({ wdh: 8, kg: 120 })))];
      const knapp = [einheit(tag(3), 'test_beinpresse_einbeinig', Array(4).fill(satz({ wdh: 8, kg: 119.5 })))];
      gleich(stufenKriterium(stufen[1], { einheiten: ok, stufeSeit: START, koerpergewicht: 80 }, r, ueb).auto, true);
      gleich(stufenKriterium(stufen[1], { einheiten: knapp, stufeSeit: START, koerpergewicht: 80 }, r, ueb).auto, false);
    },
    'Kriterium S2: ohne Körpergewicht Hinweis': () =>
      wahr(stufenKriterium(stufen[1], { einheiten: [], stufeSeit: START }, r, ueb).detail.includes('Körpergewicht')),
    'Kriterium S3: alle Sprünge einbeinig bei Schmerz ≤ 3': () => {
      const e = { id: 'x', datum: tag(2), abgeschlossen: true, uebungen: [
        { uebungId: 'sp_box_jumps', variante: 'einbeinig', schmerzWaehrend: 3, saetze: [satz({ wdh: 10 })] },
        { uebungId: 'sp_pogo_hops', variante: 'einbeinig', schmerzWaehrend: 2, saetze: [satz({ wdh: 10 })] }] };
      gleich(stufenKriterium(stufen[2], { einheiten: [e], stufeSeit: START }, r, ueb).auto, true);
      e.uebungen[1].variante = 'beidbeinig';
      gleich(stufenKriterium(stufen[2], { einheiten: [e], stufeSeit: START }, r, ueb).auto, false);
    },

    // ------------------------------------------------------------ Rhythmus / Vorschlag (Regel 6)
    'Rhythmus S1: täglich Isometrie': () => gleich(sehneVorschlag(stufen[0], [], tag(0), ueb).typ, 'iso'),
    'Rhythmus: heute schon Sehne gemacht → nichts mehr': () => {
      const e = [einheit(tag(0), 'iso_beinpresse', [satz({ dauer: 45 })])];
      gleich(sehneVorschlag(stufen[0], e, tag(0), ueb).erledigt, 'iso');
    },
    'Rhythmus S2: HSR jeden 2. Tag, dazwischen Iso': () => {
      const e = [einheit(tag(0), 'hsr_beinpresse', [satz({ wdh: 15 })])];
      gleich(sehneVorschlag(stufen[1], e, tag(1), ueb).typ, 'iso');
      gleich(sehneVorschlag(stufen[1], e, tag(2), ueb).typ, 'hsr');
    },
    'Rhythmus S3: Sprung jeden 3. Tag': () => {
      const e = [einheit(tag(0), 'sp_box_jumps', [satz({ wdh: 10 })])];
      wahr(sehneVorschlag(stufen[2], e, tag(2), ueb).typ !== 'sprung');
      gleich(sehneVorschlag(stufen[2], e, tag(3), ueb).typ, 'sprung');
    },
    'Rhythmus S3: HSR höchstens 2×/Woche': () => {
      const e = [einheit(tag(0), 'hsr_beinpresse', [satz({ wdh: 6 })]), einheit(tag(2), 'hsr_beinpresse', [satz({ wdh: 6 })]),
        einheit(tag(3), 'sp_box_jumps', [satz({ wdh: 10 })])];
      gleich(regelFaellig({ typ: 'hsr', proWoche: 2, minAbstandTage: 2 }, e, tag(5), ueb).faellig, false);
      gleich(regelFaellig({ typ: 'hsr', proWoche: 2, minAbstandTage: 2 }, e, tag(7), ueb).faellig, true);
    },
    'Vorschlag: Sperre nach Rot → nur Iso + Oberkörper': () => {
      const s = st([2, 2, 7]);
      const v = tagesvorschlag({ status: s, einheiten: [], heute: tag(2), stufen, plan, ueb }, r);
      gleich([v.sehne.typ, v.sehne.grund, v.unterkoerper.length, v.basketball.length], ['iso', 'sperre', 0, 0]);
      gleich(v.oberkoerper.faellig, true);
    },
    'Vorschlag: HSR-Test in Stufe 1 ab Tag 3 bei Grün': () => {
      gleich(tagesvorschlag({ status: st([2, 2]), einheiten: [], heute: tag(1), stufen, plan, ueb }, r).hsrTest, false);
      gleich(tagesvorschlag({ status: st([2, 2, 2]), einheiten: [], heute: tag(2), stufen, plan, ueb }, r).hsrTest, true);
    },
    'Vorschlag: Oberkörper A/B im Wechsel, alle 3 Tage': () => {
      gleich(naechsteOkEinheit([['ok_a'], ['ok_b']], 'ok_a'), ['ok_b']);
      gleich(naechsteOkEinheit([['ok_a'], ['ok_b']], 'ok_b'), ['ok_a']);
      gleich(naechsteOkEinheit([['ok_a'], ['ok_b']], null), ['ok_a']);
      const e = [einheit(tag(0), 'ok_bankdruecken', [satz({ wdh: 8, kg: 20 })])];
      gleich(tagesvorschlag({ status: st([2, 2]), einheiten: e, heute: tag(1), stufen, plan, ueb }, r).oberkoerper.faellig, false);
      gleich(tagesvorschlag({ status: st([2, 2, 2, 2]), einheiten: e, heute: tag(3), stufen, plan, ueb }, r).oberkoerper.faellig, true);
    },
    'Übungen: Oberkörper Woche 1 = Prehab + Grundkraft A': () => {
      const ids = uebungenFuer('ok', ueb, { planWocheNr: 1, okBloecke: ['ok_a'] }).map((u) => u.id);
      wahr(ids.includes('ph_ytw') && ids.includes('ok_bankdruecken') && !ids.includes('ok_klimmzuege'));
    },
    'Übungen: Grundkraft ab Woche 5 nicht mehr dabei': () =>
      gleich(uebungenFuer('ok', ueb, { planWocheNr: 5, okBloecke: ['ok_a'] }).filter((u) => u.einheitTyp === 'ok_a').length, 0),
    'Ausgrauen: Box Jumps erst ab Stufe 3 (Regel 9)': () => {
      gleich(gesperrtDurchStufe(ueb.sp_box_jumps, 2), true);
      gleich(gesperrtDurchStufe(ueb.sp_box_jumps, 3), false);
      gleich(gesperrtDurchStufe(ueb.ok_bankdruecken, 1), false);
    },

    // ------------------------------------------------------------ Gelb (Regel 4)
    'Gelb: nur Sprünge/Sprints/Basketball −40 %, abgerundet (4 → 2, 6 → 3, 3 → 1)': () => {
      gleich(saetzeHeute({ dosierung: { saetze: 4 }, gelbKuerzen: true }, 'gelb', r), 2);
      gleich(saetzeHeute({ dosierung: { saetze: 6 }, gelbKuerzen: true }, 'gelb', r), 3);
      gleich(saetzeHeute(ueb.sp_box_jumps, 'gelb', r), 1);
      gleich(saetzeHeute(ueb.uk_sprints, 'gelb', r), 3);
    },
    'Gelb: HSR behält die Sätze (4)': () => gleich(saetzeHeute(ueb.hsr_beinpresse, 'gelb', r), 4),
    'Gelb: Isometrie bleibt (5 Sätze)': () => gleich(saetzeHeute(ueb.iso_beinpresse, 'gelb', r), 5),
    'Gelb: Oberkörper unverändert': () => gleich(saetzeHeute(ueb.ok_bankdruecken, 'gelb', r), 3),
    'Grün: keine Kürzung': () => gleich(saetzeHeute(ueb.hsr_beinpresse, 'gruen', r), 4),

    // ------------------------------------------------------------ HSR (Regel 7)
    'HSR: erste Einheit 4 × 15': () => gleich(hsrNaechste(null, r).zielWdh, 15),
    'HSR: 4 × 15 bei Schmerz ≤ 3 geschafft → 12 Wdh., +5–10 % Last': () => {
      const n = hsrNaechste({ zielWdh: 15, schmerzWaehrend: 3, saetze: Array(4).fill(satz({ wdh: 15, kg: 80 })) }, r);
      gleich([n.zielWdh, n.kgMin, n.kgMax, n.kg, n.erfolg], [12, 84, 88, 84, true]);
    },
    'HSR: Schmerz 4 → keine Steigerung': () =>
      gleich(hsrNaechste({ zielWdh: 15, schmerzWaehrend: 4, saetze: Array(4).fill(satz({ wdh: 15, kg: 80 })) }, r).zielWdh, 15),
    'HSR: nur 3 Sätze (z. B. bei Gelb) → keine Steigerung': () =>
      gleich(hsrNaechste({ zielWdh: 12, schmerzWaehrend: 2, saetze: Array(3).fill(satz({ wdh: 12, kg: 80 })) }, r).erfolg, false),
    'HSR: ein Satz unter Ziel-Wdh. → keine Steigerung': () => {
      const s = [satz({ wdh: 10, kg: 80 }), satz({ wdh: 10, kg: 80 }), satz({ wdh: 10, kg: 80 }), satz({ wdh: 9, kg: 80 })];
      gleich(hsrNaechste({ zielWdh: 10, schmerzWaehrend: 2, saetze: s }, r).erfolg, false);
    },
    'HSR: bei 6 Wdh. bleibt es bei 6, nur Last steigt': () => {
      const n = hsrNaechste({ zielWdh: 6, schmerzWaehrend: 1, saetze: Array(4).fill(satz({ wdh: 6, kg: 100 })) }, r);
      gleich([n.zielWdh, n.kgMin], [6, 105]);
    },
    'HSR: Last wird auf 0,5 kg gerundet': () =>
      gleich(hsrNaechste({ zielWdh: 15, schmerzWaehrend: 1, saetze: Array(4).fill(satz({ wdh: 15, kg: 47 })) }, r).kgMin, 49.5),
    'kg vorausfüllen: letzter Wert der Übung': () => {
      const e = [einheit(tag(0), 'ok_bankdruecken', [satz({ wdh: 8, kg: 20 })]), einheit(tag(3), 'ok_bankdruecken', [satz({ wdh: 8, kg: 22.5 })])];
      gleich(letzteKg(e, 'ok_bankdruecken'), 22.5);
      gleich(letzteKg(e, 'ok_rudern'), null);
    },

    // ------------------------------------------------------------ Ergänzung: Median, Rot-Episode, HSR, Sprungtage, Unterkörper, Basketball
    'Median der letzten 3 Tests': () => { gleich(median([3, 1, 2]), 2); gleich(median([2, 7]), 4.5); gleich(median([]), null); },
    'Ampel: +1 gegenüber Median bleibt grün': () => gleich(ampelFuer(3, [2, 2, 2], 0, r).ampel, 'gruen'),
    'Ampel: +2 gegenüber Median → gelb': () => gleich(ampelFuer(3, [1, 1, 1], 0, r).ampel, 'gelb'),
    'Ampel: +3 gegenüber Median → rot': () => gleich(ampelFuer(4, [1, 1, 1], 0, r).ampel, 'rot'),
    'Ampel: Median statt gestern (Ausreißer gestern zählt kaum)': () => gleich(ampelFuer(3, [3, 3, 1], 0, r).ampel, 'gruen'),
    'Ampel: nur die letzten 3 Tests zählen': () => gleich(ampelFuer(3, [0, 0, 0, 2, 2, 2], 0, r).ampel, 'gruen'),
    'Rot-Episode: zweites Rot ohne grünen Tag dazwischen senkt nicht erneut': () => {
      const s = st([2, 7, 5, 7], { wechsel: [{ datum: tag(0), nach: 3, grund: 'manuell' }] });
      gleich([s.stufe, s.rotEpisoden.length, s.sperreAktiv], [2, 1, true]);
    },
    'Rot-Episode: nach grünem Tag beginnt eine neue Episode': () => {
      const s = st([2, 7, 2, 7], { wechsel: [{ datum: tag(0), nach: 3, grund: 'manuell' }] });
      gleich([s.stufe, s.rotEpisoden.length], [1, 2]);
    },
    'Rot-Episode: bleibt es rot, verlängert sich die Sperre': () => {
      const s = rehaStatus({ checks: checks([7, 7, 7]), heute: tag(3), startDatum: START }, r);
      gleich(s.sperreAktiv, true);
    },
    'HSR bei Gelb: gleiche Wiederholungen und Last, keine Steigerung': () => {
      const ok = { zielWdh: 15, schmerzWaehrend: 1, saetze: Array(4).fill(satz({ wdh: 15, kg: 80 })) };
      const n = hsrNaechste(ok, r, { heuteGelb: true });
      gleich([n.zielWdh, n.kg, n.erfolg, n.gelbGesperrt], [15, 80, false, true]);
      gleich(hsrNaechste({ ...ok, ampel: 'gelb' }, r).erfolg, false);
      gleich(hsrNaechste({ ...ok, ampel: 'gruen' }, r).zielWdh, 12);
    },
    'HSR: Woche 1–2 zwei Übungen (Beinpresse, Hackenschmidt), ab Woche 3 drei': () => {
      const o = { stufe: 2, hsrStandard: r.hsr.standard };
      gleich(uebungenFuer('hsr', ueb, { ...o, hsrAnzahl: 2, planWocheNr: 2 }).filter((u) => u.hsr).map((u) => u.id), ['hsr_beinpresse', 'hsr_hackenschmidt']);
      gleich(uebungenFuer('hsr', ueb, { ...o, hsrAnzahl: 3, planWocheNr: 3 }).filter((u) => u.hsr).map((u) => u.id), ['hsr_beinpresse', 'hsr_hackenschmidt', 'hsr_kniebeuge']);
      gleich(plan.wochen.map((w) => w.hsrAnzahl), [2, 2, 3, 3, 3, 3, 3, 3]);
    },
    'HSR-Tausch: Wechselübung ersetzt, statt zusätzlich; Split Squat erst ab Woche 3': () => {
      const o = { stufe: 2, hsrStandard: r.hsr.standard, hsrAnzahl: 3 };
      const ids = (w, t) => uebungenFuer('hsr', ueb, { ...o, planWocheNr: w, tausch: t }).filter((u) => u.hsr).map((u) => u.id);
      gleich(ids(3, { hsr_kniebeuge: 'hsr_beinstrecker' }), ['hsr_beinpresse', 'hsr_hackenschmidt', 'hsr_beinstrecker']);
      gleich(ids(2, { hsr_hackenschmidt: 'hsr_split_squat' })[1], 'hsr_hackenschmidt');
      gleich(ids(3, { hsr_hackenschmidt: 'hsr_split_squat' })[1], 'hsr_split_squat');
    },
    'Sprungtage: ab Stufe 3 Basketball und Sprints nur an Sprungtagen': () => {
      const w3 = [{ datum: tag(0), nach: 3, grund: 'manuell' }];
      const sprung = tagesvorschlag({ status: st([2], { wechsel: w3 }), einheiten: [], heute: tag(0), stufen, plan: { ...plan, start: addTage(START, -28) }, ueb }, r);
      gleich(sprung.sehne.typ, 'sprung'); wahr(sprung.basketball.length > 0); wahr(sprung.unterkoerper.includes('uk_sprints'));
      const e = [einheit(tag(0), 'sp_box_jumps', [satz({ wdh: 10 })])];
      const danach = tagesvorschlag({ status: st([2, 2], { wechsel: w3 }), einheiten: e, heute: tag(1), stufen, plan: { ...plan, start: addTage(START, -28) }, ueb }, r);
      gleich([danach.sehne.typ, danach.basketball.length, danach.basketballVerschoben, danach.unterkoerper.includes('uk_sprints')], ['hsr', 0, true, false]);
    },
    'Sprungtage gelten nicht in Stufe 1–2': () => {
      const v = tagesvorschlag({ status: st([2]), einheiten: [], heute: tag(0), stufen, plan, ueb }, r);
      gleich([v.belastungstag, v.basketball.length > 0], [true, true]);
    },
    'Unterkörper: Block mit erreichter Wochenzahl wird nicht mehr vorgeschlagen': () => {
      const e = [einheit(tag(0), 'uk_rdl', [satz({ wdh: 8, kg: 60 })]), einheit(tag(2), 'uk_nordic', [satz({ wdh: 5 })])];
      const v = tagesvorschlag({ status: st([2, 2, 2, 2]), einheiten: e, heute: tag(3), stufen, plan, ueb }, r);
      gleich(v.ukBloecke.hamstrings.anzahl, 2);
      wahr(!v.unterkoerper.includes('uk_rdl') && v.unterkoerper.includes('uk_hip_thrust'));
      gleich(v.ukFaellig, true);
    },
    'Basketball-Minuten Woche 5: 20–30, bei Gelb −40 % abgerundet (12–18)': () => {
      const p5 = { ...plan, start: addTage(START, -28) };
      gleich(tagesvorschlag({ status: st([2]), einheiten: [], heute: tag(0), stufen, plan: p5, ueb }, r).bbMinuten.max, 30);
      const g = tagesvorschlag({ status: st([2, 2, 4]), einheiten: [], heute: tag(2), stufen, plan: p5, ueb }, r).bbMinuten;
      gleich([g.min, g.max, g.gelb], [12, 18, true]);
    },
    'Basketball-Belastung: höchstens +20 % zur Vorwoche': () => {
      const bb = (datum, min, rpe) => ({ id: datum, datum, abgeschlossen: true, uebungen: [], bbMinuten: min, bbAnstrengung: rpe });
      const b = bbBelastung([bb(addTage(START, -7), 20, 5), bb(START, 26, 5)], START, r);
      gleich([b.letzte, b.max, b.diese, b.ueber], [100, 120, 130, true]);
      gleich(bbBelastung([bb(addTage(START, -7), 20, 5), bb(START, 24, 5)], START, r).ueber, false);
    },
    'Sprints Woche 6: 8 × 80–90 %': () => gleich([ueb.uk_sprints.dosierung.nachWoche['6'].saetze, ueb.uk_sprints.dosierung.nachWoche['6'].intensitaet], [8, '80–90 %']),

    // ------------------------------------------------------------ Plan
    'Plan: 23.11. = Woche 1, 30.11. = Woche 2, 18.01. = nach Plan': () => {
      gleich(planWoche(plan, '2026-11-23').nr, 1);
      gleich(planWoche(plan, '2026-11-30').nr, 2);
      gleich(planWoche(plan, '2027-01-17').nr, 8);
      wahr(planWoche(plan, '2027-01-18').nachPlan);
      wahr(planWoche(plan, '2026-11-20').vorPlan);
    },
    'Prognose Stufe 1, Tag 1: 56 Tage Mindestdauer, realistisch +14': () => {
      const p = prognose(st([2]), tag(0), r);
      gleich([p.fruehestens, p.realistisch, p.restTage, p.plusTage], [addTage(tag(0), 56), addTage(tag(0), 70), 56, 0]);
    },
    'Prognose: gelbe Tage +1, Rot-Episode +7 (in der aktuellen Stufe)': () => {
      const p = prognose(st([2, 4, 2, 2]), tag(3), r); // 1 gelber Tag, Tag 4 in Stufe 1
      gleich([p.restTage, p.plusTage], [56 - 3, 1]);
      const q = prognose(st([2, 7]), tag(1), r); // Rot-Episode in Stufe 1 (keine Rückstufung möglich)
      gleich(q.plusTage, 7);
    },
    'Prognose Stufe 2, Tag 5: 21+14+14 − 4 Tage': () => {
      const s = st([2, 2, 2, 2, 2], { wechsel: [{ datum: tag(0), nach: 2, grund: 'manuell' }] });
      gleich(prognose(s, tag(4), r).restTage, 45);
    },

    // ------------------------------------------------------------ Return to Play
    'LSI: Weite 180/200 = 90 %, Zeit 2,2 s vs 2,0 s = 90,9 %': () => {
      gleich(lsi(180, 200), 90);
      gleich(lsi(2.2, 2.0, true), 90.9);
    },
    'Morgenschmerz 7 Tage nicht gestiegen': () => {
      const v = checks([2, 2, 1, 1, 1, 0, 0]).map((c) => ({ ...c }));
      gleich(morgenStabil(v, tag(6), 7), true);
      gleich(morgenStabil(checks([2, 2, 1, 2, 1, 0, 0]), tag(6), 7), false);
      gleich(morgenStabil(checks([1, 1, 1, 1, 1, 1]), tag(6), 7), false); // Tag fehlt
    },
    'RTP: alle Punkte erfüllt': () => {
      const v = checks([2, 2, 1, 1, 1, 0, 0]);
      const c = { sprungweiteL: 200, sprungweiteR: 182, sprungSchmerz: 2, hop6mL: 2.0, hop6mR: 2.1, hopOhneAnstieg: true, teamtraining: true, selbsteinschaetzung: 92 };
      const a = rtpAuswertung(c, { verlauf: v, heute: tag(6), bein: 'rechts' }, r);
      gleich(a.alleErfuellt, true); gleich(a.lsiSprung, 91);
      gleich(rtpAuswertung({ ...c, sprungweiteR: 170 }, { verlauf: v, heute: tag(6), bein: 'rechts' }, r).alleErfuellt, false);
    },

    // ------------------------------------------------------------ Daten
    'Jede Übung: Suchbegriff, Quelle, Status, Kategorie, minStufe': () => {
      for (const u of uebungen) wahr(u.suchbegriff && u.quelle && ['gesichert', 'OFFEN', 'ergänzend'].includes(u.status) && u.kategorie && u.minStufe >= 1, u.id);
    },
    'Plan verweist nur auf vorhandene Übungen': () => {
      for (const w of plan.wochen) for (const id of [...w.ukUebungen, ...w.bbUebungen]) wahr(ueb[id], id);
    },
    'YouTube-Link ist ein Suchlink mit kodierten Umlauten': () =>
      gleich(youtubeUrl('Übung Schrägbrett'), 'https://www.youtube.com/results?search_query=%C3%9Cbung%20Schr%C3%A4gbrett'),

    // ------------------------------------------------------------ Timer / Datum (unverändert)
    'Timer: Halten 45 s → Pause 120 s → fertig': () => {
      const t = { startMs: 0, halteS: 45, pauseS: 120 };
      gleich(segmentStatus(t, 10_000).phase, 'halten');
      gleich(segmentStatus(t, 46_000).phase, 'pause');
      gleich(segmentStatus(t, 166_000).phase, 'fertig');
    },
    'Datum: Tage, Wochenstart, Format': () => {
      gleich(diffTage('2026-10-31', '2026-11-01'), 1);
      gleich(wochenStart('2026-11-29'), '2026-11-23');
      gleich(addTage('2026-12-31', 1), '2027-01-01');
      gleich(deDatum('2026-11-23'), '23.11.2026');
      gleich(parseZahl('2,5'), 2.5);
    },
  };
}
