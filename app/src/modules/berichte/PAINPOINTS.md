# Berichte & Protokolle – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: M = Monteur, B = Büro, C = Chef, K = Kunde.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Abends nach 10 Stunden Baustelle noch Berichte schreiben | 9 | 9 | 81 | M |
| 2 | Regieberichte ohne Kundenunterschrift → Stunden werden nicht bezahlt | 6 | 10 | 60 | C |
| 3 | Stunden und Material doppelt erfassen (Zettel, dann Bericht, dann Rechnung) | 8 | 7 | 56 | M, B |
| 4 | Berichte kommen Tage später oder gar nicht ins Büro | 8 | 7 | 56 | B |
| 5 | Handschriftliche Rapporte unleserlich | 7 | 6 | 42 | B |
| 6 | Prüfprotokolle (z. B. Elektro) fehlen bei Kontrolle/Versicherung | 4 | 10 | 40 | C |
| 7 | Material des Tages vergessen → nicht abgerechnet | 7 | 7 | 49 | C, B |
| 8 | Kunde bestreitet, dass gearbeitet wurde | 4 | 9 | 36 | C |
| 9 | Unterschiedliche Vorlagen je Monteur | 6 | 5 | 30 | B |
| 10 | Fotos passen nicht zum Bericht | 5 | 5 | 25 | B |
| 11 | Bericht als PDF an Kunde/GU schicken ist umständlich | 6 | 5 | 30 | B |
| 12 | Unklar, für welchen Einsatz noch ein Bericht fehlt | 7 | 6 | 42 | B, C |
| 13 | Messwerte auf Zetteln, später abtippen | 5 | 6 | 30 | M |
| 14 | Tätigkeitsbeschreibung zu knapp („Arbeiten erledigt“) | 7 | 5 | 35 | B, K |
| 15 | Bericht nach Unterschrift noch verändert → Beweiswert weg | 3 | 8 | 24 | C |
| 16 | Mehrere Monteure, wer war wann da? | 6 | 5 | 30 | B |
| 17 | Bautagebuch-Pflicht bei größeren Projekten | 3 | 6 | 18 | C |
| 18 | Wetter/Behinderungen nicht dokumentiert | 3 | 6 | 18 | C |
| 19 | Nummerierung der Berichte fehlt | 4 | 3 | 12 | B |
| 20 | Kunde will Kopie sofort vor Ort | 4 | 4 | 16 | K |
| 21 | Erledigte Aufgaben nicht im Bericht | 5 | 4 | 20 | B |
| 22 | Pausen falsch berechnet | 4 | 4 | 16 | B |
| 23 | Berichte im Ordner nicht auffindbar | 5 | 4 | 20 | B |
| 24 | Eigene Formularfelder je Kunde/GU | 3 | 4 | 12 | B |
| 25 | Mehrsprachige Teams | 2 | 4 | 8 | M |

## Muss rein
- Vier Arten: Tagesbericht, Regiebericht, Rapport, Prüfprotokoll (2, 6, 9).
- Automatisch vorbefüllt aus Zeiten, Material, Fotos und erledigten Aufgaben des Tages – nur per ID verwiesen, nichts doppelt (1, 3, 7, 10, 21).
- Kunde unterschreibt direkt am Handy (gemeinsame Unterschrift-Komponente); danach gesperrt (2, 8, 15).
- Druck-/PDF-Ansicht mit Kopf, Tabellen, Fotos, Unterschrift (11, 20).
- Prüfpunkte mit Ergebnis und Messwert, Vorschläge je Gewerk (6, 13).
- Fortlaufende Nummer `BR-JJJJ-0001` (19).

## Macher erledigt automatisch
- Nach beendetem Einsatz (`termine` → erledigt oder Event `einsatz.beendet`) wird der Bericht vorbereitet (Automation `berichte.vorbereiten`) (1, 4).
- Tätigkeiten werden aus Notizen und Sprachnotizen des Tages vorbefüllt (14).
- Hinweis „Einsatz beendet, aber kein Bericht“ bzw. „Bericht prüfen und abschließen“ (12).
- Stunden werden aus Zeiteinträgen inkl. Pause berechnet (16, 22).

## Bewusst weggelassen
- Bautagebuch mit Wetter, freie Formularfelder, Mehrsprachigkeit, Versand per E-Mail aus der App (17, 18, 24, 25).
- Einzelne Zeiten/Materialien aus dem Bericht abwählen – „Neu einlesen“ reicht für 80 %.
