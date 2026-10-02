# Nächster Einsatz – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sortiert nach Score.

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Zugangsinfo (Schlüssel, Hund, Parken) nicht dabei | Monteur | 7 | 9 | 63 |
| 2 | Adresse abtippen ins Navi | Monteur | 10 | 6 | 60 |
| 3 | Unklar, was genau zu tun ist | Monteur | 7 | 8 | 56 |
| 4 | Zeiterfassung vergessen zu starten/stoppen | Monteur | 8 | 7 | 56 |
| 5 | Telefonnummer vor Ort suchen | Monteur | 8 | 6 | 48 |
| 6 | Status melden per Anruf („bin da“, „bin fertig“) | Monteur, Büro | 9 | 5 | 45 |
| 7 | Mit dreckigen Händen kleine Knöpfe treffen | Monteur | 9 | 5 | 45 |
| 8 | Falscher Auftrag beim Foto/Material | Monteur | 7 | 6 | 42 |
| 9 | Aufgaben am Auftrag nicht sichtbar | Monteur | 7 | 6 | 42 |
| 10 | Bericht nach Einsatz wird aufgeschoben | Monteur | 7 | 6 | 42 |
| 11 | Vergessene offene Einsätze verfälschen Stunden | Büro, Monteur | 6 | 6 | 36 |
| 12 | Material-/Werkzeugbereitschaft unbekannt | Monteur | 5 | 7 | 35 |
| 13 | Büro pflegt Terminstatus von gestern nach | Büro | 8 | 4 | 32 |
| 14 | Offline/Funkloch im Keller | Monteur | 5 | 6 | 30 |
| 15 | Kunde nicht da, kein Kontakt | Monteur | 4 | 7 | 28 |
| 16 | Nach dem Einsatz unklar, was als Nächstes kommt | Monteur | 6 | 4 | 24 |
| 17 | Wer kommt noch mit? | Monteur, Azubi | 5 | 4 | 20 |
| 18 | Morgen-Einsatz am Vorabend nicht sichtbar | Monteur | 5 | 4 | 20 |
| 19 | Lange Beschreibungen verdecken das Wichtige | Monteur | 5 | 4 | 20 |
| 20 | Termin wurde verschoben, Monteur fährt zur alten Zeit | Monteur | 2 | 9 | 18 |
| 21 | Ansicht für Chef ohne Einsatz unnötig | Chef | 6 | 2 | 12 |
| 22 | Auftragsnummer für Rückfragen fehlt | Monteur | 4 | 3 | 12 |
| 23 | Kein Erfolgshinweis nach Start | Monteur | 5 | 2 | 10 |
| 24 | Besichtigung vs. Einsatz verwechselt | Monteur | 2 | 4 | 8 |
| 25 | Gelöschter Termin führt ins Leere | Monteur | 1 | 5 | 5 |

## Muss rein
- Genau ein Einsatz: laufend, sonst der nächste offene (14 Tage)
- Zugangshinweise des Orts prominent; Navigation (Maps-Link) und Anrufen (vor Ort → Kunde → Ansprechpartner) als große Knöpfe
- Arbeit kurz: Notiz, Beschreibung, offene Aufgaben zum Abhaken (Monteur: eigene + unzugewiesene)
- Einsatz starten / Losfahren / Bin vor Ort / Einsatz beenden; Erfassen öffnet Schnell erfassen mit Auftrag; Bericht, wenn `bericht.erstellen` existiert
- Panels anderer Module am Termin (`ObjektPanels objekt="termine"`) für Material/Werkzeug bereit

## Macher erledigt automatisch
- Start/Ende über `einsatz.starten`/`einsatz.beenden` (team), sonst Terminstatus selbst setzen + Events `einsatz.gestartet`/`einsatz.beendet`
- Vergangene Termine mit erfassten Zeiten automatisch auf „erledigt“ (`heute.terminstatus`, rückgängig machbar)
- Hinweise „nicht beendet“ / „nicht gestartet“

## Bewusst weggelassen (Pareto)
- Offline-Modus (Kernthema)
- Eigene Zeiterfassung (team)
- Routenoptimierung (planpruefung)
