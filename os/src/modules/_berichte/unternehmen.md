# Abschlussbericht Paket `unternehmen`

Bereich `betrieb`, Gruppe `unternehmen`. Alle Dateien liegen in den eigenen Modulordnern; außerhalb nur dieser Bericht.

## Gebaute Module und Ansichten

| Modul | Ansichten (Route unter `/betrieb/<id>`) | Einhängen |
|---|---|---|
| `leistungen` Leistungen & Preise | Katalog nach Kategorie (`''`, Filter Aktiv / Unter Stundensatz / Inaktiv), Anlegen/Bearbeiten (`neu`, `:id`), Preise anpassen (`preise`), Stundensatz-Rechner (`stundensatz`) | `detail` für `leistungen`, Suche, „Neu“-Menü, Hinweise, Automation, Kurzinfo |
| `vorlagen` Vorlagen & Formulare | Liste nach Zweck (`''`), Editor mit Platzhaltern + Live-Vorschau (`:id`), Briefkopf mit Logo-Upload und Fußzeile (`briefkopf`) | Suche, Seed je Gewerk, API für andere Module |
| `wissen` Wissen & Anleitungen | Liste mit Suche/Kategorien (`''`), Artikel (`:id`), Schreiben/Bearbeiten (`neu`, `:id/bearbeiten`) | Tab „Anleitungen“ am Auftrag und an der Anlage, Automation, Suche, Seed je Gewerk |
| `subunternehmer` Subunternehmer | Liste mit Nachweis-Status (`''`), Detail mit Einsätzen, Nachweisen, Kosten (`:id`), Anlegen/Bearbeiten (`neu`, `:id/bearbeiten`) | Tab „Subunternehmer“ am Auftrag, Hinweise, Suche, Beispieldaten |
| `rollen` Rollen & Rechte | Matrix Rolle × Recht + Vorschau „Was sieht eine Rolle?“ (`''`) | Navigation `hub`, nur Chef/Büro |
| `schnittstellen` Schnittstellen | Übersicht verfügbar/geplant + ICS-Export + JSON-Export (`''`) | Navigation `hub`, Suche |
| `einstellungen` Einstellungen | Betriebsdaten (`''`), Daten & Sicherung (`daten`), Papierkorb (`papierkorb`) | Hinweise, Aktion, Suche |

## Wichtigste Pain Points (Top 5 je Modul)

- **Leistungen:** Stundensatz deckt Kosten nicht (60) · Leistung bringt weniger als Stundensatz (48) · Arbeitszeit je Leistung unbekannt (49) · Material vergessen (49) · Preise seit Jahren nicht erhöht (45)
- **Vorlagen:** Texte jedes Mal von Hand (45) · Name/Betrag falsch per Copy & Paste (48) · Terminbestätigung fehlt (48) · Mahnungen aufgeschoben (40) · Pflichtangaben fehlen (36)
- **Wissen:** Wissen nur im Kopf des Meisters (64) · Neue fragen immer dasselbe (42) · Ablaufschritt vergessen (40) · Herstelleranleitung nicht griffbereit (35) · Anleitung nicht auffindbar (30)
- **Subunternehmer:** Nachweise-Ablauf merkt keiner (42) · Kosten der Fremdfirma nicht im Blick (40) · Wer ist an welchem Auftrag (36) · Freistellung abgelaufen → Bauabzugsteuer-Haftung (30) · Kontakte nur im Chef-Handy (30)
- **Rollen:** Monteur sieht Preise (40) · Unklar, was ein Recht bedeutet (25) · Büro darf nichts einstellen (25) · Azubi kann löschen (24) · Keine Vorschau (24)
- **Schnittstellen:** Termine nicht im Handykalender (48) · Steuerberater-Übergabe (48) · Zahlungen abgleichen (42) · Großhandelspreise abtippen (42) · E-Mails verstreut (40)
- **Einstellungen:** Beispieldaten vermischt (36) · Rechnung ohne Pflichtangaben (36) · Versehentlich gelöscht (32) · Stundensatz an mehreren Stellen (24) · Keine Sicherungs-Erinnerung (21)

Vollständige Listen: `PAINPOINTS.md` in jedem Modulordner.

## Automationen (mit Eintrag in „Erledigt“)

- `leistungen.stundenpreise-nachziehen` (an): Ändert sich der Stundensatz, werden alle Stundenleistungen mit genau dem alten Satz angepasst. Rückgängig über Aktion `leistungen.preiseZuruecksetzen`.
- `wissen.anleitung-vorschlagen` (an): Bekommt ein Auftrag Anlage/Leistung mit passender Anleitung, wird sie im Verlauf des Auftrags vermerkt.

## Hinweise („Braucht dich“)

- Stundensatz deckt die Kosten laut Rechner nicht (72, Aktion `leistungen.stundensatzUebernehmen`)
- Leistungen unter Stundensatz (45)
- Freistellungsbescheinigung § 48b fehlt/abgelaufen bei offenem Einsatz (80); Nachweis läuft in ≤ 30 Tagen ab (48/36); sonstiger Nachweis abgelaufen bei offenem Einsatz (54)
- Betriebsdaten für Rechnungen unvollständig (64)
- Keine Datensicherung seit 30 Tagen (30, Aktion `einstellungen.sicherung`)

## Eigene Sammlungen

- `vorlagen` (Textvorlagen), `wissen` (Artikel), `subunternehmer` (Zusatzdaten; Firma/Kontakt liegt als Kernobjekt in `lieferanten`, damit Eingangsrechnungen per `lieferantId` zugeordnet werden), `schnittstellen` (Export-Protokoll).
- Einstellungen-Schlüssel: `leistungen.stundensatzRechner`, `vorlagen.briefkopf`, `einstellungen.letzteSicherung`, `rollen.rechte` (Kern).
- Fotos von Anleitungen und Scans von Nachweisen sind `dokumente`.

## API für andere Pakete

- `@modules/vorlagen/daten`: `vorlageAnwenden(idOderSchluessel, kontext) → string`, `betreffAnwenden(...)`, `kontextAus({ auftragId?, kundeId?, rechnungId?, angebotId?, terminId? })`, `briefkopf() → { logo, absenderzeile, fusszeilen }`. Schlüssel: `angebot.einleitung`, `angebot.schluss`, `rechnung.text`, `rechnung.schluss`, `mahnung.erinnerung`, `mahnung.stufe1`, `mahnung.stufe2`, `email.angebot`, `email.rechnung`, `email.rueckfrage`, `termin.bestaetigung`, `termin.erinnerung`.
- `@modules/schnittstellen/daten`: `icsErzeugen`, `termineFuerIcs`, `jsonExport`, `herunterladen`.
- `@modules/leistungen/daten`: `stundensatzBerechnen`, `lohnanteilJeStunde`, `preisAnpassen`.

## Kernwünsche

1. `beispieleEntfernen()` aus `core/seed.ts` erfasst nur Kernsammlungen. Gelöst im Modul über Rohdaten (`exportieren`/`importieren`); besser: Registry aller `defineCollection`-Sammlungen im Kern.
2. `restore`/`purge` für Sammlungen fremder Module nur über Rohdaten möglich (ohne Zeitstrahl-Eintrag). Wunsch: `sammlung(name)` im Kern.
3. `Bezug.typ` erlaubt nur Kernobjekte; Zeitstrahl von Modul-Sammlungen (z. B. `subunternehmer`) nur per Cast.
4. `Kennzahl` zeigt bei fehlendem Wert groß „Noch keine Daten“ – ein kleiner Leerwert wäre besser (im Modul mit „–“ gelöst).
5. `Textfeld`/`Eingabe` reichen keinen `ref` weiter (Cursorposition per `onSelect` gelöst).
6. Ein Kalender-Abo-Link braucht ein Backend.

## Offene Punkte

- Kundentexte in Vorlagen sind bewusst in „Sie“-Form (Brief an Kunden); die Oberfläche nutzt „du“.
- DATEV, IDS, Datanorm, UGL, Bank-CSV, FinTS, E-Mail sind ehrlich als „geplant“ markiert. DATEV verlinkt automatisch, sobald das Modul `datev` registriert ist.
- „Einrichtung neu starten“ setzt `onboardingFertig: false` und führt zu `/willkommen`; die Daten werden erst beim Abschließen der Einrichtung ersetzt.
- Ob andere Module Preise bei fehlendem Recht `geld` ausblenden, liegt bei den jeweiligen Paketen.

## Testergebnis

- `npm ci && npx tsc -b && npx vitest run && npx vite build`: grün, 8 Testdateien, 55 Tests (davon 47 aus diesem Paket).
- Browser (Playwright, Chromium) nach „Beispielbetrieb einrichten“: alle Ansichten und Detailseiten bei 1440 px und 390 px ohne Konsolenfehler und ohne horizontalen Überlauf. Abläufe geprüft: Stundensatz berechnen und übernehmen (Automation zieht „Arbeitsstunde Geselle“ mit), Preise +5 % anpassen, ICS- und JSON-Download, Sicherung herunterladen und wieder einspielen, Leistung löschen und aus dem Papierkorb wiederherstellen, Beispieldaten entfernen, Vorschau einer Terminbestätigung, Recht in der Matrix umschalten.
