# Wartung & Service – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Fällige Wartungen werden vergessen – Kunde ruft erst, wenn die Anlage steht | 8 | 10 | 80 | C, B |
| 2 | Fälligkeiten stehen in Excel, Wandkalender oder im Kopf des Chefs | 9 | 8 | 72 | C, B |
| 3 | Jede Wartung einzeln als Auftrag anlegen ist stumpfe Tipparbeit | 8 | 7 | 56 | B |
| 4 | Zwei Anlagen am selben Ort, zwei Anfahrten – weil keiner gebündelt hat | 6 | 8 | 48 | C, M |
| 5 | Kunde wird nicht vorab informiert, steht nicht zur Tür | 7 | 7 | 49 | B, M |
| 6 | Nach der Wartung wird das nächste Datum nicht eingetragen – Kette reißt | 8 | 9 | 72 | B |
| 7 | Monteur weiß vor Ort nicht, was bei diesem Anlagentyp zu prüfen ist | 7 | 7 | 49 | M |
| 8 | Wartung im Vertrag wird trotzdem berechnet – Ärger mit dem Kunden | 4 | 9 | 36 | B |
| 9 | Kein Überblick: Was ist diese Woche / diesen Monat / überfällig? | 8 | 6 | 48 | C, B |
| 10 | Terminsuche per Telefon-Pingpong | 7 | 6 | 42 | B |
| 11 | Wartungsaufträge laufen erst kurz vor knapp an, Material fehlt | 6 | 6 | 36 | B, M |
| 12 | Herstellerdaten/Seriennummer nicht vor Ort greifbar | 6 | 5 | 30 | M |
| 13 | Prüfpunkte werden nicht dokumentiert – Nachweis fehlt bei Garantiefall | 5 | 8 | 40 | C |
| 14 | Saisonspitzen (Heizungen im Herbst) überrollen den Plan | 5 | 8 | 40 | C |
| 15 | Anlagen ohne Intervall/Datum fallen komplett durch | 5 | 7 | 35 | B |
| 16 | Kunde wechselt Ansprechpartner, Info geht verloren | 4 | 5 | 20 | B |
| 17 | Wartungsaufträge und Reparaturen sind nicht unterscheidbar | 5 | 4 | 20 | B |
| 18 | Abrechnung der Wartung (außerhalb Vertrag) wird vergessen | 5 | 7 | 35 | B |
| 19 | Monteur hakt Prüfpunkte auf Papier ab, Büro tippt ab | 6 | 5 | 30 | M, B |
| 20 | Vorlaufzeit passt nicht zum Betrieb (zu früh / zu spät) | 4 | 4 | 16 | C |
| 21 | Wartungshistorie einer Anlage nicht auffindbar | 4 | 6 | 24 | B, M |
| 22 | Überfällige Wartung wird nicht eskaliert | 5 | 7 | 35 | C |
| 23 | Doppelte Wartungsaufträge für dieselbe Anlage | 3 | 6 | 18 | B |
| 24 | Kundenbenachrichtigung klingt jedes Mal anders | 4 | 3 | 12 | B |
| 25 | Wartungsprotokoll für den Kunden fehlt | 4 | 5 | 20 | B |

## Muss rein
Übersicht überfällig / diese Woche / diesen Monat (1, 2, 9) · Wartung abschließen schreibt letzte/nächste fort (6) ·
Tab „Wartung“ am Auftrag mit Prüfpunkten zum Abhaken (7, 13, 19) · Panel an der Anlage (21) · Hinweis auf Anlagen ohne Datum (15).

## Macher erledigt automatisch
- Wartungsaufträge X Wochen vorher anlegen (`art: 'wartung'`, Phase `beauftragt`, `anlageIds`) – (1, 3, 11, 23)
- Anlagen am selben Ort zu einem Auftrag bündeln, auch nachträglich ergänzen (4)
- Prüfpunkte je Anlagentyp als Aufgaben anlegen (7)
- Serientermin aus „Wiederkehrende Termine“ automatisch verknüpfen, sonst Hinweis „Termin vorschlagen“ (10)
- Kundennachricht vorbereiten → Hinweis zur Freigabe (5, 24)
- Nach Abschluss letzte/nächste Wartung fortschreiben; Vertragswartungen ohne Rechnung auf erledigt (6, 8, 18)
- Überfällige Wartung ohne Auftrag als Hinweis (22)

## Bewusst weggelassen
Eigenes Wartungsprotokoll-Formular (macht doku/Berichte), Kapazitätsglättung bei Saisonspitzen (macht autoplanung),
Herstellerdatenbank, Material-Vorplanung je Anlagentyp.
