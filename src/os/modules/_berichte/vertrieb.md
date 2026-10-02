# Abschlussbericht Paket `vertrieb`

Branch: `claude/fervent-pascal-joztaz-vertrieb`. Alle Module im Bereich `auftraege`.

## Gebaute Module und Ansichten

| Modul | Ansichten | Einhängepunkte |
|---|---|---|
| `anfragen` (Gewicht 90) | `/auftraege/anfragen` (offen / weitergegeben, `?anfrage=<id>` öffnet „Nächster Schritt“), `/auftraege/anfragen/neu` (Erfassen mit Dublettenvorschlag, danach Qualifizieren) | `hubWidget` „Neue Anfragen“, Panel in der Auftragsakte (nur Phase `anfrage`), „Neu“-Menü, Suche, Aktion `anfrage.qualifizieren` |
| `telefon` (80) | `/auftraege/telefon` (Anruf notieren, letzte Anrufe, offene Rückrufe) | Schnell-Aktion „Anruf notieren“ (`id: 'anruf'`, nimmt `auftragId`), „Neu“-Menü, `kurzinfo`, Suche, Aktion `rueckruf.erledigt` |
| `angebote` (85) | `/auftraege/angebote` (Kennzahlen, Filter, `?neu=1`), `/auftraege/angebote/:id`, Vollbild `/druck/angebot/:id` | `detail` für `angebote`, Tabs „Angebote“ an Auftrag und Kunde, Aktionen `angebot.erstellen`, `angebot.nachgefasst`, Suche |
| `besichtigungen` (65) | `/auftraege/besichtigungen`, `/auftraege/besichtigungen/neu?auftrag=<id>`, `/auftraege/besichtigungen/:id` (vor Ort: Fotos, Notizen, Ergebnis) | Aktion `besichtigung.planen`, „Neu“-Menü, Suche |
| `aufmass` (60) | `/auftraege/aufmass`, `/auftraege/aufmass/:id` | Tab „Aufmaß“ am Auftrag, Aktion `aufmass.anlegen`, Suche |
| `kalkulation` (55, nur Chef/Büro) | `/auftraege/kalkulation`, `/auftraege/kalkulation/:id` | Tab „Kalkulation“ am Auftrag (Projekte in Angebotsphase), Aktion `kalkulation.anlegen`, Suche |

Ablauf durchgängig: Anruf → Anfrage (Kunde erkannt/angelegt) → nächster Schritt (Rückruf / Besichtigung / Angebot / Termin via `plan.einplanen` / Absage) → Besichtigung → Aufmaß/Kalkulation → Angebot → versendet → angenommen ⇒ Auftrag `beauftragt`.

## Wichtigste Pain Points (Top 5 je Modul)

- **Anfragen:** Anfrage geht unter (90) · Kunde wartet, geht zur Konkurrenz (80) · niemand zuständig (64) · Dubletten (56) · dringende Störung wie normal behandelt (60)
- **Telefon:** Zettel-Notiz geht verloren (81) · Rückruf vergessen (72) · Anrufer nicht erkannt (56) · Erfassen dauert länger als das Gespräch (56) · Notiz erreicht Zuständigen nicht (56)
- **Besichtigungen:** Maße/Fotos fehlen fürs Angebot (72) · Notizen im Auto vergessen (64) · Angebot verzögert, Ergebnis nicht weitergegeben (63) · Fotos auf privatem Handy (56) · Besichtigung nie eingeplant (54)
- **Aufmaß:** Abtippen vom Zettel (72) · Rechenfehler Wandflächen/Abzüge (63) · Mengen falsch ins Angebot (63) · am Handy kaum bedienbar (56) · nochmal hinfahren (45)
- **Kalkulation:** Preise aus dem Bauch (80) · Stundensatz deckt Kosten nicht (60) · Material-EK vergessen (56) · Abtippen ins Angebot (49) · Deckungsbeitrag unbekannt (48)
- **Angebote:** Angebot schreiben kostet Abende (81) · kein Nachfassen (72) · Kunde wartet zu lange (63) · Preise neu tippen (56) · unklar, was offen ist (49)

Details: `PAINPOINTS.md` in jedem Modulordner.

## Automationen (alle standardmäßig an, protokollieren in „Erledigt“)

- `anfragen.zuweisen` – neue Anfrage bekommt Büro-Verantwortliche(n); dringende Anfrage ⇒ Benachrichtigung
- `telefon.zuordnen` – Anruf wird an den einzigen offenen Auftrag des Anrufers gehängt
- `angebote.nachfassen` – nach X Tagen ohne Antwort (Einstellung `angebote.nachfassenTage`, Standard 7) Aufgabe „Angebot nachfassen“ (quelle `nachfassen`, Bezug Angebot); stündlich + beim Start
- `angebote.ablauf` – versendete Angebote nach `gueltigBis` ⇒ Status `abgelaufen`

Hinweise („Braucht dich“): dringende Anfrage ohne Schritt (81), unbearbeitete Anfrage > 24 h (72), Rückruf heute dringend (70) / überfällig (64), Angebot nachfassen (70), Angebot läuft ab (60), Besichtigung ohne Termin (60), Besichtigung ohne Ergebnis (58), Aufmaß nicht im Angebot (56), Angebotsentwurf ≥ 3 Tage (52).

Events: `anfrage.eingegangen`, `angebot.versendet`, `angebot.angenommen`.

## Eigene Sammlungen

- `aufmasse` (`src/os/modules/aufmass/daten.ts`) – Räume → Zeilen (Art, L/B/H, Anzahl, Abzüge, `leistungId`), Verweis `auftragId`, `angebotId`
- `kalkulationen` (`src/os/modules/kalkulation/daten.ts`) – Zeilen (Menge, Minuten, Material-EK, Fremd), Lohnkosten, Zuschläge, Verweis `auftragId`, `angebotId`

Alles andere über `db.*`: Anfragen = `auftraege` (Phase `anfrage`), Anrufe = `nachrichten` (`kanal: 'telefon'`), Rückrufe = `aufgaben` (`quelle: 'rueckruf'`), Besichtigungen = `termine` (`art: 'besichtigung'`), Fotos/Notizen = `dokumente` (Bezug Termin + `auftragId`).

Beispieldaten (`seed`, `beispiel: true`): Aufmaß zum Auftrag in Phase Besichtigung, Kalkulation zum Auftrag in Phase Angebot, zwei Beispiel-Anrufe.

## Kernwünsche

1. `Position.optionalArt?: 'alternativ' | 'bedarf'` – heute gibt es nur `optional`, beides wird als „Bedarfs-/Alternativposition“ geführt.
2. `Angebot.nachgefasstAm?` und `Angebot.ablehnGrund?` – aktuell als Einstellung `angebote.nachgefasst.<id>` bzw. nur im Zeitstrahl/Auftrag (`verlorenGrund`) gespeichert.
3. `Angebot.status` um `ersetzt` ergänzen – ältere Versionen werden bei Annahme derzeit auf `abgelehnt` gesetzt.
4. Druck-CSS im Kern (`@media print` blendet Shell aus) bzw. ein zentraler PDF-Dienst; Angebote nutzen eine eigene Vollbild-Druckroute mit kleinem `angebote.css`.
5. `Nachricht.telefon?` (Nummer eines unbekannten Anrufers) – steht derzeit im Text („Rückrufnummer: …“).
6. Ein `Zahleingabe`-Baustein in `@ui` (deutsches Komma, Cent) – liegt jetzt in `angebote/felder.tsx` und wird von Aufmaß/Kalkulation importiert.
7. `ListenZeile` mit Aktion rechts *und* klickbarer Zeile (heute verschachtelt nicht sauber) – Rückrufe nutzen deshalb nicht klickbare Zeilen mit Buttons.

## Offene Punkte

- Kundentexte (Angebotsdruck, Mailtext) sind in Sie-Form – an Endkunden üblich; UI durchgehend Du.
- Schritt „Termin“ ruft `plan.einplanen` (Paket plan); ohne dieses Modul geht es zur Auftragsakte (`pfadZu`), ohne Akte bleibt man in der Liste.
- Links zu Auftrag/Termin über `pfadZu` – erscheinen erst, wenn akte/plan gemergt sind.
- Fotos werden als verkleinertes JPEG (max. 1280 px) im lokalen Speicher abgelegt; echte Dateiablage kommt mit dem Backend.
- Nachfassen-Aufgaben übernehmen `verantwortlichId` des Auftrags; ohne Verantwortliche(n) bleiben sie ohne Zuständigen.

## Testergebnis

- `npx tsc -b` ✔
- `npx vitest run` ✔ 7 Dateien, 34 Tests (davon 29 aus diesem Paket: Dubletten, Anfrage/Qualifizieren, Anruf → Anfrage/Rückruf, Aufmaß-Rechnung inkl. Abzüge und Zusammenfassung, Kalkulation inkl. Vorbelegung, Angebotsregeln/-ablauf/Versionen, Besichtigungs-Konflikte/-Ergebnis)
- `npx vite build` ✔
- Browser (Playwright/Chromium, 1440 px und 390 px): alle 14 Ansichten ohne Konsolenfehler und ohne horizontales Scrollen; Klickpfad Anruf → Anfrage → Angebot (Leistung hinzufügen, Rabatt) → versendet → angenommen (Auftrag `beauftragt`), Aufmaß → Angebot, Anfrage → Besichtigung planen → Ergebnis „Angebot“ geprüft.
