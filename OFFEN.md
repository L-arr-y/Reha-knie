# Welche Punkte sind noch offen?

Grundlagen der App:
- [`docs/reha_leitfaden.md`](docs/reha_leitfaden.md): der Leitfaden
- [`docs/ergaenzungen.md`](docs/ergaenzungen.md): deine Ergänzung vom 23.11.2026 mit Dosierungen und Logik-Auslegungen

Die meisten Lücken sind damit geschlossen. Werte aus der Ergänzung stehen in der App als **„ergänzend“** (übliche Trainingswerte ohne Studienbasis). Die HSR-Werte stammen aus Kongsgaard 2009. Alles ist in den JSON-Dateien und teils direkt in der App änderbar.

## Noch OFFEN (fehlt in beiden Dokumenten)

| Was | Wo eintragen |
|---|---|
| Pause bei der **Kontaktkraft** (Partner-Bumps, Ball-Reißen, Offset-Carries, Anti-Rotation, Abschluss gegen Pad) | Übungen → Übung → OFFEN-Feld |
| **Farmer's Carry**: Strecke oder Zeit pro Satz | Übungen → Farmer's Carry |
| **Erhaltung ab Woche 7**: welche konkrete Druck-, Zug-, Rotations- und Rumpfübung, Wiederholungen, Pause | Übungen → „Erhaltung: …“ |
| **Sprünge**: wie genau die Steigerung von 3 × 10 beidbeinig auf 6 × 10 einbeinig verläuft (die App startet mit 3 × 10, mehr Sätze über „+ Satz“) | `data/uebungen.json` oder sag es mir |
| **Basketball in Woche 1–4** (Wurftechnik, Freiwürfe, Ballhandling, Shooting-Volumen …): Dauer bzw. Anzahl Würfe. Die Ergänzung nennt Minuten erst ab Woche 5. | `data/plan.json` (`bbMinuten`) oder sag es mir |

## Umgesetzt nach deinen Antworten
- **HSR Woche 1–2:** Beinpresse + Hackenschmidt, ab Woche 3 zusätzlich Kniebeuge.
- **Morgentest-Anstieg +3 oder mehr** gegenüber dem Median der letzten 3 Tests: **Rot** (+1 bleibt Grün, +2 ist Gelb).

## Meine Auslegungen (bitte kurz bestätigen)
- [ ] **Median der letzten 3 Tests:** gezählt werden die letzten 3 *vorhandenen* Morgentests, nicht unbedingt 3 Kalendertage.
- [ ] **HSR-Tausch:** Wählst du im Training „Übung tauschen“ (z. B. Kniebeuge → Beinstrecker), bleibt der Tausch für die nächsten Einheiten gespeichert, bis du zurücktauschst. Split Squat ist erst ab Woche 3 wählbar.
- [ ] **Unterkörper** wird standardmäßig an **Isometrie-Tagen** vorgeschlagen, damit HSR- und Sprungtage nicht überladen werden. Ein Block (z. B. Hamstrings 2×/Woche) verschwindet aus dem Vorschlag, sobald er in den letzten 7 Tagen oft genug gemacht wurde.
- [ ] **„Sprints und Basketball auf die Sprungtage“:** gilt ab Stufe 3. In Stufe 4 zählen die Sporttage als Sprungtage. In Stufe 1–2 gibt es keine Einschränkung.
- [ ] **Gelb bei Basketball:** Die Minuten-Vorgabe der Woche sinkt um 40 % (abgerundet), z. B. Woche 5: 12–18 statt 20–30 Min.
- [ ] **Gelb bei HSR:** gleiche Wiederholungen und Last wie zuletzt. Eine Einheit an einem Gelb-Tag löst auch beim nächsten Mal keine Steigerung aus.
- [ ] **Sprints in Woche 8:** wie Woche 7 (8 × 80–90 % mit Cuts). Die Ergänzung sagt „W7+“.
- [ ] **Prognose:** Gelbe Tage und Rot-Episoden zählen nur in der **aktuellen** Stufe. Sonst würden vergangene Tage doppelt zählen, weil sie schon in den „Tagen in der Stufe“ stecken.
- [ ] **Basketball-Belastung +20 %:** Verglichen wird die Woche (Mo–So) mit der Vorwoche. Ohne Vorwochenwert gibt es noch keine Obergrenze. Dauer und Anstrengung fragt die App nach dem Training ab, die Eingabe ist freiwillig.

## Nicht aus Leitfaden oder Ergänzung (ergänzend)
- [ ] **Warnzeichen** (Fieber, Rötung/Überwärmung, Ruhe-/Nachtschmerz, Funktionsverlust, Verdacht auf Riss): aus deinem ursprünglichen Auftrag.
- [ ] **Notrufnummern** 116 117 und 112: organisatorisch ergänzt.
- [ ] **VISA-P** (Erinnerung alle 28 Tage): aus dem ursprünglichen Auftrag. Die App speichert nur den Score.
- [ ] **Erinnerung an CSV-Sicherung** alle 14 Tage: Projektvorgabe.
