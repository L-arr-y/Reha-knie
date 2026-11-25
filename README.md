# Reha Knie – Patellasehne & Basketball-Oberkörper

Eine Web-App fürs iPhone:
- täglicher Morgentest mit Schmerzampel und Trainingsvorschlag passend zu Stufe und Ampel
- Satz-Logger mit kg-Feld und Timer
- Übersicht „Wo stehe ich?“ mit dem 8-Wochen-Idealplan
- Verlauf mit Kurven, Return-to-Play-Check und CSV-Sicherung

Sie läuft offline, braucht kein Konto, und deine persönlichen Daten bleiben **nur auf deinem iPhone**.

Grundlage sind dein Leitfaden [`docs/reha_leitfaden.md`](docs/reha_leitfaden.md) und deine Ergänzung [`docs/ergaenzungen.md`](docs/ergaenzungen.md) (Dosierungen und Logik-Auslegungen).

> Diese App ersetzt keine ärztliche Diagnose oder Therapie. Training mit Arzt/Physio abstimmen.

---

## 1. So funktioniert die App

| Tab | Was du dort machst |
|---|---|
| **Heute** | **Jeden Morgen 10-Sekunden-Test**: 1 einbeinige Kniebeuge, Schmerz 0–10. Danach zeigt die App die Ampel und schlägt vor, was heute dran ist: Sehne, Unterkörper, Oberkörper, Basketball. Teile antippen → **Einheit starten**. |
| **Training** (startet aus „Heute“) | Pro Übung ein **kg-Feld**, vorausgefüllt mit dem letzten Wert. Satz antippen = geschafft. Einen erledigten Satz nochmal antippen, um kg oder Wiederholungen für diesen Satz zu ändern. Isometrie mit Timer (45 s halten, 2 Min. Pause). Bei kniebelastenden Übungen den Schmerz eintragen. |
| **Übersicht** | Stufe, Tag in der Stufe, grüne Tage (z. B. 5/7), Ampel der letzten 14 Tage, Kriterien für die nächste Stufe mit Knopf **„Stufe X freischalten“**, 8-Wochen-Plan mit Prognose, HSR-Stand. |
| **Übungen** | Alle Übungen nach Bereich. Ausgegraut = erst ab höherer Stufe. In den Details die **OFFEN-Werte** mit dem Physio eintragen. |
| **Verlauf** | Morgentest-Kurve mit Stufen-Leiste, Lastkurve je Übung, Einheiten pro Woche, VISA-P, alle Einheiten. Hier auch **Daten exportieren**. |
| **Mehr** | Warnzeichen, Return-to-Play-Check, Körpergewicht, betroffenes Bein, Planstart, Stufe manuell, Grenzwerte, Export/Import. |

Den roten **⚠︎-Knopf** oben rechts gibt es auf jeder Seite, er öffnet die Warnzeichen.

### Die Regeln (Leitfaden, Logikregeln 1–9, mit deiner Ergänzung)
Verglichen wird der Morgentest mit dem **Median der letzten 3 Tests**.
- **Grün:** Test ≤ 3 und höchstens +1 (gilt als Messrauschen) → Plan wie geplant, zählt als grüner Tag.
- **Gelb:** Test 4–5 oder +2 → Stufe halten.
  - Sprünge, Sprints und Basketball 40 % weniger (abgerundet).
  - HSR mit gleichen Sätzen und gleicher Last, aber ohne Steigerung.
  - Isometrie bleibt unverändert.
  - Der Grün-Zähler pausiert.
- **Rot:** Test über 5, +3 oder mehr, oder 2× Gelb in Folge.
  - Eine Stufe zurück, aber nur **einmal pro Rot-Episode**. Eine neue Episode beginnt erst nach einem grünen Tag.
  - Mindestens 2 Tage nur Isometrie und Oberkörper, solange es rot bleibt.
  - Wird es nach 7 Tagen nicht wieder grün → Hinweis „Physio/Arzt“.
- **Nächste Stufe:** mindestens 7 Tage in der Stufe, 7 grüne Tage in Folge, heute grün und das Stufenkriterium erfüllt. Dann schaltest du **bewusst per Knopf** frei.
- **HSR:** In Woche 1–2 zwei Übungen (Beinpresse, Hackenschmidt), ab Woche 3 drei (dazu Kniebeuge). Je 4 Sätze, 3 s runter und 3 s hoch, 2–3 Min. Pause.
  - Beinstrecker oder Split Squat können eine der drei ersetzen: im Training „Übung tauschen“.
  - Alle Sätze geschafft bei Schmerz ≤ 3 → nächste Einheit weniger Wiederholungen (15 → 12 → 10 → 8 → 6) und +5–10 % Last.
- **Sprints und Basketball** liegen ab Stufe 3 auf den Sprung- bzw. Sporttagen. Die Tage dazwischen bleiben Erholung für die Sehne.
- **Basketball-Belastung** = Minuten × Anstrengung (0–10), pro Woche höchstens +20 % zur Vorwoche (Faustregel).
- **Prognose fürs erste Spiel:** Schätzung aus den Mindestdauern (S1 1 Woche, S2 3, S3 2, S4 2), plus 1 Tag pro gelbem Tag und 7 Tage pro Rot-Episode. Angezeigt wird „frühestens“ und „realistisch“ (+2 Wochen).

---

## 2. Die App aufs iPhone bringen (GitHub Pages, kostenlos)

### Einmalig: hochladen
1. Auf **github.com** ein kostenloses Konto anlegen.
2. **+** → **New repository** → Name z. B. `reha-knie` → **Public** → **Create repository**.
3. Den Link **„uploading an existing file“** anklicken.
4. Im Finder den Projektordner öffnen, mit **⌘A** alles markieren und ins Browserfenster ziehen.
   - Die Datei, die mit **`~$`** beginnt (Word-Sperrdatei), vorher abwählen.
   - Den versteckten Ordner `.claude` zeigt der Finder nicht an, der wird also automatisch nicht mitgenommen.
5. **Commit changes**.
6. **Settings → Pages**:
   - Source: „Deploy from a branch“
   - Branch: `main`, Ordner: `/ (root)`
   - **Save**
7. Nach 1–2 Minuten steht dort die Adresse, z. B. `https://BENUTZERNAME.github.io/reha-knie/`.

Willst du den Leitfaden nicht öffentlich haben, lass den Ordner `docs` beim Hochladen weg. Die App braucht ihn nicht.

### Auf dem iPhone installieren
1. Adresse in **Safari** öffnen.
2. **Teilen** → **„Zum Home-Bildschirm“** → **Hinzufügen**.
3. Ab jetzt nur noch über das neue Symbol starten.

**Wichtig:** Die installierte App hat einen **eigenen Speicher**, getrennt vom Safari-Tab. Also gleich zu Beginn installieren.

### Was ist öffentlich?
- Öffentlich: Programmcode und Inhalte (`data/*.json`, ggf. `docs/`).
- **Deine Einträge (Morgentests, Einheiten, kg, VISA-P) werden nie hochgeladen.** Kein Tracking, keine externen Schriften oder Bibliotheken. Nur „Übung auf YouTube suchen“ öffnet YouTube.

### Neue Version hochladen
Im Repository **Add file → Upload files** und die geänderten Dateien hineinziehen, gleichnamige werden ersetzt. Die App lädt die neue Version im Hintergrund und nutzt sie **ab dem übernächsten Start** (App einmal ganz schließen und neu öffnen).

---

## 3. Daten sichern (CSV) und wiederherstellen

Safari kann Daten von Webseiten löschen, die lange nicht genutzt wurden. Als Home-Bildschirm-App ist das Risiko klein, aber nicht null. Die App erinnert dich deshalb **alle 14 Tage** an eine Sicherung.

### Exportieren
**Verlauf → „Daten exportieren (CSV)“** (oder Mehr → Daten). Das Teilen-Menü öffnet sich mit **7 Dateien**:

| Datei | Inhalt |
|---|---|
| `reha_morgenchecks_…csv` | Datum, Morgentest, Morgensteifigkeit, Ampel, Stufe, Notiz |
| `reha_einheiten_…csv` | eine Zeile pro Übung und Einheit: Stufe, Ampel, Übung, **Gewicht (kg)**, Ziel, Schmerz während, RIR, Schmerz danach, Notiz, Basketball-Dauer und Anstrengung |
| `reha_saetze_…csv` | eine Zeile pro Satz: Wiederholungen bzw. Dauer, **kg**, erledigt |
| `reha_stufen_…csv` | alle Stufenwechsel (Start, freigeschaltet, zurück wegen Rot, manuell) |
| `reha_rtp_…csv` | Return-to-Play-Checks mit Seitenvergleich (LSI) |
| `reha_visap_…csv` | VISA-P-Scores |
| `reha_einstellungen_…csv` | Körpergewicht, betroffenes Bein, Planstart, eigene Werte, Grenzwerte |

**Wohin damit?** Am besten **„In Dateien sichern“** in einen Ordner in **iCloud Drive** (z. B. „Reha-Backup“). Alternativ per AirDrop oder Mail.
Erscheint kein Teilen-Menü, zeigt die App Download-Links. Die Dateien landen dann in **Dateien → Downloads**.

Format für deutsches Excel/Numbers: UTF-8 mit BOM, Semikolon, Dezimalkomma (z. B. `82,5`), Datum `TT.MM.JJJJ` plus eine ISO-Spalte.

### Wiederherstellen (neues iPhone / Datenverlust)
**Mehr → „Daten importieren (CSV)“** → alle Dateien gemeinsam auswählen → Vorschau prüfen → **Zusammenführen**.
- Doppelte Einträge werden übersprungen.
- Rückstufungen wegen Rot rechnet die App aus den Morgentests selbst neu aus.
- Einstellungen werden nur auf einem leeren Gerät übernommen.

---

## 4. Inhalte anpassen (JSON-Dateien, ohne Programmieren)

| Datei | Inhalt |
|---|---|
| `data/uebungen.json` | alle Übungen: Bereich, ab welcher Stufe/Planwoche, kniebelastend, kg-Feld, Dosierung, OFFEN-Felder, **YouTube-Suchbegriff** |
| `data/stufen.json` | Stufen 1–4 + Erhaltung: Ziel, Rhythmus (z. B. HSR jeden 2. Tag), Kriterium für die nächste Stufe |
| `data/plan.json` | 8-Wochen-Idealplan: Start, Zielspiel, Inhalte je Woche |
| `data/regeln.json` | Ampel-Grenzen, Gelb-Kürzung, Rot-Sperre, Mindesttage, HSR-Steigerung, Return-to-Play, Erinnerungen, Texte |
| `data/warnzeichen.json` | Texte der Warnzeichen-Seite |

Jeder Eintrag hat `quelle` und `status`:
- `gesichert`: aus dem Leitfaden
- `OFFEN`: fehlt im Leitfaden, mit Physio klären
- `ergänzend`: nicht aus dem Leitfaden, z. B. Notrufnummern, VISA-P

**Ändern auf github.com:**
1. Datei öffnen.
2. Auf den **Stift** klicken.
3. Den Wert ändern, z. B. `"gruenMax": 3` → `2`.
4. **Commit changes**.

**JSON-Regeln:** Texte in "Anführungszeichen", Zahlen ohne. Zwischen Einträgen ein Komma, nach dem letzten keins. Startet die App danach nicht mehr: Datei öffnen → **History** → vorige Version wiederherstellen.

**Einfacher:** Grenzwerte änderst du in der App unter **Mehr → Grenzwerte**, OFFEN-Werte direkt in der Übung. Beides gilt nur auf deinem iPhone.

**Programmcode geändert?** In `sw.js` die Zeile `const VERSION = 'reha-v4';` hochzählen. Neue Dateien zusätzlich in die Liste `DATEIEN` in `sw.js` eintragen.

---

## 5. Gut zu wissen
- **Timer:** Er rechnet mit der Uhrzeit, stimmt also auch nach Sperren oder App-Wechsel. Solange er läuft, bleibt der Bildschirm an.
  - **Vibration:** Safari auf dem iPhone erlaubt Web-Apps keine Vibration.
  - **Ton:** kommt nur bei eingeschaltetem Bildschirm.
- **Offene Punkte:** [`OFFEN.md`](OFFEN.md).

## 6. Für Technik-Interessierte
- Reines HTML/CSS/JavaScript ohne Bibliotheken und ohne Build-Schritt. Daten in IndexedDB, offline über einen Service Worker.
- Logik in `js/regeln.js`, CSV in `js/csv.js`, beides reine Funktionen mit Tests.
- **Lokal starten:** `python3 -m http.server 8000` im Projektordner, dann `http://localhost:8000`.
- **Tests:** `http://localhost:8000/tests/test.html` (102 Tests).
- **App-Symbole neu erzeugen:** `python3 tools/make_icons.py .`
