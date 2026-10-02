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

- **Inbox statt Postfach** (`Inbox.tsx`): Jetzt · Aktion nötig · Zur Kenntnis; Aktivität nur hinter „Letzte Aktivitäten“. Kein Gelesen/Archiv.
- Glocke zählt nur Jetzt + Aktion nötig – nie „ungelesen“.
- Je Eintrag nächste sinnvolle Aktion (Genehmigen, Einplanen, Erledigen …), dazu Später, Öffnen, Erledigt; Grund („Du bist für die Freigabe zuständig.“).
- Später: in 1 Stunde · heute Nachmittag · morgen früh · nächste Woche · Datum wählen. Kommt nur wieder, wenn der Grund noch besteht.
- Bündel je Objekt („Auftrag Müller · 2 Kundennachrichten · 1 Aufgabe“), Aktion darin hervorgehoben.
- Team-Hinweise aus „Braucht dich“ nur mit Grund (persönlich, Sicherheit, Gewicht ab 70) und höchstens fünf; der Rest per Link.

## Macher erledigt automatisch

- Regeln, Stufen, Lebensdauer (Info 48 h, Aktivität 12 h, je Art anpassbar), Auflösung und Push zentral in `core/aufmerksamkeit.ts`.
- Zustand schlägt Zeit: Antrag entschieden, Nachricht gelesen, Auftrag eingeplant, Aufgabe delegiert, Termin abgesagt, Objekt gelöscht → Meldung sofort weg (ereignisgetrieben und bei jedem Lesen).
- Idempotent: gleiche Quelle (`quelleId`) nur einmal, gleiche Art + Objekt + Empfänger wird zusammengefasst; kein Hinweis an den Auslöser; Rechte und Rolle werden beim Lesen geprüft.
- Push nur bei Jetzt oder zeitkritischer Aktion, mit Ruhezeiten. Aufräumen nach 14 Tagen – Zeitstrahl und Ereignisprotokoll bleiben vollständig.

## Bewusst weggelassen (Pareto)

- Einstellungen je Ereignistyp, KI-Einstufung (Regeln statt Modell), E-Mail/SMS je Meldung.
