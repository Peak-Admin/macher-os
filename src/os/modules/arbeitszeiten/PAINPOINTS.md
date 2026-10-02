# Arbeitszeiten – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sicht: Chef, Büro, Monteur auf der Baustelle.

| # | Pain Point | F | I | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Stundenzettel am Freitag aus dem Gedächtnis ausgefüllt – ungenau | 10 | 8 | 80 | Monteur, Büro |
| 2 | Büro tippt Zettel ab, entziffert Handschrift | 8 | 8 | 64 | Büro |
| 3 | Zeit auf welchen Auftrag? Nachkalkulation ohne Zuordnung wertlos | 8 | 8 | 64 | Chef |
| 4 | Mit dreckigen Händen am Handy: zu viele Felder | 9 | 7 | 63 | Monteur |
| 5 | Pausen nicht erfasst → ArbZG-Verstoß bei Prüfung | 6 | 8 | 48 | Chef |
| 6 | Stempeln vergessen, Zeit läuft über Nacht | 6 | 7 | 42 | Monteur, Büro |
| 7 | Fahrzeit vs. Arbeitszeit nicht getrennt | 7 | 6 | 42 | Chef, Lohn |
| 8 | Überstundenkonto unklar → Streit | 5 | 8 | 40 | Monteur, Chef |
| 9 | Einsatz starten und Zeit starten sind zwei Klicks an zwei Stellen | 8 | 5 | 40 | Monteur |
| 10 | Gestern gar nichts erfasst – fällt erst am Monatsende auf | 5 | 7 | 35 | Büro |
| 11 | Wer arbeitet gerade wo? Büro telefoniert hinterher | 7 | 5 | 35 | Büro |
| 12 | Über 10 Stunden gearbeitet, keiner merkt es | 3 | 9 | 27 | Chef |
| 13 | Werkstatt-/Bürozeiten ohne Auftrag nicht erfassbar | 5 | 5 | 25 | Monteur |
| 14 | Mitarbeiter sieht eigenes Stundenkonto nicht | 5 | 5 | 25 | Monteur |
| 15 | Terminstatus und Zeit laufen auseinander | 5 | 5 | 25 | Büro |
| 16 | Freigabe der Zeiten ist Zettelwirtschaft | 4 | 6 | 24 | Büro |
| 17 | Urlaub/Krankheit zählt im Soll falsch | 3 | 7 | 21 | Büro |
| 18 | Lohnbüro braucht Monatsliste, Export per Hand | 2 | 9 | 18 | Büro |
| 19 | Korrekturen nicht nachvollziehbar | 3 | 6 | 18 | Chef |
| 20 | Überschneidende Einträge (doppelt gestempelt) | 3 | 6 | 18 | Büro |
| 21 | Feiertage werden als Fehlstunden gerechnet | 2 | 7 | 14 | Büro |
| 22 | Ruhezeit 11 h nicht geprüft | 2 | 7 | 14 | Chef |
| 23 | Export-Format passt nicht zu Excel (Komma/Umlaute) | 2 | 6 | 12 | Büro |
| 24 | Startsaldo aus Altsystem fehlt | 1 | 6 | 6 | Büro |
| 25 | Zeiten in der Zukunft eingetragen | 1 | 4 | 4 | Büro |

## Muss rein
- Stempeluhr mit einem Tap: Start auf heutigen Termin, Fahrt, Werkstatt, Büro, Auftrag; Pause/Weiter/Stopp; Wechsel stoppt automatisch
- Aktionen `einsatz.starten`/`einsatz.beenden` mit Terminstatus und Events
- Schnell-Aktion „Zeit starten/stoppen“
- Wochenübersicht je Person und Team, Nachtrag/Korrektur mit Überschneidungsprüfung, Freigabe
- Stundenkonto (Soll aus Wochenstunden, Abwesenheiten + Feiertage gutgeschrieben)
- ArbZG-Prüfung (6/9/10 h, 11 h Ruhezeit)
- CSV-Export (Semikolon, Dezimalkomma, BOM)

## Macher erledigt automatisch
- Stempeln über Terminstatus (unterwegs → Fahrt, vor Ort → Arbeit, erledigt → Stopp)
- Vergessene Zeit auf Terminen zum Terminende beenden (zur Prüfung markiert)
- Hinweise: Zeit läuft seit gestern (1-Tap-Beenden), keine Zeiten gestern, ArbZG, Freigabe

## Bewusst weggelassen (Pareto)
- GPS/Geofencing
- Zuschläge, Lohnarten, Schichtmodelle
- Direkte Lohn-Schnittstelle (CSV reicht)
- Stempel-Terminal
