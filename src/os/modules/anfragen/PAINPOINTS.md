# Anfragen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Anfrage geht unter (Zettel, Mailbox, WhatsApp vom Chef) | 9 | 10 | 90 | C, B |
| 2 | Kunde wartet tagelang auf Antwort und geht zur Konkurrenz | 8 | 10 | 80 | C, B |
| 3 | Niemand fühlt sich zuständig für neue Anfragen | 8 | 8 | 64 | C, B |
| 4 | Dringende Störung wird wie normale Anfrage behandelt | 6 | 10 | 60 | C, B |
| 5 | Kunde wird doppelt angelegt (andere Schreibweise, neue Nummer) | 8 | 7 | 56 | B |
| 6 | Unklar, was als Nächstes passieren soll (Rückruf? Besichtigung? Angebot?) | 8 | 7 | 56 | C, B |
| 7 | Keine Übersicht, welche Anfragen noch offen sind | 8 | 7 | 56 | C, B |
| 8 | Rückruf vergessen | 7 | 8 | 56 | B |
| 9 | Chef muss jede Anfrage selbst sichten | 7 | 7 | 49 | C |
| 10 | Kontaktdaten unvollständig – Rückruf unmöglich | 6 | 8 | 48 | B |
| 11 | Anfragen aus verschiedenen Kanälen an verschiedenen Orten | 8 | 6 | 48 | B |
| 12 | Erfassen dauert zu lange (viele Pflichtfelder) | 8 | 6 | 48 | B |
| 13 | Zu viele unpassende Anfragen kosten Zeit | 7 | 6 | 42 | C |
| 14 | Nicht erkennbar, wie lange eine Anfrage schon liegt | 7 | 6 | 42 | B |
| 15 | Keine Übergabe von Anfrage zu Angebot ohne erneutes Tippen | 7 | 6 | 42 | B |
| 16 | Adresse/Einsatzort fehlt später beim Termin | 6 | 6 | 36 | B, M |
| 17 | Wunschtermin des Kunden geht verloren | 6 | 6 | 36 | B |
| 18 | Stammkunde wird nicht als solcher erkannt | 6 | 6 | 36 | B |
| 19 | Anfrage am Handy unterwegs nicht erfassbar | 6 | 6 | 36 | C, M |
| 20 | Absagen werden nicht dokumentiert – keine Auswertung möglich | 6 | 5 | 30 | C |
| 21 | Abtippen von E-Mails in die Software | 6 | 5 | 30 | B |
| 22 | Anfrage landet beim Falschen im Team | 5 | 6 | 30 | B |
| 23 | Doppelte Bearbeitung derselben Anfrage durch zwei Personen | 4 | 6 | 24 | B |
| 24 | Herkunft der Anfrage (Empfehlung, Website) unbekannt | 5 | 4 | 20 | C |
| 25 | Bei Absage keine freundliche Rückmeldung an Kunden | 4 | 5 | 20 | B |

## Muss rein
- Ein Eingang für alle Kanäle: Anfrage erfassen (Name/Telefon/E-Mail, Anliegen, Kanal, dringend, Wunschtermin)
- Dubletten-Erkennung über Telefon, E-Mail und Name mit Vorschlag „diesen Kunden nehmen“; sonst Kunde + Ort automatisch anlegen
- Qualifizieren in einem Schritt: Rückruf / Besichtigung / direkt Angebot / Termin / Absagen mit Grund
- Hub-Widget „Neue Anfragen“ (Gewicht 90) und Panel in der Auftragsakte
- Hinweise: dringende Anfrage ohne nächsten Schritt (81), unbearbeitet > 24 h (72)

## Macher erledigt automatisch
- Neue Anfrage wird der Büro-Person zugewiesen (Automation `anfragen.zuweisen`, Eintrag in „Erledigt“)
- Bei dringenden Anfragen sofort eine Benachrichtigung
- Rückruf als Aufgabe mit Fälligkeit (dringend heute, sonst morgen)
- Event `anfrage.eingegangen` für andere Module

## Bewusst weggelassen (Pareto)
- Automatischer E-Mail-Import (braucht Schnittstelle, Paket unternehmen)
- Lead-Scoring / Kanalauswertung (Paket zahlen)
- Absage-Mail an Kunden (später über Vorlagen)
- Eigenes Anfrage-Objekt – Anfrage bleibt Auftrag in Phase `anfrage`
