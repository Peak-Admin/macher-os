# Serviceverträge – Pain Points

Score = Frequenz × Intensität. C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Vertragsabrechnung wird vergessen – Geld bleibt liegen | 7 | 10 | 70 | C, B |
| 2 | Kündigungsfrist verpasst, Preis konnte nicht angepasst werden | 5 | 9 | 45 | C |
| 3 | Vertrag läuft aus, keiner bietet Verlängerung an | 5 | 9 | 45 | C, B |
| 4 | Welche Anlagen/Orte sind im Vertrag? Steht nur im Ordner | 7 | 7 | 49 | B, M |
| 5 | Wartung aus Vertrag wird extra berechnet – Kunde beschwert sich | 4 | 9 | 36 | B |
| 6 | Wartungen aus Verträgen werden nicht eingeplant | 6 | 9 | 54 | B |
| 7 | Was ist enthalten, was kostet extra? Monteur weiß es nicht | 6 | 7 | 42 | M |
| 8 | Abrechnungsrhythmus je Vertrag unterschiedlich, Überblick fehlt | 6 | 6 | 36 | B |
| 9 | Kein Überblick über wiederkehrenden Umsatz | 5 | 6 | 30 | C |
| 10 | Rechnungen für Verträge jedes Mal von Hand schreiben | 7 | 6 | 42 | B |
| 11 | Laufzeit/Verlängerung falsch berechnet (Monatsende, Verlängerung) | 4 | 7 | 28 | B |
| 12 | Gekündigte Verträge werden weiter gewartet | 3 | 7 | 21 | B |
| 13 | Rückstände bei Abrechnung (mehrere Perioden) | 3 | 8 | 24 | B |
| 14 | Vertragsnummer fehlt auf Rechnung | 4 | 4 | 16 | B |
| 15 | Monteur darf Preise nicht sehen | 4 | 5 | 20 | C |
| 16 | Vertrag ohne Anlagenintervall – Wartung wird nie fällig | 4 | 7 | 28 | B |
| 17 | Vertrag beim Kunden nicht sichtbar | 5 | 4 | 20 | B |
| 18 | Kündigung kommt per Mail, wird nicht vermerkt | 3 | 6 | 18 | B |
| 19 | Preisanpassung (Index) | 2 | 6 | 12 | C |
| 20 | Vertragsdokument (PDF) erstellen | 3 | 5 | 15 | B |
| 21 | Mehrere Standorte (Hausverwaltung) in einem Vertrag | 4 | 6 | 24 | B |
| 22 | Verträge ohne Kunde/mit falschem Kunden | 2 | 5 | 10 | B |
| 23 | Leistungszeitraum fehlt auf der Rechnung | 4 | 5 | 20 | B |
| 24 | Wartungstermine fest vereinbart (immer im März) | 4 | 5 | 20 | B |
| 25 | Vertragsstatistik/Kündigungsquote | 2 | 3 | 6 | C |

## Muss rein
Liste mit Filter „Braucht dich“ und Kennzahlen (8, 9), Formular mit Kunde, Orten, Anlagen, Leistungen, Intervall, Preis/Jahr, Abrechnung,
Laufzeit, Kündigungsfrist, Verlängerung (4, 7, 21), Detail mit Konditionen, Wartungsaufträgen, Abrechnungen, Kündigung/Verlängerung (12, 18),
Panels am Kunden und an der Anlage (17). Preise nur mit Recht `geld` (15).

## Macher erledigt automatisch
- Abrechnung zu Periodenbeginn: Abrechnungsauftrag + `rechnung.erstellen` (Fallback: Rechnungsentwurf), Rückstände nachholen (1, 10, 13, 14, 23)
- Hinweise: Kündigungsfrist in 30 Tagen, Auslaufen in 60 Tagen (2, 3)
- Anlagen übernehmen Vertragsintervall und nächstes Datum (16, 6)
- Wartungen aus Vertrag gelten als inklusive und gehen ohne Rechnung auf erledigt (5)
- „Termine als Serie planen“ verknüpft mit Wiederkehrende Termine (24)

## Bewusst weggelassen
Vertragsdokument/PDF und Unterschrift (doku/Vorlagen), Indexklausel, Statistiken.
