# Bericht R1 – Paket „fundament“

Branch `claude/fervent-pascal-joztaz-fundament`. Grundlage: PRD Abschnitt 0 und 0.1, `os/PAKETE-AKTIVIERUNG.md`.

## Was gebaut ist

| Baustein | Dateien | Stand |
|---|---|---|
| Schema + RLS | `os/supabase/migrations/20261002000000_fundament.sql` | Datenvertrag aus PAKETE-AKTIVIERUNG.md, dazu `einladungen` und `versand`. RLS: nur Mitglieder des Betriebs (`ist_mitglied`), Betrieb umbenennen nur Chef, kein DELETE auf `objekte` (Grabstein statt Datenverlust). Funktionen `betrieb_anlegen` (Betrieb + Chef, nie ein zweiter Mandant aus Versehen) und `einladung_annehmen`. Trigger: „letzte Änderung gewinnt“ auch auf dem Server, `geaendert_am` = Serverzeit. Realtime für `objekte`. Bucket `dateien` (Ordner je Betrieb). Gegen PostgreSQL 16 mit Supabase-Attrappe geprüft: `os/supabase/tests/`. |
| Sync local-first | `os/src/core/sync.ts`, Anbindung in `os/src/core/db.ts` | API von `db` unverändert. Eigene Änderungen → Warteschlange (überlebt Neustart/Offline) → Upload in `objekte` (gebündelt, ≤ 1,5 MB je Anfrage). Empfang per Realtime + Nachladen „seit Stand“ (jede Minute als Sicherheitsnetz). Konflikt: Drei-Wege-Zusammenführung je Feld; gleiches Feld → letzte Änderung gewinnt, Zeitstrahl-Eintrag `sync.konflikt` mit beiden Werten. Beispieldaten (und ihr Zeitstrahl) bleiben lokal. Zurücksetzen/Import (Spielwiese) wird nie automatisch hochgeladen. Fremde Änderungen erzeugen keine Datenschicht-Events (keine doppelten Automationen auf mehreren Geräten); vom Server geschriebene fachliche Ereignisse (`portal.geoeffnet`, `dokument.geoeffnet`, `team.beigetreten`) kommen als Event an. |
| Cloud (Supabase) | `os/src/core/cloud-supabase.ts` | Implementiert den `Cloud`-Vertrag: Magic Link + 6-stelliger Code per E-Mail, SMS-Code per Handy; Konto; Einladen; Senden; Push; `oeffentlichLesen`; `dateiAblegen` in Storage (offline → Data-URL-Rückfall). Supabase-JS wird nur mit Schlüsseln nachgeladen (eigener Chunk). Konto wird gemerkt → offline sofort weiterarbeiten. |
| Übernahme | `cloud-supabase.ts` (`verbinden`, `sichern`) | Wer ohne Konto gestartet ist: Anmelden → Betrieb wird angelegt → alle Browser-Daten einmalig hochgeladen (Fortschritt sichtbar). Tritt ein Gerät einem bestehenden Betrieb bei, werden seine bisherigen Daten zuerst als Sicherung in IndexedDB abgelegt (herunterladbar) und nicht vermischt. |
| Server-Funktionen | `os/api/cloud/{senden,oeffnen,einladen,push,oeffentlich,messen,auth-sms}.ts`, Helfer `_lib.ts`, `_versand.ts`, `_push.ts` | Web-Standard-Handler (`export async function POST(req)`), nur `fetch`, Schlüssel aus `process.env`, ohne Schlüssel 501 „nicht verbunden“. E-Mail über Resend (Absender = Betrieb, Antwort an Betrieb), SMS generisch (Standard seven.io). Öffnen-Status: Link wird zu `/api/cloud/oeffnen?v=…`, erster Klick → `versand.geoeffnet_am` + Zeitstrahl `portal.geoeffnet { kundeId, bezug }` per Realtime an alle Geräte. Web-Push mit VAPID (`web-push`), abgemeldete Geräte werden entfernt, Rückfall E-Mail. `auth-sms` = Supabase „Send SMS Hook“ (Standard-Webhooks-Signatur), damit nur ein SMS-Anbieter nötig ist. |
| Cron | `os/api/cron/taeglich.ts`, `os/api/cron/_cron.ts`, `os/vercel.json` | Grundgerüst mit Aufgabenliste (Einladungen, Links, Messpunkte aufräumen), abgesichert mit `CRON_SECRET` (ohne → 501). `vercel.json`: Rewrite schließt jetzt `api/` aus, SPA-Rewrite bleibt; Cron täglich 03:17 UTC. |
| Messung | `cloud-supabase.ts` → `/api/cloud/messen` | `setzeMessziel` bündelt alle 5 s, Puffer bei Funkloch, schaltet sich bei 501 ab. Server nimmt nur Ereignisname + einfache Werte (gekürzt), optional zufällige Installations-ID (kein Personenbezug), ohne Anmeldung `betrieb_id = null`. |
| Modul `konto` | `os/src/modules/konto/` | `/macher/konto` (Konto & Geräte: Status „Gesichert/Wird gesichert/Offline/Klemmt“, Abmelden, Geräte mit Push, Sicherung herunterladen), Vollbild `/anmelden` (Rücksprung aus dem E-Mail-Link, neues Gerät) und `/beitreten/:token` (Einladung). Hinweis in „Braucht dich“: „Daten sichern & Team einladen“ (Chef/Büro, nur mit Schlüsseln, nur ohne Konto). Suche findet „Konto“, „Anmelden“, „Geräte“ … |
| Anleitung | `os/BACKEND.md` | Konten, Schlüssel, Supabase-Einstellungen (Redirects, Magic-Link-Vorlage mit Code, SMTP über Resend, SMS-Hook), Vercel-Variablen, Prüfliste. |

## Ohne Schlüssel

Nichts ändert sich: `konfigAusUmgebung()` liefert nichts → kein Konto-Modul, kein Supabase-Code geladen,
`cloud()` bleibt `LOKALE_CLOUD`, Messung bleibt lokal. Per Playwright geprüft (390 px): Beispielbetrieb einrichten,
Heute, Aufträge – keine Konsolenfehler; `/macher/konto` ist wie bisher „Seite nicht gefunden“.

Mit Schlüsseln (Supabase per Playwright-Routen nachgebildet) durchgeklickt: Hinweis erscheint → Handynummer →
Code → Betrieb angelegt → 334 Objekte hochgeladen, 0 Beispieldaten → „Gesichert“ → Neuladen: weiter angemeldet.

## Prüfen

- `npx tsc -b` ✓ · `npx tsc -p api` ✓ · `npx vite build` ✓
- `npx vitest run`: 639 von 640 grün. Rot ist `autoplanung.test.ts › plant am selben Tag nach dem Vortermin …` –
  schlägt auf dem Ausgangsbranch `claude/fervent-pascal-joztaz` genauso fehl (datumsabhängig, nicht dieses Paket).
- Neue Tests: `src/core/sync.test.ts` (12), `src/core/cloud-supabase.test.ts` (16), `api/cloud/api.test.ts` (25, inkl. Cron).
- SQL: `supabase/tests/rls-pruefung.sql` → „RLS-Prüfung bestanden“.

## Was nur mit Schlüsseln geht

Alles unter „Cloud“: Konto, Team auf mehreren Geräten, echter E-Mail-/SMS-Versand mit Öffnen-Status, Push,
Kundenbereich/Terminbuchung für echte Endkunden über `/api/cloud/oeffentlich`, Dateien in Storage, Messung am Server,
Cron. Reihenfolge und Werte: `os/BACKEND.md`.

## Messpunkte

Fundament misst selbst nur `team.beigetreten` (beim Annehmen einer Einladung, zusätzlich Event `team.beigetreten`).
Alle Messpunkte der anderen Pakete gehen über `messen()` automatisch an den Server, sobald Schlüssel gesetzt sind.
Auswertung: Tabelle `messpunkte` (nur mit Service-Role lesbar).

## Hinweise für die anderen Pakete

- **Öffnen-Status:** Wer `cloud().senden({ link, bezug })` nutzt, bekommt „Kunde hat geöffnet“ automatisch als
  Event `portal.geoeffnet { kundeId, bezug }` und als Zeitstrahl-Eintrag am `bezug` – auch wenn der Kunde auf seinem
  eigenen Handy öffnet. Der Kundenbereich im Browser des Kunden kann den Betrieb nicht direkt erreichen.
- **Kundenbereich/Terminbuchung (aktivierung):** `cloud().oeffentlichLesen('portal' | 'buchung', token)` liefert
  `{ betrieb, kunde, objekte: { auftraege, angebote, rechnungen, termine, dokumente, orte, anlagen } }` – nur Einträge
  mit der `kundeId`, ohne Beispieldaten und ohne Felder `notiz*`, `intern*`, `einkauf*`, `kosten*`, `marge*`, `lohn*`.
  Token-Quelle: `oeffentliche_links`, sonst `portalzugaenge` bzw. Einstellung `terminbuchung.links`. Wer mehr
  braucht, baut es unter `os/api/oeffentlich/**` und darf `api/cloud/_lib.ts` importieren.
- **Takte (gewohnheit):** `import { pushAnMitarbeiter } from '../cloud/_push.js'` und
  `import { cronErlaubt } from '../cron/_cron.js'`. Beim Zusammenführen den eigenen Cron in `os/vercel.json` ergänzen,
  z. B. `{ "path": "/api/takte/cron", "schedule": "*/15 * * * *" }` (braucht Vercel Pro; hier nicht eingetragen,
  damit ein Hobby-Deployment ohne die Datei nicht scheitert).
- **Setup:** `cloud().einladen(mitarbeiterId, { telefon })` schickt die SMS mit `/beitreten/<token>`; ist SMS nicht
  verbunden, öffnet sich das eigene SMS-Programm mit demselben Link (`status: 'geoeffnet'`). Die Rolle kommt aus dem
  Mitarbeiter-Objekt. Ein Link „Schon ein Konto? Anmelden“ im Onboarding sollte auf `/anmelden` zeigen.
- **Bezahlen:** `betriebe.plan`, `test_bis` (30 Tage ab Anlage), `stripe_kunde` sind da; nur der Server ändert sie.
- **Spielwiese:** `importieren`/`zuruecksetzen` werden nie hochgeladen; Beispieldaten (`beispiel: true`) auch nicht.

## Offene Punkte

- **Kernwunsch `struktur.ts`:** `konto` braucht einen Ort (Vorschlag: Heute › `kontext`). Bis dahin wird das Modul in
  `main.tsx` nur mit Schlüsseln registriert und heißt `modul.tsx` statt `index.tsx` (sonst schlägt
  `struktur.test.ts` fehl). Danach umbenennen und die Sonderregistrierung entfernen. Ein Eintrag „Konto“ im
  Profil-Menü (Avatar oben rechts, `Shell.tsx`) wäre der natürliche Einstieg.
- **Rechte je Rolle auf dem Server:** RLS trennt Betriebe sauber; innerhalb des Betriebs dürfen alle Mitglieder alle
  Objekte lesen/schreiben (die App blendet Geld usw. je Rolle aus). Feldgenaue Sperren (z. B. Lohn für Monteure)
  folgen als eigener Schritt.
- **Dateien** liegen in einem öffentlichen Bucket unter nicht erratbaren Pfaden (UUID); Auflisten ist gesperrt.
  Für sehr sensible Unterlagen später signierte URLs.
- **Einladung, wenn schon angemeldet:** `/beitreten/:token` nimmt die Einladung erst bei der nächsten Anmeldung an.
- **Bestehende Fotos als Data-URL** werden bei der Übernahme mit hochgeladen (in `objekte`); neue Dateien gehen in
  Storage. Ein späterer Umzug alter Data-URLs nach Storage spart Platz.
- **Realtime-Grenzen:** sehr große Zeilen kommen ggf. nicht per Realtime an – das minütliche Nachladen fängt das ab.
- **WhatsApp Business** ist noch nicht angebunden (Rückfall: `wa.me`-Link).
