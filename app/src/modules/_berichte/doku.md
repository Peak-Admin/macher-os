# Abschlussbericht Paket `doku`

Branch: `claude/fervent-pascal-joztaz-doku` · Bereich: Aufträge

## Gebaute Module und Ansichten

| Modul | Ansichten (Routen) | Einhängepunkte |
|---|---|---|
| `fotos` Fotos & Dokumentation | `/auftraege/fotos` (Galerie aller Fotos/Notizen, Filter Vorher/Nachher/Mangel, „ohne Auftrag“) | Tab „Fotos“ am Auftrag (Galerie, Vollbild mit Blättern, Erfassen-Leiste) · Schnell-Aktionen **Foto**, **Sprachnotiz**, **Notiz** (mit `auftragId`) · Suche · Hinweise · Kurzinfo |
| `berichte` Berichte & Protokolle | `/auftraege/berichte`, `/neu`, `/:id` · Druck/PDF: `/druck/bericht/:id` (Vollbild) | Tab „Berichte“ am Auftrag · Aktion `bericht.erstellen` · „Neu“-Menü · Suche · Hinweise |
| `zusatzleistungen` Zusatzleistungen | `/auftraege/zusatzleistungen` (Filter: ohne Freigabe / abrechenbar / abgerechnet, `?auftrag=`), `/:id` (Freigabe per Unterschrift) | Tab „Zusatzleistungen“ am Auftrag · Schnell-Aktion **Zusatzleistung** · Aktion `zusatzleistungen.uebernehmen` · Suche · Hinweise |
| `abnahme` Abnahme & Unterschrift | `/auftraege/abnahme`, `/neu`, `/:id` (geführt in 5 Schritten) · Druck/PDF: `/druck/abnahme/:id` | Tab „Abnahme“ am Auftrag · Aktion `abnahme.starten` · Event `abnahme.unterschrieben` · „Neu“-Menü · Suche · Hinweise |
| `nachrichten` Nachrichten | `/auftraege/nachrichten` (Posteingang), `/auftrag/:id`, `/kunde/:id`, `/intern`, `/:id` (→ Verlauf) | `detail` für `nachrichten` · Tab „Nachrichten“ am Auftrag **und** am Kunden · Hub-Widget „Neue Nachrichten“ (nur wenn etwas ungelesen ist) · Suche · Hinweise |
| `dateien` Dateien | `/auftraege/dateien` (Upload, Suche, Filter), `/auftraege/dateien/:id` (Detail für **alle** `dokumente`) | `detail` für `dokumente` · Tab „Dateien“ am Auftrag · Suche |

Gemeinsame Bausteine im Paket:
- `abnahme/Unterschrift.tsx` + `abnahme/unterschrift.ts`: Unterschrift per Canvas (Pointer Events, `touch-action: none`, HiDPI), Name in Druckbuchstaben, Ort, Zeitpunkt; Bild als `dokument` (Art `unterschrift`). Genutzt von Abnahme, Berichten und Zusatzleistungen.
- `abnahme/Druck.tsx` + `druck.css`: Druck-/PDF-Rahmen (Kopf mit Betrieb, Auftrag/Kunde/Ort-Tabelle, `@media print`).
- `fotos/bild.ts` (Canvas-Verkleinerung auf 1600 px, JPEG 0,7), `fotos/speicher.ts` (echte Platzprüfung im localStorage), `fotos/FotoKnopf.tsx` (Kamera-Knopf für Mängel/Nachträge).

## Wichtigste Pain Points (Top 5 je Modul)

- **Fotos:** Fotos bleiben in der Privatgalerie (80) · kein Vorher-Foto → Streit (70) · Fotos per WhatsApp einzeln zuordnen (63) · zu viele Schritte mit Handschuhen (63) · Zuordnung zum Auftrag vergessen (56)
- **Berichte:** abends Berichte schreiben (81) · Regiebericht ohne Unterschrift (60) · Stunden/Material doppelt erfassen (56) · Berichte kommen nicht ins Büro (56) · Material des Tages vergessen (49)
- **Zusatzleistungen:** Zusatzarbeit nie aufgeschrieben (90) · Kunde bestreitet Beauftragung (60) · Nachträge fehlen in der Rechnung (56) · Monteur kennt Preis nicht (49) · Büro erfährt zu spät davon (49)
- **Abnahme:** keine förmliche Abnahme (60) · Büro erfährt nicht von der Abnahme (56) · Schlussrechnung wegen Mängeln nicht bezahlt (54) · Protokoll verloren (48) · Mängel nicht abgearbeitet (48)
- **Nachrichten:** Kommunikation über alle Kanäle verstreut (80) · Kunde wartet tagelang (72) · Infos Monteur → Büro gehen verloren (63) · keiner weiß, was geschrieben wurde (56) · Kein Überblick, wer wartet (49)
- **Dateien:** aktueller Plan fehlt auf der Baustelle (72) · Pläne im Postfach des Chefs (56) · veraltete Planstände (45) · Unterlagen verstreut (42) · Upload bricht ohne Erklärung ab (36)

Details und Ableitung (Muss rein / automatisch / weggelassen) in `PAINPOINTS.md` je Modul.

## Automationen (alle standardmäßig an, Einträge in „Erledigt“)

| ID | Was passiert |
|---|---|
| `fotos.zuordnen` | Foto/Notiz/Sprachnotiz ohne Auftrag → Auftrag des laufenden Einsatzes des Erstellers |
| `berichte.vorbereiten` | Termin (Einsatz/Wartung) → `erledigt` oder Event `einsatz.beendet` → Bericht vorbereitet mit Zeiten, Material, Fotos, erledigten Aufgaben und Notiz-/Sprachtexten des Tages (einmal je Termin) |
| `zusatzleistungen.abrechnen` | Neue Rechnung (Entwurf, keine Abschlag/Gutschrift) zum Auftrag oder Freigabe bei vorhandenem Entwurf → freigegebene Nachträge als Positionen anhängen (ohne Doppelte), Status „abgerechnet“; Storno/Löschen der Rechnung → wieder abrechenbar |
| `abnahme.abrechnung` | `abnahme.unterschrieben` → Auftrag in Phase „Abrechnung“, Benachrichtigung ans Büro |
| `nachrichten.zuordnen` | Eingehende Kundennachricht ohne Auftrag → einziger offener Auftrag des Kunden |

Hinweise („Braucht dich“): Fotos ohne Auftrag (36), Nachher-Fotos fehlen (42), Einsatz ohne Bericht (52) / Bericht prüfen (48), Nachtrag freigeben lassen (62), Nachträge abrechnen (70, Aktion `rechnung.erstellen` bzw. `zusatzleistungen.uebernehmen`), Abnahme machen/verweigert (64, Aktion `abnahme.starten`), Mängel überfällig (58), Kunde wartet auf Antwort (56, nach 4 h 68).

## Eigene Sammlungen

- `berichte` (Bericht: Art, Datum, Termin, Tätigkeiten, `zeitIds`/`materialIds`/`fotoIds`/`aufgabeIds`, Prüfpunkte, Status, Unterschrift-Verweis)
- `zusatzleistungen` (Nachtrag: Text, Berechnung, Menge/Einheit/Einzelpreis als freigegebener Stand, Status, Freigabe, `rechnungId`)
- `abnahmen` (Abnahme: Datum, Ort, Teilnehmer, `mangelAufgabeIds`, `fotoIds`, Bemerkung, Status, Unterschrift-Verweis)

Kernobjekte genutzt (nur über `db.*`): `dokumente` (Fotos, Sprache, Notizen, Dateien, Unterschriften), `nachrichten`, `aufgaben` (Mängel = Aufgaben), `rechnungen` (Positionen anhängen), `auftraege` (Phase nach Abnahme), Lesen von `zeiten`, `material`, `termine`, `leistungen`, `kunden`, `orte`, `betrieb`.

Beispieldaten (`beispiel: true`): 2 Platzhalter-Fotos + 1 Notiz und 1 Plan an „Sanierung Wohnanlage, Haus 24“, vorbereiteter Tagesbericht für den gestrigen Einsatz, 3 Nachträge (offen / freigegeben / freigegeben bei Auftrag in Abrechnung), 1 unterschriebene Abnahme („Kleinreparatur Treppenhaus“).

## Kernwünsche

1. **Datei-Speicher statt localStorage.** Fotos/Audio/PDFs liegen als Data-URL im localStorage (wenige MB je Browser). Die Datenschicht verschluckt einen vollen Speicher still (`speichern()` → `catch {}`) – Daten wären nach dem Neuladen weg. Ich prüfe vorher mit einer echten Schreibprobe (`fotos/speicher.ts`) und melde es ehrlich, aber der Kern sollte (a) `speichern()`-Fehler melden und (b) Binärdaten in IndexedDB/Storage auslagern (`Dokument.url` → Storage-URL).
2. **`Bezug`-Typ für Modulsammlungen.** `Bezug.typ` erlaubt nur `ObjektTyp`; Aufgaben aus Mängeln können deshalb nicht auf die Abnahme zeigen (Verweis läuft andersherum über `mangelAufgabeIds`). Ein generischer Bezug auf Modulsammlungen wäre hilfreich.
3. **`gelesen` je Person.** `Nachricht.gelesen` ist ein einzelnes Flag; „ungelesen“ ist daher betriebsweit, nicht je Mitarbeiter.
4. **Nummernkreise für Modulsammlungen.** `naechsteNummer` kennt nur Auftrag/Angebot/Rechnung; Berichte nutzen eine eigene Funktion (`BR-JJJJ-0001`).
5. **Echter Versand.** Kundennachrichten öffnen nur `mailto:`/`sms:`/WhatsApp-Links (so beschriftet). Eingang/Versand bräuchte eine Schnittstelle (Paket unternehmen/`schnittstellen`).
6. **Druckrahmen zentral.** `abnahme/Druck.tsx` könnte als `@ui`-Baustein auch für Angebote/Rechnungen dienen.

## Offene Punkte

- Die Auftragsakte (`/auftrag/:id`) kommt aus Paket `akte`; meine Tabs wurden lokal mit einer nicht committeten Test-Akte geprüft. Vorhandene `sichtbar`-Regeln: Abnahme ab „In Arbeit“, Berichte ab „Beauftragt“, Zusatzleistungen von „Beauftragt“ bis „Abrechnung“ (oder wenn Einträge existieren); Fotos, Nachrichten, Dateien immer.
- Aktion `rechnung.erstellen` (Paket geld) wird im Hinweis „Nachträge abrechnen“ genutzt; die Nachträge landen über die Automation in der neuen Rechnung, sofern geld sie als Entwurf mit `auftragId` anlegt.
- Aktion `einsatz.beendet` (Paket team) sollte `daten: { terminId }` oder `objekt: termin` mitsenden – beides wird ausgewertet.
- Kundenbereich (Paket stamm) kann `dokumente.fuerKunde` und die Unterschriften-Dokumente anzeigen.
- Sprachnotiz-Transkript nur mit Web Speech API (Chrome/Edge/Safari); sonst ehrlich „nur Audio“, Text kann nachgetragen werden.
- Kein Bearbeiten einzelner Nachtragswerte nach dem Erfassen (löschen und neu erfassen, solange nicht freigegeben).

## Testergebnis

```
cd app && npm ci && npx tsc -b && npx vitest run && npx vite build
```
- `tsc -b`: ohne Fehler
- `vitest run`: 8 Dateien, 40 Tests grün (35 Modul-/Integrationstests des Pakets + 5 Kern)
- `vite build`: erfolgreich
- Browser (Playwright/Chromium, 1440 px und 390 px): alle 18 Ansichten inkl. Druckansichten und Tabs am Auftrag ohne Konsolenfehler und ohne horizontalen Scroll. Interaktiv geprüft (390 px, Touch): Foto aufnehmen → verkleinert als JPEG, Markierung „Nachher“, Vollbild; Nachtrag per Touch-Unterschrift freigeben (Fehlermeldung ohne Unterschrift); Abnahme mit Mangel → Aufgabe am Auftrag, Unterschrift, Phase „Abrechnung“, Erledigt-Eintrag; Upload einer 2-MB-PDF → verständliche Ablehnung, kleine PDF → gespeichert mit Vorschau; interne Nachricht mit Schnellantwort; Bericht ohne Unterschrift abschließen.
