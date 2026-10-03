# Backend verbinden – Schritt für Schritt

Ohne die Schlüssel unten läuft Handwerk OS (unter `/os`) wie bisher nur im Browser. Sobald `NEXT_PUBLIC_SUPABASE_URL` und
`NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt sind, schaltet die App automatisch auf Cloud um: Konto ohne Passwort,
Team auf mehreren Geräten, echter Versand, Push, öffentliche Links und Dateien.
Jeder Dienst ist einzeln zuschaltbar – fehlt ein Schlüssel, antwortet die zugehörige Server-Funktion mit
`501 { fehler: "nicht verbunden" }` und die App nutzt den lokalen Rückfall (z. B. eigenes Mail-Programm).

Dauer: etwa 45 Minuten. Du brauchst Zugang zu Vercel (Team „01 Peak Atlas Web“, Projekt `macher-os`) und zum DNS deiner Domain.
Server-Funktionen: `src/app/api/cloud/*`, `src/app/api/cron/*` und `src/app/api/takte/*` (Next.js Route Handler), Helfer in `src/server/cloud/`
(Takte: Planung und Server-Aktionen in `src/os/server/takte/`).

---

## 1. Supabase-Projekt anlegen (Datenbank, Anmeldung, Dateien)

1. Auf <https://supabase.com> ein Konto anlegen → **New project**.
   - Name: `macher-os`
   - Region: **Central EU (Frankfurt) – eu-central-1**
   - Starkes Datenbank-Passwort setzen und im Passwort-Manager ablegen.
2. **Project Settings → API**: notieren
   - `Project URL` → wird `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → wird `NEXT_PUBLIC_SUPABASE_ANON_KEY` (darf in den Browser)
   - `service_role` → wird `SUPABASE_SERVICE_ROLE_KEY` (**geheim**, nur Server)
3. **SQL Editor → New query**: nacheinander den Inhalt von
   `supabase/migrations/20261002000000_fundament.sql`, `supabase/migrations/20261002100000_aktivierung.sql`
   (eindeutiges Anfrage-Postfach je Betrieb), `supabase/migrations/20261002120000_rechte_und_dateien.sql` und
   `supabase/migrations/20261002180000_haertung.sql` (Härtung nach dem Supabase-Sicherheitscheck) und
   `supabase/migrations/20261003120000_partner_schnittstelle.sql` (Action API für HeyLotte, `docs/os/PARTNER-API.md`) einfügen → jeweils **Run**. (Alternativ mit der Supabase-CLI: `supabase link --project-ref <ref> && supabase db push`.)
   Das legt Tabellen, Zugriffsregeln (RLS: nur Mitglieder des eigenen Betriebs), Realtime für `objekte`
   den privaten Speicher `dateien` und die Rechte je Rolle an (Rechnungen, Zahlungen, Belege, Mahnungen und
   `mitarbeiter.kostensatz` lesen nur Chef und Büro – erweiterbar über die Tabellen `sammlung_rechte` und `feld_rechte`).
4. Prüfen: **Database → Replication**: Tabelle `objekte` ist in `supabase_realtime` aktiv.
   **Storage**: Bucket `dateien` ist da und **nicht** öffentlich.

## 2. Anmeldung ohne Passwort einstellen

**Authentication → URL Configuration**
- Site URL: `https://<deine-domain>/os` (z. B. `https://macher-os.de/os`)
- Redirect URLs: `https://<deine-domain>/os/**` und für Vorschau-Deployments `https://*-01-peak-atlas-web.vercel.app/os/**`

**Authentication → Providers → Email**: aktiv lassen, „Confirm email“ an.
**Authentication → Email Templates → Magic Link**: den Code mitschicken, damit die Anmeldung auch in der
installierten App klappt (der Link öffnet sonst im Browser):

```html
<h2>Dein Anmeldelink für Handwerk OS</h2>
<p><a href="{{ .ConfirmationURL }}">Jetzt anmelden</a></p>
<p>Oder gib diesen Code in der App ein: <strong>{{ .Token }}</strong></p>
```

**E-Mail-Versand der Anmeldung über Resend** (der eingebaute Versand von Supabase ist stark begrenzt):
**Project Settings → Authentication → SMTP Settings** → Enable custom SMTP
- Host `smtp.resend.com`, Port `465`, Benutzer `resend`, Passwort = dein `RESEND_API_KEY` (Schritt 3)
- Absender: dieselbe Adresse wie `EMAIL_ABSENDER`, Name „Handwerk OS“

**Authentication → Providers → Phone**: aktivieren. Als SMS-Anbieter nichts eintragen – stattdessen den Hook nutzen,
damit nur ein SMS-Anbieter nötig ist:
**Authentication → Hooks → Send SMS hook** → Typ **HTTPS**, URL `https://<deine-domain>/api/cloud/auth-sms`
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
3. `SMS_ABSENDER`: höchstens 11 Zeichen ohne Leerzeichen, z. B. `HandwerkOS`.

Anderer Anbieter? Solange er „POST mit JSON `{ to, from, text }`“ versteht, reichen zusätzlich
`SMS_API_URL`, `SMS_API_HEADER` (Name der Schlüssel-Kopfzeile, z. B. `Authorization`) und `SMS_API_PRAEFIX` (z. B. `Bearer `).

### 4b. WhatsApp Business (optional)

1. <https://business.facebook.com> → WhatsApp-Konto anlegen, Telefonnummer hinzufügen und bestätigen.
2. **developers.facebook.com → App → WhatsApp → API-Einrichtung**: `Phone number ID` → `WHATSAPP_NUMMER_ID`;
   einen **dauerhaften** Zugriffsschlüssel (System-Nutzer) erzeugen → `WHATSAPP_TOKEN`.
3. **Nachrichtenvorlage** anlegen (Kategorie „Utility“, Sprache Deutsch) mit genau einem Platzhalter, z. B.
   „{{1}}“. Nach der Freigabe den Namen als `WHATSAPP_VORLAGE` eintragen. Ohne Vorlage gehen nur Antworten
   innerhalb von 24 Stunden nach einer Kundennachricht raus.

Ohne diese Werte öffnet „Per WhatsApp senden“ wie bisher WhatsApp auf dem eigenen Handy.

## 5. Push-Benachrichtigungen (Web-Push)

Einmal auf deinem Rechner im Projektordner ausführen:

```sh
npx web-push generate-vapid-keys
```

- `Public Key` → **zweimal** eintragen: `VAPID_PUBLIC_KEY` und `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `Private Key` → `VAPID_PRIVATE_KEY` (geheim)
- `VAPID_SUBJECT` → `mailto:post@macher-os.de` (Kontakt für die Push-Dienste)

Am iPhone funktioniert Push nur, wenn die App über „Teilen → Zum Home-Bildschirm“ installiert ist (ab iOS 16.4).
Hat ein Mitarbeiter kein Gerät mit Push, geht die Nachricht als E-Mail raus (wenn Resend verbunden ist).

## 6. Weitere Schlüssel

- `CRON_SECRET`: zufälliger Wert, z. B. `openssl rand -hex 32`. Vercel schickt ihn bei jedem Cron-Aufruf mit;
  ohne ihn läuft kein Cron.
- `APP_URL`: öffentliche Adresse ohne `/os`, z. B. `https://macher-os.de` (für Links in E-Mails/SMS).
- `DATEI_GEHEIMNIS` (optional): zufälliger Wert für die Datei-Links. Wechselst du ihn, werden alle alten Datei-Links
  ungültig (Notbremse). Ohne ihn wird ein Wert aus dem Service-Key abgeleitet.
- Andere Pakete: `ANTHROPIC_API_KEY` (KI-Erkennung), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Bezahlen).

## 7. In Vercel eintragen (Projekt `macher-os`)

1. <https://vercel.com> → Team **01 Peak Atlas Web** → Projekt **macher-os** (Website und Software, Software unter `/os`) → **Settings → General**:
   Root Directory leer (Wurzel des Repos), Framework **Next.js**. Das frühere Projekt `macher-os-app` wird nicht mehr gebraucht.
2. **Settings → Environment Variables** → jede Variable einzeln anlegen, Umgebungen **Production** und **Preview**
   anhaken (für Preview gern ein eigenes Supabase-Projekt nehmen):

| Variable | Woher | Im Browser sichtbar? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API → Project URL | ja (öffentlich) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → anon public | ja (öffentlich, durch RLS geschützt) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role | **nein – geheim** |
| `SUPABASE_SMS_HOOK_SECRET` | Supabase → Auth → Hooks | nein |
| `RESEND_API_KEY` | Resend → API Keys | nein |
| `EMAIL_ABSENDER` | deine verifizierte Absenderadresse | nein |
| `SMS_API_KEY`, `SMS_ABSENDER` | seven.io | nein |
| `VAPID_PUBLIC_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `web-push generate-vapid-keys` | Public Key ja |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `web-push generate-vapid-keys` | nein |
| `WHATSAPP_TOKEN`, `WHATSAPP_NUMMER_ID`, `WHATSAPP_VORLAGE` | Meta (Schritt 4b) | nein |
| `EINGANG_WEBHOOK_SECRET` | selbst erzeugt (optional, sichert `/api/eingang/email` ab) | nein |
| `NEXT_PUBLIC_BELEGE_EMAIL_AKTIV` | `1`, sobald der E-Mail-Eingang für Belege eingerichtet ist (`docs/os/BELEGE-EMAIL.md`) | ja |
| `CRON_SECRET` | selbst erzeugt | nein |
| `DATEI_GEHEIMNIS` | selbst erzeugt (optional) | nein |
| `TAKTE_GEHEIMNIS` | selbst erzeugt (optional, sonst `CRON_SECRET`) – signiert die Knöpfe in Takt-Mitteilungen | nein |
| `APP_URL` | deine Domain | nein |

3. **Deployments → … → Redeploy**. Wichtig: `NEXT_PUBLIC_*`-Werte werden beim Bauen eingesetzt – nach jeder Änderung
   an ihnen neu deployen.
4. Vercel-Tarif: Für alle Server-Funktionen aller Pakete und Crons, die öfter als einmal täglich laufen
   (z. B. Tagesbrief), braucht es **Vercel Pro**. Der Cron `/api/cron/taeglich` läuft täglich um 03:17 UTC.
5. Takte (`/api/takte/cron`): Vercel Hobby erlaubt nur tägliche Crons – deshalb steht in `vercel.json`
   `"schedule": "30 4 * * *"` (04:30 UTC = 6:30 Uhr Sommerzeit). Die feinen Zeiten (Dein Tag 6:30, Tagesbrief 7:00,
   Zeiten bestätigen 16:30, Wochenbilanz Fr 15:00) plant bis dahin der Browser-Planer, solange Handwerk OS offen ist;
   Browser und Server teilen sich „zuletzt zugestellt“, nichts kommt doppelt. **Mit Vercel Pro** den Zeitplan auf
   `"*/15 * * * *"` stellen – dann stellt der Server alle Takte pünktlich zu, auch wenn niemand die App offen hat.

## 8. Prüfen, ob alles läuft

1. `https://<deine-domain>/os` öffnen → **Heute → Braucht dich**: „Daten sichern & Team einladen“ erscheint (nur Chef/Büro).
2. Darauf tippen → Handynummer eingeben → SMS-Code kommt → anmelden.
   Danach zeigt **Konto** „Gesichert“. In Supabase → Table Editor → `objekte` stehen deine Daten.
3. Zweites Gerät / Inkognito-Fenster: unter `/os/anmelden` mit derselben Nummer anmelden → gleiche Daten.
   Eine Änderung auf einem Gerät erscheint nach wenigen Sekunden auf dem anderen.
4. Team: einen Mitarbeiter einladen (Setup/Team) → er bekommt eine SMS mit `/os/beitreten/…` → nach der Anmeldung
   sieht er den Betrieb, „ich“ ist automatisch er.
5. Angebot per E-Mail senden → kommt mit Betriebsname als Absender an. Link im Mail öffnen → im Zeitstrahl
   erscheint „Kunde hat den Link aus der E-Mail geöffnet“.
6. Profil (oben rechts) → **Konto & Geräte → Benachrichtigungen einschalten** → Gerät erscheint in der Liste.
7. Cron von Hand testen: `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/taeglich`.
   Takte ohne Versand: `curl -H "Authorization: Bearer $CRON_SECRET" "https://<domain>/api/takte/cron?trocken=1"`.

Fehlersuche: Vercel → Projekt → **Logs** (Server-Funktionen), Supabase → **Logs** (Auth/DB).
Eine Server-Funktion mit `501 nicht verbunden` heißt: der zugehörige Schlüssel fehlt oder ist leer.

## Lokal ohne Supabase prüfen

```sh
npm install
npm run typecheck && npm test && npm run build
# Migrationen gegen ein lokales PostgreSQL: siehe supabase/tests/README.md
```

## Bankverbindung und Webhooks (Integration Hub)

Ohne diese Schritte funktioniert der Zahlungsabgleich weiter über den Datei-Import (CAMT.053 oder CSV unter
**Betrieb → Zahlungen → Kontoauszug importieren**). Handwerk OS baut keine eigene Bankanbindung und kein eigenes OAuth:
Die Anmeldung bei der Bank übernimmt ein Kontoinformationsdienst (Integrationspartner), der Umsätze per Webhook liefert.

**Bank-Eingang** (`POST /api/eingang/bank?betrieb=<betriebId>`)
1. Route anlegen: `src/app/api/eingang/bank/route.ts` mit
   `export { bankEingang as POST } from '@/os/server/bank-eingang'; export const dynamic = 'force-dynamic';`
2. `BANK_WEBHOOK_SECRET` erzeugen (`openssl rand -hex 32`) und in Vercel eintragen (geheim, nicht im Browser).
   Denselben Wert beim Integrationspartner als Signatur-Geheimnis hinterlegen.
3. Jede Lieferung trägt `x-macher-signatur: sha256=<HMAC-SHA256(Geheimnis, Inhalt)>`; ohne gültige Signatur → 401.
   Ohne Service-Key oder Geheimnis → `501 nicht verbunden`.
4. Inhalt: `{ "transaktionen": [{ "id", "datum", "betrag", "name", "iban", "zweck" }] }` – PSD2-Feldnamen
   (`transactionId`, `bookingDate`, `transactionAmount.amount`, `remittanceInformationUnstructured`, `debtorName`,
   `debtorAccount.iban`) werden ebenfalls erkannt. Nur Eingänge in Euro; Dubletten (gleiche ID) werden ignoriert.
5. Der Server legt jeden Umsatz als Objekt der Sammlung `bankumsaetze` (Status `neu`) an. Die App von Chef oder Büro
   gleicht ihn beim nächsten Abgleich automatisch ab (Automation „Zahlungseingänge den Rechnungen zuordnen“).
6. Empfehlung: `bankumsaetze` in `sammlung_rechte` wie `zahlungen` auf Chef und Büro beschränken (Migration).

Reine Logik und Tests: `src/os/server/bank.ts`, `src/os/server/signatur.ts` (`bank.test.ts`).

**Webhooks (ausgehend)** – eingerichtet unter **Betrieb → Einstellungen → Verbindungen → Webhooks**.
Die Oberfläche arbeitet gegen `WebhookQuelle` (`src/os/modules/schnittstellen/webhooks.ts`), Standard ist der
Adapter `kernQuelle` auf die Kern-Sammlungen `webhooks` und `webhook_auslieferungen` (`src/os/core/ereignisse.ts`).
Zustellung: POST mit JSON aus `webhookNutzlast()` (`{ id, type, event, created_at, source, actor, object, data }`),
Kopfzeilen `x-macher-ereignis` (API-Name, z. B. `invoice.paid`) und `x-macher-signatur`
(`webhookSignatur()` aus `src/os/server/signatur.ts`, Geheimnis je Webhook in der Einstellung
`schnittstellen.webhook-geheimnisse`). Die serverseitige Zustellung (`setzeWebhookVersender`, `webhooksZustellen`) ist noch
nicht verdrahtet – bis dahin zeigt die App „Wird zugestellt, sobald Handwerk OS mit der Cloud verbunden ist“.
Empfehlung: `webhooks`, `webhook_auslieferungen` und `ereignisprotokoll` in `sammlung_rechte` auf Chef und Büro beschränken.

## Partner-Schnittstelle (HeyLotte)

Action API unter `/v1/actions/<aktion>` mit eigenem Schlüssel je Betrieb – HeyLotte bekommt nie den Service-Key.
Einrichten, Aufruf, Ereignisse und Signatur: [`docs/os/PARTNER-API.md`](PARTNER-API.md). Braucht nur
`SUPABASE_SERVICE_ROLE_KEY` und die Migration `20261003120000_partner_schnittstelle.sql`; keine weitere Variable.
