# Pain Points – Vorlagen & Formulare

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Kundenname oder Betrag im Text falsch (Copy & Paste) | 6 | 8 | 48 | B |
| 2 | Terminbestätigung fehlt → Kunde nicht da | 6 | 8 | 48 | B,M |
| 3 | Jede Rechnung/jedes Angebot wird von Hand formuliert | 9 | 5 | 45 | B |
| 4 | Mahnungen fühlen sich unangenehm an, werden aufgeschoben | 5 | 8 | 40 | B,C |
| 5 | Pflichtangaben (Steuer, Bank) fehlen auf Dokumenten | 4 | 9 | 36 | B |
| 6 | Texte liegen in Word-Dateien verstreut | 7 | 5 | 35 | B |
| 7 | Gewerksspezifische Hinweise fehlen (Zugang Heizraum) | 5 | 6 | 30 | B,M |
| 8 | Vorschau fehlt – wie sieht es beim Kunden aus? | 5 | 5 | 25 | B |
| 9 | Kein Logo/Briefkopf, wirkt unprofessionell | 4 | 6 | 24 | C |
| 10 | Jeder schreibt anders, kein einheitlicher Ton | 6 | 4 | 24 | C |
| 11 | Platzhalter vergessen, „{kunde}“ landet beim Kunden | 3 | 8 | 24 | B |
| 12 | E-Mail-Betreff jedes Mal neu | 7 | 3 | 21 | B |
| 13 | Zahlungserinnerung zu scharf/zu weich | 4 | 5 | 20 | B |
| 14 | Angebotsgültigkeit nicht im Text | 4 | 5 | 20 | B |
| 15 | Anrede Firma vs. privat falsch | 5 | 4 | 20 | B |
| 16 | Rückfrage nach Fotos/Maßen jedes Mal neu getippt | 6 | 3 | 18 | B |
| 17 | Nicht klar, welche Vorlage wo benutzt wird | 4 | 4 | 16 | B |
| 18 | Änderung an Bankdaten muss in allen Vorlagen nachgezogen werden | 2 | 8 | 16 | B |
| 19 | Logo zu groß, Dokumente werden riesig | 3 | 5 | 15 | B |
| 20 | Neue Mitarbeiterin weiß nicht, welche Texte es gibt | 3 | 5 | 15 | B |
| 21 | Vorlage versehentlich gelöscht | 2 | 6 | 12 | B |
| 22 | SMS-Erinnerung zu lang | 4 | 3 | 12 | B |
| 23 | Briefe vom Handy aus nicht möglich | 3 | 4 | 12 | C |
| 24 | Fußzeile ohne Handwerkskammer/Inhaber | 2 | 5 | 10 | C |
| 25 | Kopie einer Vorlage für Sonderfall umständlich | 3 | 3 | 9 | B |

## Muss rein
- Vorlagen je Zweck (Angebot, Rechnung, Mahnung, E-Mail, Termin) mit Platzhaltern
- Editor mit Platzhalter-Knöpfen und Live-Vorschau aus echten Daten, Warnung bei fehlenden Werten
- Startvorlagen je Gewerk (z. B. Zugangshinweis Heizraum/Zählerschrank)
- Briefkopf: Logo-Upload (automatisch verkleinert), Fußzeile live aus Betriebsdaten
- `vorlageAnwenden(id|schluessel, kontext)` + `kontextAus({...})` + `briefkopf()` für andere Module

## Macher erledigt automatisch
- Platzhalter werden aus Kunde/Auftrag/Rechnung/Termin gefüllt – nichts kopiert
- Bank/Steuer in der Fußzeile ändern sich automatisch mit den Betriebsdaten
- Anrede je Kundenart automatisch

## Bewusst weggelassen (Pareto)
- Freier Layout-Designer für Dokumente (PDF-Gestaltung macht das jeweilige Modul)
- Bedingte Textbausteine/Logik in Vorlagen
- Mehrsprachige Vorlagen
