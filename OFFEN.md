# Welche OFFEN-Felder muss ich noch klären?

Diese Punkte fehlen in deinen Quellen (`docs/quellen_extraktion.md`). Die App erfindet dafür keine Werte.
Am besten mit deinem Physio/Arzt durchgehen und dann eintragen: in der App unter **Einstellungen → Eigene Werte** oder direkt in `data/*.json`.

## Übungen (Dosierung)

| Übung | Was fehlt | Wo eintragen |
|---|---|---|
| **Heavy Slow Resistance (HSR)** – Stufe 2 | konkrete Übung (Beinpresse? Kniebeuge?), Sätze, Wiederholungen, Last, Tempo, Pause, Einheiten pro Woche | Einstellungen → Eigene Werte → HSR · `uebungen.json` → `hsr` |
| Exzentrische Kniebeuge | Pause zwischen den Sätzen | Eigene Werte · `exz_decline_squat.dosierung.pause_s` |
| Exzentrische Kniebeuge | Höhe und Schrittweite der Zusatzlast (nach 3×15 beschwerdefrei) | Zusatzlast-Feld beim Training · `regeln.json` → `zusatzlast.schritt_kg` |
| Depth Jumps | Satzzahl | Eigene Werte · `depth_jumps.dosierung.saetze` |
| Dehnen Oberschenkel | Sätze, Haltezeit, Häufigkeit | Eigene Werte · `dehnen_oberschenkel` |
| Faszienrolle | Dauer pro Einheit | Eigene Werte · `faszienrolle.dosierung.dauer_min` |

## Regeln und Ablauf

- [ ] **Erlaubter Schmerz am Folgetag** (nächster Morgen): Die App erfasst den Wert nur und zeigt ihn im Verlauf, bewertet ihn aber nicht. → `regeln.json` → `folgetag_schmerz`
- [ ] **Wochenstruktur:** Welche Tage Training, welche Ruhe? Standard sind 7 Trainingstage, bis du etwas einstellst. → Einstellungen → Wochenplan
- [ ] **Wechsel Stufe 2 → 3:** konkreter Schmerz-Schwellenwert. → `regeln.json` → `phasenwechsel[stufe2_zu_stufe3].schmerz_max`
- [ ] **Wechsel Stufe 3 → 4:** konkreter Schmerz-Schwellenwert. → `phasenwechsel[stufe3_zu_stufe4].schmerz_max`
- [ ] **Dauer der Plyometrie-Phase** (Stufe 3) und der HSR-Phase (Stufe 2): nicht in den Quellen.
- [ ] **Trainingshäufigkeit in Stufe 4:** nicht in den Quellen.
- [ ] **Was heißt „Besserung“** nach einer Woche mit reduzierter Belastung? Die App fragt dich nach 7 Tagen. Gibt es ein Zahlenkriterium vom Physio?
- [ ] **Reduktion bei Schmerz über 5:** Die Quellen widersprechen sich (−15 Wiederholungen pro Tag *oder* eine Woche mit reduzierter Intensität). Die App zeigt beides. Welche Variante soll gelten?
- [ ] **VISA-P-Fragebogen:** Die Fragen selbst stehen nicht in den Quellen. Die App speichert nur den Score. Wer erhebt ihn (Physio)?

## Zur Bestätigung (Projektvorgaben und schwache Quellenlage)

Diese Werte stehen in der App, sind aber Projektentscheidungen oder nur „ergänzend“ belegt. Bitte kurz mit dem Physio bestätigen:

- [ ] **Ampel grün bis 3:** In den Quellen sind bis 4–5/10 während der Übung erlaubt. Die Grenze grün/gelb bei 3 ist eine Projektvorgabe.
- [ ] **Isometrie 1–2× täglich:** Die Quellen nennen 2× bzw. 2–3× täglich.
- [ ] **Plyometrie-Werte** (Box Jumps 3–5 × 6–8, Depth Jumps 3–5 Wdh., ca. 2 Min. Pause, höchstens 2× pro Woche): stammen aus einer Basketball-Fitnessquelle („ergänzend“).
- [ ] **Notrufnummern** 116 117 und 112 auf der Warnzeichen-Seite: organisatorisch ergänzt, nicht aus den Quellen.
- [ ] **Erinnerungsintervalle:** VISA-P alle 28 Tage, CSV-Sicherung alle 14 Tage (Projektvorgaben).
