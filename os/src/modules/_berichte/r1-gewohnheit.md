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
  „nur solange Macher OS geöffnet ist“.

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
E-Mail: `RESEND_API_KEY`. Optional neu: `RESEND_ABSENDER` (Standard `Macher OS <takte@macher-os.de>`), `APP_URL` (Links in E-Mails,
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

## Offene Punkte / Kernwünsche

1. **Kernwunsch `src/shell/struktur.ts`:** `takte` ist (noch) kein eigenes Modul mit `index.tsx`, weil jedes Modul dort genau einmal stehen
   muss und die Datei nicht zu diesem Paket gehört. Die Route `/macher/takte/:takt` hängt deshalb am Modul `benachrichtigungen`.
   Wer `takte` als eigenes Modul will: `index.tsx` anlegen und `'takte'` unter Heute › `kontext` eintragen.
2. **Fundament (`os/vercel.json`):** Cron eintragen, z. B. `{ "path": "/api/takte/cron", "schedule": "*/15 * * * *" }` (auf Vercel Hobby
   sind nur tägliche Crons möglich → dann reicht es nicht). Vercel schickt `Authorization: Bearer $CRON_SECRET` automatisch.
3. **Aktivierung (`src/sw.ts`):** Push-Nutzlast ist `{ titel, text, pfad, takt, aktionen: [{ aktion, label, payload }] }`. Beim
   `notificationclick` bitte `pfad` öffnen, bei `event.action` den Link aus `aktionsLink(pfad, aktion, payload)` (Format oben) – dann
   entscheidet die Takt-Ansicht sofort. Lokale Systemmeldungen legen dieselben Daten in `notification.data`.
4. **Fundament (`cloud().push`):** Für Push außerhalb der Takte (Ereignis-Benachrichtigungen) bitte die Ruhezeit beachten:
   `jetztMelden(mitarbeiterId, { dringend })` aus `@modules/takte/browser` bzw. `darfMelden()` aus `regeln.ts` (Server).
5. Server kennt die live berechneten Hinweise der Module nicht: der Tagesbrief vom Server nutzt gespeicherte Hinweise,
   Urlaubsanträge und Rechnungen > 7 Tage überfällig (`entscheidungenAusBestand`). In der App sind es alle Hinweise aus „Braucht dich“.
6. Server berücksichtigt `plan.arbeitstage`, aber keine Feiertage (die Feiertagslogik in `@core/kalender` hängt an `db`).
   Dein Tag/Zeiten bleiben an Feiertagen ohnehin leer und werden nicht verschickt; Tagesbrief/Wochenbilanz könnten kommen.
7. Abgelaufene Push-Abos (404/410) werden erkannt, aber noch nicht aus `push_abos` gelöscht (gehört zu Fundament).
8. „Entscheiden ohne App zu öffnen“: Die Aktion läuft in der App (local-first-Daten), der Knopf an der Mitteilung öffnet die Takt-Ansicht und
   führt sofort aus. Rein serverseitige Ausführung braucht serverseitige Aktionen (späteres Release).
