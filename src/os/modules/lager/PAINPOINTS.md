# Lager – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Bestand im System stimmt nicht mit dem Regal überein | 9 | 9 | 81 | B, C |
| 2 | Monteur steht auf der Baustelle, Material fehlt – war doch „auf Lager“ | 7 | 10 | 70 | M |
| 3 | Niemand weiß, was in welchem Fahrzeug liegt | 8 | 8 | 64 | M, B |
| 4 | Entnahmen werden nicht gebucht (keine Zeit, Hände dreckig) | 9 | 7 | 63 | M |
| 5 | Nachbestellung vergessen, bis es leer ist | 7 | 8 | 56 | B |
| 6 | Inventur dauert einen Samstag mit Zettel und Excel | 3 | 9 | 27 | C, B |
| 7 | Umlagern zwischen Lager und Fahrzeug wird nicht erfasst | 7 | 6 | 42 | M |
| 8 | Wareneingang wird nicht eingebucht | 6 | 7 | 42 | B |
| 9 | Kapitalbindung: zu viel im Lager, keiner weiß wie viel | 4 | 6 | 24 | C |
| 10 | Kein Protokoll, wer wann was entnommen hat | 5 | 6 | 30 | C |
| 11 | Material am Auftrag und Lagerbestand laufen getrennt | 6 | 7 | 42 | B |
| 12 | Mindestbestand nur im Kopf des Lageristen | 6 | 6 | 36 | B |
| 13 | Negativer Bestand blockiert die Buchung | 4 | 6 | 24 | M |
| 14 | Inventur-Differenzen werden einfach überschrieben, keine Spur | 3 | 6 | 18 | C |
| 15 | Mehrere Lagerorte (Halle, Keller, Container) | 3 | 5 | 15 | B |
| 16 | Material für einen Auftrag reserviert, wird aber anderswo verbaut | 5 | 7 | 35 | M, B |
| 17 | Lagerliste auf dem Handy unlesbar | 6 | 5 | 30 | M |
| 18 | Chargen/Seriennummern | 1 | 4 | 4 | B |
| 19 | Bewertung des Lagers für den Jahresabschluss | 1 | 7 | 7 | C |
| 20 | Restmengen von der Baustelle kommen nicht zurück ins System | 6 | 5 | 30 | M |
| 21 | Fahrzeug wird bestückt, aber keiner bucht es | 7 | 5 | 35 | M |
| 22 | Lagerplätze/Fächer | 2 | 3 | 6 | B |
| 23 | Barcode-Scan bei Entnahme | 4 | 4 | 16 | M |
| 24 | Inventur unterbrechen und später weitermachen | 3 | 4 | 12 | B |
| 25 | Wer darf Bestände ändern? | 3 | 4 | 12 | C |

## Muss rein
- Bestand je Lagerort: Hauptlager + Fahrzeuglager je Fahrzeug (3, 7, 21); `artikel.bestand` bleibt die eine Summe.
- Zugang, Entnahme, Umbuchung in einem Dialog, mit Hinweis statt Blockade bei negativem Bestand (4, 7, 13).
- Inventur mobil: Lagerort wählen, zählen, nur Differenzen buchen, nachvollziehbar im Protokoll (1, 6, 14, 17).
- Mindestbestand-Hinweise in Liste und Kachel, Weiterleitung in den Bedarf (5, 12).
- Bewegungsprotokoll mit Wer/Wann/Auftrag (10).

## Macher erledigt automatisch
- Verbrauchtes Material am Auftrag wird vom Fahrzeuglager des Monteurs (sonst Hauptlager) abgebucht (2, 4, 11).
- Wareneingang aus Bestellungen bucht den Zugang (8).
- Bereitgelegtes Material wird im Bedarf als reserviert behandelt (16).

## Bewusst weggelassen
- Lagerplätze/Fächer, Chargen, Lagerbewertung, Barcode-Scan, Rechte je Lagerort, pausierbare Inventur (18, 19, 22–25).
