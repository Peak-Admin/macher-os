# R1 · Paket `bezahlen` (Paid)

Ziel: Bezahlen ist eine Formalität – ein Preis je Betrieb nach Teamgröße, alles drin, 30 Tage testen ohne Zahlungsdaten,
SEPA zuerst, nie Datenverlust.

## Was gebaut ist

### App – Modul `abo` (`os/src/modules/abo/**`)

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

### Server – `os/api/abo/**` (Vercel Functions, `fetch` statt SDKs)

| Datei | Zweck |
|---|---|
| `stand.ts` (GET) | `betriebe.plan`/`test_bis` (fehlt `test_bis`: 30 Tage ab `erstellt_am`, einmal gespeichert) + aus Stripe: nächste Abbuchung, Betrag, Zahlweise, Zahlungsart, Rechnungen |
| `checkout.ts` (POST) | Kunde = Betrieb (`betriebe.stripe_kunde`). Plan aus `objekte` (aktive Mitarbeiter) – nicht aus dem Browser. Ohne laufendes Abo: Stripe Checkout `mode=subscription`, `payment_method_types=[sepa_debit, card]`, Rechnungsadresse, USt-IdNr. Mit laufendem Abo: Planwechsel mit `proration_behavior=create_prorations`. Stripe-Preise werden je Plan/Zahlweise/Betrag über `lookup_key` `macher-os-<plan>-<monat|jahr>-<cent>` beim ersten Mal angelegt (eine Quelle: `plaene.ts`). |
| `portal.ts` (POST) | `portal` → Stripe-Kundenportal (Zahlungsart, Rechnungen) · `kuendigen` → `cancel_at_period_end` + `cancellation_details` (Grund) · `fortsetzen` |
| `webhook.ts` (POST) | Signaturprüfung (HMAC-SHA256, 5 min Toleranz, zeitkonstanter Vergleich). Setzt `betriebe.plan`/`stripe_kunde`: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed` (Stufe 1 + E-Mail), `invoice.paid` |
| `erinnern.ts` (GET, Cron) | Stufe 2 (Tag 5) und 3 (Tag 10) per E-Mail; geschützt mit `CRON_SECRET` |
| `_gemeinsam.ts`, `_erinnern.ts` | Helfer (keine Routen) |

**Kodierung in `betriebe.plan`** (Datenvertrag bleibt unverändert): `test` · `<planId>` · `<planId>:zahlung_offen:<YYYY-MM-DD>` ·
`<planId>:gekuendigt:<letzter Tag>` · `lesemodus`. Der Lesemodus nach 14 Tagen Kulanz und nach Kündigungsende wird daraus
berechnet – dafür muss niemand schreiben.

Ohne Schlüssel antworten alle mit `501 { fehler: "nicht verbunden" }`. Die App zeigt dann ehrlich
**„Bezahlen wird gerade eingerichtet.“** – in der Testphase mit „Du kannst weiter testen – noch N Tage. Wir verlängern nichts
heimlich und buchen nichts ab.“, im Lesemodus mit „Bis dahin bleibt alles lesbar und exportierbar.“ Auch 404/HTML
(lokale Entwicklung, statisches Hosting) gilt als „nicht verbunden“.

### Website

- `src/content/preise.ts` liest Namen, Grenzen, Preise und Testtage aus **`os/src/modules/abo/plaene.ts`** – der gemeinsamen
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

## Geprüft

- `cd os && npm ci && npx tsc -b && npx vitest run && npx vite build`: tsc, Build grün; Tests 607/608 – der eine Fehlschlag
  (`autoplanung.test.ts › plant am selben Tag nach dem Vortermin …`) tritt **auch ohne dieses Paket** auf (vorbestehend, datumsabhängig).
  Neu: `regeln.test.ts` (14), `stand.test.ts` (4, Lesemodus gegen die echte Datenschicht), `webhook.test.ts` (3, Signatur + Stripe-Formular).
- `os/api/**` zusätzlich mit `tsc` gegen die App-Konfiguration typgeprüft.
- Website im Wurzelordner: `npm run lint` und `npm run build` grün.
- Playwright (Chromium) bei **390 und 1440 px**: Beispielbetrieb einrichten → „Dein Plan“ in der Testphase → „Plan buchen“
  ohne Server zeigt „Bezahlen wird gerade eingerichtet“ → Zeit per `abo.versatzTage = 21` → Hinweis „Seit dem Start: …“ in
  „Braucht dich“ → `abo.versatzTage = 31` → Kunde anlegen → Meldung „Gerade nur lesen“ → „Plan wählen“ → „Dein Plan“ im
  Lesemodus; der Kunde wurde nicht angelegt, alle Daten sind da, kein horizontaler Überlauf in der App.

## Kernwünsche / Änderungen außerhalb der Tabelle

1. **`os/src/shell/struktur.ts`** (2 Zeilen): `abo` als zweites Modul der Ansicht „Betrieb“ unter Einstellungen + Suchwörter.
   Ohne Eintrag schlägt `struktur.test.ts` fehl („Modul abo fehlt“), und es gäbe keinen Ort unter Betrieb › Einstellungen.
   Die Ansicht hat schon vier Wechsler-Punkte, deshalb kein fünfter.
2. **`setzeSchreibschutz`** bekommt nur den Sammlungsnamen. Für „ändern ja, anlegen nein“ hängt das Modul einen Vorschalter vor
   `create` der vier Sammlungen. Besser: Prüfer mit `(sammlung, aktion: 'anlegen' | 'aendern' | 'loeschen')`.
3. **Cloud-Vertrag ohne Token:** `api.ts` liest den Supabase-Zugangstoken aus dem `localStorage` (`sb-*-auth-token`).
   Besser: `cloud().token()` (Paket Fundament).
4. **Serverseitige Durchsetzung:** Der Lesemodus wird im Browser durchgesetzt; der zwischengespeicherte Stand liegt in der
   Einstellung `abo.stand`. Fundament sollte per RLS Schreiben in `objekte` (außer Systemsammlungen) sperren, wenn
   `betriebe.plan` den Lesemodus ergibt – und `betriebe.plan` nur über die Service-Rolle schreibbar machen.
5. **Cron:** Eintrag `{ "path": "/api/abo/erinnern", "schedule": "0 8 * * *" }` in `os/vercel.json` (Paket Fundament).

## Offene Punkte

- **Endgültige Preise** in `os/src/modules/abo/plaene.ts` eintragen und `vorlaeufig: false` setzen – Website und App folgen.
- **E-Rechnung / Rechnung an Steuerberater-Adresse:** Stripe-Rechnungen sind PDFs. XRechnung/ZUGFeRD und Kopie an den
  Steuerberater sind nicht gebaut (Stripe „invoice email recipients“ oder DATEV-Modul anbinden).
- **Bestehende lokale Betriebe**, deren Einrichtung > 30 Tage her ist, sind nach dem Update sofort im Lesemodus und können
  ohne Backend nicht bezahlen. Entscheidung nötig: Startdatum der Testphase = Einführung von Paid?
- **Stufen 2/3 per E-Mail** brauchen den Cron und `ABO_ABSENDER`; in der App erscheinen sie immer als Hinweis.
- **Vercel-Laufzeit:** Die Server-Funktionen importieren `../../src/modules/abo/regeln.js` (eine Quelle der Regeln). Beim
  ersten Deployment prüfen, dass Vercel die TS-Dateien außerhalb von `api/` mitbaut.
- **Website-Header (nicht dieses Paket):** bei 390 px 20 px horizontaler Überlauf auf allen Seiten durch das Menü-Icon
  (`DIV.ml-auto … lg:hidden`).
- Vercel-Hinweis: Im Vite-Dev-Server liefert `/api/abo/*` den Quelltext als Modul aus – nur lokal, die App wertet das als „nicht verbunden“.
