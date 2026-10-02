# Fahrt & Route – Pain Points

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Termine liegen so eng, dass die Fahrzeit nicht reicht – Kunde wartet, Monteur hetzt | Monteur, Kunde | 8 | 8 | 64 |
| 2 | Monteur tippt jede Adresse einzeln ins Navi | Monteur | 9 | 5 | 45 |
| 3 | Kreuz und quer durch die Stadt, weil Reihenfolge nicht durchdacht ist | Chef | 6 | 6 | 36 |
| 4 | Büro hat kein Gefühl für Entfernungen beim Planen | Büro | 7 | 6 | 42 |
| 5 | Überschneidungen zwischen zwei Einsätzen fallen erst am Morgen auf | Büro | 4 | 9 | 36 |
| 6 | Keine Übersicht „Was steht heute an, wo, in welcher Reihenfolge?“ am Handy | Monteur | 9 | 5 | 45 |
| 7 | Fahrzeiten werden nicht eingeplant, Tag läuft über | Monteur | 6 | 6 | 36 |
| 8 | Adressen fehlen oder sind ungenau | Büro | 5 | 5 | 25 |
| 9 | Morgens telefoniert der Chef jedem die Route durch | Chef | 6 | 5 | 30 |
| 10 | Puffer für Parken, Material ausladen wird vergessen | Monteur | 6 | 4 | 24 |
| 11 | Lange Anfahrt bei Kleinaufträgen frisst den Gewinn | Chef | 5 | 6 | 30 |
| 12 | Planung kennt den Startpunkt (Wohnort/Betrieb) nicht | Büro | 4 | 4 | 16 |
| 13 | Verkehr / Stau unvorhersehbar | Monteur | 6 | 4 | 24 |
| 14 | Kunde fragt „Wann seid ihr da?“ | Büro | 6 | 4 | 24 |
| 15 | Fahrtenbuch / Kilometer nachträglich zusammensuchen | Büro | 4 | 5 | 20 |
| 16 | Mehrere Monteure fahren getrennt zur gleichen Baustelle | Chef | 3 | 4 | 12 |
| 17 | Neue Einsätze werden ans Ende gehängt statt in die Nähe | Büro | 5 | 5 | 25 |
| 18 | Hinweise zum Ort (Schlüssel, Parken) fehlen unterwegs | Monteur | 5 | 5 | 25 |
| 19 | Routenplanung braucht teure Extra-Software | Chef | 3 | 5 | 15 |
| 20 | Fahrzeiten zwischen Dörfern werden unterschätzt | Büro | 4 | 5 | 20 |
| 21 | Notdienst-Einschub zerschießt die Tagesroute | Monteur | 3 | 6 | 18 |
| 22 | Interne Termine (Besprechung) werden als Fahrtziel mitgezählt | Büro | 3 | 3 | 9 |
| 23 | Kein Überblick über Kilometer je Tag | Chef | 3 | 3 | 9 |
| 24 | Navigations-Links funktionieren nicht auf jedem Handy | Monteur | 3 | 4 | 12 |
| 25 | Schätzung wird als exakt verkauft und enttäuscht | Büro | 3 | 4 | 12 |

## Muss rein
- Puffer-Prüfung zwischen aufeinanderfolgenden Einsätzen inkl. Überschneidung, mit konkreter Uhrzeit als Lösung (1, 5, 7, 10).
- Tagesroute je Mitarbeiter mit **einem** Google-Maps-Link inkl. Wegpunkten (2, 6, 9).
- Entfernung: Koordinaten → Haversine; sonst PLZ-Näherung, sichtbar als „grob geschätzt“ markiert (4, 8, 25).
- Reihenfolge-Vorschlag (nächster Nachbar) mit gesparten Kilometern (3, 17).

## Macher erledigt automatisch
- Morgens Route an jeden Monteur mit ≥ 2 Einsätzen (9).
- Hinweis „Fahrzeit reicht nicht“ mit Aktion „Auf HH:MM schieben“ (1).
- Fahrweg fließt in die automatische Planung ein (11, 17).

## Bewusst weggelassen
- Live-Verkehr, echte Straßenrouten (13, 19) – kein externer Dienst, keine neue Abhängigkeit.
- Fahrtenbuch/Kilometererfassung (15) – gehört zu Arbeitszeiten/Fahrzeugen.
- Kunden-ETA (14).
