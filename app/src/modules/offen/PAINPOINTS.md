# Offen einzuplanen – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Beauftragter Auftrag rutscht durch und bekommt nie einen Termin | 7 | 10 | 70 | C, B |
| 2 | Dringende Störung wartet, weil sie im Stapel untergeht | 6 | 10 | 60 | B |
| 3 | Kunde wünscht Besichtigung, keiner meldet sich – Auftrag geht an die Konkurrenz | 6 | 9 | 54 | B, C |
| 4 | Keine Reihenfolge: was zuerst einplanen? | 8 | 6 | 48 | B |
| 5 | Abgesagter Termin → Auftrag ist wieder „offen“, aber keiner merkt es | 5 | 8 | 40 | B |
| 6 | Von der Liste zum Einplanen sind es zu viele Klicks | 8 | 5 | 40 | B |
| 7 | Wunschtermin des Kunden steht im Freitext und wird übersehen | 6 | 6 | 36 | B |
| 8 | „Seit wann wartet der eigentlich?“ | 6 | 5 | 30 | C |
| 9 | Kein Vorschlag, wer es machen könnte | 6 | 5 | 30 | B |
| 10 | Liste vermischt Anfragen ohne Besichtigungswunsch mit echter Arbeit | 5 | 5 | 25 | B |
| 11 | Chef will morgens nur die Zahl sehen | 7 | 3 | 21 | C |
| 12 | Aufträge in Arbeit ohne nächsten Termin | 4 | 5 | 20 | C |
| 13 | Geschätzte Stunden fehlen bei der Planung | 5 | 4 | 20 | B |
| 14 | Wartende Aufträge > 2 Wochen ohne Rückmeldung an Kunden | 4 | 5 | 20 | B |
| 15 | Filter nach Art (Einsatz vs. Besichtigung) | 4 | 4 | 16 | B |
| 16 | Monteure sehen Planungsknöpfe, die sie nicht nutzen dürfen | 3 | 4 | 12 | M |
| 17 | Doppelte Einträge, wenn ein Auftrag mehrere Termine braucht | 3 | 4 | 12 | B |
| 18 | Kunde ruft an „wann kommt ihr?“ – keine schnelle Antwort | 4 | 3 | 12 | B |
| 19 | Leere Liste wirkt wie Fehler | 3 | 3 | 9 | B |
| 20 | Wartung ohne Termin (Paket service) | 3 | 3 | 9 | B |
| 21 | Auftrag ohne Ort/Adresse | 2 | 4 | 8 | B |
| 22 | Anfragen ohne Termin, die nur ein Angebot brauchen | 3 | 2 | 6 | B |
| 23 | Ferne Wunschtermine (in 3 Monaten) verstopfen die Liste | 2 | 3 | 6 | B |
| 24 | Sortierung ändert sich ständig | 2 | 2 | 4 | B |
| 25 | Export der Liste | 1 | 2 | 2 | C |

## Muss rein
- Widget im Plan-Hub + eigene Ansicht: **beauftragte Aufträge ohne künftigen Termin + Anfragen mit Besichtigungswunsch** (1, 3, 10)
- Sortierung **dringend → Wunschtermin → Alter**, Wunsch und Wartezeit sichtbar (2, 4, 7, 8)
- Je Eintrag „Einplanen“ (→ Plantafel mit Auftrag) und „Vorschlag“ (`plan.vorschlag`, sonst eingebauter Fallback: nächste freie Zeit) (6, 9)
- Filter Alle / Dringend / Einsätze / Besichtigungen (15)

## Macher erledigt automatisch
- Abgesagte oder vergangene Termine → Auftrag erscheint automatisch wieder (5)
- Hinweis „Dringend, aber noch kein Termin“ mit Einplanen/Vorschlag (2)
- Sammelhinweis „wartet seit über 2 Wochen“ (14)

## Bewusst weggelassen
- Aufträge „in Arbeit“ ohne Folgetermin (12) – gehören in die Auftragsakte
- Export (25), eigene Sortierung (24)
