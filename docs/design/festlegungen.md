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
- In der Software stehen statt Objektfotos seit Oktober 2026 Fenster-Skizzen (siehe „Fenster-Skizze“); auf der Website
  bleiben Objektfotos (`Objekt`). Das Glas-Icon ist die Form für alle übrigen Themen
- Mega-Menü: Icons nur an den Einträgen, nicht zusätzlich an den Gruppenüberschriften (keine doppelten Motive)
- Bedien-Icons (Pfeile, Schließen, Menü, Plus im Button, Haken im Button, Status) und alles unter 24 px bleiben
  Strich-Icons in Textfarbe
- **Navigation (Software, Oktober 2026):** Seitenleiste, Benachrichtigungen, untere Leiste am Handy und Monteur-Tabs
  zeigen Glas-Icons (28 px), die Favoriten 24 px – immer mit Text daneben. Suchen, Leiste einklappen und Menüs bleiben
  Strich-Icons
- Neue Motive in `glas.tsx` ergänzen und in den Zuordnungen (`IconTile` bzw. `glasFuer`) eintragen

### Skizzen und UI-Ebenen für Funktionen (Oktober 2026)
Wo eine Karte eine **Funktion kurz erklärt**, steht oben eine abstrakte Zeichnung statt Icon oder Foto – nach den kleinen
Prozess-Illustrationen von Mission Mittelstand (ruhiger Grüngrauton). Zwei Formen, je Raster nur eine davon:

- **Skizze** (`Skizze`, `src/components/ui/Skizze.tsx`): Fläche `sand`, drei aufgefächerte weiße Blätter mit grauen
  Platzhalterlinien, vorne ein Blatt, das die Funktion andeutet (Angebot mit Unterschrift, Kalender, Plantafel, Lager …),
  unten mittig eine grüne Plakette (Aktionsgrün, weißes Strich-Icon – das Icon, das die Karte vorher hatte).
  Ein Motiv je Funktion (Schlüssel = Slug aus `src/content/registry.ts`); neue Funktion → neues Motiv in `Skizze.tsx`.
  Dazu Zusatzmotive: **Handy-Form** für App-Themen (vorne ein Handy statt Blatt: Einsätze, Unterwegs, Vor Ort,
  Abschluss, Kamera, Sprache, Navigation, Kontakte), die Grundsätze von „Macher erledigt“ (Freigabe, Stufen, Verlauf,
  Ehrlich) und die Quellen beim Daten übernehmen (Dokumente, Tabelle, Software-Export, Datanorm).
  Im Einsatz: `FunktionKarte` (Übersicht, Verwandte Funktionen), Funktionskarten der Rechner, App-Seite,
  „Automatisch heißt nicht: ohne dich“, Daten übernehmen. In Karten über `Card` mit `skizze`.
- **UI-Ebene** (`UiEbene`, `UiZeile`, `UiStatus`, `src/components/ui/UiEbene.tsx`): ein kleiner Ausschnitt aus Handwerk OS
  mit echten Beschriftungen und Beispieldaten, auf derselben Fläche, unten angeschnitten, dahinter eine zweite Ebene.
  Für zwei bis vier Ergebnisse, die ein konkreter Stand besser belegt als eine Zeichnung (Startseite „Feierabend statt
  Papierkram“). Immer mit „Beispiel“ markiert, Status immer als Text.

Gemeinsam: 4:3 (Skizze) bzw. Höhe nach Inhalt (UI-Ebene), 12 px Radius, rein dekorativ (`aria-hidden`) – die Aussage
steht im Kartentitel und Text. Nur Tokens (`sand`, `line`, `muted`, `primary`, `signal-soft`), keine Fotos, kein Glas.
Beim Hover der Karte fächern die Blätter leicht auf bzw. hebt sich die Ebene (150 ms, nur ohne `prefers-reduced-motion`).
Objektfotos (`Objekt`) bleiben für Bereiche und Einstiege, Glas-Icons für Themen in Listen.

**Nachtrag Oktober 2026 – UI-Ebenen zum Ausprobieren.** Jeder Ausschnitt aus Handwerk OS auf der Website ist interaktiv:
Ein Klick tut, was er in der Software tut (freigeben, senden, Vorschlag übernehmen, Konflikt lösen, abhaken, Zeit
starten), danach eine kurze Bestätigung und „Von vorn“. Aussehen nach dem aktuellen Stand der Software: beiges Canvas
(`app-canvas`, `app-ruhig`, `app-linie`), aufgelegte Flächen (`.app-lift`), Dringend rot, Überfällig gelb, Typ-Icons,
Kundenbild mit Initialen, KI-Leiste mit Kugel (`.ki-kugel`, `.ki-leiste`) nur im Suchen-und-Fragen-Fenster.
Bausteine: `UiEbeneAktiv` (statt `UiEbene`), `AlltagMinis.tsx` („So läuft's“), `ReihenAnsichten.tsx` (Reihe „Alles da“),
`PhoneMock`, `PlanBoardMock`, `AppVorschau`. Interaktive Ausschnitte sind Gruppen mit Namen („… zum Ausprobieren
(Beispiel)“), nicht `aria-hidden`; sie liegen über dem Link der Karte (`z-10`), der Titel führt weiter.
Nichts wird gespeichert, alle Daten sind als „Beispiel“ markiert, keine erfundenen Kennzahlen.

### Fenster-Skizze (Oktober 2026 – Website und Software)
Feines Drahtgitter eines App-Fensters (Titelleiste, Seitenspalte; alternativ ein Handy-Umriss), das nach unten weich
ausläuft, in der Mitte eine App-Kachel mit Glas-Icon. **Ohne Farbe:** Auch das Glas-Icon ist grau (aus der Textfarbe
gemischt, auf Dunkel hellgrau), damit sich die Zeichnung klar von den grünen Themen- und Navigations-Icons abhebt. Linien und Kachel in `currentColor`
mit geringer Deckkraft: hell auf der ruhigen Fläche (`sand` / `--mm-surface-subtle`), dunkel direkt auf dunklen Karten
(`karte-dunkel`). Keine Daten, kein Text in der Skizze – Titel und Text der Karte tragen die Bedeutung.

- Einsatz: Einstiege und Teaser – erste Schritte, Schnittstellen, Hilfe-Einstiege, „Geplant“/„Kommt bald“,
  einzelne dunkle Karten. Nie in Listen, Tabellen, Formularen oder hinter Daten.
- **Mittig:** Die Skizze steht immer mittig. Folgt nur kurzer Einstiegstext (Titel, ein, zwei Sätze, eine Aktion), ist auch
  der Text zentriert (Software `.mm-einstieg`, Website `Card` mit `fenster` automatisch). Folgen Listen, Formulare oder
  Daten, bleibt der Text linksbündig.
- Abgrenzung: Die **Skizze** erklärt, was eine Funktion tut (Inhalt angedeutet). Die **Fenster-Skizze** zeigt nur,
  *wo* etwas sitzt bzw. dass es dazukommt (ein Thema, ein Icon). Je Raster nur eine Form.
- **Integrationen mit Marke** (Google Kalender, Outlook, DATEV …): Statt des grauen Glas-Icons steht das echte Logo in
  Farbe auf einer weißen Kachel (`FensterSkizze logo=…`, Logos aus `public/logos/integrationen/`). Formate ohne Logo behalten das Icon.
- Gemeinsame Quelle: `src/os/ui/fenster.tsx` (`FensterSkizze`, Glas-Icon-Name). Website: `Fenster`
  (`src/components/ui/Fenster.tsx`, Strich-Icon-Name, `ton="hell" | "dunkel"`), `Card` mit `fenster`, Landingseiten
  über `vorteile.bild: "fenster"`. Software: `<span className="mm-fenster"><FensterSkizze … /></span>`
  (`ui.css`), nebeneinander mit Text über `.mm-fenster-teaser`.
- **Statt Objektfotos (Software):** Die vier Türen unter Betrieb und die Widget-Köpfe im Home zeigen `SkizzenKachel`
  (Nah-Ausschnitt in fester Größe wie früher `MacherAsset`: 56 × 42 / 96 × 72 / 192 × 144). `Leer` zeigt bei allen
  früheren Foto-Themen (`LEER_OBJEKT`) automatisch die Fenster-Skizze; ein Foto nur noch über `objekt`.
- **Nah-Ausschnitt:** `ausschnitt="nah"` – enger 4:3-Ausschnitt um die Kachel, Kachel 25 % größer, Linien kräftiger.
- **Leerzustände (Software):** `Leer` mit `skizze` (true = Glas-Icon zu `icon`, oder ein Glas-Name; optional
  `rahmen="handy"`) zeigt die Fenster-Skizze statt Foto/Icon – nur beim ersten Start einer Ansicht („Noch keine
  Rechnung“, „Noch kein Webhook“). Suche ohne Treffer, fehlende Rechte und „gibt es nicht (mehr)“ bleiben schlicht;
  Leerzustände mit passendem Objektfoto behalten das Foto.
- Im Einsatz, Website: `/schnittstellen` (Heute verfügbar), `/hilfe` (vier Einstiege), `/app` (iPhone/Android,
  Handy-Rahmen), Daten übernehmen (selbst / persönlich), Startseite (Blog-Kachel im Wissen-Bento, dunkel),
  `/wissen`, Akademie (Lernbereiche, Schulungen dunkel), `/werkzeuge`, Demo „Lieber persönlich?“ (dunkel).
- Im Einsatz, Software: Start „Was möchtest du als Erstes erledigen?“, Schnittstellen (alle Verbindungen und Dialog),
  DATEV „Unternehmen online – Geplant“, Macher fragen (erster Start), Konto (nur auf diesem Gerät, „Das passiert
  dabei“), Einladung, Spielwiese, „schon eingerichtet“, Buchungslink, Daten übernehmen (Datensicherung, Import-Schritt 1,
  Datanorm beim Artikel-Import), Lesemodus-Dialog, Kundenbereich ohne Link, Home („Dein nächster Schritt“ während der
  Einrichtung, Ansprechpartner-Ausweich), Notfall-Start und rund 40 Leerzustände beim ersten Start.

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
