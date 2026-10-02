# Backend verbinden – Schritt für Schritt

Ohne die Schlüssel unten läuft Macher OS wie bisher nur im Browser. Sobald `VITE_SUPABASE_URL` und
`VITE_SUPABASE_ANON_KEY` gesetzt sind, schaltet die App automatisch auf Cloud um: Konto ohne Passwort,
Team auf mehreren Geräten, echter Versand, Push, öffentliche Links und Dateien.
Jeder Dienst ist einzeln zuschaltbar – fehlt ein Schlüssel, antwortet die zugehörige Server-Funktion mit
`501 { fehler: "nicht verbunden" }` und die App nutzt den lokalen Rückfall (z. B. eigenes Mail-Programm).

Dauer: etwa 45 Minuten. Du brauchst Zugang zu Vercel (Projekt `macher-os-app`) und zum DNS deiner Domain.

---

## 1. Supabase-Projekt anlegen (Datenbank, Anmeldung, Dateien)

1. Auf <https://supabase.com> ein Konto anlegen → **New project**.
   - Name: `macher-os`
   - Region: **Central EU (Frankfurt) – eu-central-1**
   - Starkes Datenbank-Passwort setzen und im Passwort-Manager ablegen.
2. **Project Settings → API**: notieren
   - `Project URL` → wird `VITE_SUPABASE_URL`
   - `anon public` → wird `VITE_SUPABASE_ANON_KEY` (darf in den Browser)
   - `service_role` → wird `SUPABASE_SERVICE_ROLE_KEY` (**geheim**, nur Server)
3. **SQL Editor → New query**: Inhalt von `os/supabase/migrations/20261002000000_fundament.sql` einfügen → **Run**.
   (Alternativ mit der Supabase-CLI: `cd os && supabase link --project-ref <ref> && supabase db push`.)
   Das legt Tabellen, Zugriffsregeln (RLS: nur Mitglieder des eigenen Betriebs), Realtime für `objekte`
   und den Speicher-Bucket `dateien` an.
4. Prüfen: **Database → Replication**: Tabelle `objekte` ist in `supabase_realtime` aktiv.
   **Storage**: Bucket `dateien` ist da.

## 2. Anmeldung ohne Passwort einstellen

**Authentication → URL Configuration**
- Site URL: `https://<deine-app-domain>` (z. B. `https://app.macher-os.de`)
- Redirect URLs: `https://<deine-app-domain>/**` und für Vorschau-Deployments `https://*-<vercel-team>.vercel.app/**`

**Authentication → Providers → Email**: aktiv lassen, „Confirm email“ an.
**Authentication → Email Templates → Magic Link**: den Code mitschicken, damit die Anmeldung auch in der
installierten App klappt (der Link öffnet sonst im Browser):

```html
<h2>Dein Anmeldelink für Macher OS</h2>
<p><a href="{{ .ConfirmationURL }}">Jetzt anmelden</a></p>
<p>Oder gib diesen Code in der App ein: <strong>{{ .Token }}</strong></p>
```

**E-Mail-Versand der Anmeldung über Resend** (der eingebaute Versand von Supabase ist stark begrenzt):
**Project Settings → Authentication → SMTP Settings** → Enable custom SMTP
- Host `smtp.resend.com`, Port `465`, Benutzer `resend`, Passwort = dein `RESEND_API_KEY` (Schritt 3)
- Absender: dieselbe Adresse wie `EMAIL_ABSENDER`, Name „Macher OS“

**Authentication → Providers → Phone**: aktivieren. Als SMS-Anbieter nichts eintragen – stattdessen den Hook nutzen,
damit nur ein SMS-Anbieter nötig ist:
**Authentication → Hooks → Send SMS hook** → Typ **HTTPS**, URL `https://<deine-app-domain>/api/cloud/auth-sms`
→ **Generate secret** → den Wert (`v1,whsec_…`) als `SUPABASE_SMS_HOOK_SECRET` notieren.

## 3. E-Mail-Versand: Resend

1. Konto auf <https://resend.com> anlegen, Region **EU (Frankfurt)** wählen, falls angeboten.
2. **Domains → Add domain**, z. B. `mail.macher-os.de`. Die angezeigten DNS-Einträge (SPF, DKIM, ggf. MX)
   bei deinem DNS-Anbieter eintragen und warten, bis die Domain „Verified“ ist.
3. **API Keys → Create** (Berechtigung „Sending access“) → `RESEND_API_KEY`.
4. Absenderadresse festlegen, z. B. `post@mail.macher-os.de` → `EMAIL_ABSENDER`.
   Der Anzeigename ist automatisch der Name des Betriebs, Antworten gehen an die E-Mail des Betriebs.

## 4. SMS-Versand

Standard ist **seven.io** (deutscher Anbieter, Server in Deutschland):
1. Konto auf <https://www.seven.io> anlegen, Guthaben aufladen.
2. **Developer → API Keys** → Schlüssel erzeugen → `SMS_API_KEY`.
3. `SMS_ABSENDER`: höchstens 11 Zeichen ohne Leerzeichen, z. B. `MacherOS`.

Anderer Anbieter? Solange er „POST mit JSON `{ to, from, text }`“ versteht, reichen zusätzlich
`SMS_API_URL`, `SMS_API_HEADER` (Name der Schlüssel-Kopfzeile, z. B. `Authorization`) und `SMS_API_PRAEFIX` (z. B. `Bearer `).

## 5. Push-Benachrichtigungen (Web-Push)

Einmal auf deinem Rechner im Ordner `os` ausführen:

```sh
npx web-push generate-vapid-keys
```

- `Public Key` → **zweimal** eintragen: `VAPID_PUBLIC_KEY` und `VITE_VAPID_PUBLIC_KEY`
- `Private Key` → `VAPID_PRIVATE_KEY` (geheim)
- `VAPID_SUBJECT` → `mailto:post@macher-os.de` (Kontakt für die Push-Dienste)

Am iPhone funktioniert Push nur, wenn die App über „Teilen → Zum Home-Bildschirm“ installiert ist (ab iOS 16.4).
Hat ein Mitarbeiter kein Gerät mit Push, geht die Nachricht als E-Mail raus (wenn Resend verbunden ist).

## 6. Weitere Schlüssel

- `CRON_SECRET`: zufälliger Wert, z. B. `openssl rand -hex 32`. Vercel schickt ihn bei jedem Cron-Aufruf mit;
  ohne ihn läuft kein Cron.
- `APP_URL`: öffentliche Adresse der App, z. B. `https://app.macher-os.de` (für Links in E-Mails/SMS).
- Andere Pakete: `ANTHROPIC_API_KEY` (KI-Erkennung), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Bezahlen).

## 7. In Vercel eintragen (Projekt `macher-os-app`)

1. <https://vercel.com> → Projekt **macher-os-app** → **Settings → General**: Root Directory = `os`.
2. **Settings → Environment Variables** → jede Variable einzeln anlegen, Umgebungen **Production** und **Preview**
   anhaken (für Preview gern ein eigenes Supabase-Projekt nehmen):

| Variable | Woher | Im Browser sichtbar? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → API → Project URL | ja (öffentlich) |
| `VITE_SUPABASE_ANON_KEY` | Supabase → API → anon public | ja (öffentlich, durch RLS geschützt) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role | **nein – geheim** |
| `SUPABASE_SMS_HOOK_SECRET` | Supabase → Auth → Hooks | nein |
| `RESEND_API_KEY` | Resend → API Keys | nein |
| `EMAIL_ABSENDER` | deine verifizierte Absenderadresse | nein |
| `SMS_API_KEY`, `SMS_ABSENDER` | seven.io | nein |
| `VAPID_PUBLIC_KEY` / `VITE_VAPID_PUBLIC_KEY` | `web-push generate-vapid-keys` | Public Key ja |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `web-push generate-vapid-keys` | nein |
| `CRON_SECRET` | selbst erzeugt | nein |
| `APP_URL` | deine Domain | nein |

3. **Deployments → … → Redeploy**. Wichtig: `VITE_*`-Werte werden beim Bauen eingesetzt – nach jeder Änderung
   an ihnen neu deployen.
4. Vercel-Tarif: Für alle Server-Funktionen aller Pakete und Crons, die öfter als einmal täglich laufen
   (z. B. Tagesbrief), braucht es **Vercel Pro**. Der Cron `/api/cron/taeglich` läuft täglich um 03:17 UTC.

## 8. Prüfen, ob alles läuft

1. App öffnen → **Heute → Braucht dich**: „Daten sichern & Team einladen“ erscheint (nur Chef/Büro).
2. Darauf tippen → Handynummer eingeben → SMS-Code kommt → anmelden.
   Danach zeigt **Konto** „Gesichert“. In Supabase → Table Editor → `objekte` stehen deine Daten.
3. Zweites Gerät / Inkognito-Fenster: unter `/anmelden` mit derselben Nummer anmelden → gleiche Daten.
   Eine Änderung auf einem Gerät erscheint nach wenigen Sekunden auf dem anderen.
4. Team: einen Mitarbeiter einladen (Setup/Team) → er bekommt eine SMS mit `/beitreten/…` → nach der Anmeldung
   sieht er den Betrieb, „ich“ ist automatisch er.
5. Angebot per E-Mail senden → kommt mit Betriebsname als Absender an. Link im Mail öffnen → im Zeitstrahl
   erscheint „Kunde hat den Link aus der E-Mail geöffnet“.
6. **Konto → Benachrichtigungen einschalten** → Gerät erscheint in der Liste.
7. Cron von Hand testen: `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/taeglich`.

Fehlersuche: Vercel → Projekt → **Logs** (Server-Funktionen), Supabase → **Logs** (Auth/DB).
Eine Server-Funktion mit `501 nicht verbunden` heißt: der zugehörige Schlüssel fehlt oder ist leer.

## Lokal ohne Supabase prüfen

```sh
cd os
npm install
npx tsc -b && npx tsc -p api && npx vitest run && npx vite build
# Migration gegen ein lokales PostgreSQL: siehe supabase/tests/README.md
```
