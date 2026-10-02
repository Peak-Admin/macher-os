# Pain Points – Steuerberater & DATEV

Score = Frequenz (1–10) × Intensität (1–10).

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Monatsende: Belege-Schuhkarton zum Steuerberater bringen | Chef, Büro | 9 | 8 | 72 |
| 2 | Steuerberater fragt fehlende Belege nach – Wochen später | Büro | 7 | 7 | 49 |
| 3 | USt-Voranmeldung bis zum 10. – Unterlagen kommen zu spät | Chef | 6 | 8 | 48 |
| 4 | Tankquittungen und Baumarkt-Bons fehlen | Monteur, Büro | 7 | 6 | 42 |
| 5 | Kontenzuordnung (SKR03/04) versteht im Betrieb keiner | Büro | 6 | 6 | 36 |
| 6 | Unklar, was im Monat schon übergeben wurde | Büro | 6 | 6 | 36 |
| 7 | Monatsabschluss hat keine feste Checkliste | Büro | 6 | 6 | 36 |
| 8 | Rechnungen doppelt an den Steuerberater geschickt | Büro | 5 | 7 | 35 |
| 9 | DATEV-Import scheitert an Umlauten/Format | Steuerberater | 4 | 8 | 32 |
| 10 | Debitoren-/Kreditorennummern werden händisch gepflegt | Büro | 5 | 6 | 30 |
| 11 | Zeiten nicht freigegeben, Lohnabrechnung wartet | Büro | 5 | 6 | 30 |
| 12 | Steuerberater-Kosten für Belegerfassung | Chef | 5 | 6 | 30 |
| 13 | Entwürfe landen versehentlich im Export | Büro | 3 | 7 | 21 |
| 14 | Berater-/Mandantennummer nicht zur Hand | Büro | 4 | 5 | 20 |
| 15 | Barbelege ohne Lieferant – wohin buchen? | Büro | 4 | 5 | 20 |
| 16 | Kein Protokoll, wann was exportiert wurde | Büro | 4 | 5 | 20 |
| 17 | Steuersatz auf Beleg falsch erfasst | Büro | 3 | 6 | 18 |
| 18 | Abschlagsrechnungen werden unterschiedlich gebucht | Steuerberater | 3 | 6 | 18 |
| 19 | Monteure sollen Buchhaltung nicht sehen | Chef | 3 | 6 | 18 |
| 20 | Direktanbindung DATEV Unternehmen online fehlt | Chef, Steuerberater | 4 | 4 | 16 |
| 21 | Kontaktdaten des Steuerberaters suchen | Chef | 5 | 3 | 15 |
| 22 | Export verloren – erneut erzeugen nicht möglich | Büro | 3 | 5 | 15 |
| 23 | Ein Export über den Jahreswechsel wird abgelehnt | Büro | 2 | 6 | 12 |
| 24 | Gutschriften falsch herum gebucht | Steuerberater | 2 | 6 | 12 |
| 25 | Kleinunternehmer-Regelung falsch behandelt | Chef | 1 | 7 | 7 |

## Muss rein
- Export Buchungsstapel (EXTF 700, Windows-1252) für Ausgangsrechnungen und Belege eines Zeitraums, SKR03/SKR04
- Doppel-Export verhindern (markiert, Warnung, bewusst „trotzdem erneut“)
- Monatsabschluss-Checkliste: automatisch geprüfte Punkte + selbst abzuhakende
- Steuerberater-Kontakt mit Anrufen/E-Mail, Berater-/Mandantennummer mit Prüfung
- DATEV Unternehmen online als „Geplant“ gekennzeichnet

## Macher erledigt automatisch
- Debitoren ab 10000 und Kreditoren ab 70000 werden automatisch und dauerhaft vergeben
- Konten und BU-Schlüssel werden aus Belegkategorie und Steuersatz bestimmt
- Belege bekommen nach dem Export `exportiertAm`, Rechnungen werden vermerkt, Eintrag in „Erledigt“
- Ab dem 3. des Monats Hinweis „Vormonat an den Steuerberater übergeben“

## Bewusst weggelassen (Pareto)
- Belegbilder im DATEV-Format (Belegtransfer)
- Lohn-Export
- Offene-Posten-Abgleich mit der Bank
- eigene Kontenpläne
