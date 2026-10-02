# Fotos der Marketing-Website

Die Website nutzt viele Fotos im Stil von mission-mittelstand.de: dunkle Foto-Heroes mit Pfeilmotiv,
Bildkarten-Reihen und Gewerk-Karten im Hochformat. Alle Fotos sind in
[`src/content/bilder.ts`](../../src/content/bilder.ts) registriert und werden nur über ihren Schlüssel eingebunden
(`<Foto bild="gewerk/elektriker" />`).

**Solange eine Datei fehlt**, zeigt die Website eine ruhige dunkle Fläche mit einem Linienicon als zeitweiligen Ersatz –
keine Pfeilgrafik, die wie ein Foto wirkt (UX-Spezifikation 7.3/9.2). Heros, Abschluss-CTA und Bild-Text-Abschnitte
lassen die Bildfläche ganz weg, bis das Foto da ist. Im Entwicklungsserver steht oben links der erwartete Dateipfad.
Sobald die Datei unter `public/` liegt, erscheint beim nächsten Build automatisch das Foto.

**Stand Oktober 2026 vorhanden:** die acht Gewerk-Fotos (`gewerke/<gewerk>.jpg`) plus `metall-maschinen` und
`weitere-gewerke`, Team- und Personenfotos von Mission Mittelstand, das Werkstattfoto der Einrichtung
(`os/werkstatt.webp`) sowie zwei aus echten Seiten erzeugte Menü-Vorschauen (`vorschau/einsatz.webp`,
`vorschau/vorlage-baustellenabnahme.webp`, Skript `scripts/ux/vorschaubilder.mjs`). Alle übrigen Dateien unten fehlen noch.

## Regeln

- Echte Arbeitssituationen im Handwerk. Keine gestellten Büro-Stockfotos, keine lila/blauen KI-Bilder.
- Keine Stockfotos als Ansprechpartner oder als „Kunde“. Kundenstories zeigen Symbolbilder aus ihrem Gewerk
  und sind als „Symbolbild“ gekennzeichnet.
- Querformat, mindestens 2000 px breit, JPG mit ca. 80 % Qualität. Hauptmotiv eher rechts
  (links liegt im Hero der Text). Gewerk-Fotos werden auch hochkant (3:4) zugeschnitten – Motiv mittig.
- Lizenz klären und hier vermerken (eigene Fotos, Unsplash-Lizenz o. Ä.).

## Benötigte Fotos

| Datei | Motiv |
|---|---|
| `public/bilder/start/hero.jpg` | Handwerker in Arbeitskleidung auf einer Baustelle, Handy in der Hand, Blick aufs Display. Platz für Text links. |
| `public/bilder/alltag/anfrage.jpg` | Meister sitzt im Transporter oder in der Werkstatt und telefoniert, Notizblock daneben. |
| `public/bilder/alltag/planung.jpg` | Morgendliche Besprechung: drei, vier Leute am offenen Transporter, einer zeigt auf Tablet oder Plan. |
| `public/bilder/alltag/baustelle.jpg` | Monteur fotografiert eine fertige Installation mit dem Handy. |
| `public/bilder/alltag/abnahme.jpg` | Übergabe beim Kunden: Kundin unterschreibt auf einem Tablet, Handwerker daneben. |
| `public/bilder/alltag/buero.jpg` | Kleines Büro im Betrieb, Laptop, ein paar Ordner, Blick in die Werkstatt. |
| `public/bilder/alltag/werkstatt.jpg` | Werkstatt mit Werkzeugwand und Werkbank, warmes Licht. |
| `public/bilder/alltag/handy.jpg` | Nahaufnahme: Hand im Arbeitshandschuh hält ein Handy, Baustelle unscharf im Hintergrund. |
| `public/bilder/alltag/team.jpg` | Kleines Team (4–6 Leute) vor Firmenwagen oder Halle, natürlich, nicht gestellt. |
| `public/bilder/seite/funktionen.jpg` | Chef am Laptop in der Werkstatt, plant die Woche. |
| `public/bilder/seite/kunden.jpg` | Betrieb bei der Arbeit, mehrere Leute, echte Baustelle. |
| `public/bilder/seite/ueber-uns.jpg` | Gespräch in einer Werkstatt: Handwerker zeigt etwas auf dem Laptop. |
| `public/bilder/seite/karriere.jpg` | Team am Tisch, Laptops, Skizzen, entspannte Stimmung. |
| `public/bilder/seite/partner.jpg` | Handschlag auf der Baustelle oder in der Werkstatt. |
| `public/bilder/seite/gewerke.jpg` | Baustelle mit mehreren Gewerken gleichzeitig: Elektro, Trockenbau, Maler. |
| `public/bilder/seite/cta.jpg` | Feierabend: Handwerker schließt den Transporter, Abendlicht. |
| `public/bilder/gewerke/elektriker.jpg` | Elektriker verdrahtet einen Verteilerschrank |
| `public/bilder/gewerke/elektriker-alltag.jpg` | Elektriker prüft eine Anlage mit dem Messgerät |
| `public/bilder/gewerke/elektriker-detail.jpg` | Nahaufnahme: Hände klemmen Leitungen im Verteiler |
| `public/bilder/gewerke/shk.jpg` | Anlagenmechaniker arbeitet an einer Heizungsanlage |
| `public/bilder/gewerke/shk-alltag.jpg` | Installateur montiert ein Waschbecken im Bad |
| `public/bilder/gewerke/shk-detail.jpg` | Nahaufnahme: Rohrverbindung mit Zange |
| `public/bilder/gewerke/maler.jpg` | Maler streicht eine Wand mit der Rolle |
| `public/bilder/gewerke/maler-alltag.jpg` | Malerteam klebt einen Raum ab |
| `public/bilder/gewerke/maler-detail.jpg` | Nahaufnahme: Pinsel an einer Kante |
| `public/bilder/gewerke/fliesenleger.jpg` | Fliesenleger verlegt große Bodenfliesen |
| `public/bilder/gewerke/fliesenleger-alltag.jpg` | Fliesenleger verfugt eine Wand im Bad |
| `public/bilder/gewerke/fliesenleger-detail.jpg` | Nahaufnahme: Fliese wird mit Kelle ausgerichtet |
| `public/bilder/gewerke/tischler.jpg` | Tischler arbeitet an der Hobelbank in der Werkstatt |
| `public/bilder/gewerke/tischler-alltag.jpg` | Tischler montiert eine Einbauküche beim Kunden |
| `public/bilder/gewerke/tischler-detail.jpg` | Nahaufnahme: Holzverbindung und Werkzeug |
| `public/bilder/gewerke/dachdecker.jpg` | Dachdecker deckt ein Steildach mit Ziegeln |
| `public/bilder/gewerke/dachdecker-alltag.jpg` | Dachdecker sichert sich auf dem Dach |
| `public/bilder/gewerke/dachdecker-detail.jpg` | Nahaufnahme: Ziegelreihe und Lattung |
| `public/bilder/gewerke/bau.jpg` | Maurer setzt Steine auf der Rohbaustelle |
| `public/bilder/gewerke/bau-alltag.jpg` | Bauteam bespricht den Plan auf der Baustelle |
| `public/bilder/gewerke/bau-detail.jpg` | Nahaufnahme: Kelle und Mörtel |
| `public/bilder/gewerke/galabau.jpg` | Landschaftsgärtner pflastert einen Weg |
| `public/bilder/gewerke/galabau-alltag.jpg` | GaLaBau-Team legt einen Garten an |
| `public/bilder/gewerke/galabau-detail.jpg` | Nahaufnahme: Pflastersteine und Gummihammer |
| `public/bilder/gewerke/elektro-energie.jpg` | Montage einer Photovoltaikanlage auf dem Dach |
| `public/bilder/gewerke/shk-gebaeudetechnik.jpg` | Heizungsraum mit Rohren, Pumpen und Ventilen |
| `public/bilder/gewerke/maler-boden-oberflaechen.jpg` | Bodenleger verlegt einen neuen Bodenbelag |
| `public/bilder/gewerke/holz-innenausbau.jpg` | Holzoberfläche wird mit einem Schleifer bearbeitet |
| `public/bilder/gewerke/dach-gebaeudehuelle.jpg` | Dachdecker trägt Schindeln über ein Dach |
| `public/bilder/gewerke/bau-rohbau.jpg` | Bauarbeiter auf einer Rohbaudecke mit Bewehrung |
| `public/bilder/gewerke/metall-maschinen.jpg` | Metallbauer schweißt ein Geländer |
| `public/bilder/gewerke/fahrzeug-werkstatt.jpg` | Mechaniker wechselt einen Reifen in der Werkstatt |
| `public/bilder/gewerke/garten-aussenanlagen.jpg` | Pflastersteine werden verlegt |
| `public/bilder/gewerke/gebaeude-service.jpg` | Reinigungskraft wischt einen Flur |
| `public/bilder/gewerke/glas-fenster-sonnenschutz.jpg` | Neu eingebautes Fenster auf einer Baustelle |
| `public/bilder/gewerke/friseur-dienstleistungen.jpg` | Friseurin föhnt einer Kundin die Haare |
| `public/bilder/gewerke/lebensmittelhandwerk.jpg` | Bäcker formt Teiglinge auf der Arbeitsfläche |
| `public/bilder/gewerke/gesundheitshandwerk.jpg` | Brillenfassungen in einem Optikergeschäft |
| `public/bilder/gewerke/textil-gestaltung-werbetechnik.jpg` | Siebdruckrahmen in einer Werkstatt |
| `public/bilder/gewerke/weitere-gewerke.jpg` | Werkbank mit verschiedenem Werkzeug |
