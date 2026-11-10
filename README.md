# Reha Knie – persönlicher Trainingsassistent (Patellaspitzensyndrom)

Eine Web-App fürs iPhone: Tagesplan, Timer, Schmerzlog mit Ampel, Regelhinweise, Verlauf, Warnzeichen und CSV-Sicherung.
Läuft offline, braucht kein Konto, und deine persönlichen Daten bleiben **nur auf deinem iPhone**.

> Diese App ersetzt keine ärztliche Diagnose oder Therapie. Training mit Arzt/Physio abstimmen.

---

## 1. Die App aufs iPhone bringen (GitHub Pages, kostenlos)

Eine installierbare Web-App braucht eine sichere Internetadresse (https). GitHub Pages stellt die kostenlos bereit.

### Einmalig: hochladen
1. Auf **github.com** ein kostenloses Konto anlegen und anmelden.
2. Oben rechts auf **+** → **New repository**.
   - Name: z. B. `reha-knie`
   - **Public** auswählen (GitHub Pages ist im kostenlosen Tarif nur für öffentliche Repositories verfügbar).
   - Sonst nichts ankreuzen → **Create repository**.
3. Auf der neuen Seite den Link **„uploading an existing file“** anklicken.
4. Im Finder diesen Projektordner öffnen und **den Inhalt** (nicht den Ordner selbst) ins Browserfenster ziehen:
   `index.html`, `manifest.webmanifest`, `sw.js`, `README.md`, `OFFEN.md` sowie die Ordner `css`, `js`, `data`, `icons`, `docs`, `tests`, `tools`.
   - **Nicht** hochladen: die Datei, die mit `~$` beginnt (Word-Sperrdatei), und den versteckten Ordner `.claude`.
5. Unten auf **Commit changes** klicken.
6. Im Repository oben auf **Settings** → links **Pages**.
   - Bei „Source“: **Deploy from a branch**
   - Bei „Branch“: **main** und **/ (root)** → **Save**.
7. Nach 1–2 Minuten steht oben auf derselben Seite deine Adresse, z. B.
   `https://DEIN-NAME.github.io/reha-knie/`

### Auf dem iPhone installieren
1. Die Adresse in **Safari** öffnen (nicht in Chrome oder einer anderen App).
2. Unten auf **Teilen** (Quadrat mit Pfeil) tippen – bei manchen iOS-Versionen erst auf „…“.
3. **„Zum Home-Bildschirm“** wählen, „Als Web-App öffnen“ eingeschaltet lassen, **Hinzufügen**.
4. Ab jetzt die App **immer über das neue Symbol** starten.

**Wichtig:** Die installierte App hat einen **eigenen Speicher**, getrennt vom Safari-Tab. Daten, die du im Safari-Tab eingibst, tauchen in der installierten App nicht auf. Also gleich zu Beginn installieren.

### Was ist öffentlich?
- Öffentlich sichtbar sind nur der Programmcode und die Reha-Inhalte (`data/*.json`, `docs/`).
- **Deine Einträge (Schmerzlog, Einheiten, VISA-P) werden nie hochgeladen.** Sie liegen nur im Speicher deines iPhones.
- Die App lädt nichts von fremden Servern: keine Schriften, keine Bibliotheken, kein Tracking. Nur wenn du „Übung auf YouTube suchen“ antippst, öffnet sich YouTube.

---

## 2. Daten sichern (CSV-Export) und wiederherstellen

Safari kann die Daten von Webseiten löschen, die lange nicht benutzt wurden. Als Home-Bildschirm-App ist das Risiko deutlich kleiner, aber nicht null. Die App erinnert dich deshalb **alle 14 Tage** an eine Sicherung.

### Exportieren
- **Verlauf → „Daten exportieren (CSV)“** (oder Einstellungen → Daten).
- Es öffnet sich das **Teilen-Menü** mit drei Dateien:
  - `reha_einheiten_JJJJ-MM-TT.csv` – eine Zeile pro Übung und Einheit (Datum, Stufe, Übung, Sätze, Wiederholungen, Haltezeit, Zusatzlast, Schmerz während, Status)
  - `reha_schmerz_JJJJ-MM-TT.csv` – eine Zeile pro Einheit (Schmerz vorher, nachher, stärkster während, nächster Morgen, Notizen)
  - `reha_visap_JJJJ-MM-TT.csv` – alle VISA-P-Scores
- **Wohin damit?**
  - **„In Dateien sichern“** → am besten einen Ordner in **iCloud Drive** wählen (z. B. „Reha-Backup“). Dann liegt die Sicherung auch außerhalb des iPhones.
  - Oder per **AirDrop** an deinen Mac oder per **Mail** an dich selbst.
- Falls das Teilen-Menü nicht erscheint, zeigt die App drei Download-Links. Antippen → die Dateien landen in der App **Dateien → Downloads**.

Die Dateien öffnen sich direkt in **Numbers** oder **Excel** (UTF-8 mit BOM, Semikolon, Dezimalkomma, Datum TT.MM.JJJJ und zusätzlich eine ISO-Spalte).

### Wiederherstellen (neues iPhone / Datenverlust)
- **Einstellungen → „Daten importieren (CSV)“** → die drei Dateien gemeinsam auswählen → Vorschau prüfen → **Zusammenführen**.
- Vorhandene Einträge bleiben erhalten, doppelte werden übersprungen.
- Nicht in der CSV enthalten sind Einstellungen wie Wochenplan, eigene Werte und Varianten. Die Stufe wird aus der letzten importierten Einheit übernommen. Den Rest stellst du in den Einstellungen kurz neu ein.

---

## 3. Inhalte anpassen (JSON-Dateien, ohne Programmieren)

Alle medizinischen Inhalte und Schwellenwerte stehen in `data/`:

| Datei | Inhalt |
|---|---|
| `data/phasen.json` | Stufen 1–4: Ziel, Einstieg, Wechselkriterien, Orientierungsdauer, Übungen je Stufe |
| `data/uebungen.json` | Übungen: Ausführung, Dosierung (Sätze, Wiederholungen, Haltezeit, Pause …), **YouTube-Suchbegriffe** |
| `data/regeln.json` | Ampel-Grenzen, Reduktion, 7-Tage-Prüfung, Phasenwechsel, Progression, Erinnerungsintervalle, Hinweistexte |
| `data/warnzeichen.json` | Red Flags und Texte der Warnzeichen-Seite |

Jeder Eintrag hat `quelle` (woher stammt das?) und `status`:
`gesichert` (aus deinen Quellen), `OFFEN` (fehlt in den Quellen, bitte mit Physio klären) oder `ergänzend` (schwache Quellenlage).
Ein fehlender Zahlenwert steht als `null` drin. Die App zeigt dann „OFFEN“.

### So änderst du etwas direkt auf github.com
1. Im Repository die Datei öffnen, z. B. `data/regeln.json`.
2. Oben rechts auf den **Stift** (Edit) klicken.
3. Den Wert ändern, z. B. bei der Ampel `"gruen_max": 3` → `"gruen_max": 2`.
4. **Commit changes** klicken.
5. Auf dem iPhone die App öffnen: Sie lädt die neue Datei im Hintergrund. **Beim nächsten Start** ist die Änderung aktiv (App einmal ganz schließen und neu öffnen).

**Beispiele**
- Isometrie auf 4 Sätze: in `uebungen.json` bei `iso_decline_squat` → `"saetze": { "wert": 4, … }`
- YouTube-Suche ändern: `"suchbegriff": "…"`
- VISA-P-Erinnerung alle 6 Wochen: in `regeln.json` → `"erinnerung_tage": 42`

**Regeln für JSON:** Texte stehen in "Anführungszeichen", Zahlen ohne. Zwischen Einträgen steht ein Komma, nach dem letzten Eintrag keins. Startet die App nach einer Änderung nicht mehr, auf GitHub die Datei öffnen → **History** → die vorige Version wiederherstellen.

**Einfacher für Werte vom Physio:** Statt die JSON zu ändern, kannst du in der App unter **Einstellungen → Eigene Werte** Zahlen für OFFEN-Felder eintragen (z. B. HSR-Sätze). Die gelten nur auf deinem iPhone.

### Programmcode geändert?
Wer Dateien in `js/` oder `css/` ändert, sollte in `sw.js` die Zeile `const VERSION = 'reha-v1';` hochzählen (z. B. `reha-v2`). Neue Dateien müssen außerdem in die Liste `DATEIEN` in `sw.js`.

---

## 4. Gut zu wissen

- **Timer:** rechnet mit Uhrzeiten statt mitzuzählen, stimmt also auch nach dem Sperren oder einem App-Wechsel. Solange er läuft, bleibt der Bildschirm an.
  - **Vibration:** Safari auf dem iPhone erlaubt Web-Apps keine Vibration.
  - **Ton:** kommt nur, wenn der Bildschirm an ist und das iPhone nicht stumm geschaltet ist.
- **Regeln:** Die App gibt Empfehlungen und Warnungen, stellt aber **keine Diagnosen**. Wo die Quellen keine Zahl nennen (z. B. was „Besserung“ heißt), fragt die App dich, statt selbst zu urteilen.
- **Offene Punkte:** siehe [`OFFEN.md`](OFFEN.md).

---

## 5. Für Technik-Interessierte

- Reines HTML/CSS/JavaScript, keine Bibliotheken, kein Build-Schritt.
- Daten liegen in IndexedDB (`js/db.js`). Offline-Betrieb über einen Service Worker (`sw.js`).
- Regeln (`js/regeln.js`) und CSV (`js/csv.js`) sind reine Funktionen und haben automatische Tests.
- **Lokal starten:** im Projektordner `python3 -m http.server 8000` ausführen, dann `http://localhost:8000` öffnen.
- **Tests:** `http://localhost:8000/tests/test.html` öffnen (derzeit 54 Tests).
- **App-Symbole neu erzeugen:** `python3 tools/make_icons.py .`
