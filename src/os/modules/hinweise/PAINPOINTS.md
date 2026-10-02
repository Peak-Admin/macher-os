# Hinweise & Freigaben – Top 25 Pain Points

Score = Frequenz (1–10) × Intensität (1–10).

| # | Pain Point | Freq. | Int. | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Entscheidungen stecken in Mails, Zetteln, WhatsApp | 9 | 8 | 72 | Chef |
| 2 | Wichtiges geht zwischen Unwichtigem unter | 8 | 8 | 64 | Chef, Büro |
| 3 | Fristen (Prüfung, Zahlung, Wartung) verpasst | 7 | 9 | 63 | Chef, Büro |
| 4 | Man sieht ein Problem, aber nicht, was zu tun ist | 7 | 8 | 56 | alle |
| 5 | Hinweise, die einen nicht betreffen | 7 | 6 | 42 | Monteur |
| 6 | Kein Link zum betroffenen Objekt | 6 | 6 | 36 | alle |
| 7 | Freigaben brauchen zu viele Klicks | 6 | 6 | 36 | Chef |
| 8 | Erledigtes taucht immer wieder auf | 6 | 6 | 36 | alle |
| 9 | Handy: Aktion schwer erreichbar | 6 | 5 | 30 | Monteur |
| 10 | Fälligkeit nicht sichtbar | 5 | 6 | 30 | alle |
| 11 | Chef will sehen, was das Team offen hat | 5 | 6 | 30 | Chef |
| 12 | Bewusst ignorierte Punkte nerven täglich | 6 | 5 | 30 | Chef |
| 13 | Buttons, die nichts tun | 4 | 7 | 28 | alle |
| 14 | Kein Überblick nach Art (Problem vs. Freigabe) | 5 | 5 | 25 | Chef |
| 15 | Hinweise ohne Erklärung | 5 | 5 | 25 | alle |
| 16 | Doppelte Hinweise für denselben Fall | 5 | 5 | 25 | alle |
| 17 | Versehentlich erledigt – kein Rückweg | 4 | 6 | 24 | alle |
| 18 | Status nur farbig | 4 | 5 | 20 | alle |
| 19 | Rückblick: Was wurde diese Woche entschieden? | 4 | 5 | 20 | Chef |
| 20 | Kein Undo beim Ausblenden | 4 | 5 | 20 | alle |
| 21 | Aktion schlägt fehl ohne Meldung | 3 | 6 | 18 | alle |
| 22 | Leere Liste wirkt wie Fehler | 4 | 4 | 16 | alle |
| 23 | Gewichtung unklar | 4 | 4 | 16 | Chef |
| 24 | Rollenwechsel zeigt alte Liste | 3 | 4 | 12 | alle |
| 25 | Filter zurücksetzen unklar | 3 | 4 | 12 | alle |

## Muss rein

- Vollansicht aller `offeneHinweise()`, nach Pain-Gewicht sortiert, Filter nach Art mit Zählern, „Für mich“/„Alle im Betrieb“ (nur Chef/Büro).
- Aktion ausführen (`aktionAusfuehren` → navigieren), Öffnen (`pfadZu`), Erledigt (gespeicherte), 7 Tage ausblenden – jeweils mit Rückgängig.
- Erledigte der letzten 7 Tage mit „Wieder öffnen“.

## Macher erledigt automatisch

- Nur registrierte Aktionen werden angeboten.
- Dedup über `schluessel` (Kern).

## Bewusst weggelassen (Pareto)

- Kommentare/Diskussion an Hinweisen, Delegieren an andere Personen, Eskalationsstufen.
