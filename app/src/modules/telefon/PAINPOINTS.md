# Telefon & Empfang – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Anruf während der Arbeit – Notiz auf Zettel, Zettel weg | 9 | 9 | 81 | C, M |
| 2 | Rückruf vergessen | 8 | 9 | 72 | C, B |
| 3 | Anrufer nicht erkannt, Kunde muss alles neu erzählen | 8 | 7 | 56 | B |
| 4 | Anrufnotiz erreicht den Zuständigen nicht | 7 | 8 | 56 | B |
| 5 | Erfassen dauert länger als das Gespräch | 8 | 7 | 56 | B |
| 6 | Notfall geht im Tagesgeschäft unter | 5 | 10 | 50 | B |
| 7 | Keine Ahnung, worum es beim letzten Anruf ging | 7 | 7 | 49 | B, C |
| 8 | Kein Überblick über offene Rückrufe | 7 | 7 | 49 | B |
| 9 | Aus einem Anruf wird nicht sauber eine Anfrage | 7 | 7 | 49 | B |
| 10 | Nummer des Anrufers nicht notiert | 6 | 8 | 48 | B, M |
| 11 | Rückruf überfällig, niemand merkt es | 6 | 8 | 48 | B |
| 12 | Am Handy umständlich zu erfassen | 8 | 6 | 48 | C, M |
| 13 | Gesprächsnotizen hängen nicht am Auftrag | 7 | 6 | 42 | B |
| 14 | Chef wird für jede Kleinigkeit ans Telefon geholt | 7 | 6 | 42 | C |
| 15 | Verpasste Anrufe (Mailbox) werden nicht nachgehalten | 6 | 7 | 42 | B |
| 16 | Wer ruft zurück, ist unklar | 6 | 7 | 42 | B |
| 17 | Kein Wissen, welche Aufträge der Anrufer gerade offen hat | 7 | 6 | 42 | B |
| 18 | Mehrfache Anrufe zum selben Thema ohne Verlauf | 6 | 6 | 36 | B |
| 19 | Dringlichkeit nicht einschätzbar für den Kollegen | 6 | 6 | 36 | B |
| 20 | Keine Telefonnummer zum Zurückrufen bei Aufgaben | 6 | 6 | 36 | B |
| 21 | Hausmeister/Mieter ruft an – keinem Kunden zuzuordnen | 5 | 6 | 30 | B |
| 22 | Neuer Anrufer wird nicht als Kunde angelegt | 6 | 5 | 30 | B |
| 23 | Anrufe zählen nicht in Auftragsverlauf | 5 | 5 | 25 | C |
| 24 | Sprachbarriere / unklare Anliegen | 3 | 5 | 15 | B |
| 25 | Mehrere Personen notieren denselben Anruf | 3 | 5 | 15 | B |

## Muss rein
- Gesprächsnotiz in Sekunden: Nummer → Anrufer erkannt (auch über Telefon vor Ort), Anliegen, Dringlichkeit, nächster Schritt
- Aus dem Anruf: neue Anfrage (Kunde automatisch), Rückruf-Aufgabe (mit Zuständigem) oder nur Notiz – gespeichert als `nachrichten` mit `kanal: 'telefon'`
- Offene Rückrufe mit Anrufen-Knopf und „Erledigt“ (rückgängig machbar)
- Schnell-Aktion „Anruf notieren“ im Schnell-erfassen-Blatt
- Hinweise: Rückruf überfällig (64) / dringender Rückruf heute (70)

## Macher erledigt automatisch
- Anruf wird automatisch an den einzigen offenen Auftrag des Anrufers gehängt (`telefon.zuordnen`)
- Erkennung offener Aufträge des Anrufers beim Tippen der Nummer

## Bewusst weggelassen (Pareto)
- Telefonanlagen-Anbindung/CTI und Anrufprotokoll (Schnittstellen)
- Sprachaufnahme/Transkription (Paket doku/macher)
- Callcenter-Funktionen (Warteschlangen)
