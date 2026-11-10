import { gleich, wahr } from './runner.js';
import { feld, parse, exportEinheiten, exportSchmerz, exportVisap, erkenneTyp, importieren, nurNeue, BOM, dateiname } from '../js/csv.js';

const einheit = {
  id: 'e1', datumISO: '2026-11-09', startISO: '2026-11-09T07:30:00.000Z', endeISO: '2026-11-09T08:00:00.000Z',
  phase: 'stufe2', abgeschlossen: true, schmerzVor: 2, schmerzNach: 3, beschwerdefrei: true, muskelkater: null,
  notiz: 'Brett 25°; rechtes Bein, "gut"\nzweite Zeile – Übung schön',
  uebungen: [
    { uebungId: 'exz_decline_squat', name: 'Exzentrische Kniebeuge auf schräger Ebene', saetzeGeplant: 3, saetzeErledigt: 3, wdh: 15, halteS: null, pauseS: null, zusatzlastKg: 2.5, schmerzWaehrend: 4, erledigt: true },
    { uebungId: 'faszienrolle', name: 'Faszienrolle (Selbstmassage Beine)', saetzeGeplant: null, saetzeErledigt: 0, schmerzWaehrend: null, erledigt: false, abgebrochen: true },
  ],
};
const offen = { ...einheit, id: 'e2', abgeschlossen: false };
const morgen = [{ datumISO: '2026-11-10', bezugDatumISO: '2026-11-09', schmerz: 1, alltagsschmerzZunahme: false, notiz: 'Treppe ok', erfasstISO: '2026-11-10T06:00:00Z' }];
const visap = [{ id: 'v1', datumISO: '2026-11-01', score: 62, notiz: 'Ausgangswert' }, { id: 'v2', datumISO: '2026-11-29', score: 75.5, notiz: '' }];

export function tests() {
  return {
    'CSV: beginnt mit BOM (UTF-8 für Excel)': () => wahr(exportVisap(visap).startsWith(BOM)),
    'CSV: Semikolon als Trennzeichen, Kopfzeile auf Deutsch': () =>
      gleich(exportVisap(visap).slice(1).split('\r\n')[0], 'VISA-P-ID;Datum;Datum (ISO);Score;Notiz'),
    'CSV: Datum TT.MM.JJJJ plus ISO-Spalte': () => gleich(exportVisap(visap).split('\r\n')[1], 'v1;01.11.2026;2026-11-01;62;Ausgangswert'),
    'CSV: Dezimalkomma (75,5 und 2,5 kg)': () => {
      wahr(exportVisap(visap).includes(';75,5;'));
      wahr(exportEinheiten([einheit]).includes(';2,5;'));
    },
    'CSV: Feld mit ; " und Zeilenumbruch wird korrekt eingeschlossen': () =>
      gleich(feld('a;b "c"\nd'), '"a;b ""c""\nd"'),
    'CSV: ja/nein statt true/false, leer statt null': () => { gleich(feld(true), 'ja'); gleich(feld(false), 'nein'); gleich(feld(null), ''); },
    'CSV: Umlaute bleiben erhalten': () => wahr(exportEinheiten([einheit]).includes('Exzentrische Kniebeuge auf schräger Ebene')),
    'CSV: nicht abgeschlossene Einheit wird nicht exportiert': () =>
      gleich(parse(exportSchmerz([einheit, offen], morgen)).length, 2),
    'CSV: Einheiten-Datei hat eine Zeile pro Übung': () => gleich(parse(exportEinheiten([einheit])).length, 3),
    'CSV: Schmerz-Datei enthält nächsten Morgen': () => {
      const rows = parse(exportSchmerz([einheit], morgen));
      const i = rows[0].indexOf('Schmerz nächster Morgen');
      gleich(rows[1][i], '1');
      gleich(rows[1][rows[0].indexOf('Stärkster Schmerz während')], '4');
    },
    'CSV: Parser liest Notiz mit ; " Umbruch zurück': () => {
      const rows = parse(exportSchmerz([einheit], morgen));
      gleich(rows[1][rows[0].indexOf('Notiz')], einheit.notiz);
    },
    'CSV: Dateityp wird an der Kopfzeile erkannt': () => {
      gleich(erkenneTyp(parse(exportEinheiten([einheit]))), 'einheiten');
      gleich(erkenneTyp(parse(exportSchmerz([einheit], morgen))), 'schmerz');
      gleich(erkenneTyp(parse(exportVisap(visap))), 'visap');
      gleich(erkenneTyp(parse('a;b\n1;2')), null);
    },
    'CSV: Export → Import ohne Verlust (Rundlauf)': () => {
      const neu = importieren({
        einheiten: parse(exportEinheiten([einheit])),
        schmerz: parse(exportSchmerz([einheit], morgen)),
        visap: parse(exportVisap(visap)),
      });
      const e = neu.einheiten[0];
      gleich([e.id, e.datumISO, e.startISO, e.phase, e.schmerzVor, e.schmerzNach, e.beschwerdefrei, e.notiz],
        [einheit.id, einheit.datumISO, einheit.startISO, 'stufe2', 2, 3, true, einheit.notiz]);
      gleich(e.uebungen.length, 2);
      gleich([e.uebungen[0].zusatzlastKg, e.uebungen[0].saetzeErledigt, e.uebungen[0].wdh, e.uebungen[0].schmerzWaehrend, e.uebungen[0].erledigt], [2.5, 3, 15, 4, true]);
      gleich(e.uebungen[1].abgebrochen, true);
      gleich(neu.morgen[0].schmerz, 1); gleich(neu.morgen[0].datumISO, '2026-11-10'); gleich(neu.morgen[0].notiz, 'Treppe ok');
      gleich(neu.visap.map((v) => v.score), [62, 75.5]);
    },
    'CSV: Import liest auch Datum ohne ISO-Spalte (TT.MM.JJJJ)': () => {
      const neu = importieren({ visap: parse('VISA-P-ID;Datum;Datum (ISO);Score;Notiz\nx;3.2.2027;;70;') });
      gleich(neu.visap[0].datumISO, '2027-02-03');
    },
    'CSV: Zusammenführen übernimmt nur neue Datensätze': () => {
      const n = nurNeue({ einheiten: [{ id: 'e1' }], morgen: [], visap: [{ id: 'v1' }] },
        { einheiten: [{ id: 'e1' }, { id: 'e9' }], morgen: [{ datumISO: '2026-11-10' }], visap: [{ id: 'v1' }, { id: 'v2' }] });
      gleich([n.einheiten.length, n.morgen.length, n.visap.length], [1, 1, 1]);
    },
    'CSV: Dateiname mit Datum': () => gleich(dateiname('schmerz', '2026-11-10'), 'reha_schmerz_2026-11-10.csv'),
  };
}
