# Bericht R1 – Paket `setup`

Umsetzung von `docs/produkt/prd-setup-bis-paid.md`, Abschnitt 1 (Setup → Ziel 100).

## Was gebaut ist

**Setup in 5 Schritten, eine Frage je Bildschirm** (`/os/willkommen`, `src/os/modules/onboarding/`):

1. **Gewerk** – ein Tipp genügt, es geht sofort weiter. Von der Website vorausgewählt (`?gewerk=…&betrieb=…`).
   Arbeitsweisen, Leistungen, Teamgröße werden nicht mehr gefragt (Voreinstellungen aus dem Gewerk bzw. aus dem Team-Schritt).
2. **Betrieb / Briefkopf ohne Tippen** – „Foto von einer alten Rechnung“ oder „Website-Adresse“ → Server-Funktion
   `/api/ki/briefkopf` (`src/lib/ki/briefkopf.ts`) erkennt Name, Inhaber, Anschrift, Telefon, E-Mail, Steuernummer/USt-IdNr., IBAN/BIC,
   Zahlungsziel, Stundensatz und das Logo (beim Foto als Ausschnitt, bei der Website als Bild von der Seite).
   Ergebnis ist als **„Entwurf – bitte prüfen“** markiert; die Hauptaktion heißt dann „Briefkopf übernehmen“.
   Rückfall ohne Schlüssel: ehrlicher Hinweis + vier Felder (Name des Betriebs, dein Name, Straße, PLZ/Ort);
   Telefon, Steuer, Bank, Zahlungsziel, Logo-Upload aufklappbar. IBAN wird per Prüfsumme geprüft.
   **Bundesland aus der PLZ** → Einstellung `plan.bundesland` (Feiertage), sichtbar als „Feiertage: Hessen – aus deiner PLZ“.
   BIC → neues Feld `Betrieb.bic` (auch in Betriebsdaten und auf dem Briefbogen). Das Logo bleibt in `vorlagen.briefkopf.logo` – dort liest es der Briefbogen, so gibt es genau eine Quelle.
3. **Kunden & Preise** (überspringbar)
   - Excel (**.xlsx**, eigener kleiner Leser ohne Abhängigkeit, `xlsx.ts`) und CSV (UTF-8 oder Windows-1252,
     `;` `,` Tab, Zeilenumbrüche im Feld). Spaltenvorlagen für **sevDesk**, **Lexware** (lexoffice/Warenwirtschaft:
     „Firmenname“, „… (Rechnungsadresse)“, „Telefon (geschäftlich)“), Kontakte-Exporte und freie Excel-Listen
     (Vorname/Nachname, Hausnummer getrennt, Mobil statt Telefon, Ansprechpartner).
   - **Foto oder PDF einer Kundenliste** → `/api/ki/kundenliste` (`src/lib/ki/kundenliste.ts`), Ergebnis „bitte kurz prüfen“.
   - **Handy-Kontakte** über die Contact Picker API (Knopf erscheint nur, wenn der Browser sie kann – Android/Chrome).
   - **Dubletten** werden automatisch zusammengeführt – mit derselben Logik wie im Kundenstamm
     (`dublettenGruende` aus `@modules/kunden/daten`): gleiche Telefonnummer (+49/0049 egal), E-Mail, Name.
     Fehlende Angaben werden ergänzt, eine zweite Telefonnummer bleibt als Ansprechpartner erhalten.
   - **Preise:** Preisliste per Foto/PDF → `/api/ki/preisliste` (`src/lib/ki/preisliste.ts`) → Leistungen mit Preis/Einheit als Entwurf
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

**Spielwiese** (`src/os/core/seed.ts`): Beispieldaten nur noch als getrennter Modus („Spielwiese öffnen“ auf
Schritt 1 und auf „schon eingerichtet“). Ein echter Betrieb wird vorher vollständig zur Seite gelegt
(eigene IndexedDB `macher-os-spielwiese`, Rückfall localStorage; ohne lesbare Sicherung startet die Spielwiese nicht).
Fester Hinweis „Spielwiese · Alles hier sind Beispieldaten“ mit „Zu meinen echten Daten“ bzw. „Eigenen Betrieb
einrichten“ (globale Komponente des Moduls). Zurück: echter Stand wird 1:1 wiederhergestellt, **0 Beispielobjekte**.
Echte Setups legen keine Beispieldaten an. Die Terminbuchung legt ihre Buchungszeiten jetzt ohne Beispiel-Markierung an;
sollte ein Modul beim Einrichten doch etwas als „Beispiel“ anlegen, entfernt das Setup es wieder.

## Nur mit Schlüsseln

| Funktion | Schlüssel | Ohne Schlüssel |
|---|---|---|
| Briefkopf aus Foto/Website | `ANTHROPIC_API_KEY` (Server) | 501 → vier Felder von Hand |
| Preisliste aus Foto/PDF | `ANTHROPIC_API_KEY` | 501 → Gewerk-Vorlage mit Regler |
| SMS-Einladung | Paket fundament (`cloud().einladen`) | Mitarbeiter angelegt + Link zum Teilen |
| Konto sichern | Paket fundament (`cloud().anmelden`) | Hinweis „bleibt in diesem Browser“ |

Server-Funktionen: Next.js-Route-Handler unter `src/app/api/ki/*/route.ts` (Node), Logik in `src/lib/ki/`, nur `fetch`.
Modell `claude-opus-5-5` mit strukturierter Ausgabe (`output_config.format` JSON-Schema), `effort: low`,
`fallbacks: "default"` (Beta `server-side-fallback-2026-07-01`), Ablehnung → 422 mit verständlicher Meldung.
Bilder werden im Browser auf 2000 px verkleinert, PDFs bis 4 MB. Website: Startseite + `/impressum` + Logo (Timeout 8 s,
nur öffentliche Hostnamen; jede Adresse und jede Weiterleitung wird per DNS geprüft, interne IPs werden nie abgerufen). Der Browser behandelt 501, 404 und Nicht-JSON als „nicht verbunden“.

## Messpunkte

- `setup.gestartet` { quelle: website | direkt } – einmal je Tab (Start in sessionStorage, übersteht Neuladen)
- `setup.schritt` { schritt, id, sekunden seit Start }
- `setup.fertig` { sekunden, kunden, leistungen, team, briefkopfVollstaendig, briefkopfQuelle: foto|website|hand,
  preise: eigen|vorlage|vorlage-angepasst, konto: gesichert|lokal|offen }
- `team.eingeladen` { anzahl, kanal: sms | link } + fachliches Event `team.eingeladen` { mitarbeiterIds, kanal }

## Geprüft

- `npm ci && npm run typecheck && npm test && npm run lint && npm run build` im Wurzelprojekt – alles grün
  (619/619 Tests; Lint ohne Fehler, nur bestehende Warnungen). Der zeitabhängige Autoplanungs-Test ist jetzt fest auf 7 Uhr gestellt.
- Tests: `src/os/modules/onboarding/daten.test.ts`, `spielwiese.test.ts`, `src/lib/ki/ki.test.ts` (Claude-Aufruf,
  Website + Logo, SSRF-Schutz inkl. Weiterleitung auf interne Adresse, Preisliste, Kundenliste, POST-Handler).
- Playwright gegen `next start` unter `/os` bei **1440 px** (KI gemockt: Rechnungsfoto → Briefkopf mit Logo, Preisliste)
  und **390 px** (echte Route ohne Schlüssel → 501 → Eingabe von Hand, CSV mit Dublette, Regler +10 %), je mit Team und
  Spielwiese hin und zurück: Betrieb, 3 Kunden, Leistungen, Team, Bundesland korrekt, 0 Beispielobjekte.

## Offen

- `ANTHROPIC_API_KEY` muss in Vercel gesetzt sein, sonst arbeitet das Setup mit dem Rückfall (von Hand / Vorlage / Excel).
- Einladungslink annehmen (`/os/willkommen?einladung=…`) und SMS/Konto kommen mit dem Paket fundament;
  bis dahin erklärt die Linkseite ehrlich, dass der Betrieb erst sein Konto verbinden muss.
- `/start` kommt mit dem Paket erstwert; bis dahin endet das Setup auf Heute.
