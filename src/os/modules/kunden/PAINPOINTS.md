# Kunden – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Kunde ist doppelt angelegt („Schulz“ und „Petra Schulz“), Aufträge und Rechnungen verteilen sich | 7 | 9 | 63 | B, C |
| 2 | Telefonnummer fehlt oder ist falsch, Monteur steht vor verschlossener Tür | 7 | 9 | 63 | M, B |
| 3 | Bei Firmen/Hausverwaltungen weiß keiner, wer der richtige Ansprechpartner ist | 7 | 8 | 56 | B, M |
| 4 | Beim Anruf dauert es zu lange, den Kunden zu finden (Name falsch geschrieben, nur Ort bekannt) | 9 | 6 | 54 | B |
| 5 | Was lief schon alles bei diesem Kunden? Aufträge, Orte, Anlagen liegen verstreut | 8 | 6 | 48 | B, C |
| 6 | Kontaktdaten ändern sich, Korrektur ist umständlich oder wird vergessen | 6 | 6 | 36 | B |
| 7 | Kunde versehentlich gelöscht – Historie weg | 2 | 10 | 20 | B |
| 8 | Keine einheitlichen Kundennummern, jeder zählt anders | 5 | 5 | 25 | B |
| 9 | Kunde aus Anfrage wird ohne Nummer/Struktur angelegt | 6 | 4 | 24 | B |
| 10 | Unklar, wie der Kunde auf uns gekommen ist (Werbung, Empfehlung) | 6 | 5 | 30 | C |
| 11 | Private und gewerbliche Kunden haben andere Zahlungsziele | 4 | 6 | 24 | B |
| 12 | Interne Notizen („zahlt spät“, „Hund“) stehen auf Zetteln | 6 | 5 | 30 | B, M |
| 13 | Kunde mit offenen Rechnungen wird gelöscht | 2 | 8 | 16 | B |
| 14 | Mehrere Adressen pro Kunde (Wohnhaus, Ferienwohnung) durcheinander | 5 | 6 | 30 | B, M |
| 15 | Monteur kann den Kunden unterwegs nicht mit einem Tipp anrufen | 8 | 5 | 40 | M |
| 16 | Neuer Kunde wird angelegt, obwohl er schon existiert (keine Warnung) | 7 | 7 | 49 | B |
| 17 | Kundenliste unübersichtlich – wer hat gerade einen offenen Auftrag? | 7 | 5 | 35 | C, B |
| 18 | E-Mail-Adresse mit Tippfehler, Angebot kommt nie an | 4 | 7 | 28 | B |
| 19 | Zusammenführen kopiert Daten, danach gibt es zwei Wahrheiten | 3 | 8 | 24 | B |
| 20 | Ansprechpartner wechseln (neuer Hausmeister), alte stehen noch drin | 4 | 5 | 20 | B |
| 21 | Wer hat was am Kunden geändert? Kein Verlauf | 3 | 5 | 15 | C |
| 22 | DSGVO: Kunden ohne Auftrag seit Jahren bleiben ewig gespeichert | 2 | 5 | 10 | C |
| 23 | Kundenimport aus Altsystem erzeugt Dubletten | 2 | 8 | 16 | B |
| 24 | Monteur sieht Daten, die ihn nichts angehen (Umsatz) | 3 | 4 | 12 | C |
| 25 | Firmenname und Ansprechpartner-Name werden vermischt | 4 | 4 | 16 | B |

## Muss rein
- Dubletten-Erkennung (Telefon normalisiert, E-Mail, Name ohne Anrede/Rechtsform, Name + Adresse) und **Zusammenführen durch Umhängen der Verweise** – nie kopieren (1, 16, 19).
- Warnung schon beim Anlegen („Gibt es diesen Kunden schon?“) (16).
- Bearbeiten im Dialog mit Validierung (E-Mail, PLZ) (6, 18).
- Ansprechpartner mit Funktion, Telefon, Anrufen-Knopf (3, 15, 20).
- Tabs Aufträge · Orte · Anlagen · Ansprechpartner · Verlauf (5, 14, 21).
- Suche über Name, Ort, Telefon, Nummer, Ansprechpartner; Filter „mit offenem Auftrag“ (4, 17).
- Löschen nur mit Bestätigung, Warnung bei offenen Aufträgen/Rechnungen, Papierkorb + Rückgängig (7, 13).

## Macher erledigt automatisch
- Kundennummer vergeben – auch für Kunden aus Anfragen (8, 9).
- Hinweis „vermutlich doppelt angelegt“ in Braucht dich (1).
- Hinweis „Telefonnummer fehlt“, sobald ein Auftrag beauftragt/in Arbeit ist (2).
- Beim Zusammenführen: Event `kunde.zusammengefuehrt`, damit andere Module ihre Verweise umhängen.

## Bewusst weggelassen
- DSGVO-Löschfristen (22), Import (23), feingranulare Feldrechte (24): später zentral (Einstellungen/Rollen).
- Eigene Kundengruppen/Tags, Geburtstage, CRM-Pipeline: kein Alltags-Pain im kleinen Handwerksbetrieb.
