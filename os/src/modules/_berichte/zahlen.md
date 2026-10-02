# Abschlussbericht Paket `zahlen`

Bereich `betrieb`, Gruppe `geld`. Alle Zahlen sind echte Berechnungen aus Kernobjekten, als reine,
getestete Funktionen in `daten.ts` je Modul (Grundlage: Schnappschuss `kosten/basis.ts`).
Alle Ansichten nur mit `useDarf('geld')`, sonst verständliche Meldung.

## Gebaute Module und Ansichten

| Modul | Ansichten | Einhängepunkte |
|---|---|---|
| `kosten` Kosten | `/betrieb/kosten` (laufende/alle Aufträge mit Kosten), `/betrieb/kosten/:id` | Tab **„Kosten“** in der Auftragsakte (inkl. kompaktem Soll/Ist), Hinweis, Kurzinfo |
| `nachkalkulation` Nachkalkulation | `/betrieb/nachkalkulation` (Lerneffekte + Liste), `/betrieb/nachkalkulation/:id` | Hinweise, Aktionen, Automation, Kurzinfo, Seed |
| `ertrag` Ertrag | `/betrieb/ertrag` (Kennzahlen, beste/schwächste, Tabs Aufträge/Kunden/Leistungen/Auftragsart) | – |
| `auswertung` Auswertung | `/betrieb/auswertung` (6 Kennzahlen, Zeitraum + Vorzeitraum) | `hubWidget` „Zahlen auf einen Blick“ (4 Kennzahlen), `rollen: ['chef']` |
| `datev` Steuerberater & DATEV | `/betrieb/datev` mit Reitern Export · Monatsabschluss · Steuerberater | Hinweis Monatsende, Aktionen, Kurzinfo |

### Rechenregeln (kurz)
- **Kosten** = Zeiten (Netto-Minuten × `mitarbeiter.kostensatz`, laufende Zeit von heute bis jetzt, vergessene Zeiten werden nicht gezählt und gemeldet) + Material (`status: 'verbraucht'` × `ek`) + Belege mit `auftragId` (netto).
- **Soll**: Kalkulation (falls Modul `kalkulation` vorhanden) → `auftrag.geplanteStunden` → Leistungsminuten des angenommenen Angebots. Soll-Material aus Angebot (Artikel-EK + Leistungsmaterial). Soll-Kosten = Soll-Stunden × Ø-Kostensatz + Soll-Material (als „geschätzt“ gekennzeichnet). Toleranz „im Plan“ ±10 %.
- **Lerneffekt**: über erledigte Aufträge; Abweichung (Ist ohne Fahrt ÷ Soll-Leistungsminuten) anteilig auf die Leistungen verteilt; ab 2 Aufträgen und ±15 %.
- **Ertrag**: nur Aufträge in Abrechnung/erledigt; Umsatz = versendete/teil-/bezahlte Rechnungen netto, Abschläge in Schlussrechnungen (`abzugRechnungIds`) herausgerechnet, Gutschriften negativ.
- **Auswertung**: Umsatz netto, offene Posten (brutto − Zahlungen, überfällig separat), Auftragsbestand (angenommene Angebote laufender Aufträge − Berechnetes), Auslastung grob (Termine ÷ Wochenstunden ohne Büro an Werktagen), Angebotsquote, Ø Zahlungsdauer. Vorzeitraum gleich lang bis zum gleichen Tag.
- **DATEV**: EXTF 700 / Kategorie 21 / Version 13, Kopfzeile mit 31 Feldern, 14 Standardspalten, Semikolon, CRLF, Beträge `1234,56`, Belegdatum `TTMM`, Datei in Windows-1252 kodiert (nicht darstellbare Zeichen ersetzt). SKR03/SKR04: Erlöse 8400/4400 (7 %: 8300/4300, Kleinunternehmer 8195/4185), Wareneingang 3400/5400 (Automatik), Fahrzeug 4530/6530, Werkzeug 4985/6845, Büro 4930/6815, Telefon 4920/6805, Miete 4210/6310, Fremdleistung 3100/5900, Sonstiges 4900/6300 (BU 9/8), Kasse 1000/1600. Debitoren ab 10000, Kreditoren ab 70000, dauerhaft.

## Wichtigste Pain Points (Top 5 je Modul)
- **Kosten:** Kosten erst nach Monaten bekannt (72) · Daten an drei Stellen (64) · Budget während der Baustelle weg (54) · Vergessene Zeiten (49) · Belege nicht zugeordnet (49)
- **Nachkalkulation:** Macht keiner, zu aufwendig (72) · Gleiche Leistung immer zu knapp (63) · Erst nach Abschluss gemerkt (54) · Soll/Ist getrennt (49) · Lerneffekt fließt nicht zurück (48)
- **Ertrag:** Unklar, welche Aufträge Geld verdienen (63) · Gute vs. schlechte Kunden (48) · Welche Leistungen lohnen (48) · Umsatz ≠ Gewinn (42) · Was steckt in der Zahl (35)
- **Auswertung:** Monat erst mit BWA bekannt (56) · Offene Posten (56) · Auftragsbestand (42) · Auslastung gefühlt (35) · Überfällige gehen unter (30)
- **DATEV:** Belege-Schuhkarton (72) · Nachfragen des Steuerberaters (49) · USt-VA bis zum 10. (48) · Fehlende Bons (42) · Doppelte Rechnungen (35)

## Automationen
- `nachkalkulation-bei-erledigt` (standardmäßig an): Auftrag wechselt auf „erledigt“ → gespeicherter Hinweis mit Soll/Ist-Ergebnis (bzw. „nicht möglich“ mit Grund) + Eintrag in „Erledigt“.
- Live-Hinweise: laufender Auftrag über Plan; Lerneffekt mit Aktion `nachkalkulation.minutenAnpassen` (rückgängig machbar, protokolliert); Kostensatz fehlt; ab dem 3. „Vormonat an den Steuerberater übergeben“.
- DATEV-Export protokolliert sich in „Erledigt“ (`datev-export`), markiert Belege (`exportiertAm`) und Rechnungen, vergibt Personenkonten.

## Eigene Sammlungen
Keine. Einstellungen/Protokoll über `einstellung()`: `datev.einstellungen`, `datev.steuerberater`,
`datev.rechnungenExportiert`, `datev.debitoren`, `datev.kreditoren`, `datev.exporte`, `datev.abschluss.<YYYY-MM>`.
Seed (Nachkalkulation): Beispiel-Zeiten für den bereits erledigten Beispielauftrag (nur falls er noch keine Zeiten hat, `beispiel: true`).

## Kernwünsche
- `Rechnung.exportiertAm` (analog `Beleg`) – derzeit Liste in Einstellungen.
- Gemeinsamer Typ für Kalkulationen (`sollStunden`, `sollMaterial`, `sollKosten`, `netto`), Export aus dem Kern – die Nachkalkulation liest `kalkulationen` derzeit optional per `import.meta.glob` und toleranten Feldnamen.
- `Kennzahl`: dezenter Leerzustand (der Standardtext „Noch keine Daten“ erscheint in Wertgröße und bricht um) – wir übergeben „–“ und erklären im Hinweis.
- `ModulDef.rollen` gilt für Navigation und Widget gemeinsam; für „Widget nur Chef, Seite auch Büro“ bräuchte es `hubWidgetRollen`. Auswertung ist dadurch derzeit nur für den Chef in der Navigation.
- Zeiterfassung je Leistung (optional), damit der Lerneffekt nicht anteilig geschätzt werden muss.
- Steuersatz je Rechnung/Position (derzeit Betriebs-USt-Satz für alle Rechnungen).

## Offene Punkte
- Abschlagsrechnungen werden als Erlös gebucht (Warnung im Export); Anzahlungskonten nach Absprache mit dem Steuerberater.
- Buchungsstapel enthält die 14 Standardspalten; Belegbilder (Belegtransfer) und DATEV Unternehmen online sind „geplant“.
- Gemeinkosten sind bewusst nicht im Deckungsbeitrag.
- Hinweis „Kostensatz fehlt“ verlinkt auf die Mitarbeiter-Detailansicht des Pakets team (über `pfadZu`).

## Testergebnis
`npx tsc -b` ✔ · `npx vitest run` ✔ (65 Tests gesamt, davon 60 in diesem Paket) · `npx vite build` ✔.
Browser (Playwright, Chromium): Beispielbetrieb eingerichtet, alle Ansichten bei 1440 px und 390 px geöffnet,
Steuerberater-Validierung, DATEV-Export mit Download (Datei geprüft: EXTF-Kopf, CRLF, Windows-1252),
Monatsabschluss und Rechte-Sperre (Monteur) geprüft. Keine Konsolenfehler aus den Modulen
(einziger Eintrag: 404 auf ein fehlendes Favicon der Shell).
