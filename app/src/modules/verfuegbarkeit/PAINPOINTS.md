# Verfügbarkeit – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | „Ist der Jonas am Donnerstag da?“ – Urlaubsliste hängt im Büro an der Wand | 9 | 7 | 63 | B, C |
| 2 | Kunde am Telefon: „Wann habt ihr Zeit?“ – Suchen in drei Kalendern | 8 | 8 | 64 | B |
| 3 | Jedes Werkzeug (Kalender, Buchung, Plantafel) rechnet Verfügbarkeit anders | 6 | 9 | 54 | alle |
| 4 | Krankheit/Berufsschule wird bei der Planung vergessen | 6 | 8 | 48 | B |
| 5 | Arbeitszeit des Betriebs (Beginn/Ende, Arbeitstage) ist nirgends hinterlegt | 5 | 7 | 35 | B |
| 6 | Beantragter (noch nicht genehmigter) Urlaub wird nicht gesehen | 5 | 6 | 30 | C |
| 7 | Halbe Tage (Arzt, Schule halbtags) | 4 | 5 | 20 | B |
| 8 | Ausgeschiedene Mitarbeiter tauchen noch in der Planung auf | 3 | 6 | 18 | B |
| 9 | Puffer für Fahrtzeit zwischen Terminen fehlt | 4 | 5 | 20 | M |
| 10 | Samstagsarbeit nur in manchen Betrieben | 3 | 5 | 15 | C |
| 11 | Mobil: „Wer ist heute da?“ schnell sehen | 5 | 3 | 15 | M |
| 12 | Verfügbare Zeitfenster für mehrere Leute gleichzeitig (2-Mann-Montage) | 3 | 5 | 15 | B |
| 13 | Gleitzeit / individuelle Arbeitszeiten | 3 | 4 | 12 | B |
| 14 | Feiertage je Bundesland | 2 | 5 | 10 | B |
| 15 | Ganztägige Termine blockieren den ganzen Tag | 3 | 3 | 9 | B |
| 16 | Status nur als Farbe | 3 | 3 | 9 | alle |
| 17 | Eintritt in der Zukunft (neuer Geselle ab 1.) | 2 | 4 | 8 | B |
| 18 | Teilzeit an bestimmten Wochentagen | 2 | 4 | 8 | B |
| 19 | Rufbereitschaft/Notdienst | 2 | 4 | 8 | C |
| 20 | Überstundenabbau als Abwesenheit | 2 | 3 | 6 | B |
| 21 | Verfügbarkeit von Subunternehmern | 1 | 4 | 4 | C |
| 22 | Export „Wer ist wann da“ | 1 | 3 | 3 | B |
| 23 | Mittagspause als blockierte Zeit | 2 | 2 | 4 | M |
| 24 | Zeitzonen/Sommerzeit-Fehler | 1 | 4 | 4 | alle |
| 25 | Abgelehnte Anträge erscheinen trotzdem | 1 | 3 | 3 | B |

## Muss rein
- **Zentrale reine Funktionen** in `daten.ts`: `verfuegbar(mitarbeiterId, start, ende)`, `pruefeVerfuegbarkeit` (mit Gründen als Text), `freieSlots(...)`, `terminKonflikte`, `verfuegbareStunden`, `geplanteStunden`, `anwesenheit` – alle mit `PlanKontext` testbar und von Kalender, Plantafel, Auslastung und Terminbuchung genutzt (3)
- Grundlage: Betriebsarbeitszeit (`betrieb.arbeitsbeginn/-ende`), Arbeitstage (Einstellung `plan.arbeitstage`), Abwesenheiten (genehmigt blockiert, beantragt warnt, abgelehnt zählt nicht, halbtags = Vormittag), bestehende Termine (ohne abgesagte), aktiv/Ein-/Austritt (1, 4–8, 15, 17, 25)
- `freieSlots` mit Raster, Zeitfenster, Wochentagen, Puffer, „mindestens n Leute frei“ (9, 12)
- Ansicht „Wer ist wann da?“ (Woche; mobil Tag) mit Text-Status + „Freie Zeit finden“ fürs Telefon (1, 2, 11, 16)
- Arbeitstage im Betrieb einstellbar (5, 10)

## Macher erledigt automatisch
- Jede Planungsansicht prüft live dieselben Regeln – kein manuelles Abgleichen (3)

## Bewusst weggelassen
- Individuelle Arbeitszeiten je Mitarbeiter, Gleitzeit, Teilzeit-Wochentage (13, 18) – Kernwunsch (Feld am Mitarbeiter)
- Feiertage (14), Rufbereitschaft (19), Subunternehmer (21), Mittagspause (23)
