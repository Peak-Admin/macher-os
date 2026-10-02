# Kalender – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Monteur weiß morgens nicht sicher, wo er heute hin muss (Zettel, WhatsApp, Anruf) | 10 | 9 | 90 | M, B |
| 2 | Termine stehen in drei Kalendern (Outlook, Papier, Kopf) und widersprechen sich | 9 | 9 | 81 | C, B |
| 3 | Doppelbuchung fällt erst auf, wenn zwei Kunden gleichzeitig warten | 8 | 10 | 80 | B, C |
| 4 | Verschieben kostet fünf Anrufe und am Ende weiß keiner, welcher Stand gilt | 9 | 8 | 72 | B, M |
| 5 | Am Handy ist ein Wochenraster unlesbar – man braucht eine einfache Liste | 9 | 8 | 72 | M |
| 6 | Adresse, Zugang („Schlüssel beim Hausmeister“) und Telefon vor Ort fehlen beim Termin | 9 | 7 | 63 | M |
| 7 | Termin ohne zugeteilten Monteur – merkt man erst am Morgen | 6 | 10 | 60 | B |
| 8 | Abgesagte Termine verschwinden spurlos, niemand weiß warum | 6 | 7 | 42 | B, C |
| 9 | Kein Bezug vom Termin zum Auftrag (Beschreibung, Material, Vorgeschichte) | 7 | 6 | 42 | M |
| 10 | Monteur will Termine in seinem eigenen Handykalender haben | 6 | 6 | 36 | M |
| 11 | Wer ist heute eigentlich da? Urlaub/Schule stehen woanders | 7 | 5 | 35 | B |
| 12 | Auftrag platzt, aber seine Termine blockieren weiter Leute | 4 | 8 | 32 | B |
| 13 | Uhrzeit-/Datumseingabe dauert zu lange (Dauer jedes Mal neu rechnen) | 8 | 4 | 32 | B |
| 14 | Monatsüberblick für Urlaubs- und Großbaustellenplanung fehlt | 4 | 7 | 28 | C |
| 15 | Vom Kunden gebuchte Termine müssen kurz bestätigt werden – gehen unter | 4 | 7 | 28 | B |
| 16 | Kein Verlauf: wer hat den Termin wann verschoben? | 4 | 6 | 24 | C, B |
| 17 | Filter „nur meine Termine“ fehlt, Monteur sieht zu viel | 6 | 4 | 24 | M |
| 18 | Mehrtägige Einsätze werden pro Tag neu angelegt | 4 | 5 | 20 | B |
| 19 | Rückgängig nach versehentlichem Verschieben/Absagen fehlt | 3 | 6 | 18 | B |
| 20 | Interne Termine (Teambesprechung, Schulung) blockieren unsichtbar | 4 | 4 | 16 | B |
| 21 | Termin-Erinnerung an Kunden fehlt (No-Show) | 4 | 4 | 16 | B |
| 22 | Farbcodes je Monteur unklar, ohne Legende | 5 | 3 | 15 | B |
| 23 | Suche nach „wann waren wir bei Familie X?“ | 3 | 5 | 15 | B |
| 24 | Wochenende/Feiertage werden verplant | 2 | 6 | 12 | B |
| 25 | Ganztägige Termine (Baustelle) sind in Stunden schwer einzutragen | 3 | 3 | 9 | B |

## Muss rein
- Tag/Woche/Monat am Rechner, **Agenda-Liste am Handy**, Filter nach Mitarbeiter (Monteure sehen standardmäßig nur sich) (1, 5, 14, 17)
- Ein Termin-Formular für alle: Auftrag wählen → Titel, Kunde, Ort, Dauer werden übernommen; Mitarbeiter mit **Live-Status „Frei / Urlaub / Doppelt gebucht“**; „Nächste freie Zeit finden“ (3, 9, 13)
- Termin-Detail mit Adresse, Zugangshinweisen, Telefon, Auftrag, Verlauf und Panels anderer Pakete (6, 9, 16)
- Verschieben (+1 Tag / +1 Woche, Konfliktprüfung), Absagen mit Grund, Bestätigen, Rückgängig per Toast (4, 8, 19)
- ICS-Export einzelner Termine (10)
- Tab „Termine“ in der Auftragsakte (9)

## Macher erledigt automatisch
- Hinweis „Niemand eingeplant“ für Termine der nächsten 2 Tage (7)
- Auftrag „nicht zustande gekommen“ → künftige Termine automatisch absagen, mit Rückgängig (12)
- Verschieben/Absagen wird im Zeitstrahl von Termin und Auftrag vermerkt (16)
- Konflikte werden an jedem Termin als Text-Status angezeigt (3)

## Bewusst weggelassen
- Stundengenaues Zeitraster mit Ziehen von Terminlängen (Pareto: Listen pro Tag reichen)
- Serien-/Wiederholtermine (Paket service, `wiederkehrend`)
- Kunden-Erinnerungen per SMS (keine Schnittstelle im Kern) (21)
- Feiertagskalender (Kernwunsch, 24)
- Echte mehrtägige Termine über das Formular (Plantafel: pro Tag einplanen) (18)
