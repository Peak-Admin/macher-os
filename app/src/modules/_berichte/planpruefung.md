# Abschlussbericht Paket `planpruefung`

Branch: `claude/fervent-pascal-joztaz-planpruefung`

## Gebaute Module und Ansichten

| Modul | Navigation | Ansichten | Wirkt über |
|---|---|---|---|
| `qualifikation-planung` | versteckt | – | Hinweise, Aktion `qualifikation.dazuholen`, Automation, Einsatz-Check |
| `fahrt` | hub | `/plan/fahrt` „Route heute“ | Hinweise, Aktion `fahrt.schieben`, Automation, Einsatz-Check, Score der Autoplanung |
| `material-bereit` | hub | `/plan/material-bereit` | Hinweise, Aktionen `materialbereit.bedarf/.auftrag`, Automation, Einsatz-Check |
| `werkzeug-bereit` | hub | `/plan/werkzeug-bereit` | Hinweise, Aktion `werkzeug.tauschen`, Automation, Einsatz-Check |
| `autoplanung` | haupt | `/plan/autoplanung` (alle vorplanen → Vorschau → übernehmen), `/plan/autoplanung/:auftragId` (Vorschläge mit Begründung) | Aktion `plan.vorschlag` + `autoplanung.uebernehmen`, Panels an `termine` („Einsatz-Check“) und `auftraege` („Einplanen“, „Einsatz-Check“), Automation |

Jede Prüfung ist eine reine Funktion auf einem Datenschnappschuss (`Kontext`) mit Ergebnis
`{ ergebnis: 'ok' | 'warnung' | 'problem', text, loesung? }`:
`pruefeQualifikation`, `pruefeUebergang`/`pruefeFahrtFuerTermin`, `pruefeMaterial`/`pruefeMaterialFuerTermin`, `pruefeWerkzeug`.
Gemeinsame Grundlage: `autoplanung/basis.ts` (Typen, Kontext, Zeit-Helfer, minimale Verfügbarkeit).

## Wichtigste Pain Points (Top 5 je Modul)

- **Qualifikation:** Fachkraft fehlt im Team (60) · Nachweis am Einsatztag abgelaufen (50) · Umplanen ohne Prüfung (49) · Wer wäre qualifiziert und frei? (49) · Anforderung nur im Kopf (42)
- **Fahrt:** Fahrzeit zwischen Einsätzen reicht nicht (64) · Adressen einzeln ins Navi (45) · keine Tagesübersicht am Handy (45) · Büro ohne Entfernungsgefühl (42) · kreuz und quer fahren (36)
- **Material:** Material fehlt vor Ort (63) · bestellt, aber nicht da (48) · keiner prüft vorab (48) · Bestand reicht nicht für zwei Baustellen (40) · Morgens zum Großhandel (36)
- **Werkzeug & Fahrzeug:** Gerät ohne gültige Prüfung (45) · Doppelbelegung (40) · Standort unklar (36, bewusst ausgelassen) · Prüffristen zu spät bemerkt (35) · defekt eingeplant (32)
- **Autoplanung:** Wochenplanung dauert Stunden (72) · Störung: wer kann am schnellsten hin? (63) · Planung hängt am Chef (45) · Qualifikation/Urlaub/Fahrweg übersehen (42) · beauftragt, aber ohne Termin (42)

## Automatik

- **Automatische Planung:** Score 0–100 aus Verfügbarkeit (früh), Kundenwunsch (Freitext wird ausgelegt: heute/morgen/diese/nächste Woche/Wochentag/Datum/vormittags/nachmittags/ab X Uhr), Fahrweg vom Vortermin, Wochenauslastung, Qualifikation (Pflichtfilter; Chef nachrangig). Begründung je Vorschlag. Aufträge > 16 h → zwei Personen, sonst/als Rückfall eine Person über mehrere Tage. Heute erst ab jetzt + 30 min, Viertelstunden-Raster, Fahrzeit + Puffer zu Vor-/Folgetermin.
- **Fahrt:** Haversine × 1,3 aus `ort.lat/lng`, sonst PLZ-Näherung (Leitregionen), überall „grob geschätzt“ gekennzeichnet. Puffer (Einstellung `fahrt.pufferMinuten`, Standard 10 min). Tagesroute mit Google-Maps-Link inkl. Wegpunkten, Reihenfolge-Vorschlag per nächstem Nachbarn.

## Automationen (alle standardmäßig an, Einträge in „Erledigt“)

| ID | Was |
|---|---|
| `autoplanung.dringend-vorschlagen` | Dringender Auftrag ohne Termin → Planvorschlag als Freigabe („So einplanen“ / „Andere Vorschläge“); schließt sich bei Terminanlage |
| `qualifikation.beim-einplanen` | Termin angelegt/geändert → Qualifikationsprüfung, Benachrichtigung bei Problem |
| `werkzeug.beim-einplanen` | Termin angelegt/geändert → Betriebsmittelprüfung, Benachrichtigung bei Problem |
| `materialbereit.vorabend` | Täglich: fehlt Material für heute/morgen → Benachrichtigung ans Büro (einmal je Auftrag/Tag) |
| `fahrt.route-morgens` | Täglich: Monteure mit ≥ 2 Einsätzen bekommen ihre Route mit Maps-Link (einmal je Tag) |

Hinweise („Braucht dich“): Qualifikation fehlt (66–78), Material fehlt (62–76), Werkzeug/Fahrzeug nicht bereit (58–70), Fahrzeit reicht nicht (50–64), dringend ohne Termin (75, nur wenn Automation aus).

## Eigene Sammlungen

Keine. Alles läuft über Kernobjekte (`termine`, `auftraege`, `nachweise`, `material`, `artikel`, `betriebsmittel` …) und Einstellungen
(`fahrt.pufferMinuten`, `materialbereit.vorlaufTage`, Merker für tägliche Benachrichtigungen).

## Kernwünsche

1. **Verfügbarkeit zusammenführen:** `autoplanung/basis.ts` enthält eine minimale Verfügbarkeit (`abwesenheitAm`, `termineAm`, `freieFenster`, `istVerfuegbar`, `verplanteStunden`, `planbareMitarbeiter`). Beantragter Urlaub zählt dort schon als belegt. Sobald Paket plan `verfuegbarkeit` liefert, sollen diese Funktionen dorthin umziehen bzw. an dessen API angeschlossen werden (inkl. individueller Arbeitszeiten je Mitarbeiter, Feiertage).
2. **Gemeinsames Prüf-Ergebnis im Kern:** Typ `Pruefung` (`ok | warnung | problem`, `text`, `loesung?`) wäre als Kerntyp sinnvoll, damit z. B. der Kalender alle Prüfungen generisch anzeigen kann.
3. **Geokoordinaten:** `Betrieb.adresse` und `Ort` ohne `lat/lng` → Geocoding beim Speichern einer Adresse (Kern/Schnittstellen) würde die PLZ-Schätzung ablösen.
4. **Periodische Automationen:** `pruefen()` läuft nur beim App-Start; ein Tages-Takt (z. B. 6 Uhr) im Kern wäre für „Route morgens“ und „Material vorab“ richtig.
5. **Hinweis-Aktionen mit Pfad:** Die Rückgabe von Aktionen wird für Navigation genutzt – ein direkter `pfad` je Aktion würde Hilfsaktionen wie `materialbereit.bedarf` überflüssig machen.

## Offene Punkte

- Panels hängen an `termine`/`auftraege` – sichtbar, sobald `kalender` und `auftraege` (andere Pakete) ihre Detailansichten mit `<ObjektPanels>` liefern. Auf diesem Branch über eine temporäre Debug-Route geprüft (wieder entfernt).
- „Bedarf öffnen“ erscheint nur, wenn das Modul `bedarf` bzw. `bestellungen` registriert ist (`modul('bedarf')`).
- Reihenfolge-Vorschlag ändert keine Uhrzeiten (Termine sind fest) – Umsetzung über den Kalender.
- Material wird nicht als harte Bedingung der Autoplanung genutzt, nur im Einsatz-Check.

## Testergebnis

```
npx tsc -b        → ok
npx vitest run    → 6 Dateien, 51 Tests grün (46 davon im Paket planpruefung)
npx vite build    → ok
```
Browser (Playwright, Chromium): Beispielbetrieb eingerichtet, `/plan`, `/plan/autoplanung`, `/plan/autoplanung/:id`, `/plan/fahrt`,
`/plan/material-bereit`, `/plan/werkzeug-bereit` bei 1440 px und 390 px – keine Konsolenfehler aus dem Paket (nur ein 404 auf eine
fehlende Fremdressource beim Onboarding), kein horizontales Scrollen. Konfliktszenario (Fahrzeit zu knapp, Nachweis fehlt, Prüffrist
abgelaufen, Lager leer) erzeugt die erwarteten Hinweise; „Vorschläge übernehmen“ legt Termine an und leert die Vorschau.
