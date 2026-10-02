# Eingangsrechnungen per E-Mail (Belege-Postfach)

Jeder Betrieb hat eine eigene Adresse: **`belege@<betrieb>.macher-os.de`** (neben `anfragen@<betrieb>.macher-os.de`
für Anfragen). Das Büro leitet Lieferantenrechnungen dorthin weiter. Jeder Anhang (PDF, JPG, PNG) wird ein Beleg
mit Status **Neu** und Quelle **E-Mail** – im Modul „Eingangsrechnungen & Belege“ unter **Zu prüfen**.

Stand: **Code fertig und getestet, Empfang noch nicht eingerichtet.** Die App zeigt die Adresse an, sagt aber
„Noch nicht aktiv“, bis der Betreiber die Schritte unten erledigt und den Schalter gesetzt hat.

## Was der Code macht

| Teil | Datei |
|---|---|
| Adresse, Anhänge lesen, Absender → Lieferant, Plan (rein, ohne Netz) | `src/os/server/belege-postfach.ts` (+ `belege-postfach.test.ts`) |
| Server: Betrieb finden, Anhänge in den Speicher `dateien` laden, Dokument + Beleg schreiben | `src/os/server/belege-eingang.ts` |
| Webhook (gemeinsam mit dem Anfrage-Postfach) | `src/app/api/eingang/email/route.ts` → `POST /api/eingang/email` |
| Anzeige in der App (Adresse, Kopieren, Stand) | `src/os/modules/belege/Ablage.tsx`, `emailEingang()` in `logik.ts` |

- Betrieb: aus der Empfängeradresse (`belege@<slug>…`, auch `belege+irgendwas@<slug>…`) über die Spalte
  `betriebe.postfach`, sonst über den eindeutigen Slug aus dem Betriebsnamen.
- Anhänge: nur PDF, JPG, PNG (bei `application/octet-stream` entscheidet die Endung), höchstens 10 MB je Datei,
  höchstens 10 je Mail. Kleine eingebettete Bilder (Logo, Signatur) werden übersprungen.
- Datei: `dateien/<betriebId>/<id>-<name>` im privaten Speicher, Link wie in der App (`/api/cloud/datei?p=…&s=…`).
- Lieferant-Vorschlag: bekannte E-Mail-Adresse → gleiche Firmen-Domain (E-Mail oder Website des Lieferanten) →
  gleicher Name → sonst Name aus Absender oder Domain. Bei weitergeleiteten Mails (WG:/Fwd:) zählt der ursprüngliche
  Absender aus dem Text. Rechnungsnummer aus dem Betreff, wenn eine Ziffer darin steht.
- Betrag und Datum liest der Server **nicht** aus dem PDF (keine Texterkennung). Das Büro trägt sie beim Prüfen ein.
- Doppelt zugestellte Mails (gleiche Message-ID) werden ignoriert. Fachliche Probleme (Betrieb unbekannt, kein
  passender Anhang) antworten mit 200, damit der Mail-Dienst nicht endlos neu zustellt.

## Einrichten (nur der Betreiber)

Voraussetzung: Backend nach `docs/os/BACKEND.md` (Supabase mit allen Migrationen, `SUPABASE_SERVICE_ROLE_KEY`,
`APP_URL`). Ohne Service-Key antwortet der Webhook mit `501 nicht verbunden`.

1. **Mail-Dienst mit Eingang wählen.** Empfohlen: **Postmark Inbound** – schickt Anhänge als Base64 im JSON mit.
   Getestet ist dieses Format (Feld `Attachments`). Resend Inbound liefert im Webhook nach unserem Stand nur
   Metadaten der Anhänge ohne Inhalt; solche Anhänge überspringt der Server („ohne Inhalt geliefert“). Ein Abruf
   über die Resend-API ist **nicht gebaut**. Vor dem Livegang mit einer echten Test-Mail prüfen.
2. **DNS:** Die Adressen liegen auf Subdomains je Betrieb (`<slug>.macher-os.de`). Dafür braucht es einen
   Wildcard-MX-Eintrag `*.macher-os.de MX 10 <Eingangsserver des Mail-Dienstes>` (bei Postmark
   `inbound.postmarkapp.com`). Prüfen, ob der Mail-Dienst Wildcard-Subdomains annimmt. Das gilt genauso für das
   Anfrage-Postfach. Der MX der Hauptdomain (`macher-os.de`) bleibt unberührt.
3. **Webhook:** Im Mail-Dienst als Ziel `https://<domain>/api/eingang/email?schluessel=<EINGANG_WEBHOOK_SECRET>`
   eintragen. `EINGANG_WEBHOOK_SECRET` vorher erzeugen (`openssl rand -hex 32`) und in Vercel setzen. Für Belege ist der Schlüssel Pflicht – ohne ihn antwortet der Eingang mit 503.
   Ohne Geheimnis nimmt der Webhook jede Lieferung an – im Livebetrieb immer setzen.
4. **Größe:** Vercel nimmt Anfragen bis etwa 4,5 MB an. Mit Base64 (+33 %) heißt das: Anhänge zusammen bis etwa
   3 MB kommen sicher an. Größere Mails lehnt Vercel ab. Bei Bedarf später auf einen Weg mit Download-Link umstellen
   (der Server kann Anhänge mit `download_url` bereits laden).
5. **Testen:**
   ```sh
   curl -X POST "https://<domain>/api/eingang/email?schluessel=$EINGANG_WEBHOOK_SECRET" \
     -H 'content-type: application/json' \
     -d '{"FromFull":{"Email":"rechnung@lieferant.de","Name":"Lieferant"},"ToFull":[{"Email":"belege@<slug>.macher-os.de"}],
          "Subject":"Rechnung 4711","TextBody":"Anbei","MessageID":"test-1",
          "Attachments":[{"Name":"rechnung.pdf","ContentType":"application/pdf","Content":"JVBERi0xLjQK"}]}'
   ```
   Antwort `{"ok":true,"belege":[…]}`. In der App erscheint der Beleg nach dem nächsten Abgleich unter „Zu prüfen“.
6. **Einschalten in der App:** In Vercel `NEXT_PUBLIC_BELEGE_EMAIL_AKTIV=1` setzen und neu deployen. Erst dann zeigt
   die App „Aktiv“. Ohne Cloud-Verbindung des Betriebs zeigt sie immer „Noch nicht aktiv“.

## Offen

- Texterkennung (Betrag, Datum, Rechnungsnummer aus dem PDF) – bewusst weggelassen, siehe `PAINPOINTS.md`.
- Die App leitet die angezeigte Adresse aus dem Betriebsnamen ab. Weicht `betriebe.postfach` davon ab
  (z. B. zwei Betriebe mit gleichem Namen), zeigt die App eine falsche Adresse – gilt auch für das Anfrage-Postfach.
- Resend: Anhänge über die API nachladen, falls Resend der Mail-Dienst wird.
