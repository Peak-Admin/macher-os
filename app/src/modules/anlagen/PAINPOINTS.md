# Anlagen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Störungsanruf: Welche Anlage, welches Modell, welches Baujahr? Keiner weiß es | 8 | 8 | 64 | B, M |
| 2 | Monteur fährt ohne passendes Ersatzteil, weil Typ/Seriennummer fehlt | 6 | 9 | 54 | M |
| 3 | Wartungen werden vergessen, Kunde springt ab oder Anlage fällt aus | 6 | 9 | 54 | C, B |
| 4 | Was wurde zuletzt an der Anlage gemacht? Historie fehlt | 7 | 7 | 49 | M |
| 5 | Nächste Wartung von Hand ausrechnen und eintragen | 7 | 5 | 35 | B |
| 6 | Gewährleistung: Ist das noch auf uns oder zahlt der Kunde? | 5 | 8 | 40 | C, B |
| 7 | Gewährleistung läuft ab, Chance für Check/Wartungsvertrag verpasst | 4 | 6 | 24 | C |
| 8 | Seriennummer steht auf einem Foto irgendwo im Handy | 6 | 6 | 36 | M |
| 9 | Nach erledigter Wartung wird das Datum nicht nachgetragen | 7 | 6 | 42 | B, M |
| 10 | Anlage hängt am Kunden statt am Ort – bei Umzug/Verkauf falsch | 3 | 6 | 18 | B |
| 11 | Am Auftrag ist nicht verknüpft, um welche Anlage es geht | 7 | 6 | 42 | M |
| 12 | Doppelter Wartungsauftrag für dieselbe Anlage | 3 | 6 | 18 | B |
| 13 | Anlagentypen werden jedes Mal anders geschrieben („Therme“, „Gastherme“) | 5 | 4 | 20 | B |
| 14 | Hersteller-Wartungsintervalle unterscheiden sich | 4 | 5 | 20 | M |
| 15 | Prüfprotokolle zur Anlage nicht auffindbar | 4 | 6 | 24 | M (→ doku) |
| 16 | Monteur kann unterwegs keine neue Anlage erfassen | 5 | 5 | 25 | M |
| 17 | Wartungsliste: Was ist diesen Monat fällig? | 6 | 6 | 36 | B |
| 18 | Anlage ausgebaut, steht aber noch in der Liste | 3 | 4 | 12 | B |
| 19 | Baujahr unplausibel (Tippfehler 2106) | 3 | 3 | 9 | B |
| 20 | Wartungsvertrag und Anlage nicht verbunden | 4 | 6 | 24 | C (→ service) |
| 21 | Betriebsanleitungen/Herstellerinfos fehlen | 4 | 5 | 20 | M (→ wissen) |
| 22 | Fehlercodes-Historie fehlt | 3 | 5 | 15 | M |
| 23 | Ersatzteilliste je Anlage | 3 | 5 | 15 | M (→ material) |
| 24 | Anlage ohne Ort, Monteur findet sie nicht | 3 | 6 | 18 | M |
| 25 | Kunde fragt „wann war die letzte Wartung?“ – Suche dauert | 5 | 4 | 20 | B |

## Muss rein
- Stammdaten: Art (mit Vorschlägen aus dem Gewerk), Hersteller, Modell, Seriennummer, Baujahr, Einbau, Gewährleistung, Notiz (1, 2, 8, 13, 19).
- Wartung: Intervall, letzte, nächste – **nächste automatisch berechnet** (Monatsende korrekt), Status als Text (3, 5, 14, 17).
- Gewährleistungsstatus (läuft / endet bald / abgelaufen) (6).
- **Historie** = alle Aufträge mit `anlageIds` (4, 25).
- „Wartungsauftrag anlegen“ – mit Schutz vor Doppelten (12).
- Tabs am Kunden, am Ort und am Auftrag; am Auftrag Anlagen am Ort mit einem Tipp verknüpfen oder neu erfassen (11, 16, 24).
- Liste mit Filter „Wartung fällig“, „Gewährleistung endet“; Suche auch über Seriennummer (17, 25).

## Macher erledigt automatisch
- **Wartung fortschreiben:** Wartungsauftrag erledigt → letzte Wartung = Abschlussdatum, nächste = + Intervall (9).
- Hinweis „Gewährleistung endet“ (30 Tage vorher) mit Vorschlag Check/Wartungsvertrag (7).
- Hinweis „Wartung überfällig“ mit Aktion `anlage.wartungsauftrag` – **nur, wenn das Modul „Wartung & Service“ fehlt**, damit es keine doppelten Hinweise gibt (3).

## Bewusst weggelassen
- Prüfprotokolle (15) → doku; Wartungsverträge (20) → service; Anleitungen (21) → wissen; Ersatzteile (23) → material.
- Fehlercode-Historie (22): steht im Auftrag/Bericht der Historie.
- Ausbau-Status (18): Löschen in den Papierkorb reicht vorerst.
