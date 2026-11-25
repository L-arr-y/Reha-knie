import { gleich, wahr } from './runner.js';
import {
  feld, parse, BOM, erkenneTyp, importieren, nurNeue, dateiname,
  exportMorgenchecks, exportEinheiten, exportSaetze, exportStufen, exportRtp, exportVisap, exportEinstellungen,
} from '../js/csv.js';

const checks = [
  { datum: '2026-11-23', sls: 2, steifigkeit: null, ampel: 'gruen', notiz: 'Schrägbrett 25°; „gut“', erfasstISO: '2026-11-23T06:30:00.000Z' },
  { datum: '2026-11-24', sls: 4, steifigkeit: 3, ampel: 'gelb', notiz: 'Zeile 1\nZeile 2', erfasstISO: '2026-11-24T06:31:00.000Z' },
];
const einheit = {
  id: 'e1', datum: '2026-11-24', startISO: '2026-11-24T17:00:00.000Z', endeISO: '2026-11-24T18:00:00.000Z', stufe: 2, ampel: 'gelb',
  teile: ['sehne', 'ok'], okBlock: 'ok_a', planWoche: 1, abgeschlossen: true, schmerzDanach: 3, notiz: 'Gerät 3; Sitz 5 – "ok"', bbMinuten: 25, bbAnstrengung: 6.5,
  uebungen: [
    { uebungId: 'hsr_beinpresse', name: 'Beinpresse (HSR)', teil: 'sehne', kg: 82.5, zielSaetze: 2, zielWdh: 15, zielDauer: null, variante: null, schmerzWaehrend: 3, rir: null, erledigt: true,
      saetze: [{ wdh: 15, kg: 82.5, erledigt: true }, { wdh: 14, kg: 80, erledigt: true }] },
    { uebungId: 'ok_bankdruecken', name: 'Kurzhantel-Bankdrücken', teil: 'ok', kg: 22.5, zielSaetze: 3, zielWdh: 8, rir: 2, erledigt: false,
      saetze: [{ wdh: 8, kg: 22.5, erledigt: true }, { erledigt: false }, { erledigt: false }] },
  ],
};
const offen = { ...einheit, id: 'e2', abgeschlossen: false };
const verlauf = [{ datum: '2026-11-23', von: null, nach: 1, grund: 'start' }, { datum: '2026-11-30', von: 1, nach: 2, grund: 'aufstieg' }, { datum: '2026-12-03', von: 2, nach: 1, grund: 'rot' }];
const wechsel = [{ id: 'w1', datum: '2026-11-30', nach: 2, grund: 'aufstieg', zeitISO: '2026-11-30T09:00:00.000Z' }];
const rtp = [{ id: 'r1', datum: '2027-01-15', sprungweiteL: 182.5, sprungweiteR: 200, sprungSchmerz: 2, hop6mL: 2.1, hop6mR: 2.0, hopOhneAnstieg: true, teamtraining: false, selbsteinschaetzung: 88 }];
const visap = [{ id: 'v1', datum: '2026-11-23', score: 62, notiz: 'Ausgangswert' }, { id: 'v2', datum: '2026-12-21', score: 75.5, notiz: '' }];

const rundlauf = () => importieren({
  morgenchecks: parse(exportMorgenchecks(checks)),
  einheiten: parse(exportEinheiten([einheit])),
  saetze: parse(exportSaetze([einheit])),
  stufen: parse(exportStufen(verlauf, wechsel)),
  rtp: parse(exportRtp(rtp)),
  visap: parse(exportVisap(visap)),
  einstellungen: parse(exportEinstellungen({ koerpergewicht: 80.5, bein: 'links', regelWerte: { 'ampel.gruenMax': 2 } }, ['koerpergewicht', 'bein', 'regelWerte'])),
});

export function tests() {
  return {
    'CSV: beginnt mit BOM (UTF-8 für Excel)': () => wahr(exportVisap(visap).startsWith(BOM)),
    'CSV: Semikolon, deutsche Kopfzeile, CRLF': () => gleich(exportVisap(visap).slice(1).split('\r\n')[0], 'VISA-P-ID;Datum;Datum (ISO);Score;Notiz'),
    'CSV: Datum TT.MM.JJJJ plus ISO-Spalte': () => gleich(exportVisap(visap).split('\r\n')[1], 'v1;23.11.2026;2026-11-23;62;Ausgangswert'),
    'CSV: Dezimalkomma bei kg (82,5 / 22,5) und Score (75,5)': () => {
      wahr(exportEinheiten([einheit]).includes(';82,5;'));
      wahr(exportSaetze([einheit]).includes(';82,5;ja'));
      wahr(exportVisap(visap).includes(';75,5;'));
    },
    'CSV: Feld mit ; " und Zeilenumbruch wird korrekt eingeschlossen': () => gleich(feld('a;b "c"\nd'), '"a;b ""c""\nd"'),
    'CSV: ja/nein statt true/false, leer statt null': () => { gleich(feld(true), 'ja'); gleich(feld(false), 'nein'); gleich(feld(null), ''); },
    'CSV: Umlaute bleiben erhalten': () => wahr(exportEinheiten([einheit]).includes('Kurzhantel-Bankdrücken') && exportMorgenchecks(checks).includes('Schrägbrett')),
    'CSV: Ampel als grün/gelb/rot, Stufe je Morgentest': () => {
      const rows = parse(exportMorgenchecks(checks, (d) => (d === '2026-11-24' ? { stufe: 2, ampel: 'gelb' } : { stufe: 1, ampel: 'gruen' })));
      gleich([rows[1][4], rows[1][5], rows[2][4], rows[2][5]], ['grün', '1', 'gelb', '2']);
    },
    'CSV: nicht abgeschlossene Einheit wird nicht exportiert': () => gleich(parse(exportEinheiten([einheit, offen])).length, 3),
    'CSV: Sätze-Datei hat eine Zeile pro Satz': () => gleich(parse(exportSaetze([einheit])).length, 6),
    'CSV: Stufen inkl. Rot-Rückstufung': () => {
      const rows = parse(exportStufen(verlauf, wechsel));
      gleich(rows.length, 4); gleich(rows[3][5], 'rot'); gleich(rows[2][0], 'w1');
    },
    'CSV: Dateityp wird an der Kopfzeile erkannt': () => {
      gleich(erkenneTyp(parse(exportMorgenchecks(checks))), 'morgenchecks');
      gleich(erkenneTyp(parse(exportEinheiten([einheit]))), 'einheiten');
      gleich(erkenneTyp(parse(exportSaetze([einheit]))), 'saetze');
      gleich(erkenneTyp(parse(exportStufen(verlauf, wechsel))), 'stufen');
      gleich(erkenneTyp(parse(exportRtp(rtp))), 'rtp');
      gleich(erkenneTyp(parse(exportVisap(visap))), 'visap');
      gleich(erkenneTyp(parse('a;b\n1;2')), null);
    },
    'Rundlauf: Morgentests ohne Verlust (Notiz mit ; " und Umbruch)': () => {
      const n = rundlauf();
      gleich(n.morgenchecks.map((c) => [c.datum, c.sls, c.steifigkeit, c.ampel, c.notiz, c.erfasstISO]),
        checks.map((c) => [c.datum, c.sls, c.steifigkeit, c.ampel, c.notiz, c.erfasstISO]));
    },
    'Rundlauf: Einheit mit Übungen, kg je Satz, Notiz': () => {
      const e = rundlauf().einheiten[0];
      gleich([e.id, e.datum, e.startISO, e.stufe, e.ampel, e.teile, e.okBlock, e.schmerzDanach, e.notiz],
        ['e1', '2026-11-24', einheit.startISO, 2, 'gelb', ['sehne', 'ok'], 'ok_a', 3, einheit.notiz]);
      gleich(e.uebungen[0].saetze, einheit.uebungen[0].saetze.map((s) => ({ wdh: s.wdh, dauer: null, kg: s.kg, erledigt: true })));
      gleich([e.uebungen[0].kg, e.uebungen[0].zielWdh, e.uebungen[1].rir, e.uebungen[1].erledigt], [82.5, 15, 2, false]);
      gleich([e.bbMinuten, e.bbAnstrengung], [25, 6.5]);
      gleich(e.uebungen[1].saetze.map((s) => s.erledigt), [true, false, false]);
    },
    'Rundlauf: nur bewusste Stufenwechsel, Rot wird neu berechnet': () => {
      const w = rundlauf().stufenwechsel;
      gleich(w, [{ id: 'w1', datum: '2026-11-30', nach: 2, grund: 'aufstieg', zeitISO: '2026-11-30T09:00:00.000Z' }]);
    },
    'Rundlauf: Return-to-Play, VISA-P, Einstellungen': () => {
      const n = rundlauf();
      gleich([n.rtpchecks[0].sprungweiteL, n.rtpchecks[0].hopOhneAnstieg, n.rtpchecks[0].teamtraining, n.rtpchecks[0].selbsteinschaetzung], [182.5, true, false, 88]);
      gleich(n.visap.map((v) => v.score), [62, 75.5]);
      gleich(n.einstellungen, { koerpergewicht: 80.5, bein: 'links', regelWerte: { 'ampel.gruenMax': 2 } });
    },
    'Import liest auch Datum ohne ISO-Spalte (TT.MM.JJJJ)': () =>
      gleich(importieren({ visap: parse('VISA-P-ID;Datum;Datum (ISO);Score;Notiz\nx;3.2.2027;;70;') }).visap[0].datum, '2027-02-03'),
    'Zusammenführen übernimmt nur neue Datensätze': () => {
      const n = nurNeue({ morgenchecks: [{ datum: '2026-11-23' }], einheiten: [{ id: 'e1' }], stufenwechsel: [], rtpchecks: [], visap: [{ id: 'v1' }] }, rundlauf());
      gleich([n.morgenchecks.length, n.einheiten.length, n.stufenwechsel.length, n.visap.length], [1, 0, 1, 1]);
    },
    'Dateiname mit Datum': () => gleich(dateiname('saetze', '2026-11-23'), 'reha_saetze_2026-11-23.csv'),
  };
}
