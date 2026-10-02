# Abschlussbericht Paket `plan`

Branch: `claude/fervent-pascal-joztaz-plan` · Bereich **Plan** · 6 Module

## Gebaute Module und Ansichten

| Modul | Ansichten / Einhängepunkte |
|---|---|
| `kalender` | `/plan/kalender` (Tag · Woche · Monat, mobil Agenda-Liste für 14 Tage, Filter nach Mitarbeiter; Monteure sehen standardmäßig nur sich) · Termin-Detail `/plan/kalender/termin/:id` (`detail` für `termine`, `<ObjektTabs objekt="termine">` + `<ObjektPanels objekt="termine">` in der Seitenspalte) · Dialoge Termin anlegen/bearbeiten, Verschieben (+1 Tag/+1 Woche, Konfliktprüfung), Absagen mit Grund · ICS-Export · Tab „Termine“ an `auftraege` · „Neu“-Eintrag „Termin anlegen“ · Suche |
| `einsatzplanung` | `/plan/einsatzplanung` Plantafel Mitarbeiter × Tage (Woche, Wochenende zuschaltbar), Auftrag wählen → „Hier einplanen“ mit vorbelegter erster freier Zeit und Reststunden, Drag & Drop (Tag/Mitarbeiter tauschen, Rückgängig), Konflikte als Text-Status; mobil Tagesansicht je Mitarbeiter · Aktion `plan.einplanen { auftragId }` → `/plan/einsatzplanung?auftrag=<id>` |
| `offen` | Hub-Widget im Plan-Hub + `/plan/offen` mit Filter · je Eintrag „Einplanen“ und „Vorschlag“ (`aktionAusfuehren('plan.vorschlag')`, falls Paket planpruefung fehlt: eingebauter Fallback = nächste freie Zeit im Termin-Dialog) |
| `auslastung` | `/plan/auslastung` (4 Wochen, geplant/verfügbar h, Text-Status; mobil Karten) · Kennzahlen „diese/nächste Woche“ im Plan-Hub |
| `verfuegbarkeit` | `daten.ts` mit zentralen, getesteten Funktionen (siehe unten) · `/plan/verfuegbarkeit` „Wer ist wann da?“ (Woche; mobil Tag) + „Freie Zeit finden“ fürs Telefon + Dialog „Arbeitstage“ |
| `terminbuchung` | `/plan/terminbuchung` (Bitte bestätigen, Buchungslink kopieren, Terminarten pflegen) · öffentliche Vollbildroute `/buchen/:token` · Panel „Online-Termin“ am Kunden (persönlicher Link) |

Navigation: alle sechs in der Unternavigation „Plan“; Hub zeigt „Offen einzuplanen“ und „Auslastung“.

### Öffentliche API für andere Pakete (`src/modules/verfuegbarkeit/daten.ts`)
- `verfuegbar(mitarbeiterId, start, ende, { kontext?, ohneTerminId? }) → boolean`
- `pruefeVerfuegbarkeit(...) → { verfuegbar, gruende: { art, text, blockiert, terminId?, abwesenheitId? }[] }`
- `freieSlots({ von, bis, dauerMinuten, mitarbeiterIds?, rasterMinuten?, zeitVon?, zeitBis?, wochentage?, pufferMinuten?, mindestens?, ab?, max?, kontext? }) → { start, ende, mitarbeiterIds }[]`
- `terminKonflikte(termin)`, `verfuegbareStunden`, `geplanteStunden`, `anwesenheit`, `kontextAusDb()`, `wochenStart`, `tage`
- Kalender: `TerminFormular` (Dialog, `vorgabe: { auftragId, mitarbeiterIds, datum, von, bis, art, titel }`), `terminAlsIcs`, `kuenftigeTermine`

## Wichtigste Pain Points (Top 5 je Modul)

- **Kalender:** Monteur weiß nicht sicher, wo er hin muss (90) · Termine in drei Kalendern (81) · Doppelbuchung fällt zu spät auf (80) · Verschieben kostet fünf Anrufe (72) · Wochenraster am Handy unlesbar (72)
- **Einsatzplanung:** Wochenplanung nur im Kopf des Chefs (90) · Doppelbuchung/Urlaub fällt morgens auf (80) · Krankmeldung um 6:30 (70) · „Wer hat noch Luft?“ (63) · Beauftragtes wird nicht eingeplant (63)
- **Offen einzuplanen:** Auftrag rutscht durch (70) · Dringende Störung geht unter (60) · Besichtigungswunsch unbeantwortet (54) · Keine Reihenfolge (48) · Abgesagter Termin → Auftrag wieder offen, keiner merkt es (40)
- **Auslastung:** Zusagen ohne Kapazitätswissen (72) · Ungleich verteilte Last (56) · „Wann könnt ihr?“ (56) · Urlaub nicht abgezogen (48) · Leerlauf zu spät erkannt (45)
- **Verfügbarkeit:** „Wann habt ihr Zeit?“ am Telefon (64) · „Ist Jonas Donnerstag da?“ (63) · Jedes Werkzeug rechnet anders (54) · Krankheit/Schule vergessen (48) · Betriebsarbeitszeit nirgends hinterlegt (35)
- **Terminbuchung:** Telefon-Ping-Pong (72) · Kunden erreichen niemanden (63) · Online-Buchung kollidiert (50) · Neue Kunden von Hand anlegen (42) · Doppelte Kunden (36)

Details: `PAINPOINTS.md` in jedem Modulordner.

## Automationen und Hinweise

| ID / Schlüssel | Was passiert | Standard |
|---|---|---|
| `kalender.verloren-absagen` | Auftrag → „nicht zustande gekommen“: künftige Termine absagen, Eintrag in „Erledigt“ mit Rückgängig (`plan.termine-wiederherstellen`) | an |
| `einsatzplanung.abwesenheit-pruefen` | Genehmigte Abwesenheit → betroffene Termine finden, Benachrichtigung + „Erledigt“ | an |
| `terminbuchung.auto-bestaetigen` | Online-Buchung ohne Konflikt sofort bestätigen (Rückgängig: `termin.zuruecksetzen`) | aus |
| Regel `terminbuchung.buchung` | Jede Online-Buchung: Kunde angelegt/erkannt, Anfrage + Termin, Event `anfrage.eingegangen`, Benachrichtigung, „Erledigt“ | immer |
| Hinweis `termin-ohne-mitarbeiter:*` | Termin in den nächsten 2 Tagen ohne Mitarbeiter (74) | live |
| Hinweis `plan-konflikt:*` | Konflikt (Doppelt, Urlaub, außerhalb Arbeitszeit, kein Arbeitstag) in den nächsten 14 Tagen (82 bzw. 48) | live |
| Hinweis `offen-dringend:*` | Dringender Auftrag ohne Termin, Aktionen Einplanen/Vorschlag (80) | live |
| Hinweis `offen-wartet-lange` | Beauftragte Aufträge > 14 Tage ohne Termin (52) | live |
| Hinweis `auslastung-ueberlast:*` | Mitarbeiter diese/nächste Woche überlastet (62/50) | live |
| Hinweis `buchung-bestaetigen:*` | Online gebucht – bitte bestätigen, Aktion `termin.bestaetigen` (76) | live |

Registrierte Aktionen: `plan.einplanen`, `termin.bestaetigen`, `termin.zuruecksetzen`, `plan.termine-wiederherstellen`.

Verschieben/Absagen/Einplanen wird per `vermerken` im Zeitstrahl des Auftrags festgehalten; Phase des Auftrags wird beim Einplanen **nicht** geändert.

## Eigene Sammlungen

- `buchungsfenster` (terminbuchung) – buchbare Terminarten; `seed` legt „Besichtigung vor Ort (60 min)“ und „Kundendienst / Reparatur (90 min)“ mit `beispiel: true` an.
- Einstellungen (keine Sammlung): `plan.arbeitstage` (Standard Mo–Fr), `terminbuchung.links` (Token → optional `kundeId`).

## Kernwünsche

1. **Arbeitstage und individuelle Arbeitszeiten**: `Betrieb.arbeitstage` und optional `Mitarbeiter.arbeitszeiten` (Teilzeit-Wochentage). Aktuell Einstellung `plan.arbeitstage` im Modul.
2. ~~Feiertage je Bundesland~~ – erledigt: `@core/kalender` (`feiertage`, `istArbeitstag`), Bundesland als Einstellung `plan.bundesland` (Dialog „Arbeitstage & Feiertage“ in Verfügbarkeit).
3. **`Seite` mit `aktion` für mehrere Knöpfe** bzw. ein `Knopfleiste`-Baustein; außerdem ein `Status`-fähiges `Filter`/`Segmente` für Uhrzeit-Slots (Slots sind aktuell Buttons in einer Flex-Zeile mit `plan.css`).
4. **Kalender-Grundbausteine im UI-Kern** (Wochenraster, Monatsraster, Termin-Kachel), damit andere Pakete (z. B. heute, service) sie wiederverwenden, statt `plan.css` zu importieren.
5. **Öffentliche Token/Links im Kern** (gemeinsam mit Kundenbereich `/k/:token`): eine Sammlung für Freigabe-Links statt Einstellungs-Map.
6. **Versand** (E-Mail/SMS) für Terminbestätigung und Erinnerung an Kunden.
7. `Termin.ende` für mehrtägige Einsätze ist möglich, das Formular legt aber nur eintägige Termine an – ein Kern-Konzept „Einsatzblock“ wäre hilfreich.

## Offene Punkte

- Termine über Mitternacht/mehrtägig werden angezeigt und berechnet, aber im Formular nicht angelegt.
- „Vorschlag“ nutzt ohne Paket planpruefung nur die nächste freie Zeit (ohne Fahrt/Qualifikation).
- Buchungsseite hat keinen Spam-Schutz; Kunden können nicht selbst umbuchen/absagen (Kundenbereich).
- Tab „Termine“ in der Auftragsakte ist registriert; sichtbar wird er, sobald das Paket akte die Akte rendert.
- Datum/Uhrzeit-Felder nutzen native Eingaben (Darstellung je nach Browser-Sprache).

## Testergebnis

```
cd os && npm ci && npx tsc -b && npx vitest run && npx vite build
```
- `tsc -b`: fehlerfrei
- `vitest run`: 7 Testdateien, 42 Tests grün (davon 37 im Paket plan: verfuegbarkeit 14, kalender 7, terminbuchung 8, einsatzplanung 3, offen 3, auslastung 2)
- `vite build`: erfolgreich
- Browser (Playwright, Chromium, 1440 px und 390 px, nach „Beispielbetrieb einrichten“): Plan-Hub, Kalender Tag/Woche/Monat/Agenda, Termin anlegen (Validierung, „Nächste freie Zeit finden“), Termin-Detail, Verschieben, Bestätigen, Absagen (mit Rückgängig), Plantafel inkl. Einplanen aus „Offen“ und Drag & Drop, Offen, Auslastung, Verfügbarkeit, Terminbuchung, öffentliche Buchung `/buchen/:token` bis zur Erfolgsseite, ungültiger Link – **keine Konsolenfehler**.
