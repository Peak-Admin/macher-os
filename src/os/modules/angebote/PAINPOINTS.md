# Angebote – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Angebot schreiben dauert Abende/Wochenenden | 9 | 9 | 81 | C |
| 2 | Angebot wird nicht nachgefasst – Auftrag verloren | 8 | 9 | 72 | C, B |
| 3 | Kunde wartet zu lange auf Angebot | 7 | 9 | 63 | C |
| 4 | Preise/Leistungen jedes Mal neu getippt | 8 | 7 | 56 | C, B |
| 5 | Unklar, welche Angebote offen sind und wie viel Geld da liegt | 7 | 7 | 49 | C |
| 6 | Annahme wird nicht in Auftrag übertragen | 6 | 8 | 48 | B |
| 7 | Verschiedene Versionen durcheinander | 6 | 7 | 42 | B |
| 8 | Versand umständlich (Word, PDF, Mail) | 7 | 6 | 42 | B |
| 9 | Material fehlt im Angebot | 6 | 7 | 42 | C |
| 10 | Entwurf liegt tagelang unfertig | 6 | 7 | 42 | C |
| 11 | Aufmaß/Kalkulation nicht übernehmbar | 6 | 7 | 42 | B |
| 12 | Rechenfehler bei Rabatt/USt. | 5 | 8 | 40 | B |
| 13 | PDF/Druck sieht unprofessionell aus | 6 | 6 | 36 | C |
| 14 | Angebot abgelaufen, Kunde sagt trotzdem zu – alte Preise | 5 | 7 | 35 | C, B |
| 15 | Kundendaten im Angebot falsch/alt (kopiert) | 5 | 6 | 30 | B |
| 16 | Keine Erinnerung an bald ablaufende Angebote | 5 | 6 | 30 | B |
| 17 | Alternativ-/Bedarfspositionen fälschlich in Summe | 4 | 7 | 28 | B |
| 18 | Ablehnungsgründe unbekannt | 5 | 5 | 25 | C |
| 19 | Angebotsnummer doppelt/Lücken | 4 | 6 | 24 | B |
| 20 | Kein Überblick über Annahmequote | 4 | 5 | 20 | C |
| 21 | Positionen umsortieren mühsam | 5 | 4 | 20 | B |
| 22 | Hinweistexte (Zahlungsbedingungen) fehlen | 4 | 5 | 20 | B |
| 23 | Angebot am Handy nicht änderbar | 4 | 5 | 20 | C |
| 24 | Monteur sieht Preise, die er nicht sehen soll | 3 | 6 | 18 | C |
| 25 | Kleinunternehmer: falsche USt. | 2 | 7 | 14 | C |

## Muss rein
- Positionen aus Leistungskatalog (Suche), Material, freie Position, Hinweistext; Bedarfs-/Alternativposition (nicht in Summe); Rabatt; Summen mit USt./Kleinunternehmer
- Detail `/auftraege/angebote/:id` mit Kopf, Positionen (mobil als Karten), Summe, Aktionen, Versionen, Verlauf
- Druck-/PDF-Ansicht ohne App-Rahmen (`/druck/angebot/:id`, `window.print()`)
- Versand: mailto mit vorbereitetem Text + Status versendet, Event `angebot.versendet`
- Annahme → Auftrag Phase `beauftragt`, Event `angebot.angenommen`; Ablehnung mit Grund → Auftrag ggf. „nicht zustande gekommen“
- Versionen mit gleicher Nummer, nur neueste zählt; Aktion `angebot.erstellen` (nimmt offenen Entwurf, sonst neu)
- Tabs „Angebote“ am Auftrag und am Kunden; Liste mit Kennzahlen (offen, nachfassen, Annahmequote ab 3 Entscheidungen)
- Hinweise: nachfassen (70), läuft in ≤ 3 Tagen ab (60), Entwurf seit ≥ 3 Tagen (52)

## Macher erledigt automatisch
- Nachfassen nach X Tagen (Einstellung `angebote.nachfassenTage`, Standard 7): Aufgabe „Angebot nachfassen“ (`angebote.nachfassen`)
- Abgelaufene Angebote auf „Abgelaufen“ setzen (`angebote.ablauf`)
- Ältere offene Versionen bei Annahme schließen
- Phase des Auftrags nur vorwärts setzen

## Bewusst weggelassen (Pareto)
- Echte PDF-Erzeugung und Mail-Versand mit Anhang (Schnittstelle)
- Digitale Annahme durch Kunden (Paket stamm/kundenbereich)
- Textbausteine/Vorlagen (Paket unternehmen)
- GAEB-Import
