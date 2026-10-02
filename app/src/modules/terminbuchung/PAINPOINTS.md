# Terminbuchung – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, K = Kunde.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Telefon klingelt den ganzen Tag wegen Terminabsprachen – Ping-Pong per Rückruf | 9 | 8 | 72 | B, C |
| 2 | Kunden erreichen niemanden (Chef auf der Baustelle) und rufen den nächsten Betrieb an | 7 | 9 | 63 | C, K |
| 3 | Online gebuchter Termin kollidiert mit bestehender Planung | 5 | 10 | 50 | B |
| 4 | Neue Kunden müssen von Hand angelegt werden, Daten sind unvollständig | 7 | 6 | 42 | B |
| 5 | Bestehende Kunden werden doppelt angelegt | 6 | 6 | 36 | B |
| 6 | Kunde bucht Termin für morgen früh – keine Vorbereitung möglich | 5 | 7 | 35 | B |
| 7 | Online-Buchung landet im Postfach statt im Kalender | 5 | 7 | 35 | B |
| 8 | Büro muss jeden Termin noch bestätigen und vergisst es | 5 | 6 | 30 | B |
| 9 | Kunde will Termin in seinen Kalender übernehmen | 6 | 4 | 24 | K |
| 10 | Unterschiedliche Terminarten (Besichtigung 60 min, Reparatur 90 min) | 5 | 5 | 25 | B |
| 11 | Fahrzeit zwischen Terminen wird nicht berücksichtigt | 4 | 6 | 24 | B |
| 12 | Kunde muss bei Folgetermin alles erneut eintippen | 4 | 5 | 20 | K |
| 13 | Nur bestimmte Monteure sollen buchbar sein (z. B. Kundendienst-Team) | 4 | 5 | 20 | C |
| 14 | Buchung blockiert immer denselben Monteur | 4 | 4 | 16 | C |
| 15 | Kunde weiß nicht, ob der Termin angekommen ist | 5 | 4 | 20 | K |
| 16 | Termine zu weit in der Zukunft gebucht | 3 | 4 | 12 | B |
| 17 | Spam/unsinnige Buchungen | 2 | 5 | 10 | B |
| 18 | Ungültiger/alter Link führt ins Leere | 2 | 5 | 10 | K |
| 19 | Terminart vorübergehend pausieren (Urlaubszeit) | 3 | 4 | 12 | C |
| 20 | Mobil schwer zu bedienen (Kunde am Handy) | 6 | 5 | 30 | K |
| 21 | Online-Zahlung/Anzahlung | 1 | 4 | 4 | C |
| 22 | Kunde will selbst umbuchen/absagen | 3 | 4 | 12 | K |
| 23 | Erinnerung per SMS/E-Mail | 3 | 4 | 12 | K |
| 24 | Datenschutz-Hinweis | 3 | 3 | 9 | K |
| 25 | Einbindung in die eigene Website | 3 | 3 | 9 | C |

## Muss rein
- Büro definiert Terminarten (`buchungsfenster`): Dauer, Tage, Uhrzeiten, Vorlauf, Horizont, Puffer, zuständige Mitarbeiter, an/aus (10, 11, 13, 16, 19)
- Öffentliche Vollbild-Seite `/buchen/:token`: Terminart → Tag → Uhrzeit → Kontakt, mobil zuerst, nur echte freie Slots aus `freieSlots` (1, 2, 3, 20)
- Buchung → **Termin (`selbstGebucht: true`) + Anfrage (Auftrag Phase `anfrage`) + Kunde anlegen oder über Telefon/E-Mail erkennen**, Ort aus Adresse, Slot wird vor dem Speichern erneut geprüft (3, 4, 5, 7)
- Allgemeiner Link + persönlicher Link am Kunden (Panel „Online-Termin“), Kundendaten vorbefüllt (12, 25)
- Erfolgsseite mit Vorgangsnummer und ICS (9, 15)
- Büro-Ansicht „Bitte bestätigen“ (einzeln/alle) (8)

## Macher erledigt automatisch
- Mitarbeiterwahl: wer in der Woche am wenigsten verplant ist (14)
- Hinweis „Online gebucht – bitte bestätigen“ mit Bestätigen-Aktion + Benachrichtigung + Eintrag in „Erledigt“, Event `anfrage.eingegangen` (7, 8)
- Optional (aus): Buchungen ohne Konflikt sofort bestätigen

## Bewusst weggelassen
- Online-Zahlung (21), Umbuchen/Absagen durch Kunden (22 – Kundenbereich), Erinnerungen (23 – keine Versandschnittstelle), Spam-Schutz/Captcha (17)
