# Pain Points – Subunternehmer

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Nachweise liegen im Ordner, Ablauf merkt keiner | 6 | 7 | 42 | B |
| 2 | Kosten der Fremdfirma nicht im Blick → Auftrag rechnet sich nicht | 5 | 8 | 40 | C |
| 3 | Wer ist an welchem Auftrag? Keiner weiß es | 6 | 6 | 36 | B,C |
| 4 | Freistellungsbescheinigung abgelaufen, trotzdem voll bezahlt → Bauabzugsteuer-Haftung | 3 | 10 | 30 | B,C |
| 5 | Kontaktdaten der Subs nur im Handy des Chefs | 6 | 5 | 30 | B,M |
| 6 | Termine mit Subs unabgestimmt | 5 | 6 | 30 | B,M |
| 7 | Unbedenklichkeitsbescheinigungen fehlen – Haftung für Sozialbeiträge | 3 | 9 | 27 | B,C |
| 8 | Eingangsrechnung kann keinem Sub zugeordnet werden | 5 | 5 | 25 | B |
| 9 | Kein Überblick über offene Einsätze | 5 | 5 | 25 | B |
| 10 | Vereinbarter Stundensatz vergessen | 4 | 6 | 24 | B |
| 11 | Ablauf erst bemerkt, wenn Rechnung kommt | 3 | 8 | 24 | B |
| 12 | Sub-Kosten in Nachkalkulation fehlen | 4 | 6 | 24 | C |
| 13 | Formlose Absprachen ohne Kosten | 4 | 6 | 24 | C |
| 14 | Zuverlässigkeit früherer Einsätze unbekannt | 4 | 5 | 20 | C |
| 15 | Scans der Nachweise auf dem Handy nicht auffindbar | 4 | 5 | 20 | B |
| 16 | Monteur weiß nicht, wer der Ansprechpartner der Fremdfirma ist | 5 | 4 | 20 | M |
| 17 | Doppelte Erfassung als Lieferant und Sub | 4 | 4 | 16 | B |
| 18 | Sub hat nicht die nötige Qualifikation | 2 | 8 | 16 | C |
| 19 | Nachweise bei Prüfung (Finanzamt) nicht vorzeigbar | 2 | 8 | 16 | B |
| 20 | Einsatz-Status unklar (läuft/fertig) | 4 | 4 | 16 | B |
| 21 | Bautagebuch ohne Subs | 3 | 5 | 15 | B |
| 22 | Mehrere Bescheinigungen gleicher Art, welche gilt? | 3 | 4 | 12 | B |
| 23 | Haftpflichtnachweis fehlt beim Schaden | 1 | 10 | 10 | C |
| 24 | Ehemalige Subs tauchen in Auswahl auf | 3 | 3 | 9 | B |
| 25 | Notizen zu Besonderheiten fehlen | 3 | 3 | 9 | B |

## Muss rein
- Firmen mit Gewerk, Kontakt (als Lieferant – eine Firma, ein Objekt), Stundensatz, Notiz, aktiv
- Nachweise (§ 48b, Finanzamt, Krankenkasse, BG, Haftpflicht) mit Ablaufdatum und Scan/PDF
- Einsätze am Auftrag mit Zeitraum, Kosten, Status – Tab „Subunternehmer“ in der Auftragsakte
- Kosten offener Einsätze, Eingangsrechnungen über `lieferantId`

## Macher erledigt automatisch
- Hinweis „Freistellung fehlt/abgelaufen“ (Gewicht 80), sobald ein Einsatz offen ist
- Hinweis 30 Tage vor Ablauf eines Nachweises
- Abgelaufene sonstige Nachweise bei offenen Einsätzen
- Status je Firma in der Liste, Filter „Nachweise prüfen“

## Bewusst weggelassen (Pareto)
- Automatische Abfrage beim Bundeszentralamt für Steuern
- Subunternehmer-Portal
- Bewertungssystem für Subs
- Eigene Termine/Kalender für Subs (Termine bleiben am Auftrag)
