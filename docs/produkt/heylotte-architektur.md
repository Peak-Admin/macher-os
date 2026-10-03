# Handwerk OS × HeyLotte — API- und Systemarchitektur

## Zielbild

**Handwerk OS = System of Record**  
**HeyLotte = AI- und Conversation-Layer**

HeyLotte versteht die Eingabe des Nutzers über Sprache, WhatsApp oder Chat.  
Handwerk OS bleibt verantwortlich für Daten, Berechtigungen, Geschäftslogik, Validierung und die eigentliche Ausführung.

> **Architekturregel:**  
> **HeyLotte versteht. Handwerk OS entscheidet und führt aus.**

---

## 1. Grundarchitektur

```text
WhatsApp / Voice / Chat
        ↓
     HeyLotte
  versteht Absicht
        ↓
 Handwerk OS Action API
        ↓
Permissions / Validation
        ↓
Handwerk OS Core + Datenbank
        ↓
 Event / Webhook zurück
        ↓
     HeyLotte
        ↓
„Angebot ist erstellt ✅“
```

HeyLotte greift **nicht direkt auf die Handwerk-OS-Datenbank** zu.

Die Kommunikation erfolgt ausschließlich über definierte APIs und Events.

---

## 2. Rollen der Systeme

### Handwerk OS besitzt

- Kunden
- Kontakte
- Projekte
- Aufträge
- Baustellen
- Angebote
- Rechnungen
- Zahlungen
- Termine
- Mitarbeiter
- Rollen und Rechte
- Zeiterfassung
- Urlaub
- Ressourcen
- Fahrzeuge
- Lager
- Dokumente
- Prozesse
- Reporting
- Audit Logs
- Integrationen
- Stammdaten
- Geschäftslogik

### HeyLotte besitzt

- WhatsApp-Interface
- Voice-Interface
- Conversational UI
- Intent Detection
- Sprache → strukturierte Aktion
- Rückfragen
- Bestätigungsdialoge
- KI-Assistenz
- natürlichsprachliche Bedienung

---

## 3. Beispiel: Angebot per Sprache

Der Handwerker sagt:

> „Lotte, mach für Müller ein Angebot über 8.500 €, Badrenovierung nächste Woche.“

HeyLotte extrahiert:

```json
{
  "action": "create_quote",
  "customer": "Müller",
  "project": "Badrenovierung",
  "amount": 8500,
  "requested_period": "next_week"
}
```

HeyLotte ruft dann beispielsweise auf:

```http
POST /v1/actions/create-quote
```

Payload:

```json
{
  "organization_id": "org_123",
  "user_id": "usr_123",
  "customer_id": "cus_456",
  "project_id": "prj_789",
  "amount": 8500,
  "source": "heylotte"
}
```

Handwerk OS übernimmt anschließend:

1. User authentifizieren
2. Organisation prüfen
3. Berechtigungen prüfen
4. Kundendaten laden
5. Projekt zuordnen
6. Preislogik anwenden
7. Steuern berechnen
8. Nummernkreis anwenden
9. Vorlage auswählen
10. Angebotsentwurf erzeugen
11. Audit Log schreiben
12. Ergebnis an HeyLotte zurückgeben

Response:

```json
{
  "status": "draft_created",
  "quote_id": "quo_123",
  "total": 8500,
  "requires_confirmation": true
}
```

HeyLotte antwortet:

> „Das Angebot über 8.500 € für Müller ist fertig. Soll ich es verschicken?“

---

# 4. Action API statt direktem CRUD

Für die KI sollte zusätzlich zu normalen CRUD-Endpunkten eine eigene **Action API** existieren.

Nicht nur:

```text
POST /customers
POST /invoices
PATCH /projects
```

Sondern:

```text
POST /actions/create-quote
POST /actions/send-quote
POST /actions/create-invoice
POST /actions/send-invoice
POST /actions/schedule-appointment
POST /actions/reschedule-appointment
POST /actions/log-time
POST /actions/create-customer
POST /actions/create-job
POST /actions/close-job
POST /actions/remind-customer
POST /actions/order-material
POST /actions/add-note
POST /actions/upload-document
POST /actions/assign-employee
POST /actions/report-sick-leave
```

## Warum Action APIs?

HeyLotte soll nicht wissen müssen:

- welche Tabellen betroffen sind
- welche Foreign Keys existieren
- wie Rechnungsnummern erzeugt werden
- welche Steuerlogik gilt
- welche Workflows ausgelöst werden
- welche Permissions intern existieren

HeyLotte sagt nur:

```json
{
  "action": "create_invoice",
  "job_id": "job_123"
}
```

Handwerk OS übernimmt die komplette interne Logik.

---

# 5. Events und Webhooks

Die Kommunikation darf nicht nur von HeyLotte zu Handwerk OS funktionieren.

Handwerk OS muss Ereignisse auch an HeyLotte senden können.

## Beispiel-Events

```text
customer.created

project.created
project.updated
project.completed

job.created
job.assigned
job.started
job.completed

quote.created
quote.sent
quote.viewed
quote.accepted
quote.rejected
quote.expired

invoice.created
invoice.sent
invoice.viewed
invoice.overdue
invoice.paid

appointment.created
appointment.changed
appointment.cancelled

employee.absent
employee.sick
employee.assigned

time_entry.created

document.uploaded

payment.received
```

Beispiel:

```json
{
  "event": "invoice.overdue",
  "organization_id": "org_123",
  "invoice_id": "inv_987",
  "customer_id": "cus_456",
  "days_overdue": 14
}
```

HeyLotte kann daraus machen:

> „Die Rechnung von Müller ist seit 14 Tagen offen. Soll ich eine Zahlungserinnerung schicken?“

---

# 6. Event Bus

Langfristig empfiehlt sich ein eigener Event Layer.

```text
Handwerk OS Core
      ↓
   Event Bus
      ↓
 ┌───────────────┐
 │ HeyLotte      │
 │ Notifications │
 │ Automations   │
 │ Analytics     │
 │ Integrations  │
 └───────────────┘
```

Wichtig:

Events beschreiben, **was passiert ist**.

Actions beschreiben, **was passieren soll**.

Beispiel:

```text
Action:
create_invoice

Event:
invoice.created
```

---

# 7. Identitäten verbinden

HeyLotte und Handwerk OS benötigen eine eindeutige Zuordnung von Organisationen und Nutzern.

```text
HeyLotte Workspace
        ↕
Handwerk OS Organisation

HeyLotte User
        ↕
Handwerk OS User
```

Beispiel:

```text
lotte_workspace_673
→ handwerk_org_123

lotte_user_928
→ handwerk_user_493
```

Dadurch weiß Handwerk OS:

- Wer spricht?
- Zu welchem Unternehmen gehört die Person?
- Welche Rolle hat sie?
- Welche Aktionen darf sie ausführen?
- Welche Daten darf sie sehen?

---

# 8. Berechtigungen

Die Berechtigungslogik bleibt vollständig im Handwerk OS.

HeyLotte darf nicht selbst entscheiden, was ein Nutzer darf.

Beispiel:

Ein Monteur darf:

- eigene Zeiten buchen
- Baustelleninformationen ansehen
- Fotos hochladen
- Notizen hinzufügen
- Materialbedarf melden

Ein Monteur darf möglicherweise nicht:

- Rechnungen stornieren
- Preise verändern
- Mitarbeiter löschen
- Zahlungsdaten ändern
- sensible Finanzberichte sehen

Request:

```text
HeyLotte
    ↓
Handwerk OS API
    ↓
Auth
    ↓
Organisation
    ↓
Role
    ↓
Permission
    ↓
Action
```

---

# 9. Authentifizierung

Empfohlen:

- OAuth 2.0
- kurzlebige Access Tokens
- Refresh Tokens
- Service-to-Service Authentication
- Webhook Signing
- API Key Rotation
- Rate Limits

HeyLotte sollte niemals einen Supabase Service Role Key bekommen.

Falsch:

```text
HeyLotte
    ↓
Supabase direkt
```

Richtig:

```text
HeyLotte
    ↓
Handwerk API Gateway
    ↓
Authentication
    ↓
Permissions
    ↓
Handwerk OS Services
    ↓
Supabase
```

---

# 10. API Gateway

Empfohlene Architektur:

```text
HeyLotte
   ↓
Handwerk API Gateway
   ↓
┌─────────────────────┐
│ Authentication      │
│ Authorization       │
│ Permission Checks   │
│ Validation          │
│ Rate Limiting       │
│ Logging             │
│ Audit Trail         │
│ Idempotency         │
│ Versioning          │
└──────────┬──────────┘
           ↓
       Handwerk OS
```

---

# 11. Gesamtarchitektur

```text
                       ┌────────────────────┐
                       │     HEY LOTTE      │
                       │                    │
 WhatsApp ────────────►│ Conversation       │
 Voice ───────────────►│ Intent Detection   │
 Chat ────────────────►│ AI                 │
                       └─────────┬──────────┘
                                 │
                           Action API
                                 │
                       ┌─────────▼───────────────┐
                       │ Handwerk API Gateway   │
                       │                         │
                       │ Auth                    │
                       │ Permissions             │
                       │ Rate Limits             │
                       │ Validation              │
                       │ Audit Log               │
                       └─────────┬───────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ↓               ↓               ↓
             Customers        Projects        Finance
             CRM              Jobs            Quotes
             Contacts         Calendar        Invoices
                 ↓               ↓               ↓
                 └───────────────┼───────────────┘
                                 │
                            Supabase
                                 │
                           Event Bus
                                 │
                                 ▼
                            HeyLotte
```

---

# 12. Integrationen

Drittanbieter sollten möglichst über Handwerk OS laufen.

```text
HeyLotte
   ↓
Handwerk OS
   ↓
Integration Layer
   ↓
Pipedream / direkte APIs / Format Engine
   ↓
DATEV
Google
Microsoft
Banken
E-Mail
Kalender
Lieferanten
Branchensoftware
```

Dadurch müssen Integrationen nicht doppelt gepflegt werden.

---

# 13. Produktgrenze

## Handwerk OS

> Das Betriebssystem des Handwerksbetriebs.

Handwerk OS verwaltet die Unternehmensrealität.

## HeyLotte

> Die natürliche KI-Bedienoberfläche des Handwerksbetriebs.

HeyLotte ermöglicht es, diese Unternehmensrealität über Sprache, WhatsApp und Chat zu steuern.

---

# 14. Strategischer Vorteil

Die Architektur verhindert, dass HeyLotte und Handwerk OS zu konkurrierenden Produkten werden.

Stattdessen:

```text
HeyLotte
     ↓
AI / Conversational Layer
     ↓
Handwerk OS API
     ↓
Business Operating System
     ↓
Integrationen + Daten
```

HeyLotte kann gleichzeitig:

1. eigenständig als KI-Bürokraft funktionieren
2. als Premium-Interface für Handwerk OS dienen
3. bestehende Handwerk-OS-Kunden bedienen
4. als Akquisitionskanal für Handwerk OS funktionieren

---

# 15. Wichtigste Architekturprinzipien

1. **Kein direkter Datenbankzugriff für HeyLotte**
2. **Handwerk OS bleibt System of Record**
3. **HeyLotte bleibt Conversational Layer**
4. **Business Logic bleibt im Handwerk OS**
5. **Permissions bleiben im Handwerk OS**
6. **AI arbeitet über definierte Actions**
7. **Handwerk OS sendet Events zurück**
8. **Jede Aktion wird auditiert**
9. **Sensible Aktionen benötigen Bestätigung**
10. **APIs werden versioniert**
11. **Integrationen werden nicht doppelt gebaut**
12. **Organisationen und User werden eindeutig gemappt**
13. **HeyLotte kennt möglichst wenig interne Datenbankstruktur**
14. **Handwerk OS bleibt auch ohne HeyLotte vollständig nutzbar**
15. **HeyLotte bleibt theoretisch auch mit anderen Systemen integrierbar**

---

# 16. Zielbild

> **Handwerk OS ist das Betriebssystem.**
>
> **Lotte ist die KI, mit der der Handwerker dieses Betriebssystem bedient.**

Damit sind die Rollen klar getrennt und beide Produkte können gemeinsam wachsen, ohne sich gegenseitig ersetzen zu müssen.
