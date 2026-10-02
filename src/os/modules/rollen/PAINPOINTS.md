# Pain Points – Rollen & Rechte

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Monteur sieht Preise und Marge | 5 | 8 | 40 | C |
| 2 | Wer darf an Kunden senden? | 4 | 7 | 28 | C |
| 3 | Personaldaten (Lohn) für alle sichtbar | 3 | 9 | 27 | C |
| 4 | Unklar, was ein Recht überhaupt bedeutet | 5 | 5 | 25 | C |
| 5 | Büro darf keine Einstellungen, Chef muss alles selbst | 5 | 5 | 25 | C,B |
| 6 | Zu viele Einzelrechte, zu komplex | 5 | 5 | 25 | C |
| 7 | Azubi kann versehentlich löschen | 3 | 8 | 24 | C |
| 8 | Keine Vorschau, was ein Monteur sieht | 4 | 6 | 24 | C |
| 9 | Planung anderer durch Monteure verändert | 4 | 6 | 24 | B |
| 10 | Büro sieht Löhne | 3 | 7 | 21 | C |
| 11 | Rechte müssen pro Person gepflegt werden | 4 | 5 | 20 | C |
| 12 | Neue Mitarbeiter bekommen falsche Rolle | 3 | 6 | 18 | C |
| 13 | KI/Automation handelt mit mehr Rechten als der Mensch | 2 | 9 | 18 | C |
| 14 | Monteur sieht Menüs, die er nicht braucht | 6 | 3 | 18 | M |
| 15 | Azubi darf zu viel | 3 | 6 | 18 | C |
| 16 | Keine Erklärung, warum etwas gesperrt ist | 4 | 4 | 16 | M |
| 17 | Kein Test als andere Rolle | 3 | 5 | 15 | C |
| 18 | Monteur kann eigene Zeiten nicht sehen | 3 | 5 | 15 | M |
| 19 | Unverständliche Fachbegriffe | 5 | 3 | 15 | C |
| 20 | Rechte-Chaos nach Anpassungen, Zurück auf Standard fehlt | 2 | 6 | 12 | C |
| 21 | Recht entzogen, aber „Ansehen“ fehlt → nichts geht | 2 | 6 | 12 | C |
| 22 | Rollen nicht an Betriebsgröße anpassbar | 3 | 4 | 12 | C |
| 23 | Änderungen nicht sofort wirksam | 3 | 4 | 12 | C |
| 24 | Matrix auf dem Handy nicht bedienbar | 3 | 4 | 12 | C |
| 25 | Chef sperrt sich selbst aus | 1 | 10 | 10 | C |

## Muss rein
- Matrix Rolle × Recht aus `core/session.ts`, gespeichert in `rollen.rechte`
- Verständliche Beschreibung je Recht
- Chef-Rechte nicht entziehbar, „Ansehen“ als Grundrecht
- Vorschau „Was sieht eine Rolle?“ (kann/kann nicht, Module in der Navigation) und „Als … ansehen“
- Auf Standard zurücksetzen

## Macher erledigt automatisch
- Regeln greifen beim Umschalten automatisch (Ansehen dazu/weg)
- Kaputte Einstellung wird bereinigt (Chef = alle Rechte)

## Bewusst weggelassen (Pareto)
- Rechte je einzelner Person
- Eigene Rollen anlegen
- Feingranulare Rechte je Modul/Feld
- Protokoll von Rechteänderungen (über Einstellungen nicht protokolliert)
