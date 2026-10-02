# Pain Points – Leistungen & Preise

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Stundensatz aus dem Bauch – deckt die Kosten nicht | 6 | 10 | 60 | C |
| 2 | Arbeitszeit je Leistung unbekannt → Planung zu knapp | 7 | 7 | 49 | B,C |
| 3 | Material wird beim Kalkulieren vergessen | 7 | 7 | 49 | B |
| 4 | Leistung bringt pro Stunde weniger als der Stundensatz, keiner merkt es | 6 | 8 | 48 | C,B |
| 5 | Preise seit Jahren nicht erhöht, Großhandel aber schon | 5 | 9 | 45 | C |
| 6 | Jeder im Büro rechnet dieselbe Leistung anders | 7 | 6 | 42 | B |
| 7 | Unproduktive Stunden (Fahrt, Lager) nicht eingepreist | 5 | 8 | 40 | C |
| 8 | Katalog unübersichtlich, Leistung nicht gefunden | 8 | 4 | 32 | B |
| 9 | Wer darf welche Leistung ausführen? (Qualifikation) | 5 | 6 | 30 | B |
| 10 | Preise einzeln ändern ist mühsam (50 Positionen) | 4 | 7 | 28 | B |
| 11 | Lohnnebenkosten nicht bekannt | 4 | 7 | 28 | C |
| 12 | Monteur sieht Preise, die er nicht sehen soll | 4 | 6 | 24 | C |
| 13 | Langtexte für Angebote jedes Mal neu | 6 | 4 | 24 | B |
| 14 | Gemeinkosten-Umlage unklar | 3 | 8 | 24 | C |
| 15 | Gewinnaufschlag vergessen | 3 | 8 | 24 | C |
| 16 | Stundensatz geändert, Lohnpositionen nicht | 3 | 7 | 21 | B |
| 17 | Alte Leistungen tauchen in Angeboten auf | 5 | 4 | 20 | B |
| 18 | Preise vom Handy aus nicht nachschlagbar | 5 | 4 | 20 | M,C |
| 19 | Unterschiedliche Preise für gleiche Leistung im Umlauf | 4 | 5 | 20 | C,B |
| 20 | Einheiten uneinheitlich (Stk/Psch/m) | 4 | 4 | 16 | B |
| 21 | Löschen einer Leistung zerstört alte Angebote | 2 | 8 | 16 | B |
| 22 | Neue Leistung anlegen dauert zu lang | 5 | 3 | 15 | B |
| 23 | Preisänderung lässt sich nicht zurücknehmen | 2 | 7 | 14 | B |
| 24 | Kein Überblick, wo eine Leistung verwendet wird | 3 | 4 | 12 | B |
| 25 | Kategorien wachsen wild | 4 | 3 | 12 | B |
| 26 | Leistungen und Material an zwei Orten – wer ein Angebot schreibt, sucht im Menü statt im Katalog (Plancraft-Vergleich, Relevanz 95) | 9 | 6 | 54 | B, C |

## Muss rein
- Katalog nach Kategorie mit Suche und Filter „Unter Stundensatz“
- Leistung mit Preis, Einheit, Minuten, typischem Material, nötiger Qualifikation, aktiv/inaktiv
- Kennzahl „bringt je Arbeitsstunde“ (nach Material-EK)
- Preisanpassung in % je Kategorie mit Vorschau, Rundung und Rückgängig
- Stundensatz-Rechner (Lohn, Lohnnebenkosten, produktive Stunden, Gemeinkosten, Gewinn) mit Übernahme
- Preise nur mit Recht „Preise & Geld“

- Gemeinsamer **Katalog** (Betrieb › Unternehmen › Katalog) mit den Ansichten **Material · Leistungen** (8, 26) –
  so, wie es auf Angebot und Rechnung landet. Datenmodelle bleiben getrennt (eine Quelle je Objekt). Neue Adresse
  `/betrieb/katalog/leistungen/…`; `/betrieb/leistungen/…` leitet weiter (inkl. `?filter=unter`).

## Macher erledigt automatisch
- Stundenpreise ziehen beim Ändern des Stundensatzes mit (Erledigt-Eintrag, rückgängig machbar)
- Hinweis „Stundensatz deckt Kosten nicht“ mit Aktion „übernehmen“
- Hinweis „Leistungen unter Stundensatz“

## Bewusst weggelassen (Pareto)
- Staffelpreise, Kundenpreislisten
- Import von Leistungskatalogen (z. B. STLB-Bau)
- Mehrstufige Kalkulationsschemata (gehört in Kalkulation)
