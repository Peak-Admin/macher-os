# Zahlungen – Pain Points

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Kontoauszug Zeile für Zeile mit Rechnungen abgleichen | Büro | 9 | 9 | 81 |
| 2 | Nicht wissen, wer noch zahlen muss (Liquidität) | Chef | 8 | 10 | 80 |
| 3 | Bezahlte Rechnung wird trotzdem gemahnt – peinlich | Büro, Chef | 5 | 10 | 50 |
| 4 | Kunde schreibt keine Rechnungsnummer in den Verwendungszweck | Büro | 8 | 7 | 56 |
| 5 | Teilzahlungen gehen unter | Büro | 6 | 8 | 48 |
| 6 | Skonto unberechtigt abgezogen, Rest bleibt ewig offen | Büro | 6 | 6 | 36 |
| 7 | Bank-CSV jeder Bank anders aufgebaut | Büro | 6 | 6 | 36 |
| 8 | Status der Rechnung von Hand nachpflegen | Büro | 9 | 5 | 45 |
| 9 | Doppelt gebuchte Zahlungen beim erneuten Import | Büro | 4 | 7 | 28 |
| 10 | Barzahlung auf der Baustelle wird nicht erfasst | Monteur, Büro | 4 | 7 | 28 |
| 11 | Überblick über Eingänge der letzten Wochen fehlt | Chef | 6 | 5 | 30 |
| 12 | Gleicher Betrag bei mehreren Kunden → falsch zugeordnet | Büro | 3 | 8 | 24 |
| 13 | Überzahlung nicht erkannt | Büro | 2 | 7 | 14 |
| 14 | Zahlung versehentlich falsch zugeordnet, Korrektur umständlich | Büro | 3 | 6 | 18 |
| 15 | Auftrag bleibt in „Abrechnung“, obwohl bezahlt | Chef | 5 | 4 | 20 |
| 16 | Chef fragt ständig im Büro nach dem Kontostand der Kunden | Chef, Büro | 7 | 4 | 28 |
| 17 | Umlaute in Bank-CSV kaputt (Zeichensatz) | Büro | 5 | 3 | 15 |
| 18 | Ausgänge/Lastschriften im Import stören | Büro | 8 | 2 | 16 |
| 19 | Kein Beleg, wann genau gezahlt wurde (Verzug) | Büro | 4 | 5 | 20 |
| 20 | Abschlagszahlung nicht der Schlussrechnung zuzuordnen | Büro | 4 | 6 | 24 |
| 21 | PayPal/Karte getrennt von Überweisungen | Büro | 3 | 4 | 12 |
| 22 | Offene Posten je Kunde nicht sichtbar beim Anruf | Büro | 6 | 5 | 30 |
| 23 | Zahlungseingang nicht im Auftragsverlauf | Chef | 5 | 3 | 15 |
| 24 | Rückerstattung nach Storno vergessen | Büro | 2 | 7 | 14 |
| 25 | Bankanbindung (FinTS/PSD2) fehlt | Büro | 6 | 6 | 36 |

## Muss rein
Offene Posten mit Überfällig-Filter, Zahlung erfassen (Teilzahlung, Skonto in einem Schritt), Kontoauszug-Import mit Vorschau.

## Macher erledigt automatisch
Rechnungsstatus teilbezahlt/bezahlt + Event `zahlung.eingegangen` · Zuordnung über Rechnungsnummer bzw. Betrag + Kunde ·
unsichere Treffer als Freigabe-Hinweis · Doppelte Buchungen erkennen · vorbereitete Mahnungen bei Zahlung verwerfen.

## Zahlungsabgleich (Delta 9)
Kontoumsätze (CSV, CAMT.053, Bankverbindung über Webhook) werden als `bankumsaetze` genau einmal gespeichert und in
`abgleich.ts` bewertet: Rechnungsnummer (auch verstümmelt, „RE 2026 42“), Betrag (gleich / Skonto bis 3 % / Teil /
Überzahlung), Kunde (IBAN aus früheren Zuordnungen, Kundennummer, Name). Eindeutig → Zahlung gebucht, im
Erledigt-Protokoll mit „Rückgängig“; sonst Vorschlag unter „Zahlungen zuordnen“. Sammelzahlungen für mehrere
Rechnungen werden erkannt. Der Chef sieht nur zwei Hinweise: „N Rechnungen sind überfällig“ und
„N Zahlungen konnten nicht eindeutig zugeordnet werden“ (Aktion „Zuordnen“). Ist eine Rechnung bezahlt, feuert
`rechnung.bezahlt`; offene Mahn-Freigaben zu ihr werden geschlossen.

## Bewusst weggelassen
Eigene Bankanbindung (FinTS/PSD2 läuft über einen Integrationspartner, siehe docs/os/BACKEND.md), Rückerstattungs-Workflow, Fremdwährung, Kassenbuch.
