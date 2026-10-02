# Integrationen – Bauplan

> **Verbindlich für jede Verbindung zu anderen Programmen, Formaten und Großhändlern.**
> Macher OS wird Schritt für Schritt angebunden – in **vier Säulen**. Neue Integrationen gehören in genau eine Säule.

Daten der Website: `src/content/integrationen.ts` (Säulen, alle Integrationen, Score, Stand).
Stand in der Software: `src/os/modules/schnittstellen/connectoren.ts` (Connector-Registry, Status je Betrieb).
Website: Seite `/integrationen`, Menüpunkt „Integrationen“ mit Highlight-Box, Abschnitt auf der Startseite (`IntegrationenHighlight`).

## Die vier Säulen

| # | Säule | Was | Fundament |
|---|---|---|---|
| 1 | **Macher Connect** | Gmail, Outlook, Google/Microsoft-Kalender, Google Drive, OneDrive, Lexware Office, sevDesk, Stripe, SumUp, PayPal, HubSpot, Pipedrive, Dropbox, Google Sheets | **Pipedream Connect Gateway** (OAuth beim Anbieter; Macher OS speichert keine fremden Passwörter) |
| 2 | **Macher Format Engine** | DATEV · XRechnung · ZUGFeRD · GAEB (X31, X83, X84, X86, X87, X89) · DATANORM 4/5 · BMEcat · ETIM · UBL/CII · CAMT.053 · MT940 · SEPA pain.001 · CSV/XLSX/XML/JSON · PDF/A · ICS · VCF | Eingebaut, läuft im Browser und auf dem Server; jede Datei wird vor der Übernahme geprüft |
| 3 | **Macher Universal Connectors** | Weiterleitungs-Postfach · IMAP · Webhook ein/aus · REST-API · SFTP/FTP · Karten-Deep-Links | Eingebaut, mit denselben Rechten wie in der Software (Capabilities aus der Constitution) |
| 4 | **Macher Handwerk Connect** | IDS Connect · UGL · Open Masterdata · OCI | Zugangsdaten des Großhändlers, je Großhändler einzeln |

## Priorität (Score 0–100)

Der Score ist unsere Reihenfolge – nicht für Kunden sichtbar. Hoch = zuerst. Die vollständige Liste mit Stand steht in
`src/content/integrationen.ts` (Feld `score`). Die Website sortiert danach.

| Score | Integrationen |
|---|---|
| 100 | DATEV Buchungsstapel, XRechnung, ZUGFeRD, PDF-Rechnung, CSV, XLSX, E-Mail-Postfach, Gmail, Outlook, Google Kalender, Microsoft 365 Kalender, GAEB |
| 94–98 | DATEV Debitoren/Kreditoren, IDS Connect, DATANORM (4/5), GAEB X83/X84, Lexware Office, UGL, Google Drive, OneDrive, Webhooks ein/aus, IMAP, XML, sevDesk, Open Masterdata |
| 90 | Stripe, SumUp, REST-API, JSON, CAMT.053, ICS, PDF/A, GAEB X86, Karten-Deep-Links, Pipedream Connect Gateway |
| 80–85 | HubSpot, Pipedrive, Dropbox, Google Sheets, PayPal, OCI, BMEcat, UBL, CII, vCard, GAEB X87/X89, SFTP/FTP, MT940, SEPA pain.001, ETIM, GAEB X31 |

## Bauweise – Schritt für Schritt

Jeder Schritt ist für sich nutzbar. Ein Schritt ist erst fertig, wenn der Connector in `connectoren.ts` `verfuegbar: true`
meldet **und** `stand` in `src/content/integrationen.ts` angepasst ist. Vorher steht er auf der Website als „Kommt“.

1. **Format Engine schließen (Score 100):** ZUGFeRD (PDF/A-3 mit CII), CSV/XLSX-Export, GAEB X84-Abgabe.
   Gemeinsamer Kern: ein Leser/Schreiber je Format, ein Prüfbericht, ein Import-Protokoll (`schnittstellen`-Sammlung).
2. **Pipedream Connect Gateway:** Server-Route für Connect-Token, Konten je Betrieb (RLS), Trennen jederzeit,
   Audit-Eintrag je Aufruf. Dann Gmail, Outlook, Google-/Microsoft-Kalender (zwei Wege).
3. **Universal Connectors:** Webhook eingehend (signiert), IMAP-Abruf ins Postfach, REST-API mit Schlüssel und Rechten.
4. **Handwerk Connect:** IDS Connect (Warenkorb-Rückgabe), dann UGL, Open Masterdata, OCI.
5. **Buchhaltung & Zahlung über Connect:** Lexware Office, sevDesk, DATEV Stammdaten, Stripe, SumUp, PayPal.
6. **Rest nach Nachfrage:** Ablage (Drive, OneDrive, Dropbox), CRM (HubSpot, Pipedrive), BMEcat, ETIM, MT940, SEPA, SFTP.

Regeln für jede neue Integration:

- Gehört in genau eine Säule; kanonische Objekte bleiben in Macher OS (keine Kopien, Beziehungen statt Duplikate).
- Ereignisse über die Event-Schicht (`invoice.paid` …); ausgehende Webhooks hängen daran.
- KI nutzt Integrationen nur über den Macher AI Gateway (`docs/os/KI-GATEWAY.md`) mit denselben Rechten.
- Geldbewegungen (MONEY) und Versand nach außen (PUBLICATION) brauchen immer eine Bestätigung.
- Status immer als Text (Verbunden / Nicht verbunden / Fehler / Geplant), nie nur Farbe.

## Logos

Echte Logos nur für Marken, Dateien unter `public/logos/integrationen/` (Feld `logo`). Formate und Standards ohne eigenes,
frei nutzbares Logo (XRechnung, GAEB, DATANORM, UGL …) zeigen eine Format-Kachel mit Kürzel (Feld `kuerzel`).
Die Marken gehören ihren Inhabern; die Seite sagt das und behauptet keine Partnerschaft.

| Datei | Herkunft |
|---|---|
| gmail, outlook, google-kalender, microsoft-kalender, google-drive, google-sheets, hubspot, pipedrive, stripe, dropbox, lexware | Peak One (`public/integrations/`; theSVG MIT, svg-logos CC0, Simple Icons CC0) |
| datev, onedrive, paypal, google-maps | theSVG (MIT) |
| sumup, sevdesk, pipedream | Favicon der Anbieter-Website |

Neue Logos: zuerst Peak One prüfen, dann theSVG / Simple Icons, sonst das Presse-Kit des Anbieters.
