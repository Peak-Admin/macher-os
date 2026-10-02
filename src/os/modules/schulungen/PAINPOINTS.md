# Schulungen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sicht: Chef, Büro, Monteur auf der Baustelle.

| # | Pain Point | F | I | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Nach der Schulung wird kein Nachweis eingetragen | 4 | 8 | 32 | Büro |
| 2 | Schulungstermin nicht im Kalender → Monteur verplant | 3 | 9 | 27 | Büro |
| 3 | Keiner weiß, wer als Nächstes zur Auffrischung muss | 3 | 8 | 24 | Chef |
| 4 | Kein Bezug zwischen Schulung und Qualifikation | 4 | 6 | 24 | Büro |
| 5 | Pflichtschulungen fehlen bei neuen Leuten | 3 | 7 | 21 | Chef |
| 6 | Schulung vergangen, aber nie abgeschlossen | 4 | 5 | 20 | Büro |
| 7 | Monteur kennt seinen Schulungstermin nicht | 3 | 6 | 18 | Monteur |
| 8 | Teilnahmebescheinigungen verstreut | 3 | 5 | 15 | Büro |
| 9 | Wer war bei der internen Einweisung? | 3 | 5 | 15 | Chef |
| 10 | Planung dauert, viele Felder | 3 | 5 | 15 | Büro |
| 11 | Teilnehmer krank, Nachweis trotzdem eingetragen | 2 | 7 | 14 | Büro |
| 12 | Herstellerschulung nötig für Förderprogramm | 2 | 7 | 14 | Chef |
| 13 | Schulung absagen – Termin bleibt stehen | 2 | 6 | 12 | Büro |
| 14 | Erste-Hilfe-Quote im Betrieb | 2 | 6 | 12 | Chef |
| 15 | Kosten und Ausfallzeiten unklar | 2 | 5 | 10 | Chef |
| 16 | Verlauf je Mitarbeiter fehlt | 2 | 5 | 10 | Chef |
| 17 | Inhalte/Anbieter vergessen | 2 | 4 | 8 | Chef |
| 18 | Gruppen sinnvoll bündeln | 2 | 4 | 8 | Chef |
| 19 | Gleiche Person doppelt angemeldet | 2 | 3 | 6 | Büro |
| 20 | Externe Anbieter-Kontakt fehlt | 2 | 3 | 6 | Büro |
| 21 | Unterweisungen fälschlich als Schulung geplant | 2 | 3 | 6 | Büro |
| 22 | Prüfung bestanden/nicht bestanden | 1 | 5 | 5 | Chef |
| 23 | Schulungskosten Förderung | 1 | 4 | 4 | Chef |
| 24 | Mitarbeiter will Weiterbildung anfragen | 1 | 4 | 4 | Monteur |
| 25 | Online-Schulungen | 1 | 3 | 3 | Monteur |

## Muss rein
- Liste geplant/abgeschlossen + Karte „Wer muss als Nächstes?“ mit 1-Tap „Planen“
- Planen: legt Termin (`art: schulung`) + Schulung an, Teilnehmer, Qualifikation, Inhalte, Anbieter
- Detail: Teilnahme abhaken, Abschließen, Absagen; Tab am Mitarbeiter
- Aktion `schulung.planen` für Hinweise anderer Module

## Macher erledigt automatisch
- Nachweise nach Abschluss automatisch (Automation `schulungen.nachweise`)
- Hinweis „Schulung abschließen“ nach dem Termin
- Vorschläge berücksichtigen schon Angemeldete und Unterweisungs-Qualifikationen

## Bewusst weggelassen (Pareto)
- Kosten/Förderung
- Prüfungsergebnisse
- Weiterbildungsanträge
