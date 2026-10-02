# R1 · Paket `aktivierung` (PRD Abschnitt 3)

Ziel: Ein Betrieb arbeitet in der ersten Woche gemeinsam in Macher OS; der Monteur nutzt das Handy wie eine App.

## Was gebaut ist

| # | Baustein | Dateien |
|---|---|---|
| 1 | **PWA**: Manifest „Macher OS“ (Farben aus den Tokens: `theme_color` #06480C, `background_color` #F7FAFB), Icons 192/512/maskable + Apple-Touch-Icon aus dem Favicon-Motiv, Service Worker ohne neue Abhängigkeit | `public/manifest.webmanifest`, `public/icons/*`, `public/sw.js` (Lader), `src/sw.ts`, `index.html` |
| | Service Worker: Seitenaufrufe zuerst aus dem Netz, ohne Netz die zuletzt geladene App-Shell (SPA-Rückfall für jeden Pfad); `/assets/*`, Schriften, Icons aus dem Cache; `/api/*` nie im Cache. Beim ersten Besuch meldet die App die schon geladenen Dateien an den Worker → **offline neu laden klappt nach dem ersten Besuch**. | |
| | Push: Nachricht mit bis zu zwei Aktionen; Tipp öffnet `pfad`, Tipp auf eine Aktion öffnet `/macher/hinweise?aktion=<id>&payload=<json>` (fokussiert ein offenes Fenster, sonst neues). | `src/sw.ts` |
| | Installieren-Hinweis (nur am Handy, nicht installiert, einmal; schließen oder installieren blendet ihn dauerhaft aus; iOS: Anleitung „Teilen › Zum Home-Bildschirm“). Offline-Banner „Kein Netz – du kannst weiterarbeiten“. | `src/shell/Shell.tsx`, `shell.css` |
| 2 | **Monteur-App** (Rolle Monteur/Azubi, untere Navigation < 1024 px): genau **Heute · Erfassen · Aufträge**. Erfassen = neue Seite `/erfassen` mit Auftrag im Kontext, Hauptaktion „Foto hinzufügen“, „Zeit erfassen“, „Notiz sprechen“, weitere im Menü – jeder Knopf öffnet das vorhandene Schnell-Erfassen. Unter Aufträge nur „Übersicht“ (kein Eingang, keine Kunden/Service); Angebote bleiben über das Recht `geld` verborgen. Profilmenü ohne Favoriten/Betrieb. Chef/Büro unverändert. | `src/shell/Shell.tsx`, `LokaleNavigation.tsx`, `src/modules/naechster-einsatz/Erfassen.tsx` |
| 3 | **Eingang** (Modul `eingang`, `/auftraege/eingang`, Ziel „Eingang“ › Ansicht „Alles“): Anfragen ohne nächsten Schritt, ungelesene Kundennachrichten (je Verlauf), Freigaben/Entscheidungen – neueste oben, je Eintrag genau eine Hauptaktion, Filter mit Zählern, Leerzustand. Zähler am Bereich „Aufträge“ (Seitenleiste + untere Navigation) und am Ziel „Eingang“, nur für Chef/Büro. Keine eigene Sammlung – reine Sicht. | `src/modules/eingang/*` |
| 4 | **Kundenbereich & Terminbuchung für echte Kunden**: Link im selben Browser bekannt → live aus der Datenschicht (lokaler Rückfall). Sonst `cloud().oeffentlichLesen(art, token)` und als Rückfall die eigene Server-Funktion. Was der Kunde tut (geöffnet, Nachricht, Angebot annehmen/ablehnen, Termin buchen) geht an `POST /api/oeffentlich/aktion` und wird beim Betrieb mit **derselben Logik wie im Büro** verarbeitet (genau einmal). Buchung auf vergebenen Termin → keine verlorene Anfrage: Anfrage mit Wunschtermin + wichtige Benachrichtigung. | `src/modules/kundenbereich/{oeffentlich.ts,Portal.tsx,Rahmen.tsx}`, `src/modules/terminbuchung/{oeffentlich.ts,BuchenSeite.tsx}`, `api/oeffentlich/*` |
| | Event **`portal.geoeffnet`** `{ kundeId, bezug, quelle: 'lokal' \| 'server', zeit }` + Vermerk am Kunden (und am Bezug, z. B. Angebot) + `letzterZugriffAm`. `bezug` kommt aus `?bezug=angebote:<id>` im Link, sonst der Kunde. | `kundenbereich/oeffentlich.ts` |
| 5 | **Anfrage-Postfach**: Adresse `anfragen@<betrieb>.macher-os.de` im Eingang (kopierbar, ehrlich „Nach Verbinden aktiv“). Server-Eingang `POST /api/eingang/email` für Resend Inbound und Postmark Inbound: Betrieb aus der Empfängeradresse, Kunde erkennen (E-Mail inkl. Ansprechpartner, sonst Telefonnummer aus der Signatur) oder anlegen, Anfrage-Auftrag (Phase `anfrage`, Quelle E-Mail, fortlaufende Nummer) + eingehende Nachricht. **Dubletten**: gleiche Message-ID → ignoriert; Antwort zu offener Anfrage desselben Kunden mit gleichem Betreff (14 Tage) → nur Nachricht an die bestehende Anfrage. | `api/eingang/{email.ts,_logik.ts}`, `src/modules/eingang/Eingang.tsx` |
| 6 | **„Wir sind unterwegs“**: bei Losfahren (Status `unterwegs`) bzw. `einsatz.gestartet`, je Termin genau einmal. Mit Backend automatisch über `cloud().senden` (SMS bevorzugt, sonst E-Mail; Link zum Kundenbereich, falls vorhanden), Vermerk an Termin und Auftrag, ausgehende Nachricht. Ohne Backend nur **Vorschlag** für den Monteur („SMS senden“ öffnet das SMS-Programm). Abschaltbar unter Automationen. Beispielkunden bekommen mit Backend nie eine echte Nachricht. Text ohne erfundene Ankunftszeit. | `src/modules/naechster-einsatz/unterwegs.ts` |
| 7 | **Messpunkt `aktivierung.erreicht`** als reine, getestete Funktion `aktivierung()`: innerhalb von 14 Tagen ab Einrichtung ≥ 3 Aufträge · ≥ 1 Auftrag mit versendeter Rechnung (jeder Auftrag startet als Anfrage) · ≥ 1 Zeit oder Foto/Notiz eines Monteurs/Azubis **am Auftrag** · ≥ 1 Rechnung versendet. Beispieldaten und Papierkorb zählen nie. Wird einmal gemessen (`messen('aktivierung.erreicht', { tage, auftraege })`). | `src/modules/eingang/aktivierung.ts` |

## Was nur mit Schlüsseln geht

- `SUPABASE_URL`/`VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: `/api/oeffentlich/lesen`, `/api/oeffentlich/aktion`, `/api/eingang/email`. Ohne → `501 { fehler: "nicht verbunden" }`, der Browser zeigt den lokalen Rückfall.
- Optional `EINGANG_WEBHOOK_SECRET` (neu): wenn gesetzt, muss der Webhook `?schluessel=…` oder Basic-Auth-Passwort mitschicken.
- Mail-Dienst: Inbound-Domain `*.macher-os.de` (MX) beim Anbieter einrichten und Webhook auf `/api/eingang/email` zeigen lassen.
- Echte SMS/E-Mail für „Wir sind unterwegs“ und echter Push: über die Cloud-Implementierung von `fundament`.

## Verträge für andere Pakete

- **fundament – `cloud().oeffentlichLesen(art, token)`**: liefert die *Sicht* (nicht die Zeile). Einfachste Umsetzung: `GET /api/oeffentlich/lesen?art=…&token=…` → `{ sicht }`. Die Sichten liegen als Sammlung `oeffentliche_sichten` (ID = Token, `{ art, token, gueltigBis, widerrufen, sicht }`) in `objekte`; Kundeneingaben als `oeffentliche_eingaben`. Beide Sammlungen müssen synchronisiert werden; die Server-Funktion prüft zusätzlich `oeffentliche_links`, falls dort eine Zeile zum Token steht (sonst reicht die Sicht). Sichten werden nur auf Chef/Büro-Geräten und nur bei `cloudAktiv()` geschrieben (nur bei Änderung, leise).
- **fundament – Push-Abo**: Der Service Worker ist unter `/` registriert (`navigator.serviceWorker.ready`). Erwartetes Push-JSON: `{ titel, text, pfad?, tag?, aktionen?: [{ aktion, label, payload? }] }` (auch `title`/`body`).
- **gewohnheit**: `/macher/hinweise?aktion=<id>&payload=<json>` auswerten (Aktion ausführen, dann Rückmeldung). Der Service Worker leitet nur dorthin; ausgeführt wird nichts ohne geöffnete App.
- **erstwert**: `portal.geoeffnet` mit `daten.quelle` – `lokal` heißt „im selben Browser geöffnet“ (z. B. Vorschau im Büro), kein Nachweis beim Kunden. Für den Aha-Moment nur `quelle === 'server'` zählen. Link mit `?bezug=angebote:<id>` versenden, dann landet der Vermerk auch am Angebot.

## Messpunkte

- `aktivierung.erreicht` `{ tage, auftraege }` – einmal je Betrieb.
- Event `portal.geoeffnet` (für `erstwert.dokument_geoeffnet`).

## Prüfung

- `npm ci && npx tsc -b && npx vitest run && npx vite build`: Typen und Build grün; **628 Tests, 627 grün**. Der eine rote Test (`autoplanung › plant am selben Tag nach dem Vortermin …`) schlägt auch auf dem Ausgangsstand ohne dieses Paket fehl (datumsabhängig) – nicht Teil dieses Pakets.
- Neue Tests: Aktivierung (7), Eingang (2), Service Worker (3), öffentliche Sicht/Eingaben (6), Terminbuchung öffentlich (3), „Wir sind unterwegs“ (5), Server-Logik Postfach (11) und öffentliche Links (4). Server-Funktionen zusätzlich mit `tsc --strict` geprüft.
- Playwright gegen `vite preview` (Build): 1440 px als Chef – Eingang mit Einträgen, Zähler in der Navigation, Postfach „Nach Verbinden aktiv“, Kundenbereich öffnen → am Kunden „zuletzt geöffnet“, unbekannter Link → ehrliche Fehlerseite. Manifest: Chromium meldet keine Manifest- und keine Installierbarkeitsfehler, Icons in den angegebenen Größen. 390 px als Monteur – genau 3 Tabs, kein Planen/Betrieb, kein Zähler, Erfassen öffnet Schnell-Erfassen, Losfahren → Vorschlag „Wir sind unterwegs“, **offline neu laden** zeigt die App mit Offline-Banner, tiefer Link `/erfassen` offline über den SPA-Rückfall. Keine Laufzeitfehler.

## Offene Punkte / Kernwünsche

- **`src/shell/struktur.ts` (außerhalb der Tabelle) um eine Zeile ergänzt**: Ansicht „Alles“ → Modul `eingang` als erste Ansicht des Ziels „Eingang“ (+ Suchbegriffe). Ohne diesen Eintrag schlägt `struktur.test.ts` fehl („jedes Modul hat genau einen Ort“). Bitte beim Zusammenführen übernehmen.
- **Kernwunsch `Cloud`**: `oeffentlichSenden(eingabe)` in den Vertrag aufnehmen; bis dahin ruft der Kundenbereich die eigene Server-Funktion `/api/oeffentlich/aktion` direkt (kein Fremdanbieter, kein Geheimnis im Browser).
- Postfach-Adresse aus dem Betriebsnamen (Slug). Bei Namensgleichheit zweier Betriebe sollte `betriebe` eine eindeutige Spalte `postfach` bekommen (Migration: fundament).
- Verarbeitung der Kundeneingaben läuft auf Chef/Büro-Geräten; arbeiten zwei Büro-Geräte gleichzeitig, ist eine doppelte Verarbeitung theoretisch möglich, bis der Server-Takt (`api/cron`) das übernimmt.
- Vercel: `vercel.json`-Rewrite greift erst nach dem Dateisystem, `/sw.js`, `/manifest.webmanifest`, `/icons/*` werden also ausgeliefert. Empfehlung an fundament: `Cache-Control: no-cache` für `/sw.js`.
- Die Monteur-Tabs gelten für die untere Navigation (Handy/Tablet). Am Desktop behält der Monteur die Seitenleiste – dort bleiben Geld (Recht `geld`) und Einstellungen (Recht `admin`) wie bisher über Rechte verborgen.
