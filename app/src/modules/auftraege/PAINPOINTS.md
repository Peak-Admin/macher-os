# Aufträge (zentrale Auftragsakte) – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Niemand weiß, wo ein Auftrag gerade steht („Ist das Angebot raus? Ist er fertig?“) | 10 | 9 | 90 | C, B |
| 2 | Infos verstreut in WhatsApp, Zetteln, Mails, Kopf vom Chef | 10 | 9 | 90 | C, B, M |
| 3 | Was ist als Nächstes zu tun? Aufträge bleiben zwischen zwei Schritten liegen | 9 | 9 | 81 | C, B |
| 4 | Fertige Arbeit wird spät oder gar nicht abgerechnet | 7 | 10 | 70 | C, B |
| 5 | Beauftragte Aufträge ohne Termin – Kunde wartet und ruft an | 7 | 9 | 63 | B, C |
| 6 | Monteur findet Adresse, Zugang, Ansprechpartner nicht | 8 | 7 | 56 | M |
| 7 | Anfragen versanden ohne Nachfassen | 7 | 8 | 56 | C, B |
| 8 | Phase von Hand nachpflegen (Angebot angenommen, bezahlt …) | 9 | 6 | 54 | B |
| 9 | Kein Überblick über die Pipeline (wie viel Arbeit kommt?) | 7 | 7 | 49 | C |
| 10 | Auftrag anlegen dauert zu lange, zu viele Pflichtfelder | 8 | 6 | 48 | B, C |
| 11 | Doppelte Kunden/Orte beim Anlegen | 6 | 7 | 42 | B |
| 12 | Aufträge „hängen“ wochenlang ohne Bewegung | 6 | 7 | 42 | C |
| 13 | Dringende Aufträge gehen in der Masse unter | 6 | 7 | 42 | B, M |
| 14 | Was hat der Kunde am Telefon genau gesagt? | 7 | 6 | 42 | M, B |
| 15 | Wer ist verantwortlich? | 6 | 6 | 36 | C, B |
| 16 | Verlorene Aufträge ohne Grund – kein Lerneffekt | 5 | 6 | 30 | C |
| 17 | Am Handy unbrauchbare Ansichten auf der Baustelle | 8 | 4 | 32 | M |
| 18 | „Meine“ Aufträge herausfiltern | 6 | 5 | 30 | M, B |
| 19 | Navigation zum Einsatzort mit Extra-Schritten | 7 | 4 | 28 | M |
| 20 | Änderungen nicht nachvollziehbar (wer hat was geändert?) | 5 | 5 | 25 | C |
| 21 | Suche nach Nummer, Kunde oder Straße | 6 | 4 | 24 | B |
| 22 | Kundendienst muss sinnlos durch Besichtigung/Angebot | 5 | 5 | 25 | B |
| 23 | Abgeschlossene Aufträge wiederfinden (Gewährleistung) | 4 | 5 | 20 | B |
| 24 | Geplante Stunden für die Planung fehlen | 4 | 5 | 20 | B |
| 25 | Auftragsnummern von Hand vergeben | 4 | 4 | 16 | B |

## Muss rein
- Akte `/auftrag/:id` mit Kopf (Kunde, Anrufen, Ort mit Zugang + Navigation, Eckdaten), Phase als Fortschritt, **ein** „Nächster Schritt“-Button (#1, #2, #3, #6, #19).
- Pipeline nach Phasen mit Filter Meine/Dringend/Art und Suche (#9, #13, #18, #21).
- Kurzes Anlegen-Formular: Kunde wählen oder neu, Titel, Ort, Art (#10, #11).
- Bearbeiten, Phase ändern, als verloren markieren mit Grund (#15, #16).
- Verlauf aus dem Zeitstrahl (#20). Archiv für Erledigte/Verlorene (#23).

## Macher erledigt automatisch
- Phasen: Angebot angenommen → Beauftragt, erster Einsatz → In Arbeit, alle Einsätze erledigt → Abnahme (bei offenen Aufgaben Hinweis), Abnahme unterschrieben → Abrechnung, Rechnung bezahlt → Erledigt (#8, #4).
- Hinweise: beauftragt ohne Termin (#5), Stillstand > 14 Tage mit „Nachfassen“ (#7, #12), „alle Einsätze erledigt – fertig?“.
- Fehlt eine Aktion eines anderen Pakets, legt der Nächste-Schritt-Button eine Aufgabe an und schiebt die Phase (#3).
- Kundendienst-Anfragen springen direkt zu „Annehmen und einplanen“ (#22). Nummern automatisch (#25).

## Bewusst weggelassen
- Eigene Kanban-Drag-&-Drop-Logik (Phase ändert sich automatisch; manuell per Dialog).
- Eigene Felder/Freie Attribute, Projektstrukturen mit Unteraufträgen, Gantt.
