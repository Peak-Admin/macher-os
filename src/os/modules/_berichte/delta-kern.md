# Delta „kern“ – API & Event System (12), Audit & Undo (11), Macher Action Engine (3)

## Was gebaut / erweitert wurde

### DELTA 12 – Gemeinsame Event-Architektur
- `src/os/core/ereignisse.ts` (neu): **Katalog** `EREIGNISSE` mit 40 fachlichen Ereignissen (deutscher Typ `<objekt>.<partizip>`,
  Titel, Beschreibung, Objekttyp, englischer API-Name, Herkunft abgeleitet/modul/frist), z. B. `kunde.angelegt` → customer.created,
  `anfrage.eingegangen` → request.created, `angebot.versendet` → quote.sent, `auftrag.eingeplant` → job.scheduled,
  `rechnung.bezahlt` → invoice.paid, `mitarbeiter.abwesend` → employee.absent, `material.knapp` → material.low_stock.
- **Zentrale Ableitung** aus Datenereignissen (z. B. `kunden.created` → `kunde.angelegt`, Rechnung auf „bezahlt“ →
  `rechnung.bezahlt`, Phase → `auftrag.schritt_gewechselt`/`gestartet`/`abgeschlossen`). Kein Modul wurde angefasst.
  Abgeleitete Events kommen als Microtask (`abgeleitet: true`); sendet ein Modul dasselbe Event selbst (synchron, gleiches
  Objekt), wird die Ableitung verworfen → keine Doppel-Auslösung bestehender Automationen.
- **Ereignisprotokoll** (Sammlung `ereignisprotokoll`): jedes fachliche Event mit Zeit, Quelle, Akteur, Mitarbeiter, Bezug,
  kleinen Daten. `ereignisseSeit()`. Fristen: `pruefeFristen()` → `rechnung.ueberfaellig` einmal je Fälligkeit.
- **Webhook-Vertrag**: Sammlungen `webhooks` + `webhook_auslieferungen` (Warteschlange mit Wiederholung), `webhookAnlegen`,
  `webhookUrlPruefen`, `webhookNutzlast`, `setzeWebhookVersender`, `webhooksZustellen`, `auslieferungErgebnis`. Versand im
  Browser: keiner (Stub) – die Warteschlange wird abgeglichen und kann serverseitig abgearbeitet werden. API in `docs/os/MODULE.md` §8.1.
- `events.ts`: `istDatenEreignis`, Merker gegen Doppel-Ableitung, `on()` ordnet Handler einer startenden Automation automatisch zu.

### DELTA 11 – Audit & Undo
- `db.ts`: jede Änderung schreibt `quelle` (user/automation/ai/import/sync), `akteurId`, `vonMitarbeiterId`, `aenderung` und
  bei Änderungen **nur geänderte Felder** mit vorher/nachher (große Werte gekürzt; Geld-/Lohnwerte der für Monteure gesperrten
  Sammlungen und `mitarbeiter.kostensatz` ohne Wert, damit über den Abgleich nichts leakt). Stille Änderungen (`leise`) werden
  zusammengefasst protokolliert („Bearbeitet: Positionen“). Klartext im Zeitstrahl: „Geändert: Status (Entwurf → Versendet) – durch Macher“.
- `akteur.ts` (neu): `alsAkteur`, `registriereAls`, `mitschneiden`. Automationen werden über `starteAutomationen` automatisch
  zugeordnet (Handler aus `start()` und `pruefen()`), Abgleich-Konflikte als `sync`.
- `audit.ts` (neu): `rueckgaengig`, `rueckgaengigGrund`, `allesRueckgaengig`, `rueckgaengigSperre` (festgeschriebene Rechnungen,
  Zahlungen gesperrt), `letzteAenderungen`, Rotation `verlaufAufraeumen` (365 Tage / 20 000, nur lokal über `vergessen`).
- `audit-text.ts` (neu): Feldnamen und Status in Klartext.
- Sichtbar: Verlauf am Objekt (bestehender Zeitstrahl) + Einstellungen › Papierkorb › „Letzte Änderungen zeigen“ (aufklappbar,
  Filter Alle/Durch Macher/Durch Menschen, „Rückgängig“). Kein eigenes Audit-Modul.

### DELTA 3 – Macher Action Engine
- `src/os/core/aktionen.ts` (neu): Befehl-Typen, Registry über neue optionale `defineModul`-Eigenschaft `befehle`,
  `erkenneBefehl` (Regeln) + optionale KI-Schnittstelle `setzeAbsichtsErkenner`, `findeKunde/findeMitarbeiter/findeAuftrag`,
  Fähigkeitsklassen READ/WRITE/MONEY/PUBLICATION/DESTRUCTIVE mit Rechten, `freigabeStufe` (sofort/bestätigen/freigeben),
  `befehlVorbereiten` (Rechte vor der Vorschau), `befehlAusfuehren` (prüft Rechte + Freigabe erneut, läuft als Macher im Auftrag
  des Menschen, schneidet Verlaufseinträge mit, sendet `macher.aktion_ausgefuehrt`), `befehlRueckgaengig`.
- `macher-fragen/befehle.ts` (neu), registriert in `macher-fragen/index.tsx`:
  „Mach Müller die Rechnung fertig“ (→ `rechnung.erstellen`), „Plane Jonas morgen bei Schneider ein“ (freies Fenster aus
  `verfuegbarkeit` → `autoplanung.uebernehmen`), „Was fehlt noch für die Baustelle Wagner?“ (READ: Material, Lagerbedarf,
  Aufgaben, Checklisten, Termin, Zusage), „Bestell das fehlende Material“ (→ `material.bestellvorschlag`), „Erinnere alle Kunden,
  deren Rechnung länger als 14 Tage offen ist“ (Mahnstufe aus `mahnungen`, Freigabe, mailto-Links), „Schreib Frau Müller, dass
  wir morgen um 8 Uhr kommen“ (Text in Hauptsatz umgestellt, Datum ergänzt, editierbar, Versand über mailto/WhatsApp).
- Chat: neue Vorschlagsart `befehl` mit Vorschau, Klassen-Status, editierbaren Feldern, Bestätigungsdialog bei Freigabe,
  „Öffnen“, App-Links und „Rückgängig machen“. Macher bleibt Overlay, kein neuer Hauptbereich.
- `findeKunde/findeMitarbeiter` in `assistent.ts` nutzen jetzt die Kern-Umsetzung (Umlaute: „Mueller“ = „Müller“).

## Wiederverwendete Systeme
`db`/Zeitstrahl (`ereignisse`), Event-Bus, `aktionen` der Module (rechnungen, autoplanung, bedarf, mahnungen), Rechte (`darf`),
Verfügbarkeit, Bedarf, Mahnregeln, Nachrichten-Versandlinks, Papierkorb (Soft Delete), Abgleich (Ereignisse/Protokoll synchronisieren mit).

## Events
- Gesendet (Kern): alle abgeleiteten Events des Katalogs, `rechnung.ueberfaellig` (Frist), `macher.aktion_ausgefuehrt`.
- Abonniert: `*` (Ableitung + Protokoll).

## Automationen
Keine neue Automation. `automatisch.pruefeAlle` ruft zusätzlich `pruefeFristen()` und `webhooksZustellen()` auf und führt
`pruefen()` im Namen der Automation aus.

## Neue Sammlungen
`ereignisprotokoll`, `webhooks`, `webhook_auslieferungen` (Kern). Neue optionale Felder an `Ereignis` (rückwärtskompatibel).

## Kernwünsche / Hinweise an andere Agenten
- **Integrations-Agent (`schnittstellen`)**: Webhook-Oberfläche über `@core/ereignisse` (`webhooks`, `webhookAnlegen`,
  `webhookUrlPruefen`, `ereignisKatalog()` für die Auswahl, `webhookAuslieferungen` für den Status). Server-Versand: Warteschlange
  aus `objekte` lesen, signieren, `auslieferungErgebnis` schreiben.
- **Shell/UI (`ui/objekt.tsx`)**: Der `Zeitstrahl` könnte je Eintrag „Rückgängig“ anbieten (`rueckgaengigGrund(e)`/`rueckgaengig(e.id)`)
  und bei `quelle === 'automation' | 'ai'` „Macher“ statt keinem Namen zeigen. Nicht meine Zuständigkeit – heute steht „– durch Macher“ im Text.
- **Paket Paid (`abo`)**: `ereignisprotokoll`, `webhook_auslieferungen` als Systemsammlungen im Lesemodus freigeben
  (heute fängt der Kern den Schreibfehler ab, das Event geht trotzdem raus).
- **Server/Migration**: `ereignisprotokoll` und `webhooks` könnten in `sammlung_rechte` auf Chef/Büro begrenzt werden.
- **Import-Agent**: Importe in `alsAkteur({ quelle: 'import', id }, …)` ausführen und am Ende `emit({ typ: 'import.abgeschlossen', … })`.
- Module, die fachliche Events selbst senden, sollen sie synchron direkt neben der Änderung senden (sonst Doppel-Ableitung möglich).

## Offene Punkte
- KI-Erkennung ist nur als Schnittstelle vorbereitet (`setzeAbsichtsErkenner`), kein Adapter.
- Der Webhook-Versand selbst (Signatur, HTTP) ist serverseitig noch zu bauen.
- Kontext-Zusammenfassung über Wochenenden: „Plane … morgen“ an Feiertagen antwortet mit Rückfrage statt nächstem Arbeitstag.

## Testergebnis
`npm run typecheck` grün, `npm run lint` 0 Fehler (nur bestehende Warnungen), `npm test` 115 Dateien / 824 Tests grün,
`npm run build` grün. Browser (Spielwiese, 1440 px und 390 px): alle sechs Sätze im Chat, Freigabedialog, Rückgängig,
„Letzte Änderungen“ – keine Konsolenfehler, keine horizontale Rollleiste bei 390 px. Hinweis: Mein Worktree stand auf
`23e2a03` (ohne `src/os`); ich habe per Fast-Forward auf `3b35be5` (Stand des Hauptcheckouts) aufgesetzt. Neue Tests:
`core/audit.test.ts`, `core/ereignisse.test.ts`, `macher-fragen/befehle.test.ts` (Absicht, Freigabe, alle sechs Befehle, Rückgängig).
