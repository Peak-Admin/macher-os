# Bestellungen – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Bestellungen per Telefon/Zettel – keiner weiß, was bestellt ist | 8 | 8 | 64 | B, M |
| 2 | Lieferung kommt nicht, fällt erst am Einsatztag auf | 5 | 10 | 50 | B, M |
| 3 | Bestell-E-Mail jedes Mal neu tippen (Kundennummer, Artikelnummern) | 8 | 6 | 48 | B |
| 4 | Wareneingang wird nicht gegen die Bestellung geprüft | 6 | 7 | 42 | B |
| 5 | Teillieferung: Rest gerät in Vergessenheit | 5 | 8 | 40 | B |
| 6 | Material am Auftrag bleibt „geplant“, obwohl längst da | 6 | 6 | 36 | M, B |
| 7 | Viele kleine Bestellungen beim selben Lieferanten | 6 | 5 | 30 | B |
| 8 | Lieferadresse unklar (Lager oder Baustelle/Fahrzeug) | 5 | 6 | 30 | B |
| 9 | Kein Liefertermin bekannt | 6 | 6 | 36 | B |
| 10 | Bestellentwurf liegt rum und wird nie abgeschickt | 4 | 7 | 28 | B |
| 11 | Stornos werden nicht im Auftrag zurückgenommen | 3 | 6 | 18 | B |
| 12 | Monteur fragt „Ist das bestellt?“ | 7 | 4 | 28 | M |
| 13 | Bestellsumme unklar vor dem Abschicken | 4 | 5 | 20 | C |
| 14 | Auftragsbestätigung vom Lieferanten nicht abgeglichen | 4 | 5 | 20 | B |
| 15 | Eingangsrechnung passt nicht zur Bestellung | 4 | 6 | 24 | B |
| 16 | Bestellnummern fehlen für Rückfragen | 4 | 4 | 16 | B |
| 17 | Shop-Anbindung (IDS/OCI) fehlt | 3 | 6 | 18 | B |
| 18 | Rücksendungen/Retouren | 2 | 5 | 10 | B |
| 19 | Freigabe größerer Bestellungen durch den Chef | 2 | 5 | 10 | C |
| 20 | Lieferanten-E-Mail fehlt | 3 | 5 | 15 | B |
| 21 | Bestellung telefonisch, trotzdem im System brauchen | 6 | 4 | 24 | B |
| 22 | Mehrere Lieferorte in einer Bestellung | 2 | 4 | 8 | B |
| 23 | Mindestbestellwert/Frachtfrei-Grenze | 3 | 4 | 12 | C |
| 24 | Bestellhistorie je Lieferant | 3 | 3 | 9 | C |
| 25 | Ware für falschen Auftrag eingebucht | 3 | 5 | 15 | B |

## Muss rein
- Je Lieferant ein offener Entwurf, Positionen aus Bedarf oder von Hand (7).
- Status Entwurf → bestellt → teilgeliefert → geliefert (+ storniert), Bestellnummer B-JJJJ-NNNN (1, 16).
- „Per E-Mail bestellen“: `mailto:` mit fertigem Bestelltext (Kundennummer, Art.-Nr., EAN, Lieferadresse, Liefertermin) – oder „Telefonisch bestellt“ (3, 21).
- Liefertermin aus Lieferzeit, Lieferort (Hauptlager oder Fahrzeug), Summe netto (8, 9, 13).
- Wareneingang je Position mit Teilmengen; Rest bleibt offen (4, 5).

## Macher erledigt automatisch
- Beim Bestellen gehen verknüpfte Materialbuchungen auf „bestellt“, beim Wareneingang (sobald abgedeckt) auf „bereit“ (6, 12).
- Wareneingang bucht den Lagerzugang in den Lieferort.
- Hinweis bei überfälliger Lieferung, Hinweis bei liegengebliebenen Entwürfen (2, 10).
- Storno setzt bestelltes Material zurück auf „geplant“ – es taucht wieder im Bedarf auf (11).

## Bewusst weggelassen
- IDS/OCI-Shopanbindung, Retouren, Freigabe-Workflow, Abgleich mit Auftragsbestätigung/Eingangsrechnung (Paket geld),
  Mindestbestellwert, mehrere Lieferorte je Bestellung (14, 15, 17–19, 22, 23).
