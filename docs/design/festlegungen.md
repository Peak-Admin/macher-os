# macher-os – Design-Festlegungen

Ergänzt das [Brand & Software Design Playbook](brand-playbook.md). Bei Widerspruch gilt diese Datei,
weil sie jüngere, ausdrücklich bestätigte Entscheidungen enthält.

## Bestätigte Bausteine

### Primärbutton
Tiefes CTA-Grün `#06480C`, weiße Schrift Barlow 600, 4 px Radius, leichter Schatten erlaubt beim großen Einstiegs-CTA.
Vorbild: Startseiten-CTA „Jetzt Erstgespräch buchen“ (optional mit kleinem Personenbild links).

- Website: `bg-signal text-white hover:bg-signal-dark`
- Software: `.mm-btn--primaer` (`--mm-action`)

### Themen-Icon-Kacheln
Helles Akzentgrün `#69AF44` als Fläche, Icon in **weißen Linien** (1,75 px), quadratisch, 4–6 px Radius, 36–48 px.
Immer mit Textlabel daneben (Weiß auf `#69AF44` hat nur ca. 2,7:1 – das Icon allein darf keine Information tragen).

- Website: Utility `icon-kachel` (`src/app/globals.css`)
- Software: Tokens `--mm-icon-tile` / `--mm-on-icon-tile`; Klassen `.mm-modulkachel-icon`, `.mm-modulzeile-icon`,
  `.mm-auswahlkarte-icon`, `.mm-leer-icon`

Funktionale Icons (Pfeile, Schließen, Menü, Status) bleiben in Textfarbe ohne Kachel.

### Wechsler (Segmente)
Dunkle Leiste `#1C2619`, Segmente ohne Trennlinien, aktives Segment Markengrün `#2F9250`, alle Labels weiß.
Inaktiv beim Hover: Weiß mit 8 % Deckkraft. Fokus: 2-px-Ring in Akzentgrün innerhalb des Segments. Höhe 44 px.
Optional Flagge oder Icon vor dem Label (Vorbild: Länderwahl Deutschland · Österreich · Schweiz).

- Website: `Umschalter` in `src/components/werkzeuge/felder.tsx`
- Software: `Segmente` (`.mm-segmente`, `.mm-segment--an`), Tokens `--mm-switch-*`

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

Hinweis: Das FAQ-Beispiel verwendet eine Serifenschrift aus einer Kampagnenseite. Für macher-os bleibt Barlow verbindlich.
