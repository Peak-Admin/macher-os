# Auftragsabläufe – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Niemand weiß auf einen Blick, wo ein Auftrag gerade steht | 9 | 8 | 72 | C, B |
| 2 | Nach der Zusage passiert tagelang nichts – keiner fühlt sich zuständig | 7 | 9 | 63 | C, B |
| 3 | Rechnung wird nach der Abnahme vergessen oder Wochen später geschrieben | 6 | 10 | 60 | C, B |
| 4 | Material wird zu spät bestellt, der Einsatz platzt | 6 | 9 | 54 | C, B, M |
| 5 | „Phase“ ist zu grob: „Beauftragt“ sagt nicht, ob Gerüst, Netzanmeldung oder Bestellung fehlen | 7 | 7 | 49 | C, B |
| 6 | Jedes Gewerk tickt anders (Solar: Netzbetreiber, Fenster: Hersteller-Lieferung, Dach: Gerüst) | 6 | 8 | 48 | C |
| 7 | Fristen stehen nur im Kopf des Chefs | 7 | 7 | 49 | C |
| 8 | Planung erfährt nicht, dass ein Auftrag fertig zum Einplanen ist | 6 | 7 | 42 | B |
| 9 | Status wird von Hand gepflegt und ist deshalb falsch | 8 | 6 | 48 | B |
| 10 | Bezahlte Aufträge bleiben offen, Listen werden unübersichtlich | 6 | 5 | 30 | B |
| 11 | Bewertung wird nach guter Arbeit nie angefragt | 5 | 5 | 25 | C |
| 12 | Neue Mitarbeiter im Büro kennen den Ablauf nicht | 4 | 7 | 28 | B |
| 13 | Schritte anpassen geht nur mit Programmierer | 3 | 8 | 24 | C |
| 14 | Zu viele Statuswerte verwirren Monteure | 6 | 4 | 24 | M |
| 15 | Kundendienst braucht keinen Angebots-Ablauf, wird aber so behandelt | 6 | 4 | 24 | B |
| 16 | Wartung läuft anders als Projekt (Termin vereinbaren statt Angebot) | 5 | 5 | 25 | B |
| 17 | Reklamationen landen im normalen Ablauf und werden abgerechnet | 3 | 7 | 21 | B |
| 18 | Kein Verlauf: Wann wurde der Auftrag beauftragt, wann eingeplant? | 4 | 5 | 20 | C |
| 19 | Erinnerungen kommen an alle statt an den Zuständigen | 5 | 4 | 20 | C, B |
| 20 | Begriffe passen nicht („Baustelle“ beim Reinigungsobjekt) | 4 | 4 | 16 | C |
| 21 | Software startet leer, alles muss selbst eingerichtet werden | 3 | 6 | 18 | C |
| 22 | Doppelte Hinweise zum selben Auftrag aus mehreren Ecken | 4 | 4 | 16 | C, B |
| 23 | Statuswechsel rückwärts (Kunde springt ab) zerschießt Listen | 2 | 6 | 12 | B |
| 24 | Monteur weiß nicht, was nach seinem Einsatz kommt | 3 | 4 | 12 | M |
| 25 | Angepasste Abläufe lassen sich nicht zurücksetzen | 2 | 5 | 10 | C |

## Muss rein
- Am Auftrag: „Wo steht der Auftrag?“ (ruhige Leiste, aktueller Schritt, seit wann, zuständig, Frist) und „Als Nächstes“ mit genau einer Hauptaktion (1, 2, 7, 24).
- Schritte als feinere Stufe der Phase, je Gewerk und Auftragsart vorkonfiguriert (5, 6, 15, 16, 17, 21).
- Zuständige je Schritt und Fristen → Erinnerung in „Braucht dich“ an die zuständige Person (7, 19).
- Schritt in Listen und Board statt der groben Phase (1).
- Konfiguration nur unter Betrieb › Einstellungen › Auftragsabläufe, mit „Auf Vorlage zurücksetzen“ (13, 25).

## Macher erledigt automatisch
- Schrittwechsel aus den Daten: Angebot verschickt → „Warten auf Kunde“, Termin geplant → „Eingeplant“, Material bestellt/da, Rechnung verschickt → „Warten auf Zahlung“ (9).
- Zusage → „Vorbereitung“, Materialbedarf-Hinweis, Planung benachrichtigt (2, 4, 8).
- Abnahme → „Rechnung“, Vorschlag „Rechnung vorbereiten“ (3).
- Bezahlt → Auftrag abschließen, Bewertung als nächster Schritt (10, 11).
- Jeder Schrittwechsel im Verlauf des Auftrags und als Ereignis `auftrag.schritt_gewechselt` (18).

## Bewusst weggelassen
- Eigener Navigationspunkt, Kanban je Schritt (das Board bleibt nach Phasen).
- Frei programmierbare Regeln/Bedingungen im UI – feste, verständliche Bedingungen reichen.
- Mehrere parallele Schritte je Auftrag.
