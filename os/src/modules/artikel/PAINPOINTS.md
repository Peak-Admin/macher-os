# Artikel & Material – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Artikel nicht schnell gefunden (Name anders geschrieben, nur Nummer/EAN bekannt) | 9 | 8 | 72 | B, M |
| 2 | Preise veraltet – EK steigt, VK im Angebot bleibt alt | 7 | 9 | 63 | C, B |
| 3 | Aufschlag wird im Kopf/Excel gerechnet, jeder rechnet anders | 8 | 7 | 56 | C, B |
| 4 | Artikelstamm abtippen statt Großhändlerliste übernehmen | 5 | 10 | 50 | B |
| 5 | Doppelte Artikel (gleicher Artikel, drei Schreibweisen) | 6 | 7 | 42 | B |
| 6 | Monteur sieht EK-Preise, die er nicht sehen soll | 6 | 7 | 42 | C |
| 7 | Unklar, welcher Lieferant den Artikel führt | 6 | 6 | 36 | B |
| 8 | Einheit falsch (Meter vs. Ring vs. Stück) → falsche Mengen | 6 | 6 | 36 | B, M |
| 9 | Keine Übersicht, an welchen Aufträgen ein Artikel steckt | 4 | 6 | 24 | B |
| 10 | Kategorien fehlen, Liste wird unübersichtlich | 5 | 4 | 20 | B |
| 11 | Datanorm-Import kompliziert / teuer | 3 | 7 | 21 | B |
| 12 | Marge unter Wasser (VK < EK) fällt niemandem auf | 3 | 8 | 24 | C |
| 13 | Excel-CSV mit Umlauten kaputt (Windows-1252) | 4 | 5 | 20 | B |
| 14 | Hersteller-Nummer fehlt bei der Bestellung | 4 | 5 | 20 | B |
| 15 | Alte Artikel tauchen ewig in Auswahllisten auf | 5 | 3 | 15 | B, M |
| 16 | Artikelfoto/Datenblatt nicht greifbar auf der Baustelle | 4 | 4 | 16 | M |
| 17 | Bestand und Artikelstamm in zwei Systemen | 4 | 6 | 24 | B |
| 18 | Mindestbestand nirgends hinterlegt | 5 | 5 | 25 | B |
| 19 | Preisänderung muss in jedes Angebot einzeln | 3 | 6 | 18 | B |
| 20 | Barcode-Scan auf der Baustelle nicht möglich | 4 | 4 | 16 | M |
| 21 | Rabattgruppen der Großhändler schwer abzubilden | 3 | 5 | 15 | C |
| 22 | Kein Verlauf, wer Preise geändert hat | 3 | 4 | 12 | C |
| 23 | Mehrere Lieferanten je Artikel mit Preisvergleich | 3 | 4 | 12 | C |
| 24 | Löschen eines Artikels zerstört alte Aufträge | 2 | 6 | 12 | B |
| 25 | Staffelpreise/Mengenrabatte | 2 | 4 | 8 | C |

## Muss rein
- Suche über Name, Artikelnummer, EAN, Hersteller-Nr. (1) – auch global über die Suche, exakte Nummer zuerst.
- Aufschlag-Rechner: EK ↔ Aufschlag ↔ VK hängen zusammen, Marge und Warnung bei VK < EK (2, 3, 12).
- CSV-Import mit Semikolon, automatischer Spaltenerkennung, Update statt Dublette über Nummer/EAN, Windows-1252-Erkennung (4, 5, 13).
- Preise nur mit Recht „Preise & Geld“ sichtbar (6). Lieferant und Kategorie am Artikel (7, 10).
- Detail mit Verwendung an Aufträgen, Bestand je Lagerort, Lagerbewegungen, offenen Bestellungen (9, 17).
- Inaktiv-Schalter und Papierkorb statt hartem Löschen (15, 24).

## Macher erledigt automatisch
- Doppelte Artikel beim Import erkennen und aktualisieren statt neu anlegen.
- Fehlender VK beim Import: aus Standard-Aufschlag berechnen.
- Verlauf jeder Preisänderung (Zeitstrahl).

## Bewusst weggelassen
- Datanorm (als „geplant“ gekennzeichnet), Staffelpreise, Rabattgruppen, Mehrfach-Lieferanten mit Preisvergleich,
  Artikelbilder, Barcode-Scanner (25, 21, 23, 16, 20). Preisänderungen in bestehende Angebote übernehmen gehört zu Angebote.
