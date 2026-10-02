# Abschlussbericht Paket `akte`

Module: `auftraege`, `aufgaben`, `checklisten`, `arbeitsanweisungen`, `material-am-auftrag` (Bereich Aufträge).

## Gebaute Module und Ansichten

| Modul | Ansichten | Einhängepunkte |
|---|---|---|
| auftraege | Übersicht `/auftraege/auftraege` (Pipeline + Archiv), Anlegen `/auftraege/auftraege/neu`, **Akte `/auftrag/:id`** (Kopf mit Kunde/Ort/Zugang/Navigation, Phasenleiste, „Nächster Schritt“, Bearbeiten, Phase ändern, verloren markieren, Tabs Überblick + Verlauf, `ObjektTabs`/`ObjektPanels`) | `hubWidget` Pipeline (Desktop Spalten, mobil gruppiert, Filter Meine/Dringend/Art, Suche), `detail` auftraege, `suche`, `erstellen`, `kurzinfo` |
| aufgaben | Liste `/auftraege/aufgaben` (Meine/Alle offenen/Zuletzt erledigt, gruppiert nach Fälligkeit, Anlegen-Dialog `?neu=1`), Detail `/auftraege/aufgaben/:id` | Tab „Aufgaben & Checklisten“ am Auftrag, Schnell-Aktion „Aufgabe“, `detail` aufgaben, `suche`, `erstellen` |
| checklisten | Übersicht `/auftraege/checklisten` (offene + Vorlagen), Checkliste `/:id`, Vorlage `/vorlage/:id` bzw. `/vorlage/neu` | Teil des Tabs „Aufgaben & Checklisten“, Panel an `termine` |
| arbeitsanweisungen | Übersicht `/auftraege/arbeitsanweisungen`, Anweisung `/:id` (Lesen / `?bearbeiten=1`) | Tab „Arbeitsanweisung“ (ab beauftragt), Panel an `termine`, `suche` |
| material-am-auftrag | Übersicht `/auftraege/material-am-auftrag` (geplant/bestellt/bereit/noch abzurechnen) | Tab „Material“ (ab beauftragt), Schnell-Aktion „Material buchen“ |

Der „Nächster Schritt“-Button ruft je Phase `besichtigung.planen`, `angebot.erstellen`, `plan.einplanen`, `einsatz.starten`, `abnahme.starten`, `rechnung.erstellen`, `bewertung.anfragen` per `aktionAusfuehren` auf und navigiert zum Rückgabepfad. Fehlt die Aktion, gibt es einen Rückfall: Phase weiterschieben und/oder Aufgabe am Auftrag anlegen (ohne Doppelte). Entwürfe von Angeboten/Rechnungen werden über `pfadZu` direkt geöffnet.

## Wichtigste Pain Points (Top 5 je Modul)
- **Aufträge:** Stand unklar (90) · Infos verstreut (90) · nächster Schritt unklar (81) · Fertiges wird nicht abgerechnet (70) · Beauftragt ohne Termin (63)
- **Aufgaben:** Zurufe vergessen (80) · überall verstreut (72) · Zuständigkeit unklar (64) · Fristen verpasst (56) · Erfassen dauert zu lange (54)
- **Checklisten:** Schritte vergessen (72) · kein Foto-Nachweis (60) · Papier geht verloren (56) · Prüfpflichten vergessen (50) · Qualität schwankt (49)
- **Arbeitsanweisungen:** „Was soll ich hier machen?“ (72) · Wissen im Kopf vom Chef (64) · Besichtigungsinfo fehlt (54) · Sicherheitsrisiken unbekannt (50) · lange Texte liest keiner (48)
- **Material:** Verbautes nicht berechnet (80) · Zettel verloren (64) · Erfassen nervt (63) · Material fehlt vor Ort (54) · bestellt/da unklar (49)

Details: `PAINPOINTS.md` in jedem Modulordner.

## Automationen (alle standardmäßig an, mit `erledigt(...)`-Protokoll)
- `auftrag.angebot-angenommen` – Angebot angenommen (`angebote.updated` oder `angebot.angenommen`) → Beauftragt
- `auftrag.einsatz-gestartet` – `einsatz.gestartet`, Termin unterwegs/vor Ort oder laufende Zeit am Auftrag → In Arbeit
- `auftrag.termine-erledigt` – alle Einsätze erledigt und keine offenen Aufgaben → Abnahme (sonst Hinweis „fertig?“)
- `auftrag.abnahme-unterschrieben` – `abnahme.unterschrieben` → Abrechnung
- `auftrag.bezahlt` – Schluss-/Einzelrechnung bezahlt, nichts mehr offen → Erledigt
- `aufgaben.auftrag-abgeschlossen` – von Macher angelegte Aufgaben schließen mit dem Auftrag
- `checklisten.automatisch` – passende Vorlagen (Gewerk + Auftragsart) hängen sich beim Beauftragen an
- `material.aus-angebot` – Material aus Artikel- und Leistungspositionen des angenommenen Angebots als „geplant“
- `material.abgerechnet` – versendete Rechnung markiert enthaltenes Material mit `abgerechnetIn`

Hinweise („Braucht dich“): beauftragt ohne Termin · Stillstand > 14 Tage (Nachfassen / verloren) · alle Einsätze erledigt, aber Aufgaben offen · überfällige Aufgaben (an Zuständigen) · offene Pflichtpunkte vor der Abnahme · Projekt-Einsatz in ≤ 2 Tagen ohne Arbeitsanweisung · verbautes Material nicht abgerechnet.

Aktionen für andere Pakete: `auftrag.oeffnen`, `auftrag.einplanen`, `auftrag.nachfassen`, `auftrag.verloren`, `auftrag.zur-abnahme`, `aufgabe.erledigen`, `aufgabe.anlegen` (`{ titel, auftragId?, zustaendigId?, faellig? }`), `checkliste.oeffnen`, `anweisung.anlegen`, `material.nicht-berechnen`.
Exportierte Helfer: `offenePflichtpunkte(auftragId)` (`modules/checklisten/daten.ts`), `materialFuerRechnung(auftragId)` → `Position[]` (`modules/material-am-auftrag/daten.ts`).

## Eigene Sammlungen
`checklistenVorlagen`, `checklisten`, `arbeitsanweisungen` (wie in PAKETE.md vergeben). Alles andere über `db.*` (auftraege, aufgaben, material, termine, dokumente …). Fotos aus Checklisten/Anweisungen sind `dokumente` (art `foto`, verkleinert, `auftragId` + `bezug`).

Seeds: Checklisten-Vorlagen fürs Gewerk (3 allgemeine + 0–2 gewerkspezifische, z. B. VDE-Erstprüfung, Gas-Brennwert-Wartung, Abdichtung Nassbereich) – bewusst **nicht** `beispiel`, weil es Startvorlagen sind. Zwei Anweisungs-Vorlagen. Beispiel-Checklisten und eine Beispiel-Anweisung an den Beispielaufträgen (`beispiel: true`).

## Kernwünsche
- `aktionDa(id)` im Kern (ob eine Aktion registriert ist) – aktuell im Modul über `alleModule()` gelöst; `aktionAusfuehren` warnt nur.
- `ObjektTabs`: Möglichkeit, eigene Tabs auch ans Ende zu stellen (z. B. „Verlauf“ zuletzt) und einen Starttab per URL (`?tab=`) zu wählen.
- Sammlungen sollten als `ObjektTyp` registrierbar sein, damit `Bezug`/`pfadZu`/`zeitstrahl` auch für Modul-Sammlungen (Checkliste, Anweisung) funktionieren.
- Verbindliche Payload-Form für fachliche Events (`emit({ typ: 'angebot.angenommen', objekt })` vs. `daten: { auftragId }`) – ich lese beides.
- Zentraler Foto-Helfer (Kamera, Verkleinern, Dokument anlegen) statt in jedem Paket; meiner liegt in `modules/checklisten/foto.ts`.
- Offline-Fähigkeit für Baustellen ohne Netz.
- `Button` mit `href` (externer Link, z. B. Navigation) – aktuell `<a className="mm-btn …">`.

## Offene Punkte
- Pfade zu Terminen/Angeboten/Rechnungen kommen von den jeweiligen Paketen; ohne sie bleibt der Rückfall (z. B. „Weiteren Einsatz einplanen“ statt „Nächsten Einsatz ansehen“).
- Paket geld sollte `materialFuerRechnung` beim Rechnungsentwurf nutzen; die Markierung `abgerechnetIn` läuft automatisch beim Versenden.
- Lagerabgang bei „verbraucht“ bucht Paket material (`lagerbewegungen`) – hier bewusst nicht.
- Silbentrennung in schmalen Pipeline-Spalten hängt vom Browser ab (`hyphens: auto`, `lang="de"`).

## Testergebnis
- `npm ci && npx tsc -b && npx vitest run && npx vite build`: grün – 6 Testdateien, 40 Tests (31 aus diesem Paket: nächster Schritt je Phase, Rückfall ohne Aktion, alle Phasen-Automationen, Aufgaben-Gruppierung, Checklisten-Stand/Foto-Pflicht/Automatik/Vorlagen für alle Gewerke, Material-Summen/Rechnungspositionen/Abrechnung/Angebotsübernahme, Arbeitsanweisungen).
- Playwright (Chromium) nach „Beispielbetrieb einrichten“: alle Ansichten bei 1440 px und 390 px ohne Konsolenfehler und ohne horizontales Scrollen; Tabs der Akte geprüft; Ablauf „Auftrag mit neuem Kunden anlegen → nächster Schritt (Rückfall) → als verloren markieren“ durchgespielt.
