# Urlaub & Krankheit – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sicht: Chef, Büro, Monteur auf der Baustelle.

| # | Pain Point | F | I | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Krankmeldung morgens um 6 per SMS an den Chef – Büro erfährt es zu spät | 5 | 9 | 45 | Büro, Chef |
| 2 | Termine des Kranken müssen hektisch umgeplant werden | 5 | 9 | 45 | Büro |
| 3 | Urlaubsantrag auf Zettel/WhatsApp geht unter | 6 | 7 | 42 | Monteur, Chef |
| 4 | Resturlaub unbekannt, Excel-Liste veraltet | 5 | 7 | 35 | Monteur, Büro |
| 5 | Urlaub genehmigt, aber Termine im Zeitraum schon vergeben | 4 | 8 | 32 | Büro |
| 6 | Wer ist heute weg? Morgens ständig gefragt | 8 | 4 | 32 | Büro |
| 7 | Berufsschultage des Azubis nicht im Plan | 6 | 5 | 30 | Büro |
| 8 | Zwei Monteure gleichzeitig im Urlaub genehmigt | 3 | 9 | 27 | Chef |
| 9 | Formular zu lang auf dem Handy | 5 | 5 | 25 | Monteur |
| 10 | AU-Bescheinigung fehlt/verloren | 4 | 6 | 24 | Büro |
| 11 | Mitarbeiter wartet tagelang auf Antwort zum Urlaub | 4 | 6 | 24 | Monteur |
| 12 | Feiertage/Wochenenden falsch mitgezählt | 4 | 6 | 24 | Büro |
| 13 | Krankheitsdetails sieht jeder | 3 | 7 | 21 | Mitarbeiter |
| 14 | Mitarbeiter bekommt keinen Bescheid | 4 | 5 | 20 | Monteur |
| 15 | Jahresübersicht fürs Team fehlt (Sommerplanung) | 2 | 8 | 16 | Chef |
| 16 | Überstundenabbau (frei) nicht erfasst | 3 | 5 | 15 | Büro |
| 17 | Halbe Tage nicht abbildbar | 3 | 4 | 12 | Büro |
| 18 | Kranktage für Lohn/Statistik nicht zählbar | 2 | 6 | 12 | Chef |
| 19 | Chef im Urlaub – keiner genehmigt | 2 | 6 | 12 | Büro |
| 20 | Überschneidende Anträge | 2 | 5 | 10 | Büro |
| 21 | Kein Verlauf, wer genehmigt hat | 2 | 5 | 10 | Chef |
| 22 | Antrag zurückziehen geht nicht | 2 | 4 | 8 | Monteur |
| 23 | Urlaub über Jahreswechsel falsch verbucht | 1 | 6 | 6 | Büro |
| 24 | Resturlaub aus Vorjahr | 1 | 6 | 6 | Büro |
| 25 | Anteiliger Urlaub bei Eintritt im Jahr | 1 | 6 | 6 | Büro |

## Muss rein
- Antrag in Sekunden (Art, von/bis, halbtags) mit Live-Anzeige Arbeitstage + Rest danach + betroffene Termine
- Krankmeldung gilt sofort, AU-Foto optional (nur Chef/Mitarbeiter sichtbar)
- Entscheidung Genehmigen/Ablehnen in Liste, Detail und als Hinweis
- Resturlaub, Jahresübersicht Team je Monat, Detail mit Kollisionen + Umplanen

## Macher erledigt automatisch
- Krankmeldung sofort an Chef/Büro mit betroffenen Terminen
- Bescheid an Mitarbeiter bei Genehmigung/Ablehnung
- Hinweise: Antrag genehmigen (mit gleichzeitig Abwesenden), Kollision → Umplanen (`plan.einplanen`)
- Gesetzliche Feiertage automatisch (bundesweit + Bundesland laut `plan.bundesland`, aus `@core/kalender`)

## Bewusst weggelassen (Pareto)
- Übertrag Resturlaub/Anteilsberechnung
- Vertretungsregel für Genehmigung
- Urlaubssperren
