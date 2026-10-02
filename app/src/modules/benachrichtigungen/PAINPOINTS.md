# Benachrichtigungen – Top 25 Pain Points

Score = Frequenz (1–10) × Intensität (1–10).

| # | Pain Point | Freq. | Int. | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Benachrichtigungsflut – alles wird ignoriert | 8 | 9 | 72 | alle |
| 2 | Neue Anfrage bleibt Stunden liegen | 7 | 9 | 63 | Büro, Chef |
| 3 | Kundennachricht wird zu spät gesehen | 7 | 8 | 56 | Büro |
| 4 | Aufgabe zugewiesen, aber niemand weiß es | 8 | 7 | 56 | Monteur |
| 5 | Angenommenes Angebot wird nicht eingeplant | 5 | 9 | 45 | Chef |
| 6 | Benachrichtigung bei jeder Feldänderung | 7 | 6 | 42 | alle |
| 7 | Zahlungseingang unbemerkt → falsche Mahnung | 5 | 8 | 40 | Büro |
| 8 | Krankmeldung erreicht Planung zu spät | 4 | 9 | 36 | Büro |
| 9 | Kein Link zum Objekt | 6 | 6 | 36 | alle |
| 10 | Urlaubsantrag versandet | 5 | 7 | 35 | Chef, Monteur |
| 11 | Monteur erfährt nicht, ob Urlaub genehmigt ist | 5 | 7 | 35 | Monteur |
| 12 | Benachrichtigung über eigene Aktion | 8 | 4 | 32 | alle |
| 13 | Doppelte Meldung für dasselbe Ereignis | 6 | 5 | 30 | alle |
| 14 | Wichtig vs. Info nicht unterscheidbar | 5 | 5 | 25 | alle |
| 15 | Mobil schlecht lesbar | 5 | 5 | 25 | Monteur |
| 16 | Alle gelesen markieren fehlt | 6 | 4 | 24 | Büro |
| 17 | Monteur sieht Zahlungen | 3 | 7 | 21 | Chef |
| 18 | Glocke ohne Zähler | 5 | 4 | 20 | alle |
| 19 | Abschalten nicht möglich | 3 | 6 | 18 | Chef |
| 20 | Zu lange Texte | 4 | 4 | 16 | alle |
| 21 | Gelesene verschwinden komplett | 4 | 4 | 16 | alle |
| 22 | Benachrichtigungen ohne Zeitangabe | 4 | 4 | 16 | alle |
| 23 | Kein Weg zu Freigaben | 3 | 4 | 12 | Chef |
| 24 | Benachrichtigung bei Beispieldaten nach Einrichtung | 3 | 4 | 12 | alle |
| 25 | Leerer Zustand unklar | 3 | 3 | 9 | alle |

## Muss rein

- Overlay an der Glocke: Ungelesen/Alle, alle gelesen markieren, Klick = gelesen + zum Objekt, Status „Wichtig“/„Neu“/„Gelesen“ als Text.
- Sparsame Automation `macher.benachrichtigen` für: neue Anfrage, Kundennachricht, Abwesenheitsantrag/Krankmeldung, Entscheidung zum Antrag (an Mitarbeiter), Angebot angenommen, Zahlung eingegangen (nur mit Geld-Recht), neue Aufgabe für dich.

## Macher erledigt automatisch

- Kein Hinweis an den Auslöser, Dedup gleicher Titel+Objekt in 10 Minuten (z. B. `angebote.updated` + `angebot.angenommen`), Beispieldaten werden ignoriert; Beispiel-Benachrichtigungen per `seed`.

## Bewusst weggelassen (Pareto)

- Push/E-Mail/SMS, Ruhezeiten, Einstellungen je Ereignistyp.
