# Partner-Schnittstelle (Action API v1) – HeyLotte

> **HeyLotte versteht. Handwerk OS entscheidet und führt aus.**
> Zielbild und Prinzipien: [`docs/produkt/heylotte-architektur.md`](../produkt/heylotte-architektur.md).

HeyLotte (heylotte.ai) ist die Sprach- und WhatsApp-Oberfläche. Handwerk OS bleibt das System of Record: Daten,
Rechte, Geschäftslogik, Verlauf. HeyLotte bekommt **nie** den Supabase-Service-Key und greift nie direkt auf `objekte` zu.

## Stand

| Baustein (Architektur-Papier) | Stand | Wo |
|---|---|---|
| Action API, versioniert (`/v1/actions/<aktion>`) | ✅ 3 Aktionen | `src/app/api/v1/actions/`, `src/os/server/partner/aktionen.ts` |
| Service-to-Service-Auth (Schlüssel je Betrieb) | ✅ nur Hash gespeichert, widerrufbar | `partner_zugaenge` |
| Identitäten verbinden (Workspace ↔ Betrieb, Nutzer ↔ Mitarbeiter) | ✅ | `partner_zugaenge.partner_workspace_id`, `partner_nutzer` |
| Rechte bleiben in Handwerk OS | ✅ dieselbe Rollen-Matrix wie die App (`rollen.rechte`) | `src/os/core/rechte.ts` |
| Validierung, Idempotenz | ✅ `Idempotency-Key` | `src/os/server/partner/dienst.ts` |
| Audit | ✅ jeder Aufruf in `api_aufrufe`, Verlauf am Objekt („– über HeyLotte für …“) | |
| Bestätigung sensibler Aktionen | ✅ Regel steht (`kritisch` → `confirmed: true`), noch keine kritische Aktion freigegeben | |
| Events/Webhooks zurück an HeyLotte | ✅ für Änderungen über die API, signiert, mit Wiederholung | `src/os/server/partner/webhook.ts` |
| Events aus der App (z. B. `invoice.overdue`) an HeyLotte | ⏳ nächster Schritt | |
| `create-quote` und weitere Aktionen | ⏳ braucht Nummernkreis und Preise auf dem Server | |
| OAuth 2.0, kurzlebige Tokens, Rate Limits | ⏳ später; bis dahin Schlüssel je Betrieb + Vercel Firewall | |
| Oberfläche zum Verbinden (Einstellungen → Verbindungen) | ⏳ bis dahin `scripts/partner-zugang.mjs` | |

## Einrichten

1. Migration `supabase/migrations/20261003120000_partner_schnittstelle.sql` im Supabase SQL Editor ausführen.
2. Zugang erzeugen (gibt SQL und einmalig Schlüssel + Webhook-Geheimnis aus):

   ```sh
   node scripts/partner-zugang.mjs --betrieb <betrieb-uuid> --workspace lotte_workspace_673 \
     --webhook https://<heylotte>/hooks/handwerk --nutzer lotte_user_928=<mitarbeiter-id>
   ```

3. SQL im Supabase SQL Editor ausführen, Schlüssel und Geheimnis sicher an HeyLotte geben.
4. Schlüssel wechseln: neuen Zugang anlegen, beim alten `widerrufen_am = now()` setzen.

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

| Aktion | ID (wie im Macher-Gateway) | Risiko | Recht | Ergebnis |
|---|---|---|---|---|
| `find-customer` | `customer.find` | lesen | lesen | `customers[]` mit `customer_id` – Suche ohne Rücksicht auf Umlaute, auch per Telefon oder Kundennummer |
| `create-customer` | `customer.create` | schreiben | schreiben | `201 created`; mögliche Dublette → `409 possible_duplicate` mit `candidates`, nach Rückfrage `allow_duplicate: true` |
| `create-task` | `task.create` | schreiben | schreiben | Aufgabe (Standard: für den Nutzer selbst), optional `customer_id`, `job_id`, `assignee_id`, `due_date`, `priority` |

Fehler: `{ "status": "error", "error": { "code", "message", "field"? }, "request_id" }` – `message` ist deutsch und kann
direkt vorgelesen werden. Codes: `unauthorized` (401), `user_required`/`invalid_body` (400), `wrong_organization`,
`unknown_user`, `inactive_user`, `forbidden` (403), `unknown_action` (404), `confirmation_required`, `in_progress` (409),
`invalid_input`, `not_found`, `idempotency_conflict` (422). Ohne Supabase-Schlüssel: `501 { fehler: "nicht verbunden" }`.

## Ereignisse an HeyLotte

Nach jeder Änderung über die API (jetzt: `customer.created`, `task.created`) geht ein POST an `webhook_url`,
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
`partner_auslieferungen` und wird beim nächsten Aufruf des Partners und im täglichen Cron erneut versucht
(Wartezeiten 1, 5, 30, 120, 720 Minuten, danach `aufgegeben`).

## Neue Aktion hinzufügen

1. In `src/os/server/partner/aktionen.ts` eine `PartnerAktion` anlegen: `name` (URL), `gateway` (gleiche ID wie die
   Aktion im Macher-Gateway der App), Risiko und Rechte wie dort, `liest`, `eingabe`, `pruefe`, `fuehreAus`.
2. Geschäftslogik nicht doppeln: reine Funktionen aus dem Modul nutzen (Beispiel `@modules/kunden/dubletten`) bzw.
   dorthin auslagern – nie Module importieren, die `@core/db` brauchen.
3. `fuehreAus` gibt Zeilen, Bezug, Verlaufstext und Ereignisse (API-Name aus `EREIGNISSE` in `src/os/core/ereignisse.ts`) zurück.
4. Test in `src/os/server/partner/partner.test.ts`, Tabelle oben ergänzen.

Prüfen der Datenbank-Regeln: `supabase/tests/partner-pruefung.sql` (siehe `supabase/tests/README.md`).
