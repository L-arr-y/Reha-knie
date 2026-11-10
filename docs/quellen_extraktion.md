# Quellenextraktion: Patellaspitzensyndrom (Jumper's Knee)

> Extraktion aus Gemini Notebook (NotebookLM) für das Projekt „Persönlicher Reha- und Trainingsassistent". Dient als Grundlage für die Datenbasis der App (`data/*.json`).

**Lesehinweise**

- Alle Inhalte stammen ausschließlich aus den eigenen Quellen des Notebooks. Es wurde nichts aus Allgemeinwissen ergänzt.
- **„nicht in den Quellen"** bedeutet: Lücke. In der App als `OFFEN` führen, nicht mit eigenen Werten füllen.
- **„(Widerspruch in den Quellen)"** kennzeichnet widersprüchliche Angaben. Die Entscheidungen dazu stehen im Projekt-Prompt.
- Zahlen in eckigen Klammern, z. B. `[2, 4]`, sind Quellennummern aus dem Notebook. Sie sind nur innerhalb eines Abschnitts oder einer Tabellenzeile eindeutig, nicht global. Verlässlich sind die Quellentitel in den Tabellen.
- Der Wortlaut ist unverändert aus der Word-Datei übernommen. Korrigiert wurden nur Zeilenumbrüche, Überschriftenebenen, Tabellen und die Verschachtelung der Aufzählungen.

## 1. REHA-PHASEN

In den Quellen werden für die Rehabilitation des Patellaspitzensyndroms (Jumper's Knee) **zwei primäre trainingsbasierte Stufen- bzw. Phasenmodelle** sowie eine **Klassifikation nach klinischen Schweregraden** beschrieben [1-3].

### Modell 1: 4-Stufen-Modell der progressiven Sehnenbelastung (PTLE / 4 Stage Progressive Loading Protocol)

Dieses Modell (nach Malliaras et al. / Breda et al.) setzt auf eine schmerzadaptierte, progressive Belastung der Patellasehne und zeigt in Studien höhere Erfolgsquoten sowie schmerzärmere Verläufe als die reine exzentrische Therapie [2, 4, 5].

#### Stufe 1: Isometrisches Training (Isometric Exercises)

- **Ziel:** Schnelle Analgesie (Schmerzabsenkung) und Heranführung der Sehne an Belastung ohne dynamische Bewegung [2].
- **Typische Dauer:** **nicht in den Quellen** für das PTLE-Gesamtmodell explizit beziffert (in Einzelprotokollen werden 1 bis 3 Wochen genannt) [6].
- **Kriterien für den Einstieg:** Starkes Schmerzgeschehen, das dynamische Belastungen nicht zulässt, sowie Akut-/Initialbehandlung bei Athleten während der Wettkampfsaison („in-season“) [2].
- **Kriterien für den Übergang in die nächste Stufe:** Ausreichende Schmerzreduktion unter isometrischer Haltearbeit [2] (exakte quantifizierte Messwerte für PTLE sind **nicht in den Quellen** angegeben; bei isometrischen Einzelprotokollen gilt eine Schmerzintensität von ≤ 2–3 auf der Skala 1–10 als Übergangskriterium) [7].

#### Stufe 2: Isotonisches Training / Heavy Slow Resistance Training (HSR)

- **Ziel:** Maximale Stimulierung der Tenozyten, Anregung des Sehnen-Remodellings und Kraftaufbau unter hoher Last [2].
- **Typische Dauer:** **nicht in den Quellen** explizit angegeben.
- **Kriterien für den Einstieg:** Ausreichende Linderung der Ruhe- und Belastungsschmerzen durch die isometrische Phase [2].
- **Kriterien für den Übergang in die nächste Stufe:** Gute Sehnenbelastbarkeit und Schmerztoleranz bei langsamen isotonischen Übungen mit hoher Last [1, 2] (spezifische Schwellenwerte sind **nicht in den Quellen** angegeben).

#### Stufe 3: Plyometrische Übungen (Energy Storage Loading)

- **Ziel:** Wiederaufladung der elastischen Energiespeicher der Sehne, Schulung des Dehnungs-Verkürzungs-Zyklus sowie Anpassung an Lauf- und Sprungtechniken [1, 2].
- **Typische Dauer:** **nicht in den Quellen** explizit angegeben.
- **Kriterien für den Einstieg:** Schmerzfreie bzw. gut tolerierbare Absolvierung der schweren isotonischen Kraftübungen [1, 2].
- **Kriterien für den Übergang in die nächste Stufe:** Gute Schmerzkontrolle und Stabilität bei dynamischen und plyometrischen Belastungen [1] (spezifische Schwellenwerte sind **nicht in den Quellen** angegeben).

#### Stufe 4: Sportartspezifisches Training & Return to Sport

- **Ziel:** Vollständige schmerzfreie Reintegration in das sportartspezifische Mannschaftstraining und den Wettkampf (Return to Competition) [1, 8].
- **Typische Dauer:** Eine Rückkehr ins normale Training ist frühestens nach 4 Wochen erlaubt [1]; das Gesamtrehabilitationsprogramm erstreckt sich in Untersuchungen über bis zu 24 Wochen [9].
- **Kriterien für den Einstieg:** Beschwerdefreies Absolvieren der plyometrischen und laufspezifischen Übungen [1].
- **Kriterien für den Abschluss:** Deutliche Schmerzreduktion (in Studien auf einen VAS-Wert ≤ 2/10) [5] sowie uneingeschränkte funktionelle Wettkampfbelastbarkeit [8].

### Modell 2: 2-Phasen-Modell des Exzentrischen Trainings (EET - Eccentric Exercise Therapy)

Das exzentrische Training (EET) auf der schrägen Ebene gilt als traditioneller Standard, wird jedoch aufgrund hoher Schmerzintensität bei der Ausführung diskutiert [2, 4, 6].

#### Phase 1: Isometrisches Training (Vorschaltphase)

- **Ziel:** Schmerzarme Kräftigung der Muskulatur ohne Sehnenbewegung zur Vorbereitung auf dynamische Dehnungsbelastungen [7, 10].
- **Typische Dauer:** 1 bis 3 Wochen [6].
- **Kriterien für den Einstieg:** Reizung der Patellasehne / diagnostiziertes Patellaspitzensyndrom [6]; Schmerzintensität während der Übung darf den Wert 4 bis maximal 5 auf einer 10-teiligen Skala nicht überschreiten [10].
- **Kriterien für den Übergang in Phase 2:** Mühelose Durchführung der isometrischen Halteübungen bei einem Schmerzgrad von maximal 2 bis 3 auf der Skala 1–10 [7].

#### Phase 2: Exzentrisches Training

- **Ziel:** Gezielte Dehnung und Belastung der Patellasehne unter Bewegung (einbeinige Kniebeuge auf einer 20–30° geneigten Fläche) zur Auslösung von Sehnenreparaturmechanismen [6, 11, 12].
- **Typische Dauer:** 3 bis 6 Monate [6]. *(Widerspruch in den Quellen: Eine andere Quelle gibt als Dauer für das exzentrische Training 8 bis 12 Wochen an [2], während eine weitere die reine Gewebe-Heilungszeit aufgrund des langsamen Sehnenstoffwechsels auf 12 bis 16 Wochen beziffert [13]).*
- **Kriterien für den Einstieg:** Erfüllung der Übergangskriterien aus Phase 1 (Schmerzgrad ≤ 2–3) [7].
- **Kriterien für die Progression und den Übergang zu freiem Training:**
  - Einstieg mit 15 Wiederholungen täglich (Schmerzempfinden ≤ 5/10 erlaubt) [6, 11].
  - Steigerung auf 2 bis 3 Sätze à 15 Wiederholungen (2–3-mal täglich), sobald die Übung beschwerdefrei möglich ist [6, 11].
  - Nach problemloser Bewältigung von 3x15 Wiederholungen erfolgt eine Laststeigerung (z. B. mittels Rucksack oder Langhantel) und der allmähliche Übergang in intensiveres Kraft- und Sprungkrafttraining [6, 12].
  - *Rückschrittkriterium:* Bei zu starken Schmerzen wird die Belastung um 15 Wiederholungen pro Tag reduziert bzw. das Training für eine Woche mit reduzierter Intensität weitergeführt [6, 13].

### Ergänzung: Einteilung nach klinischen Schweregrad-Stadien

Zusätzlich zur phasenbasierten Rehabilitation teilen die Quellen das Patellaspitzensyndrom in **drei Schweregrad-Stadien** ein, welche das Ausmaß der Erkrankung und die erforderlichen Maßnahmen vorgeben [3, 14]:

1. **Stadium 1:**
   - **Einstiegskriterien:** Schmerzen treten ausschließlich nach sportlicher Belastung oder ungewohnten Bewegungen auf; Alltag ist gut belastbar [3].
   - **Ziel & Maßnahmen:** Schmerzlinderung durch Schonung, Belastungsanpassung, Kühlung und gezielte Physiotherapie [3].
   - **Typische Dauer:** **nicht in den Quellen** explizit genannt (milde Stadien heilen oft in wenigen Wochen) [15].
2. **Stadium 2:**
   - **Einstiegskriterien:** Schmerzen treten während des Sports und teilweise im Alltag auf (z. B. beim Treppensteigen); Leistungsfähigkeit ist eingeschränkt [3].
   - **Ziel & Maßnahmen:** Konsequente Trainingspause oder -reduktion, Physiotherapie mit Kraft- und Dehnübungen, Kühlung [14].
   - **Typische Dauer:** **nicht in den Quellen** explizit angegeben.
3. **Stadium 3:**
   - **Einstiegskriterien:** Dauerhafte Schmerzen auch in Ruhe; Sport ist kaum oder gar nicht mehr möglich [14].
   - **Ziel & Maßnahmen:** Längere Sportpause, intensive physiotherapeutische Betreuung; bei erfolgloser konservativer Therapie über Monate in seltenen Fällen operative Intervention als letzte Option [14, 16].
   - **Typische Dauer:** Mehrere Monate [15].

*(Hinweis: Das in manchen VBG-Messprotokollen aufgeführte „6-Stufen-Modell“ bezieht sich explizit auf Schädel-Hirn-Traumata (SHT) und steht in keinem Zusammenhang mit dem Patellaspitzensyndrom) [17, 18].*

## 2. ÜBUNGSKATALOG

| Name | Phase | Zielstruktur/Muskel | Ausführung (kurz) | Sätze | Wiederholungen | Dauer/Haltezeit | Tempo | Pause | Intensität (z. B. % 1RM, Schmerzniveau) | Equipment | Quelle |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Isometrische Kniebeuge auf schräger Ebene (Isometric Decline Squat)** | Stufe 1 (PTLE) / Phase 1 (EET) [1-3] | Patellasehne, Musculus quadriceps femoris [2] | Ferse des betroffenen Beins auf 20–30° Neigung stellen; Knie bis 60° beugen und Position halten [2]. | 5 bis 10 Sätze *(bzw. 5 Sätze im 5×45s-Protokoll)* [1, 2] | 5 bis 10 Wiederholungen (2–3-mal täglich) [1, 2] | 45 Sekunden halten [1, 2] | Isometrisch (statisch halten) [2] | 1 Minute [2] | SchmerzSkala: Schmerzen bis max. 4–5/10 erlaubt [4]; Übergangskriterium zur nächsten Phase: Schmerzgrad ≤ 2–3/10 [2] | Therapiekeil / Buch (20–30° Neigung) [2] | *Tendinopathie der Patellasehne (Patellaspitzensyndrom) - orthopassion* [2, 4], *Patellaspitzensyndrom - sportärztezeitung* [1] |
| **Exzentrische Kniebeuge auf schräger Ebene (Decline Squat / EET)** | Phase 2 (EET) / Stufe 2 (PTLE) [3, 5] | Patellasehne (Dehnung unter Belastung), M. quadriceps femoris [3, 6] | Ferse auf 20–30° Neigung stellen; mit betroffenem Bein einbeinige Kniebeuge langsam bis 90° (oder 60°) absenken, kurz verharren und mit beiden Beinen zurück in die Ausgangsstellung drücken [3, 7]. | 2 bis 3 Sätze *(Einstieg mit 15 Wdh. täglich, Steigerung auf 2–3 Sätze)* [3, 8] | 15 Wiederholungen (2–3-mal täglich) [3, 8] | Kurz in Endposition verharren (ca. 3 Sekunden) [3, 7] | Langsam exzentrisch absenken (3 Sek. / Zählen: 21–22–23), zügig mit beiden Beinen hoch [3, 7]. *(Widerspruch/TNT-Variante: 4 Sek. exzentrisch, 3 Sek. konzentrisch mit externem Pacer)* [1] | **nicht in den Quellen** | SchmerzSkala: Schmerzen bis max. 4–5/10 erlaubt (bei stärkeren Schmerzen Belastung um 15 Wdh. reduzieren) [3, 8, 9]; Zusatzgewicht (Rucksack/Langhantel) nach schmerzfreier Bewältigung von 3×15 [3, 7] | Schrägbrett / Therapiekeil (20–30° Neigung) oder dickes Buch, Stuhllehne (optional), Rucksack / Langhantel (Zusatzgewicht) [3, 7, 10] | *Exzentrisches Training bei Patellaspitzen-syndrom* [37–40], *Tendinopathie der Patellasehne (Patellaspitzensyndrom) - orthopassion* [3], *Patellaspitzensyndrom - sportärztezeitung* [1] |
| **Heavy Slow Resistance Training (HSR / Isotonisches Hochlasttraining)** | Stufe 2 (PTLE) / Aufbautraining [1, 5] | Patellasehne (maximale Tenozyten-Stimulation), M. quadriceps femoris [1] | Langsame isotonische Kräftigungsübungen unter hoher Last (z. B. Leg Press oder Kniebeugen) zur Auslösung von Sehnen-Remodelling [1]. | **nicht in den Quellen** spezifisch beziffert | **nicht in den Quellen** spezifisch beziffert | **nicht in den Quellen** | Langsam kontrolliert *(z. B. im TNT-Protokoll: 4 Sek. exzentrisch, 3 Sek. konzentrisch via Metronom)* [1] | **nicht in den Quellen** spezifisch beziffert | Hohe Lasten (Heavy Load) zur maximalen Tenozyten-Stimulation [1] | Langhantel, Kraftgeräte (z. B. Beinpresse / Leg Press) [1] | *Patellaspitzensyndrom - sportärztezeitung* [1], *Jumper's knee: Progressive Sehnenbelastung bei Patellaspitzensyndrom besser als exzentrisches Training...* [5] |
| **Plyometrische Sprungübungen (Energy Storage Loading / Plyometrie)** | Stufe 3 (PTLE) / fortgeschrittene Reha [5, 11] | Patellasehne (Dehnungs-Verkürzungs-Zyklus, elastische Energiespeicher), Oberschenkel- und Unterschenkelmuskulatur [11, 12] | Dynamische Reaktivkraftübungen: Box Jumps (Sprung auf Plattform), Depth Jumps (Absprung von Box mit sofortigem Reaktivsprung nach Landung) oder Single-Leg Hops [11]. | 3 bis 5 Sätze (z. B. Box Jumps) [11] | 6–8 Wdh. (Box Jumps), 3–5 Wdh. (Depth Jumps) [11] | Keine Haltezeit (kurze Bodenkontaktzeiten) [11] | Explosiv [11, 12] | ca. 2 Minuten [13] | Maximale Kraftübertragung in kürzester Zeit; Frequenz: maximal 2-mal pro Woche [11, 14] | Sprungbox / Plattform (30–60 cm Höhe) [11] | *Sprungkrafttraining Basketball: Höher Springen, Mehr Dunks - Fit-Connect* [11, 14], *Krafttraining für Basketballer - In 5 Schritten zu extremer Athletik* [12], *Jumper's knee: Progressive Sehnenbelastung...* [5] |
| **Dehnübungen Oberschenkel (Quadrizeps- & Hamstring-Stretching)** | Alle Phasen / Begleittherapie [15-17] | Musculus quadriceps femoris, Hamstrings (Oberschenkelrückseite), Hüftbeuger [15, 17, 18] | Statische und dynamische Dehnung der Oberschenkelvorder- und -rückseite zur Reduktion von Zug- und Stressmomenten auf die Patellasehne [16-18]. | **nicht in den Quellen** | **nicht in den Quellen** | **nicht in den Quellen** | Statisch / ruhig [17, 18] | **nicht in den Quellen** | Bis zu einem leichten Dehnreiz ohne starken Schmerz [15, 17] | Keine (ggf. Matte) [18] | *Patellaspitzensyndrom: Symptome, Ursachen und Therapien* [17], *Patellaspitzensyndrom - sportärztezeitung* [16], *Bursitis praepatellaris: Ursachen, Diagnose, Therapien - Orthinform* [15] |
| **Faszien-Ausrollen (Blackroll-Selbstmassage)** | Ergänzende Eigenübung (alle Phasen) [19] | Gesamte Beinmuskulatur (Oberschenkelvorder- und -rückseite, Waden) [19] | Gründliches Ausrollen der Beinmuskulatur vom Oberschenkel bis hinunter zur Wade [19]. | **nicht in den Quellen** | **nicht in den Quellen** | Alle 2 bis 3 Tage durchführen [19] | Langsam rollend [19] | **nicht in den Quellen** | Tolerierbarer Massagedruck [19] | Blackroll / Faszienrolle [19] | *Tendinopathie der Patellasehne (Patellaspitzensyndrom) - orthopassion* [19] |

## 3. PROGRESSIONSREGELN

Die Steuerung der Belastung beim Patellaspitzensyndrom erfolgt primär über das Schmerzempfinden (Skala 1–10) sowie über die qualitative und quantitative Belastbarkeit des Sehnengewebes [1, 2].

### 1. Kriterien für die Steigerung (Progression)

#### a) Steigerung der Wiederholungen

- **Kriterium:** Sobald die Durchführung einer Übung (z. B. 15 Wiederholungen der einbeinigen Kniebeuge täglich) beschwerdefrei bzw. mühelos möglich ist [3, 4].
- **Umsetzung:** Die Wiederholungszahl wird schrittweise von 1×15 täglich auf 2×15 und im Zielzustand auf 2 bis 3 Sätze à 15 Wiederholungen (2–3-mal täglich) erhöht [3, 4].

#### b) Steigerung der Last (Zusatzgewicht / Widerstand)

- **Kriterium:** Sobald der Athlet **3×15 Wiederholungen** auf der schrägen Ebene beschwerdefrei und problemlos bewältigen kann [4, 5].
- **Umsetzung:**
  - **Sehnentraining:** Schrittweise Erhöhung des Zusatzgewichts mittels Rucksack, Zusatzbeladung oder Langhantel auf den Schultern [4, 5]. Anschließend erfolgt der schrittweise Übergang in ein intensiveres Kraft- und Sprungkrafttraining [4].
  - **Dynamisches Maximalkrafttest- / Kraftprotokoll:** Bei erfolgreichem Absolvieren eines Versuchs wird die Last in Schritten von 2,5 kg bis 5 kg gesteigert [6, 7].

#### c) Steigerung der Übungsart (Phasen- & Kontinuumprogression)

- **Von Isometrie zu Exzentrik / Isotonik:** Übergang von Phase 1 (isometrisches Halten) zu Phase 2 (exzentrisches Training), sobald das isometrische Halten mühelos möglich ist und der Schmerzgrad während der Übung den Wert **2 bis 3 auf der Skala 1–10 nicht übersteigt** [8].
- **Von Heavy Slow Resistance (HSR) zu Plyometrie (Stufe 2 auf Stufe 3 im PTLE-Modell):** Übergang, sobald schwere isotonische Kraftübungen schmerzfrei bzw. gut tolerierbar absolviert werden können [9, 10].
- **Von Plyometrie zu Sportartspezifischem Training / Return to Sport (Stufe 3 auf Stufe 4 im PTLE-Modell):** Beschwerdefreie Bewältigung plyometrischer und laufspezifischer Übungen [9]. Eine Rückkehr ins normale Mannschaftstraining ist frühestens nach 4 Wochen erlaubt [9].
- **Von statischer zu dynamischer Kraftausdauer (allgemeines Athletiktraining):** In den ersten 4 Wochen werden Übungen rein statisch durchgeführt, um die Haltung und Beinachsensicherung zu korrigieren; erst danach erfolgt der Übergang zu dynamischen Elementen [11, 12].

#### d) Steigerung des Tempos & Pacing

- **Tendon Neuroplastic Training (TNT):** Steuerung des Tempos über einen externen Pacer (z. B. Metronom), der die exzentrische und konzentrische Phase fest vorgibt (z. B. 4 Sekunden exzentrisch, 3 Sekunden konzentrisch), um den sensomotorischen Kortex gezielt anzuregen [10].
- **Standard-Exzentrik:** Langsames exzentrisches Absenken (Zählen: 21–22–23 / 3 Sekunden) mit kurzem Verharren in der Endposition, gefolgt von einem zügigen Wiederaufrichten mit beiden Beinen [4, 5].

### 2. Kriterien für Reduzierung und Pausieren (Regressions- & Abbruchregeln)

#### a) Wann wird die Belastung reduziert?

- **Überschreiten des Schmerztoleranzbereichs (> 5/10):** Leichte Schmerzen bis maximal **VAS 4 bis 5 auf der 10-teiligen Skala** sind während der Übungen zulässig [1, 2].
- **Konkrete Reduktionsmaßnahmen:**
  - *(Widerspruch in den Quellen)*: Eine Quelle gibt an, dass bei so starken Schmerzen, die zum Übungsabbruch führen, die Belastung um **15 Wiederholungen pro Tag reduziert** werden muss [1]. Eine andere Quelle empfiehlt bei einem Schmerzempfinden über 5/10, **eine Woche mit reduzierter Intensität** zu trainieren [4].
  - Tritt eine erhöhte subjektive Trainingsbeanspruchung (über die sRPE-Skala oder KEB-Kurzskala Erholung und Beanspruchung) auf, müssen Trainingsumfang und -intensität angepasst werden [13, 14].

#### b) Wann wird das Übungsprogramm ausgesetzt / pausiert?

- **Aussetzen des Übungsprogramms & Arztkontakt:** Wenn trotz Reduktion der Wiederholungen um 15 pro Tag keine Beschwerdebesserung eintritt ODER wenn unter den Übungen zunehmende Schmerzen im Alltag entstehen, wird das eigenständige Übungsprogramm komplett ausgesetzt und der behandelnde Arzt konsultiert [1].
- **Sportpause / Trainingspause (nach klinischen Stadien):**
  - **Stadium 1:** Belastungsanpassung und Schonung ohne zwingende komplette Sportpause [15].
  - **Stadium 2:** Konsequente Trainingspause oder deutliche Reduktion der Belastung (insbesondere Vermeidung von Sprüngen und abrupten Bewegungen) [16, 17].
  - **Stadium 3:** Längere Sportpause bei dauerhaften Ruheschmerzen [16, 17].
- **Pausieren bei Muskelkater und Ermüdung (Sprungkraft- & Athletiktraining):** Wenn Muskelkater oder akute Ermüdungserscheinungen der Beinmuskulatur vorliegen, muss auf das Sprungkraft-Workout verzichtet und ein zusätzlicher Tag Pause eingelegt werden, um Überbelastungen der Sehne zu vermeiden [18].
- **Vermeidung schmerzprovozierender Tätigkeiten:** Während der gesamten Therapiephase müssen schmerzauslösende Aktivitäten strikt vermieden werden [19].

### 3. Übersicht der konkreten Abbruch- und Steigerungsschwellen

| Parameter | Kriterium / Schwellenwert | Aktion / Konsequenz | Quelle |
| :--- | :--- | :--- | :--- |
| **Zulässiger Schmerz bei Übungen** | VAS ≤ 4–5 / 10 | Übung kann wie geplant fortgeführt werden | [1, 2] |
| **Schmerz überschreitet Toleranz (> 5/10)** | VAS > 5 / 10 | Reduktion um 15 Wdh./Tag ODER 1 Woche verringerte Intensität | [1, 4] |
| **Keine Besserung / Alltags-Schmerzzunahme** | Anhaltender Schmerz trotz Reduktion | Übungsprogramm aussetzen + Arzt aufsuchen | [1] |
| **Übergang Isometrie → Exzentrik** | Schmerzgrad mühelos bei ≤ 2–3 / 10 | Freigabe für Phase 2 (Exzentrisches Training) | [8] |
| **Gewichtssteigerung (Zusatzgewicht)** | 3×15 Wdh. beschwerdefrei absolviert | Last schrittweise erhöhen (Rucksack / Langhantel) | [4, 5] |
| **Muskelkater / Ermüdung** | Spürbare Ermüdung / Muskelkater | Sprungkrafttraining pausieren (+1 Tag Erholung) | [18] |

## 4. SCHMERZSTEUERUNG

### 1. Verwendete Schmerzskalen

- **VAS (Visuelle Analogskala 0–10 / 0–100 mm):** Wird in allen Studien und Praxisleitfäden standardmäßig zur Quantifizierung der Schmerzintensität in Ruhe, während Übungen und bei funktionellen Leistungstests verwendet [1-4].
- **NRS (Numerische Rating-Skala 0–10):** Wird in physiotherapeutischen Eigenübungsprotokollen synonym genutzt [4, 5].
- **Anstrengungsskala Sport (sRPE 0–10):** Zur Erfassung der subjektiv wahrgenommenen Trainingsbeanspruchung (Rating of Perceived Exertion) exakt 30 Minuten nach einer Einheit zur Steuerung der Gesamttrainingsbelastung [6, 7].
- **KEB (Kurzskala Erholung und Beanspruchung):** Zur multidimensionalen Beurteilung der Befindlichkeit, Trainierbarkeit und des Regenerationsbedarfs des Athleten [6].

### 2. Akzeptable Schmerzwerte während und nach dem Training

- **Während des Trainings:**
  - **Zulässiger Schmerzbereich:** Ein leichtes Ziehen oder Schmerzen bis **maximal VAS 4 bis 5 auf der Skala 0–10** sind während der Ausführung von isometrischen und exzentrischen Übungen akzeptabel [4, 8, 9].
  - **Nicht akzeptabler Schmerzbereich:** Schmerzen **> 5/10** gelten als Überbelastung [9]. Bei Überschreitung muss die Intensität für 1 Woche reduziert [9] oder das Pensum um 15 Wiederholungen pro Tag verringert werden [10].
  - **Übergangskriterium:** Für den Aufstieg von Phase 1 (Isometrie) in Phase 2 (Exzentrik) gilt ein Schmerzgrad von **≤ 2–3 / 10** bei müheloser Übungsausführung [5].
- **Nach dem Training und im Alltag:**
  - **Akzeptabel:** Muskelkater sowie ein vorübergehend erhöhtes Spüren der Patellasehne direkt nach den Übungen sind unbedenklich [4].
  - **Nicht akzeptabel:** Zunehmende Schmerzen im Alltag (z. B. beim Treppensteigen oder Aufstehen) sowie Ruheschmerzen [10, 11]. Tritt dies auf, muss das eigenständige Training ausgesetzt und ein Arzt konsultiert werden [10].

### 3. 24-Stunden-Regel

- Eine spezifisch so bezeichnete **„24-Stunden-Regel“** (z. B. dass der Schmerz nach 24 Stunden zwingend wieder das Ausgangsniveau erreicht haben muss) ist **nicht in den Quellen** explizit genannt.
- **Vergleichbare Vorgaben zur Belastungssteuerung in den Quellen:**
  - **Zusätzlicher Ruhetag bei Ermüdung:** Tritt Muskelkater oder spürbare Ermüdung der Beinmuskulatur auf, muss auf ein Sprungkraft-Workout verzichtet und **ein zusätzlicher Tag Pause** eingelegt werden, um Sehnenüberlastungen vorzubeugen [12].
  - **Festes Abfrageintervall:** Bei der sRPE-Methode erfolgt die Erfassung der Belastung exakt 30 Minuten nach Trainingsende [6].

### 4. Tests zur Verlaufskontrolle

- **VISA-P Fragebogen (Victorian Institute of Sports Assessment for Patellar tendons):**
  - **Funktion:** Standardisiertes Messwerkzeug zur Beurteilung von Funktion, Schmerz und Sportfähigkeit bei Patellatendinopathie [13].
  - **Bewertung:** Maximal 100 Punkte (völlige Beschwerdefreiheit) [13]. Eine Erhöhung um mindestens **13 Punkte** gilt als klinisch signifikante Besserung [13].
- **Single-Leg Decline Squat (Einbeinige Kniebeuge auf schräger Ebene - 1x und 10x):**
  - **Funktion:** Funktioneller Provokationstest unter hoher Sehnenbelastung zur Messung von Schmerzspitzen (mittels VAS) und Bewegungskontrolle [1, 14].
- **Weitere funktionelle Leistungstests:**
  - **Countermovement-Jump (einbeinig & zweibeinig):** Ermittlung der Sprunghöhe und Schmerzentwicklung unter maximaler Dynamik [1, 15, 16].
  - **Triple Hop Test & Front- / Side-Hop Tests:** Überprüfung der horizontalen Reaktivkraft und Bestimmung von Seitdifferenzen via Limb Symmetry Index (LSI) [1, 17, 18].
  - **Beurteilungsbogen Einbeinige Kniebeuge (VBG):** Qualitatives Screening von Bewegungskontrolle, Beinachsensicherung und Ausweichbewegungen [14].
- **Bildgebende Verlaufskontrolle:**
  - **Sonografie mit Powerdoppler:** Zur objektiven Kontrolle der Sehnendicke, der Kollagenstruktur sowie des Rückgangs von Neovaskularisationen (Gefäßeinsprossungen) [19, 20].

## 5. WARNZEICHEN UND ABBRUCHKRITERIEN

Ein sofortiger Abbruch des Trainings sowie die Einholung ärztlichen oder physiotherapeutischen Rats sind in folgenden Situationen indiziert:

### 1. Schmerzbedingte Abbruch- und Reduktionskriterien im Training

- **Schmerzintensität > 5/10 (VAS/NRS):** Schmerzen während der Ausführung von Isometrie- oder Exzentrikübungen dürfen den Wert 4 bis maximal 5 auf einer 10-teiligen Skala nicht überschreiten [1, 2]. Wird das Training wegen zu starker Schmerzen abgebrochen, muss die Belastung an den Folgetagen um 15 Wiederholungen pro Tag verringert [3] oder für eine Woche mit reduzierter Intensität trainiert werden [2].
- **Keine Besserung trotz Dosisreduktion:** Führt die Reduktion der Belastung um 15 Wiederholungen pro Tag nicht zu einer Beschwerdelinderung, ist das eigenständige Übungsprogramm komplett auszusetzen und der behandelnde Arzt zu konsultieren [3].
- **Zunahme von Alltagsbeschwerden:** Entstehen unter oder nach den Übungen zunehmende Schmerzen bei normalen Alltagsbelastungen (z. B. beim Treppensteigen, Gehen oder Aufstehen), muss das Übungsprogramm gestoppt und ärztlicher Rat eingeholt werden [3].
- **Auftreten von Ruheschmerz und Nachtschmerz:** Schmerzen in Ruhe (z. B. beim Sitzen mit angewinkelten Beinen) oder während der Nacht deuten auf ein fortgeschrittenes Stadium 3 des Patellaspitzensyndroms hin [4, 5]. In diesem Fall ist das Belastungstraining auszusetzen und eine Sportpause unter physiotherapeutischer und ärztlicher Führung einzuleiten [5].

### 2. Klinische Warnzeichen („Red Flags“) für sofortigen Arztkontakt

- **Verdacht auf septische Prozesse / Entzündungen:**
  - Auftreten von Fieber, Schüttelfrost oder allgemeinem Krankheitsgefühl [6, 7].
  - Starke, rasch zunehmende Rötung, deutliche Überwärmung oder eitrige Sekretion im Kniebereich [6, 7].
  - Offene Hautverletzungen, Abschürfungen oder Wunden direkt über dem Kniegelenk [7].
- **Plötzlicher Funktionsverlust & Strukturschäden:**
  - Deutliche Einschränkung der Kniebeweglichkeit, Gelenkblockaden oder vollständiger Funktionsverlust des Beins [6, 7].
  - Verdacht auf Sehnenrupturen (Teil- oder Vollrisse) oder strukturelle Gewebeschäden der Patellasehne [5].
- **Akute Unklarheiten:** Starker, nicht einordnungsbarer Schmerz zur Differenzierung gegenüber einer septischen Arthritis, Gichtanfällen oder akuten Bandverletzungen [7].

### 3. Systemische Überlastung, Ermüdung & Monitoring-Kriterien

- **Muskelkater und Muskelermüdung:** Beim Auftreten von Muskelkater oder spürbarer Ermüdung der Oberschenkelmuskulatur muss das Sprungkraft- und Athletiktraining sofort pausiert und ein zusätzlicher Erholungstag eingelegt werden, um Sehnenüberlastungen vorzubeugen [8].
- **Bewegungsschmerz im Functional Movement Screen (FMS = Score 0):** Tritt bei funktionellen Bewegungstests Schmerz unabhängig von der Bewegungsausführung auf, wird dies als Score 0 („medizinisches Problem“) eingestuft; das Training darf erst nach medizinischer Abklärung begonnen werden [9, 10].
- **Maximale subjektive Erschöpfung (sRPE = 10):** Erreicht der sRPE-Wert den Maximalwert 10 („so anstrengend, dass ich abbrechen muss“), ist die Trainingseinheit sofort abzubrechen [11, 12].
- **Auffälligkeiten im Regenerations-Monitoring (KEB-Skala):** Ausgeprägte muskuläre Überanstrengung, Übersäuerung oder starker Aktivierungsmangel im KEB-Test verlangen eine sofortige Anpassung von Trainingsumfang und -intensität [13].

### 4. Therapeutische Kontraindikationen

- **Keine Stoßwellentherapie kurz nach Kortison:** Eine Kortisoninjektion innerhalb der vorangegangenen 6 Wochen gilt als strikte Kontraindikation für eine Stoßwellentherapie (ESWT) [14].
- **Verzicht auf Kortisoninjektionen in die Sehne:** Von Infiltrationen der Patellasehne mit Kortison wird aufgrund des Risikos von Gewebsatrophie und Sehnenrupturen abgeraten [15].

## 6. REGENERATION UND BELASTUNGSMANAGEMENT

### 1. Ruhetage & Erholung

- **Regenerationszeit der Muskulatur:** Eine vollständige Regeneration bei erhöhter Leistungsfähigkeit wird nach **48 bis 72 Stunden** erreicht [1, 2].
- **Zusätzliche Ruhetage bei Überlastung:** Spürt der Athlet Muskelkater oder akute Ermüdungserscheinungen in der Beinmuskulatur, muss das Sprungkraft- beziehungsweise Belastungstraining ausgesetzt und ein **zusätzlicher Tag Pause** eingelegt werden, um Sehnenüberlastungen zu vermeiden [3].
- **Aktive Regeneration (Cool-Down):** Ein 10 bis 15-minütiges lockeres, extensives Ausdauertraining (Auslaufen) direkt nach der Einheit regt den Stoffwechsel an und verkürzt die Regenerationszeit der beanspruchten Muskeln drastisch [4, 5].
- **Stoffwechsel der Patellasehne:** Die Zellteilungszeit der Sehne ist mit **8 Wochen** sehr langsam [6]. Eine Regeneration des Gewebes benötigt daher mehrere Monate dosierter Belastung statt reiner Ruhigstellung [6].

### 2. Trainingshäufigkeit pro Woche

- **Isometrisches Training (Stufe 1 / Akutphase):** **2-mal täglich** (5 Sätze à 45 Sekunden Haltearbeit) [7].
- **Exzentrisches Training (Phase 2):** Einstieg mit 15 Wiederholungen 1- bis 2-mal täglich; Steigerung auf **2- bis 3-mal täglich** (2–3 Sätze à 15 Wdh.) [7-9].
- **Sprungkraft- & Athletiktraining im Basketball:** Zu Beginn auf **2 bis 3 Einheiten pro Woche** à 30 bis 35 Minuten begrenzen [3]. Plyometrische Einheiten (Stufe 3 im PTLE-Modell) sollen maximal **2-mal pro Woche** durchgeführt werden.

### 3. Schlaf

- **Dauer:** Mindestens **7 bis 8 Stunden** Schlaf pro Nacht [10].
- **Physiologische Wirkung:** Im Tiefschlaf werden Wachstumshormone ausgeschüttet, die für die Reparatur von Muskel- und Sehnengewebe essenziell sind [10].

### 4. Ernährung & Nahrungsergänzung

- **Proteinzufuhr:** **1,6 bis 2,2 g Protein pro kg Körpergewicht** täglich zur Unterstützung der Muskel- und Geweberegeneration [10].
- **Kohlenhydrate:** Energiezufuhr vor dem Training (z. B. Haferflocken, Bananen) [10].
- **Sehnenbausteine & Stoffwechsel:** Eine frühzeitige ernährungsmedizinische Versorgung mit speziellen „Sehnenbausteinen“ unterstützt die Reparatur des Kollagengewebes [11]. Die Nährstoffversorgung der Sehne erfolgt dabei über einen mechanischen Pumpeffekt bei Beugung und Streckung des Gelenks [12].
- **Ergänzende Phytopharmaka / Entzündungshemmung:** Die Einnahme von pflanzlichen Wirkstoffen (z. B. Shakes mit **Curcumin, Boswellia und Bromelain**, 1x täglich 10 g Pulver) fördert die Geweberegeneration, wirkt entzündungshemmend und mindert oxidative Zellschäden [13, 14].

### 5. Mobilisation & Beweglichkeit

- **Mobilisationsroutine:** Dient als „indirekte Regeneration“ zur Korrektur funktioneller Defizite in der Becken-Bein-Kette [15, 16].
- **Sprunggelenks- & Hüftbeweglichkeit:** Ein Mindestmaß an Mobilität (überprüft z. B. durch den *Knee-to-Wall-Test* für das Sprunggelenk und den *Toe-Touch-Test* für die Rückenlinie) ist Voraussetzung für eine effiziente Kraftübertragung und Reduktion mechanischer Scherbelastungen auf die Patellasehne [17-20].

### 6. Dehnen & Faszienbehandlung

- **Statisches & Dynamisches Dehnen:** Gezieltes Dehnen der Oberschenkelvorderseite (Quadrizeps), der Oberschenkelrückseite (Hamstrings) sowie der Hüftbeuger mindert den mechanischen Zug am Patellasehnenansatz [21-25]. Das Dehnprogramm nach Dr. Dr. Homayun Gharavi wird spezifisch für Faszien empfohlen [26].
- **Faszienrolle (Foam Rolling / Blackroll):** Alle **2 bis 3 Tage** oder im Anschluss an das Training (Cool-Down) sollte die gesamte Beinmuskulatur vom Oberschenkel bis zur Wade gründlich ausgerollt werden, um die Muskelspannung zu regulieren und die Regeneration zu beschleunigen [25, 27-32].

### 7. Kälte- und Wärmeanwendungen (Thermotherapie)

- **Kälteanwendung (Eiskompresse):**
  - **Ausführung nach dem Training:** **3-mal ca. 5 bis 10 Minuten** mit kurzen Pausen dazwischen kühlen (ist effektiver als eine durchgehende Eisanwendung von 30 Minuten) [8, 25].
  - *(Widerspruch in den Quellen bezüglich der Dauer bei begleitender Schleimbeutelreizung/Bursitis: Hier wird eine Kühlung von 15–20 Minuten 3- bis 4-mal täglich empfohlen [33, 34]).*
  - **Wirkung:** Reduziert Schwellungen, lindert Schmerzen und beruhigt Reizungen an der Patellasehne [35, 36].
- **Kontrastduschen:** Morgens und nach dem Training empfohlen. Wechsel von warmem Wasser (bis 1 Min.) und kaltem Wasser (bis 1 Min.) über **3 bis 7 Durchgänge** (morgens kalt, abends warm beenden) [27, 28].
- **Spezifische Wärmeanwendungen für das Patellaspitzensyndrom:** **nicht in den Quellen** detailliert beschrieben (Wärme wird lediglich im Rahmen der Kontrastdusche genannt) [27, 28].

### 8. Alltags- und Sportbelastung

- **Vermeidung von Schmerzauslösern:** Während der Reha-Phase müssen schmerzauslösende Tätigkeiten im Alltag (z. B. langes Sitzen mit angewinkelten Beinen, Hocken, tiefes Knien) strikt vermieden werden [21, 25, 37, 38].
- **Dosierte Belastung statt Ruhestellung:** Ein kompletter Verzicht auf Belastung ist kontraproduktiv; eine dosierte, schmerzadaptierte Sehnenbelastung ist notwendig, um die Kollagensynthese anzuregen [6, 39, 40].
- **Entlastende Hilfsmittel (Orthesen/Taping):**
  - Das Tragen einer **Patellabandage** oder von **Sporttape** führt bei funktionellen Belastungen (z. B. Decline Squat, Sprünge) zu einer klinisch relevanten Schmerzreduktion um **12 bis 14 mm auf der VAS-Skala** [41-43]. Frauen profitieren laut Studien stärker von Sporttape als Männer [42, 43].

### 9. Return-to-Sport-Kriterien (RtS / RtC)

| Kriterium | Vorgabe / Zielwert aus den Quellen | Quelle |
| :--- | :--- | :--- |
| **Mindestzeitdauer (PTLE-Modell)** | Frühestens nach **4 Wochen** kontrolliertes Aufbautraining erlaubt; Reha-Programme erstrecken sich in Studien über **up to 24 Wochen**. | [23, 44] |
| **Ausfallzeit bei Operation** | Bei arthroskopischer Tenolyse durchschnittlich **3,5 Monate** Ausfallzeit bis zum Return to Sport. | [45] |
| **Schmerzintensität** | Absenken des Schmerz-Scores auf **VAS ≤ 2 / 10** unter Belastung. | [44] |
| **VISA-P Fragebogen** | Erhöhung des VISA-P-Werts um mindestens **13 Punkte** (in erfolgreichen PTLE-Studien Erreichung von durchschnittlich **84/100 Punkten**). | [44, 46] |
| **Funktionelle Sprung- & Belastungstests** | Beschwerdefreies Absolvieren von *Single-Leg Decline Squats*, *Countermovement Jumps*, *Triple Hop Tests* und *Side-Hops*. | [23, 47] |
| **Symmetrie-Index (LSI)** | Erreichen eines unkritischen Limb Symmetry Index (LSI) im Seitenvergleich (betroffenes vs. gesundes Bein) bei Reaktivkrafttests. | [48, 49] |
| **Engmaschiges Load-Monitoring** | Überwachung der subjektiven Trainingsbeanspruchung im RtC-Prozess mittels **sRPE-Skala** und **KEB-Monitoringskala** zur Absicherung gegen Rezidive. | [48, 50, 51] |
