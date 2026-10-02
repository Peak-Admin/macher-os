# Abschlussbericht Paket `material`

Branch: `claude/fervent-pascal-joztaz-material`

## Gebaute Module und Ansichten

| Modul | Gruppe | Ansichten (Routen) | Einhängepunkte |
|---|---|---|---|
| `artikel` Artikel & Material | material | Liste mit Suche (Name/Nr./EAN/Hersteller-Nr.) + Kategorie-Filter · Detail `/betrieb/artikel/:id` · Anlegen/Bearbeiten mit Aufschlag-Rechner · CSV-Import `/betrieb/artikel/import` | `detail: artikel`, Suche (exakte Nr./EAN zuerst), „Neu“-Eintrag, Kurzinfo |
| `lager` Lager | material | Bestand je Lagerort (Hauptlager + jedes Fahrzeug) mit Buchen-Dialog · Inventur mobil `/betrieb/lager/inventur` · Bewegungsprotokoll `/betrieb/lager/bewegungen` | Automation, Kurzinfo, Seed |
| `bedarf` Bedarf | material | Fehlmengen je Lieferant mit betroffenen Aufträgen, „Bestellvorschlag erstellen“ (alle oder je Lieferant) | Automation + gespeicherter Hinweis, Aktionen, Kurzinfo |
| `bestellungen` Bestellungen | material | Liste (Offen/Unterwegs/Geliefert/Alle) · Anlegen · Detail mit Positionen, Bestelltext, `mailto:`-Versand, Wareneingang (Teilmengen), Storno | Hinweise, Aktionen, Suche, „Neu“, Seed |
| `lieferanten` Lieferanten | material | Liste · Detail `/betrieb/lieferanten/:id` (Kontakt, Konditionen, Ansprechpartner, Bestellungen, Artikel) · Anlegen/Bearbeiten | `detail: lieferanten`, Suche, „Neu“, Kurzinfo |
| `werkzeuge` Werkzeuge | werkzeuge | Liste · **gemeinsame Detailansicht** `/betrieb/werkzeuge/:id` für alle Betriebsmittel · Anlegen/Bearbeiten `/betrieb/werkzeuge/neu?art=…` | `detail: betriebsmittel`, Hub-Widget „Wer hat was?“, Panel am Mitarbeiter, Schnell „Defekt melden“, Hinweise, Aktionen, Suche |
| `maschinen` Maschinen & Geräte | werkzeuge | Liste (Art `maschine`) | Kurzinfo, „Neu“ |
| `fahrzeuge` Fahrzeuge | werkzeuge | Liste (Art `fahrzeug`); Detail zeigt Fahrer, Ausstattung (Ein-/Ausladen), Material im Fahrzeuglager, Kilometerstand | Kurzinfo, „Neu“ |
| `pruefungen` Prüfungen & Wartung | werkzeuge | Fristenliste über alle Betriebsmittel (30 Tage / überfällig / alle, Geräte ohne Frist) · Dialog „Prüfung dokumentieren“ | Hinweise 30/14/überfällig, Aktion, Automation, Kurzinfo |

„Wer hat den Bohrhammer?“: Hub-Widget auf `/betrieb` (tippen → Antwort „Bei Jonas Becker“ / „Im Fahrzeug …“) und Suche in jeder
Betriebsmittel-Liste über alle Arten; die Antwort steht direkt in der Zeile.

## Wichtigste Pain Points (Top 5 je Modul)

- **Artikel:** Artikel nicht gefunden (72) · Preise veraltet (63) · Aufschlag im Kopf gerechnet (56) · Stamm abtippen statt importieren (50) · Dubletten (42)
- **Lager:** Bestand stimmt nicht (81) · Material fehlt auf der Baustelle (70) · Fahrzeuginhalt unbekannt (64) · Entnahmen nicht gebucht (63) · Nachbestellung vergessen (56)
- **Bedarf:** Material fehlt am Einsatztag (70) · Bedarf je Auftrag zusammensuchen (64) · Lager nicht berücksichtigt (49) · doppelt bestellt (48) · zu spät bestellt (48)
- **Bestellungen:** keiner weiß, was bestellt ist (64) · Lieferung bleibt aus (50) · Bestell-Mail jedes Mal tippen (48) · Wareneingang ungeprüft (42) · Teillieferung vergessen (40)
- **Lieferanten:** Kundennummer nicht zur Hand (40) · Lieferzeit unbekannt (40) · Kontakt suchen (35) · Konditionen vergessen (32) · Artikel je Lieferant (30)
- **Werkzeuge:** „Wer hat den Bohrhammer?“ (72) · Werkzeug verschwindet (54) · Ausgabe zu umständlich (48) · defekt zurück ins Regal (45) · Fahrzeuginhalt (42)
- **Maschinen:** wer hat die Maschine (56) · schon auf anderer Baustelle (54) · Prüfung überfällig (40) · Defekt nicht gemeldet (40) · Doppelbelegung (32)
- **Fahrzeuge:** Werkzeug im Fahrzeug (56) · wer fährt welches Auto (48) · Fahrzeuglager unbekannt (42) · Defekt nicht gemeldet (32) · TÜV verpasst (30)
- **Prüfungen:** Fristen verteilt (49) · Gerät mit abgelaufener Prüfung benutzt (45) · Haftung bei verpasster Frist (40) · Frist selbst rechnen (30) · Gerät gerade unterwegs (30)

Details: `PAINPOINTS.md` in jedem Modulordner.

## Automationen

| ID | Was passiert | Standard |
|---|---|---|
| `lager.verbrauch-abbuchen` | Materialbuchung am Auftrag wird „verbraucht“ → Entnahme vom Fahrzeuglager des Monteurs (falls Bestand dort), sonst vom Standard-Lagerort; nur Lagerartikel, nie doppelt (Verweis `materialId`). Erledigt-Eintrag. | an |
| `bedarf.taeglich-pruefen` | Täglich (und gebündelt nach Änderungen an Material, Artikeln, Bestellungen, Terminen, Aufträgen) Bedarf rechnen → ein gespeicherter Hinweis `bedarf-fehlt` mit Aktion „Bestellvorschlag erstellen“; schließt sich selbst, wenn alles abgedeckt ist. Erledigt-Eintrag 1× täglich. | an |
| `pruefungen.besitzer-warnen` | Wer ein Gerät mit überfälliger Prüfung hat, bekommt einmalig eine Benachrichtigung „Nicht verwenden“. Erledigt-Eintrag. | an |
| (fest) Wareneingang | Bucht Lagerzugang in den Lieferort, setzt abgedeckte Materialbuchungen auf `bereit`, Erledigt-Eintrag `bestellungen.wareneingang`. Bestellen setzt verknüpftes Material auf `bestellt`, Storno zurück auf `geplant`. | – |

Live-Hinweise (Braucht dich): Prüfung in ≤ 30 Tagen (30), ≤ 14 Tagen (55), überfällig „nicht verwenden!“ (80/90 Fahrzeug) ·
Gerät defekt (45/60) · Lieferung überfällig (60) · Bestellentwurf seit gestern nicht abgeschickt (45).

Registrierte Aktionen: `material.bestellvorschlag`, `material.bedarf-oeffnen`, `bestellung.wareneingang`, `bestellung.oeffnen`,
`pruefung.dokumentieren`, `betriebsmittel.repariert`, `betriebsmittel.zurueck`.

## Eigene Sammlungen

- `lagerbewegungen` (`lager/daten.ts`): `{ art: zugang|entnahme|umbuchung|inventur, artikelId, menge>0, von?, nach?, datum, mitarbeiterId?, auftragId?, materialId?, bestellungId?, notiz? }`.
  Lagerort-IDs: `haupt` bzw. `fz:<betriebsmittelId>`. `artikel.bestand` bleibt die Summe; Altbestand ohne Bewegung liegt am Standardort (`artikel.lagerort`).
- `bestellungen` (`bestellungen/daten.ts`): `{ nummer B-JJJJ-NNNN, lieferantId?, status, positionen[{ artikelId?, text, menge, einheit, ek, geliefert, materialIds? }], lieferort, bestelltAm?, erwartetAm?, geliefertAm?, notiz? }`.

Andere Pakete können `offeneMengen()`, `berechneBedarf()`, `bestandJeOrt()`, `woIst()`, `faelligkeit()` direkt aus den `daten.ts` importieren
(z. B. planpruefung für „Material bereit?“ / „Werkzeug bereit?“).

## Kernwünsche

1. `Betriebsmittel`: `kilometerstand`, `pruefIntervallMonate`, `ausgegebenAm`, `fahrzeugId` (statt Standort-Text) und **mehrere Prüfungen je Gerät** (z. B. `pruefungen: { art, naechste, intervallMonate }[]` für HU + UVV). Aktuell als Zusatzfelder am selben Objekt gespeichert (`BetriebsmittelX`), Standort eines Werkzeugs im Fahrzeug = Kennzeichen (wie im Seed).
2. `Lieferant.ansprechpartner: Ansprechpartner[]` (aktuell als Zusatzfeld gespeichert, `LieferantX`).
3. `naechsteNummer('bestellung')` im Kern-Nummernkreis (aktuell eigene Zählung in `bestellungen/daten.ts`).
4. `ObjektTyp` um `bestellungen`/`lagerbewegungen` erweiterbar machen (für `Bezug`, `pfadZu`, Zeitstrahl) – aktuell per Cast.
5. Prüfprotokolle als eigener Typ wären sauberer; aktuell Zeitstrahl-Eintrag `betriebsmittel.geprueft` (mit Daten) + `Dokument` mit Bezug aufs Gerät.
6. Periodische Prüfungen (`pruefen`) laufen nur beim App-Start; ein zentraler Takt (z. B. stündlich/täglich) im Kern wäre gut – aktuell eigene `setInterval` in den Automationen.

## Offene Punkte / Abstimmung beim Zusammenführen

- **Doppelbuchung vermeiden:** Bucht das Paket `akte` (`material-am-auftrag`) bei „verbraucht“ selbst vom Bestand ab, muss eine der beiden Seiten verzichten. Vorschlag: Lager bleibt Besitzer aller Bestandsänderungen (Automation `lager.verbrauch-abbuchen`).
- Bedarf zählt Aufträge in Phase beauftragt / in Arbeit / Abnahme oder mit offenem Termin ab heute; Angebote ohne Zusage zählen nicht.
- Datanorm-Import nur als „geplant“ gekennzeichnet. Keine Verpackungseinheiten/Aufrunden im Bestellvorschlag.
- Beispieldaten: Seed legt eine überfällige Beispielbestellung und Umbuchungen ins erste Fahrzeug an. Der Bedarf ist im Beispielbetrieb leer („Alles da“), weil die Kern-Beispieldaten genug Bestand haben.

## Testergebnis

```
npx tsc -b       → ohne Fehler
npx vitest run   → 7 Testdateien, 37 Tests grün (32 davon aus diesem Paket: lager, bedarf, bestellungen, pruefungen, artikel, werkzeuge)
npx vite build   → erfolgreich
```

Browser (Playwright, Chromium): Beispielbetrieb eingerichtet, alle 23 Ansichten bei 1440 px und 390 px geöffnet – keine Konsolenfehler,
kein horizontales Scrollen. Durchgeklickt: Bohrhammer suchen → „Ich nehme es“ (Warnung wegen überfälliger Prüfung) → Prüfung dokumentieren
(neue Frist +12 Monate) → ins Fahrzeug ausgeben · Lagerentnahme · Inventur mit Differenzbuchung · Teil-Wareneingang · Bedarf mit
Artikel- und Freitext-Fehlmenge → gespeicherter Hinweis → Bestellvorschlag (2 Entwürfe) → Bedarf „Alles da“ · CSV-Import · Artikel mit
Aufschlag (10 € + 35 % = 13,50 €) · Lieferant mit Validierung.
