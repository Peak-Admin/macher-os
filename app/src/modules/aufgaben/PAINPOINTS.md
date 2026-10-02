# Aufgaben – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Zurufe („Kannst du mal …“) werden vergessen | 10 | 8 | 80 | C, B, M |
| 2 | Aufgaben stehen in WhatsApp, Notizbuch, Kopf – nirgends gesammelt | 9 | 8 | 72 | C, B |
| 3 | Unklar, wer zuständig ist | 8 | 8 | 64 | B, M |
| 4 | Fristen verpasst (Rückruf, Bestellung) | 7 | 8 | 56 | B |
| 5 | Erfassen dauert zu lange – also lässt man es | 9 | 6 | 54 | M, C |
| 6 | Aufgabe hängt nicht am Auftrag, Kontext fehlt | 7 | 7 | 49 | M, B |
| 7 | Abhaken am Handy mit dreckigen Händen fummelig | 8 | 5 | 40 | M |
| 8 | Überfälliges fällt niemandem auf | 6 | 7 | 42 | C |
| 9 | Meine Aufgaben vs. alle – zu viel Rauschen | 7 | 5 | 35 | M |
| 10 | Doppelte Aufgabenlisten in mehreren Tools | 6 | 6 | 36 | B |
| 11 | Erledigte Aufgaben bleiben stehen, wenn der Auftrag fertig ist | 5 | 5 | 25 | B |
| 12 | Wichtiges nicht von Unwichtigem unterscheidbar | 6 | 5 | 30 | C |
| 13 | Versehentlich abgehakt – nicht rückgängig | 4 | 6 | 24 | M |
| 14 | Keine Notiz zur Aufgabe möglich | 5 | 4 | 20 | B |
| 15 | Wer hat wann erledigt? | 4 | 5 | 20 | C |
| 16 | Aufgaben ohne Datum gehen unter | 5 | 4 | 20 | B |
| 17 | Andere Module erzeugen eigene „To-dos“ statt echter Aufgaben | 5 | 5 | 25 | B |
| 18 | Fälligkeitsdatum eingeben ist umständlich | 6 | 3 | 18 | B |
| 19 | Suche nach alten Aufgaben | 3 | 4 | 12 | B |
| 20 | Löschen ohne Papierkorb | 2 | 6 | 12 | B |
| 21 | Benachrichtigung bei neuer Aufgabe | 4 | 3 | 12 | M |
| 22 | Wiederkehrende Aufgaben | 3 | 4 | 12 | B |
| 23 | Unteraufgaben | 2 | 3 | 6 | B |
| 24 | Zeitschätzung je Aufgabe | 2 | 3 | 6 | C |
| 25 | Kommentar-Threads | 2 | 3 | 6 | B |

## Muss rein
- Eine Aufgabe überall (`db.aufgaben`): Liste Meine/Alle/Zuletzt erledigt, gruppiert nach Fälligkeit (#2, #9, #16).
- Schnell abhaken mit großer Checkbox + „Rückgängig“ (#7, #13). Schnell-Aktion „Aufgabe“ und Formular in 1 Feld (#1, #5).
- Fälligkeit mit Schnellwahl Heute/Morgen/In einer Woche (#18), Zuständig, „Wichtig“ (#3, #12).
- Tab „Aufgaben & Checklisten“ in der Akte (#6), Detailseite mit Notiz und Verlauf (#14, #15), Papierkorb (#20).

## Macher erledigt automatisch
- Überfällige Aufgaben als Hinweis für den Zuständigen mit „Erledigt“-Knopf (#4, #8).
- Aufgaben, die Macher selbst angelegt hat, schließen mit dem Auftrag (#11).
- Aktion `aufgabe.anlegen` für andere Pakete, damit es keine Parallel-To-dos gibt (#10, #17).

## Bewusst weggelassen
- Unteraufgaben, Kommentar-Threads, Zeitschätzung, wiederkehrende Aufgaben (#22–25) – wiederkehrende Arbeit läuft über Serien/Wartung.
