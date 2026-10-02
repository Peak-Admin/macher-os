# Gewährleistung & Reklamationen – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Unklar, ob noch Gewährleistung – Abnahmedatum muss gesucht werden | 7 | 9 | 63 | C, B |
| 2 | Frist zur Mängelbeseitigung verpasst → Ersatzvornahme auf eigene Kosten | 4 | 10 | 40 | C |
| 3 | Reklamation per Telefon angenommen, nirgends notiert | 7 | 8 | 56 | B, M |
| 4 | Nacharbeit wird berechnet, obwohl Gewährleistung – Kunde sauer | 4 | 9 | 36 | B |
| 5 | Kostenpflichtige Arbeit wird aus Unsicherheit verschenkt | 5 | 8 | 40 | C |
| 6 | Keine Fotos vom Mangel – Beweis fehlt bei Streit | 6 | 8 | 48 | M, C |
| 7 | Nacharbeit wird nicht eingeplant, rutscht durch | 6 | 8 | 48 | B |
| 8 | Status unklar: Ist der Mangel behoben? | 6 | 6 | 36 | C, B |
| 9 | BGB vs. VOB, Bauwerk vs. Reparatur – Fristen verwechselt | 4 | 7 | 28 | C |
| 10 | Monteur sieht vor Ort einen Mangel, meldet ihn nicht | 5 | 6 | 30 | M |
| 11 | Mangel ohne Bezug zum ursprünglichen Auftrag | 5 | 6 | 30 | B |
| 12 | Herstellergarantie der Anlage nicht bekannt | 4 | 6 | 24 | B |
| 13 | Ablehnungsgrund nicht dokumentiert | 3 | 7 | 21 | C |
| 14 | Kunde wird nicht informiert, wann nachgebessert wird | 5 | 5 | 25 | B |
| 15 | Kosten für Nacharbeit werden nicht erfasst (Nachkalkulation) | 4 | 5 | 20 | C |
| 16 | Kulanzentscheidung nicht nachvollziehbar | 3 | 5 | 15 | C |
| 17 | Mehrfachreklamationen derselben Stelle werden nicht erkannt | 3 | 6 | 18 | C |
| 18 | Mängel aus Abnahmeprotokoll werden nicht nachverfolgt | 4 | 7 | 28 | B |
| 19 | Subunternehmer verursacht Mangel – Regress vergessen | 2 | 8 | 16 | C |
| 20 | Angebot für kostenpflichtige Arbeit wird nicht geschrieben | 4 | 6 | 24 | B |
| 21 | Gewährleistungsbürgschaften laufen ab | 2 | 6 | 12 | C |
| 22 | Mangel-Liste für Kunden/Hausverwaltung fehlt | 3 | 4 | 12 | B |
| 23 | Fotos zu groß, Handy-Upload dauert | 4 | 4 | 16 | M |
| 24 | Unterschiedliche Fristen je Kunde | 2 | 4 | 8 | B |
| 25 | Rechtsberatung erwartet | 2 | 5 | 10 | C |

## Muss rein
Mangel aufnehmen (Kunde, Auftrag, Anlage, Fotos, Kanal) – auch als „Schnell erfassen“ am Handy (3, 6, 10, 11, 23),
Detail mit Prüfung, Entscheidung, Frist, Nacharbeit, Fotos, Ablehnen mit Grund (8, 13, 16), Tab am Auftrag, Panels an Kunde und Anlage.

## Macher erledigt automatisch
- Gewährleistung prüfen: Abnahme/Abschluss + 5 J. (BGB Bauwerk) / 2 J. (BGB sonstige) / 4 J. (VOB/B Bauwerk) / 2 J. (VOB/B sonstige), Vorrang `anlage.gewaehrleistungBis` (1, 9, 12)
- Nacharbeitsauftrag (`art: 'reklamation'`) mit Frist anlegen; kostenpflichtig → Phase `angebot` + Hinweis „Angebot erstellen“ (7, 20)
- Status aus der Nacharbeit nachführen; Gewährleistung/Kulanz ohne Rechnung abschließen (4, 8)
- Hinweise bei Frist ≤ 3 Tage / überschritten und bei ungeklärter Gewährleistung (2, 5)

## Bewusst weggelassen
Bürgschaften, Subunternehmer-Regress, Mangellisten-Export, Rechtsberatung (nur Hinweis „keine Rechtsberatung“).
