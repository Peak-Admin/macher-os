# Qualifikationen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Sicht: Chef, Büro, Monteur auf der Baustelle.

| # | Pain Point | F | I | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Wer darf Elektroarbeiten/Gas/Kältemittel? | 6 | 8 | 48 | Büro |
| 2 | Erste-Hilfe-/Prüfschein abgelaufen, keiner hat es gemerkt | 4 | 9 | 36 | Chef |
| 3 | Auftrag verlangt Qualifikation, Plan ignoriert sie | 4 | 8 | 32 | Büro |
| 4 | Monteur ohne nötige Qualifikation auf Baustelle geschickt | 3 | 10 | 30 | Chef, Büro |
| 5 | Nachweise liegen verstreut in Ordnern | 5 | 6 | 30 | Büro |
| 6 | Matrix in Excel veraltet | 5 | 6 | 30 | Büro |
| 7 | Führerscheinkontrolle vergessen | 3 | 7 | 21 | Chef |
| 8 | Keine Vorwarnung, Schulungen sind ausgebucht | 3 | 7 | 21 | Chef |
| 9 | Zu viele Hinweise ohne Aktion | 4 | 5 | 20 | Chef |
| 10 | Bei BG-/Kundenprüfung Nachweis nicht auffindbar | 2 | 9 | 18 | Chef |
| 11 | Ablaufdatum muss man selbst ausrechnen | 4 | 4 | 16 | Büro |
| 12 | Herstellerzertifikat abgelaufen → keine Garantieabwicklung | 2 | 8 | 16 | Chef |
| 13 | Dokument-Foto vom Handy fehlt | 4 | 4 | 16 | Büro |
| 14 | Neuer Mitarbeiter – was hat er schon? | 3 | 5 | 15 | Chef |
| 15 | Qualifikationen je Gewerk unterschiedlich | 3 | 5 | 15 | Chef |
| 16 | Monteur weiß nicht, was bei ihm abläuft | 3 | 5 | 15 | Monteur |
| 17 | Unterweisung = Nachweis, doppelt gepflegt | 3 | 5 | 15 | Büro |
| 18 | Ausschreibung verlangt Nachweise, Suche dauert | 2 | 7 | 14 | Büro |
| 19 | Unbefristete vs. befristete Nachweise | 3 | 4 | 12 | Büro |
| 20 | Schulung geplant, Warnung kommt trotzdem | 3 | 4 | 12 | Chef |
| 21 | Alte Nachweise überschreiben Historie | 2 | 5 | 10 | Chef |
| 22 | Ausgetretene erzeugen Warnungen | 2 | 4 | 8 | Büro |
| 23 | Doppelte Qualifikationen | 2 | 3 | 6 | Büro |
| 24 | Löschen einer Qualifikation zerstört Matrix | 1 | 5 | 5 | Chef |
| 25 | Monatsende-Fälle (31.01. + 1 Monat) | 1 | 3 | 3 | Büro |

## Muss rein
- Matrix Mitarbeiter × Qualifikation mit Status als Text
- Liste der Qualifikationen, „Läuft ab“-Filter
- Detail je Qualifikation mit Nachweisen, Dokument, offenen Aufträgen, die sie verlangen
- Nachweis eintragen (Gültig bis automatisch, Dokument optional), Tab am Mitarbeiter

## Macher erledigt automatisch
- Ablauf-Hinweise 60/30 Tage vorher und nach Ablauf mit Aktion „Schulung planen“ (entfällt, wenn Schulung geplant)
- Gültig-bis automatisch aus Erwerb + Gültigkeit
- Unterweisungen schreiben verknüpfte Nachweise fort

## Bewusst weggelassen (Pareto)
- Planungsprüfung (gehört Paket planpruefung, nutzt `db.nachweise`)
- Kompetenzstufen
- Prüfungsfragen
