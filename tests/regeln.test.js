import { gleich, wahr } from './runner.js';
import {
  ampel, einheitRot, reduktionAktiv, faelligePruefung, pauseStatus, phasenwechselStatus,
  exzProgression, plyoEinheitenWoche, plyoErlaubt, istTrainingstag, faellig, youtubeUrl, wirksameDosierung, planUebungen,
} from '../js/regeln.js';
import { segmentStatus } from '../js/timer.js';
import { diffTage, wochenStart, addTage, deDatum, parseZahl } from '../js/util.js';

const einheit = (id, datum, schmerz, extra = {}) => ({
  id, datumISO: datum, startISO: `${datum}T10:00:00.000Z`, abgeschlossen: true, phase: 'stufe1',
  uebungen: [{ uebungId: 'iso_decline_squat', schmerzWaehrend: schmerz, saetzeErledigt: 5 }], ...extra,
});

export function tests({ regeln: r, phasen, uebungen }) {
  const ueb = Object.fromEntries(uebungen.map((u) => [u.id, u]));
  return {
    // ---------- Ampel ----------
    'Ampel: 0 und 3 sind grün': () => { gleich(ampel(0, r), 'gruen'); gleich(ampel(3, r), 'gruen'); },
    'Ampel: 4 und 5 sind gelb': () => { gleich(ampel(4, r), 'gelb'); gleich(ampel(5, r), 'gelb'); },
    'Ampel: 6 und 10 sind rot': () => { gleich(ampel(6, r), 'rot'); gleich(ampel(10, r), 'rot'); },
    'Ampel: kein Wert → keine Ampel': () => { gleich(ampel(null, r), null); gleich(ampel('', r), null); },
    'Ampel: Schwellen kommen aus regeln.json': () => {
      const r2 = { ...r, ampel: { ...r.ampel, gruen_max: 2, gelb_max: 4 } };
      gleich(ampel(3, r2), 'gelb'); gleich(ampel(5, r2), 'rot');
    },

    // ---------- Reduktion ----------
    'Reduktion: Schmerz 6 → nächste Einheit reduzieren': () => {
      const red = reduktionAktiv([einheit('a', '2026-11-01', 6)], r);
      wahr(red && red.wert === 6);
    },
    'Reduktion: Schmerz 5 → keine Reduktion': () => gleich(reduktionAktiv([einheit('a', '2026-11-01', 5)], r), null),
    'Reduktion: verschwindet nach einer neuen, unauffälligen Einheit': () =>
      gleich(reduktionAktiv([einheit('a', '2026-11-01', 7), einheit('b', '2026-11-02', 3)], r), null),
    'Rot-Einheit wird erkannt (nur Schmerz während)': () => {
      wahr(einheitRot(einheit('a', '2026-11-01', 6), r));
      wahr(!einheitRot({ ...einheit('a', '2026-11-01', 2), schmerzNach: 8 }, r));
    },
    '7-Tage-Frage: nach 6 Tagen noch nicht, nach 7 Tagen fällig': () => {
      const ev = [{ id: 'e', typ: 'rot', datumISO: '2026-11-01', wert: 7, antwort: null }];
      gleich(faelligePruefung(ev, '2026-11-07', r), null);
      gleich(faelligePruefung(ev, '2026-11-08', r)?.id, 'e');
    },
    '7-Tage-Frage: beantwortet → nicht mehr fällig': () =>
      gleich(faelligePruefung([{ id: 'e', typ: 'rot', datumISO: '2026-11-01', antwort: 'besser' }], '2026-11-20', r), null),
    'Pause: "nicht besser" → Programm pausieren': () => {
      const p = pauseStatus({ ereignisse: [{ typ: 'rot', antwort: 'nicht_besser', antwortISO: '2026-11-08T08:00:00Z' }] });
      wahr(p.aktiv); gleich(p.grund, 'keine_besserung');
    },
    'Pause: zunehmende Alltagsschmerzen → Programm pausieren': () => {
      const p = pauseStatus({ morgen: [{ alltagsschmerzZunahme: true, erfasstISO: '2026-11-08T07:00:00Z' }] });
      wahr(p.aktiv); gleich(p.grund, 'alltagsschmerz');
    },
    'Pause: nach Quittierung aus, bei neuem Auslöser wieder an': () => {
      const m1 = { alltagsschmerzZunahme: true, erfasstISO: '2026-11-08T07:00:00Z' };
      gleich(pauseStatus({ morgen: [m1], quittiertISO: '2026-11-09T07:00:00Z' }).aktiv, false);
      const m2 = { alltagsschmerzZunahme: true, erfasstISO: '2026-11-10T07:00:00Z' };
      gleich(pauseStatus({ morgen: [m1, m2], quittiertISO: '2026-11-09T07:00:00Z' }).aktiv, true);
    },

    // ---------- Phasenwechsel ----------
    'Phasenwechsel: Schmerz 3 + mühelos + Physio → bereit': () => {
      const st = phasenwechselStatus('stufe1', [einheit('a', '2026-11-01', 3)], { k1_muehelos: true, k1_physio: true }, phasen, r);
      wahr(st.schmerzOk); wahr(st.bereit); gleich(st.nach, 'stufe2');
    },
    'Phasenwechsel: Schmerz 4 → nicht bereit, auch mit Häkchen': () => {
      const st = phasenwechselStatus('stufe1', [einheit('a', '2026-11-01', 4)], { k1_muehelos: true, k1_physio: true }, phasen, r);
      gleich(st.schmerzOk, false); gleich(st.bereit, false);
    },
    'Phasenwechsel: Schmerz 2, aber nicht als mühelos bestätigt → nicht bereit': () => {
      const st = phasenwechselStatus('stufe1', [einheit('a', '2026-11-01', 2)], { k1_physio: true }, phasen, r);
      gleich(st.bereit, false);
    },
    'Phasenwechsel: ohne Einheit → nicht bereit': () => {
      const st = phasenwechselStatus('stufe1', [], { k1_muehelos: true, k1_physio: true }, phasen, r);
      gleich(st.bereit, false);
    },
    'Phasenwechsel: maßgeblich ist die letzte Einheit': () => {
      const st = phasenwechselStatus('stufe1', [einheit('a', '2026-11-01', 2), einheit('b', '2026-11-02', 5)], { k1_muehelos: true, k1_physio: true }, phasen, r);
      gleich(st.letzterWert, 5); gleich(st.bereit, false);
    },
    'Phasenwechsel Stufe 2→3: Schwelle OFFEN, nur Checkliste': () => {
      const st = phasenwechselStatus('stufe2', [], { k2_tolerierbar: true, k2_physio: true }, phasen, r);
      wahr(st.schwelleOffen); wahr(st.bereit);
    },

    // ---------- Progression ----------
    'Progression: 1×15 beschwerdefrei → 2×15': () => {
      const e = { beschwerdefrei: true, uebungen: [{ uebungId: 'exz_decline_squat', saetzeErledigt: 1, schmerzWaehrend: 2 }] };
      const p = exzProgression(e, 0, r);
      gleich(p.typ, 'steigern'); gleich(p.nach, { saetze: 2, wiederholungen: 15 });
    },
    'Progression: 2×15 → 3×15': () => {
      const e = { beschwerdefrei: true, uebungen: [{ uebungId: 'exz_decline_squat', saetzeErledigt: 2, schmerzWaehrend: 2 }] };
      gleich(exzProgression(e, 1, r).nach, { saetze: 3, wiederholungen: 15 });
    },
    'Progression: 3×15 beschwerdefrei → Zusatzlast': () => {
      const e = { beschwerdefrei: true, uebungen: [{ uebungId: 'exz_decline_squat', saetzeErledigt: 3, schmerzWaehrend: 1 }] };
      gleich(exzProgression(e, 2, r).typ, 'zusatzlast');
    },
    'Progression: nicht beschwerdefrei → nichts': () => {
      const e = { beschwerdefrei: false, uebungen: [{ uebungId: 'exz_decline_squat', saetzeErledigt: 3 }] };
      gleich(exzProgression(e, 2, r), null);
    },
    'Progression: zu wenige Sätze → nichts': () => {
      const e = { beschwerdefrei: true, uebungen: [{ uebungId: 'exz_decline_squat', saetzeErledigt: 1 }] };
      gleich(exzProgression(e, 1, r), null);
    },
    'Progression: rote Einheit trotz "beschwerdefrei" → nichts': () => {
      const e = { beschwerdefrei: true, uebungen: [{ uebungId: 'exz_decline_squat', saetzeErledigt: 1, schmerzWaehrend: 6 }] };
      gleich(exzProgression(e, 0, r), null);
    },

    // ---------- Plyometrie / Wochenplan / Erinnerungen ----------
    'Plyometrie: höchstens 2× pro Woche': () => {
      const p = (id, d) => ({ id, datumISO: d, startISO: d, abgeschlossen: true, uebungen: [{ uebungId: 'box_jumps', saetzeErledigt: 3 }] });
      const n = plyoEinheitenWoche([p('a', '2026-11-09'), p('b', '2026-11-11'), p('c', '2026-11-02')], '2026-11-12', ueb);
      gleich(n, 2); gleich(plyoErlaubt(n, r), false); gleich(plyoErlaubt(1, r), true);
    },
    'Wochenplan: Dienstag ist Trainingstag, Mittwoch nicht': () => {
      wahr(istTrainingstag([2], '2026-11-10')); wahr(!istTrainingstag([2], '2026-11-11'));
    },
    'Erinnerung: nie exportiert → fällig; nach 13 Tagen nein, nach 14 ja': () => {
      wahr(faellig(null, '2026-11-10', 14));
      wahr(!faellig('2026-10-28', '2026-11-10', 14));
      wahr(faellig('2026-10-27T10:00:00Z', '2026-11-10', 14));
    },

    // ---------- Dosierung / Plan / YouTube ----------
    'Dosierung: eigener Wert ersetzt OFFEN-Feld': () => {
      const d = wirksameDosierung(ueb.hsr, { saetze: 4, tempo: '3-0-3' });
      gleich(d.saetze.wert, 4); wahr(d.saetze.eigen); gleich(d.tempo.text, '3-0-3'); gleich(d.pause_s.wert, null);
    },
    'Plan Stufe 2: Standard nur Exzentrik, HSR zuschaltbar': () => {
      const st2 = phasen.find((p) => p.id === 'stufe2');
      gleich(planUebungen(st2, {}).haupt, ['exz_decline_squat']);
      gleich(planUebungen(st2, { hsr: true }).haupt, ['exz_decline_squat', 'hsr']);
    },
    'Isometrie-Standard: 5×45 s, Pause 60 s': () => {
      const d = ueb.iso_decline_squat.dosierung;
      gleich([d.saetze.wert, d.haltezeit_s.wert, d.pause_s.wert], [5, 45, 60]);
    },
    'YouTube-Link ist ein Suchlink mit kodierten Umlauten': () => {
      gleich(youtubeUrl('Übung Schrägbrett'), 'https://www.youtube.com/results?search_query=%C3%9Cbung%20Schr%C3%A4gbrett');
    },
    'Jede Übung hat Suchbegriff, Quelle und Status': () => {
      for (const u of uebungen) wahr(u.suchbegriff && u.quelle && ['gesichert', 'OFFEN', 'ergänzend'].includes(u.status), u.id);
    },

    // ---------- Timer ----------
    'Timer: Halten → Pause → fertig (Zeitstempel)': () => {
      const t = { startMs: 0, halteS: 45, pauseS: 60 };
      gleich(segmentStatus(t, 10_000).phase, 'halten');
      gleich(Math.round(segmentStatus(t, 10_000).rest), 35);
      gleich(segmentStatus(t, 46_000).phase, 'pause');
      gleich(segmentStatus(t, 106_000).phase, 'fertig');
    },
    'Timer: nach langer Sperre direkt richtig': () => gleich(segmentStatus({ startMs: 0, halteS: 45, pauseS: 60 }, 600_000).phase, 'fertig'),
    'Timer: letzter Satz ohne Pause': () => gleich(segmentStatus({ startMs: 0, halteS: 45, pauseS: 60, ohnePause: true }, 46_000).phase, 'fertig'),

    // ---------- Datum ----------
    'Datum: Tage, Wochenstart, Format': () => {
      gleich(diffTage('2026-10-31', '2026-11-01'), 1);
      gleich(diffTage('2026-03-28', '2026-03-30'), 2); // über Zeitumstellung
      gleich(wochenStart('2026-11-15'), '2026-11-09');
      gleich(addTage('2026-12-31', 1), '2027-01-01');
      gleich(deDatum('2026-11-10'), '10.11.2026');
      gleich(parseZahl('2,5'), 2.5);
    },
  };
}
