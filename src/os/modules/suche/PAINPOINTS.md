# Suche – Top 25 Pain Points

Score = Frequenz (1–10) × Intensität (1–10).

| # | Pain Point | Freq. | Int. | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Kunde ruft an – Name halb verstanden, Suche findet nichts | 9 | 8 | 72 | Büro |
| 2 | Am Handy umständliches Navigieren zu einem Auftrag | 9 | 7 | 63 | Monteur |
| 3 | Rechnungsnummer vom Kontoauszug zuordnen | 7 | 8 | 56 | Büro |
| 4 | Jedes Modul hat eigene Suche, keine globale | 8 | 7 | 56 | alle |
| 5 | Treffer ohne Kontext (welcher „Müller“?) | 7 | 7 | 49 | Büro |
| 6 | Suche nach Telefonnummer bei Rückruf | 7 | 7 | 49 | Büro |
| 7 | Dokument/Foto zum Auftrag wiederfinden | 6 | 7 | 42 | Monteur, Büro |
| 8 | Termin finden („wann waren wir bei Hoffmann?“) | 6 | 6 | 36 | Büro |
| 9 | Suche nach Adresse/Straße | 6 | 6 | 36 | Monteur |
| 10 | Leere Treffer ohne Hilfe → Sackgasse | 6 | 6 | 36 | alle |
| 11 | Tippfehler/Groß-Klein | 7 | 5 | 35 | alle |
| 12 | Mobil: Tastatur verdeckt Treffer | 6 | 5 | 30 | Monteur |
| 13 | Kein Tastaturbedienung – Maus nötig | 6 | 5 | 30 | Büro |
| 14 | Doppelte Treffer verwirren | 6 | 5 | 30 | alle |
| 15 | Link führt auf falsche Seite (harte Pfade) | 4 | 7 | 28 | alle |
| 16 | Immer wieder dieselben Suchen tippen | 7 | 4 | 28 | Büro |
| 17 | Zu viele Treffer einer Art drücken andere weg | 5 | 5 | 25 | alle |
| 18 | Unklare Sortierung | 5 | 5 | 25 | alle |
| 19 | Angebote nach Kunde suchen | 5 | 5 | 25 | Büro |
| 20 | Suche zeigt Beträge an Leute ohne Geld-Recht | 3 | 8 | 24 | Chef |
| 21 | Suche langsam bei vielen Daten | 4 | 6 | 24 | Büro |
| 22 | Kein Shortcut (Strg+K) | 5 | 4 | 20 | Büro |
| 23 | Gelöschte Objekte tauchen auf | 3 | 6 | 18 | alle |
| 24 | Suche verliert Eingabe beim Schließen | 4 | 4 | 16 | alle |
| 25 | Mitarbeiter finden | 4 | 4 | 16 | Büro |

## Muss rein

- Overlay über `sucheUeberall()` mit Strg+K, Pfeiltasten, Enter, Esc.
- Gruppierung nach Typ (max. 5 je Gruppe), beste Gruppe zuerst; Duplikate gleicher `pfad` entfernt.
- Eigene Provider für Termine, Rechnungsnummern (exakt = ganz oben), Dokumente – Links nur über `pfadZu`.
- Letzte Suchen je Nutzer, Leerzustand mit Hinweis, „Keine Treffer → Macher fragen“.

## Macher erledigt automatisch

- Beträge in Treffern nur mit Geld-Recht.
- Termin ohne Kalender-Modul verlinkt auf den Auftrag.

## Bewusst weggelassen (Pareto)

- Unscharfe/phonetische Suche, Volltext in Dateien, Filter in der Suche.
