# Bericht R1 – Paket „erstwert“ (First Value)

Umsetzung von `docs/produkt/prd-setup-bis-paid.md`, Abschnitt 2. Ziel: In 10 Minuten nach dem Setup geht ein echtes
Dokument an einen echten Kunden, und der Handwerker erlebt „Der Kunde hat dein Angebot geöffnet“.

## Was gebaut ist

| Muss | Umsetzung | Dateien |
|---|---|---|
| 1. „Was willst du als Erstes erledigen?“ | Modul `start`, Route `/start` (schlicht in der Shell). Drei Karten: Angebot schreiben · Rechnung schreiben · Woche planen. Sortiert nach Arbeitsweise: Kundendienst → Rechnung zuerst; nur Wartung → Plan zuerst; sonst Angebot zuerst. Messpunkt `erstwert.gewaehlt` { wahl, position }. Monteure sehen nur „Woche planen“ und einen Hinweis. | `start/index.tsx`, `start/StartSeite.tsx`, `start/daten.ts` |
| 2. Angebot in 3 Minuten | `/start/angebot`, **ein Bildschirm** mit drei Schritten: **Kunde** (vorhandenen suchen oder neu: Name + Telefon/E-Mail reicht; am Handy „Aus Handy-Kontakten“, wenn der Browser die Contact Picker API hat) · **Positionen** (ein Feld: tippen zeigt Katalogtreffer; Enter/„Übernehmen“ oder **Sprechen** baut aus dem ganzen Satz Positionen mit Katalogpreis) · **Senden**. Vorschau als echter Briefbogen (vorhandener `Briefbogen`, Druckleiste ausgeblendet). Titel, Gültigkeit, Rabatt, Einleitung und „Ausführlich weiter (Kalkulation, Aufmaß, Optionen)“ erst nach Aufklappen. | `angebote/AngebotSchnell.tsx`, `angebote/erstwert.ts`, `start/teile.tsx` |
| Sprache | Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`, de-DE), nur sichtbar, wenn vorhanden. Text wird **lokal** gegen den Leistungskatalog geparst (`start/sprache.ts`): Zerlegen an Komma/„und“/„plus“, Zahlwörter („zwei“, „fünfundzwanzig“, „zweieinhalb“, „anderthalb“, Ziffern mit Komma), Einheiten (Meter, qm, Stunden, Stück …), Wortstamm-Abgleich (Plural, Komposita: „Anfahrt“ → „Anfahrtspauschale“). Leistung vor Material; was nicht im Katalog steht, wird freie Position ohne Preis (sichtbar „Preis fehlt“). Optional besser über `src/app/api/ki/positionen/route.ts` (Claude, strukturierte Ausgabe); ohne Schlüssel 501 → lokaler Parser. Preise kommen immer aus dem Katalog, nie von der KI. | `start/sprache.ts`, `angebote/erstwert.ts` (`positionenAusText`, `kiErkennen`), `src/app/api/ki/positionen/route.ts` |
| Senden | Nur über `cloud().senden` (`sendenMitRueckfall`): E-Mail oder SMS (aus dem Kontakt erkannt), Text in Sie-Form, **Link zum Kundenbereich** (`aktiverZugang` / `zugangErzeugen` / `portalLink` aus Modul `kundenbereich`). Schlägt der Cloud-Versand fehl, öffnet Macher das Mail-/SMS-Programm und sagt das. Ohne Backend ist der Knopf ehrlich beschriftet („Im Mailprogramm öffnen“ / „In der SMS-App öffnen“), die Erfolgsseite heißt dann „Fast geschafft – drück dort auf Senden“. Danach: Status „versendet“ (bestehende Logik `versenden`, Nachfassen läuft), Vermerk am Angebot, Event `dokument.versendet` { bezug, kanal, status }, Messpunkt `erstwert.dokument_versendet` { art, kanal, status, rueckfall, sekunden }. Der Versanddialog im ausführlichen Angebot nutzt jetzt denselben Weg (statt `mailto:` direkt). | `start/daten.ts`, `angebote/erstwert.ts`, `angebote/AngebotDetail.tsx` |
| 3. „Kunde hat geöffnet“ | Angebote-Modul hört auf `portal.geoeffnet` { kundeId, bezug }. Beim ersten Öffnen je Angebot: Vermerk am Angebot und Auftrag, Benachrichtigung „Familie Hoffmann hat dein Angebot geöffnet“ (wichtig), Messpunkt `erstwert.dokument_geoeffnet` { minutenNachVersand }. Danach nichts doppelt. Ohne Angebotsbezug gilt das Öffnen allen versendeten, noch nicht geöffneten Angeboten des Kunden. Anzeige: Status „Vom Kunden geöffnet vor …“ im Angebot und live auf der Erfolgsseite. | `angebote/index.tsx` (`init`), `angebote/erstwert.ts` (`portalGeoeffnet`) |
| 4. Rechnung in 1 Minute | `/start/rechnung`, ein Bildschirm: Wofür (aus abrechenbarem Auftrag oder frei) · Positionen (dieselbe Suche/Sprache, Leistungsdatum) · Senden. Nutzt die vorhandene Rechnungslogik: `rechnungsVorschau`, `rechnungErstellen`/`freieRechnung`, `pflichtangabenPruefen` (fehlende Betriebsdaten mit „Betriebsdaten ergänzen“ direkt dort), `festschreiben` (Nummer, GoBD), XRechnung als Anhang (Data-URL) und zum Herunterladen. Gleicher Sendeweg. | `rechnungen/RechnungSchnell.tsx`, `rechnungen/RechnungSchnellVersand.tsx` |
| 5. „Dein Start“ auf Heute | Inhaber und Büro (Recht `geld`): drei Haken – Erstes Angebot raus · Team eingeladen · Erster Termin geplant. Jeder offene Haken hat einen konkreten Schritt (Angebot schreiben / Team einladen / Termin planen). Nur echte Daten zählen, Beispieldaten nie. „Team eingeladen“ zählt bei zweitem aktivem Mitarbeiter oder nach Event `team.eingeladen`. Verschwindet, sobald alles erledigt ist. Kein Tutorial. Leerer „Dein Tag“ zeigt zusätzlich „Angebot schreiben“, damit Heute nie leer wirkt. | `start/StartKarte.tsx`, `shell/Heute.tsx` |
| 6. Tests | Sprach-Parser (Zahlwörter, Einheiten, Zerlegen, Katalog-Abgleich, PRD-Beispiel), Start-Haken, Kartenreihenfolge, Versand-Rückfall (Cloud ok / Fehler / Ausnahme / lokal), Event + Messpunkt, Kontakt-Erkennung; Angebot anlegen + lokal senden mit Kundenbereich-Link; „Kunde hat geöffnet“ inkl. Doppelschutz; Rechnung festschreiben + senden, Abbruch bei fehlenden Pflichtangaben. | `start/start.test.ts`, `angebote/erstwert.test.ts`, `rechnungen/RechnungSchnell.test.ts` |

## Prüfung

- Stand nach Zusammenführung mit `main` (Macher OS als `src/os/` im Next.js-Projekt unter `/os`):
  `npm run typecheck` grün · `npm test` **617/617** grün · `npm run build` grün · ESLint ohne Befund in den Dateien dieses Pakets.
- Playwright (Chromium) gegen `next start`, App unter `/os`, bei **1440 px und 390 px**: frisches Onboarding „Ohne Daten starten“ →
  Heute zeigt „Dein Start · noch 3 von 3“ → `/os/start` → „Angebot schreiben“ → Kunde neu → „Zwei Steckdosen setzen, zehn Meter
  Leitung, Anfahrt“ → 3 Positionen mit Katalogpreisen (383,18 € brutto) → Vorschau → „Im Mailprogramm öffnen“ → „Fast geschafft“.
  Automatisierte Klickzeit ~1,3 s (Ziel < 3 Minuten), kein waagrechter Überlauf. `/api/ki/positionen` antwortet ohne Schlüssel 501,
  der Browser nimmt den lokalen Parser. Rechnung frei: Mängel der Betriebsdaten mit Behebungsknopf.

## Nachträglich erledigt (zweite Runde)

- **Zusammenführung mit `main`:** Dateien liegen unter `src/os/…`; die KI-Funktion ist jetzt ein Next.js Route Handler
  (`src/app/api/ki/positionen/route.ts`); Links außerhalb des Routers (`window.open`, Kundenbereich) über `appPfad()`.
- **`portal.geoeffnet` wird gesendet:** Der Kundenbereich (`kundenbereich/Portal.tsx`) meldet beim Öffnen eines gültigen Links
  `{ kundeId, bezug }`. Der Link aus dem Angebotsversand trägt `?angebot=<id>` (`portalLink(token, basis, angebotId)`), dann gilt das
  Öffnen genau diesem Angebot; ein fremdes Angebot im Link wird ignoriert. Test: `kundenbereich/geoeffnet.test.tsx`.
- **Kernfeld `Angebot.geoeffnetAm`** statt Einstellung (`core/objects.ts`); Anzeige im Angebot und auf der Erfolgsseite.
- **`Segmente`** (Kern-UI): Leiste nur so breit wie nötig, Segmente füllen umbrochene Zeilen – keine leere dunkle Fläche mehr auf 390 px.
- **`autoplanung.test.ts`:** Der Test hing an der echten Uhrzeit (ab Nachmittag kein Platz mehr „heute“) – jetzt mit fester Uhrzeit
  wie die Nachbartests. Logik unverändert.
- **Setup:** sendet `team.eingeladen` und leitet nach dem Setup auf `/start` – bereits im Paket Setup umgesetzt (Branch
  `claude/fervent-pascal-joztaz-setup`, noch nicht in `main`).

## Was nur mit Schlüsseln geht

- **Echter Versand** (E-Mail/SMS mit Absender Betrieb, Öffnen-Status): sobald Paket Fundament `setzeCloud()` setzt.
  Ohne Backend öffnet sich das Mail-/SMS-Programm – ehrlich beschriftet.
- **Link zum Kundenbereich für echte Endkunden** und damit **`portal.geoeffnet`**: braucht `cloud().oeffentlichLesen`
  (Paket Aktivierung/Fundament). Ohne Backend öffnet der Link nur im selben Browser; das steht so auf der Erfolgsseite.
- **KI-Erkennung**: `ANTHROPIC_API_KEY` in Vercel. Funktion `src/app/api/ki/positionen/route.ts` (`POST`, Web-`Request`/`Response`,
  `fetch` statt SDK), Modell `claude-opus-5-5`, `effort: low`, strukturierte Ausgabe per JSON-Schema, serverseitiger
  Fallback bei Ablehnung (`fallbacks: "default"`, Beta `server-side-fallback-2026-07-01`). Ohne Schlüssel 501,
  ohne Server-Funktion (lokales `vite`) 404 – beides führt zum lokalen Parser. Im Dev-Server erscheint deshalb eine
  404-Zeile in der Konsole.

## Messpunkte

`erstwert.gewaehlt` { wahl, position } · `erstwert.dokument_versendet` { art: angebote|rechnungen, kanal, status, rueckfall, sekunden } ·
`erstwert.dokument_geoeffnet` { art, minutenNachVersand }. Fachliche Events: `dokument.versendet` { bezug, kanal, status } (neu),
Reaktion auf `portal.geoeffnet` und `team.eingeladen`.

## Abweichungen von der Dateitabelle (bitte beim Zusammenführen beachten)

- `os/src/shell/struktur.ts`: **eine Zeile** – `'start'` im Kontext von „Heute“ ergänzt. Ohne diesen Eintrag schlägt
  `struktur.test.ts` („jedes Modul hat genau einen Ort“) fehl. Konfliktträchtig mit Paketen, die ebenfalls neue Module
  anlegen (setup, aktivierung, gewohnheit, bezahlen): beim Merge einfach alle IDs in die Listen übernehmen.
- Tests der Rechnung liegen in `rechnungen/RechnungSchnell.test.ts` (Muster `RechnungSchnell*`).
- Routen `/start/angebot` und `/start/rechnung` registriert das Modul `start`; `rechnungen/index.tsx` blieb unverändert.

## Offene Punkte

- **Nur mit Backend (Paket Fundament):** echter Versand, Öffnen-Status der E-Mail (Resend-Webhook), Anhänge in Storage statt
  Data-URL, Kundenbereich für Endkunden auf anderen Geräten. Ohne Backend gilt: Der Link öffnet nur im selben Browser – wer ihn
  dort selbst testet, löst „Kunde hat geöffnet“ aus. Die Erfolgsseite sagt das ehrlich.
- **KI-Erkennung:** `ANTHROPIC_API_KEY` im Vercel-Projekt `macher-os` eintragen.
- Die Pakete Setup und Gewohnheit liegen noch auf der alten Struktur (`os/…`) und müssen beim Zusammenführen ebenso nach `src/os/` umziehen.
