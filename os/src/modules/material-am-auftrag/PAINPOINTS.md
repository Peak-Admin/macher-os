# Material am Auftrag – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Verbautes Material wird nicht berechnet – Geld verschenkt | 8 | 10 | 80 | C, B |
| 2 | Materialzettel unleserlich oder verloren | 8 | 8 | 64 | B |
| 3 | Monteur hat keine Zeit/Lust, Material zu erfassen | 9 | 7 | 63 | M |
| 4 | Material fehlt auf der Baustelle → zweite Fahrt | 6 | 9 | 54 | M, C |
| 5 | Unklar, was bestellt ist und was schon da ist | 7 | 7 | 49 | B, M |
| 6 | Material aus dem Angebot von Hand nochmal erfassen | 7 | 7 | 49 | B |
| 7 | Doppelt abgerechnet (Abschlag + Schluss) | 4 | 9 | 36 | B |
| 8 | Materialkosten pro Auftrag unbekannt | 6 | 7 | 42 | C |
| 9 | Artikel suchen dauert, Katalog unübersichtlich | 7 | 5 | 35 | M |
| 10 | Kleinmaterial ohne Artikel nicht erfassbar | 7 | 5 | 35 | M |
| 11 | Menge tippen am Handy fummelig | 7 | 4 | 28 | M |
| 12 | Falscher Auftrag gebucht | 5 | 6 | 30 | M |
| 13 | EK-Preise sieht jeder (Monteur) | 4 | 6 | 24 | C |
| 14 | Kein Überblick über alles Geplante über Aufträge hinweg | 5 | 5 | 25 | B |
| 15 | Kulanz-Material soll bewusst nicht berechnet werden | 4 | 5 | 20 | C |
| 16 | Versehentlich gelöscht | 3 | 5 | 15 | M |
| 17 | Rückware/Reste nicht erfasst | 4 | 4 | 16 | M |
| 18 | Lagerbestand stimmt nicht | 6 | 6 | 36 | B |
| 19 | Lieferschein-Abgleich | 5 | 5 | 25 | B |
| 20 | Barcode scannen | 4 | 4 | 16 | M |
| 21 | Fotos vom Lieferschein | 4 | 3 | 12 | M |
| 22 | Preisänderungen beim Großhandel | 4 | 5 | 20 | C |
| 23 | VK-Aufschlag für Freitext-Material | 4 | 5 | 20 | B |
| 24 | Einheiten-Chaos (m, Rolle, Stk) | 4 | 4 | 16 | M |
| 25 | Material je Einsatz/Tag sehen | 3 | 3 | 9 | B |

## Muss rein
- Schnell-Aktion „Material buchen“: Artikel suchen oder Freitext, Menge mit ±-Knöpfen, Auftrag vorausgewählt aus dem heutigen Termin (#3, #9, #10, #11, #12).
- Status geplant → bestellt → bereit → verbraucht mit einem Klick (#4, #5).
- Tab am Auftrag mit Summe EK, verbraucht, noch nicht abgerechnet (#8); EK nur mit Recht „geld“ (#13).
- Übersicht über alle laufenden Aufträge nach Status + „Noch abzurechnen“ (#14). Löschen mit Rückgängig (#16).

## Macher erledigt automatisch
- Angebot angenommen → Material aus Artikel- und Leistungspositionen als „geplant“ (#6).
- Rechnung versendet → enthaltenes Material wird `abgerechnetIn` markiert (#1, #7).
- Hinweis, wenn die Rechnung raus ist, aber verbautes Material auf keiner Rechnung steht – mit „Nicht berechnen“ für Kulanz (#1, #15).
- `materialFuerRechnung(auftragId)` liefert fertige Rechnungspositionen (VK aus Artikel, sonst EK + Aufschlag) (#23).

## Bewusst weggelassen
- Lagerbuchungen, Lieferschein-Abgleich, Barcode, Preispflege (#18–22) – gehören Paket material.
