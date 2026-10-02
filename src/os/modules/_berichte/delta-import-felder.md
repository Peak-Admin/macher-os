# Bericht Delta `import-felder` – DELTA 6 (Import & Wechselassistent) und DELTA 7 (Eigene Felder & Formulare)

## DELTA 6 – Daten übernehmen (`src/os/modules/import/`, Route `/betrieb/import`)

**Ablauf (eine Seite, vier Zustände):**
1. **Datei wählen** – Excel (.xlsx) oder CSV. Leerzustand erklärt, was geht; darunter „Zuletzt übernommen“ (je Import „Rückgängig“).
   Vorauswahl per Link: `/betrieb/import?art=kunden` (für Leerzustände, siehe Kernwünsche).
2. **Macher erkennt den Inhalt** – „Macher hat Kunden erkannt“. Arten: Kunden, Ansprechpartner, Mitarbeiter, Artikel,
   Leistungen, Preise, offene Angebote, offene Aufträge, offene Rechnungen. Erkennung über Spaltennamen (Synonyme,
   exakt → Anfang), Wertemuster (Rechnungsnummern, Geld …) und Dateiname („OP-Liste.xlsx“). Kopfzeile wird auch unter
   Titelzeilen gefunden.
3. **Zuordnung vorschlagen** – je Spalte ein Satz: „Diese Spalte sieht nach Kundennummer aus“ bzw. über den Inhalt
   „Diese Spalte enthält E-Mail-Adressen – passt zu E-Mail“. Muster: E-Mail, IBAN (mit Prüfsumme), PLZ, Telefon, Datum,
   Geld deutsch („1.234,56 €“), Rechnungsnummer, Zahl. Eindeutige Inhalte schlagen Namen („Nr“ voller E-Mails ist keine Nummer).
4. **Bestätigen** – einfache Liste mit Status „Wird übernommen / Nicht übernommen“. Korrektur je Spalte nur über
   „Zuordnung ändern“ (Progressive Disclosure). Art jederzeit wechselbar.
5. **Vorschau** – „42 Kunden, 3 doppelt, 2 mit Fehler“, erste fünf Zeilen mit Stand, Fehlerliste, Dublettenliste.
6. **Übernehmen** – in einem `batch`. Dubletten gegen Bestand **und** innerhalb der Datei (Kunden: `aehnlicheKunden`/
   `dublettenGruende` aus dem Kundenstamm; Artikel: `findeArtikel` (Nummer/EAN); Leistungen/Mitarbeiter: Name/E-Mail;
   Angebote/Aufträge/Rechnungen: Nummer). Doppelte werden weggelassen, nie kopiert.
   **Verknüpfung per ID:** Angebot/Auftrag/Rechnung → Kunde über Kundennummer oder Namen; fehlt der Kunde, wird er einmal
   angelegt und alle Zeilen verweisen auf ihn. Ein offenes Angebot bekommt seinen Auftrag (Phase `angebot`), Rechnungen
   werden über die Auftragsnummer mit Aufträgen verknüpft. Geld in Cent, Brutto → Netto mit dem USt-Satz des Betriebs
   (Kleinunternehmer 0 %). `beispiel` wird nie gesetzt. Excel-Eigenheiten: PLZ ohne führende Null, Datum als Seriennummer,
   Punkt als Dezimaltrenner. Ansprechpartner und Preise **ergänzen** vorhandene Objekte (alter Stand wird gemerkt).
7. **Fehler verständlich** – „Zeile 14: E-Mail fehlt das @“, „Zeile 7: PLZ „341“ hat nicht 5 Ziffern“,
   „Zeile 4: Kunde „X“ gibt es noch nicht – zuerst Kunden übernehmen“.
   **Rückgängig** des ganzen Imports: Angelegtes in den Papierkorb (Soft Delete), Geändertes auf den alten Stand.

**Wiederverwendet:** `xlsxZeilen`/`istXlsx` (`onboarding/xlsx.ts`), `csvZeilen`/`textDekodieren` (`onboarding/daten.ts`),
`aehnlicheKunden`/`normName`/`normEmail` (`kunden/daten.ts`), `einheitAus`/`findeArtikel` (`artikel/daten.ts`),
`naechsteFarbe` (`mitarbeiter/team.ts`), `naechsteNummer` (Kern). Keine neuen Pakete.

**Einstiege:** Betrieb › Einstellungen › Daten & Sicherung (Karte „Daten übernehmen“), Suche („Excel“, „Import“, „Lexware“,
„Umstieg“ …), Link mit `?art=`.

## DELTA 7 – Eigene Felder & Formulare (`src/os/modules/felder/`, Route `/betrieb/felder`)

- **Feld-Definitionen** (`eigeneFelder`): Objektart Kunde, Ort/Baustelle, Anlage, Auftrag, Mitarbeiter,
  Besichtigung/Termin, Aufmaß, Wartung, Abnahme, Formular. Typen Text, Zahl, Zahl mit Einheit (Maßeinheit), Auswahl,
  Ja/Nein, Datum, Foto, Datei, Unterschrift. Pflichtfeld, Hinweis („Weitere Optionen“), Reihenfolge, stabiler `schluessel`.
- **Werte** (`feldwerte`): `{ feldId, bezug, wert }` – eigene Sammlung mit Bezug, keine Änderung an `objects.ts`,
  keine Kopie. Foto/Datei/Unterschrift werden als `Dokument` am Objekt abgelegt (erst beim Speichern), der Wert ist die
  Dokument-ID. Speichern prüft alle Felder und speichert alle oder keinen; Zeitstrahl-Vermerk am Objekt.
- **Formulare** (`eigeneFormulare`): Name, wo ausgefüllt (Objektart), geordnete Felder (`objekt: 'formular'`, `formularId`).
  Am Objekt als Liste mit Stand (Offen / Angefangen / Ausgefüllt), Ausfüllen im Dialog.
- **Anzeige:** Panel „Eigene Angaben“ über `panels` an Kunde, Ort, Anlage, Auftrag, Mitarbeiter, Termin – kein Tab,
  kein neuer Bereich. Unsichtbar, solange es keine passenden Felder/Formulare gibt. Aufmaß-/Wartungs-/Abnahmefelder
  erscheinen nur an passenden Aufträgen (Aufmaß vorhanden bzw. Phase Besichtigung/Angebot; `art: 'wartung'`;
  Abnahme vorhanden bzw. Phase Abnahme/Abrechnung/Erledigt).
- **Verwaltung:** „Eigene Felder“ (Kontext unter Betrieb › Einstellungen, Knopf in „Mehr einstellen“), Hauptaktion
  „Eigenes Feld hinzufügen“, gruppiert („Am Kunden“, „Beim Aufmaß“ …), verschieben/entfernen über „Mehr“. Recht `admin`.
  Entfernen legt Feld und Werte in den Papierkorb.
- **Gewerk-Vorlagen:** `feldvorlagenAnwenden(vorlagen)` nimmt genau `{ objekt, schluessel, label, typ, einheit?, optionen? }[]`,
  ist idempotent über `schluessel` (auch bewusst entfernte Felder kommen nicht zurück) und versteht Schreibweisen
  (`anlagen`/`Anlage`, `ja_nein`, `Maßeinheit` …). Die Verwaltung bietet „Übernehmen“ an, sobald die Gewerk-Vorlage
  ein Feld `feldvorlagen` (oder `felder`) in diesem Format hat (`sindFeldvorlagen` prüft das Format).
- **Suche:** `suche` findet eigene Feldwerte (Text, Auswahl, Zahl, Datum) und führt zum Objekt („Ort · Zählernummer: 1ESY4711“).

## Events

- gesendet: `import.abgeschlossen` (`daten: { art, angelegt, geaendert, fehler, doppelt }`, `objekt`: Import-Eintrag),
  `import.rueckgaengig`, `formular.ausgefuellt` (`daten: { formularId, bezug }`).
- abonniert: keine.

## Automationen / Aktionen

- Keine neuen Automationen. Aktion `import.rueckgaengig` (`payload: { importId }`) für Hinweis-/Protokoll-Knöpfe.
- Bestehende Automationen greifen normal (z. B. `kunden.nummer` vergibt Kundennummern für übernommene Kunden ohne Nummer).

## Neue Sammlungen

`importe`, `eigeneFelder`, `eigeneFormulare`, `feldwerte`.

## Geänderte Dateien außerhalb der neuen Module

- `src/os/shell/struktur.ts`: eine Zeile – `kontext: ['import', 'felder']` am Ziel „Einstellungen“.
- `src/os/modules/einstellungen/DatenSicherung.tsx`: Karte „Daten übernehmen“ (Einstieg).
- `src/os/modules/einstellungen/Betriebsdaten.tsx`: Knopf „Eigene Felder“ unter „Mehr einstellen“ (Einstieg).

## Kernwünsche / Wünsche an andere Module

1. **Leerzustände Kunden-/Artikelliste:** Knopf „Kunden aus Excel übernehmen“ → `/betrieb/import?art=kunden`
   bzw. „Artikel aus Excel übernehmen“ → `/betrieb/import?art=artikel` (Module `kunden`, `artikel` – nicht angefasst).
   `ArtikelImport.tsx` (Artikel-CSV mit Lieferant und Aufschlag) kann mittelfristig auf den Assistenten zeigen.
2. **Onboarding:** im Schritt „Kunden & Preise“ ein Link „Weitere Daten übernehmen (Artikel, offene Rechnungen …)“
   → `/betrieb/import` (Schritte.tsx gehört einem anderen Agenten – nicht angefasst).
3. **Gewerk-Feldvorlagen:** Der Pipeline-Agent liefert sie in `@core/gewerke`. Am einfachsten als Feld `feldvorlagen`
   an `GewerkVorlage` – dann erscheint der Vorschlag in der Verwaltung automatisch. Alternativ beim Onboarding-Abschluss
   `feldvorlagenAnwenden(gewerkVorlage(g).feldvorlagen)` aufrufen.
4. **Ereigniskatalog** (`src/os/core/ereignisse.ts`): `import.rueckgaengig` und `formular.ausgefuellt` aufnehmen.
5. **Detailansichten ohne `ObjektPanels`:** Aufmaß und Abnahme haben keine eigene Detailansicht; ihre Felder hängen
   deshalb am Auftrag. Bekämen sie eine, kann `FELD_OBJEKTE` direkt auf `aufmasse`/`abnahmen` zeigen.
6. **`module-liste.ts`** wird generiert und ist bewusst nicht mit committet (vermeidet Merge-Konflikte; `dev`/`build`/`test`
   erzeugen sie neu).

## Offene Punkte

- Ein Formular wird je Objekt einmal ausgefüllt (Werte überschreiben sich). Wiederholte Protokolle (z. B. jährlich)
  bräuchten Formular-Einträge mit Datum.
- Offene Rechnungen werden als eine Pauschalposition übernommen (Altsystem liefert meist nur Summen); Teilzahlungen
  aus der Datei werden nicht verbucht.
- Import großer Dateien (> 10.000 Zeilen) ist nicht optimiert (Dublettenprüfung quadratisch bei Kunden).

## Testergebnis

`npm run typecheck`, `npm run lint` (0 Fehler), `npm test` (alle grün, davon neu: 30 Import-Tests – Wertelesen, Muster,
Parser CSV/xlsx, Erkennung je Art, Dubletten, Übernehmen, Rückgängig – und 17 Feld-Tests – Validierung je Feldtyp,
Werte, Sichtbarkeit, Formulare, Vorlagen, Suche), `npm run build` grün. Im Browser (Spielwiese) bei 1440 und 390 px:
CSV übernehmen (Erkennung, Vorschau, Fehler, Dublette, Ergebnis), eigenes Feld anlegen, am Kunden eintragen –
keine Konsolenfehler, kein waagrechtes Scrollen.
