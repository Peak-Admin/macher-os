# Schnell erfassen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sortiert nach Score.

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Foto/Notiz landet im privaten Handy statt am Auftrag | Monteur | 10 | 8 | 80 |
| 2 | Erfassen dauert zu lange, wird aufgeschoben | Monteur | 9 | 8 | 72 |
| 3 | Material wird vergessen und nie abgerechnet | Monteur, Chef | 8 | 8 | 64 |
| 4 | Zeiten abends aus dem Kopf nachtragen | Monteur | 8 | 7 | 56 |
| 5 | Auftrag erst suchen müssen | Monteur | 9 | 6 | 54 |
| 6 | Zu viele Felder in Formularen | Monteur | 8 | 6 | 48 |
| 7 | Mehraufwand beim Kunden wird nicht festgehalten | Monteur, Chef | 6 | 8 | 48 |
| 8 | Mit Handschuhen kleine Ziele | Monteur | 8 | 5 | 40 |
| 9 | Sprachnotiz statt Tippen gewünscht | Monteur | 6 | 6 | 36 |
| 10 | Beleg (Tanken, Baumarkt) geht verloren | Monteur, Büro | 6 | 6 | 36 |
| 11 | Anruf eines Kunden unterwegs notieren | Chef, Monteur | 6 | 6 | 36 |
| 12 | Nicht von überall erreichbar | Monteur | 7 | 5 | 35 |
| 13 | Aufgabe für Kollegen/Büro schnell weitergeben | Monteur | 6 | 5 | 30 |
| 14 | Unklar, ob gespeichert wurde | Monteur | 6 | 4 | 24 |
| 15 | Falscher Auftrag vorausgewählt | Monteur | 4 | 6 | 24 |
| 16 | Erfassung ohne Netz | Monteur | 4 | 6 | 24 |
| 17 | Erfassen ohne Auftrag (Lager, Werkstatt) | Monteur | 4 | 4 | 16 |
| 18 | Zu viele Aktionen, keine Ordnung | Monteur | 4 | 4 | 16 |
| 19 | Tastatur verdeckt Eingaben | Monteur | 5 | 3 | 15 |
| 20 | Zurück zur Auswahl ohne Datenverlust | Monteur | 4 | 3 | 12 |
| 21 | Desktop-Nutzer brauchen es auch (Büro) | Büro | 4 | 3 | 12 |
| 22 | Doppelte Erfassung durch Kollegen | Monteur | 3 | 4 | 12 |
| 23 | Azubi traut sich nicht, etwas falsch zu machen | Azubi | 3 | 4 | 12 |
| 24 | Leeres Blatt ohne Erklärung | Monteur | 2 | 4 | 8 |
| 25 | Blatt verdeckt den Kontext | Monteur | 4 | 2 | 8 |

## Muss rein
- Globales Bottom-Sheet `schnell` (Plus-Knopf unten, „Neu“-Menü, Knopf „Erfassen“ am Einsatz)
- Auftrag wird vorausgewählt (payload → laufende Zeit → heutiger Einsatz) und als `auftragId` durchgereicht, jederzeit änderbar
- Große Kacheln aller `alleSchnellAktionen()`, ein Tipp öffnet das Formular des Fachmoduls, „Andere Aktion wählen“
- Leerzustand, solange kein Modul Aktionen liefert

## Macher erledigt automatisch
- Auftragsvorauswahl aus Kontext

## Bewusst weggelassen (Pareto)
- Eigene Formulare – liefern doku, team, akte, vertrieb, geld
- Offline-Warteschlange (Kern)
