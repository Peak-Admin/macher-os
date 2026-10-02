# Fahrzeuge – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | TÜV/HU verpasst – Bußgeld, Versicherungsproblem | 3 | 10 | 30 | C |
| 2 | Wer fährt welches Auto heute? | 8 | 6 | 48 | B, M |
| 3 | Was ist im Fahrzeug (Werkzeug)? | 8 | 7 | 56 | M |
| 4 | Material im Fahrzeuglager unbekannt → doppelt gekauft | 7 | 6 | 42 | M, B |
| 5 | UVV-Prüfung vergessen | 3 | 8 | 24 | C |
| 6 | Defekt am Fahrzeug wird nicht gemeldet | 4 | 8 | 32 | M |
| 7 | Kilometerstand für Service/Leasing fehlt | 4 | 5 | 20 | B |
| 8 | Fahrzeug fällt aus – Ersatz unklar | 2 | 8 | 16 | B |
| 9 | Fahrtenbuch | 5 | 6 | 30 | C |
| 10 | Tankkarten-Zuordnung | 4 | 4 | 16 | B |
| 11 | Schäden/Unfälle dokumentieren | 2 | 7 | 14 | C |
| 12 | Leasingende/Rückgabe | 1 | 6 | 6 | C |
| 13 | Reifenwechsel | 2 | 5 | 10 | B |
| 14 | Führerscheinkontrolle | 2 | 7 | 14 | C |
| 15 | Fahrzeug bestücken nach Standardliste | 4 | 5 | 20 | M |
| 16 | Kennzeichen/Fahrzeugschein nicht griffbereit | 3 | 4 | 12 | M |
| 17 | Private Nutzung | 2 | 4 | 8 | C |
| 18 | Fahrzeug in Werkstatt, wie lange? | 2 | 5 | 10 | B |
| 19 | GPS/Standort | 3 | 4 | 12 | C |
| 20 | Kosten je Fahrzeug | 2 | 5 | 10 | C |
| 21 | Ladungssicherung/Zuladung | 2 | 4 | 8 | M |
| 22 | Schlüsselübergabe | 4 | 3 | 12 | M |
| 23 | Fahrzeug für Einsatz planen | 5 | 5 | 25 | B |
| 24 | Neues Fahrzeug anlegen ohne Aufwand | 2 | 3 | 6 | B |
| 25 | Ausgemusterte Fahrzeuge verschwinden aus Lagerorten | 2 | 4 | 8 | B |

## Muss rein
- Liste mit Kennzeichen, Fahrer, TÜV-Warnung (1, 2).
- Detail: Fahrer festlegen/wechseln mit einem Tap, Ausstattung (welches Werkzeug ist drin) mit Ein-/Ausladen,
  Material im Fahrzeuglager (aus Lager), Kilometerstand optional, Defekt melden (3, 4, 6, 7, 16).
- Jedes Fahrzeug ist automatisch ein Lagerort im Lager (4, 25).
- Liste als Fahrzeugkarten: Profilbild des Fahrers, Fahrzeugfoto, Kennzeichen, Modell und Ampel
  (grün verfügbar, gelb im Einsatz, rot nicht fahren) mit „frei ab …“ bzw. „wieder da ab …“ (2, 8, 18, 23).

## Macher erledigt automatisch
- TÜV/HU- und UVV-Fristen mit 30/14-Tage-Hinweis und Überfällig-Warnung (Modul Prüfungen) (1, 5).
- Verbrauch am Auftrag wird vom Fahrzeuglager des Fahrers abgebucht (Modul Lager).
- Ampel und „frei ab“ rechnet Macher aus Terminen (Fahrzeug oder Fahrer eingeplant), Abwesenheit des Fahrers,
  Defekt/Werkstatt mit optionalem Datum „wieder einsatzbereit“ und TÜV-Frist.

## Kernwünsche
- Profil- und Fahrzeugfoto sind Dokumente mit Tag (`profilbild`, `fahrzeugbild`). Besser: `bildId` an Mitarbeiter/Betriebsmittel
  und ein `Avatar` mit Bild im UI-Kern.
- `wiederVerfuegbarAb` am Betriebsmittel aufnehmen (steht bisher als Zusatzfeld in `werkzeuge/daten.ts`).

## Bewusst weggelassen
- Fahrtenbuch, Tankkarten, Schäden, Leasing, Reifen, Führerscheinkontrolle (→ Qualifikationen), GPS, Kosten (9–14, 19, 20).
