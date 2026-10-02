# Pakete: Setup → First Value → Activation → Habit → Paid

Umsetzung von `docs/produkt/prd-setup-bis-paid.md`. Sechs Pakete laufen parallel, jedes auf
`claude/fervent-pascal-joztaz-<paket>`, ausgehend von `claude/fervent-pascal-joztaz`.
Pflichtlektüre: `CLAUDE.md`, `docs/produkt/prd-setup-bis-paid.md` (dein Abschnitt + Abschnitt 0), `os/MODULE.md`,
`os/src/core/cloud.ts`, `os/src/core/messung.ts`, `os/src/core/db.ts`, `docs/design/festlegungen.md`.

## Grundregeln

- **Jedes Objekt existiert genau einmal**, Module sind Sichten (siehe `os/MODULE.md`).
- **Pareto-Oberfläche:** höchstens 3 Blöcke je Screen, genau 1 Hauptaktion; was automatisch geht, bekommt keinen Knopf.
- **Ohne Backend muss alles weiter funktionieren** (lokaler Rückfall, ehrlich beschriftet). Mit Backend-Schlüsseln schaltet es um.
- **Dienste nur über die Verträge:** Versand, Push, Konto, öffentliche Links, Dateien → `cloud()` aus `@core/cloud`.
  Messung → `messen()` aus `@core/messung`. Niemals einen Anbieter direkt aus dem Browser ansprechen.
- **Geheimnisse nie im Browser-Code.** Server-Funktionen liegen unter `os/api/**` (Vercel Functions, Node, `fetch` statt SDKs),
  lesen Schlüssel aus `process.env`. Nur öffentliche Werte mit Präfix `VITE_` im Browser.
- **Nur eigene Dateien ändern** (Tabelle unten). Neue npm-Abhängigkeiten nur Paket `fundament`.
- Deutsch, Du in der App, Sie gegenüber Endkunden. Design: Playbook + Festlegungen. 390 px muss gehen.
- Prüfen: `cd os && npm ci && npx tsc -b && npx vitest run && npx vite build` + Playwright-Durchlauf deiner Abläufe
  (Chromium vorinstalliert, `/opt/node22/lib/node_modules/playwright/index.mjs`).

## Gemeinsamer Datenvertrag für das Backend (Supabase)

Damit Fundament und Server-Funktionen der anderen Pakete zusammenpassen:

```sql
-- Mandant
create table betriebe (id uuid primary key, name text, erstellt_am timestamptz default now(),
  plan text default 'test', test_bis date, stripe_kunde text);
create table mitglieder (betrieb_id uuid references betriebe, nutzer_id uuid, mitarbeiter_id text,
  rolle text, primary key (betrieb_id, nutzer_id));
-- Alle Objekte aller Sammlungen (Kern + Module), eine Zeile je Objekt
create table objekte (betrieb_id uuid references betriebe, sammlung text, id text, daten jsonb,
  geaendert_am timestamptz, geloescht_am timestamptz, primary key (betrieb_id, sammlung, id));
-- Öffentliche Links (Kundenbereich, Terminbuchung) – nur über Server-Funktion lesbar
create table oeffentliche_links (token text primary key, betrieb_id uuid, art text, bezug jsonb, gueltig_bis timestamptz);
-- Push-Abos, Messpunkte
create table push_abos (nutzer_id uuid, betrieb_id uuid, abo jsonb, primary key (nutzer_id, abo));
create table messpunkte (betrieb_id uuid, ereignis text, zeit timestamptz, daten jsonb);
```
RLS: Zeilen nur für Mitglieder des Betriebs (Geld-Sammlungen und geschützte Felder nur Chef/Büro, siehe
`supabase/migrations/`; Schreiben aus der App über `objekte_schreiben`). Server-Helfer: `src/server/cloud/*`
(`supabaseKonfig`, `rest`, `angemeldetesMitglied`, `pushAnMitarbeiter`, `cronErlaubt`).
Umgebungsvariablen (Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (E-Mail), `SMS_API_KEY` + `SMS_ABSENDER`, `VAPID_PUBLIC_KEY`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `ANTHROPIC_API_KEY` (KI-Erkennung), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`.
Server-Funktionen ohne gesetzte Schlüssel antworten mit `501 { fehler: "nicht verbunden" }` – der Browser zeigt dann den lokalen Rückfall.

## Fachliche Events zwischen Paketen

`portal.geoeffnet` { kundeId, bezug } (aktivierung) → erstwert zeigt „Kunde hat geöffnet“ ·
`dokument.versendet` { bezug, kanal, status } (erstwert/angebote) · `team.eingeladen` / `team.beigetreten` (setup/fundament) ·
`abo.lesemodus` (bezahlen). Dazu die Datenschicht-Events `<sammlung>.created|updated|removed|restored`.

## Pakete und Verantwortung

| Paket | Inhalt (PRD-Abschnitt) | Darf ändern |
|---|---|---|
| `fundament` | 0.1: Supabase-Cloud-Implementierung von `Cloud` (Konto per E-Mail-Link/SMS-Code, Einladen, Senden über Resend/SMS, Push über Web-Push/VAPID, öffentliche Links, Dateien in Storage), **Sync local-first** in `db.ts` (IndexedDB bleibt Cache, `objekte`-Tabelle ist Quelle, offline-Warteschlange, Realtime), Übernahme bestehender Browser-Daten ins Konto („Sichern & Team einladen“), Anmelde-/Konto-Ansicht, Messung → Server, SQL-Migrationen + RLS, `vercel.json` (Crons), Anleitung `os/BACKEND.md` (Schlüssel eintragen) | `os/src/core/db.ts`, `os/src/core/session.ts`, `os/src/core/cloud-*.ts`, `os/src/core/sync*.ts`, `os/src/main.tsx`, `os/src/modules/konto/**` (neu), `os/api/cloud/**`, `os/api/cron/**`, `os/supabase/**`, `os/package.json`, `os/vercel.json`, `os/BACKEND.md` |
| `setup` | 1: Setup in ≤ 5 Schritten, Foto/Website → Briefkopf (KI über `os/api/ki/briefkopf.ts`, sonst 4 Felder), Kunden übernehmen (Excel/CSV-Vorlagen gängiger Programme, Handy-Kontakte, Dubletten), Preisliste per Foto/PDF (`os/api/ki/preisliste.ts`) bzw. Gewerk-Vorlagen mit Regional-Regler, Team per Handynummer (`cloud().einladen`, lokal: Mitarbeiter anlegen + Link teilen), **Spielwiese** getrennt von echten Daten, Ende = erste Aufgabe (`/start`) | `os/src/modules/onboarding/**`, `os/src/core/seed.ts`, `os/src/core/gewerke.ts`, `os/api/ki/briefkopf.ts`, `os/api/ki/preisliste.ts` |
| `erstwert` | 2: Modul `start` („Was willst du als Erstes erledigen?“ unter `/start`, „Dein Start“-Karte mit 3 Haken), Angebot in 3 Minuten (ein Bildschirm: Kunde · Positionen · Senden), Positionen per Sprache (lokaler Parser über Katalog; optional `os/api/ki/positionen.ts`), Versand über `cloud().senden` mit Link zum Kundenbereich, „Kunde hat geöffnet“ (hört auf `portal.geoeffnet`), Rechnung in 1 Minute | `os/src/modules/start/**` (neu), `os/src/modules/angebote/**`, `os/src/modules/rechnungen/RechnungSchnell*.tsx` (neu), `os/src/shell/Heute.tsx`, `os/api/ki/positionen.ts` |
| `aktivierung` | 3: PWA (Manifest, Icons, Service Worker mit Offline-Cache, Installieren-Hinweis), **Monteur-Oberfläche am Handy mit 3 Tabs** (Heute · Erfassen · Aufträge), Büro-**Eingang** (Anfragen, Kundennachrichten, Freigaben an einem Ort), Kundenbereich/Terminbuchung über `cloud().oeffentlichLesen` (Rückfall lokal) + Event `portal.geoeffnet`, Anfrage-Postfach (Anzeige der Adresse; Server-Eingang `os/api/eingang/email.ts`), „Wir sind unterwegs“ an den Kunden bei `einsatz.gestartet`, Benachrichtigungs-Klick im Service Worker → `/macher/hinweise?aktion=…` | `os/index.html`, `os/public/**`, `os/src/sw.ts` (neu), `os/src/shell/Shell.tsx`, `os/src/shell/shell.css`, `os/src/shell/App.tsx`, `os/src/shell/LokaleNavigation.tsx`, `os/src/modules/eingang/**` (neu), `os/src/modules/kundenbereich/**`, `os/src/modules/terminbuchung/**`, `os/src/modules/naechster-einsatz/**`, `os/api/eingang/**`, `os/api/oeffentlich/**` |
| `gewohnheit` | 4: Modul `takte` (Tagesbrief 7:00 Chef/Büro, Dein Tag 6:30 Monteur, Zeiten bestätigen 16:30, Wochenbilanz Fr 15:00 – als Ansichten + Push über `cloud().push`, lokal über die Notification-API bzw. In-App), Entscheiden direkt aus der Benachrichtigung (Aktionen an der Push-Nachricht), Ruhezeiten und Kanalwahl je Nutzer, serverseitiger Takt `os/api/takte/cron.ts` (liest `objekte`, sendet Push/E-Mail) | `os/src/modules/takte/**` (neu), `os/src/modules/benachrichtigungen/**`, `os/src/modules/erledigt/**`, `os/api/takte/**` |
| `bezahlen` | 5: Modul `abo` („Dein Plan“: Plan nach Teamgröße, alles drin; 30 Tage Test ab Einrichtung; nächste Abbuchung; Zahlungsart; Rechnungen; kündigen in 2 Klicks), Wertspitzen-Hinweise mit echten Zahlen (Tag 21/27/30), **Lesemodus** nach Ablauf über `setzeSchreibschutz` (Systemsammlungen ausgenommen, Export bleibt) + freundliche Meldung bei `SchreibGesperrt`, Checkout/SEPA über `os/api/abo/checkout.ts`, Webhook `os/api/abo/webhook.ts`, Mahnstufen bei Zahlungsausfall; Website-Preise auf „je Teamgröße, alles drin“ angleichen und bis zur Freigabe als vorläufig kennzeichnen | `os/src/modules/abo/**` (neu), `os/api/abo/**`, `src/content/preise.ts`, `src/app/(marketing)/preise/**` |

Jedes Paket legt am Ende `os/src/modules/_berichte/r1-<paket>.md` an (was gebaut, was nur mit Schlüsseln geht,
Messpunkte, offene Punkte) und pusht seinen Branch. Keinen Pull Request anlegen.
