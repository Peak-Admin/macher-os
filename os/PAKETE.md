# Arbeitspakete & Verträge zwischen den Paketen

Macher OS wird in 14 parallelen Paketen gebaut. Jedes Paket arbeitet auf einem eigenen Branch
`claude/fervent-pascal-joztaz-<paket>` ausgehend von `claude/fervent-pascal-joztaz` und berührt **nur**
seine eigenen Ordner `os/src/modules/<modul-id>/`. Dadurch entstehen beim Zusammenführen keine Konflikte.

Pflichtlektüre: `CLAUDE.md`, `os/MODULE.md`, `os/src/core/objects.ts`, `os/src/core/modul.ts`,
`os/src/ui/index.tsx`, `os/src/ui/objekt.tsx`, Referenzmodul `os/src/modules/kunden/`,
Quelle der Modulliste: `docs/produkt/module.md`.

## Pakete und Modul-IDs (Ordnernamen)

| Paket | Module (`id` → Titel) |
|---|---|
| `heute` | `mein-tag` Mein Tag · `braucht-dich` Braucht dich · `naechster-einsatz` Nächster Einsatz · `schnell-erfassen` Schnell erfassen · `erledigt` Erledigt |
| `vertrieb` | `anfragen` Anfragen · `telefon` Telefon & Empfang · `besichtigungen` Besichtigungen · `aufmass` Aufmaß · `kalkulation` Kalkulation · `angebote` Angebote |
| `stamm` | `kunden` Kunden (Referenz ausbauen) · `orte` Orte & Baustellen · `anlagen` Anlagen · `kundenbereich` Kundenbereich · `bewertungen` Bewertungen & Empfehlungen |
| `akte` | `auftraege` Aufträge (zentrale Auftragsakte) · `aufgaben` Aufgaben · `checklisten` Checklisten · `arbeitsanweisungen` Arbeitsanweisungen · `material-am-auftrag` Material am Auftrag |
| `doku` | `fotos` Fotos & Dokumentation · `berichte` Berichte & Protokolle · `zusatzleistungen` Zusatzleistungen · `abnahme` Abnahme & Unterschrift · `nachrichten` Nachrichten · `dateien` Dateien |
| `service` | `wartung` Wartung & Service · `servicevertraege` Serviceverträge · `reklamationen` Gewährleistung & Reklamationen · `wiederkehrend` Wiederkehrende Termine (Bereich Plan) |
| `plan` | `kalender` Kalender · `terminbuchung` Terminbuchung · `einsatzplanung` Einsatzplanung · `offen` Offen einzuplanen · `auslastung` Auslastung · `verfuegbarkeit` Verfügbarkeit |
| `planpruefung` | `qualifikation-planung` Qualifikation bei der Planung · `fahrt` Fahrt & Route · `material-bereit` Material bereit? · `werkzeug-bereit` Werkzeug & Fahrzeug bereit? · `autoplanung` Automatische Planung |
| `team` | `mitarbeiter` Mitarbeiter · `arbeitszeiten` Arbeitszeiten · `abwesenheiten` Urlaub & Krankheit · `qualifikationen` Qualifikationen · `schulungen` Schulungen · `unterweisungen` Unterweisungen & Nachweise · `einarbeitung` Mitarbeiter einarbeiten · `bewerber` Bewerber |
| `material` | `artikel` Artikel & Material · `lager` Lager · `bedarf` Bedarf · `bestellungen` Bestellungen · `lieferanten` Lieferanten · `werkzeuge` Werkzeuge · `maschinen` Maschinen & Geräte · `fahrzeuge` Fahrzeuge · `pruefungen` Prüfungen & Wartung |
| `geld` | `rechnungen` Rechnungen · `zahlungen` Zahlungen · `mahnungen` Mahnungen · `belege` Eingangsrechnungen & Belege |
| `zahlen` | `kosten` Kosten · `nachkalkulation` Nachkalkulation · `ertrag` Ertrag · `auswertung` Auswertung · `datev` Steuerberater & DATEV |
| `unternehmen` | `leistungen` Leistungen & Preise · `vorlagen` Vorlagen & Formulare · `wissen` Wissen & Anleitungen · `subunternehmer` Subunternehmer · `rollen` Rollen & Rechte · `schnittstellen` Schnittstellen · `einstellungen` Einstellungen |
| `macher` | `macher-fragen` Macher fragen · `automatisch` Automatisch erledigen · `suche` Suche · `hinweise` Hinweise & Freigaben · `benachrichtigungen` Benachrichtigungen · `onboarding` Onboarding |

Bereichszuordnung: wie in `docs/produkt/module.md`. Betrieb-Module setzen `gruppe`
(`team`, `material`, `werkzeuge`, `geld`, `unternehmen`). Paket `macher` nutzt `bereich: 'macher'`
(keine Hauptnavigation, wirkt global).

## Objekt-Verantwortung (wer besitzt die Detailansicht)

Verlinke immer mit `pfadZu({ typ, id })` – **nie** Pfade anderer Pakete hart kodieren.

| Objekt | Besitzer-Modul | Pfad |
|---|---|---|
| `kunden` | kunden | `/auftraege/kunden/:id` |
| `orte` | orte | `/auftraege/orte/:id` |
| `anlagen` | anlagen | `/auftraege/anlagen/:id` |
| `auftraege` | auftraege | `/auftrag/:id` (absolute Route) |
| `angebote` | angebote | `/auftraege/angebote/:id` |
| `aufgaben` | aufgaben | `/auftraege/aufgaben/:id` |
| `termine` | kalender | `/plan/kalender/termin/:id` |
| `mitarbeiter` | mitarbeiter | `/betrieb/mitarbeiter/:id` |
| `abwesenheiten` | abwesenheiten | `/betrieb/abwesenheiten/:id` |
| `qualifikationen` | qualifikationen | `/betrieb/qualifikationen/:id` |
| `artikel` | artikel | `/betrieb/artikel/:id` |
| `lieferanten` | lieferanten | `/betrieb/lieferanten/:id` |
| `betriebsmittel` | werkzeuge (alle Arten, Liste filtert) | `/betrieb/werkzeuge/:id` |
| `rechnungen` | rechnungen | `/betrieb/rechnungen/:id` |
| `belege` | belege | `/betrieb/belege/:id` |
| `leistungen` | leistungen | `/betrieb/leistungen/:id` |
| `dokumente` | dateien | `/auftraege/dateien/:id` |
| `nachrichten` | nachrichten | `/auftraege/nachrichten` (Thread je Auftrag/Kunde) |

## Querschnitt-Verträge

**Overlays** (`oeffne(name)` aus der Topbar):
- `schnell` → Paket heute (`schnell-erfassen`, rendert `alleSchnellAktionen()`), optional `payload: { auftragId }`
- `suche`, `macher`, `benachrichtigungen` → Paket macher

**Schnell-erfassen-Aktionen** (`schnell` in defineModul): Foto, Sprachnotiz, Notiz → doku (`fotos`);
Zeit starten/stoppen → team (`arbeitszeiten`); Material → akte (`material-am-auftrag`); Aufgabe → akte (`aufgaben`);
Anruf/Anfrage → vertrieb (`telefon`); Beleg fotografieren → geld (`belege`).

**Tabs in der Auftragsakte** (`tabs: [{ objekt: 'auftraege', … }]`): Aufgaben & Checklisten (akte), Material (akte),
Fotos, Berichte, Zusatzleistungen, Abnahme, Nachrichten, Dateien (doku), Angebote/Aufmaß/Kalkulation (vertrieb),
Termine (plan), Rechnungen (geld), Kosten & Nachkalkulation (zahlen). Tabs gewichten, `sichtbar` nutzen, damit
nur Relevantes erscheint (Progressive Disclosure). Die Akte selbst zeigt Kopf, Phase, nächste Aktion und
`<ObjektTabs>`/`<ObjektPanels>`.

**Aktionen** (`aktionen`, aufrufbar über `aktionAusfuehren(id, payload)` – Rückgabe = Zielpfad):
| Aktion | Besitzer | Payload |
|---|---|---|
| `plan.einplanen` | plan (`einsatzplanung`) | `{ auftragId }` → Planungsansicht mit vorausgewähltem Auftrag |
| `plan.vorschlag` | planpruefung (`autoplanung`) | `{ auftragId }` → erzeugt Planvorschlag, gibt Pfad zurück |
| `angebot.erstellen` | vertrieb (`angebote`) | `{ auftragId }` → neuer Angebotsentwurf |
| `rechnung.erstellen` | geld (`rechnungen`) | `{ auftragId, art? }` → Rechnungsentwurf aus Auftrag |
| `besichtigung.planen` | vertrieb (`besichtigungen`) | `{ auftragId }` |
| `abnahme.starten` | doku (`abnahme`) | `{ auftragId }` |
| `bericht.erstellen` | doku (`berichte`) | `{ auftragId, terminId? }` |
| `bewertung.anfragen` | stamm (`bewertungen`) | `{ auftragId }` |
| `einsatz.starten` / `einsatz.beenden` | team (`arbeitszeiten`) | `{ terminId }` → startet/stoppt Zeiterfassung, setzt Terminstatus |

**Fachliche Events** (`emit`): `angebot.versendet`, `angebot.angenommen`, `abnahme.unterschrieben`,
`rechnung.versendet`, `zahlung.eingegangen`, `einsatz.gestartet`, `einsatz.beendet`, `anfrage.eingegangen`.
Zusätzlich feuert die Datenschicht automatisch `<sammlung>.created|updated|removed`.

**Eigene Sammlungen** – Namen vorab vergeben, um Doppelungen zu vermeiden (nur das genannte Paket legt sie an):
`checklisten`, `checklistenVorlagen`, `arbeitsanweisungen` (akte) · `aufmasse`, `kalkulationen` (vertrieb) ·
`berichte`, `zusatzleistungen`, `abnahmen` (doku) · `servicevertraege`, `reklamationen`, `serien` (service) ·
`buchungsfenster` (plan) · `bewertungen`, `portalzugaenge` (stamm) · `schulungen`, `unterweisungen`,
`einarbeitungen`, `bewerber` (team) · `bestellungen`, `lagerbewegungen` (material) · `mahnungen` (geld) ·
`vorlagen`, `wissen`, `subunternehmer`, `schnittstellen` (unternehmen) · `chat` (macher).
Alles andere ist ein Kernobjekt (`db.*`). Anrufe = `nachrichten` mit `kanal: 'telefon'`. Fotos/Dateien = `dokumente`.
Anfragen = `auftraege` in Phase `anfrage`. Besichtigungen = `termine` mit `art: 'besichtigung'`.

**Keine neuen npm-Abhängigkeiten.** Keine Änderungen außerhalb der eigenen Modulordner
(Ausnahme Paket macher: darf `src/core/gewerke.ts` ergänzen).
