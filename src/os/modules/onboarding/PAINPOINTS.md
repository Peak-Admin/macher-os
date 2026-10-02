# Onboarding – Top 25 Pain Points

Score = Frequenz (1–10) × Intensität (1–10).

| # | Pain Point | Freq. | Int. | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Leere Software nach dem Kauf – man weiß nicht, wo anfangen | 9 | 9 | 81 | Chef |
| 2 | Leistungen und Preise müssen alle selbst angelegt werden | 7 | 8 | 56 | Chef, Büro |
| 3 | Kundendaten aus altem Programm abtippen | 6 | 9 | 54 | Büro |
| 4 | Einrichtung dauert Tage, Berater nötig | 6 | 9 | 54 | Chef |
| 5 | Zu viele Fragen auf einmal | 7 | 7 | 49 | Chef |
| 6 | Fragen in Software-Sprache statt Handwerkssprache | 7 | 7 | 49 | Chef |
| 7 | Unpassende Funktionen fürs eigene Gewerk | 7 | 6 | 42 | Chef |
| 8 | Material/Artikel von null | 6 | 7 | 42 | Büro |
| 9 | Nach der Einrichtung unklar, was passiert ist | 6 | 6 | 36 | Chef |
| 10 | Eingaben weg beim Zurückgehen | 5 | 7 | 35 | Chef |
| 11 | CSV-Import scheitert an Semikolon/Umlauten/Excel-BOM | 5 | 7 | 35 | Büro |
| 12 | Beispieldaten nicht von echten zu unterscheiden | 5 | 7 | 35 | Chef |
| 13 | Qualifikationen/Pflichtunterweisungen unbekannt | 5 | 6 | 30 | Chef |
| 14 | Kein Fortschritt sichtbar – wie lange noch? | 6 | 5 | 30 | Chef |
| 15 | Handy-Einrichtung unmöglich | 5 | 6 | 30 | Chef |
| 16 | Erst mal nur ausprobieren wollen | 6 | 5 | 30 | Chef |
| 17 | Arbeitsweise (Kundendienst/Baustelle) ignoriert | 5 | 5 | 25 | Chef |
| 18 | Preise sind fix und falsch | 4 | 6 | 24 | Chef |
| 19 | Fehlermeldungen ohne Lösung | 4 | 6 | 24 | alle |
| 20 | Doppelte Kunden beim Import | 4 | 6 | 24 | Büro |
| 21 | Zu wenig Leistungen für kleine Gewerke | 4 | 5 | 20 | Chef |
| 22 | Versehentlich neu eingerichtet → Daten weg | 2 | 10 | 20 | Chef |
| 23 | Kein Einstieg danach | 4 | 5 | 20 | Chef |
| 24 | Automationen müssen erst gefunden werden | 4 | 5 | 20 | Chef |
| 25 | Teamgröße beeinflusst nichts | 3 | 4 | 12 | Chef |

## Muss rein

- Vollbild `/willkommen`, sechs Schritte, eine Frage je Schritt, Auswahlkarten, Fortschritt, Zurück ohne Datenverlust, Validierung je Schritt.
- Leistungen aus `gewerkVorlage` vorausgewählt und abwählbar (Richtpreise).
- Startdaten: Beispieldaten, Kunden-CSV (Semikolon/Komma/Tab, BOM, Anführungszeichen, Dubletten) oder leer.
- Erfolgsseite „Dein Betrieb ist eingerichtet“ mit echten Zahlen (Leistungen, Artikel, Qualifikationen, Modul-Vorlagen wie Checklisten, aktive Regeln, Kunden) und „Zu Heute“.
- Schnellstart „Beispielbetrieb einrichten“; Schutz bei bereits eingerichtetem Betrieb.

## Macher erledigt automatisch

- `einrichten()` legt alles an; Modul-Seeds laufen automatisch; Automationen standardmäßig an.

## Bewusst weggelassen (Pareto)

- Mitarbeiter-/Artikel-/Leistungsimport, Logo/Briefkopf, Bankdaten – gehören in die jeweiligen Module bzw. Einstellungen.
