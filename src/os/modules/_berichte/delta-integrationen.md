# Delta „integrationen“ – Zahlungsabgleich (Delta 9) und Integration Hub (Delta 8)

## Gebaut / erweitert

### Delta 9 – Zahlungsabgleich (`src/os/modules/zahlungen/`)
- **`daten.ts`**: neue Sammlung `bankumsaetze` (Kontoumsatz, genau einmal je Bankreferenz; Status `neu` / `zugeordnet` /
  `vorschlag` / `offen` / `ignoriert`, Verweise `zahlungIds`, `vorschlagIds`). Zahlungen tragen `umsatzId`.
- **`abgleich.ts`** (Engine, reine Logik): Rechnungsnummer im Verwendungszweck – auch verstümmelt („RE 2026 42“,
  „Rg.Nr. 2026/42“, „R20260042“, „Rechnung 42“ als schwacher Hinweis; Datum/IBAN werden nicht verwechselt) · Betrag
  (gleich / Skonto bis 3 % / Teilzahlung / Überzahlung) · Kunde (IBAN aus früheren Zuordnungen – Macher lernt mit,
  Kundennummer, Name) → Punkte je offener Rechnung → **eindeutig**: Zahlung buchen, `erledigt(...)` mit
  `rueckgaengig: zahlung.zuordnung_aufheben` · sonst **Vorschlag**. Sammelzahlungen (mehrere Nummern, Summe passt)
  werden auf alle Rechnungen verteilt. Skonto wird automatisch ausgebucht (Einstellung `zahlungen.skontoAutomatisch`,
  Standard an, rückgängig machbar). Vorschau ohne Schreiben (`vorschau`), Dubletten über Bankreferenz/Prüfsumme.
- **`camt.ts`**: CAMT.053 (auch .052/.054) lesen – nur Gutschriften, ohne Stornos, Sammelbuchungen aufgeteilt,
  Verwendungszweck-Stücke ohne Leerzeichen zusammengesetzt (getrennte Rechnungsnummer bleibt erkennbar), IBAN des Zahlers.
- **`bank.ts`**: Schnittstelle `BankAnbieter` (Abruf über Integrationspartner) + `bankAbrufen()`.
- CSV-Import liest zusätzlich die IBAN-Spalte.
- **Oberfläche**: Kontoauszug-Import (CSV oder CAMT, Vorschau → „N Zahlungen zuordnen“), neue Ansicht
  **„Zahlungen zuordnen“** (`/betrieb/zahlungen/abgleich`: Vorschlag mit einem Klick zuordnen, andere Rechnung wählen mit
  Ergebnis-Vorschau bezahlt / teilweise / Skonto / zu viel, „Gehört zu keiner Rechnung“, automatische Zuordnungen „Lösen“).
  Offene Posten: Hinweis auf unklare Zahlungen, `?ansicht=ueberfaellig`, Eingänge zeigen „Automatisch zugeordnet“.
- **Hinweise (Chef/Büro, nur zwei Sätze)**: „N Rechnungen sind überfällig“ (Aktion „Ansehen“) und
  „N Zahlungen konnten nicht eindeutig zugeordnet werden“ (Aktion „Zuordnen“). Die alten Einzel-Freigaben je Zahlung
  entfallen (Aktionen `zahlung.bestaetigen`/`verwerfen` bleiben für schon gespeicherte Hinweise).
- **Mahnprozess stoppen**: mahnungen wurde nicht geändert. Es arbeitet nur mit `offenePosten()` (Status
  versendet/teilbezahlt mit offenem Betrag) – eine bezahlte Rechnung wird daher nicht mehr gemahnt, die tägliche Prüfung
  verwirft vorbereitete Schreiben. Zusätzlich schließt die neue Automation `zahlungen.mahnung_stoppen` bei
  `rechnung.bezahlt` sofort offene Freigaben mit `mahnung.*`-Aktion zur Rechnung (kein „Senden“ an einen Kunden, der gezahlt hat).

### Delta 8 – Integration Hub (`src/os/modules/schnittstellen/`)
- **`connectoren.ts`**: Connector-Registry. Kategorien Bank, Buchhaltung (DATEV, Lexware), Großhandel (DATANORM,
  IDS Connect, OCI, UGL, SHK Connect), Ausschreibungen (GAEB), Kalender (Kalenderdatei, Google, Microsoft),
  E-Mail & Telefon, Für Programmierer (Datenexport, Webhooks, API). Je Connector: Verbindungsart (Datei / über
  Integrationspartner per OAuth / Zugangsschlüssel / eingebaut), Fähigkeiten, Status als Text
  (verbunden / nicht verbunden / Fehler / geplant), Recht, Technik für „Weitere Optionen“. Ehrlich: nicht Gebautes
  steht als „Geplant“. Neue Sammlung `anbindungen` (Zustand je Connector: letzte Nutzung, letzter Fehler).
- **Hub-Oberfläche**: ruhige Kartenliste je Kategorie, ein Knopf je Karte, Technisches im Dialog hinter
  „Weitere Optionen“ / „Mehr erfahren“. ICS- und JSON-Export unverändert, nur auf die Unterseite `export` verschoben.
- **`datanorm.ts`**: DATANORM 4 und 5, Satzarten V/A/B (Preis- und Mengeneinheit, Listen-/Nettopreis, Rabatt → EK,
  EAN aus B, „L“ = deaktivieren), Zeichensatz UTF-8/CP850/Windows-1252, DATANORM 3 mit klarer Meldung.
  Übernahme über `artikelImportieren` (Artikel-Modul) – keine Parallel-Logik. Seite `/betrieb/schnittstellen/datanorm`.
- **`gaeb.ts`**: GAEB DA XML 3.x (X83/X84, auch X81/X86): Titel, OZ aus den Ebenen, Mengen, Einheiten, Kurz-/Langtext,
  Einheitspreise (X84), Bedarfs- und Wahlpositionen (→ optional). `alsPositionen()` → `entwurfFuer` +
  `positionenAnhaengen` (Angebote-Modul). Seite `/betrieb/schnittstellen/gaeb?auftrag=<id>`, danach direkt ins Angebot.
- **`xml.ts`**: kleiner XML-Leser ohne DOMParser (für GAEB und CAMT, läuft auch auf dem Server).
- **`webhooks.ts` + Webhooks-Seite**: siehe „Zusammenführen“.

### Server (`src/os/server/`, nur neue Dateien)
- `bank.ts` (Webhook-Inhalt normalisieren: eigenes Format + PSD2-Feldnamen, nur Euro-Eingänge, Objekt-Zeilen für
  `bankumsaetze` ohne Dubletten), `signatur.ts` (HMAC-SHA256, Vergleich in konstanter Zeit), `bank-eingang.ts`
  (fertiger POST-Handler). `docs/os/BACKEND.md`: Abschnitt „Bankverbindung und Webhooks“.

## Wiederverwendet
`zahlungBuchen`/`statusAbgleichen` (Status bleibt eine Quelle), `offenePosten`, `rechnungsSummen`, `erledigt` +
Erledigt-„Rückgängig“, `artikelImportieren`/`findeArtikel`/`einheitAus` (Artikel), `entwurfFuer`/`positionenAnhaengen`
(Angebote), `AuftragAuswahl`, DATEV-Exportprotokoll (nur gelesen), `postfachAdresse`, `cloudAktiv`, Supabase-Helfer.

## Events
- Gesendet: `rechnung.bezahlt` (neu, in `statusAbgleichen`, genau einmal beim Wechsel auf bezahlt),
  `zahlung.eingegangen` (wie bisher), `import.abgeschlossen` (DATANORM, GAEB).
- Abonniert: `rechnung.bezahlt` (Mahnstopp), `zahlungen.created/updated/removed` (wie bisher).

## Automationen
- `zahlungen.abgleich` (neu, Standard an): neue Bankumsätze (auch per Sync vom Server) automatisch abgleichen – nur auf
  Geräten mit Recht „Geld“.
- `zahlungen.mahnung_stoppen` (neu, Standard an).
- `zahlungen.status`: schreibt kein doppeltes Erledigt mehr, wenn die Zahlung aus dem Abgleich kommt.

## Neue Sammlungen
`bankumsaetze` (zahlungen), `anbindungen` (schnittstellen). Keine neue Navigation, keine Änderung an `struktur.ts`
(nur neue Routen innerhalb bestehender Module). Neue Aktionen: `zahlung.zuordnen`, `zahlung.zuordnung_aufheben`,
`zahlungen.ueberfaellige`, `angebot.lv_importieren` ({ auftragId }), `artikel.datanorm_importieren`.

## Zusammenführen (wichtig)
- **Basis**: Die Worktree stand auf dem alten `origin/main` (ohne `src/os`). Der Branch wurde vor Beginn auf
  `claude/tender-euler-87ikzl` (3b35be5) gesetzt – die Änderungen bauen darauf auf.
- **Webhooks**: Die Oberfläche spricht nur mit `WebhookQuelle` (`schnittstellen/webhooks.ts`, Typen dokumentiert).
  Für den Kern-Katalog (`src/os/core/ereignisse.ts`) und die Webhook-Abo-Sammlung des Kerns einen Adapter schreiben und
  `setzeWebhookQuelle(adapter)` aufrufen (z. B. im `init` des Moduls). Bis dahin: `lokaleQuelle` (Abos als Einstellung
  `schnittstellen.webhooks`, Katalog = vereinbarte Ereignisnamen), `zustellungAktiv() = false`. Bewusst keine eigene
  Sammlung für Abos, damit es keinen Namenskonflikt mit der Kern-Sammlung gibt.

## Kernwünsche / offene Punkte (außerhalb meiner Zuständigkeit)
1. Route `src/app/api/eingang/bank/route.ts` anlegen (Einzeiler, siehe `bank-eingang.ts`/BACKEND.md) und
   `BANK_WEBHOOK_SECRET` setzen; RLS: `bankumsaetze` in `sammlung_rechte` wie `zahlungen` auf Chef/Büro beschränken.
2. Serverseitige Webhook-Zustellung (Kern), Signatur mit `webhookSignatur()`; Abo-Geheimnisse dann serverseitig halten
   (die lokale Rückfall-Quelle speichert sie in den Einstellungen).
3. mahnungen könnte direkt auf `rechnung.bezahlt` hören und vorbereitete Schreiben sofort auf „verworfen“ setzen
   (heute: tägliche Prüfung + Freigabe wird sofort geschlossen).
4. Angebot-Detail: Knopf „LV einlesen (GAEB)“ über `aktionVorhanden('angebot.lv_importieren')`; Artikel-Import:
   die Karte „Datanorm – Geplant“ auf `artikel.datanorm_importieren` umstellen.
5. Kern: `umsatzId`, `skonto`, `quelle`, `zahler` an `Zahlung` in `objects.ts` aufnehmen.
6. Mehrere Geräte gleichzeitig: Der automatische Abgleich derselben Bankumsätze auf zwei Geräten zur gleichen Zeit könnte
   doppelt buchen (Sync-Konflikt) – serverseitiger Abgleich oder Sperre wäre robuster.
7. Geplant (ehrlich so angezeigt): Bankverbindung über Integrationspartner, Lexware, IDS Connect, OCI, UGL, SHK Connect,
   Google/Microsoft-Kalender, Telefonanlage, API, GAEB-Export X84.

## Tests
Neu: `zahlungen/abgleich.test.ts` (Nummernerkennung inkl. verstümmelter Formen, Bewertung in 17 Fällen, Abgleich mit
Ereignissen und Rückgängig, Dubletten, Skonto von Hand, Hinweise, Mahnstopp, CAMT.053), `schnittstellen/datanorm.test.ts`,
`schnittstellen/gaeb.test.ts` (inkl. XML-Leser, Übernahme ins Angebot), `schnittstellen/hub.test.ts` (Registry, Webhooks),
`server/bank.test.ts` (Eingang, HMAC nach RFC-Beispiel). Ergebnis: typecheck grün, lint 0 Fehler (nur bestehende Warnungen),
`npm test` 117 Dateien / 854 Tests grün, `npm run build` grün. Im Browser (Spielwiese, 1440 und 390 px) geprüft:
Import mit Beispiel-Kontoauszug (verstümmelte Nummer → automatisch zugeordnet), Zahlungen zuordnen, Hub, DATANORM-
und GAEB-Import bis ins Angebot, Webhooks, Export; keine Konsolenfehler, kein waagerechtes Scrollen.
