# R1 · Paket `bezahlen` (Paid)

Ziel: Bezahlen ist eine Formalität – ein Preis je Betrieb nach Teamgröße, alles drin, 30 Tage testen ohne Zahlungsdaten,
SEPA zuerst, nie Datenverlust.

## Was gebaut ist

### App – Modul `abo` (`src/os/modules/abo/**`, im Browser unter `/os/betrieb/abo`)

- **„Dein Plan“** unter `/betrieb/abo`, erreichbar über Betrieb › Unternehmen › Einstellungen (Ansicht „Betrieb“),
  das Modulverzeichnis, die Suche („Plan“, „Abo“, „bezahlen“, „kündigen“, „SEPA“ …) und die Hinweise.
  Eine Seite, drei Blöcke, eine Hauptaktion je Zustand:
  1. **Plan:** aus den aktiven Mitarbeitern vorgewählt (ohne Papierkorb/Beispiele, mindestens 1), Preis, Testphase bis …,
     nächste Abbuchung mit Betrag, Zahlweise monatlich/jährlich, Bilanz „Seit dem Start: …“, „Alles drin“, Kennzeichnung „vorläufig“.
  2. **Zahlungsart & Rechnungen:** SEPA/Karte mit letzten Ziffern, höchstens 3 Rechnungen mit PDF, „Alle Rechnungen“/„Ändern“ über das Stripe-Kundenportal.
  3. **Kündigen:** 2 Klicks („Plan kündigen“ → Dialog mit freiwilliger, ehrlicher Grund-Frage → „Kündigen“), Kündigung zurücknehmbar.
  Hauptaktion: Test/Lesemodus „Plan buchen“ · Zahlung offen „Zahlungsart ändern“ · gekündigt „Kündigung zurücknehmen“ · Team gewachsen „Plan anpassen“ (fragt vorher).
- **Reine, getestete Regeln** (`regeln.ts`, `regeln.test.ts`): Planwahl nach Teamgröße, Preise, Testphase
  (30 Tage ab Einrichtung, Tag 0 = Einrichtung, Tag 30 = letzter Testtag), Zustände `test | aktiv | zahlung_offen | lesemodus | gekuendigt`,
  Mahnstufen (Tag 0/5/10), 14 Tage Kulanz, Lesemodus-Regeln, Wertspitzen, Bilanz.
- **Lesemodus** (`stand.ts` → `lesemodusEinhaengen()` in `init`) über `setzeSchreibschutz`:
  - gesperrt: Neues anlegen und Ändern in allen Fachsammlungen;
  - immer frei: `ereignisse`, `einstellungen`, `benachrichtigungen`, `erledigungen`, `hinweise`, `chat`, `portalzugaenge`;
  - laufende Vorgänge frei: `zahlungen`, `mahnungen`, `nachrichten`;
  - **ändern ja, anlegen nein:** `rechnungen`, `angebote`, `auftraege`, `termine` – so laufen Kundenbereich
    (Angebot annehmen, Termin bestätigen, Nachricht schreiben) und offene Rechnungen (bezahlt markieren, mahnen) weiter;
  - Export/Sicherung (`exportieren`, `importieren`) ist nie betroffen.
  - Event **`abo.lesemodus`** `{ grund, planId }` einmal beim Wechsel.
- **Globale Meldung** `LesemodusMeldung` (`global`): fängt `SchreibGesperrt` aus `error`/`unhandledrejection`
  (React 19 meldet Fehler aus Event-Handlern über `reportError`), zeigt „Gerade nur lesen“ mit **„Plan wählen“** → `/betrieb/abo`.
  Kein Banner auf jedem Screen.
- **Wertspitzen-Hinweise** über die Hinweis-Registry (nur Chef): Tag 21 (Gewicht 35), Tag 27 (50), Tag 30 (70, „letzter Testtag“),
  Titel mit echten Zahlen aus den eigenen Daten („Seit dem Start: 2 Angebote, 2 Rechnungen, 760 € bezahlt“ – ohne Beispiele,
  Entwürfe, Stornos). Ohne eigene Zahlen nur „Noch N Tage Testphase“ – nichts Erfundenes. Dazu Hinweise für Lesemodus (85),
  Zahlung offen Stufe 1–3 (45/60/80) und „Team gewachsen/kleiner – passender Plan“ (40, Preis ändert sich erst nach Zustimmung).
- `kurzinfo` für die Betrieb-Kachel (Lesemodus/Abbuchung offen als „Aufmerksamkeit“).
- **Zeit simulieren:** Einstellung `abo.versatzTage` (Zahl) verschiebt „heute“ für den Plan.

### Server – Route Handler `src/app/api/abo/*/route.ts` (Node, `fetch` statt SDKs; Helfer in `src/app/api/abo/_lib/`)

| Datei | Zweck |
|---|---|
| `stand` (GET) | `betriebe.plan`/`test_bis` (fehlt `test_bis`: 30 Tage ab `erstellt_am`, einmal gespeichert) + aus Stripe: nächste Abbuchung, Betrag, Zahlweise, Zahlungsart, Rechnungen |
| `checkout` (POST) | Kunde = Betrieb (`betriebe.stripe_kunde`). Plan aus `objekte` (aktive Mitarbeiter) – nicht aus dem Browser. Ohne laufendes Abo: Stripe Checkout `mode=subscription`, `payment_method_types=[sepa_debit, card]`, Rechnungsadresse, USt-IdNr. Mit laufendem Abo: Planwechsel mit `proration_behavior=create_prorations`. Stripe-Preise werden je Plan/Zahlweise/Betrag über `lookup_key` `macher-os-<plan>-<monat|jahr>-<cent>` beim ersten Mal angelegt (eine Quelle: `plaene.ts`). |
| `portal` (POST) | `portal` → Stripe-Kundenportal (Zahlungsart, Rechnungen) · `kuendigen` → `cancel_at_period_end` + `cancellation_details` (Grund) · `fortsetzen` |
| `webhook` (POST) | Signaturprüfung (HMAC-SHA256, 5 min Toleranz, zeitkonstanter Vergleich). Setzt `betriebe.plan`/`stripe_kunde`: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed` (Stufe 1 + E-Mail), `invoice.paid` (Rechnung + E-Rechnung per E-Mail, Kopie an den Steuerberater) |
| `erinnern` (GET, Cron täglich 8:00 laut `vercel.json`) | Stufe 2 (Tag 5) und 3 (Tag 10) per E-Mail; geschützt mit `CRON_SECRET` |
| `_lib/gemeinsam.ts`, `_lib/erinnern.ts`, `_lib/signatur.ts`, `_lib/rechnung.ts` | Helfer (privater Ordner, keine Routen) |

**Kodierung in `betriebe.plan`** (Datenvertrag bleibt unverändert): `test` · `<planId>` · `<planId>:zahlung_offen:<YYYY-MM-DD>` ·
`<planId>:gekuendigt:<letzter Tag>` · `lesemodus`. Der Lesemodus nach 14 Tagen Kulanz und nach Kündigungsende wird daraus
berechnet – dafür muss niemand schreiben.

Ohne Schlüssel antworten alle mit `501 { fehler: "nicht verbunden" }`. Die App zeigt dann ehrlich
**„Bezahlen wird gerade eingerichtet.“** – in der Testphase mit „Du kannst weiter testen – noch N Tage. Wir verlängern nichts
heimlich und buchen nichts ab.“, im Lesemodus mit „Bis dahin bleibt alles lesbar und exportierbar.“ Auch 404/HTML
(lokale Entwicklung, statisches Hosting) gilt als „nicht verbunden“.

### Website

- `src/content/preise.ts` liest Namen, Grenzen, Preise und Testtage aus **`src/os/modules/abo/plaene.ts`** – der gemeinsamen
  Quelle für Website, App und Stripe. Die Website ergänzt nur Texte. `preiseVorlaeufig` steuert die Kennzeichnung.
- `src/app/(marketing)/preise/`: „Ein Preis für deinen Betrieb. Alles drin.“, Rechner „Wie viele Leute arbeiten bei euch?“
  (gleiche Regel wie die App, markiert den passenden Plan), Zahlweise monatlich/jährlich, Badge **„Vorläufig“** und Hinweis an
  jedem Preis, „Alles drin. Ohne Aufpreis.“, Ablauf (30 Tage ohne Zahlungsdaten → Plan in einem Schritt, SEPA/Karte →
  monatlich kündbar, Daten bleiben lesbar), Wechselservice, Kunden-Beispiele, neue FAQ. Vergleichstabelle, Wegweiser und
  Zusatzleistungen (Funktions-Unterschiede bzw. Zusatzmodule) sind von der Preisseite entfernt.
- Gleiche Planbezeichnungen und Grenzen: Solo (1–2) · Team (bis 10) · Betrieb (bis 30) · Unternehmen (ab 31, auf Anfrage).

## Messpunkte

| Ereignis | Wo | Daten |
|---|---|---|
| `bezahlen.gestartet` | App, Klick „Plan buchen“/„Plan anpassen“ | `plan`, `intervall`, `status` |
| `bezahlen.fertig` | App bei Rückkehr aus dem Checkout; **Server** im Webhook (`quelle: 'stripe'`, maßgeblich für „abgeschlossen/begonnen“) | `plan` |
| `bezahlen.gekuendigt` | App nach erfolgreicher Kündigung | `plan`, `grund` |

## Was nur mit Schlüsseln geht

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL` (bzw. `SUPABASE_URL`).
Optional: `RESEND_API_KEY` + `ABO_ABSENDER` (Zahlungserinnerungen), `STRIPE_AUTOMATISCHE_STEUER=1` (Stripe Tax), `CRON_SECRET`.
In Stripe: Webhook auf `/api/abo/webhook` mit den Ereignissen oben; Kundenportal aktivieren (Zahlungsart, Rechnungen);
SEPA-Lastschrift im Dashboard freischalten.

## Lesemodus nur mit Bezahlmöglichkeit

Der Lesemodus wird nur durchgesetzt, wenn Bezahlen wirklich möglich ist – also wenn der Stand vom Server kommt
(Konto + Stripe verbunden). Ohne Bezahlmöglichkeit (heute live: kein Konto, keine Schlüssel) sperren wir niemanden aus:
„Dein Plan“ zeigt offen „Testphase vorbei – Bezahlen wird gerade eingerichtet, bis dahin arbeitest du ganz normal weiter.
Wir verlängern nichts im Hintergrund und buchen nichts ab.“ `test_bis` bleibt unverändert. Sobald Bezahlen verbunden ist,
greift der Lesemodus nach Ablauf sofort. Das löst auch die Frage nach bestehenden lokalen Betrieben (Einrichtung > 30 Tage).

## E-Rechnung und Steuerberater

Nach jeder bezahlten Stripe-Rechnung (`invoice.paid`) geht eine E-Mail an den Betrieb, in Kopie an die Steuerberater-Adresse
aus dem DATEV-Modul (`datev.steuerberater`), mit PDF-Link und **XRechnung 3.0** im Anhang. Die XRechnung baut derselbe Baustein
wie in der App: `xrechnungAus` liegt dafür jetzt in `src/os/modules/rechnungen/xrechnung-xml.ts` (ohne Datenschicht, damit der
Server ihn nutzen kann); `xrechnung.ts` exportiert ihn unverändert weiter. Der Rechnungssteller (Macher OS) kommt aus
`ABO_RECHNUNGSSTELLER` – ohne ihn keine XRechnung, Firmendaten erfinden wir nicht.

## Schlüssel (Vercel, Projekt `macher-os`)

Pflicht für Bezahlen: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL` (oder `SUPABASE_URL`).
Optional: `RESEND_API_KEY` + `ABO_ABSENDER` (Erinnerungen, Rechnungsmails), `ABO_RECHNUNGSSTELLER` als JSON
`{"name","strasse","plz","ort","email","ustId" oder "steuernummer","telefon","iban"}` (E-Rechnung), `CRON_SECRET` (Erinnerungslauf),
`STRIPE_AUTOMATISCHE_STEUER=1` (Stripe Tax). In Stripe: Webhook auf `https://<domain>/api/abo/webhook` mit
`checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.payment_failed`, `invoice.paid`;
Kundenportal aktivieren; SEPA-Lastschrift freischalten. Stand beim Livegang: keine dieser Variablen gesetzt → alle
Route Handler antworten 501, die App sagt ehrlich „Bezahlen wird gerade eingerichtet“.

## Geprüft

- Wurzelprojekt: `npm run typecheck`, `npm test` (641/641), `npm run lint` (0 Fehler), `npm run build` grün.
  Neu: `regeln.test.ts` (15), `stand.test.ts` (5, Lesemodus gegen die echte Datenschicht inkl. „ohne Bezahlmöglichkeit keine Sperre“),
  `webhook.test.ts` (4: Signatur, Stripe-Formular, XRechnung aus Stripe-Rechnung). Server-Import unter Node geprüft (Webhook ohne Schlüssel → 501).
- Playwright gegen `next start` bei **390 und 1440 px**: Beispielbetrieb → „Dein Plan“ in der Testphase → „Plan buchen“ →
  echte 501 → „Bezahlen wird gerade eingerichtet“ → `abo.versatzTage = 21` → „Seit dem Start: …“ in „Braucht dich“ →
  `abo.versatzTage = 31` ohne Bezahlmöglichkeit: Hinweis „Testphase vorbei“, Kunde anlegen klappt → Stand „vom Server“:
  Kunde anlegen → „Gerade nur lesen“ → „Plan wählen“ → „Dein Plan“ im Lesemodus, Kunde nicht angelegt, Daten vollständig.
  Website `/preise`, `/`, `/kontakt`: kein horizontaler Überlauf mehr bei 390 px (Header-Abstände), Rechner wählt bei 12 Leuten „Betrieb“.

## Erledigt aus der ersten Runde

- Struktur von `main` übernommen (App unter `/os`, Server als Route Handler, gemeinsame Quelle unter `src/os/modules/abo/plaene.ts`).
- Lesemodus ohne Bezahlmöglichkeit, bestehende Betriebe (siehe oben).
- E-Rechnung + Kopie an den Steuerberater.
- Cron für die Erinnerungsstufen 2/3 in `vercel.json`.
- Vercel-Laufzeit: Next bündelt die Route Handler, die Regeln kommen über den Alias `@modules/abo/regeln` (kein `.js`-Trick mehr).
- Website-Header ohne Überlauf bei 390 px.

## Offen (Entscheidung oder Zugang nötig)

- **Endgültige Preise:** in `src/os/modules/abo/plaene.ts` eintragen und `vorlaeufig: false` setzen – Website, App und Stripe folgen.
  Bis dahin steht überall „vorläufig“.
- **Schlüssel** (siehe oben) und Konto/Supabase aus dem Paket Fundament – erst dann ist Bezahlen live.
- **Kernwünsche** an Fundament: `cloud().token()`; RLS-Schreibsperre in `objekte`, wenn `betriebe.plan` den Lesemodus ergibt;
  `betriebe.plan` nur über die Service-Rolle schreibbar. An den Kern: `setzeSchreibschutz` mit Aktion (anlegen/ändern/löschen).

## Außerhalb des Pakets geändert

- `src/os/shell/struktur.ts`: `abo` als zweites Modul der Ansicht „Betrieb“ unter Einstellungen + Suchwörter (sonst schlägt `struktur.test.ts` fehl).
- `src/os/modules/rechnungen/xrechnung-xml.ts` (neu, aus `xrechnung.ts` herausgelöst, Verhalten unverändert).
- `src/components/layout/Header.tsx`: kleinere Abstände unter 640 px (Überlauf bei 390 px).
- `vercel.json`: Cron `/api/abo/erinnern`.
