# Einsatzplanung – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Wochenplanung passiert am Freitagabend im Kopf des Chefs – keiner sieht sie | 9 | 10 | 90 | C |
| 2 | Doppelbuchung oder Einsatz im Urlaub fällt erst am Morgen auf | 8 | 10 | 80 | C, B |
| 3 | Krankmeldung um 6:30 – welche Termine sind betroffen, wer springt ein? | 7 | 10 | 70 | C, B |
| 4 | Kein Überblick „wer hat diese Woche noch Luft?“ | 9 | 7 | 63 | C, B |
| 5 | Auftrag ist beauftragt, aber „wann machen wir das?“ wird vergessen | 7 | 9 | 63 | C, B |
| 6 | Umplanen eines Einsatzes = Termin löschen, neu anlegen, alle anrufen | 8 | 7 | 56 | B |
| 7 | Einsatz außerhalb der Arbeitszeit/am Wochenende ohne es zu merken | 6 | 8 | 48 | B |
| 8 | Wie viele Stunden des Auftrags sind schon verplant, wie viele fehlen? | 6 | 7 | 42 | C |
| 9 | Plantafel aus Magneten/Excel ist nicht mobil | 7 | 6 | 42 | C, M |
| 10 | Azubi an Berufsschultagen eingeplant | 5 | 7 | 35 | B |
| 11 | Neuer Termin: erste freie Lücke des Monteurs von Hand suchen | 8 | 4 | 32 | B |
| 12 | Monteur sieht nicht, mit wem er zusammen eingeteilt ist | 6 | 5 | 30 | M |
| 13 | Beantragter Urlaub kollidiert mit fest zugesagten Terminen | 4 | 7 | 28 | C |
| 14 | Teams/Kolonnen werden einzeln eingeplant | 5 | 5 | 25 | B |
| 15 | Vergangene Tage werden versehentlich verplant | 4 | 5 | 20 | B |
| 16 | Qualifikation fehlt (z. B. Elektrofachkraft) – Paket planpruefung | 4 | 5 | 20 | C |
| 17 | Fahrtzeiten zwischen Einsätzen ignoriert – Paket planpruefung | 5 | 4 | 20 | M |
| 18 | Material/Werkzeug nicht bereit – Paket planpruefung | 4 | 5 | 20 | M |
| 19 | Rückgängig nach falschem Verschieben fehlt | 3 | 6 | 18 | B |
| 20 | Konflikte sind nur farbig markiert (Farbenblindheit, Sonne aufs Display) | 4 | 4 | 16 | alle |
| 21 | Büro-Mitarbeiter tauchen in der Plantafel auf und stören | 4 | 3 | 12 | B |
| 22 | Phase des Auftrags wird beim Einplanen falsch umgestellt | 2 | 6 | 12 | B |
| 23 | Wochenende ein-/ausblenden | 3 | 3 | 9 | B |
| 24 | Druckansicht für die Werkstattwand | 2 | 4 | 8 | C |
| 25 | Planungshistorie für Streitfälle | 2 | 3 | 6 | C |

## Muss rein
- **Plantafel Mitarbeiter × Tage (Woche)**, Abwesenheiten in der Zelle als Text („Urlaub“, „Berufsschule“) (1, 4, 10)
- Einplanen per Klick: Auftrag wählen → bei Mitarbeiter/Tag „Hier einplanen“ → Formular mit **erster freier Zeit und Reststunden** vorbelegt (5, 8, 11)
- Konflikte sofort als **Text-Status** (Doppelt gebucht, Urlaub, Außerhalb der Arbeitszeit, Kein Arbeitstag) (2, 7, 20)
- Drag & Drop am Rechner zum Umplanen (anderer Tag / anderer Mitarbeiter) mit Rückgängig (6, 19)
- Mobil: Tagesansicht je Mitarbeiter (9)
- Aktion `plan.einplanen { auftragId }` → Plantafel mit vorausgewähltem Auftrag
- Phase des Auftrags bleibt unverändert (in_arbeit setzt der Einsatzstart) (22)

## Macher erledigt automatisch
- Konflikte der nächsten 14 Tage als Hinweis in „Braucht dich“ (2)
- Neue genehmigte Abwesenheit → betroffene Termine finden, Benachrichtigung + Eintrag in „Erledigt“ (3, 13)
- Stunden je Mitarbeiter und Woche direkt in der Zeile (4)

## Bewusst weggelassen
- Teams/Kolonnen als eigene Zeile (Kern hat nur `team` als Freitext) (14)
- Prüfungen Qualifikation, Fahrt, Material, Werkzeug → Paket planpruefung über `ObjektPanels` am Termin (16–18)
- Druckansicht, Planungshistorie (24, 25 – Zeitstrahl am Termin reicht)
