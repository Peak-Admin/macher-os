# Delta 2 – Zentrale Dokumenten-Engine (`dokumente`)

## Analyse vorher
- Angebot, Rechnung, Abnahme, Mahnung, Bericht hatten je eigene Druckansicht (alle schon auf `Briefbogen` aus `@ui/druck`),
  eigene Tabellen/Summen, eigene Nummernlogik (Kern `naechsteNummer` für A/AN/R, `naechsteNummerFuer('BR')` für Berichte).
- Vorlagen hatten Platzhalter (`{kunde}`, `{betrag}` …), wurden aber von keinem Modul benutzt.
- Versand: Angebot (`angebotSenden`) und Rechnung (`rechnungSenden`) über Cloud-Vertrag + Rückfall; Rechnungs-Detail
  und Mahnung nur `mailto:`. Kein `rechnung.erstellt`, kein `mahnung.versendet`, keine Versionen außer Angebotsversionen.
- Schlussrechnung zog berechnete (auch unbezahlte) Abschläge ab; Automation „Entwurf bei Abrechnung“ legte nach
  Abschlägen nie eine Schlussrechnung an (Bug: Prüfung `gueltigeRechnungen(...).length`).
- Fehlend: Auftragsbestätigung, Lieferschein, Sicherheitseinbehalt, Nummernkreise je Art, Arbeits-/Baustellenbericht als Begriff.

## Gebaut / erweitert
- **Neues Modul `dokumente`** (Kontext unter Aufträge › Übersicht, eine Zeile in `struktur.ts`):
  - `arten.ts` – Registry aller 16 Dokumentarten (Angebot, Auftragsbestätigung, Lieferschein, Rapport, Arbeitsbericht,
    Baustellenbericht, Prüfprotokoll, Abnahme, Rechnung, Abschlags-, Teil-, Schlussrechnung, Gutschrift, Storno,
    Zahlungserinnerung, Mahnung) mit Quelle (Source of Truth bleibt die jeweilige Sammlung), Druck-/Detailpfad,
    Erzeugen am Auftrag, Vorschlag je Phase; `dokumenteZumAuftrag()` = eine Sicht ohne Kopie.
  - `variablen.ts` – `{kunde.name}`, `{kunde.anrede}`, `{auftrag.titel}`, `{dokument.art|nummer|datum|bezeichnung}`,
    `{summe}`, `{summe.netto|ust|brutto}`, `{offen}`, `{faellig}`, `{ausfuehrung}`, `{betrieb.*}` + alle alten Namen;
    Beträge immer die des Dokuments (Schluss = Zahlbetrag). Textbausteine aus „Vorlagen“ mit Standard-Rückfall.
  - `nummern.ts` – Nummernkreise je Art (Standard: alle Rechnungsarten „R“ wie bisher, AB, LS neu), einstellbar
    unter Vorlagen › Nummernkreise, je Rechnung überschreibbar („Weitere Optionen“). `core/nummern.ts` unverändert.
  - `historie.ts` – Sammlung `dokumentversionen` (Archiv: was ging wann an wen, Nummer, Betrag) + Zeitstrahl.
  - `versand.ts` + `VersandDialog` – Vorbereiten → Vorschau → Bestätigen für alle Arten; nutzt `rechnungSenden`,
    `angebotSenden`, `sendenMitRueckfall` (Cloud-Vertrag/`core/cloud-versand` unverändert). Variablen ohne Wert
    fallen beim Versand weg (mit Hinweis).
  - `daten.ts` – Sammlung `geschaeftsdokumente` für Auftragsbestätigung (Positionen per `angebotId`) und Lieferschein
    (per `materialIds`), Unterschrift (Empfang) über `UnterschriftFeld`/`unterschriftSpeichern`. Detail, Druck `/druck/dokument/:id`.
  - Kontextaktion am Auftrag: Bereich Unterlagen › Dokumente (Tab Dateien) zeigt „Schreiben & Nachweise“ (alle Dokumente
    des Auftrags, Monteur ohne Preis-Dokumente) und „Dokument erstellen“ (Vorschlag passend zur Phase). Kein Menüpunkt.
- **Rechnungen**: Schluss zieht nur **gezahlte** Abschläge/Teilrechnungen ab (§ 14 Abs. 5 UStG), Stand wird beim
  Festschreiben eingefroren (`abzugStand`); Restbeträge stecken im Zahlbetrag, Abschlag gilt dann als „Verrechnet“
  (nicht mehr offen, keine Mahnung). Sicherheitseinbehalt (%), Storno spiegelt alles negativ, XRechnung
  `PrepaidAmount` = gezahlt (BR-CO-16). `summenZeilen()` = gleiche Zeilen für Bildschirm, PDF, E-Mail.
  `passendeArt()` (nach Abschlägen Schlussrechnung) für Tab, Hinweis, Automation (Bug behoben).
  „Rechnung schreiben“ (`RechnungSchnell`, jetzt auch `/betrieb/rechnungen/neu`, ersetzt den alten Typ-Auswahl-Ablauf):
  Macher bereitet aus Auftrag die passende Rechnung vor; Art, Abschlag %, Einbehalt, Zahlungsziel, § 13b, Nummernkürzel
  hinter „Weitere Optionen“; Senden mit Vorschau-Dialog; „Als Entwurf speichern“. Rechnungs-Detail: Senden über
  `VersandDialog` (statt mailto), Optionen eingeklappt, Verlauf mit Versionen.
- **Druck** (`@ui/druck`): `DruckPositionen`, `DruckSummen` als gemeinsame Bausteine (Rechnung, AB, LS).
- **Vorlagen**: Punkt-Variablen, neue Textbausteine (AB-Einleitung/-Schluss, LS-Text, E-Mail Dokument), Vorschau über
  Engine-Variablen, Seite Nummernkreise.
- **Berichte**: Labels „Baustellenbericht“ (tagesbericht) und „Arbeitsbericht“ (regiebericht).

## Events
- Neu gesendet: `rechnung.erstellt`, `rechnung.storniert`, `mahnung.versendet`, `bericht.unterschrieben`, `dokument.erstellt`,
  `auftragsbestaetigung.versendet`, `lieferschein.versendet`, `lieferschein.unterschrieben`. Weiter genutzt: `rechnung.versendet`,
  `angebot.versendet`, `dokument.versendet`.
- Abonniert (Modul-`init`, Versionen/Historie): `dokument.versendet`, `rechnung.versendet`, `rechnung.storniert`,
  `angebot.versendet`, `mahnung.versendet`, `abnahme.unterschrieben`, `bericht.unterschrieben`, `lieferschein.*`, `auftragsbestaetigung.versendet`.

## Automationen / Hinweise
- `rechnungen.entwurf-bei-abrechnung` legt nach Abschlägen die Schlussrechnung an. Hinweis „Auftragsbestätigung senden“ (Entwurf > 3 Tage, Gewicht 45).
- Aktion `dokument.erstellen` (`{ auftragId, art }`).

## Neue Sammlungen
`geschaeftsdokumente`, `dokumentversionen`. Neue Felder an Rechnung (RechnungX): `einbehaltProzent`, `abzugStand`, `nummernkreis`.

## Kernwünsche
- `dokumentVersendet` (Modul start) sollte `an` mitgeben; Event-Namen der neuen Events in `core/ereignisse.ts` aufnehmen.
- RechnungX-Felder (`einbehaltProzent`, `abzugStand`, `nummernkreis`) in `objects.ts`.
- `src/app/api/abo/_lib/rechnung.ts` nutzt `RechnungsSummen` – kompatibel gehalten (optionale Felder), nicht geändert.

## Offene Punkte
- Sicherheitseinbehalt wird nicht als eigene spätere Forderung verfolgt (nur Hinweis auf der Rechnung).
- Zahlung auf einen schon verrechneten Abschlag (nach der Schlussrechnung) wird nicht automatisch umgebucht.
- PDF-Anhang beim Versand von Berichten/Abnahme: nur Hinweis (Browser-Druck), kein serverseitiges PDF.
- Mahnung/Angebot-Detail nutzen noch ihre bisherigen Sende-Knöpfe; der `VersandDialog` kann dort eingehängt werden.

## Tests
`npm run typecheck`, `npm run lint` (0 Fehler), `npm test` (114 Dateien, 821 Tests grün, neu: `rechnungsarten.test.ts` 12 Tests,
`dokumente.test.ts` 18 Tests), `npm run build` grün. Browser (1440 und 390 px, Spielwiese): Dokument erstellen am Auftrag,
Lieferschein, Senden-Vorschau, Druck, Rechnung schreiben mit Weitere Optionen und Vorschau – keine Konsolenfehler.
