# KI-Telefonie – Telefonassistent (Inbound)

> Stand: vorbereitet, **kein Telefonanbieter angebunden**. In der App steht „Noch nicht mit einer Telefonnummer
> verbunden – Kommt bald“. Alles bis auf den Adapter eines echten Anbieters ist gebaut und getestet.

Macher nimmt Anrufe an, wenn keiner rangeht (oder nach der Regel des Betriebs), sagt gleich, dass er ein digitaler
Assistent ist, fragt Anliegen, Name, Adresse, Dringlichkeit, Rückrufnummer und Erreichbarkeit ab und trägt das
Ergebnis in **Telefon & Empfang** ein – als Anfrage, Rückruf oder Notiz, mit erkanntem Kunden und ggf. Auftrag.
Notfälle gehen an die Bereitschaft. Deckungsgleich mit der Marketingseite `telefon-ki`.

## Architektur

```text
Anrufer ──► Telefonanbieter (sipgate, Twilio, Vapi, Retell, ElevenLabs …)
               │  Agent: Ansage, Anweisung, Fragen, Ziel-Schema, Werkzeuge, Weiterleitung   ◄── AgentDefinition (agent.ts)
               │                                                                               über TelefonAnbieter.einrichten
               ▼  Webhook (Signatur)
        POST /api/telefon/eingang?betrieb=<id>          src/app/api/telefon/eingang/route.ts
               │  TelefonAnbieter.eingangLesen → TelefonEreignis[]  (anbieter/typen.ts)
               │  telefonEingangPlanen → 1 Nachricht je Anruf        (src/os/server/telefon.ts)
               ▼
        objekte: nachrichten { kanal: 'telefon', anruf: { status: 'neu', … } }
               │  Abgleich (Sync) in die App
               ▼
        Automation `telefon.ki-anrufe` (modules/telefon/index.tsx)
               │  rohAnrufVerarbeiten → kiAnrufAufnehmen (assistent.ts)
               │    Kunde erkennen (erkenneAnrufer) → ergebnisUebersetzen (agent.ts, Regeln zuerst)
               ▼
        Macher AI Gateway (core/gateway.ts) – Aktionen aus modules/telefon/gateway.ts
          call.request_create | call.callback_create | call.note_create | call.emergency_forward
               │  anrufErfassen (daten.ts) – dieselbe Logik wie ein von Hand notierter Anruf
               ▼
        Nachricht (Anruf) + Anfrage (Auftrag, Phase anfrage) bzw. Rückruf (Aufgabe) · Ereignisse · Verlauf · KI-Protokoll
```

**Eine Business-Realität:** Ein Anruf ist eine `Nachricht` mit `kanal: 'telefon'`. Was der Assistent dazu weiß, steht
in `Nachricht.anruf` (`AnrufDetails` in `core/objects.ts`): Quelle `ki-assistent`, Gesprächs-ID, Nummer, Beginn, Dauer,
Zusammenfassung, abgefragte Felder, Dringlichkeit (`normal | dringend | notfall`), Notfallgrund, Ergebnis
(`anfrage | rueckruf | notiz | weitergeleitet`), Transkript, Bereitschaft, Status (`neu | verarbeitet | fehler`).
Keine eigene Sammlung, keine kopierten Kundendaten.

## Dateien

| Datei | Inhalt |
|---|---|
| `src/os/modules/telefon/anbieter/typen.ts` | Vertrag: `TelefonAnbieter`, `TelefonEreignis`, `AnrufErgebnis`, `AgentDefinition`, `WerkzeugDef` |
| `src/os/modules/telefon/anbieter/simulator.ts` | Simulator-Adapter (Tests, Demo, Probeanruf), Feld-Erkennung per Regeln |
| `src/os/modules/telefon/anbieter/index.ts` | Verzeichnis der Adapter (`anbieter(id)`) |
| `src/os/modules/telefon/agent.ts` | reine Logik: Konfiguration, Ansage, Annahmeregel, Notfall-Stichworte, `agentDefinition`, `ergebnisUebersetzen`, `rohNachricht` |
| `src/os/modules/telefon/assistent.ts` | App: Konfiguration speichern, Geschäftszeiten aus den Betriebsdaten, `kiAnrufAufnehmen`, `vorschau` |
| `src/os/modules/telefon/gateway.ts` | Gateway-Aktionen `call.*` |
| `src/os/modules/telefon/AssistentSeite.tsx` | Einstellungen + Probeanruf unter `/auftraege/telefon/assistent` (kein Menüpunkt; Knopf „Telefonassistent“ in Telefon & Empfang, Suche „Telefonassistent“) |
| `src/os/modules/telefon/KiAnruf.tsx` | Anzeige in „Letzte Anrufe“: „Von Macher angenommen“, Dringlichkeit, Gespräch aufklappbar |
| `src/os/server/telefon.ts` | Server: Ereignisse → rohe Nachricht, `kunde_suchen` |
| `src/app/api/telefon/eingang/route.ts` | Eingangs-Webhook |

## Ablauf eines Anrufs

1. **Annahme** – der Anbieter entscheidet nach `AgentDefinition.annahme` (Modus, Sekunden, Geschäftszeiten als Text);
   dieselbe Regel als Funktion: `nimmtAn(konfig, jetzt, geschaeftszeiten)` (Europe/Berlin, Feiertage über `@core/kalender`).
2. **Ansage** – `ansageText`: Vorlage mit `{firma}`; fehlt der Hinweis „digitaler Assistent“, wird er vorangestellt
   (EU AI Act, Art. 50 – Transparenz). Nicht abschaltbar.
3. **Gespräch** – der Anbieter folgt `anweisung` und `fragen`. Er darf nur die vier Werkzeuge nutzen:

   | Werkzeug | Gateway-Aktion | Capability | Wirkung |
   |---|---|---|---|
   | `kunde_suchen` | `call.customer_lookup` | READ | nur `bekannt` + Zahl offener Aufträge – keine Kundendaten ans Telefon |
   | `anfrage_anlegen` | `call.request_create` | WRITE | Anfrage (Auftrag in Phase `anfrage`), ggf. neuer Kunde mit Adresse |
   | `rueckruf_anlegen` | `call.callback_create` | WRITE | Rückruf-Aufgabe (fällig heute bei dringend, sonst morgen) |
   | `an_bereitschaft_weiterleiten` | `call.emergency_forward` | WRITE | Live-Durchstellen an die Weiterleitungsnummer (Anbieter) + Mitteilung an die Bereitschaft (Macher) |

   Geschrieben wird erst am Gesprächsende (`anruf.beendet`); im Gespräch beantwortet der Server nur `kunde_suchen`.
   Kein MONEY, keine PUBLICATION, nichts DESTRUCTIVE. `telefonKontext()` erlaubt nur `lesen` und `schreiben`.
4. **Ende** – der Adapter liefert `anruf.beendet` mit `AnrufErgebnis` (siehe unten). Der Server legt die Nachricht ab.
5. **Eintragen** – die App übersetzt (`ergebnisUebersetzen`):
   1. Notfall per **Stichwort** (Regel, `notfallTreffer`: Groß/klein und Umlaute egal, mehrwortig im selben Satz),
   2. Einschätzung des Assistenten (`dringlichkeit: 'notfall'`) **ergänzend**,
   3. Vorschlag des Assistenten (`ergebnis`), 4. Standard: mit Anliegen → Anfrage, ohne → Rückruf; bekannter Kunde mit
      offenem Auftrag und kurzer Frage („Rechnung“, „Termin“, „Stand“) → Rückruf.
   Ausgeführt über `fuehreAus(…, { bestaetigt: true })` als Macher (`quelle: 'ai'`). Die **Freigabe** ist die Einstellung
   „Telefonassistent an“ des Chefs – eine stehende Freigabe genau für diese Schreibaktionen. Jede Aktion steht im
   KI-Protokoll (`kanal: 'sprache'`) und im Verlauf am Objekt und lässt sich über das Audit zurücknehmen.
6. **Ereignisse** – `anruf.angenommen` (`call.answered`) und `anruf.notfall_weitergeleitet` (`call.emergency_forwarded`)
   im Katalog (`core/ereignisse.ts`), dazu wie immer `anfrage.eingegangen`, `aufgabe.angelegt`, `nachricht.eingegangen`.
   Webhooks können sie abonnieren.
7. **Fehler** – schlägt das Eintragen fehl, bleibt die Nachricht mit `anruf.status: 'fehler'` stehen und erscheint
   unter „Braucht dich“. Doppelte Zustellung (gleiche `anrufId`) legt nichts doppelt an.

## Was ein Adapter liefern muss

Ein neuer Anbieter = eine Datei `anbieter/<id>.ts`, die `TelefonAnbieter` erfüllt, und ein Eintrag in `anbieter/index.ts`.

- `einrichten(agent: AgentDefinition)` – Agent beim Anbieter anlegen/aktualisieren: Ansage, Systemprompt (`anweisung`),
  Ziel-Schema (`zielSchema`, JSON-Schema), Werkzeuge (Webhook-URL `/api/telefon/eingang?betrieb=…`), Weiterleitung,
  Annahmeregel, `maxDauerSekunden`. Aufruf, wenn sich die Konfiguration ändert (offen, siehe unten).
- `pruefeSignatur({ kopf, rohText }, geheimnis)` – Signatur des Anbieters prüfen (HMAC o. ä.).
- `eingangLesen(nutzlast)` → `TelefonEreignis[]`; unbekannte Ereignisse → `[]` (die Route antwortet dann 200).
- `werkzeugAntwort(werkzeug, ergebnis)` – optional, Antwortformat für Werkzeugaufrufe.

`AnrufErgebnis` (Pflicht: `anrufId`, `anbieter`, `von` – leer bei unterdrückter Nummer –, `beginn`, `felder`):

```ts
{
  anrufId: 'call_123', anbieter: 'vapi', von: '+491712345678', an: '+49561…', beginn: '2026-10-02T08:00:00Z',
  dauerSekunden: 84,
  felder: { anliegen, name, adresse, dringlichkeit, rueckrufnummer, erreichbarkeit },   // laut zielSchema
  zusammenfassung: 'Eva Sommer: Rohrbruch im Keller, Haupthahn zu.',
  dringlichkeit: 'normal' | 'dringend' | 'notfall',   // Einschätzung, ergänzend
  ergebnis: 'anfrage' | 'rueckruf' | 'notiz',         // Vorschlag
  weitergeleitet: true,                               // schon live zur Bereitschaft durchgestellt
  transkript: [{ wer: 'assistent' | 'anrufer', text }],
}
```

Umgebungsvariablen (Vercel, Projekt `macher-os`): `TELEFON_ANBIETER` (heute nur `simulator` – **nicht in Produktion
setzen**), `TELEFON_WEBHOOK_SECRET`, dazu `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` wie beim E-Mail-Eingang.
Ohne eine davon antwortet die Route mit 501.

Probe mit dem Simulator:

```bash
curl -X POST "https://…/api/telefon/eingang?betrieb=<id>" -H "x-macher-signatur: $TELEFON_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d '{"typ":"anruf.beendet","ergebnis":{"anrufId":"t1","anbieter":"simulator","von":"0171 2345678","beginn":"2026-10-02T08:00:00Z","felder":{"anliegen":"Rohrbruch im Keller"}}}'
```

## Oberfläche

- **Telefon & Empfang** (Aufträge › Eingang › Rückrufe): KI-Anrufe stehen in „Letzte Anrufe“ mit „Von Macher
  angenommen“, Dringlichkeit als Text (Rot nur bei Notfall), Ergebnis, aufklappbar Zusammenfassung, Felder, Transkript,
  „Zurückrufen“ und „Auftrag/Kunde öffnen“. Rückrufe erscheinen wie gewohnt unter „Offene Rückrufe“.
- **Telefonassistent** (`/auftraege/telefon/assistent`): Einstellungen (an/aus, Annahmeregel, Klingelzeit, Geschäftszeiten
  aus den Betriebsdaten, Begrüßung mit Vorschau, Notfall-Stichworte, Bereitschaft, Fragen mit „nach oben/unten“) und
  **Probeanruf**: Text statt Telefon → zeigt, was im Eingang landen würde, speichert nichts. Ändern nur mit Recht
  „Einstellungen“. Konfiguration: Einstellung `telefon.assistent`; Verbindung (künftig): `telefon.verbindung`.

## Offene Punkte

1. **Anbieter wählen und Adapter bauen** (EU-Hosting, deutsche Stimme, Webhooks, Live-Weiterleitung, Preis je Minute).
   Kostenrahmen wie beim Gateway (`KOSTEN_GRENZEN`) – Minutenpreise in `kostenBuchen` einrechnen.
2. **Nummer und Weiterleitung:** Rufumleitung „bei Nichtannahme nach X s“ / „außerhalb der Zeiten“ vom Handy bzw. der
   Telefonanlage auf die Anbieter-Nummer, oder Portierung der Firmennummer. Anleitung je Netz (Telekom, Vodafone,
   O2, sipgate) in der Einrichtung; `telefon.verbindung` setzen, wenn verbunden.
3. **Betrieb zuordnen:** heute `?betrieb=<id>` + ein globales Geheimnis. Besser: Geheimnis je Betrieb und Zuordnung
   über die angerufene Nummer (`an`), wie `betriebe.postfach` beim E-Mail-Eingang (Migration).
4. **Konfiguration zum Anbieter bringen:** bei Änderung `einrichten(aktuelleAgentDefinition())` serverseitig aufrufen
   (die Einstellungen liegen synchronisiert in `objekte`, Sammlung `einstellungen`, ID `telefon.assistent`).
5. **DSGVO:** Auftragsverarbeitungsvertrag mit dem Anbieter, Server in der EU (Frankfurt), Speicherdauer für Transkripte
   (Vorschlag: Transkript nach 90 Tagen löschen, Zusammenfassung bleibt), Hinweis in der Datenschutzerklärung.
   **Aufzeichnung:** keine Audioaufzeichnung speichern; Transkript nur mit Hinweis in der Ansage (Standard: „Ich nehme Ihr
   Anliegen auf …“) – rechtlich prüfen lassen (§ 201 StGB, Einwilligung).
6. **EU AI Act:** Offenlegung ist umgesetzt (Ansage). Mensch erreichbar: Bereitschaft/Rückruf; Protokoll im KI-Protokoll.
7. **Notfall-Sicherheit:** Bei Gas/Brand verweist die Anweisung auf 112 / Gasversorger. Ist keine Bereitschaft
   hinterlegt, geht die Mitteilung an Chef und Büro. Push aufs Handy der Bereitschaft (Takte/Push) bei `anruf.notfall_weitergeleitet` anbinden.
8. **Mehrere Geräte:** die Automation trägt rohe Anrufe auf dem Gerät ein, das sie zuerst sieht. Auf einem Gerät
   verhindert die Gesprächs-ID Dubletten; sehen zwei Geräte denselben rohen Anruf gleichzeitig, können zwei Anfragen
   entstehen. Darum später serverseitig eintragen (gleiche Logik wie `kiAnrufAufnehmen`).
9. **Bereitschaftsplan** (wechselnde Personen, Zeiten) – heute eine Person + eine Nummer.
