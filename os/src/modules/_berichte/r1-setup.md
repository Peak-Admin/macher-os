# Bericht R1 – Paket `setup`

Umsetzung von `docs/produkt/prd-setup-bis-paid.md`, Abschnitt 1 (Setup → Ziel 100).

## Was gebaut ist

**Setup in 5 Schritten, eine Frage je Bildschirm** (`/willkommen`, `os/src/modules/onboarding/`):

1. **Gewerk** – ein Tipp genügt, es geht sofort weiter. Von der Website vorausgewählt (`?gewerk=…&betrieb=…`).
   Arbeitsweisen, Leistungen, Teamgröße werden nicht mehr gefragt (Voreinstellungen aus dem Gewerk bzw. aus dem Team-Schritt).
2. **Betrieb / Briefkopf ohne Tippen** – „Foto von einer alten Rechnung“ oder „Website-Adresse“ → Server-Funktion
   `os/api/ki/briefkopf.ts` erkennt Name, Inhaber, Anschrift, Telefon, E-Mail, Steuernummer/USt-IdNr., IBAN/BIC,
   Zahlungsziel, Stundensatz und den Logo-Ausschnitt (wird im Browser aus dem Foto geschnitten).
   Ergebnis ist als **„Entwurf – bitte prüfen“** markiert; die Hauptaktion heißt dann „Briefkopf übernehmen“.
   Rückfall ohne Schlüssel: ehrlicher Hinweis + vier Felder (Name des Betriebs, dein Name, Straße, PLZ/Ort);
   Telefon, Steuer, Bank, Zahlungsziel, Logo-Upload aufklappbar. IBAN wird per Prüfsumme geprüft.
   **Bundesland aus der PLZ** → Einstellung `plan.bundesland` (Feiertage), sichtbar als „Feiertage: Hessen – aus deiner PLZ“.
   Logo → `vorlagen.briefkopf.logo`, BIC → Fußzeilen-Zusatz (das Betriebsobjekt hat kein BIC-Feld).
3. **Kunden & Preise** (überspringbar)
   - Excel (**.xlsx**, eigener kleiner Leser ohne Abhängigkeit, `xlsx.ts`) und CSV (UTF-8 oder Windows-1252,
     `;` `,` Tab, Zeilenumbrüche im Feld). Spaltenvorlagen für **sevDesk**, **Lexware** (lexoffice/Warenwirtschaft:
     „Firmenname“, „… (Rechnungsadresse)“, „Telefon (geschäftlich)“), Kontakte-Exporte und freie Excel-Listen
     (Vorname/Nachname, Hausnummer getrennt, Mobil statt Telefon, Ansprechpartner).
   - **Handy-Kontakte** über die Contact Picker API (Knopf erscheint nur, wenn der Browser sie kann – Android/Chrome).
   - **Dubletten** werden automatisch zusammengeführt – mit derselben Logik wie im Kundenstamm
     (`dublettenGruende` aus `@modules/kunden/daten`): gleiche Telefonnummer (+49/0049 egal), E-Mail, Name.
     Fehlende Angaben werden ergänzt, eine zweite Telefonnummer bleibt als Ansprechpartner erhalten.
   - **Preise:** Preisliste per Foto/PDF → `os/api/ki/preisliste.ts` → Leistungen mit Preis/Einheit als Entwurf
     mit Häkchen (bestätigen/abwählen). Sonst Gewerk-Vorlage mit Regler **„Preise ± %“** (−20 … +30 %),
     drei Beispielpreise live; gerundet auf 50 ct (ab 20 €) bzw. 10 ct.
4. **Team per Handynummer** (überspringbar) – Name + Nummer + Rolle-Vorschlag aus der Teamgröße
   (Monteur; ab dem 4. Kopf einmal Büro). Mitarbeiter-IDs werden vorab vergeben, damit der Link schon stimmt.
   Mit Konto: `cloud().einladen` (SMS mit Link). Ohne Konto: Mitarbeiter werden angelegt, „Link teilen“
   (Web-Share bzw. Kopieren), ehrlich beschriftet: „Deine Daten sehen sie erst, wenn dein Konto verbunden ist“.
   Die Linkseite `/willkommen?einladung=…` erklärt das ebenso ehrlich.
5. **Konto sichern** – `cloudAktiv()`: E-Mail-Link oder SMS-Code (`cloud().anmelden` / `codeBestaetigen`), überspringbar.
   Sonst: „Deine Daten bleiben in diesem Browser“ + Hinweis auf Sicherung. Danach „Fertig – los geht’s“.

**Ende = erste Aufgabe:** Navigation nach `/start` (Paket erstwert). Solange es kein Modul `start` gibt,
fällt es auf `/heute` zurück (`zielNachSetup()`), damit nie eine leere Seite kommt.

**Spielwiese** (`os/src/core/seed.ts`): Beispieldaten nur noch als getrennter Modus („Spielwiese öffnen“ auf
Schritt 1 und auf „schon eingerichtet“). Ein echter Betrieb wird vorher vollständig zur Seite gelegt
(eigene IndexedDB `macher-os-spielwiese`, Rückfall localStorage; ohne lesbare Sicherung startet die Spielwiese nicht).
Fester Hinweis „Spielwiese · Alles hier sind Beispieldaten“ mit „Zu meinen echten Daten“ bzw. „Eigenen Betrieb
einrichten“ (globale Komponente des Moduls). Zurück: echter Stand wird 1:1 wiederhergestellt, **0 Beispielobjekte**.
Echte Setups legen keine Beispieldaten mehr an; Startwerte, die Module beim Einrichten mit `beispiel: true` anlegen
(heute: Buchungszeiten der Terminbuchung), werden im echten Betrieb als normale Voreinstellungen übernommen.

## Nur mit Schlüsseln

| Funktion | Schlüssel | Ohne Schlüssel |
|---|---|---|
| Briefkopf aus Foto/Website | `ANTHROPIC_API_KEY` (Server) | 501 → vier Felder von Hand |
| Preisliste aus Foto/PDF | `ANTHROPIC_API_KEY` | 501 → Gewerk-Vorlage mit Regler |
| SMS-Einladung | Paket fundament (`cloud().einladen`) | Mitarbeiter angelegt + Link zum Teilen |
| Konto sichern | Paket fundament (`cloud().anmelden`) | Hinweis „bleibt in diesem Browser“ |

Server-Funktionen: Vercel/Node, Web-Standard `export async function POST(req: Request)`, nur `fetch`.
Modell `claude-opus-5-5` mit strukturierter Ausgabe (`output_config.format` JSON-Schema), `effort: low`,
`fallbacks: "default"` (Beta `server-side-fallback-2026-07-01`), Ablehnung → 422 mit verständlicher Meldung.
Bilder werden im Browser auf 2000 px verkleinert, PDFs bis 4 MB. Website: Startseite + `/impressum` (Timeout 8 s,
nur öffentliche Hostnamen, keine IPs/localhost). Der Browser behandelt 501, 404 und Nicht-JSON als „nicht verbunden“.

## Messpunkte

- `setup.gestartet` { quelle: website | direkt } – einmal je Tab (Start in sessionStorage, übersteht Neuladen)
- `setup.schritt` { schritt, id, sekunden seit Start }
- `setup.fertig` { sekunden, kunden, leistungen, team, briefkopfVollstaendig, briefkopfQuelle: foto|website|hand,
  preise: eigen|vorlage|vorlage-angepasst, konto: gesichert|lokal|offen }
- `team.eingeladen` { anzahl, kanal: sms | link } + fachliches Event `team.eingeladen` { mitarbeiterIds, kanal }

## Geprüft

- `cd os && npm ci && npx tsc -b && npx vitest run && npx vite build` – tsc und Build grün; Tests 615/616 grün.
  Der eine rote Test (`autoplanung.test.ts › plant am selben Tag nach dem Vortermin`) schlägt auch ohne dieses Paket
  fehl (datumsabhängig, heute Freitag) – nicht Teil von setup.
- Neue Tests: `onboarding/daten.test.ts` (CSV-Vorlagen sevDesk/Lexware/Excel, Windows-1252, .xlsx, Kontakte,
  Dubletten, IBAN, PLZ→Bundesland, KI-Aufruf mit gemocktem fetch inkl. 501/404/HTML/Netzfehler, Einrichten mit
  eigenen Daten, eigene Preisliste, Einladen lokal/Cloud, Messung), `onboarding/spielwiese.test.ts` (hin und zurück
  ohne Reste, ohne echten Betrieb, Setup aus der Spielwiese, unlesbare Sicherung), `os/api/ki/ki.test.ts`
  (Request an Claude, Website-Lesen, Säubern, Fehlercodes, POST-Handler).
- Playwright (Chromium) komplettes Setup mit eigenen Daten bei **1440 px** (KI-Antworten gemockt: Rechnungsfoto →
  Briefkopf mit Logo, Preisliste als Entwurf) und **390 px** (ohne KI: Rückfall von Hand, CSV mit Dublette, Regler +10 %),
  je mit Team (2) und Konto lokal; danach Spielwiese öffnen und zurück. Ergebnis jeweils: Betrieb, 3 Kunden
  (4 Zeilen, 1 Dublette), Leistungen, 3 Mitarbeiter, Bundesland gesetzt, 0 Beispielobjekte, keine Konsolenfehler.
  Klickdauer im Test ≈ 3 s; realistisch bleibt das Setup deutlich unter 5 Minuten.

## Offene Punkte / Kernwünsche

- **Kernwunsch `objects.ts`:** `Betrieb.bic` und `Betrieb.logo` fehlen – BIC steht deshalb im Fußzeilen-Zusatz,
  das Logo in `vorlagen.briefkopf`.
- **fundament:** Route für Einladungslinks (`/willkommen?einladung=<mitarbeiterId>`) beim Beitreten auswerten;
  `vercel.json` leitet heute alles außer `assets/` auf `index.html` um – sicherstellen, dass `/api/**` die Funktionen erreicht.
  Mit E-Mail-Link-Anmeldung sind Einladungen erst nach Bestätigung des Links verschickbar – solange `konto()` leer ist,
  misst setup ehrlich `kanal: link`.
- **aktivierung (Terminbuchung):** Seed setzt `beispiel: true` auf Buchungszeiten; besser ohne Markierung anlegen.
- **erstwert:** `/start` liest optional `location.state.setup === 'fertig'` für eine kurze Begrüßung.
- Logo von der Website (statt aus dem Foto) wird noch nicht übernommen. Foto einer Kundenliste (PRD 1.3) ist
  nicht gebaut – Excel/CSV/Kontakte decken die häufigen Fälle ab.
- Der Website-Abruf folgt Weiterleitungen; eine DNS-Auflösung auf interne Adressen wird nicht zusätzlich geprüft.
