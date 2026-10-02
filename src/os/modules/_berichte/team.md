# Abschlussbericht Paket `team`

Branch: `claude/fervent-pascal-joztaz-team` · Bereich `betrieb`, Gruppe `team`.
Alle Dateien liegen in `src/os/modules/{mitarbeiter,arbeitszeiten,abwesenheiten,qualifikationen,schulungen,unterweisungen,einarbeitung,bewerber}/` plus dieser Bericht.

## Gebaute Module und Ansichten

| Modul | Ansichten | Einhängungen |
|---|---|---|
| `mitarbeiter` | Liste (`/betrieb/mitarbeiter`), Anlegen (`/neu`), Detail (`/:id`, besitzt `detail` für `mitarbeiter`), Bearbeiten (`/:id/bearbeiten`), Austritt-Dialog | Suche, „Neu“, Kurzinfo, Hinweis „Termine nach Austritt umplanen“ |
| `arbeitszeiten` | Stempeluhr (`/betrieb/arbeitszeiten`), Woche (`/woche`, Person oder Team, Nachtrag/Korrektur, Freigabe, CSV), Stundenkonto (`/konto`) | Schnell-Aktion „Zeit starten/stoppen“, Tab „Zeiten“ am Mitarbeiter, Aktionen `einsatz.starten`, `einsatz.beenden`, `zeiten.beenden`, `zeiten.nachtragen`, `zeiten.freigeben` |
| `abwesenheiten` | Übersicht mit Schnellantrag (`/betrieb/abwesenheiten`, `?art=krank`), Jahresübersicht Team (`/jahr`), Detail (`/:id`, besitzt `detail` für `abwesenheiten`) | Schnell-Aktion „Urlaub / krank melden“, Tab „Abwesenheiten“, „Neu“: Urlaub beantragen / Krank melden, Aktionen `abwesenheit.genehmigen` / `abwesenheit.ablehnen` |
| `qualifikationen` | Matrix / Liste / Läuft ab (`/betrieb/qualifikationen`), Detail (`/:id`, besitzt `detail` für `qualifikationen`), Dialoge Qualifikation + Nachweis (mit Dokument) | Tab „Qualifikationen“, Suche |
| `schulungen` | Liste mit „Wer muss als Nächstes?“, Planen (`/neu?quali=&ma=`), Detail mit Teilnahme + Abschluss | Tab „Schulungen“, Aktion `schulung.planen`, „Neu“ |
| `unterweisungen` | Liste mit „Für dich zu bestätigen“, Detail mit Inhalt, Handy-Bestätigung und Nachweisliste, Anlegen/Bearbeiten | Tab „Unterweisungen“, Aktion `unterweisung.erinnern` |
| `einarbeitung` | Liste laufend/abgeschlossen, Detail mit Schritten je Phase | Tab „Einarbeitung“ (nur solange sie läuft) |
| `bewerber` | Pipeline (`/betrieb/bewerber`), Schnellerfassung (`/neu`), Detail mit Vorlagen, Termin, Notiz, „Zusage & einstellen“ | nur Chef/Büro (`rollen`), „Neu“, Suche |

Jede Ansicht hat Leer-, Fehler-/Validierungs- und Erfolgszustand (Toast) und wurde bei 1440 px und 390 px geprüft.
Lohn-/Kostendaten nur mit `useDarf('personal')`. Kranktage und AU-Foto sieht nur der Chef bzw. der Mitarbeiter selbst.

## Wichtigste Pain Points (Top 5 je Modul, Score = Frequenz × Intensität)

- **Mitarbeiter:** Wer ist heute da? (54) · Telefonnummer nicht greifbar (48) · Wochenstunden/Urlaub nur im Papiervertrag (48) · Stammdaten an fünf Stellen (42) · Zeiten, Nachweise, Abwesenheiten nicht an einem Ort (42)
- **Arbeitszeiten:** Stundenzettel aus dem Gedächtnis (80) · Büro tippt Zettel ab (64) · Zeit ohne Auftragsbezug (64) · zu viele Felder mit dreckigen Händen (63) · Pausen nicht erfasst / ArbZG (48)
- **Urlaub & Krankheit:** Krankmeldung erreicht Büro zu spät (45) · Termine des Kranken umplanen (45) · Urlaubsantrag geht unter (42) · Resturlaub unbekannt (35) · Urlaub genehmigt trotz Terminen (32)
- **Qualifikationen:** Wer darf Elektro/Gas/Kältemittel? (48) · Schein abgelaufen, keiner merkt es (36) · Auftrag verlangt Qualifikation (32) · Monteur ohne Qualifikation geschickt (30) · Nachweise verstreut (30)
- **Schulungen:** Nach Schulung kein Nachweis (32) · Schulung nicht im Kalender (27) · Wer muss als Nächstes? (24) · kein Bezug Schulung ↔ Qualifikation (24) · Pflichtschulungen fehlen bei Neuen (21)
- **Unterweisungen:** Monteure nie gleichzeitig im Betrieb (36) · Jährliche Unterweisung vergessen (30) · Papierliste unvollständig (28) · Neue vor dem ersten Einsatz nicht unterwiesen (27) · lange PDFs werden nicht gelesen (25)
- **Einarbeitung:** Neuer kennt Abläufe nicht (28) · Pflichtunterweisungen vergessen (27) · Kleidung/Werkzeug fehlt am ersten Tag (24) · Lohnunterlagen fehlen (24) · Zugänge kommen spät (18)
- **Bewerber:** Bewerbung bleibt liegen, Bewerber weg (50) · Bewerbungen über alle Kanäle (36) · Antwort schreiben kostet Zeit (30) · Chef erfährt spät von Bewerbung (28) · Stand nur im Kopf (24)

Vollständige Listen: `PAINPOINTS.md` in jedem Modulordner.

## Automationen (alle standardmäßig an, protokolliert in „Erledigt“)

| ID | Was passiert |
|---|---|
| `mitarbeiter.austritt` | Letzter Arbeitstag vorbei → Mitarbeiter auf „ausgetreten“ |
| `arbeitszeiten.termin-status` | Terminstatus unterwegs/vor Ort/erledigt startet Fahrt, wechselt auf Arbeit, stoppt |
| `arbeitszeiten.vergessen` | Über Nacht laufende Zeit auf einem Termin → zum Terminende beenden, zur Prüfung markiert |
| `abwesenheiten.krank-info` | Krankmeldung → Chef/Büro sofort benachrichtigt, mit betroffenen Terminen |
| `abwesenheiten.bescheid` | Genehmigt/abgelehnt → Mitarbeiter bekommt Bescheid |
| `qualifikationen.gueltigkeit` | Nachweis mit Erwerbsdatum → Ablaufdatum aus Gültigkeit berechnet |
| `schulungen.nachweise` | Schulung abgeschlossen → Nachweise für Teilnehmer |
| `unterweisungen.erinnern` | Einmalige Handy-Erinnerung je fälliger Runde |
| `einarbeitung.plan` | Neuer Mitarbeiter → Einarbeitungsplan je Rolle (inkl. Unterweisungen) |
| `einarbeitung.unterweisung` | Unterweisung bestätigt → Schritt in der Einarbeitung abgehakt |
| `bewerber.eingang` | Neue Bewerbung → Chef benachrichtigt |

Hinweise („Braucht dich“): Zeit läuft seit gestern (1-Tap „Um 16:00 beenden“), keine Zeiten gestern (Mitarbeiter + Büro gebündelt), ArbZG-Verstöße, Zeiten freigeben, Urlaub genehmigen/ablehnen, Abwesenheit kollidiert mit Terminen (→ `plan.einplanen`), Nachweis läuft in 60/30 Tagen ab bzw. ist abgelaufen (→ `schulung.planen`, entfällt bei geplanter Schulung), Schulung abschließen, Unterweisungen offen (je Person eine, Büro gebündelt mit „Alle erinnern“), Einarbeitung überfällig, Bewerbung > 3 Tage unbeantwortet, Austritt mit kommenden Terminen.

Events: `einsatz.gestartet` / `einsatz.beendet` mit `daten: { terminId, mitarbeiterId, zeitId(s) }`, `objekt` = Termin.

## Eigene Sammlungen

`schulungen` (Termin `art: 'schulung'` trägt Zeit, Titel, Teilnehmer), `unterweisungen` (inkl. Bestätigungen), `einarbeitungen`, `bewerber` (verweist nach Zusage per `mitarbeiterId`).
Kernobjekte nur über `db.*`: `mitarbeiter`, `zeiten`, `abwesenheiten`, `qualifikationen`, `nachweise`, `termine`, `dokumente` (AU-Foto mit `bezug: abwesenheiten`, Nachweis-Dokument über `dokumentId`).

Beispieldaten (`seed`, `beispiel: true`): eine geplante und eine abgeschlossene Schulung, Einarbeitung für den Azubi, drei Bewerber (einer > 3 Tage unbeantwortet), Bestätigungen der allgemeinen Unterweisung. Die fünf Unterweisungs-Vorlagen werden ohne `beispiel` angelegt (echte Startinhalte, gewerkabhängig).

## Kernwünsche

1. `Zeiteintrag.pauseSeit?: string` – laufende Pause wird derzeit als Einstellung `zeiten.pause.<id>` gemerkt.
2. ~~Landesfeiertage~~ – erledigt: Feiertage/Arbeitstage zentral in `@core/kalender`, Bundesland über Einstellung `plan.bundesland`.
3. `ObjektTabs`: Option, eigene Tabs ans Ende zu stellen (Verlauf liegt deshalb als Karte in der Seitenspalte).
4. `Bezug.typ` für eigene Sammlungen (`unterweisungen`, `bewerber`) – Zeitstrahl funktioniert, braucht aber einen Cast.
5. `Mitarbeiter`: Startsaldo Stundenkonto und Resturlaub-Übertrag aus dem Vorjahr.
6. Gemeinsamer Datei-Helfer (Data-URL lesen, Größenlimit) im Kern statt je Modul.
7. Hinweis-Aktionen ohne Navigation sollten im Hinweis-UI einen Erfolgstoast zeigen (z. B. „Genehmigt“).

## Offene Punkte

- Planungsprüfung „darf der eingeplante Monteur das?“ gehört Paket `planpruefung` (Daten: `db.nachweise` + `aktuellerNachweis`/`hatGueltig` aus `@modules/qualifikationen/daten` sind wiederverwendbar).
- Stundenkonto beginnt mit der ersten erfassten Zeit (frühestens Jahresanfang), damit Zeiten vor Macher OS nicht als Minus zählen.
- Neue Mitarbeiter aus einer Zusage bekommen Wochenstunden/Urlaub eines Kollegen gleicher Rolle als Vorschlag und landen direkt im Bearbeiten-Formular.
- Anteiliger Urlaub bei Eintritt im Jahr, Urlaubssperren und Vertretung beim Genehmigen fehlen bewusst.
- Matrix bei sehr vielen Qualifikationen auf dem Handy nur per Wischen; Liste „Läuft ab“ ist die mobile Hauptsicht.

## Testergebnis

```
cd os && npm ci && npx tsc -b && npx vitest run && npx vite build
Test Files  8 passed (8) · Tests  36 passed (36) · build ✓
```

Neue Tests: Feiertage/Arbeitstage/Urlaubskonto/Kollisionen, Dauer/ArbZG/Soll/Stundenkonto/CSV/Stempeln/Einsatz-Aktionen/Hinweise, Gültigkeit/Ablaufstufen/Automation, Schulungs-Nachweise und Vorschläge, Unterweisungs-Stand und Nachweis-Fortschreibung, Einarbeitungsplan je Rolle, Bewerber-Fristen und Vorlagen.

Browser (Playwright, Chromium, nach „Beispielbetrieb einrichten“): alle 26 Team-Ansichten bei 1440 px und 390 px ohne Konsolenfehler und ohne horizontalen Seitenüberlauf. Abläufe durchgeklickt: Stempeln (Start/Pause/Weiter/Stopp), Einsatz starten/beenden mit Terminstatus, Zeit nachtragen, CSV-Export, Urlaub genehmigen, krank melden, Nachweis eintragen, Schulung planen und abschließen, Unterweisung am Handy bestätigen, Bewerber einstellen (→ Einarbeitungsplan), Mitarbeiter anlegen mit Validierung, Monteur-Sicht.
