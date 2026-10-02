# Material bereit? – Pain Points

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Monteur steht beim Kunden, Material fehlt – zweite Anfahrt nötig | Monteur, Chef | 7 | 9 | 63 |
| 2 | Bestelltes Material ist am Einsatztag noch nicht da | Büro | 6 | 8 | 48 |
| 3 | Lagerbestand reicht nicht für zwei Baustellen gleichzeitig | Büro | 5 | 8 | 40 |
| 4 | Keiner prüft vorab, ob das Material da ist | Büro | 8 | 6 | 48 |
| 5 | Morgens hektisch zum Großhandel | Monteur | 6 | 6 | 36 |
| 6 | Freitext-Material (nicht im Lager) wird vergessen zu bestellen | Büro | 5 | 7 | 35 |
| 7 | Lieferzeit wird nicht beachtet | Büro | 4 | 7 | 28 |
| 8 | Material liegt bereit, aber keiner weiß es | Monteur | 5 | 4 | 20 |
| 9 | Bestand im System stimmt nicht mit Regal | Lager | 5 | 6 | 30 |
| 10 | Warnung kommt zu spät (am Einsatztag) | Büro | 5 | 7 | 35 |
| 11 | Zu viele Warnungen für Kleinkram | Büro | 4 | 4 | 16 |
| 12 | Unklar, welcher Auftrag den Bestand zuerst bekommt | Büro | 4 | 6 | 24 |
| 13 | Material für mehrtägige Baustelle wird auf einmal gebraucht | Büro | 3 | 5 | 15 |
| 14 | Kein Überblick „Was muss bis wann bestellt werden?“ | Büro | 6 | 6 | 36 |
| 15 | Monteur nimmt Material aus Lager, das für anderen Auftrag reserviert war | Monteur | 3 | 6 | 18 |
| 16 | Lieferant liefert falsch/teilweise | Büro | 3 | 6 | 18 |
| 17 | Chef muss selbst nachhaken | Chef | 4 | 5 | 20 |
| 18 | Kein Link vom Hinweis zur Bestellung | Büro | 5 | 4 | 20 |
| 19 | Besichtigungen werden fälschlich auf Material geprüft | Büro | 3 | 3 | 9 |
| 20 | Material für Wartungen ist Standard und wird nie gebucht | Büro | 4 | 4 | 16 |
| 21 | Teure Expresslieferung durch späte Erkennung | Chef | 3 | 6 | 18 |
| 22 | Material „geplant“ ohne Menge/Einheit | Büro | 3 | 3 | 9 |
| 23 | Rückgabe/Restmaterial nicht berücksichtigt | Lager | 3 | 3 | 9 |
| 24 | Am Handy keine schnelle Info, was fehlt | Monteur | 5 | 4 | 20 |
| 25 | Unterschiedliche Vorlaufzeiten je Betrieb | Chef | 3 | 3 | 9 |

## Muss rein
- Prüfung: Material am Auftrag (geplant/bestellt/bereit) vs. Lagerbestand für Einsätze der nächsten X Tage (1, 3, 4).
- Bestand nach Einsatzreihenfolge verteilen (3, 12).
- „Bestellt, noch nicht da“ und „kein Lagerartikel, nicht bestellt“ erkennen; am Vortag wird daraus ein Problem (2, 6, 10).
- Hinweis „Material fehlt für Einsatz am …“ mit Aktion Bedarf/Auftrag öffnen (14, 18).

## Macher erledigt automatisch
- Tägliche Prüfung für heute/morgen mit Benachrichtigung ans Büro (4, 10, 17).
- Konkrete Lösung: Menge + „bis wann bestellen“ (7, 14).
- Panel am Termin/Auftrag (24).

## Bewusst weggelassen
- Bestellung, Reservierung, Inventur – gehören zu Paket material (`bedarf`, `bestellungen`, `lager`) (9, 15, 16).
- Mindermengen-Regeln, Restmaterial (22, 23).
