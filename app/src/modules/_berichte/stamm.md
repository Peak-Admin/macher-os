# Abschlussbericht Paket `stamm`

Branch: `claude/fervent-pascal-joztaz-stamm` · Bereich: Aufträge

## Gebaute Module und Ansichten

| Modul | Navigation | Ansichten | Einhängungen |
|---|---|---|---|
| `kunden` Kunden | haupt | Liste (Suche, Filter, Dubletten-Meldung) · Anlegen (mit Dubletten-Warnung, Quelle, Empfehler) · Detail (Bearbeiten-Dialog, Löschen → Papierkorb mit Rückgängig) · Doppelte Kunden (Zusammenführen) | Tabs am Kunden: Aufträge (eigen), Ansprechpartner, Verlauf (über `tabs`, damit Orte/Anlagen davor stehen) |
| `orte` Orte & Baustellen | haupt | Liste (Filter „laufender Auftrag“, „ohne Zugangsinfos“) · Detail mit Karte **„Vor Ort wichtig“** (Navigation, Anrufen vor Ort, Zugang, Schlüssel, Parken, Gut zu wissen) · Anlegen/Bearbeiten-Dialog | Tab „Orte“ am Kunden · Panel „Einsatzort“ am **Auftrag** (mit Ortswahl, wenn keiner gesetzt) und am **Termin** |
| `anlagen` Anlagen | haupt | Liste (Filter „Wartung fällig“, „Gewährleistung endet“) · Detail (Wartung, Gewährleistung, Historie, Daten, Verlauf) · Anlegen/Bearbeiten-Dialog | Tabs „Anlagen“ am Kunden, am Ort und am Auftrag (verknüpfen/lösen/neu erfassen) |
| `kundenbereich` Kundenbereich | hub | Vollbild **`/k/:token`** (Termine, Angebote annehmen/ablehnen mit Namensbestätigung, Rechnungen mit Status, Unterlagen `fuerKunde`, Nachricht schicken) · Übersicht aller Links | Panel „Kundenbereich“ am Kunden (Link erzeugen und kopieren, ansehen, sperren) |
| `bewertungen` Bewertungen & Empfehlungen | hub | Eine Seite mit Tabs: Anfragen (freigeben, gefragt, interne Zufriedenheit) · Empfehlungen (wer hat empfohlen, Rangliste, „Bedankt“) · Einstellung (Google-Bewertungslink, Textvorschau) | Panel „Bewertung“ am Auftrag (nur wenn erledigt) · Panel „Empfehlung & Zufriedenheit“ am Kunden |

Alle Ansichten haben Leer-, Fehler- (Validierung am Feld) und Erfolgszustände (Toast) und wurden bei 1440 px und 390 px ohne Konsolenfehler und ohne horizontales Scrollen geprüft.

## Wichtigste Pain Points (Top 5 je Modul)

**Kunden:** Kunde doppelt angelegt (63) · Telefonnummer fehlt, Monteur vor verschlossener Tür (63) · richtiger Ansprechpartner unbekannt (56) · Kunde beim Anruf nicht schnell gefunden (54) · neuer Kunde trotz vorhandenem angelegt (49)

**Orte & Baustellen:** Monteur weiß nicht, wie er reinkommt (72) · Schlüssel (54) · Rückfragen im Büro nach Adresse/Ansprechpartner (54) · Parken (49) · Ansprechpartner vor Ort unbekannt (49)

**Anlagen:** Typ/Modell/Baujahr beim Störungsanruf unbekannt (64) · falsches Ersatzteil dabei (54) · Wartung vergessen (54) · Historie fehlt (49) · Wartungsdatum nach Erledigung nicht nachgetragen (42)

**Kundenbereich:** „Wann kommt ihr?“-Anrufe (63) · Annahme nur telefonisch ohne Nachweis (56) · Nachrichten über viele Kanäle (49) · Login/Passwort scheitert (48) · mobil unbedienbar (48)

**Bewertungen:** Nach guter Arbeit wird nicht gefragt (56) · zu wenige Google-Bewertungen (40) · Empfehler unbekannt (36) · Zufriedenheit nur Bauchgefühl (30) · Empfehlungs-Kunde nicht markiert (25)

Details: `PAINPOINTS.md` im jeweiligen Modulordner.

## Automationen (alle standardmäßig an, mit Eintrag in „Erledigt“)

| ID | Modul | Was passiert |
|---|---|---|
| `kunden.nummer` | kunden | Neue Kunden ohne Nummer bekommen die nächste freie Kundennummer (K-1001 …) |
| `orte.zuordnen` | orte | Auftrag ohne Ort → einziger Ort des Kunden, sonst Ort aus Kundenadresse anlegen; Termine übernehmen den Ort ihres Auftrags; `pruefen` beim Start |
| `anlagen.wartung` | anlagen | Wartungsauftrag erledigt → letzte Wartung eintragen, nächste aus Intervall berechnen |
| `kundenbereich.link` | kundenbereich | `angebot.versendet` → Link zum Kundenbereich anlegen, falls keiner aktiv |
| `bewertungen.vorbereiten` | bewertungen | Auftrag geht auf „erledigt“ → Bewertungsanfrage vorbereiten (ohne Reklamation, max. alle 180 Tage, nicht bei Unzufriedenheit) → Hinweis zur Freigabe |

**Hinweise (Braucht dich):** Kunden doppelt (24) · Telefonnummer fehlt bei laufendem Auftrag (30) · Zugang klären vor Einsatz an Baustelle/Gewerbe (42) · Einsatzort fehlt (48) · Gewährleistung endet (20) · Wartung überfällig (36, nur wenn Modul `wartung` fehlt) · Bewertung anfragen (18, Freigabe mit Aktionen) · Wer hat empfohlen? (12).

**Aktionen:** `bewertung.anfragen` `{ auftragId }` (Vertrag), `bewertung.verwerfen` `{ auftragId }`, `anlage.wartungsauftrag` `{ anlageId }` → Pfad zum Auftrag.

**Events:** `angebot.angenommen` / `angebot.abgelehnt` aus dem Kundenbereich (`objekt` = Angebot, `daten: { angebotId, auftragId, name, quelle: 'portal', zeit }`); neu: `kunde.zusammengefuehrt` (`daten: { zielId, quelleId }`) – andere Pakete mit eigenen Sammlungen, die `kundeId` halten, sollten darauf hören und umhängen.

## Eigene Sammlungen

- `portalzugaenge` (kundenbereich): `{ kundeId, token, gueltigBis, widerrufenAm?, letzterZugriffAm? }`
- `bewertungen` (bewertungen): `{ art: 'anfrage' | 'empfehlung', kundeId, auftragId?, status?, gesendetAm?, zufriedenheit? (1–5, intern), zufriedenheitNotiz?, empfohlenVonKundeId?, bedanktAm? }`

Seeds: ein Link für den Beispielkunden mit versendetem Angebot; eine vorbereitete Bewertungsanfrage für den erledigten Beispielauftrag. Empfehlungen werden bewusst nicht erfunden.

## Kernwünsche

1. **`Ort` strukturierte Felder** `zugang`, `parken`, `schluessel`: heute im Freitext `hinweise` mit Zeilenpräfix („Zugang: …“) gelöst; Freitext ohne Präfix wird per Stichwort zugeordnet (`orte/daten.ts`).
2. **`beispieleEntfernen()`** purgt nur Kernsammlungen – Beispieldaten in Modul-Sammlungen (`portalzugaenge`, `bewertungen`, …) bleiben liegen. Vorschlag: Registry aller `defineCollection`-Sammlungen.
3. **Kunden-Zusammenführen** kennt nur Kernsammlungen; Modul-Sammlungen mit `kundeId` müssen auf `kunde.zusammengefuehrt` hören. Vorschlag: zentrale Verweis-Registry (`verweist({ sammlung, feld: 'kundeId' })`).
4. **Aktuellen Nutzer im Kundenbereich**: `setAktuellerNutzer(undefined)` wird im Portal gesetzt, damit Ereignisse nicht dem eingeloggten Mitarbeiter zugeschrieben werden. Besser: eigener Akteur „Kunde“ im Ereignis.
5. **`ListenZeile` mit `to` und Buttons in `rechts`** erzeugt verschachtelte interaktive Elemente (Button im Link). Vermieden, aber ein `rechts` außerhalb des Links wäre robuster.
6. `Kunde` hätte gern `empfohlenVonKundeId` – heute in der Sammlung `bewertungen` (Art `empfehlung`) abgebildet.
7. `ObjektTabs`: Reihenfolge eigene/fremde Tabs frei gewichten (heute stehen `eigene` immer vorn); umgangen, indem Verlauf/Ansprechpartner als `tabs` registriert sind.

## Offene Punkte

- Detailansicht Auftrag/Termin/Angebot gehört anderen Paketen; Links dorthin laufen über `pfadZu` und werden erst nach dem Zusammenführen klickbar.
- Phasenwechsel des Auftrags nach Annahme im Portal übernimmt das Modul `angebote` (Event `angebot.angenommen`).
- Versand von Bewertungsanfragen erzeugt eine ausgehende `nachricht` (E-Mail/SMS); der tatsächliche Versand liegt beim Modul `nachrichten`.
- Rechnungsbetrag im Kundenbereich = Brutto der Positionen; Abzüge von Abschlagsrechnungen bei Schlussrechnungen werden nicht verrechnet.
- „Wartung überfällig“ meldet `anlagen` nur, wenn das Modul `wartung` (Paket service) fehlt.

## Testergebnis

```
cd app && npm ci && npx tsc -b && npx vitest run && npx vite build
Test Files  6 passed (6)
Tests       47 passed (47)   – davon 42 neu in kunden, orte, anlagen, kundenbereich, bewertungen
vite build  ✓
```

Browser (Playwright, Chromium, 1440 px und 390 px): alle Ansichten geöffnet, keine Konsolenfehler, kein horizontales Scrollen.
Durchgespielt: Dublette anlegen (Warnung) → zusammenführen · Angebot im Kundenbereich ohne/mit vollem Namen annehmen · Nachricht senden · Ort bearbeiten · Google-Link eintragen → Anfrage senden → Zufriedenheit eintragen · Empfehler eintragen · Anlage mit Validierung anlegen (nächste Wartung automatisch) · Ansprechpartner hinzufügen · Kunde löschen mit Bestätigung.
