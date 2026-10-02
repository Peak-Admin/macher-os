# Zusatzleistungen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: M = Monteur, B = Büro, C = Chef, K = Kunde.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Zusatzarbeit vor Ort gemacht, aber nie aufgeschrieben → nicht abgerechnet | 9 | 10 | 90 | C |
| 2 | Kunde bestreitet bei der Rechnung, die Zusatzarbeit beauftragt zu haben | 6 | 10 | 60 | C, B |
| 3 | Monteur kennt den Preis nicht und traut sich nicht zu sagen, was es kostet | 7 | 7 | 49 | M |
| 4 | Büro erfährt erst Wochen später von Nachträgen | 7 | 7 | 49 | B |
| 5 | Nachträge auf Zetteln, Rechnung wird ohne sie geschrieben | 7 | 8 | 56 | B |
| 6 | Erfassen dauert zu lange – Kunde steht daneben | 8 | 6 | 48 | M |
| 7 | Unklar, welche Nachträge schon abgerechnet sind | 6 | 7 | 42 | B |
| 8 | Mündliche Zusage, später Streit | 6 | 8 | 48 | C |
| 9 | Kein Foto als Nachweis, warum es nötig war | 5 | 6 | 30 | C |
| 10 | Stundenlohn vs. Festpreis unklar | 5 | 5 | 25 | M, B |
| 11 | Nachtrag doppelt in Rechnung | 3 | 7 | 21 | B |
| 12 | Nach Storno der Rechnung sind Nachträge „weg“ | 2 | 7 | 14 | B |
| 13 | Kunde will vorher wissen, was es brutto kostet | 6 | 5 | 30 | K |
| 14 | VOB-Nachtragsangebot formal korrekt erstellen | 3 | 7 | 21 | C |
| 15 | Leistungskatalog vor Ort nicht greifbar | 6 | 5 | 30 | M |
| 16 | Kunde lehnt ab – wird trotzdem gemacht | 3 | 6 | 18 | M |
| 17 | Zustimmung kam per E-Mail/WhatsApp, nirgends festgehalten | 5 | 6 | 30 | B |
| 18 | Monteur darf keine Preise sehen | 4 | 4 | 16 | C |
| 19 | Summe offener Nachträge pro Auftrag unbekannt | 5 | 5 | 25 | C |
| 20 | Nachträge verändern die Nachkalkulation | 4 | 5 | 20 | C |
| 21 | Material zum Nachtrag fehlt in der Rechnung | 4 | 5 | 20 | B |
| 22 | Mehrere kleine Nachträge nerven den Kunden | 3 | 4 | 12 | K |
| 23 | Nachtrag bei Hausverwaltung braucht Freigabe der Verwaltung, nicht des Mieters | 4 | 5 | 20 | B |
| 24 | Nachträge nicht nach Status filterbar | 4 | 4 | 16 | B |
| 25 | Rabatt auf Nachträge | 2 | 3 | 6 | C |

## Muss rein
- Erfassen in 30 Sekunden: Auftrag vorausgewählt, Preis aus Leistungskatalog, nach Stunden (Stundensatz des Betriebs) oder Festpreis, Summe sofort sichtbar (1, 3, 6, 10, 15).
- Freigabe per Unterschrift mit klarem Text inkl. netto/brutto; alternativ „Zustimmung anders erhalten“ dokumentieren; Ablehnung festhalten (2, 8, 13, 16, 17).
- Optional Foto als Nachweis (9).
- Status: wartet auf Freigabe → freigegeben/abrechenbar → abgerechnet (7, 24).
- Tab am Auftrag und Schnell-Aktion.

## Macher erledigt automatisch
- Freigegebene Nachträge wandern beim Anlegen einer Rechnung (oder in einen vorhandenen Entwurf) als Positionen hinein; keine Doppelten; bei Storno wieder abrechenbar (Automation `zusatzleistungen.abrechnen`) (4, 5, 11, 12).
- Hinweise: „Nachtrag freigeben lassen“ und „Freigegebene Nachträge abrechnen“ mit passender Aktion (1, 4, 19).

## Bewusst weggelassen
- Formales VOB-Nachtragsangebot (läuft über Angebote), Rabatte, Material je Nachtrag, Sammelfreigabe (14, 21, 22, 25).
- Preise werden in Listen nur mit Recht „Preise & Geld“ gezeigt; in der Freigabe sieht der Kunde den Preis immer (18).
