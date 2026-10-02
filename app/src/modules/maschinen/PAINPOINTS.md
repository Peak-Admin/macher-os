# Maschinen & Geräte – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Große Maschine (Kernbohrgerät, Rüttler) ist schon auf anderer Baustelle | 6 | 9 | 54 | M, B |
| 2 | Wer hat die Maschine gerade? | 8 | 7 | 56 | M |
| 3 | Prüfung (DGUV V3) überfällig – Haftung im Schadensfall | 4 | 10 | 40 | C |
| 4 | Defekt wird nicht gemeldet | 5 | 8 | 40 | M |
| 5 | Wartung nach Herstellervorgabe vergessen | 4 | 7 | 28 | C |
| 6 | Maschine steht im falschen Fahrzeug | 5 | 6 | 30 | M |
| 7 | Seriennummer für Service/Garantie nicht auffindbar | 3 | 6 | 18 | B |
| 8 | Teure Geräte ohne Anschaffungsdaten | 2 | 6 | 12 | C |
| 9 | Planung: Maschine doppelt verplant | 4 | 8 | 32 | B |
| 10 | Mietgeräte vs. eigene Geräte | 3 | 5 | 15 | B |
| 11 | Betriebsstunden für Wartung | 2 | 5 | 10 | C |
| 12 | Einweisung erforderlich (nur bestimmte Mitarbeiter) | 3 | 6 | 18 | C |
| 13 | Transport (passt nur in den großen Wagen) | 3 | 4 | 12 | M |
| 14 | Zubehör (Bohrkronen) fehlt | 4 | 5 | 20 | M |
| 15 | Reparaturkosten nicht nachvollziehbar | 2 | 5 | 10 | C |
| 16 | Maschine liegt in Reparatur, keiner weiß seit wann | 3 | 5 | 15 | B |
| 17 | Bedienungsanleitung nicht greifbar | 3 | 4 | 12 | M |
| 18 | Abschreibung/Restwert | 1 | 4 | 4 | C |
| 19 | Versicherungsnachweis | 1 | 5 | 5 | C |
| 20 | Verfügbarkeit für Planung | 5 | 6 | 30 | B |
| 21 | Liste am Handy | 5 | 4 | 20 | M |
| 22 | Ausgemusterte Maschinen | 2 | 3 | 6 | B |
| 23 | Gleiches Modell mehrfach | 3 | 3 | 9 | M |
| 24 | Standort „Werkstatt“ vs. „Lager“ | 3 | 3 | 9 | M |
| 25 | Kalibrierung bei Messmaschinen | 2 | 6 | 12 | C |

## Muss rein
- Eigene Liste (Art `maschine`) mit Standort/Besitzer in der Zeile, Status, Prüfwarnung (1, 2, 21).
- Gleiche Detailansicht wie Werkzeuge: Ausgabe, Defekt, Prüfung, Seriennr., Anschaffung (3, 4, 7, 8, 16).
- Statusfilter „Defekt / Prüfung“ (4, 16).

## Macher erledigt automatisch
- Prüffristen mit 30/14-Tage-Hinweis und Überfällig-Warnung (über Modul Prüfungen) (3, 5).
- Kachel zeigt defekte bzw. ausgegebene Geräte.

## Bewusst weggelassen
- Planung/Doppelbelegung (Paket planpruefung „Werkzeug bereit?“ nutzt `termine.betriebsmittelIds`), Betriebsstunden,
  Mietgeräte, Einweisungspflicht (Qualifikationen), Anleitungen (Wissen), Abschreibung (9–12, 17, 18).
