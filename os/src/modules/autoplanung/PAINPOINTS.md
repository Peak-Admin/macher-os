# Automatische Planung – Pain Points

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Wochenplanung dauert Stunden – Puzzle im Kopf des Chefs | Chef, Büro | 9 | 8 | 72 |
| 2 | Notdienst/Störung: wer kann am schnellsten hin? | Büro | 7 | 9 | 63 |
| 3 | Planung hängt an einer Person (Chef) – fällt sie aus, steht alles | Chef | 5 | 9 | 45 |
| 4 | Ungleiche Auslastung: einer überlastet, einer hat Leerlauf | Chef | 6 | 6 | 36 |
| 5 | Qualifikation, Urlaub, Fahrweg werden beim Planen übersehen | Büro | 6 | 7 | 42 |
| 6 | Kundenwunsch („nachmittags“) wird vergessen | Büro | 6 | 5 | 30 |
| 7 | Große Aufträge werden nicht sauber über Tage verteilt | Büro | 5 | 6 | 30 |
| 8 | Aufträge liegen beauftragt herum, ohne Termin | Chef | 6 | 7 | 42 |
| 9 | Kein Vertrauen in Software-Vorschläge („Warum der?“) | Chef | 6 | 6 | 36 |
| 10 | Unnötige Fahrkilometer durch schlechte Reihenfolge | Chef | 6 | 5 | 30 |
| 11 | Doppelbuchungen beim schnellen Einplanen | Büro | 4 | 8 | 32 |
| 12 | Neue Anfragen: keine Ahnung, wann frühestens Platz ist | Büro | 7 | 5 | 35 |
| 13 | Viele Klicks pro Termin | Büro | 8 | 4 | 32 |
| 14 | Geschätzte Stunden fehlen am Auftrag | Büro | 6 | 4 | 24 |
| 15 | Vorschlag ist veraltet, weil inzwischen geplant wurde | Büro | 3 | 6 | 18 |
| 16 | Chef wird für alles eingeplant, obwohl Monteure frei wären | Chef | 4 | 5 | 20 |
| 17 | Azubi wird als Verantwortlicher vor Ort eingeplant | Büro | 3 | 7 | 21 |
| 18 | Mehrere offene Aufträge blockieren sich gegenseitig | Büro | 5 | 5 | 25 |
| 19 | Planung ignoriert die aktuelle Uhrzeit (heute 8 Uhr ist vorbei) | Büro | 4 | 4 | 16 |
| 20 | Rückgängig machen nach Fehlklick | Büro | 3 | 5 | 15 |
| 21 | Planung am Handy unterwegs | Chef | 5 | 4 | 20 |
| 22 | Material-/Werkzeugverfügbarkeit nicht berücksichtigt | Büro | 4 | 6 | 24 |
| 23 | Wochenenden/Feiertage | Büro | 3 | 4 | 12 |
| 24 | Krumme Uhrzeiten (12:47) sind unpraktisch | Monteur | 3 | 3 | 9 |
| 25 | Wiederkehrende Wartungen manuell einplanen | Büro | 5 | 5 | 25 |

## Muss rein
- Vorschläge je Auftrag: Slots + Mitarbeiter, Score aus Verfügbarkeit, Qualifikation (Pflicht), Fahrweg zum Vortermin, Auslastung, Wunschtermin, Dringlichkeit – **mit Begründung in Klartext** (1, 2, 4, 5, 6, 9).
- Mehrtägig aufteilen, ab 16 h zu zweit (Rückfall auf eine Person) (7).
- Alle offenen Aufträge auf einmal vorplanen → Vorschau → übernehmen; Vorschläge blocken sich gegenseitig nicht (1, 8, 18).
- Bestätigen legt Termine an, mit Kollisionsprüfung und Rückgängig (11, 15, 20).
- Aktion `plan.vorschlag`, Panel „Einplanen“ am Auftrag (13, 21).

## Macher erledigt automatisch
- Dringender Auftrag → Planvorschlag als Freigabe in „Braucht dich“ („So einplanen“) (2).
- Freigabe schließt sich, sobald ein Termin angelegt ist.
- Einsatz-Check (Qualifikation, Fahrt, Material, Werkzeug) am Termin und Auftrag (5, 22).

## Bewusst weggelassen
- Globale Optimierung (Solver) – Greedy nach Priorität ist nachvollziehbar und schnell genug.
- Feiertage (23), Material als harte Bedingung (22, nur als Check), Serienplanung (25 → Paket service).
