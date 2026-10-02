# R1 · Paket `aktivierung` (PRD Abschnitt 3)

Ziel: Ein Betrieb arbeitet in der ersten Woche gemeinsam in Macher OS; der Monteur nutzt das Handy wie eine App.

## Was gebaut ist

| # | Baustein | Dateien |
|---|---|---|
| 1 | **PWA**: Manifest „Macher OS“ (Farben aus den Tokens: `theme_color` #06480C, `background_color` #F7FAFB), Icons 192/512/maskable + Apple-Touch-Icon aus dem Favicon-Motiv, Service Worker ohne neue Abhängigkeit | `public/os/manifest.webmanifest`, `public/os/icons/*`, `src/os/sw.ts` → `public/os/sw.js` (`scripts/os-sw.mjs`, vor `dev`/`build`), `src/app/(os)/os/layout.tsx` (Manifest, Apple-Icons) |
| | Service Worker (Scope `/os/`): Seitenaufrufe zuerst aus dem Netz, ohne Netz die zuletzt geladene App-Seite (SPA-Rückfall für jeden Pfad unter `/os`); `/_next/static/*`, Schriften, Icons aus dem Cache; `/api/*` nie im Cache. Beim ersten Besuch meldet die App die schon geladenen Dateien an den Worker → **offline neu laden klappt nach dem ersten Besuch**. | |
| | Push: Nachricht mit bis zu zwei Aktionen; Tipp öffnet `pfad`, Tipp auf eine Aktion öffnet `/os/macher/hinweise?aktion=<id>&payload=<json>` (fokussiert ein offenes Fenster, sonst neues). | `src/os/sw.ts` |
| | Installieren-Hinweis (nur am Handy, nicht installiert, einmal; schließen oder installieren blendet ihn dauerhaft aus; iOS: Anleitung „Teilen › Zum Home-Bildschirm“). Offline-Banner „Kein Netz – du kannst weiterarbeiten“. | `src/os/shell/Shell.tsx`, `shell.css` |
| 2 | **Monteur-App** (Rolle Monteur/Azubi, untere Navigation < 1024 px): genau **Heute · Erfassen · Aufträge**. Erfassen = neue Seite `/erfassen` mit Auftrag im Kontext, Hauptaktion „Foto hinzufügen“, „Zeit erfassen“, „Notiz sprechen“, weitere im Menü – jeder Knopf öffnet das vorhandene Schnell-Erfassen. Unter Aufträge nur „Übersicht“ (kein Eingang, keine Kunden/Service); Angebote bleiben über das Recht `geld` verborgen. Profilmenü ohne Favoriten/Betrieb. Chef/Büro unverändert. | `src/os/shell/Shell.tsx`, `LokaleNavigation.tsx`, `src/os/modules/naechster-einsatz/Erfassen.tsx` |
| 3 | **Eingang** (Modul `eingang`, `/os/auftraege/eingang`, Ziel „Eingang“ › Ansicht „Alles“): Anfragen ohne nächsten Schritt, ungelesene Kundennachrichten (je Verlauf), Freigaben/Entscheidungen – neueste oben, je Eintrag genau eine Hauptaktion, Filter mit Zählern, Leerzustand. Zähler am Bereich „Aufträge“ (Seitenleiste + untere Navigation) und am Ziel „Eingang“, nur für Chef/Büro. Keine eigene Sammlung – reine Sicht. | `src/os/modules/eingang/*` |
| 4 | **Kundenbereich & Terminbuchung für echte Kunden**: Link im selben Browser bekannt → live aus der Datenschicht (lokaler Rückfall). Sonst `cloud().oeffentlichLesen(art, token)` bzw. vorrangig die eigene Server-Funktion `GET /api/oeffentlich/lesen` (liefert genau die Sicht). Was der Kunde tut (geöffnet, Nachricht, Angebot annehmen/ablehnen, Termin buchen) geht an `POST /api/oeffentlich/aktion` und wird beim Betrieb mit **derselben Logik wie im Büro** verarbeitet (genau einmal). Buchung auf vergebenen Termin → keine verlorene Anfrage: Anfrage mit Wunschtermin + wichtige Benachrichtigung. | `src/os/modules/kundenbereich/{oeffentlich.ts,Portal.tsx,Rahmen.tsx}`, `src/os/modules/terminbuchung/{oeffentlich.ts,BuchenSeite.tsx}`, `src/app/api/oeffentlich/{lesen,aktion}/route.ts`, `src/os/server/{oeffentlich,supabase}.ts` |
| | Event **`portal.geoeffnet`** `{ kundeId, bezug, quelle: 'lokal' \| 'server', zeit }` + Vermerk am Kunden (und am Bezug, z. B. Angebot) + `letzterZugriffAm`. `bezug` kommt aus `?angebot=<id>` (Angebotsversand von erstwert) oder `?bezug=<typ>:<id>` im Link – nur wenn er zu diesem Kunden gehört, sonst der Kunde. | `kundenbereich/oeffentlich.ts` |
| 5 | **Anfrage-Postfach**: Adresse `anfragen@<betrieb>.macher-os.de` im Eingang (kopierbar, ehrlich „Nach Verbinden aktiv“). Server-Eingang `POST /api/eingang/email` für Resend Inbound und Postmark Inbound: Betrieb über die eindeutige Spalte `betriebe.postfach` (sonst eindeutiger Namens-Slug), Kunde erkennen (E-Mail inkl. Ansprechpartner, sonst Telefonnummer aus der Signatur) oder anlegen, Anfrage-Auftrag (Phase `anfrage`, Quelle E-Mail, fortlaufende Nummer) + eingehende Nachricht. **Dubletten**: gleiche Message-ID → ignoriert; Antwort zu offener Anfrage desselben Kunden mit gleichem Betreff (14 Tage) → nur Nachricht an die bestehende Anfrage. | `src/app/api/eingang/email/route.ts`, `src/os/server/postfach.ts`, `src/os/modules/eingang/Eingang.tsx`, `supabase/migrations/20261002100000_aktivierung.sql` |
| 6 | **„Wir sind unterwegs“**: bei Losfahren (Status `unterwegs`) bzw. `einsatz.gestartet`, je Termin genau einmal. Mit Backend automatisch über `cloud().senden` (SMS bevorzugt, sonst E-Mail; Link zum Kundenbereich, falls vorhanden), Vermerk an Termin und Auftrag, ausgehende Nachricht. Ohne Backend nur **Vorschlag** für den Monteur („SMS senden“ öffnet das SMS-Programm). Abschaltbar unter Automationen. Beispielkunden bekommen mit Backend nie eine echte Nachricht. Text ohne erfundene Ankunftszeit. | `src/os/modules/naechster-einsatz/unterwegs.ts` |
| 7 | **Messpunkt `aktivierung.erreicht`** als reine, getestete Funktion `aktivierung()`: innerhalb von 14 Tagen ab Einrichtung ≥ 3 Aufträge · ≥ 1 Auftrag mit versendeter Rechnung (jeder Auftrag startet als Anfrage) · ≥ 1 Zeit oder Foto/Notiz eines Monteurs/Azubis **am Auftrag** · ≥ 1 Rechnung versendet. Beispieldaten und Papierkorb zählen nie. Wird einmal gemessen (`messen('aktivierung.erreicht', { tage, auftraege })`). | `src/os/modules/eingang/aktivierung.ts` |

## Nach R1: `main` zusammengeführt (Macher OS unter `/os` im Next.js-Projekt)

`main` hat die Software in das Next.js-Projekt verlegt (`src/os`, Route `/os`). Dieses Paket ist darauf portiert:
Server-Funktionen sind Next.js Route Handler unter `src/app/api/…`, reine Server-Logik liegt in `src/os/server/` (mit Tests),
Manifest und Icons unter `public/os/`, der Service Worker wird aus `src/os/sw.ts` nach `public/os/sw.js` übersetzt
(keine neue Abhängigkeit, `typescript` ist schon da) und unter `/os/` registriert. `next.config.ts`: `Cache-Control: no-cache`
für `/os/sw.js`.

## Erledigte offene Punkte

- **`struktur.ts`**: Ansicht „Alles“ → `eingang` ist drin (für `struktur.test.ts` nötig).
- **Cloud-Vertrag**: `Cloud.oeffentlichSenden?(…)` als optionale Methode in `src/os/core/cloud.ts`. Bietet die Cloud sie an,
  wird sie genutzt, sonst `POST /api/oeffentlich/aktion`. `oeffentlichLesen` nimmt eine Antwort nur, wenn sie die Form der Sicht hat
  (schützt vor dem Rohformat von `/api/cloud/oeffentlich` aus fundament).
- **Eindeutiges Postfach**: Migration `supabase/migrations/20261002100000_aktivierung.sql` – Spalte `betriebe.postfach` (eindeutig),
  per Trigger beim Anlegen aus dem Namen; bei Namensgleichheit mit Kürzel der ID. Der Server sucht zuerst dort, sonst nur
  bei eindeutigem Namens-Slug (keine Fehlzuordnung bei gleichen Namen).
- **Doppelte Verarbeitung**: Mit Backend verarbeitet genau eine Person die Kundeneingaben (erste aktive Büro-Kraft, sonst Chef),
  Nachrichten bekommen eine feste ID (`oe-<eingabe>`), eine schon so getroffene Angebotsentscheidung löst keinen Fehlalarm aus.
- **Vercel**: `/api` sind Route Handler (vom SPA-Rewrite unberührt), `sw.js` wird nie gecacht.

## Was nur mit Schlüsseln geht

- `SUPABASE_URL` bzw. `NEXT_PUBLIC_SUPABASE_URL` (wie fundament) + `SUPABASE_SERVICE_ROLE_KEY` (und die Migrationen von fundament + `…_aktivierung.sql`): `/api/oeffentlich/lesen`, `/api/oeffentlich/aktion`, `/api/eingang/email`. Ohne → `501 { fehler: "nicht verbunden" }`, der Browser zeigt den lokalen Rückfall.
- Optional `EINGANG_WEBHOOK_SECRET` (neu): wenn gesetzt, muss der Webhook `?schluessel=…` oder Basic-Auth-Passwort mitschicken.
- Mail-Dienst: Inbound-Domain `*.macher-os.de` (MX) beim Anbieter einrichten und Webhook auf `/api/eingang/email` zeigen lassen.
- Echte SMS/E-Mail für „Wir sind unterwegs“ und echter Push: über die Cloud-Implementierung von `fundament`.

## Verträge für andere Pakete

- **fundament – `cloud().oeffentlichLesen(art, token)`**: Der Kundenbereich fragt zuerst `GET /api/oeffentlich/lesen?art=…&token=…` → `{ sicht }`; die Cloud-Antwort ist nur Rückfall. Optional `oeffentlichSenden` implementieren. Die Sichten liegen als Sammlung `oeffentliche_sichten` (ID = Token, `{ art, token, gueltigBis, widerrufen, sicht }`) in `objekte`; Kundeneingaben als `oeffentliche_eingaben`. Beide Sammlungen müssen synchronisiert werden; die Server-Funktion prüft zusätzlich `oeffentliche_links`, falls dort eine Zeile zum Token steht (sonst reicht die Sicht). Sichten werden nur auf Chef/Büro-Geräten und nur bei `cloudAktiv()` geschrieben (nur bei Änderung, leise).
- **fundament – Push-Abo**: Der Service Worker ist unter `/` registriert (`navigator.serviceWorker.ready`). Erwartetes Push-JSON: `{ titel, text, pfad?, tag?, aktionen?: [{ aktion, label, payload? }] }` (auch `title`/`body`).
- **gewohnheit**: `/os/macher/hinweise?aktion=<id>&payload=<json>` auswerten (Aktion ausführen, dann Rückmeldung). Der Service Worker leitet nur dorthin; ausgeführt wird nichts ohne geöffnete App.
- **erstwert**: `portal.geoeffnet` trägt zusätzlich `daten.quelle` – `lokal` = im selben Browser geöffnet (z. B. Vorschau im Büro), `server` = beim Kunden. `?angebot=<id>` im Link wird ausgewertet (nur eigene Angebote).

## Messpunkte

- `aktivierung.erreicht` `{ tage, auftraege }` – einmal je Betrieb.
- Event `portal.geoeffnet` (für `erstwert.dokument_geoeffnet`).

## Prüfung (nach dem Zusammenführen mit `main`)

- `npm run typecheck`, `npm run lint` (0 Fehler), `npx vitest run` (**101 Dateien, 658 Tests grün**), `npm run build` grün.
- Playwright gegen `next start` (29 Prüfpunkte grün): 1440 px als Chef – Eingang mit Einträgen und Zähler, Postfach
  „Nach Verbinden aktiv“, Kundenbereich öffnen → am Kunden vermerkt, unbekannter Link → ehrliche Fehlerseite; Manifest und
  Icons laut Chromium fehlerfrei und installierbar; 390 px als Monteur – genau 3 Tabs, kein Planen/Betrieb, Erfassen öffnet
  Schnell-Erfassen, Losfahren → Vorschlag „Wir sind unterwegs“, offline neu laden und tiefer Link `/os/erfassen` offline.
- Server-Funktionen ohne Schlüssel: `501 { fehler: "nicht verbunden" }`.

## Offen (außerhalb dieses Pakets)

- Die Migration setzt die Tabellen von fundament voraus; fundament ist noch nicht in `main` und muss dort ebenfalls auf
  die neue Struktur (Route Handler, `supabase/` im Wurzelverzeichnis) umziehen.
- Die Anzeige im Eingang nutzt den Namens-Slug; weicht das vergebene Postfach ab (Namensgleichheit), sollte die App es aus
  `betriebe.postfach` lesen, sobald das Konto (fundament) es mitliefert.
