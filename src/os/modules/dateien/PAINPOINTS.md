# Dateien – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: M = Monteur, B = Büro, C = Chef, K = Kunde.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Monteur hat den aktuellen Plan nicht auf der Baustelle | 8 | 9 | 72 | M |
| 2 | Pläne liegen im E-Mail-Postfach des Chefs | 8 | 7 | 56 | C, B |
| 3 | Veraltete Planstände im Umlauf | 5 | 9 | 45 | M |
| 4 | Datei zu groß, Upload bricht ohne Erklärung ab | 6 | 6 | 36 | B |
| 5 | PDF lässt sich auf dem Handy nicht öffnen | 6 | 6 | 36 | M |
| 6 | Unklar, was der Kunde sehen darf | 5 | 6 | 30 | B |
| 7 | Dateien heißen „Scan_0042.pdf“ | 7 | 4 | 28 | B |
| 8 | Unterlagen in vier Ordnern auf drei Rechnern | 7 | 6 | 42 | B |
| 9 | Datenblätter/Anleitungen für Anlagen nicht greifbar | 5 | 6 | 30 | M |
| 10 | Dateien ohne Auftragsbezug | 6 | 5 | 30 | B |
| 11 | Löschen aus Versehen | 3 | 7 | 21 | B |
| 12 | Zeichnung muss vor Ort angesehen werden, Zoom nötig | 5 | 5 | 25 | M |
| 13 | Suche nach Datei dauert | 6 | 5 | 30 | B |
| 14 | Kunde schickt Pläne per WhatsApp | 5 | 5 | 25 | B |
| 15 | Wer hat was wann hochgeladen? | 4 | 4 | 16 | C |
| 16 | CAD-Formate (DWG) nicht anzeigbar | 3 | 5 | 15 | M |
| 17 | Versionierung von Plänen | 4 | 6 | 24 | B |
| 18 | Ordnerstrukturen pflegen | 5 | 4 | 20 | B |
| 19 | Speicherplatz kostet | 3 | 4 | 12 | C |
| 20 | Dateien an Subunternehmer weitergeben | 3 | 5 | 15 | C |
| 21 | Offline-Zugriff im Keller | 5 | 5 | 25 | M |
| 22 | Fotos von Papierplänen schief/zu groß | 4 | 4 | 16 | M |
| 23 | Dokumente unterschreiben lassen | 3 | 5 | 15 | B |
| 24 | Rechnungen/Belege landen fälschlich bei Plänen | 3 | 3 | 9 | B |
| 25 | Freigabe-Links ablaufen lassen | 2 | 4 | 8 | C |

## Muss rein
- Upload am Auftrag (Tab „Dateien“) und zentral; Art (Plan/PDF/Datei) automatisch aus dem Namen (1, 2, 8, 10).
- Größenlimit 1,5 MB pro Datei mit verständlicher Meldung inkl. Grund und Lösung; Bilder automatisch verkleinert (4, 22).
- Vorschau für Bilder, PDFs (über Blob-URL), Audio; Download für alles andere (5, 12, 16).
- Kennzeichen „für Kunden sichtbar“ (6).
- Detailansicht `/auftraege/dateien/:id` für **alle** Dokumente (Fotos, Notizen, Sprachnotizen, Pläne): Titel umbenennen, Auftrag zuordnen, Zeitstrahl, Löschen mit Rückgängig (7, 11, 15).
- Suche und Filter (Pläne, PDFs, für Kunden) (13).

## Macher erledigt automatisch
- Titel aus dem Dateinamen, Art aus Name/Typ, Bilder verkleinern, Speicherplatz vor dem Speichern prüfen.

## Bewusst weggelassen
- Versionierung, Ordner, Freigabelinks, CAD-Viewer, Offline-Cache, Weitergabe an Subunternehmer (3, 17, 18, 20, 21, 25) – mit echtem Datei-Speicher im Backend sinnvoll (siehe Kernwünsche).
