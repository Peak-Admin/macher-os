# R1 · Paket „gewohnheit“ (Habit)

Branch: `claude/fervent-pascal-joztaz-gewohnheit`. Grundlage: PRD Abschnitt 4, `os/PAKETE-AKTIVIERUNG.md`.

## Was gebaut ist

**Takte (`src/modules/takte/`)** – reine, getestete Funktionen, die im Browser und in Node laufen (nur relative Importe, kein `db`):

| Takt | Wann | Wer | Inhalt |
|---|---|---|---|
| Dein Tag | werktags 6:30 | Monteur, Azubi | erster Einsatz (Zeit, Kunde, Adresse mit Kartenlink, Ansprechpartner/Telefon vor Ort), Material der Aufträge von heute (nicht verbraucht), Hinweise (Zugang, Terminnotiz, Aufgaben) |
| Tagesbrief | werktags 7:00 | Chef, Büro | höchstens 3 Entscheidungen aus `offeneHinweise()` (Gewicht), Geld nur mit Recht „geld“: Zahlungseingänge gestern (montags seit Freitag), Überfälliges |
| Zeiten bestätigen | werktags 16:30 | Monteur, Azubi | Einträge von heute + Summe; ein Tipp bestätigt (laufende Zeit endet jetzt, Vermerk „bestätigt“ im Zeitstrahl). Fehlt Zeit zu einem Einsatz → „Nachtragen“ |
| Wochenbilanz | Fr 15:00 | Chef | Umsatz netto, offene Posten (davon überfällig), Aufträge (neu/fertig/laufend), „Macher hat erledigt“ der Woche mit gesparter Zeit **als Schätzung** gekennzeichnet |

- Dateien: `zeit.ts` (Uhr in Europe/Berlin – der Server läuft in UTC), `regeln.ts` (Takte, Einstellungen, Ruhezeit, Planer),
  `inhalt.ts` (Inhalte über einem `Bestand`), `zustellung.ts` (Push-/E-Mail-Text, höchstens 2 Aktionen),
  `browser.ts` (Bestand aus `db`, lokaler Planer, Zustellung), `aktionen.ts`, `Ansicht.tsx`.
- Geld-Definitionen wie in `modules/auswertung/daten.ts` (nachgebaut, weil die dortige Kette `db` importiert).
- Leere Takte (kein Einsatz, nichts zu bestätigen) werden **nicht** verschickt. Keine Abzeichen, keine Streaks.

**Ansichten** `/macher/takte/<takt>` (`dein-tag`, `tagesbrief`, `zeiten`, `wochenbilanz`): höchstens 3 Blöcke, eine Hauptaktion,
Leer-/Fehler-/Erfolgszustände, 390 px geprüft. Monteure sehen nie Geld (Tagesbrief ohne Geld-Block, Wochenbilanz gesperrt).

**Zustellung**
- Backend verbunden (`cloudAktiv()`): Server-Takt `os/api/takte/cron.ts` stellt zu; der Browser plant dann nicht (keine Doppelten).
  `taktZustellen()` nutzt `cloud().push` mit Pfad und Aktionen.
- Ohne Backend: Automation `macher.takte` (Modul Benachrichtigungen, Standard an) prüft jede Minute für die Person am Gerät →
  Eintrag in der Glocke (Bezug `{ typ: 'takte', id }` → Takt-Ansicht) und – mit Erlaubnis – Systemmeldung über die
  Notification-API (über den Service Worker mit Aktionsknöpfen, sonst direkt). In den Einstellungen ehrlich beschriftet:
  „nur solange Handwerk OS geöffnet ist“.

**Server-Takt** `os/api/takte/cron.ts` (+ `planen.ts`, `webpush.ts`)
- Liest `betriebe`, `mitglieder`, `objekte` (nur benötigte Sammlungen, seitenweise) mit Service-Key, plant mit denselben Funktionen.
- Merkt „zuletzt zugestellt“ je Person in `objekte` (Sammlung `einstellungen`, `takte.zuletzt.<mitarbeiterId>`) – höchstens einmal am Tag.
- Push: Web-Push selbst implementiert (RFC 8291 aes128gcm + VAPID, nur `node:crypto` + `fetch`, getestet mit Entschlüsselung/Signaturprüfung)
  an alle `push_abos` der Person. Rückfall bzw. Kanal „E-Mail“: Resend.
- Messpunkt `gewohnheit.takt_zugestellt` { takt, weg } in `messpunkte`. `?trocken=1` = nur berechnen.
- Ohne `SUPABASE_URL`/`VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` oder ohne `CRON_SECRET`: `501 { fehler: "nicht verbunden" }`;
  falsches Geheimnis: 401.

**Einstellungen je Nutzer** `/macher/benachrichtigungen/einstellungen` (Glocke › „Takte & Ruhezeiten“): Takte der eigenen Rolle an/aus
und Uhrzeit, Kanal Push/E-Mail, Ruhezeiten (Standard **18–6 Uhr und Wochenende**), Schalter „Ich habe Notdienst“
(Dringendes auch in der Ruhezeit; Takte bleiben still). Warnung, wenn ein Takt in der eigenen Ruhezeit liegt. Gilt sofort.
Gespeichert als Einstellung `takte.nutzer.<mitarbeiterId>` – der Server liest denselben Schlüssel.

**Entscheiden aus der Benachrichtigung**: Aktionen laufen über `aktionAusfuehren` (z. B. `abwesenheit.genehmigen`,
`mahnung.senden`, `termin.bestaetigen` – was „Braucht dich“ anbietet). Neue Aktion `takte.zeiten-bestaetigen`
(im Modul Benachrichtigungen registriert). Link-Format: `/macher/takte/<takt>?quelle=benachrichtigung&aktion=<id>&payload=<JSON>` –
die Ansicht führt die Aktion einmal aus, zeigt das Ergebnis und bereinigt den Link (`aktionsLink()`/`aktionAusLink()`).

## Messpunkte

- `gewohnheit.tagesbrief_geoeffnet` { quelle: 'benachrichtigung' | 'app' }
- `gewohnheit.aktion_aus_benachrichtigung` { takt, aktion, weg: 'benachrichtigung' | 'ansicht' }
- `gewohnheit.zeiten_bestaetigt` { anzahl }
- Server: `gewohnheit.takt_zugestellt` { takt, weg: 'push' | 'email' | 'kein-weg' }

## Nur mit Schlüsseln

`SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL` (oder `SUPABASE_URL`), `CRON_SECRET`; Push: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`;
E-Mail: `RESEND_API_KEY`. Optional neu: `RESEND_ABSENDER` (Standard `Handwerk OS <takte@macher-os.de>`), `APP_URL` (Links in E-Mails,
sonst `VERCEL_URL`), `VAPID_KONTAKT` (Standard `mailto:hallo@macher-os.de`).

## Prüfung

- `npm ci && npx tsc -b && npx vitest run && npx vite build`: tsc und Build grün; 38 neue Tests grün (Ruhezeit, Planer, Inhalte je Takt,
  Zustellung, Browser-Planer mit/ohne Backend, Zeiten bestätigen, Aktions-Links, Server-Planung, 501/401, Web-Push-Verschlüsselung + VAPID).
- **Ein fremder Test ist rot, schon auf dem Ausgangsstand:** `src/modules/autoplanung/autoplanung.test.ts › plant am selben Tag nach dem
  Vortermin …` (datumsabhängig, nicht in diesem Paket).
- `os/api/**` ist nicht in `tsconfig.json` enthalten und `@types/node` fehlt → `os/api/takte` separat mit einer Node-Typ-Attrappe geprüft (grün).
- Playwright (Chromium, 390 und 1440 px, Europe/Berlin): Tagesbrief Chef/Büro inkl. Entscheidung ausführen, Wochenbilanz Chef,
  Dein Tag Monteur, Zeiten bestätigen (ohne Zeit → ehrliche Meldung + „Nachtragen“; mit Zeiten → Bestätigen per Benachrichtigungs-Link,
  laufende Zeit endet, Link bereinigt), Monteur sieht kein Geld, Einstellungen (Ruhezeit speichern, Warnung), kein horizontales Scrollen,
  keine Konsolenfehler.

## Nachträglich erledigt (zweite Runde)

Auf Wunsch die offenen Punkte geschlossen – dabei wurden Dateien anderer Pakete angefasst (beim Zusammenführen beachten):

1. **Absturz des Server-Takts behoben:** `os/package.json` hat `"type": "module"`, Node verlangt dann Dateiendungen.
   Alle Dateien, die der Server lädt (`api/takte/*`, `takte/{zeit,regeln,inhalt,zustellung,feiertage}.ts`), importieren jetzt mit `.js`.
   Geprüft durch Transpilieren Datei für Datei und Aufruf in Node 22 (501/401 wie erwartet).
2. **`takte` ist ein eigenes Modul** (`takte/index.tsx`: Route, Aktion `takte.zeiten-bestaetigen`, lokaler Planer, Suche) und steht in
   `src/shell/struktur.ts` als Kontext unter Heute. *(Datei gehört der Shell.)*
3. **`os/vercel.json`:** Cron `/api/takte/cron` alle 15 Minuten; `/api/` und `/sw.js` werden nicht mehr auf `index.html` umgeschrieben;
   `sw.js` ohne Cache. *(Datei gehört Fundament – bitte deren Crons ergänzen, nicht ersetzen.)*
4. **Service Worker `os/public/sw.js`:** zeigt Push an (bis 2 Aktionsknöpfe), Klick öffnet die Takt-Ansicht, Aktionsknopf öffnet sie mit
   `?aktion=…&payload=…` und die Entscheidung läuft sofort. Wird vom Modul Takte angemeldet (nur im Produktions-Build).
   *(Datei gehört Aktivierung – deren Offline-Cache gehört in dieselbe Datei, ein Service Worker je Scope.)*
5. **Push-Abo je Gerät:** mit `VITE_VAPID_PUBLIC_KEY` und Erlaubnis wird das Gerät abonniert und als Einstellung
   `takte.push-abo.<mitarbeiterId>` gemerkt – über den Sync landet es in `objekte`; der Cron nutzt es zusätzlich zu `push_abos`.
6. **Feiertage auf dem Server** (`takte/feiertage.ts`, Bundesland aus `plan.bundesland`); ein Test hält sie gleich mit `@core/kalender`.
7. **Abgelaufene Push-Abos** (404/410) werden aus `push_abos` gelöscht.
8. **Ruhezeit für alle Pushes:** wichtige Ereignis-Benachrichtigungen (dringende Anfrage, Urlaubsantrag, Angebot angenommen) gehen über
   `pushMitRuhezeit()` zusätzlich aufs Handy – nur außerhalb der Ruhezeit, Dringendes bei Notdienst auch nachts.

## Dritte Runde: Umzug auf `main` und Entscheiden ohne App

**Neue Struktur (wie `main` und Paket Erstwert):** App-Code unter `src/os/`, Handwerk OS läuft unter `/os` im Next.js-Projekt.
- `src/os/modules/takte/**` (Modul), `src/os/modules/takte/server/**` (nur Server: Planung, Web-Push, Supabase-REST, Server-Aktionen)
- Route Handler `src/app/api/takte/cron/route.ts` (Server-Takt) und `src/app/api/takte/aktion/route.ts` (Entscheidung aus der Mitteilung)
- `public/sw.js` (Service Worker), Wurzel-`vercel.json`: Cron `/api/takte/cron` alle 15 Minuten, `sw.js` ohne Cache
- Pfade in Mitteilungen und E-Mails tragen jetzt das Präfix `/os` (`taktBrowserPfad`); im Router bleibt `/macher/takte/<takt>`.
- Umgebungsvariablen in Next: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Browser), `SUPABASE_URL` oder `NEXT_PUBLIC_SUPABASE_URL` (Server).

**Entscheiden ohne die App zu öffnen:** Der Server-Takt hängt an jede dafür geeignete Aktion einen signierten Schlüssel
(HMAC mit `TAKTE_GEHEIMNIS`, sonst `CRON_SECRET`; 24 h gültig). Tippt man in der Mitteilung auf den Knopf, schickt der
Service Worker ihn an `/api/takte/aktion`. Der Server prüft Signatur, Mitgliedschaft und Recht und schreibt direkt in `objekte`
(mit Eintrag im Zeitstrahl), danach kommt eine kurze Bestätigung („Urlaub genehmigt.“). Serverseitig gehen:
`abwesenheit.genehmigen`/`ablehnen` (Recht „personal“), `termin.bestaetigen` („planen“), `takte.zeiten-bestaetigen` (nur eigene Zeiten).
Alles andere – oder wenn der Server nicht erreichbar ist – öffnet wie bisher die Takt-Ansicht und entscheidet dort.
Messpunkt `gewohnheit.aktion_aus_benachrichtigung` { weg: 'server' }.

Prüfung in dieser Runde: `npm run typecheck`, `npx eslint` (Takte, Benachrichtigungen, API) ohne Befund, `npm run build` grün
(`ƒ /api/takte/aktion`, `ƒ /api/takte/cron`), Vitest: alle Takte-/Benachrichtigungs-/Shell-Tests grün; rot bleibt nur
`autoplanung.test.ts` (fremd, uhrzeitabhängig – auf dem Erstwert-Branch bereits behoben). Playwright gegen `next start` unter `/os`
bei 390/1440 px: alle Abläufe wie oben grün, Service Worker angemeldet.

## Weiterhin offen

- **Schlüssel in Vercel (Projekt `macher-os`):** Dort ist noch keine Umgebungsvariable gesetzt. Fürs Live-Schalten nötig:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  optional `RESEND_API_KEY`, `APP_URL` (z. B. `https://<domain>`), `TAKTE_GEHEIMNIS`.
- **Fundament** (Supabase-Projekt, Migration, Sync `db` → `objekte`, `cloud-supabase`) liegt auf seinem Branch noch in der alten Struktur.
  Erst mit ihm gibt es Konten, `mitglieder` und `push_abos`. Dessen `pushAnMitarbeiter` (npm `web-push`) und mein Web-Push sind
  gleichwertig – beim Zusammenführen auf eines festlegen.
- **Aktivierung** baut einen eigenen Service Worker (`src/sw.ts`). Ein Scope = ein Service Worker: beim Zusammenführen Push-/Klick-Teil
  aus `public/sw.js` übernehmen.
- **Produktion** heißt: dieser Branch nach `main`. Das ist ein Pull Request mit Merge – nur auf ausdrücklichen Wunsch.

## Vierte Runde: auf das zusammengeführte `main` gebracht

`main` enthält inzwischen setup, bezahlen, fundament, aktivierung und erstwert. Gewohnheit wurde daran angepasst:

- **Server-Logik** nach `src/os/server/takte/` (`planen.ts`, `serverAktionen.ts`, `supabase.ts` + Tests). Supabase-Zugriff,
  501/401-Prüfung (`cronErlaubt`), `appUrl` und Messpunkte laufen über die gemeinsamen Helfer in `src/server/cloud/`.
- **Web-Push:** die eigene Implementierung (`webpush.ts`) ist entfallen – Push geht über `pushAnMitarbeiter`
  (`src/server/cloud/push.ts`, npm `web-push`, VAPID wie Fundament: `VAPID_PUBLIC_KEY`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Dort neu: optionales `tag`, `schluessel` an Aktionen, `emailRueckfall: false`
  (Takte schicken ihre eigene E-Mail), Link ohne doppeltes `/os`. E-Mail über `emailSenden` (Resend).
- **Push-Abos** nur noch in `push_abos` (Konto & Geräte). Das Merken als Einstellung `takte.push-abo.<id>` entfällt;
  in den Takt-Einstellungen meldet „Mitteilungen auf diesem Gerät einschalten“ das Gerät über `supabaseCloud().pushEinschalten()` an.
- **Service Worker:** kein zweiter mehr – `public/sw.js` und `takte/sw.ts` sind entfallen. Der Service Worker von Aktivierung
  (`src/os/sw.ts`, Scope `/os/`) erkennt Takt-Mitteilungen am `tag` (`takt-…`): Knopf mit Schlüssel → `/api/takte/aktion`,
  sonst Takt-Ansicht mit `?quelle=benachrichtigung&aktion=…&payload=…`.
- **Cron:** `vercel.json` `{ "path": "/api/takte/cron", "schedule": "30 4 * * *" }` (Vercel Hobby: nur täglich). Der Browser-Planer
  läuft jetzt auch mit Konto und stellt die feinen Zeiten über `cloud().push` zu; „zuletzt zugestellt“ teilen sich Browser und
  Server. Mit Vercel Pro `*/15 * * * *` (siehe `docs/os/BACKEND.md`).
- **Struktur:** `takte` als Kontext unter Heute in `src/os/shell/struktur.ts`; Modulliste über `scripts/os-module.mjs`.
- Umgebungsvariablen nur noch `NEXT_PUBLIC_*` bzw. ohne Präfix (kein `VITE_*`).
