# Werkzeug & Fahrzeug bereit? – Pain Points

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Maschine ist gleichzeitig auf zwei Baustellen verplant | Büro, Monteur | 5 | 8 | 40 |
| 2 | Gerät ohne gültige Prüfung (DGUV V3) wird eingesetzt – Haftung | Chef | 5 | 9 | 45 |
| 3 | Defektes Werkzeug wird eingeplant, fällt erst vor Ort auf | Monteur | 4 | 8 | 32 |
| 4 | Fahrzeug fehlt/TÜV abgelaufen am Einsatztag | Chef | 3 | 9 | 27 |
| 5 | Team hat kein Fahrzeug für den Einsatz | Büro | 4 | 7 | 28 |
| 6 | Keiner weiß, wo die Maschine gerade ist | Monteur | 6 | 6 | 36 |
| 7 | Gerät ist in der Prüfung, aber eingeplant | Büro | 3 | 7 | 21 |
| 8 | Ersatzgerät gäbe es, aber keiner kommt drauf | Büro | 4 | 6 | 24 |
| 9 | Prüffristen werden erst nach Ablauf bemerkt | Chef | 5 | 7 | 35 |
| 10 | Ausgemusterte Geräte tauchen noch in der Planung auf | Büro | 2 | 5 | 10 |
| 11 | Fahrzeug des Monteurs wird bei Doppelbelegung nicht mitgedacht | Büro | 3 | 6 | 18 |
| 12 | Hinweise ohne Lösung | Büro | 4 | 5 | 20 |
| 13 | Prüfung kurz nach dem Einsatz fällig – wird vergessen | Chef | 4 | 4 | 16 |
| 14 | Mietgeräte nicht im System | Büro | 3 | 4 | 12 |
| 15 | Verantwortung für Gerät unklar | Chef | 4 | 4 | 16 |
| 16 | Monteur merkt erst am Lager, dass das Gerät weg ist | Monteur | 5 | 5 | 25 |
| 17 | Planung erfolgt am Handy, Prüfung zu umständlich | Büro | 4 | 4 | 16 |
| 18 | Leiterprüfung / Kalibrierung übersehen | Chef | 3 | 6 | 18 |
| 19 | Fahrzeug-Wartung kollidiert mit Einsatz | Büro | 3 | 6 | 18 |
| 20 | Mehrere Hinweise für dasselbe Gerät | Büro | 3 | 3 | 9 |
| 21 | Kein Überblick für die kommende Woche | Chef | 5 | 5 | 25 |
| 22 | Werkzeug ohne Inventarnummer schwer zuzuordnen | Lager | 3 | 3 | 9 |
| 23 | Doppelbelegung über Tage hinweg (mehrtägiger Einsatz) | Büro | 3 | 6 | 18 |
| 24 | Fahrzeuge mit festem Fahrer werden anderen zugeteilt | Büro | 3 | 5 | 15 |
| 25 | Reparaturauftrag dauert länger als gedacht | Chef | 3 | 5 | 15 |

## Muss rein
- Betriebsmittel je Termin = eingeplante + Fahrzeug der Mitarbeiter (5, 11).
- Prüfungen: defekt/ausgemustert, in Prüfung, Prüffrist am Termindatum abgelaufen, Doppelbelegung zur gleichen Zeit (1–4, 7, 9).
- Ersatz gleicher Art, frei und geprüft (8).

## Macher erledigt automatisch
- Prüfung beim Anlegen/Ändern eines Einsatzes mit Benachrichtigung (1, 3).
- Hinweis mit Aktion „Ersatz nehmen“ (tauscht im Termin) (8, 12).
- Warnung bei Prüfung innerhalb einer Woche nach dem Einsatz (13).

## Bewusst weggelassen
- Standortverfolgung, Ausgabe/Rücknahme, Prüfprotokolle – Paket material (`werkzeuge`, `pruefungen`) (6, 15, 16).
- Mietgeräte (14).
