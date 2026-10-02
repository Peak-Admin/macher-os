# Abschlussbericht Paket `geld`

## Gebaute Module und Ansichten
| Modul | Ansichten | Einhängepunkte |
|---|---|---|
| `rechnungen` | Liste (`/betrieb/rechnungen`), Neu (`/neu`, aus Auftrag oder frei), Detail/Editor (`/:id`), Druck/PDF (`/druck/rechnung/:id`, Vollbild) | Tab „Rechnungen“ an Auftrag und Kunde, Detail für `rechnungen`, Aktion `rechnung.erstellen` / `rechnung.oeffnen`, Suche, „Neu“-Eintrag, Hinweise |
| `zahlungen` | Offene Posten / Eingänge (`/betrieb/zahlungen`, Dialog „Zahlung erfassen“ per `?rechnung=`), Kontoauszug-Import (`/import`) | Hub-Widget Betrieb, Aktionen `zahlung.erfassen`, `zahlung.bestaetigen`, `zahlung.verwerfen` |
| `mahnungen` | Freigabeliste + Regeln (`/betrieb/mahnungen`), Mahnschreiben (`/:id`), Druck (`/druck/mahnung/:id`) | Panel „Offene Posten“ am Kunden, Tab „Mahnungen“ an der Rechnung, Aktionen `mahnung.senden`, `mahnung.warten`, `mahnung.ansehen` |
| `belege` | Liste (`/betrieb/belege`), Erfassen (`/neu`), Detail (`/:id`) | Schnell-Aktion „Beleg fotografieren“, Tab „Belege“ am Auftrag, Detail für `belege`, Aktionen `beleg.bezahlt`, `beleg.zuordnung-aufheben`, Suche, „Neu“-Eintrag |

## Wichtigste Pain Points (Top 5 je Modul)
- **Rechnungen:** Rechnung bleibt liegen (90) · Positionen zusammensuchen (81) · Material vergessen/doppelt (72) · Stunden falsch (64) · Abschläge falsch abgezogen (60)
- **Zahlungen:** Kontoauszug abgleichen (81) · Wer muss noch zahlen (80) · Kein Verwendungszweck (56) · Bezahlt und trotzdem gemahnt (50) · Teilzahlungen gehen unter (48)
- **Mahnungen:** Überfälliges fällt nicht auf (80) · Mahnen wird aufgeschoben (64) · Schreiben neu formulieren (42) · Stufen/Fristen (42) · Gemahnt trotz Zahlung (40)
- **Belege:** Quittungen gehen verloren (72) · Beleg ohne Auftrag (64) · Skonto verpasst (56) · Erfassung in Sekunden (54) · Steuerberater-Sammelei (48)

## Automationen (alle standardmäßig an, protokolliert in „Erledigt“)
- `rechnungen.entwurf-bei-abrechnung` – Auftrag geht in Phase „Abrechnung“ → Rechnungsentwurf (bzw. Schlussrechnung, wenn Abschläge existieren)
- `zahlungen.status` – Zahlung angelegt/gelöscht → Rechnung teilbezahlt/bezahlt/offen
- `mahnungen.pruefen` – täglich (Start + stündliche Kontrolle): Erinnerung → 1. → 2. Mahnung vorbereiten, Freigabe-Hinweis „Senden“/„Noch warten“; vorbereitete Schreiben bei Zahlung verwerfen
- `belege.zuordnen` – eindeutiger Auftrag (Lieferant + Einsatzdatum) → automatisch zuordnen, rückgängig machbar
- `belege.fristen` – Zahlungsziel/Skonto aus Lieferanten-Konditionen („3 % Skonto 10 Tage, 30 Tage netto“)

Live-Hinweise: Auftrag in Abrechnung ohne Rechnung (81), Entwurf > 3 Tage bzw. von Macher vorbereitet, Skonto sichern, Lieferantenrechnung fällig/überfällig, ungeprüfte Belege, 2. Mahnung erfolglos → Mahnverfahren entscheiden. Gespeicherte Freigaben: unsichere Kontoauszug-Zuordnung, vorbereitete Mahnung.

Fachliche Events: `rechnung.versendet`, `zahlung.eingegangen`.

## Eigene Sammlungen
- `mahnungen` (Stufe, Status vorbereitet/versendet/verworfen, Betrag, Gebühr, Zinsen, Frist, „warten bis“, Kulanz). Seed: tägliche Prüfung nach dem Onboarding (Beispiel-Abschlag → Zahlungserinnerung zur Freigabe).

## Fachliche Entscheidungen
- Rechnungsnummer wird erst beim Festschreiben vergeben (`naechsteNummer('rechnung')`), Rechnungsdatum = Festschreibedatum. Danach keine Bearbeitung; Korrektur = Stornorechnung (eigene Nummer, negative Positionen, Art `gutschrift`) + „Korrigierte Rechnung erstellen“.
- Abrechnung nach Angebot (Standard bei angenommenem Angebot) oder nach Aufwand (Zeiten × Stundensatz, Viertelstunden). Material ohne Artikel-VK: EK + Aufschlag (Einstellung `rechnungen.materialAufschlag`, Standard 20 %).
- XRechnung 3.0 (UBL 2.1): Invoice (380 bzw. 326 für Abschlag/Teil) oder CreditNote (381) mit Bezug, Steuerkategorie S/E/AE, PrepaidAmount für Abschläge, Preise nie negativ. ZUGFeRD als „geplant“ gekennzeichnet. Nicht gegen den KoSIT-Validator geprüft (offline).
- Kundenbriefe (Rechnung, Mahnung, E-Mail-Text) in Sie-Form – es ist die Stimme des Betriebs gegenüber seinen Kunden; die Oberfläche spricht mit Du.
- Versand per `mailto:` (XRechnung wird heruntergeladen, PDF-Ansicht geöffnet – Anhängen macht der Mensch).
- Basiszins-Standard 1,27 % (Stand 1.7.2025), als Einstellung mit Hinweis zur Aktualisierung.

## Kernwünsche
1. Felder in `objects.ts`: `Rechnung.stornoFuerId/stornoDurchId/reverseCharge/angebotId/materialIds/zeitIds/zusatzleistungIds/leistungVon/leistungBis/bemerkung/vonMacher`, `Zahlung.skonto/quelle/zahler`, `Beleg.skontoBis/skontoProzent`, `Kunde.ustId`/Leitweg-ID. Aktuell als Erweiterungstypen in `rechnungen/typen.ts` am Kernobjekt gespeichert.
2. `Zeiteintrag.abgerechnetIn` analog zu Material (derzeit über `zeitIds` an der Rechnung).
3. Lesender Zugriff auf fremde Sammlungen über den Namen (für `zusatzleistungen` aus doku wird aktuell `exportieren()` tolerant gelesen) – oder ein Vertrag „abrechenbare Posten“ (`abrechenbar(auftragId)` je Modul).
4. `restore()` sollte ein Event (`<sammlung>.restored`) feuern.
5. Echter Mailversand mit Anhängen, PDF-Erzeugung (für ZUGFeRD), Bankanbindung (FinTS/PSD2) als Schnittstelle.
6. Zentrale Druckvorlage/Briefbogen-Baustein in `@ui` (hier im Modul `rechnungen/Druck.tsx`, wird von mahnungen mitgenutzt).
7. Eine „Datei wählen“-Komponente in `@ui` (aktuell Label mit `mm-btn`-Klassen).
8. Rechte: `useDarf('geld')` wird auch in Tabs/Hinweisen geprüft; schöner wäre ein `recht`-Feld an Tabs/Hinweisen.

## Offene Punkte
- Auftrag nach vollständiger Bezahlung auf „erledigt“ setzen überlässt `geld` dem Paket akte (Event `zahlung.eingegangen` steht bereit).
- Ratenzahlung, Inkasso-/Mahnbescheid-Export, OCR für Belege, E-Mail-Postfach-Import, Fremdwährung, mehrere Steuersätze je Rechnung.
- XRechnung offiziell validieren (KoSIT), sobald Netz/Validator verfügbar.

## Testergebnis
`npx tsc -b` ✓ · `npx vitest run`: 6 Dateien, 48 Tests ✓ (43 im Paket geld) · `npx vite build` ✓.
Browser (Playwright, Chromium): Onboarding „Beispielbetrieb einrichten“, alle Ansichten bei 1440 px und 390 px ohne Konsolenfehler und ohne horizontales Scrollen; durchgeklickt: Kontoauszug-Beispielimport (1 Zahlung gebucht), Betriebsdaten ergänzen → Festschreiben (R-…-0003), Beleg erfassen mit automatischer Auftragszuordnung.
