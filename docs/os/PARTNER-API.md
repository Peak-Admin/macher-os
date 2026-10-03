# Partner-Schnittstelle (Action API v1) – HeyLotte

> **HeyLotte versteht. Handwerk OS entscheidet und führt aus.**
> Zielbild und Prinzipien: [`docs/produkt/heylotte-architektur.md`](../produkt/heylotte-architektur.md).

HeyLotte (heylotte.ai) ist die Sprach- und WhatsApp-Oberfläche. Handwerk OS bleibt das System of Record: Daten,
Rechte, Geschäftslogik, Verlauf. HeyLotte bekommt **nie** den Supabase-Service-Key und greift nie direkt auf `objekte` zu.

## Stand

| Baustein (Architektur-Papier) | Stand | Wo |
|---|---|---|
| Action API, versioniert (`/v1/actions/<aktion>`) | ✅ 10 Aktionen | `src/app/api/v1/actions/`, `src/os/server/partner/aktionen.ts` |
| Service-to-Service-Auth (Schlüssel je Betrieb) | ✅ nur Hash gespeichert, widerrufbar | `partner_zugaenge` |
| Identitäten verbinden (Workspace ↔ Betrieb, Nutzer ↔ Mitarbeiter) | ✅ | `partner_zugaenge.partner_workspace_id`, `partner_nutzer` |
| Rechte bleiben in Handwerk OS | ✅ dieselbe Rollen-Matrix wie die App (`rollen.rechte`) | `src/os/core/rechte.ts` |
| Validierung, Idempotenz | ✅ `Idempotency-Key` | `src/os/server/partner/dienst.ts` |
| Audit | ✅ jeder Aufruf in `api_aufrufe`, Verlauf am Objekt („– über HeyLotte für …“) | |
| Bestätigung sensibler Aktionen | ✅ `kritisch` → `confirmed: true` (`send-quote`, `reschedule-appointment`) | |
| Events/Webhooks zurück an HeyLotte | ✅ für Änderungen über die API, signiert, mit Wiederholung | `src/os/server/partner/webhook.ts` |
| Events aus der App (z. B. `invoice.overdue`) an HeyLotte | ✅ Trigger auf dem Ereignisprotokoll, Zustellung im Minutentakt | Migration `20261003180000_partner_ausbau.sql` |
| `create-quote` (Angebotsentwurf) | ✅ | `aktionen.ts` |
| OAuth 2.0 (Client Credentials), kurzlebige Tokens | ✅ `hot_…`, 15 Minuten | `src/os/server/partner/oauth.ts`, `token.ts` |
| Rate Limit | ✅ 120 Aufrufe je Minute und Zugang → `429` | `dienst.ts` |
| Oberfläche zum Verbinden | ✅ Einstellungen → Schnittstellen → HeyLotte (nur Chef) | `src/os/modules/schnittstellen/HeyLotte.tsx`, `/api/cloud/partner` |
| `send-quote` (Angebot per E-Mail, SMS oder WhatsApp mit Link zum Kundenbereich) | ✅ kritisch, nur mit Bestätigung | `aktionen-senden.ts` |
| Termine ansehen, eintragen, verschieben | ✅ mit Konfliktprüfung (Termine, genehmigte Abwesenheit) | `aktionen-termine.ts` |
| Rechnungen ansehen, Rechnungsentwurf anlegen | ✅ Festschreiben und Versenden bleibt in der App (GoBD, Nummernkreis) | `aktionen-rechnungen.ts` |

## Einrichten

1. Migrationen `20261003120000_partner_schnittstelle.sql` und `20261003180000_partner_ausbau.sql` ausführen (in Produktion
   eingespielt; der Supabase-MCP hängt bei `drop …`, deshalb `create or replace trigger`).
2. Für Ereignisse im Minutentakt die Adresse der App in den Vault legen (einmal je Supabase-Projekt):
   `select vault.create_secret('https://macher-os.vercel.app', 'partner_app_url');` (in Produktion gesetzt) – das Token `partner_zustell_token`
   legt die Migration selbst an. Ohne Adresse stellen der nächste Aufruf des Partners und der tägliche Cron zu.
3. **In der App:** Einstellungen → Schnittstellen → HeyLotte → „Verbinden“ (nur Chef). Schlüssel und Webhook-Geheimnis
   erscheinen einmal zum Kopieren; dort auch Lotte-Nutzer zuordnen, Schlüssel erneuern, Test-Ereignis senden, trennen.

Ohne Oberfläche (z. B. für einen Betrieb ohne Chef-Konto) geht es weiter per Skript:

   ```sh
   node scripts/partner-zugang.mjs --betrieb <betrieb-uuid> --workspace lotte_workspace_673 \
     --webhook https://<heylotte>/hooks/handwerk --nutzer lotte_user_928=<mitarbeiter-id>
   ```

   SQL im Supabase SQL Editor ausführen, Schlüssel und Geheimnis sicher an HeyLotte geben.

Weitere Nutzer später: `insert into partner_nutzer (zugang_id, partner_nutzer_id, mitarbeiter_id) values (…)`.
Ein Mitarbeiter braucht dafür **kein** eigenes Konto in der App – auch der Monteur, der nur per WhatsApp mit Lotte spricht,
handelt mit den Rechten seiner Rolle.

## Aufruf

```http
POST https://macher-os.de/v1/actions/create-customer
Authorization: Bearer hos_live_…
Idempotency-Key: wa-msg-4711
Content-Type: application/json

{ "user_id": "lotte_user_928", "organization_id": "lotte_workspace_673", "name": "Familie Müller", "phone": "0561 123456" }
```

```json
{ "status": "created", "customer_id": "…", "number": "K-1003", "requires_confirmation": false, "request_id": "req_…" }
```

- `user_id` (Pflicht): Nutzer bei HeyLotte → zugeordneter Mitarbeiter → Rolle → Rechte.
- `organization_id` (optional): Betriebs-ID oder Workspace-ID des Partners. Passt sie nicht zum Schlüssel → `403 wrong_organization`.
- `Idempotency-Key` (Kopfzeile oder `idempotency_key`): gleicher Schlüssel → gleiche Antwort, Kopfzeile `idempotent-replayed: true`, nichts doppelt.
- `confirmed: true`: nur für Aktionen mit Risiko `kritisch`, nachdem der Mensch bei HeyLotte bestätigt hat.
- Katalog mit allen Eingabefeldern: `GET /v1/actions`.
- Höchstens 120 Aufrufe je Minute und Zugang, darüber `429 rate_limited` mit `Retry-After: 60`.

### Kurzlebige Token (OAuth 2.0 Client Credentials)

Statt den dauerhaften Schlüssel bei jedem Aufruf zu schicken, kann HeyLotte ihn gegen ein Token tauschen:

```http
POST https://macher-os.de/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=<zugang-id>&client_secret=hos_live_…
```

```json
{ "access_token": "hot_…", "token_type": "Bearer", "expires_in": 900 }
```

Auch als JSON oder mit `Authorization: Basic base64(client_id:client_secret)`. Das Token gilt 15 Minuten wie ein
Schlüssel (`Authorization: Bearer hot_…`); ein getrennter Zugang sperrt auch seine Token sofort. Fehler im OAuth-Format
(`invalid_client`, `invalid_request`, `unsupported_grant_type`). Signiert mit `PARTNER_TOKEN_GEHEIMNIS`
(Vercel, optional) – sonst mit einem aus dem Service-Key abgeleiteten Geheimnis.

| Aktion | ID (wie im Macher-Gateway) | Risiko | Recht | Ergebnis |
|---|---|---|---|---|
| `find-customer` | `customer.find` | lesen | lesen | `customers[]` mit `customer_id` – Suche ohne Rücksicht auf Umlaute, auch per Telefon oder Kundennummer |
| `create-customer` | `customer.create` | schreiben | schreiben | `201 created`; mögliche Dublette → `409 possible_duplicate` mit `candidates`, nach Rückfrage `allow_duplicate: true` |
| `create-task` | `task.create` | schreiben | schreiben | Aufgabe (Standard: für den Nutzer selbst), optional `customer_id`, `job_id`, `assignee_id`, `due_date`, `priority` |
| `create-quote` | `offer.create_draft` | schreiben | schreiben + Geld | `201 draft_created` mit `quote_id`, `number` (AN-JJJJ-nnnn), `net`, `tax`, `total`, `valid_until`. `customer_id` und `amount` (Euro, netto; `amount_is_gross: true` für brutto) **oder** `items[]` (`text`, `quantity`, `unit`, `unit_price`). Ohne `job_id` entsteht ein Auftrag im Schritt „Angebot“. Steuer aus den Betriebsdaten (Kleinunternehmer 0 %). Versenden mit `send-quote`. |
| `send-quote` | `offer.send` | **kritisch** | veröffentlichen | `quote_id`, optional `to` (E-Mail oder Handynummer, Standard: Kunde) und `channel` (`email`, `sms`, `whatsapp`). Der Kunde bekommt einen Link zu seinem Kundenbereich, dort sieht er das Angebot und nimmt es an. Erst nach geglücktem Versand: Angebot „versendet“, Auftrag im Schritt „Angebot“. `200 sent` mit `channel`, `to`, `total`. |
| `find-appointments` | `appointment.find` | lesen | lesen | `appointments[]` ab `date` (Standard heute) für `days` (1–31, Standard 7), Filter `assignee_id` (`me`), `customer_id`, `job_id`. Monteur und Azubi sehen nur ihre eigenen. Zeiten in deutscher Zeit (`date`, `start_time`). |
| `create-appointment` | `appointment.create` | schreiben | planen | `date`, `start_time`, `end_time` oder `duration_minutes` (Standard 60) bzw. `all_day`; `title`, `type` (Standard `einsatz`), `job_id`, `customer_id`, `assignee_ids` (Standard: Nutzer selbst), `note`. Überschneidung → `409 conflict` mit `conflicts[]`, nach Rückfrage `allow_conflict: true`. |
| `reschedule-appointment` | `appointment.reschedule` | **kritisch** | planen | `appointment_id`, `date`, `start_time` (Dauer bleibt), optional `end_time`, `allow_conflict`. Antwort mit `previous`. |
| `find-invoices` | `invoice.find` | lesen | lesen + Geld | `filter` `open` (Standard), `overdue`, `drafts`, `all`; `customer_id`. Mit `open_sum`, `overdue_sum` und je Rechnung `open_amount`, `days_overdue`, `dunning_level`. |
| `create-invoice` | `invoice.create_draft` | schreiben | schreiben + Geld | Entwurf ohne Nummer aus `job_id` (Positionen des angenommenen Angebots) oder `customer_id` + `amount`/`items[]`. Gibt es schon einen Entwurf zum Auftrag → `200 existing_draft`. Zahlungsziel aus Kunde bzw. Betrieb. Festschreiben und Versenden nur in der App. |

Fehler: `{ "status": "error", "error": { "code", "message", "field"? }, "request_id" }` – `message` ist deutsch und kann
direkt vorgelesen werden. Codes: `unauthorized` (401), `user_required`/`invalid_body` (400), `wrong_organization`,
`unknown_user`, `inactive_user`, `forbidden` (403), `unknown_action` (404), `confirmation_required`, `in_progress` (409),
`invalid_input`, `not_found`, `idempotency_conflict` (422), `channel_unavailable` (424, Versandweg nicht eingerichtet:
`RESEND_API_KEY`, SMS bzw. WhatsApp), `rate_limited` (429), `delivery_failed` (502). Bei 424/502 ist nichts geändert, der Aufruf darf
mit demselben `Idempotency-Key` wiederholt werden. Terminüberschneidung ist kein Fehler: `409 { status: "conflict", conflicts }`. Ohne Supabase-Schlüssel: `501 { fehler: "nicht verbunden" }`.

## Ereignisse an HeyLotte

Nach jeder Änderung über die API (`customer.created`, `task.created`, `quote.created`, `quote.sent`, `job.created`, `appointment.created`,
`appointment.rescheduled`, `job.scheduled`, `invoice.created`) geht ein POST an `webhook_url`,
gefiltert nach `partner_zugaenge.ereignisse` (`*`, `customer.*`, `task.created` …):

```json
{
  "id": "evt_…", "event": "customer.created", "created_at": "2026-10-03T10:00:00.000Z",
  "organization_id": "<betrieb>", "workspace_id": "lotte_workspace_673",
  "source": "heylotte", "user_id": "lotte_user_928", "request_id": "req_…",
  "object": { "type": "customer", "id": "…" }, "data": { "customer_id": "…", "name": "Familie Müller" }
}
```

Kopfzeilen: `x-handwerk-ereignis`, `x-handwerk-id` (zum Entdoppeln), `x-handwerk-zeit` (Unix-Sekunden) und
`x-handwerk-signatur: sha256=<HMAC-SHA256(webhook_geheimnis, "<x-handwerk-zeit>.<Inhalt>")>`.
HeyLotte prüft die Signatur und verwirft Lieferungen, die älter als 5 Minuten sind.

Zustellung direkt nach der Antwort (`after()`), Zeitlimit 5 s, keine Weiterleitungen. Scheitert sie, steht sie in
`partner_auslieferungen` und wird erneut versucht – jede Minute über pg_cron (`/api/partner/zustellen`), beim nächsten
Aufruf des Partners und im täglichen Cron (Wartezeiten 1, 5, 30, 120, 720 Minuten, danach `aufgegeben`).

### Ereignisse aus der App

Was in der App passiert (Kunde angelegt, Angebot angenommen, Rechnung überfällig …), schreibt die App ins
Ereignisprotokoll (`ereignisprotokoll`, API-Namen aus `EREIGNISSE` in `src/os/core/ereignisse.ts`). Kommt ein Eintrag
beim Abgleich in Supabase an, merkt ein Trigger ihn für jeden passenden Zugang vor. Nicht gemeldet werden:
Beispieldaten, Einträge älter als 1 Stunde (nach langer Offline-Zeit) und Einträge von vor dem Verbinden.
`invoice.overdue` geht einmal je Rechnung und Fälligkeit, auch wenn mehrere Geräte es melden.

```json
{
  "id": "evt_…", "event": "invoice.overdue", "created_at": "…", "organization_id": "<betrieb>", "workspace_id": "…",
  "source": "handwerk-os", "origin": "automation", "user_id": "lotte_user_928", "employee_id": "…",
  "object": { "type": "invoice", "id": "…" },
  "data": { "number": "RE-2026-0012", "title": "…", "status": "versendet", "customer_id": "…", "due_date": "2026-09-30", "fields": { … } },
  "details": { "faelligAm": "2026-09-30" }
}
```

`source: "handwerk-os"` heißt: in der App ausgelöst (nicht über HeyLotte). `user_id` ist der Lotte-Nutzer des handelnden
Mitarbeiters, falls zugeordnet. `data.fields` ist das Objekt wie in Handwerk OS gespeichert (deutsche Feldnamen, ohne
Werte über 2000 Zeichen).

## Neue Aktion hinzufügen

1. Eine `PartnerAktion` anlegen (eigene Datei `aktionen-<bereich>.ts`, Hilfen aus `grundlagen.ts`) und in `PARTNER_AKTIONEN`
   (`aktionen.ts`) eintragen: `name` (URL), `gateway` (gleiche ID wie die
   Aktion im Macher-Gateway der App), Risiko und Rechte wie dort, `liest`, `eingabe`, `pruefe`, `fuehreAus`.
2. Geschäftslogik nicht doppeln: reine Funktionen aus dem Modul nutzen (Beispiel `@modules/kunden/dubletten`) bzw.
   dorthin auslagern – nie Module importieren, die `@core/db` brauchen.
3. `fuehreAus` gibt Zeilen, Bezug, Verlaufstext und Ereignisse (API-Name aus `EREIGNISSE` in `src/os/core/ereignisse.ts`) zurück.
4. Test in `src/os/server/partner/partner.test.ts`, Tabelle oben ergänzen.

Prüfen der Datenbank-Regeln: `supabase/tests/partner-pruefung.sql` (siehe `supabase/tests/README.md`).
