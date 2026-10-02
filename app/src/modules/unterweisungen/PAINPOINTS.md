# Unterweisungen & Nachweise – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sicht: Chef, Büro, Monteur auf der Baustelle.

| # | Pain Point | F | I | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Monteure sind nie gleichzeitig im Betrieb | 6 | 6 | 36 | Chef |
| 2 | Jährliche Unterweisung vergessen – bei Unfall haftet der Chef | 3 | 10 | 30 | Chef |
| 3 | Unterschriftenliste auf Papier, nie vollständig | 4 | 7 | 28 | Chef |
| 4 | Neue Mitarbeiter vor der ersten Baustelle nicht unterwiesen | 3 | 9 | 27 | Chef |
| 5 | Monteur liest lange PDFs nicht | 5 | 5 | 25 | Monteur |
| 6 | Wer ist offen? Liste fehlt | 4 | 6 | 24 | Büro |
| 7 | Erinnern ist Handarbeit | 4 | 5 | 20 | Büro |
| 8 | Monteur weiß nicht, was er bestätigen muss | 4 | 5 | 20 | Monteur |
| 9 | Nachweis bei BG-Prüfung nicht auffindbar | 2 | 9 | 18 | Chef |
| 10 | Präsenz-Unterweisung muss trotzdem digital nachweisbar sein | 3 | 6 | 18 | Büro |
| 11 | Gewerkspezifische Themen (Elektro, Gas) | 3 | 6 | 18 | Chef |
| 12 | Rollen unterscheiden (Büro braucht keine Leitern) | 4 | 4 | 16 | Chef |
| 13 | Zu viele Einzelhinweise nerven | 4 | 4 | 16 | alle |
| 14 | Qualifikationsmatrix und Unterweisung doppelt gepflegt | 3 | 5 | 15 | Büro |
| 15 | Inhalte jedes Jahr neu zusammensuchen | 2 | 6 | 12 | Chef |
| 16 | Fälligkeit 12 Monate selbst rechnen | 3 | 4 | 12 | Büro |
| 17 | Kein Verlauf wer wann | 2 | 6 | 12 | Chef |
| 18 | Sprachbarrieren | 2 | 6 | 12 | Chef |
| 19 | Bestätigung „gelesen“ ohne Verständnis | 2 | 5 | 10 | Chef |
| 20 | Gefährdungsbeurteilung fehlt als Grundlage | 1 | 7 | 7 | Chef |
| 21 | Fremdfirmen/Subunternehmer | 1 | 6 | 6 | Chef |
| 22 | Ausgetretene in Liste | 2 | 3 | 6 | Büro |
| 23 | Unterweisung ändert sich, alte Bestätigungen? | 1 | 5 | 5 | Chef |
| 24 | Testfragen | 1 | 4 | 4 | Chef |
| 25 | Unterweisung pausieren (saisonal) | 1 | 3 | 3 | Chef |

## Muss rein
- Liste mit „Für dich zu bestätigen“ oben, Stand je Unterweisung
- Detail: Inhalt als kurze Punkte, Checkbox + „Jetzt bestätigen“ am Handy
- Nachweisliste mit Stand, „Unterwiesen“ für Präsenz-Unterweisung, „Offene erinnern“
- Anlegen/Bearbeiten: Inhalt, Intervall, Rollen, verknüpfte Qualifikation; 5 Startvorlagen (gewerkabhängig)

## Macher erledigt automatisch
- Erinnerung aufs Handy einmal je Runde (Automation `unterweisungen.erinnern`)
- Bestätigung verlängert den Nachweis in der Qualifikations-Matrix
- Hinweise gebündelt: je Mitarbeiter einer, fürs Büro einer mit „Alle erinnern“

## Bewusst weggelassen (Pareto)
- Testfragen/Quiz
- Mehrsprachigkeit
- Fremdfirmen
- Versionierung der Inhalte
