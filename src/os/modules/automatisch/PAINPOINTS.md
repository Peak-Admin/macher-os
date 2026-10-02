# Automatisch erledigen – Top 25 Pain Points

Score = Frequenz (1–10) × Intensität (1–10).

| # | Pain Point | Freq. | Int. | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Fristen (Wartung, Prüfung, Rechnungen) werden nur geprüft, wenn jemand reinschaut | 8 | 9 | 72 | Chef, Büro |
| 2 | Man weiß nicht, was die Software selbst tut – Misstrauen | 7 | 8 | 56 | Chef |
| 3 | Zu viele Schalter, unverständliche Technikbegriffe | 6 | 7 | 42 | Chef |
| 4 | Prüfung nur einmal am Tag – Neues bleibt liegen | 6 | 7 | 42 | Büro |
| 5 | Automatik nervt und lässt sich nicht abschalten | 5 | 8 | 40 | Chef, Büro |
| 6 | Regeln verteilt über viele Einstellungsseiten | 6 | 6 | 36 | Chef |
| 7 | Nutzen von Automatisierung nicht sichtbar | 6 | 6 | 36 | Chef |
| 8 | Unklar, wann zuletzt geprüft wurde | 5 | 6 | 30 | Büro |
| 9 | Automationen anderer Module ohne Beschreibung | 5 | 6 | 30 | alle |
| 10 | Erfundene Zeitersparnis-Zahlen | 4 | 7 | 28 | Chef |
| 11 | Ausgeschaltete Regel: wer macht es jetzt? | 4 | 7 | 28 | Chef |
| 12 | Fehler einer Regel legt alles lahm | 3 | 9 | 27 | alle |
| 13 | Protokoll-Spam bei jeder Prüfung | 5 | 5 | 25 | Chef |
| 14 | Monteur schaltet versehentlich Regeln ab | 3 | 8 | 24 | Chef |
| 15 | Unklar, ob Regel standardmäßig an ist | 4 | 5 | 20 | Chef |
| 16 | Status nur über Farbe | 4 | 5 | 20 | alle |
| 17 | Neue Mitarbeiter verstehen nicht, warum Dinge passieren | 4 | 5 | 20 | Büro |
| 18 | Kein „Jetzt prüfen“ nach großer Änderung | 4 | 5 | 20 | Büro |
| 19 | Gruppierung fehlt – lange Liste | 5 | 4 | 20 | Chef |
| 20 | Abhängigkeit vom Server-Cronjob | 3 | 6 | 18 | Chef |
| 21 | Mobile Bedienung der Schalter | 4 | 4 | 16 | Chef |
| 22 | Kein Rückblick über 30 Tage | 4 | 4 | 16 | Chef |
| 23 | Doppelte Ausführung beim Start | 3 | 5 | 15 | alle |
| 24 | Zeitzonen/Tageswechsel | 3 | 4 | 12 | alle |
| 25 | Regeln laufen vor dem Onboarding ins Leere | 3 | 4 | 12 | alle |

## Muss rein

- Übersicht aller `alleAutomationen()` nach Modul gruppiert, mit Schalter (`setzeAutomation`, nur mit Recht „Einstellungen“) und Beschreibung.
- Je Regel: zuletzt, Anzahl in 30 Tagen, Zeit aus `db.erledigungen` – als Schätzung gekennzeichnet.
- Kennzahlen: eingeschaltet, ausgeführt, gesparte Zeit (Schätzung); „Jetzt prüfen“.

## Macher erledigt automatisch

- Querschnitts-Regel `macher.pruefung`: alle `pruefen()` beim Start (Kern) und alle 30 Minuten, solange die App offen ist; Fehler einzelner Regeln isoliert; Erledigt-Eintrag nur einmal am Tag.

## Bewusst weggelassen (Pareto)

- Eigene Regeln bauen (Wenn-Dann-Editor), Zeitpläne pro Regel, Server-seitige Ausführung.
