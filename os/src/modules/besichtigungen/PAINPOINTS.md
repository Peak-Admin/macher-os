# Besichtigungen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Nach der Besichtigung fehlen Maße oder Fotos fürs Angebot | 8 | 9 | 72 | C, B |
| 2 | Notizen auf Zettel, im Auto vergessen | 8 | 8 | 64 | C, M |
| 3 | Angebot verzögert sich, weil Ergebnis nicht weitergegeben wird | 7 | 9 | 63 | C, B |
| 4 | Fotos liegen auf dem privaten Handy | 8 | 7 | 56 | C, M |
| 5 | Besichtigung wird zugesagt, aber nie eingeplant | 6 | 9 | 54 | B |
| 6 | Adresse, Zugang, Ansprechpartner vor Ort unbekannt | 7 | 7 | 49 | C, M |
| 7 | Unterlagen für Angebot verstreut | 7 | 7 | 49 | B |
| 8 | Wichtige Hinweise vom Telefonat nicht dabei | 6 | 7 | 42 | C |
| 9 | Ergebnis führt nicht direkt zu Aufmaß/Angebot | 6 | 7 | 42 | C |
| 10 | Monteur kann am Handy nichts eintragen | 6 | 7 | 42 | M |
| 11 | Doppelbuchung mit anderem Termin | 5 | 8 | 40 | B |
| 12 | Keine Übersicht, welche Besichtigungen anstehen | 6 | 6 | 36 | B |
| 13 | Nachträgliches Abtippen der Notizen | 6 | 6 | 36 | C, B |
| 14 | Fotos ohne Bezug zum Auftrag | 6 | 6 | 36 | B |
| 15 | Kunde nicht da – Fahrt umsonst | 4 | 8 | 32 | C |
| 16 | Ergebnis nicht dokumentiert – kein Auftrag, aber keiner weiß warum | 5 | 6 | 30 | C |
| 17 | Zu lange vor Ort, weil unvorbereitet | 5 | 6 | 30 | C |
| 18 | Mitarbeiter weiß nicht, was er ansehen soll | 5 | 6 | 30 | M |
| 19 | Urlaub/Abwesenheit beim Planen übersehen | 4 | 7 | 28 | B |
| 20 | Kein Rückruf-Kontakt vor Ort (Hausmeister) | 5 | 5 | 25 | C |
| 21 | Kunde will Termin verschieben, keiner merkt es | 4 | 6 | 24 | B |
| 22 | Navigation zum Ort umständlich | 6 | 4 | 24 | C, M |
| 23 | Bilder zu groß, Handy-Speicher voll | 5 | 4 | 20 | M |
| 24 | Besichtigung kostenlos, Aufwand wird nicht sichtbar | 4 | 4 | 16 | C |
| 25 | Mehrere Besichtigungen zum selben Auftrag verwirrend | 3 | 4 | 12 | B |

## Muss rein
- Planen als `termine` mit `art: 'besichtigung'`: Auftrag, Datum, Uhrzeit, Dauer, wer – mit Warnung bei Überschneidung und Abwesenheit
- Vor-Ort-Ansicht: Kunde, Ort mit Karte, Zugangshinweise, Telefon; Fotos (verkleinert) und Notizen als `dokumente` am Termin und Auftrag
- Ergebnis in einem Schritt: Aufmaß erfassen / Angebot schreiben / kein Auftrag mit Grund
- Aktion `besichtigung.planen`
- Hinweise: Auftrag in Phase Besichtigung ohne Termin (60), Besichtigung vorbei ohne Ergebnis (58)

## Macher erledigt automatisch
- Auftrag springt beim Planen von Anfrage auf Besichtigung
- Termin wird beim Abschließen auf erledigt gesetzt, nächster Schritt (Aufmaß/Angebot) wird direkt angelegt
- Zeitstrahl-Einträge am Auftrag

## Bewusst weggelassen (Pareto)
- Terminbestätigung an Kunden (Paket plan/terminbuchung)
- Routenplanung (Paket planpruefung)
- Eigene Checklisten je Gewerk (Paket akte)
- Kalenderansicht (Paket plan)
