# macher-os – Design-Festlegungen

> **Seit Oktober 2026 gilt vorrangig die [UX- und Designspezifikation](ux-spezifikation.md).** Sie überschreibt alle
> bisherigen Designvorgaben – auch diese Datei und das Playbook. Abgelöst sind insbesondere:
> Primärbutton-Farbe `#2F9250` (jetzt `#0d6b45`; Software flach, 16 px halbfett, 48 px hoch), Icon-Kacheln in Akzentgrün mit weißen Linien
> (jetzt helle Grünfläche `#e8f2ec` mit dunkelgrünem Icon), der dunkle Wechsler `#1C2619` (jetzt heller Umschalter),
> die aktive Sidebar-Kachel (jetzt hellgrüne Zeile, dunkelgrüne Schrift), kleine Radien 4–8 px (jetzt 8/12/16 px),
> Controls 44 px (jetzt 48 px) und das Glas über dem Werkstattfoto (Arbeitsflächen sind jetzt deckend).
> Weiter gültig: vier feste Bereiche, flache Navigation, Favoriten, Orientierungsbeispiele für Website-Bildsprache.

Ergänzt das [Brand & Software Design Playbook](brand-playbook.md). Bei Widerspruch gilt diese Datei,
weil sie jüngere, ausdrücklich bestätigte Entscheidungen enthält – außer gegenüber der UX-Spezifikation (siehe oben).

## Bestätigte Bausteine

### Primärbutton (Website) – Pixel-Würfel, Farbe nach UX-Spezifikation
Aktionsgrün `#0d6b45` (früher `#2F9250`) mit leichtem Verlauf, hellem Innenschein und feinen Pixel-Würfeln
(`public/marke/button-pixel.svg`), weiße Schrift **Barlow 700 in 19 px**, **12 px Radius**, mind. 48 px hoch.
Links ein weißer Kreis mit grünem Pfeil; beim Hover und Fokus wandert der Pfeil nach rechts, die Würfel laufen einmal
**von rechts nach links** durch (mit `prefers-reduced-motion` ohne Bewegung). Fokus: 3-px-Ring (UX-Spezifikation).
Funktioniert auf hellen und dunklen Flächen gleich – auch im dunklen Hero und Abschluss-CTA ist das die Hauptaktion.
Weiß auf `#0d6b45` hat 6,55:1. Kleine weiße Texte auf Grün (Badges, Schrittnummern) stehen auf dunklem Grün `#164c34`.
Vorbild: CTA „Jetzt Erstgespräch vereinbaren“ auf matthias-aumann.de (Wirkung nachgebaut, keine fremden Dateien).

- Website: Utility `btn-primaer` (`src/app/globals.css`), Pfeil über `BtnPfeil`; `ButtonLink` Variante `primary` bringt beides mit.
  Zweitbuttons daneben gleich hoch und ebenfalls 12 px Radius.
- Software: `.mm-btn--primaer` (`--mm-action`) – bleibt schlicht und flach mit 8 px Radius (Arbeitsoberfläche, UX-Spezifikation 5.1).

### Karten (Website)
Helle Karten 12 px Radius, 1-px-Linie `#dce2dc`, sehr feiner Schatten.
Auf Markendunkel: Utility `karte-dunkel` – leicht aufgehellte Fläche (Weiß 6 % → 2,5 %), feiner heller Rahmen (Weiß 11 %), 12 px Radius.
Radien Website (UX-Spezifikation): Controls 8 px (`rounded-md`/`rounded-lg`), Karten und Panels 12 px (`rounded-xl`/`rounded-2xl`), Menüs und große Flächen 16 px (`rounded-3xl`).

**Einstiegs-CTA (Einrichtung):** Der „Weiter“-Button im Onboarding folgt dem CTA von matthias-aumann.de:
grüne Fläche mit hellem Innenrand und feinem 8-px-Würfelraster, 12 px Radius, 56 px hoch, weißer Kreis mit grünem Pfeil links.
Beim Hover verschwindet der Kreis links und erscheint rechts. Schrift bleibt Barlow 700 in 19 px (Kontrast).
Nur für diesen einen Einstiegsmoment – im Arbeitsalltag bleibt der flache Primärbutton.

- Software: `WeiterButton` in `src/os/modules/onboarding/Willkommen.tsx`, Klassen `.ob-weiter*`

### Glas-Icons (Themen-Icons, Oktober 2026 – gelten für Website und Software)
Jedes Themen-Icon ab ca. 32 px ist ein **Glas-Icon**: hinten eine deckende Form mit Verlauf Logogrün `#2f9250` →
Aktionsgrün `#0d6b45`, davor eine Milchglasform (oben links helle Grünfläche `#e8f2ec` fast deckend, unten rechts
Logogrün durchscheinend, feine weiße Kante), durch die die hintere Form weich verschwommen leuchtet. Details stehen in
Aktionsgrün auf dem Glas, weiß auf der hinteren Form. Keine Kachel dahinter. Immer mit Textlabel daneben (dekorativ).

- Bibliothek: `src/os/ui/glas.tsx` (`GlasIcon`, 61 Motive, Raster 48 × 48) – eine Quelle für Website und Software
- Farben nur über `--glas-hell`, `--glas-dunkel`, `--glas-milch`, `--glas-licht`
  (Website: `src/app/globals.css`, Software: `src/os/ui/tokens.css`)
- Website: `IconTile` (`src/components/ui/Icon.tsx`) zeigt zum Strich-Icon automatisch das Glas-Icon (Standard 44 px);
  Mega-Menü 36 px
- Software: `ThemenIcon` in Modulkacheln, Auswahl- und Start-Karten, Verzeichnis, Home- und News-Kacheln und
  Leerzuständen; die Kachelfläche entfällt, sobald ein Glas-Icon darin steht
- Wo ein Objektbild (`MacherAsset`, `docs/design/visual-assets.md`) vorgesehen ist, bleibt das Foto; das Glas-Icon
  ist die Form für alle übrigen Themen
- Mega-Menü: Icons nur an den Einträgen, nicht zusätzlich an den Gruppenüberschriften (keine doppelten Motive)
- Bedien-Icons (Pfeile, Schließen, Menü, Plus im Button, Haken im Button, Status) und alles unter 32 px bleiben
  Strich-Icons in Textfarbe – ebenso die Sidebar-Navigation
- Neue Motive in `glas.tsx` ergänzen und in den Zuordnungen (`IconTile` bzw. `glasFuer`) eintragen

### Themen-Icon-Kacheln (abgelöst durch Glas-Icons – gilt nur noch für Strich-Icons ohne Glas-Motiv)
Helles Akzentgrün `#69AF44` als Fläche, Icon in **weißen Linien** (1,75 px), quadratisch, 4–6 px Radius, 36–48 px.
Immer mit Textlabel daneben (Weiß auf `#69AF44` hat nur ca. 2,7:1 – das Icon allein darf keine Information tragen).

- Website: Utility `icon-kachel` (`src/app/globals.css`)
- Software: Tokens `--mm-icon-tile` / `--mm-on-icon-tile`; Klassen `.mm-modulkachel-icon`, `.mm-modulzeile-icon`,
  `.mm-auswahlkarte-icon`, `.mm-leer-icon`

- Sidebar (Software): Der aktive Hauptbereich zeigt sein Icon als Kachel (32 px, weißes Icon auf `#69AF44`)
  und das Label fett – kein Zeilen-Hintergrund, kein Randstreifen. Inaktive Icons bleiben ohne Kachel in Textfarbe.

Funktionale Icons (Pfeile, Schließen, Menü, Status) bleiben in Textfarbe ohne Kachel.

### Wechsler (Segmente) (abgelöst – heller Umschalter, UX-Spezifikation 5.2)
Dunkle Leiste `#1C2619`, Segmente ohne Trennlinien, aktives Segment Markengrün `#2F9250`, alle Labels weiß.
Inaktiv beim Hover: Weiß mit 8 % Deckkraft. Fokus: 2-px-Ring in Akzentgrün innerhalb des Segments. Höhe 44 px.
Optional Flagge oder Icon vor dem Label (Vorbild: Länderwahl Deutschland · Österreich · Schweiz).

- Website: `Umschalter` in `src/components/werkzeuge/felder.tsx`
- Software: `Segmente` (`.mm-segmente`, `.mm-segment--an`), Tokens `--mm-switch-*`

### Navigation: vier Bereiche, höchstens drei Favoriten
Die Seitennavigation ist **flach**. Jeder Eintrag führt mit einem Klick zum Ziel – keine aufklappenden
Unterpunkte, keine zweite Ebene unter den Bereichen. Die Zielstruktur steht in [`docs/produkt/navigation.md`](../produkt/navigation.md).

- **Fest:** nur die vier Bereiche Heute · Aufträge · Planen · Betrieb.
- **Betrieb ist das Modulverzeichnis:** vier Kacheln, darunter alle Module, die der Nutzer sehen darf, mit Suchfeld
  „Modul finden“. Kein fünfter Menüpunkt. (`/betrieb/module` leitet auf `/betrieb` weiter.)
- **Favoriten:** Im Verzeichnis markiert man bis zu **drei** Module mit dem Stern. Sie stehen unter den vier Bereichen
  in der Seitenleiste – flach, ein Klick. Ohne Favoriten steht dort ein kurzer Hinweis mit Link zu Betrieb.
- **Persönlich:** Favoriten speichert jeder Nutzer für sich (Einstellung `navigation.favoriten.<mitarbeiterId>`).
  Module, die eine Rolle nicht sehen darf, erscheinen auch nicht als Favorit. Zum Start bekommt jede Rolle drei
  Favoriten (`STANDARD_FAVORITEN`), bis der Nutzer sie selbst ändert.
- **Mobil:** Die untere Leiste bleibt bei den vier Bereichen. Favoriten stehen im Profilmenü (oben rechts).

- Software: `Favoriten` in `src/os/shell/Shell.tsx`, Verzeichnis in `src/os/shell/Betrieb.tsx`,
  Daten über `modulVerzeichnis()` (`struktur.ts`) und `useFavoriten()` (`src/os/shell/favoriten.ts`).

## Orientierungsbeispiele von Mission Mittelstand

Vom Auftraggeber als Referenz geliefert. Nicht 1:1 kopieren, sondern Wirkung übernehmen.

| Muster | Beschreibung | Einsatz in macher-os |
|---|---|---|
| **Personen-Hero mit Pfeilmotiv** | Freigestellte Person vor fast schwarzer Fläche (`#0E130C`), dahinter große grüne Pfeil-/Chevron-Formen (`>`), die hinter der Person hervorkommen. Oben weißer Rand, Person ragt in den hellen Bereich. | Login, Willkommen/Onboarding, Website-Hero, Ansprechpartner-Bereiche. Nicht in Arbeitsansichten. |
| **Personenkarte** | Foto auf grüner Fläche (Markengrün), unten dunkle halbtransparente Namensleiste mit weißem Namen in Barlow 500, kleiner Radius. | Team, Ansprechpartner, Support-Kontakt, Mitarbeiterauswahl in der Planung. |
| **Logo** | Wortmarke „MISSION MITTELSTAND“ weiß in Versalien auf schwarzem Block, davor drei Quadrate: Weiß · Akzentgrün · Markengrün. | Die drei Quadrate sind ein starkes Markenzeichen – als Bildmarke/Favicon-Idee für macher-os prüfen (Freigabe klären). |
| **Hinweis-/Einwilligungsbox** | Weiße Karte, Logo zentriert, kurzer zentrierter Text, grüner unterstrichener Link, Button in Markengrün. | Leere Zustände, Einwilligungen, „Funktion noch nicht freigeschaltet“. |
| **Kundenstimme** | Hellgraue Karte, kleines Logo, Name + grauer Ortschip, Zitat fett in Anführungszeichen. | Website-Kundenstimmen (nur echte Zitate). |
| **FAQ-Akkordeon dunkel** | Sehr dunkler Hintergrund, Fragen als einzelne dunkelgrüne Panels (ca. `#1E2B26`), 8 px Radius, 8 px Abstand, links Fragezeichen-Icon in Kreis, rechts Chevron, weiße Schrift. | FAQ auf dunklen Website-Abschnitten, Hilfe-Center. In der Software helle Variante. |
| **Statement in Versalien** | Barlow 600–700 in Versalien, weiß auf `#0E130C`, einzelne Schlüsselwörter in Akzentgrün `#69AF44` („ACHTUNG:“, „EXTREM PRAXISORIENTIERTE“). | Website-Abschnitte und Einstiege. Nie in Formularen, Tabellen oder Arbeitsansichten. |
| **Bildkarten-Reihe** | Dunkler Abschnitt, Versalien-Headline mit grünem Anfang („DAS ERWARTET DICH“ in Akzentgrün, Rest weiß). Darunter 4 Fotos nebeneinander (grüne Lichtstimmung, echte Veranstaltungen), ohne Radius; darunter Titel in Akzentgrün, Versalien, Barlow 400–500, und ein kurzer weißer Satz. | Website: „So läuft's“, Leistungen, Ablauf. Nur echte Fotos. |
| **Event-/Bereichskarten hochkant** | Hochformat, dunkelgrüner Verlauf, der unten in Markengrün aufhellt; 1-px-Kontur in Grün; weißes Symbol oben links; kleines Datum in Grün; großer weißer Titel in Versalien unten; Pfeil ↗ unten rechts (dort in Kampagnenorange). Dahinter riesige Hintergrund-Headline („EVENTS“), unten weich ausgeblendet. | Website: Einstieg in Bereiche/Gewerke, Webinare. In macher-os Pfeil in Akzentgrün statt Orange, außer bei Kampagnen. |
| **Slider-Karte über Foto** | Abgedunkeltes Vollbildfoto, darauf dunkle Karte (8 px Radius, feine grüne Kontur) mit Bild links und Text rechts: Titel in Markengrün, weißer Text. Navigation: zwei quadratische grüne Buttons ‹ › direkt aneinander, mit weißem Rahmen. | Website: Kundenstimmen, Referenzen. In der Software keine automatischen Slider. |
| **Dunkler CTA-Abschnitt** | Fast schwarz; links Oberzeile in Grün (Poppins, Versalien); rechts weiße Headline Barlow 700 in normaler Schreibweise, darunter kleiner Text in Grün, darunter breiter grüner Button. Paginierung als kleine Punkte, Vor/Zurück als runde weiße Buttons mit dunklem Pfeil. | Website: `FinalCta`, Abschlussabschnitte. Kleiner grüner Text auf Dunkel mindestens Markengrün (ca. 4,8:1), besser Weiß 80 %. |

Hinweis: Das FAQ-Beispiel verwendet eine Serifenschrift aus einer Kampagnenseite. Für macher-os bleibt Barlow verbindlich.
