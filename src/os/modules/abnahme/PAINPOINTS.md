# Abnahme & Unterschrift – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: M = Monteur, B = Büro, C = Chef, K = Kunde.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Keine förmliche Abnahme → Gewährleistung und Fälligkeit unklar | 6 | 10 | 60 | C |
| 2 | Schlussrechnung wird nicht bezahlt, weil „noch Mängel offen“ sind | 6 | 9 | 54 | C, B |
| 3 | Abnahmeprotokoll auf Papier vergessen oder verloren | 6 | 8 | 48 | M, C |
| 4 | Mängel aus der Abnahme werden nicht abgearbeitet | 6 | 8 | 48 | C, B |
| 5 | Kunde unterschreibt nicht, Grund nicht festgehalten | 3 | 8 | 24 | C |
| 6 | Unterschrift auf dem Handy klappt nicht (Seite scrollt beim Zeichnen) | 6 | 7 | 42 | M |
| 7 | Keine Fotos vom Endzustand im Protokoll | 5 | 7 | 35 | C |
| 8 | Wer war bei der Abnahme dabei? | 4 | 5 | 20 | C |
| 9 | Büro erfährt nicht, dass abgenommen wurde → Rechnung bleibt liegen | 7 | 8 | 56 | B |
| 10 | Mängelfrist nicht festgelegt | 5 | 6 | 30 | C |
| 11 | Protokoll als PDF an Kunde/Hausverwaltung | 5 | 5 | 25 | B |
| 12 | Unterschrift nachträglich verändert/unklar | 2 | 8 | 16 | C |
| 13 | Abnahme bei Kunden mit mehreren Ansprechpartnern | 4 | 4 | 16 | M |
| 14 | Teilabnahmen bei großen Projekten | 3 | 6 | 18 | C |
| 15 | Fiktive Abnahme (Frist) nicht im Blick | 2 | 7 | 14 | C |
| 16 | Vorbehalte (Vertragsstrafe, bekannte Mängel) vergessen | 3 | 7 | 21 | C |
| 17 | Abnahme wird zu spät gemacht | 5 | 6 | 30 | C |
| 18 | Name der unterschreibenden Person unleserlich | 5 | 4 | 20 | B |
| 19 | Datum/Ort fehlen | 4 | 5 | 20 | B |
| 20 | Monteur weiß nicht, was er sagen soll | 4 | 4 | 16 | M |
| 21 | Mängelfotos nicht dem Mangel zugeordnet | 4 | 5 | 20 | B |
| 22 | Kunde will Kopie per Mail | 4 | 4 | 16 | K |
| 23 | Auftrag bleibt nach der Abnahme in „In Arbeit“ hängen | 6 | 5 | 30 | B |
| 24 | Abnahme nach VOB vs. BGB | 2 | 5 | 10 | C |
| 25 | Unterschrift des Betriebs zusätzlich | 2 | 3 | 6 | C |

## Muss rein
- Geführte Abnahme in 5 Schritten: Angaben (Datum, Ort, Teilnehmer), Mängel, Fotos, Bemerkungen/Vorbehalte, Unterschrift (1, 3, 7, 8, 16, 19, 20).
- Jeder Mangel wird sofort eine Aufgabe am Auftrag mit 14 Tagen Frist, optional mit Foto (4, 10, 21).
- Unterschrift per Canvas mit Pointer Events (`touch-action: none`), Name in Druckbuchstaben, Zeitpunkt automatisch (6, 12, 18).
- „Kunde verweigert“ mit Pflichtgrund (5).
- Druck-/PDF-Ansicht (11, 22).
- Wiederverwendbare Unterschrift-Komponente (`Unterschrift.tsx`, `unterschrift.ts`) für Berichte und Zusatzleistungen.

## Macher erledigt automatisch
- Event `abnahme.unterschrieben` → Auftrag in Phase „Abrechnung“, Büro wird benachrichtigt (Automation `abnahme.abrechnung`) (9, 23).
- Hinweise: „Abnahme mit Kunde machen“ für Aufträge in Phase Abnahme (Aktion `abnahme.starten`), „Mängel nicht beseitigt“ nach Fristablauf (2, 4, 17).
- Nachher- und Mangel-Fotos sind im Protokoll vorausgewählt (7).

## Bewusst weggelassen
- Teilabnahmen, fiktive Abnahme, VOB/BGB-Varianten, zweite Unterschrift des Betriebs (14, 15, 24, 25).
