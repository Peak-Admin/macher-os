# Orte & Baustellen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Monteur steht vor der Tür und weiß nicht, wie er reinkommt (Klingel, Hintereingang, Code) | 8 | 9 | 72 | M |
| 2 | Schlüssel: Wo liegt er, wer hat ihn, wann zurück? | 6 | 9 | 54 | M, B |
| 3 | Monteur ruft im Büro an, um Adresse/Ansprechpartner zu erfragen | 9 | 6 | 54 | M, B |
| 4 | Kein Parkplatz, Strafzettel, Halteverbot nicht beantragt | 7 | 7 | 49 | M |
| 5 | Ansprechpartner vor Ort (Hausmeister) unbekannt oder ohne Telefonnummer | 7 | 7 | 49 | M |
| 6 | Auftrag hat keine Einsatzadresse, nur die Rechnungsadresse des Kunden | 6 | 8 | 48 | M, B |
| 7 | Navigation: Adresse abtippen, Hausnummer falsch | 9 | 5 | 45 | M |
| 8 | Wissen über den Ort steckt im Kopf eines Kollegen („Hund im Garten“) | 6 | 7 | 42 | M |
| 9 | Hausverwaltung hat viele Objekte, Büro verwechselt sie | 5 | 8 | 40 | B |
| 10 | Arbeitszeiten am Ort (Bäckerei nur nach 13 Uhr) werden ignoriert → Ärger | 4 | 8 | 32 | M, C |
| 11 | Was wurde hier schon gemacht? Vorherige Aufträge am Ort unklar | 6 | 6 | 36 | M, B |
| 12 | Welche Anlagen stehen an diesem Ort? | 5 | 6 | 30 | M |
| 13 | Gleicher Ort mehrfach angelegt | 4 | 5 | 20 | B |
| 14 | Baustelle: Baustrom/Wasser/Toilette vorhanden? | 4 | 6 | 24 | M |
| 15 | Zufahrt für Transporter/Material (Feldweg, Höhe) | 4 | 6 | 24 | M |
| 16 | Infos sind lang und unstrukturiert, auf dem Handy nicht lesbar | 7 | 5 | 35 | M |
| 17 | Termin-Info und Ort-Info liegen an verschiedenen Stellen | 7 | 5 | 35 | M |
| 18 | Kunde hat genau eine Adresse, trotzdem muss man den Ort bei jedem Auftrag wählen | 8 | 3 | 24 | B |
| 19 | Adresse geändert, alte Koordinaten bleiben | 2 | 4 | 8 | M |
| 20 | Sicherheitshinweise (Asbest, Absturz) fehlen | 2 | 9 | 18 | M, C |
| 21 | Zugangsinfo erst kurz vor dem Einsatz bemerkt | 5 | 7 | 35 | B |
| 22 | Ort ohne Kundenzuordnung | 2 | 5 | 10 | B |
| 23 | Mehrere Baustellen am selben Tag, Reihenfolge unklar | 5 | 5 | 25 | M (→ Paket planpruefung) |
| 24 | Fotos vom Zugang/Zählerplatz nicht am Ort auffindbar | 4 | 5 | 20 | M (→ Paket doku) |
| 25 | Orte löschen, obwohl noch Aufträge laufen | 2 | 6 | 12 | B |

## Muss rein
- Karte **„Vor Ort wichtig“** ganz oben: Navigation starten, Ansprechpartner vor Ort anrufen, Zugang, Schlüssel, Parken, Gut zu wissen (1–5, 7, 8, 10, 14–16).
- Dieselbe Karte als **Panel „Einsatzort“ am Auftrag und am Termin** (3, 6, 17).
- Ort anlegen/bearbeiten mit klaren Feldern; vorbefüllt mit Kundenadresse (13, 18).
- Tabs am Ort: Aufträge (Historie), Anlagen, Verlauf (11, 12).
- Tab „Orte“ am Kunden (9).
- Liste mit Filter „Mit laufendem Auftrag“ und „Ohne Zugangsinfos“.
- Löschen mit Bestätigung und Warnung bei laufenden Aufträgen (25).

## Macher erledigt automatisch
- **Einsatzort zuordnen:** Neuer Auftrag ohne Ort → einziger Ort des Kunden, sonst Ort aus Kundenadresse anlegen. Termine übernehmen den Ort ihres Auftrags (6, 18).
- Hinweis **„Zugang klären“** 3 Tage vor einem Einsatz an Baustelle/Gewerbe ohne Infos (21).
- Hinweis **„Einsatzort fehlt“** bei beauftragten Aufträgen ohne Ort (6).
- Koordinaten werden bei Adressänderung verworfen (19).

## Bewusst weggelassen
- Kartenansicht, Geokodierung, Routenplanung (23) → Paket planpruefung (Fahrt & Route).
- Fotos am Ort (24) → Paket doku.
- Eigene Schlüsselverwaltung mit Ausgabe/Rückgabe: als Freitext „Schlüssel“ abgedeckt; Ausgabe-Logik später, wenn Bedarf.
- Sicherheitshinweise (20) laufen über „Gut zu wissen“; formale Gefährdungsbeurteilung → Paket team (Unterweisungen).
