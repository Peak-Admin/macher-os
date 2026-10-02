# Delta 10 – Arbeitszeit-Regelwerk (Kürzel `arbeitszeit`)

Reines Delta auf `arbeitszeiten`, `abwesenheiten` und eine kleine Änderung in `mitarbeiter`. Kein neues Modul,
keine neue Navigation, `struktur.ts` unverändert.

## Was schon da war (weiterverwendet)
Stempeluhr (Start/Pause/Stopp, Wechsel), Buchung über den Terminstatus, `einsatz.starten/beenden`, Wochenübersicht,
Nachtrag mit Überschneidungsprüfung, ArbZG-Prüfung (6/9/10 h, 11 h Ruhezeit), Stundenkonto, Einzelzeiten-CSV,
Hinweise (Zeit läuft seit gestern, keine Zeiten gestern, ArbZG, Freigabe). Urlaub & Krankheit komplett.

## Gebaut / erweitert
- **Arbeitszeitmodell** (`arbeitszeiten/modell.ts`): Soll-Minuten je Wochentag, versioniert mit `gueltigAb`.
  Ohne Modell gilt wie bisher: Wochenstunden gleichmäßig auf die Arbeitstage des Betriebs. Beim ersten Speichern wird die
  bisherige Soll-Zeit als erste Version gesichert, damit vergangene Wochen nicht umgerechnet werden. Bearbeiten am
  Mitarbeiter, Tab „Zeiten“ → Karte „Arbeitszeit“ → „Ändern“. `Mitarbeiter.wochenstunden` bleibt die Summe (Planung liest sie);
  ändert man die Wochenstunden im Mitarbeiterformular, wird die Verteilung ab dieser Woche umgerechnet.
- **Pausenregel nach §4 ArbZG** (`daten.ts`: `pflichtPause`, `autoPause`, `tagAuswerten`): über 6 h 30 min, über 9 h 45 min.
  Gestaffelt abgezogen wird nur, was fehlt (6:10 h ohne Pause → 10 min). Eingetragene Pausen und Lücken ab 15 min zählen.
  Läuft der Tag noch, wird erst zum Feierabend geprüft. Abzug geht von der Zeitart mit den meisten Minuten ab. Abschaltbar.
- **Zeitarten** für Lohn/Auswertung: Baustelle (`arbeit`), Fahrt (`fahrt`), Intern (`werkstatt` + `buero`) – ohne Kernänderung.
- **Soll/Konto**: `sollPlanTag` (Modell, Feiertage über `@core/kalender` inkl. Bundesland, Eintritt/Austritt),
  `gutschriftTag` (Urlaub, Krank, Schule, Schulung, Sonstiges = erfüllt; halbtags halb). **Fix:** „Frei / Überstundenabbau“
  wurde bisher gutgeschrieben – baut jetzt das Konto ab. **Fix:** Konto begann jedes Jahr neu bei 0 – läuft jetzt über den
  Jahreswechsel; Beginn = erste Zeit, Eintritt oder letzter Übertrag.
- **Kontobuchungen** (`stundenbuchungen`): Übertrag aus altem System, Auszahlung, Korrektur – Grund ist Pflicht.
- **Korrekturen**: Ändern einer abgeschlossenen Zeit verlangt einen Grund; Text „vorher → nachher · Grund“ geht ins
  Audit (`update(..., { text })`), der Verlauf steht im Dialog.
- **Wochenfreigabe**: `freigeben()` zentral (Woche, Person, Monat, Hinweis-Aktion), Rückgängig möglich. Freigabe-Hinweis jetzt
  je abgeschlossener Woche (ältere Wochen schwerer), Aktion „Woche freigeben“ mit `{ von, bis }`.
- **Monat & Lohn** (neue Ansicht `/betrieb/arbeitszeiten/monat`, vierter Reiter, nur Chef/Büro): Vorschau je Mitarbeiter,
  Warnung bei offenen Freigaben/laufenden Zeiten/Tagen ohne Zeit, „Monat freigeben“, Hauptaktion „Für den Lohn herunterladen“
  (Bestätigung, wenn noch nicht freigegeben). CSV-Monatsübersicht: Soll, gearbeitet, Baustelle/Fahrt/Intern, Pause automatisch,
  Abwesenheit gutgeschrieben, gebucht, Saldo Monat, Über-/Minusstunden, Konto am Monatsende, Tage je Abwesenheitsart, Feiertage,
  nicht freigegebene Zeiten. Einzelzeiten-CSV über „Weitere Aktionen“. Der Export-Knopf der Wochenansicht führt jetzt hierher.
- **Monteur-UX**: [Arbeit starten] [Pause] [Arbeit beenden] bleibt; dazu „Diese Woche: 38 von 40 Std“ und ein Pausenhinweis,
  wenn über 6/9 h ohne Pause gearbeitet wird. Stundenkonto-Seite zeigt den eigenen Stand.
- **Regeln** (Progressive Disclosure, nur Recht `admin`): Dialog „Regeln für Arbeitszeiten“ auf Stundenkonto/Monat:
  automatischer Pausenabzug (an), Meldegrenzen Plus/Minus (je 20 h).
- **Abwesenheiten**: Link-Vorgaben `?art=frei&ma=<id>` (für „Freie Tage eintragen“ aus Braucht dich).

## Hinweise (Exception-First, Chef/Büro)
- Fehlende Pause → „Pause fehlte: Jonas am …“ mit Abzugsangabe, Aktion „Tag prüfen“ (Gewicht 35; echte ArbZG-Verstöße 50)
- Fehlende Buchung → bestehend, jetzt nur an Tagen mit Soll laut Modell (Teilzeit-Freitag meldet nicht)
- Freigabe offen → je abgeschlossener Woche, Aktion „Woche freigeben“ (45/55)
- Stundenkonto stark im Plus → „Freie Tage eintragen“ (40) · stark im Minus → „Zeiten prüfen“ (45)

## Events
- gesendet: `zeit.freigegeben` (`daten: { zeitIds, mitarbeiterIds, von, bis }`),
  `mitarbeiter.abwesend` (`objekt: Abwesenheit`, `daten: { mitarbeiterId, abwesenheitId, art, von, bis, halbtags }`) –
  ausgelöst bei jeder wirksam werdenden Abwesenheit (über `init` auf `abwesenheiten.created/updated`, egal wer sie anlegt)
- unverändert: `einsatz.gestartet`, `einsatz.beendet`
- abonniert: `abwesenheiten.created`, `abwesenheiten.updated` (für `mitarbeiter.abwesend`)

## Automationen
Keine neuen. Bestehende (Stempeln über Terminstatus, vergessene Zeit beenden, Krankmeldung, Bescheid) unverändert.

## Neue Sammlungen
`arbeitsmodelle`, `stundenbuchungen` (beide in `arbeitszeiten/modell.ts`).

## Einstellungen
`arbeitszeiten.autoPause` (true), `arbeitszeiten.grenzePlus` / `arbeitszeiten.grenzeMinus` (Minuten, 1200).

## Signaturen (Baustellen-App)
`einsatz.ts`: `einsatzStarten`, `einsatzBeenden`, `vergesseneBeenden`, `zeitenHinweise` unverändert;
`zeitenFreigeben(bis)` hat nur einen optionalen zweiten Parameter `von` bekommen. `daten.ts`: `sollTag`, `stundenkonto`
nur um optionale Parameter erweitert, `Konto` um `gebucht`.

## Kernwünsche
- `Zeiteintrag.pauseSeit` (laufende Pause steht weiter als Einstellung).
- `Mitarbeiter.personalnummer` für den Lohn-Export.
- Optional `Zeiteintrag.art` um eine echte Baustellen-/Kundenart ergänzen statt Zuordnung über `arbeit`.
- `ereignisse.ts`-Katalog: `zeit.freigegeben`, `mitarbeiter.abwesend` aufnehmen (falls nicht schon vom Kern-Agenten).

## Offene Punkte
- DATEV-Lohn (LODAS/Lohn und Gehalt) gibt es nicht; das `datev`-Modul exportiert nur den Buchungsstapel und prüft
  „Zeiten freigegeben“. Nicht dupliziert – Monatsübersicht-CSV ist das Format fürs Lohnbüro.
- Pausen unter 15 min werden als Pause gezählt (ArbZG verlangt Blöcke ab 15 min) – bewusst einfach gehalten.
- Feiertagsstunden/Zuschläge (Nacht, Sonntag) nicht berechnet.
- Hinweis zur Basis: Die Worktree stand auf einem alten Stand ohne `src/os`; der Branch wurde vor Beginn auf
  `3b35be5` (Stand von `claude/tender-euler-87ikzl`) gesetzt.

## Tests
`arbeitszeiten/regelwerk.test.ts` (33 Tests: Pausenregel, Modell/Versionen, Feiertage inkl. Bundesland, Saldo über Wochen
und Jahreswechsel, Übertrag/Auszahlung, Überstundenabbau, Teilzeit, Wochenstand, Freigabe + Event, Hinweise, Monat, CSV),
`abwesenheiten/abwesend.test.ts` (3 Tests Event). Gesamt: typecheck, lint (0 Fehler), alle Tests, build grün.
Browser (1440/390 px, Spielwiese): Stempeluhr, Woche, Stundenkonto, Monat & Lohn, Mitarbeiter-Tab, Modell-Dialog –
keine Konsolenfehler, kein horizontales Scrollen.
