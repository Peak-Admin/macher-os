# Macher AI Gateway

> **Verbindlich für jede KI-Funktion in Macher OS.** Kein Modul spricht direkt mit einem Modell.
> Alle Anfragen, Absichten, Aktionen und Modellaufrufe laufen über `src/os/core/gateway.ts`.

Abschnitt A beschreibt den Stand im Code. Abschnitt B ist die Strategie (übernommen von Peak One).

## A. Umsetzung in macher-os

### Pipeline

```text
Verstehen → Routen → Kontext → Rechte → günstigste ausreichende Lane
→ strukturierte Aktion → Prüfen → Bestätigung (wenn nötig) → Ausführen → Protokoll
```

| Schritt | Wo im Code |
|---|---|
| Eingabe (Text, Sprache) | `frage(text, { …kontext, kanal: 'text' \| 'sprache' })` |
| Verstehen, Lane 0 | `AbsichtDef.erkenne` – Regeln, geprüft nach `rang` |
| Verstehen, Lane 1 (Jev) | `ModellAdapter.erkenne` – nur wenn keine Regel greift; gilt ab Sicherheit `MIN_SICHERHEIT` (0,7) |
| Auffang | Absicht mit `auffang: true` (in „Macher fragen“: Suche) |
| Rechte | `AbsichtDef.rechte` / `AktionDef.rechte` gegen `darf()` – KI-Recht = Macher-OS-Recht |
| Lane wählen | `waehleLane(mindestens, kontext)` – von unten nach oben, gedeckelt durch den Kostenrahmen |
| Minimaler Kontext | `AbsichtDef.kontext` – nur das bekommt ein Modell (Lane 2+) zu sehen |
| Strukturierte Aktion | `Aktion { aktion, daten, absicht, lane, modell }` – das Modell ändert nie selbst Daten |
| Prüfen | `AktionDef.pruefe` |
| Bestätigung | `brauchtBestaetigung(risikoVon(risiko, rechte))` |
| Ausführen | `fuehreAus(aktion, kontext, { bestaetigt })` → `AktionDef.fuehreAus` (Geschäftslogik des Moduls, auch asynchron) |
| Modelle | `registriereModell` – im Browser über `verbindeModelle()` (`src/os/core/ki-modelle.ts`) |
| Mehrere Schritte | `pruefePlan` → eine Bestätigung → `fuehrePlanAus` (siehe unten) |
| Protokoll | Sammlung `ki-protokoll` (jede Frage und jede Aktion), Event `ki.aktion.ausgefuehrt` / `ki.<ergebnis>`, Eintrag `ki.aktion` im Zeitstrahl des betroffenen Objekts |

### Module anschließen

Module melden nur an, was sie verstehen und ausführen können – über `defineModul({ gateway })`:

```ts
export default defineModul({
  id: 'macher-fragen',
  // …
  gateway: { absichten: ABSICHTEN, aktionen: AKTIONEN },
});
```

- **Absicht** (`AbsichtDef`): kanonische ID (`invoice.list`, `task.create` …), Risiko, nötige Rechte,
  kleinste Lane, Regel (`erkenne`), minimaler Kontext (`kontext`) und `beantworte`.
- **Aktion** (`AktionDef`): ID, Risiko, Rechte, `pruefe`, `fuehreAus`. Rückgabe `{ bezug }` für Zeitstrahl und Link.
- Absichten liefern Aktionen nur als **Entwurf/Vorschlag**. Ausgeführt wird erst über `fuehreAus(…, { bestaetigt: true })`,
  nachdem der Mensch den Knopf gedrückt hat.
- Automationen bleiben Regeln (`automationen` + `on()`), keine Agents. Sie dürfen einzelne Schritte über den Gateway
  ausführen, aber die Logik selbst bleibt deterministisch.

### Risiko und Bestätigung

| Risiko | Beispiele | Bestätigung |
|---|---|---|
| `lesen` | offene Rechnungen, Termine morgen, Resturlaub | nie |
| `schreiben` | Notiz, Aufgabe, Zeit erfassen, Entwurf | Standard ja; abschaltbar über Einstellung `ki.schreiben.direkt` |
| `kritisch` | Rechnung/Angebot/Nachricht senden, Kundentermin verschieben, bestellen, zahlen, Personaldaten, löschen | immer |

Eine Aktion, die `veroeffentlichen`, `loeschen`, `admin` oder `personal` braucht, ist automatisch `kritisch` – egal, was angegeben ist.

### Lanes und Kosten

| Lane | Name | Wofür | Modell (Standard) | Stand |
|---|---|---|---|---|
| 0 | Regeln | Abfragen, Filter, Berechnungen, Regeln | – | aktiv – alle Absichten haben Regeln |
| 1 | Jev | Absicht erkennen, wenn keine Regel greift | `claude-haiku-4-5` | angeschlossen, wenn auf dem Server eingerichtet |
| 2 | Luna | Texte an Kunden formulieren (`besserMit: 2`) | `claude-sonnet-5-5` | angeschlossen, wenn auf dem Server eingerichtet |
| 3 | Stark | komplexe Planung, große Dokumente | `claude-opus-5-5` | angeschlossen, aber von keiner Absicht verlangt |

**Anschluss:** `src/app/api/ki/gateway/route.ts` (Server) und `src/os/core/ki-modelle.ts` (Browser). Beim Start fragt
`verbindeModelle()` (aus `macher-fragen` → `init`), welche Lanes eingerichtet sind, und meldet je Lane einen Adapter an.
Der Schlüssel bleibt auf dem Server; der Browser schickt nur den Satz, die Liste der Absichten (Jev) oder den minimalen
Kontext der Absicht (Luna). Fällt ein Modell aus, bleibt der Gateway bei Regeln bzw. der Vorlage.

Umgebungsvariablen (Vercel → Projekt → Settings → Environment Variables):

| Variable | Bedeutung |
|---|---|
| `ANTHROPIC_API_KEY` | Pflicht. Ohne Schlüssel bleibt alles bei Lane 0. |
| `KI_MODELL_JEV`, `KI_MODELL_LUNA`, `KI_MODELL_STARK` | Modell je Lane umstellen |
| `KI_LANES` | z. B. `1,2` – nur diese Lanes freigeben |

**`besserMit`:** Eine Absicht, die mit Regeln funktioniert, aber mit einem Modell besser wird (Nachricht an den Kunden),
nutzt Luna nur, wenn sie angeschlossen ist und der Kostenrahmen es erlaubt – sonst eine einfache Vorlage. Den Text kann der
Mensch vor dem Senden ändern (`PlanSchritt.textFeld`).

**Kostenrahmen** (`KOSTEN_GRENZEN`): Ziel ≤ 10 %, Warnung ab 15 %, Grenze 20 % – gemessen als Modellkosten des Monats
(`kostenBuchen`, die Route meldet `kostenCent` je Aufruf) geteilt durch den Monatsbeitrag des Betriebs
(Einstellung `ki.abo.monatCent`, Platzhalter 89 € wie in `src/content/preise.ts`). Bei Warnung ist Lane 3 gesperrt,
an der Grenze laufen nur noch Regeln und Jev. Ein Aufrufer kann `kostenAnteil` auch selbst übergeben.

### Mehrschritt-Pläne

Ein Satz kann mehrere verbundene Aktionen auslösen. Die Absicht baut einen `Plan` aus `PlanSchritt`en
(jeweils eine strukturierte Aktion mit Label); ausgeführt wird nichts.

```text
„Der Auftrag von Familie Hoffmann ist fertig.“

Auftrag A-2026-0007 abschließen
☑ Arbeiten als fertig melden (weiter zur Abnahme)        job.complete
☑ Rechnung vorbereiten (nur Entwurf)                     invoice.create_draft
☐ Weitere Einsätze aus dem Plan nehmen                   job.release_plan   – Nicht möglich: keine weiteren Einsätze
☑ Bewertung beim Kunden anfragen   [Geht an den Kunden]  review.request

[Alles ausführen]  [Verwerfen]
```

- `pruefePlan(plan, kontext)` – Vorschau: je Schritt Risiko, erlaubt, Grund in Klartext. Ändert und protokolliert nichts.
- `planRisiko(pruefung, auswahl)` – höchstes Risiko der Auswahl; bei `kritisch` zeigt die Oberfläche einen Hinweis.
- `fuehrePlanAus(plan, kontext, { bestaetigt, auswahl })` – führt die ausgewählten Schritte der Reihe nach über
  `fuehreAus` aus. Jeder Schritt wird einzeln geprüft und protokolliert (Feld `plan` im `ki-protokoll`). Ein Fehler stoppt
  die übrigen Schritte nicht; das Ergebnis zeigt jeden Schritt (`ausgefuehrt` / `fehler` / `uebersprungen`).
- Schritte, deren Aktion kein Modul anbietet, lässt die Absicht weg (keine toten Knöpfe). Schritte ohne Recht
  (z. B. Rechnung ohne „Preise & Geld“) bietet sie gar nicht erst an.
- Einzelaktionen („Schick das Angebot an Hoffmann“) sind Pläne mit einem Schritt – eine Vorschau, ein Knopf.
- Fehler mit lesbarem Text wirft die Aktion als `AktionsFehler`.

### Aktionen (Stand)

| Aktion | Modul | Risiko | Rechte | Was passiert |
|---|---|---|---|---|
| `task.create` | macher-fragen | schreiben | schreiben | Aufgabe anlegen |
| `time.track` | arbeitszeiten | schreiben | schreiben (für andere: planen) | abgeschlossenen Zeiteintrag anlegen, ab Arbeitsbeginn |
| `invoice.create_draft` | rechnungen | schreiben | schreiben, geld | Rechnungsentwurf aus dem Auftrag – nie versendet |
| `invoice.send` | rechnungen | kritisch | geld, veroeffentlichen | Pflichtangaben prüfen, festschreiben (GoBD), mit XRechnung senden |
| `job.complete` | auftraege | schreiben | schreiben | Arbeiten fertig → Phase „Abnahme“ |
| `job.release_plan` | einsatzplanung | schreiben | planen | künftige Einsätze des Auftrags absagen |
| `appointment.reschedule` | kalender | kritisch | planen | Termin verschieben (Dauer bleibt), prüft Konflikte im Team |
| `message.send` | nachrichten | kritisch | veroeffentlichen | Nachricht per E-Mail/SMS an den Kunden, landet im Verlauf |
| `offer.send` | angebote | kritisch | veroeffentlichen | Angebot per E-Mail/SMS an den Kunden |
| `review.request` | bewertungen | kritisch | veroeffentlichen | Bewertungsanfrage an den Kunden |
| `material.reserve` | material-am-auftrag | schreiben | schreiben | Material bereitlegen (zählt im Bedarf als reserviert), prüft freien Bestand |
| `vacation.create` | abwesenheiten | schreiben | schreiben (für andere: personal) | Urlaub beantragen; mit Personalrecht direkt genehmigt |
| `vacation.approve` | abwesenheiten | kritisch | personal | Antrag genehmigen, Mitarbeiter bekommt Bescheid |
| `customer.create` | kunden | schreiben | schreiben | Kunde anlegen, warnt vor Dubletten |

Jede Aktion liegt in `src/os/modules/<modul>/gateway.ts` und ruft nur die bestehende Geschäftslogik des Moduls auf.

### Intent-Library (Stand)

Angemeldet von `macher-fragen` (Reihenfolge = Prüfreihenfolge; `assistent.ts` und `aktionen.ts`):

| Absicht | Beispiel | Ergebnis |
|---|---|---|
| `task.create`, `reminder.create` | „Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag“ | Entwurf Aufgabe |
| `invoice.send` | „Schick die Rechnung an Familie Hoffmann“ | Plan mit 1 Schritt |
| `appointment.reschedule` | „Die Baustelle Schneider verschiebt sich um zwei Tage“ | Termin verschieben + Kunden informieren (Luna oder Vorlage) |
| `material.reserve` | „Reservier 20 Meter Mantelleitung für Hoffmann“ | Plan mit 1 Schritt |
| `vacation.approve` | „Genehmige den Urlaub von Jonas“ | je Antrag ein Schritt |
| `vacation.create` | „Ich brauche Urlaub vom 12.10. bis 16.10.“ | Antrag (Chef: direkt genehmigt) |
| `customer.create` | „Leg einen neuen Kunden an: Bäckerei Schmidt GmbH, 0561 123456“ | Plan mit 1 Schritt |
| `message.send` | „Schreib Familie Hoffmann, dass wir morgen gegen neun kommen“ | Entwurf zum Ändern (Luna oder Vorlage) |
| `job.finish` | „Der Auftrag von Familie Hoffmann ist fertig“ | Plan mit bis zu 4 Schritten |
| `time.track` | „Schreib bei Hoffmann zwei Stunden Nacharbeit auf“ | Plan mit 1 Schritt |
| `offer.send` | „Schick das Angebot an Familie Hoffmann“ | Plan mit 1 Schritt |
| `invoice.create_draft` | „Mach aus dem Auftrag von Schneider eine Rechnung“ | Plan mit 1 Schritt |
| `invoice.list`, `employee.availability`, `location.find`, `offer.list`, `request.list`, `attention.list`, `task.list`, `appointment.list`, `help` | Fragen | Antwort aus den Daten |
| `search` | alles andere | Suche (Auffang) |

Neue IDs folgen dem Muster `<objekt>.<verb>` aus der Liste in Abschnitt B.3.

### Nächste Schritte

1. `/api/ki/positionen` (Angebotspositionen aus Diktat, `angebote/erstwert.ts`) spricht noch direkt mit dem Modell –
   als Absicht mit `lane: 2` über den Gateway führen.
2. Weitere Aktionen: `offer.update`, `job.create`, `employee.schedule` (Einsatz planen), `document.create`, `time.correct`.
3. Anmeldung und Mandanten (Paket Fundament): Route hinter die Anmeldung, Kosten je Betrieb serverseitig messen statt im Browser.
4. Sprache: Speech-to-Text vor `frage(…, { kanal: 'sprache' })` – sonst nichts Neues.
5. Protokoll-Ansicht (`ki-protokoll`) für den Chef und Aufräumregel für alte Einträge.

---

## B. Strategie

### Ziel

Für **Macher OS / Handwerker OS** wird dieselbe grundlegende AI-Gateway-Strategie wie bei Peak One verwendet.

Das zentrale Prinzip:

> **Kein Modul spricht direkt mit einem AI-Modell.**  
> Alle AI-Anfragen, Intents, Aktionen und Modellaufrufe laufen über einen zentralen **Macher AI Gateway**.

Dadurch bleiben Kosten, Sicherheit, Rechte, Qualität, Modellwahl und Aktionen zentral steuerbar.

---

### 1. Grundarchitektur

```text
User
 ↓
Macher OS
 ↓
AI Gateway
 ↓
Intent + Kontext + Berechtigungen
 ↓
Routing
 ├─ Regel / normale Softwarelogik
 ├─ Jev / günstige Klassifikation
 ├─ Luna / Standard-AI
 └─ später stärkere Modelle bei Bedarf
 ↓
Tool / Aktion / Antwort
```

Der Gateway entscheidet für jede Anfrage:

1. Was möchte der Nutzer?
2. Welche Daten und welcher Kontext werden benötigt?
3. Welche Berechtigungen hat der Nutzer?
4. Brauchen wir überhaupt ein AI-Modell?
5. Welches Modell bzw. welche Lane reicht aus?
6. Welche strukturierte Action soll ausgeführt werden?
7. Muss der Nutzer die Aktion vorher bestätigen?

---

### 2. AI nur verwenden, wenn AI wirklich notwendig ist

Der Gateway prüft zuerst:

> **Kann Macher OS diese Anfrage deterministisch lösen?**

Beispiel:

> „Zeig mir alle offenen Angebote von Müller.“

Dafür ist kein großes Sprachmodell erforderlich.

Der Gateway erkennt beispielsweise:

```text
intent: offers.list
customer: Müller
```

Danach erfolgt eine normale Datenbankabfrage.

#### Prinzip

```text
Regel / Query
vor
kleinem Modell
vor
großem Modell
```

Ziel:

- niedrigere AI-Kosten
- schnellere Antworten
- höhere Zuverlässigkeit
- weniger Halluzinationen
- bessere Testbarkeit

---

### 3. Jev als günstiger Router

Die erste intelligente Ebene soll möglichst klein, schnell und günstig sein.

Jev übernimmt insbesondere:

- Intent-Erkennung
- Klassifikation
- Routing
- Entity-Erkennung
- Tool-Auswahl
- einfache Entscheidungen
- Confidence Scoring

Beispiel:

> „Mach Max Müller eine Rechnung über die Elektroarbeiten.“

Mögliche strukturierte Interpretation:

```json
{
  "intent": "invoice.create",
  "customer": "Max Müller",
  "project": "Elektroarbeiten",
  "confidence": 0.96
}
```

Anschließend wird keine allgemeine Chat-Antwort erzeugt, sondern die entsprechende Funktion in Macher OS aufgerufen.

#### Typische Macher-OS-Intents

```text
customer.search
customer.create

offer.create
offer.update
offer.send

job.create
job.update
job.complete

invoice.create
invoice.send

appointment.create
appointment.reschedule

employee.schedule
employee.search

time.track
time.correct

material.search
material.reserve

vacation.create
vacation.approve

document.search
document.create

message.draft
message.send
```

Die Intent-Library kann mit der Plattform wachsen.

---

### 4. Luna als Standard-AI

Wenn tatsächlich Sprachverständnis, Generierung, Zusammenfassung oder komplexere Interpretation notwendig ist, wird die Anfrage an die Standard-AI-Lane geschickt.

Beispiel:

> „Schreib Herrn Schneider freundlich, dass sich die Baustelle wegen Krankheit um zwei Tage verschiebt.“

Der Gateway stellt Luna nur den erforderlichen Kontext bereit:

```text
Kunde
Projekt
aktueller Termin
Ansprechpartner
Kommunikationshistorie
Unternehmensstil
```

Luna erstellt anschließend den Entwurf.

#### Wichtig

Das Modell erhält **nicht automatisch den gesamten Unternehmenskontext**.

Stattdessen gilt:

> Minimum Necessary Context.

Nur die Daten, die für die konkrete Aufgabe notwendig sind, werden an das Modell übergeben.

---

### 5. Strukturierte Actions statt direkter AI-Zugriffe

AI darf nach Möglichkeit nicht direkt Unternehmensdaten verändern.

Stattdessen erzeugt sie eine strukturierte Action.

Beispiel:

```json
{
  "action": "invoice.create_draft",
  "customer_id": "cus_123",
  "project_id": "project_456",
  "amount": 4280,
  "status": "draft"
}
```

Danach übernimmt Macher OS die eigentliche Business-Logik.

#### Vorteile

- Sicherheit
- Nachvollziehbarkeit
- Rollen und Rechte
- Audit Log
- Undo
- Validierung
- Tests
- reproduzierbare Abläufe
- geringeres Risiko durch Halluzinationen

---

### 6. Confirmation Layer

Nicht jede Aktion darf sofort ausgeführt werden.

Macher OS unterscheidet zwischen:

#### A. Read Actions

Können normalerweise ohne zusätzliche Bestätigung ausgeführt werden.

Beispiele:

> „Zeig mir offene Rechnungen.“

> „Wie viele Urlaubstage hat Jonas noch?“

> „Wann ist der nächste Termin bei Müller?“

> „Welche Baustellen laufen heute?“

---

#### B. Low-Risk Write Actions

Können je nach Einstellung direkt oder mit kurzer Bestätigung ausgeführt werden.

Beispiele:

- interne Notiz erstellen
- Aufgabe anlegen
- Zeit erfassen
- Projektstatus aktualisieren
- Entwurf erstellen

---

#### C. Kritische Actions

Müssen grundsätzlich vor der Ausführung bestätigt werden.

Beispiele:

- Rechnung versenden
- Angebot versenden
- E-Mail oder Nachricht versenden
- Termin mit Kunden verschieben
- Bestellung auslösen
- Zahlung veranlassen
- Mitarbeiterdaten verändern
- Daten löschen

Beispiel:

```text
Rechnung an Müller

4.280 €
Projekt: Badrenovierung

[Rechnung ansehen] [Senden]
```

Erst nach Bestätigung wird die Aktion ausgeführt.

---

### 7. Context Gateway

Der eigentliche langfristige Vorteil von Macher OS ist nicht das Sprachmodell.

Der entscheidende Vorteil ist der verbundene Unternehmenskontext.

```text
User
 ↓
Organisation
 ↓
Kunden
 ↓
Projekte / Baustellen
 ↓
Angebote
 ↓
Aufträge
 ↓
Termine
 ↓
Mitarbeiter
 ↓
Zeiten
 ↓
Material
 ↓
Rechnungen
 ↓
Dokumente
```

Da diese Objekte miteinander verbunden sind, kann Macher OS wesentlich bessere Antworten und Aktionen liefern als ein allgemeiner Chatbot.

Beispiel:

> „Was ist heute wichtig?“

Macher OS könnte auf Basis realer Unternehmensdaten antworten:

```text
Müller wartet seit drei Tagen auf sein Angebot.

Auf Baustelle Schneider fehlen zwei Materialpositionen.

Rechnung Weber über 7.820 € ist seit 14 Tagen offen.

Jonas ist morgen im Urlaub.
```

---

### 8. Voice verwendet denselben Gateway

Sprachsteuerung ist lediglich ein weiterer Input-Kanal.

```text
Sprache
 ↓
Speech-to-Text
 ↓
Macher AI Gateway
 ↓
Intent
 ↓
Context
 ↓
Action
 ↓
Preview / Confirmation
 ↓
Ausführen
```

Beispiele:

> „Schreib bei Müller noch zwei Stunden Nacharbeit auf das Projekt.“

> „Mach aus dem Auftrag von Schneider schon mal eine Rechnung.“

> „Wann muss ich morgen als Erstes hin?“

> „Schick Max eine Nachricht, dass wir gegen neun kommen.“

Der Gateway verarbeitet Sprache und Text identisch.

---

### 9. Ein AI-System statt AI pro Modul

Macher OS soll nicht für jedes Modul eine eigene isolierte AI bauen.

Nicht:

```text
CRM AI
Rechnungs AI
Projekt AI
Kalender AI
HR AI
Dokumenten AI
```

Sondern:

```text
                MACHER AI GATEWAY
                       │
     ┌─────────┬───────┼───────┬─────────┐
     ↓         ↓       ↓       ↓         ↓
   Kunden   Projekte  Termine Finance   Team
     ↓         ↓       ↓       ↓         ↓
    CRM      Auftrag Kalender Rechnung   HR
```

Dadurch kann ein einziger Nutzerbefehl mehrere Module miteinander verbinden.

---

### 10. Multi-Step Actions

Ein zentraler Gateway ermöglicht zusammengesetzte Aktionen.

Beispiel:

> „Der Müller-Auftrag ist fertig.“

Macher OS kann daraus eine Reihe verbundener Aktionen ableiten:

```text
✓ Auftrag abschließen
✓ offene Arbeitszeiten prüfen
✓ Materialkosten prüfen
✓ Rechnung vorbereiten
✓ Baustelle aus Einsatzplanung entfernen
✓ Kunde für Bewertungsanfrage vormerken
```

Der Nutzer bekommt anschließend beispielsweise:

```text
Auftrag Müller abschließen

✓ Rechnung vorbereiten
✓ Baustelle schließen
✓ Bewertung anfragen
✓ Mitarbeiter freigeben

[Alles ausführen]
```

Das ist ein wesentlicher Vorteil gegenüber einzelnen, nicht miteinander verbundenen SaaS-Tools.

---

### 11. Suggested Actions statt reinem Chat

Der AI Gateway sollte möglichst häufig konkrete nächste Aktionen anbieten.

Beispiel:

> „Die Arbeiten bei Müller sind abgeschlossen.“

Macher OS zeigt:

```text
Was möchtest du tun?

[Rechnung vorbereiten]
[Auftrag abschließen]
[Kunden informieren]
[Bewertung anfragen]
```

Die AI wird damit nicht nur zum Chatbot, sondern zu einer **Action Layer über dem gesamten Betriebssystem**.

---

### 12. Berechtigungen

Jede Action läuft durch die normale Rechte- und Rollenlogik von Macher OS.

Beispielrollen:

```text
Owner
Admin
Büro
Bauleiter
Mitarbeiter
Gast
```

Ein Mitarbeiter darf beispielsweise sagen:

> „Zeig mir meine Termine für morgen.“

Aber eventuell nicht:

> „Zeig mir den Umsatz aller Projekte.“

Der AI Gateway darf niemals bestehende Berechtigungen umgehen.

Prinzip:

```text
AI Permission
=
normale Macher-OS-Permission
```

---

### 13. Audit Log

Jede AI-Aktion sollte nachvollziehbar gespeichert werden.

Beispiel:

```json
{
  "user_id": "usr_123",
  "intent": "invoice.send",
  "action": "invoice.send",
  "entity_id": "inv_456",
  "model": "jev",
  "confirmed": true,
  "timestamp": "2026-10-02T14:00:00Z"
}
```

Damit kann später nachvollzogen werden:

- Wer hat etwas ausgelöst?
- Was wollte der Nutzer?
- Was hat AI verstanden?
- Welche Action wurde ausgeführt?
- Welches Modell wurde verwendet?
- Wurde die Aktion bestätigt?
- Welche Daten wurden verändert?

---

### 14. Model Lanes

Zum Start sollte Macher OS dieselbe kosteneffiziente Lane-Strategie wie Peak One verwenden.

#### Lane 0 – No AI

Normale Softwarelogik.

Beispiele:

- Datenbankabfragen
- Filter
- Berechnungen
- Regeln
- Automationen
- Validierungen

---

#### Lane 1 – Jev

Für:

- Routing
- Intent
- Klassifikation
- Entity Extraction
- Scoring
- einfache Entscheidungen

Ziel:

> So viel wie möglich über diese Lane lösen.

---

#### Lane 2 – Luna

Standard-AI für:

- Texte schreiben
- zusammenfassen
- interpretieren
- Informationen verbinden
- natürliche Sprache verstehen
- einfache komplexere Aufgaben

---

#### Lane 3+ – stärkere Modelle

Nur wenn tatsächlich notwendig.

Beispiele:

- komplexe Planung
- große Dokumentanalyse
- komplexe Argumentation
- besonders anspruchsvolle Aufgaben

Diese Lane sollte nicht der Default sein.

---

### 15. Kostenregel

Die zentrale Kostenlogik bleibt dieselbe wie bei Peak One.

```text
Regeln
↓
Jev
↓
Luna
↓
stärkeres Modell
```

Nicht umgekehrt.

Ziel:

- AI- und variable Infrastrukturkosten ideal: **5–10 % des Umsatzes**
- Target: **≤10 %**
- Warning: **15 %**
- Hard Ceiling: **20 %**

Der Gateway muss deshalb pro Request unter anderem berücksichtigen:

```text
Plan
AI-Budget
bisherige Nutzung
Komplexität
gewünschte Aktion
notwendige Qualität
```

---

### 16. Automationen sind keine Agents

Eine wichtige Architekturregel:

> **Automationen sind Regeln, keine autonomen Agents.**

Beispiel:

```text
Wenn Rechnung 14 Tage überfällig
→ Aufgabe erstellen
→ Büro informieren
```

Dafür braucht Macher OS keinen autonomen AI-Agent.

AI kann bei Bedarf einzelne Schritte unterstützen, aber die Automationslogik selbst bleibt deterministisch.

Das erhöht:

- Zuverlässigkeit
- Transparenz
- Geschwindigkeit
- Kostenkontrolle

---

### 17. Zielbild

Langfristig soll Macher OS so funktionieren:

Der Handwerksunternehmer muss nicht mehr wissen:

> „In welchem Modul muss ich das machen?“

Er sagt einfach:

> „Mach Max ein Angebot.“

> „Was muss heute dringend erledigt werden?“

> „Welche Rechnungen fehlen noch?“

> „Plan Jonas morgen auf die Müller-Baustelle.“

> „Schreib Schneider, dass wir später kommen.“

> „Der Auftrag ist fertig.“

Der **Macher AI Gateway** übersetzt natürliche Sprache in die richtigen Unternehmensaktionen.

---

### 18. Architektur-Prinzip in einem Satz

> **Macher OS verwendet AI nicht als isolierten Chatbot, sondern als zentralen, permission-aware Action- und Intelligence-Layer über allen verbundenen Unternehmensobjekten und Modulen.**

---

### 19. Technisches Leitprinzip

```text
Understand
→ Route
→ Fetch Context
→ Check Permissions
→ Choose Cheapest Sufficient Lane
→ Generate Structured Action
→ Validate
→ Ask for Confirmation if Required
→ Execute
→ Audit
```

Das sollte die kanonische Gateway-Pipeline von Macher OS sein.
