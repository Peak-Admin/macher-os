# Abschlussbericht Paket `service`

## Gebaute Module und Ansichten

| Modul | Bereich | Ansichten | Einhängen |
|---|---|---|---|
| `wartung` Wartung & Service | Aufträge | Übersicht `/auftraege/wartung` (überfällig / diese Woche / diesen Monat / später, laufende Wartungsaufträge, Vorlauf-Einstellung) | Tab „Wartung“ am Auftrag (nur `art: 'wartung'`), Panel an der Anlage, Hub-Widget (nur wenn etwas überfällig/diese Woche fällig ist), Kurzinfo |
| `servicevertraege` Serviceverträge | Aufträge | Liste, Anlegen/Bearbeiten, Detail | Panels an Kunde und Anlage, „Neu“-Menü, Suche |
| `reklamationen` Gewährleistung & Reklamationen | Aufträge | Liste, „Mangel aufnehmen“, Detail | Tab „Reklamationen“ am Auftrag (nur wenn vorhanden oder Arbeit fertig), Panels an Kunde und Anlage, Schnell erfassen „Mangel melden“, „Neu“-Menü, Suche |
| `wiederkehrend` Wiederkehrende Termine | Plan | Liste, Anlegen/Bearbeiten, Detail (Verschieben, Auslassen, Wieder aufnehmen, Serie beenden) | Panels an Anlage und Termin, „Neu“-Menü, Suche |

## Wichtigste Pain Points (Top 5 je Modul)

**Wartung:** Wartung vergessen (80) · Fälligkeit nur in Excel/Kopf (72) · nächstes Datum nicht fortgeschrieben (72) · jede Wartung einzeln anlegen (56) · Kunde nicht informiert (49)
**Serviceverträge:** Abrechnung vergessen (70) · Vertragswartungen nicht eingeplant (54) · Umfang unklar (49) · Kündigungsfrist verpasst (45) · Auslaufen verpasst (45)
**Reklamationen:** Gewährleistung unklar (63) · Reklamation nicht notiert (56) · keine Fotos (48) · Nacharbeit rutscht durch (48) · Frist verpasst (40)
**Wiederkehrend:** Termine immer neu eintragen (54) · Termin vergessen (54) · Monteur abwesend (40) · Einzeltermin auslassen (36) · Wartungstermin ↔ Auftrag nicht verbunden (36)

Vollständig in `PAINPOINTS.md` je Modul.

## Automationen (alle standardmäßig an, mit Eintrag in „Erledigt“)

- `wartung.auftraege-anlegen` – legt X Wochen (Einstellung `wartung.vorlaufWochen`, Standard 4) vor `anlagen.naechsteWartung` Wartungsaufträge an (`art: 'wartung'`, Phase `beauftragt`, `anlageIds`), bündelt Anlagen am selben Ort (ergänzt auch einen noch nicht begonnenen Auftrag), Prüfpunkte je Anlagentyp als Aufgaben (`quelle: 'wartung'`), verknüpft passenden Serientermin. Läuft beim Start, alle 6 h und entprellt bei Änderungen an Anlagen.
- `wartung.fortschreiben` – Wartungsauftrag geht auf Abnahme/Abrechnung/Erledigt → `letzteWartung`/`naechsteWartung` fortschreiben; Vertragswartung in Phase Abrechnung → direkt erledigt (keine Rechnung).
- `servicevertraege.abrechnung` – zu Periodenbeginn Abrechnungsauftrag + `aktionAusfuehren('rechnung.erstellen', { auftragId, art: 'rechnung' })`; ist der Entwurf ohne Preis, wird die Vertragsposition ergänzt; ist die Aktion nicht registriert, wird ein Rechnungsentwurf direkt angelegt. Rückstände werden nachgeholt.
- `reklamationen.nacharbeit` – Nacharbeitsauftrag (`art: 'reklamation'`) sobald entschieden ist (Gewährleistung/Kulanz → `beauftragt`, kostenpflichtig → `angebot`).
- `reklamationen.status` – Status aus der Nacharbeit nachführen; Gewährleistung/Kulanz ohne Rechnung abschließen.
- `wiederkehrend.termine` – Serientermine immer 3 Monate im Voraus (Monatsende korrekt, optional Wochenende → Montag).

**Hinweise (Braucht dich):** Wartung überfällig ohne Auftrag · Wartung einplanen (Aktion `plan.vorschlag` → `plan.einplanen` → Auftrag) · Kunde über Wartung informieren (Freigabe, vorbereitete Nachricht) · Kündigungsfrist naht („Weiterlaufen lassen“) · Vertrag läuft aus („Verlängern“) · Abrechnung fällig (nur wenn Automation aus) · Reklamationsfrist läuft ab/überschritten · Gewährleistung klären · kostenpflichtige Nacharbeit → `angebot.erstellen` · Serientermin mit abwesendem Mitarbeiter · Serie ohne Leute.

**Eigene Aktionen:** `wartung.auftragAnlegen`, `wartung.terminVorschlagen`, `wartung.kundeBenachrichtigen`, `servicevertrag.abrechnen`, `servicevertrag.verlaengern`, `servicevertrag.weiterlaufen`.

## Eigene Sammlungen

- `servicevertraege` (Kunde, Orte, Anlagen, Leistungen, Intervall, Preis/Jahr, Abrechnungsrhythmus, Laufzeit, Kündigungsfrist, Verlängerung, Abrechnungen mit `auftragId`/`rechnungId`)
- `reklamationen` (Kunde, ursprünglicher Auftrag, Anlage, Grundlage BGB/VOB, Bewertung, Frist, Status, `nacharbeitAuftragId`); Fotos = `dokumente` mit Tag `reklamation:<id>`
- `serien` (Regel, Start, Uhrzeit, Dauer, Ende, Mitarbeiter, Kunde/Ort/Anlagen/Vertrag, Ausnahmen, erzeugte Vorkommen); Termine = `termine` mit `serieId`

Beispieldaten (`beispiel: true`): 2 Verträge (Hausverwaltung mit naher Kündigungsfrist, Bäckerei mit monatlicher Abrechnung + zusätzliche Beispiel-Anlage), 2 Reklamationen (Gewährleistung / kostenpflichtig), 1 Serie mit Abwesenheitskonflikt. Von Automationen erzeugte Objekte erben `beispiel`.

## Kernwünsche

1. `Bezug.typ`/`ObjektTyp` für Modulsammlungen (z. B. `servicevertraege`, `reklamationen`, `serien`) – Zeitstrahl und Hinweise können derzeit nur per Cast auf eigene Objekte zeigen, `pfadZu` kennt sie nicht.
2. `Auftrag.vertragId` o. ä. – „Wartung im Vertrag enthalten“ wird derzeit über Anlagen/Ort abgeleitet.
3. `Termin.serienDatum` (ursprüngliches Vorkommen) – derzeit merkt sich die Serie erzeugte Vorkommen selbst.
4. Payload für `rechnung.erstellen` mit Positionen/Leistungszeitraum – Abrechnungsaufträge haben keine Positionen; das Modul ergänzt die Vertragsposition nachträglich.
5. Periodischer Automations-Takt im Kern (`pruefen` läuft nur beim App-Start) – Module nutzen eigene `setInterval`.
6. `naechsteNummer` für eigene Nummernkreise (SV-, RK-) – derzeit im Modul nachgebaut.
7. Datei-Eingabe als UI-Baustein (Foto aufnehmen) – derzeit `Feld` + `<input type="file">`.
8. `plusMonate` in `@core/format` (liegt in `wiederkehrend/regel.ts`).

## Offene Punkte

- Auftragsakte und Anlagen-Detail stammen aus anderen Paketen: Tab/Panels sind per Render-Test geprüft, im Browser erst nach dem Zusammenführen sichtbar.
- Wartungsprotokoll nutzt bewusst eigene Prüfpunkte als Aufgaben, nicht die Checklisten aus Paket akte (parallel gebaut) – nach dem Merge zusammenführen.
- Kundennachricht wird als `nachrichten`-Eintrag (`richtung: 'aus'`) gespeichert; echter Versand hängt an Paket doku/Schnittstellen.
- Gewährleistung: gesetzliche Standardfristen, keine Rechtsberatung (Hinweis in der Oberfläche).

## Testergebnis

`npm ci && npx tsc -b && npx vitest run && npx vite build` – grün: 6 Testdateien, 35 Tests (Regeln, Laufzeit/Fristen/Abrechnung, Gewährleistung, Wartung bündeln/fortschreiben/inklusive, Render-Test aller Tabs/Panels/Schnell-Aktion mit Beispieldaten).
Browser (Playwright, Chromium): Beispielbetrieb eingerichtet, alle Ansichten bei 1440 px und 390 px geöffnet – keine Konsolenfehler, kein horizontales Überlaufen; Abläufe „Serie anlegen + verschieben“, „Mangel aufnehmen“, „Vertrag anlegen + kündigen“ durchgespielt.
