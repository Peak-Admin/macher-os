# Daten übernehmen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Umstieg scheitert, weil Kunden und Preise aus dem alten Programm nicht rüberkommen | 3 | 10 | 30 | C, B |
| 2 | Import erzeugt Dubletten (Kunde steht schon drin) | 4 | 8 | 32 | B |
| 3 | Spalten heißen in jedem Programm anders („Kd-Nr.“, „Debitor“, „Kundennummer“) | 5 | 6 | 30 | B |
| 4 | Fehlermeldungen sind technisch („Parse error in row 14“) statt „Zeile 14: E-Mail fehlt das @“ | 4 | 6 | 24 | B |
| 5 | Falscher Import lässt sich nicht zurücknehmen – alles von Hand löschen | 2 | 9 | 18 | B |
| 6 | Offene Rechnungen aus dem Altsystem fehlen im Mahnwesen | 3 | 8 | 24 | C, B |
| 7 | Excel macht aus PLZ 01067 „1067“, aus Datum eine Zahl | 4 | 5 | 20 | B |
| 8 | Preise des Großhändlers ändern sich, jede Position einzeln anfassen | 4 | 6 | 24 | B |

Pflichtfunktionen daraus: Erkennung über Spaltennamen **und** Wertemuster, Dubletten gegen den Bestand und in der Datei,
verständliche Fehler je Zeile, Vorschau vor dem Übernehmen, Rückgängig für den ganzen Import, offene Rechnungen/Angebote
mit Kundenverweis per ID, Excel-Eigenheiten (PLZ ohne Null, Datum als Zahl, Punkt als Dezimaltrenner), Preise aktualisieren.
