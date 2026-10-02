# Mission Mittelstand
## Brand & Software Design Playbook

**Version 1.0 · Referenzstand: 2. Oktober 2026 · Sprache: Deutsch**

Dieses Playbook übersetzt das öffentlich sichtbare Erscheinungsbild von Mission Mittelstand in eine konkrete Gestaltungsgrundlage für eine gemeinsam entwickelte Software. Das Ziel ist eine sofort erkennbare Zugehörigkeit zur Marke: in Schrift, Farbe, Form, Sprache und Benutzerführung.

**Gestalterischer Leitsatz:** Eine entschlossene, persönliche Arbeitsumgebung für Unternehmer. Klare Orientierung, sichtbarer Fortschritt und ein nächster Schritt, der leicht fällt.

Das Dokument ist eine aus der Website rekonstruierte Arbeitsgrundlage, kein von Mission Mittelstand herausgegebenes Corporate-Design-Handbuch. Die Website zeigt mehrere Gestaltungsvarianten. Deshalb legt dieses Playbook eine nachvollziehbare Priorität fest: aktueller Hauptauftritt → softwareähnliche Elemente und KI-Check → wiederkehrende Unterseitenmuster → einzelne Kampagnen.

### Schnellstart für Design und Entwicklung

Zuerst Abschnitte **2–5** für Markengefühl, Farben und Schrift lesen. Für konkrete Oberflächen **6–11** verwenden. Abschnitt **14** enthält die Start-Tokens, Abschnitt **16** die Abnahmecheckliste. Das vollständige Seitenregister folgt am Ende.

**Fünf Festlegungen für den ersten Entwurf:** Barlow als Hauptschrift; originale Grünwerte; helle Arbeitsflächen; kleine Radien; direkte, hilfreiche Du-Ansprache. Die Mini-Oberflächen der Startseite und der KI-Check sind die wichtigsten Produktreferenzen.

---

## 1. Leseschlüssel und Untersuchungsumfang

Drei Kennzeichnungen verhindern, dass Beobachtung und Entwurf verwechselt werden:

- **[B] Beobachtet:** unmittelbar im gerenderten Browser gesehen.
- **[M] Gemessen:** im ausgelieferten HTML/CSS oder in berechneten Browserstilen nachgewiesen. CSS allein belegt nicht, dass eine Regel auf jeder Seite sichtbar eingesetzt wird.
- **[S] Software-Regel:** bewusste Ableitung für die neue Anwendung; keine Behauptung über eine bestehende Mission-Mittelstand-Software.

### Abdeckung

Die [öffentliche Sitemap](https://www.mission-mittelstand.de/sitemap.xml) enthält **227 URLs**. Alle wurden als HTML abgerufen; zusätzlich die im Footer verlinkte Datenschutzseite. Diese **228 Seiten lieferten HTTP 200**. Vier weitere intern gefundene URLs wurden geprüft: drei Weiterleitungen und ein 404. Das vollständige Register mit Prüfstatus steht im Anhang.

**30 unterschiedliche Seiten wurden zusätzlich visuell stichprobenartig geprüft**, überwiegend in einer Desktopansicht mit 1440 × 1000 CSS-Pixeln. Startseite und KI-Check wurden außerdem bei 390 × 844 geprüft; die Startseite zunächst auch bei 975 Pixeln Breite. Schrift- und Komponentenwerte wurden gezielt im Browser gemessen.

„Alle Seiten“ bedeutet hier: vollständige Erfassung der auffindbaren öffentlichen Sitemap-Seiten plus ergänzende interne Links, Zuordnung zu Gestaltungsfamilien und visuelle Prüfung repräsentativer Seiten. Es bedeutet **keine vollständige Prüfung jedes Scrollabschnitts, jeder Animation und jedes Interaktionszustands aller 228 Seiten**. Nicht verlinkte Kampagnen, geschützte Mitgliederbereiche, fremde Domains und eingebettete Drittanbieter-Anwendungen sind nicht vollständig erfasst.

Medien und Formulare waren teilweise beim Laden oder durch die Cookie-Einstellung eingeschränkt. Graue Medienplatzhalter, kurz sichtbare Beispiel-Inhaltsverzeichnisse und Ladezustände werden deshalb nicht als beabsichtigte Markenmerkmale gewertet. Es wurden keine Formulare abgeschickt oder Buchungen ausgelöst.

### Welche Referenzen bei Entscheidungen Vorrang haben

| Priorität | Referenz | Bedeutung für die Software |
|---|---|---|
| 1 | [Startseite](https://www.mission-mittelstand.de/) | Aktuelle Markenwirkung, Schrift, Farben, kleine CRM-/Prozess-/KI-Ansichten |
| 2 | [KI-Check](https://www.mission-mittelstand.de/ki-check) | Geführte Eingaben, Auswahlkarten, klare schrittweise Orientierung |
| 3 | [Beratung](https://www.mission-mittelstand.de/beratung), [Unternehmertraining](https://www.mission-mittelstand.de/beratung/unternehmertraining) | Verbindung aus Kompetenz, Nähe und Umsetzung |
| 4 | [Über uns](https://www.mission-mittelstand.de/ueber-uns/mission-mittelstand), [Teamwerte](https://www.mission-mittelstand.de/ueber-uns/teamwerte) | Markengeometrie, Selbstverständnis, Zusammenarbeit |
| 5 | [Ressourcen](https://www.mission-mittelstand.de/ressourcen), [Blog](https://www.mission-mittelstand.de/blog), [Branchen](https://www.mission-mittelstand.de/branchen) | Informationsarchitektur, Wissenskarten, Filter und Lesebereiche |
| Ergänzend | Kampagnen, Finanzangebot, Online-Trainings, Events | Kontextbezogene Varianten; kein ungeprüfter Standard für den gesamten Produktbereich |

---

## 2. Brand Feeling: Wie sich Mission Mittelstand anfühlt

### 2.1 Markencharakter

**[B] Unternehmerisch, direkt, ambitioniert, gemeinschaftlich und persönlich.** Die Website spricht Betriebsinhaber an, stellt konkrete betriebliche Herausforderungen in den Vordergrund und verbindet wirtschaftliche Verbesserung mit mehr Handlungsfreiheit. Menschen, Betriebe, Team und gemeinsame Veranstaltungen sind tragende Motive. Technik wird über ihren praktischen Nutzen erklärt. Quellen: [Beratung](https://www.mission-mittelstand.de/beratung), [Mission](https://www.mission-mittelstand.de/ueber-uns/mission-mittelstand), [Team](https://www.mission-mittelstand.de/ueber-uns/team).

| Dimension | Markenwirkung | Konsequenz für das Produkt [S] |
|---|---|---|
| Kompetenz | Erfahrene Ansprechpartner und konkrete Methoden | Verlässliche Zustände, verständliche Zahlen, nachvollziehbare Empfehlungen |
| Tatkraft | Entscheidungen und Umsetzung stehen im Vordergrund | Jede Hauptansicht führt zu einer sinnvollen Handlung |
| Nähe | Direkte Ansprache, sichtbare Menschen, gemeinsamer Weg | Persönliche, kurze Hilfetexte; Ansprechpartner dort, wo sie helfen |
| Ordnung | Prozesse, Führung und Systeme als Entlastung | Klare Hierarchie, Verantwortliche, Termine und nächste Schritte |
| Ambition | Wachstum und unternehmerische Entwicklung | Ziele und Fortschritt sichtbar, ohne erfundene Erfolgsversprechen |
| Gemeinschaft | Zugehörigkeit zu einem Unternehmernetzwerk | Teamkontext und echte Zusammenarbeit verständlich darstellen |
| Bodenständigkeit | Betriebliche Alltagssprache | Bekannte Begriffe, konkrete Verben, wenige technische Fremdwörter |

### 2.2 Das gewünschte Nutzergefühl

**[S] Nach wenigen Sekunden:** „Ich bin bei Mission Mittelstand. Ich sehe, was wichtig ist. Ich weiß, was ich als Nächstes tun kann.“

**[S] Nach einer Arbeitseinheit:** „Ich habe etwas erledigt, Klarheit gewonnen oder einen Ablauf vereinfacht.“

**[S] Bei Schwierigkeiten:** „Das System sagt mir verständlich, was passiert ist, und hilft mir weiter.“

### 2.3 Markenmerkmale mit höchster Wiedererkennung

1. **Barlow als prägende Schrift** — besonders ihre kräftigen, kompakten Überschriften.
2. **Das vorhandene Grünsystem** — mittleres Markengrün, helleres Akzentgrün, sehr dunkles Grün.
3. **Weiß und kühles Hellgrau als Arbeitsflächen**, dunkle grünlich schwarze Kontrastbereiche.
4. **Klare rechteckige Flächen mit kleinen Radien** im Hauptauftritt.
5. **Schräge grüne Flächen und diagonale Bildüberlagerungen** als markantes Motiv auf Unterseiten.
6. **Menschen und Praxisbezug** statt rein abstrakter Technologieinszenierung.
7. **Eine direkte Du-Ansprache** mit handlungsorientierten Formulierungen.

**[S] Abnahmetest:** Auch ohne großes Logo sollte eine Kombination aus Barlow, Farbrollen, Flächenaufteilung und Tonalität die Zugehörigkeit erkennen lassen. Ein Logo auf einem beliebigen Standard-Dashboard reicht nicht.

---

## 3. Design Feeling: Die visuelle Grammatik

### 3.1 Typografische Entschlossenheit

**[B]** Große Headlines setzen ein deutliches Signal. Die Startseite verwendet eine sehr schwere Versalüberschrift mit einzelnen grünen Wörtern. Viele Inhaltsüberschriften sind leichter und in normaler Groß-/Kleinschreibung gesetzt. Kleine grüne Oberzeilen strukturieren Abschnitte.

**[S]** Diesen Kontrast erhalten: kräftige Seitentitel, ruhigere Inhaltsüberschriften, gut lesbare Fließtexte. Versalien auf kurze Markenaussagen und Oberzeilen begrenzen. Tabellen, Formulare und längere Hilfetexte in normaler Schreibweise.

### 3.2 Wechsel zwischen Offenheit und Kontrast

**[B]** Weiße und sehr helle Bereiche schaffen Übersicht. Dunkle Abschnitte geben Menschen, Aussagen und Zahlen Gewicht. Grüne Elemente lenken den Blick. Die Website ist deshalb weder durchgängig dunkel noch durchgängig grün.

**[S]** In der Software eine helle Arbeitsfläche als Ausgangspunkt verwenden. Dunkle Markenflächen gezielt für einen kompakten Überblick, einen persönlichen Einstieg oder einen Lernbereich einsetzen. Ein vollständiger Dark Mode wäre ein eigener Entwurf, kein bereits nachgewiesener Standard.

### 3.3 Form und Materialität

**[B]** Viele Hauptseiten verwenden kantige Karten mit geringer Rundung; einzelne Kampagnen haben deutlich größere Radien und pillenförmige Buttons. Schatten heben ausgewählte Inhalte und den großen Startseiten-CTA an. Grüne Iconflächen, dünne Linien und ruhige Kartenraster sorgen für Struktur.

**[S]** Für den dauerhaften Arbeitsbereich kleine Radien und überwiegend flache Flächen wählen. Größere Rundungen auf besondere Einstiege begrenzen. Die weichen Kampagnenvarianten nicht mit der sachlichen Arbeitsoberfläche vermischen.

### 3.4 Das diagonale Markenmotiv

**[M]** `.small-header_overlay` verwendet `transform: skew(-17deg)`, Markengrün und eine schwarze Überlagerung mit 30 % Deckkraft. Das erklärt den dunkleren Grünton in den schrägen Bannern; er ist kein Beleg für eine zusätzliche offizielle Grundfarbe.

**[S]** Eine solche Schräge darf in Login, Willkommen oder einer kompakten Bereichseinleitung vorkommen. Text bleibt gerade. Tabellen, Formularfelder, Modale und Navigationspunkte behalten rechtwinklige Geometrie. Quelle: [Über uns](https://www.mission-mittelstand.de/ueber-uns/mission-mittelstand), [Kontakt](https://www.mission-mittelstand.de/kontakt), gemeinsames Stylesheet in Abschnitt 17.

---

## 4. Farben: Exakte Referenzwerte und ihre Rollen

### 4.1 Nachgewiesene Palette

Die Werte stammen aus dem gemeinsamen ausgelieferten Stylesheet. Wo angegeben, wurden sie zusätzlich in berechneten Browserstilen bestätigt.

| Name im Playbook | HEX | Herkunft [M] | Einsatz |
|---|---|---|---|
| Markengrün | `#2F9250` | `--primary`; Navigation-CTA, Oberzeile, aktive Tabs | Zentrale Markenfarbe, aktive Elemente und Akzente |
| Akzentgrün | `#69AF44` | `--secondary` | Helle grüne Akzente, große Zahlen, Icons |
| Tiefes CTA-Grün | `#06480C` | `.button-eg_wrapper`; Startseiten-CTA im Browser | Besonders deutliche Hauptaktion |
| Dunkles Textgrün | `#1F6135` | `--_color-schemes---leadmagnet--accent_70` | In der Software für kleine grüne Texte und kontrastreiche Akzente nutzbar |
| Markendunkel | `#0E130C` | `--dark-grey` | Dunkle Hintergründe mit leicht grünlichem Charakter |
| Schwarz | `#000000` | `--black` | Überschriften und starke Textkontraste |
| Textgrau | `#374040` | `--dark-slate-grey` | Fließtext und sekundäre Informationen |
| Mittleres Grau | `#767676` | Rebranding-Textvariable; Hero-Absatz | Zurückgenommener Text, Kontrast je Fläche prüfen |
| Hellgraue Fläche | `#F7FAFB` | `--light-grey` | Ruhiger Hintergrund für Arbeits- und Inhaltsbereiche |
| Weiß | `#FFFFFF` | `--white` | Karten, Eingabeflächen, Text auf dunklen Flächen |
| Helle Linie | `#D9D9D9` | `--inactive-grey-on-white` | Trennlinien und zurückhaltende Rahmen |
| Dunkle Linie | `#484848` | `--inactive-grey-on-dark` | Zurückhaltende Trennung auf dunklen Flächen |
| Hover-Grau | `#EEF1F2` | `--smoke-hover` | Dezente Hervorhebung heller Elemente |
| Ruhiger Grüngrauton | `#EDF0E9` | `.intro_icon-content_container`; Browser bestätigt | Hintergründe der kleinen Prozess-/CRM-Illustrationen |
| Kampagnenorange | `#E69433` | `--dark-orange` | Angebots- und Trainingsvarianten; kein globaler Produkt-CTA |

Weitere Farben und Schriftsysteme stehen im CSS, darunter `bubora`-Variablen, Geist und ein Serif-Akzent. Ihre bloße Existenz macht sie nicht zum Kernsystem von Mission Mittelstand. Für den Produktstandard keine beliebige Mischung daraus erzeugen.

### 4.2 Farbverteilung im Arbeitsbereich [S]

Als gestalterische Orientierung: ungefähr 75–85 % helle neutrale Flächen, 10–20 % dunkle Texte beziehungsweise Markenflächen und 5–10 % sichtbare Farbakzente. Das ist eine Entwurfshilfe, keine aus Screenshots errechnete Verteilung.

Grün kennzeichnet Zugehörigkeit, aktive Auswahl und gezielte Aktionen. Ein positiver Geschäftsstatus erhält zusätzlich einen verständlichen Text und gegebenenfalls ein Symbol. Ein grüner Button bedeutet nicht automatisch, dass ein Vorgang bereits erfolgreich abgeschlossen wurde.

### 4.3 Kontrast: Markenwerte gezielt kombinieren

Lokal aus den HEX-Werten berechnete Kontraste:

| Kombination | Verhältnis, gerundet | Software-Konsequenz [S] |
|---|---:|---|
| Weiß auf `#2F9250` | 3,93:1 | Für normalen kleinen Buttontext nicht ausreichend nach dem 4,5:1-Ziel |
| Weiß auf `#06480C` | 10,82:1 | Geeignet für gut lesbare Hauptaktionen |
| Weiß auf `#1F6135` | 7,45:1 | Geeignet für kompakte grüne Buttons |
| `#2F9250` auf `#F7FAFB` | 3,74:1 | Kleine Links und Labels dunkler setzen |
| `#767676` auf Weiß | 4,54:1 | Knapp oberhalb 4,5:1; nicht zusätzlich transparent machen |
| `#767676` auf `#F7FAFB` | 4,33:1 | Für kleinen Text besser `#374040` verwenden |
| `#69AF44` auf `#0E130C` | 7,00:1 | Gut nutzbarer Akzent auf der dunklen Markenfläche |

**[S] Festlegung:** Primäre kompakte Produktbuttons erhalten `#06480C` mit weißer Schrift. Das greift einen tatsächlich verwendeten Startseiten-CTA auf. `#2F9250` bleibt die zentrale Markenfarbe für Akzente, aktive Rahmen und ausreichend große Typografie. Kleine grüne Links verwenden `#1F6135` und eine erkennbare Linkdarstellung.

Der Referenzmaßstab sind 4,5:1 für normalen Text und 3:1 für entsprechend große Schrift; dies allein ist keine vollständige Barrierefreiheitsprüfung. [W3C: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

---

## 5. Typografie

### 5.1 Schriftfamilien [M]

- **Barlow:** Hauptschrift für Fließtext, Überschriften, Buttons und viele Bedienelemente. Nachgewiesene reguläre Schnitte: 400, 500, 600, 700, 800 und 900.
- **Poppins:** ergänzende Schrift für `.tagline`, also die kleinen hervorgehobenen Oberzeilen. Auf der Startseite im Browser bestätigt.
- **Fallbacks:** `Barlow, sans-serif` sowie `Poppins, Arial, sans-serif`.

**[S]** Barlow und Poppins bewusst laden und die tatsächlichen Schnitte verwenden. Kein stiller Austausch der Hauptschrift gegen Inter, Arial oder eine Systemschrift im fertigen Produkt. Tabellen bleiben ebenfalls in Barlow; für Zahlen nach Möglichkeit tabellarische Ziffern aktivieren und die Darstellung prüfen.

### 5.2 Messwerte aus der Startseite

Desktopmessung bei 1440 Pixeln Viewportbreite, Standardschriftgröße 16 Pixel:

| Element | Familie | Größe / Zeilenhöhe | Gewicht | Laufweite |
|---|---|---|---:|---|
| Hero-H1 | Barlow | 64 / 67,2 px | 900 | −1 px |
| Abschnittstitel `.heading-style-h2` | Barlow | 48 / 48 px | 600 | −1,5 px |
| Größere H3/Kennzahl | Barlow | 36 / 36 px | 600 | −1,25 px |
| Kartentitel `.heading-style-h4` | Barlow | 28 / 28 px | 500 | −1 px |
| Standardabsatz | Barlow | 16 / 24 px | 400 | normal |
| Hero-Absatz | Barlow | 18 / 27 px | 500 | −0,25 px |
| Oberzeile `.tagline` | Poppins | 16 / 16 px | 600 | +1 px, Versalien |
| Kleiner Navigations-CTA | Barlow | 16 / 24 px | 600 | normal |
| Großer Hero-CTA-Text | Barlow | 18 / 27 px | 600 | normal |

Die H1 nutzt `clamp(2rem, 1.143rem + 4.286vw, 4rem)` und `line-height: 1.05`. Bei 390 Pixeln wurden ungefähr **35 / 36,75 px** gemessen; der Hero-Absatz wird **16 / 24 px**, die Oberzeile **14 px** groß. Diese Werte sind elementbezogene Messungen, keine universelle Skala jeder Unterseite.

### 5.3 Produktskala [S]

| Rolle | Desktop | Mobil | Gewicht / Verhalten |
|---|---|---|---|
| Markenstatement im Einstieg | 48–64 px | 32–36 px | 800–900, kurze Versalien möglich |
| Seitentitel im Arbeitsbereich | 32 / 38 px | 28 / 34 px | 700; überwiegend normale Schreibweise |
| Abschnittstitel | 24 / 30 px | 22 / 28 px | 600 |
| Kartentitel | 20 / 26 px | 20 / 26 px | 600 |
| Fließtext und Eingaben | 16 / 24 px | 16 / 24 px | 400–500 |
| Navigation und Tabellen | 14–16 / 20–24 px | 16 / 24 px | 500 |
| Feldlabel | 14 / 20 px | 14 / 20 px | 600 |
| Metadaten | 12–14 / 18–20 px | mindestens 12 / 18 px | 400–500, sparsam |
| Oberzeile | 12–14 / 18 px | 12 / 18 px | Poppins 600, +0,75–1 px |

Eng gesetzte Website-Headlines nicht pauschal auf kleine UI-Texte übertragen. Für lesereiche Inhalte ungefähr 60–75 Zeichen pro Zeile anstreben. Überschriften nicht künstlich mit festen Zeilenumbrüchen für nur eine Bildschirmbreite optimieren.

---

## 6. Layout, Abstände und Geometrie

### 6.1 Website-Messwerte [M]

- `.container-large`: maximal **85 rem / 1360 px**.
- `.navbar_container`: maximal **80 rem / 1280 px**.
- `.padding-global`: **5 % seitlicher Abstand**.
- Zentrale responsive Grenzen im Stylesheet: **991, 767 und 479 px**, außerdem Regeln ab **1440 px**.
- Beispiel einer Inhaltskarte auf der Startseite: **32 px Innenabstand**, **5 px Radius**.
- Kleine CTA-Radien: **3,2–4 px**; mehrere Mini-UI-Elemente liegen bei **4–8 px**.
- CSS definiert sowohl feste Abstände als auch fließende `clamp()`-Werte. Es gibt kein durchgehend einheitliches, vollständig bereinigtes öffentliches Designsystem.

### 6.2 Verbindliches Arbeitsraster [S]

Abstandsskala: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px**.

| Beziehung | Abstand |
|---|---:|
| Icon zu Label | 8 px |
| Feldlabel zu Eingabe | 8 px |
| Zusammengehörige Informationen | 8–12 px |
| Formularfelder untereinander | 20–24 px |
| Karteninhalt zum Rand | 24 px; mobil 16 px |
| Karten untereinander | 16–24 px |
| Seitentitel zum Inhalt | 24–32 px |
| Getrennte Hauptabschnitte | 32–48 px |

**App-Aufbau:** Desktop-Seitennavigation 240 px, obere Leiste 64 px, Inhaltsabstand 32 px, große Inhaltsbreite maximal 1360 px. Das sind vorgeschlagene Produktmaße; eine solche App-Navigation wurde nicht auf der öffentlichen Website nachgewiesen.

**Navigation standardmäßig hell:** weißer Hintergrund, dunkle Labels, grüne aktive Markierung. Für einen stärker markierten Einstiegsbereich kann eine dunkle Kopffläche hinzukommen. Eine dauerhaft dunkle Sidebar ist eine mögliche Variante, aber nicht der automatisch zu übernehmende Standard der Website.

### 6.3 Radien [S]

- Buttons, Inputs, Tabs, Statuslabels: **4 px**.
- Arbeitskarten und einfache Panels: **5–8 px**.
- Dialoge: **8 px**.
- Avatare: rund oder das passende originale Bildformat.
- Große Radien ab 16 px nur für bewusst gewählte Kampagnen-/Onboardingmodule.

### 6.4 Schatten [S]

Die Website nutzt teilweise kräftige, mehrlagige Schatten; in einem dichten Arbeitsbereich würden sie schnell Unruhe erzeugen. Deshalb:

- Standardkarte: feine Linie oder `0 1px 2px rgb(14 19 12 / 6%)`.
- Schwebendes Menü: `0 8px 24px rgb(14 19 12 / 12%)`.
- Besonderer Einstieg: stärkerer Schatten erlaubt, sparsam.
- Tabellenzeilen, Statusbadges und jedes einzelne Formularfeld bekommen keinen dekorativen Schatten.

---

## 7. Logo, Bildsprache und Icons

### Logo [B/S]

Auf vielen Hauptseiten steht eine kombinierte Wortmarke aus Mission Mittelstand und Matthias Aumann. Es existieren helle und dunkle Varianten; einzelne Funnels verwenden eine kompaktere Marke. Für die Software die vorgesehene Originalvariante verwenden, Seitenverhältnis erhalten, keine Rekonstruktion als Text und keine neu gezeichnete Ersatzmarke.

**[S] Vorläufige Platzierungsregel:** 160–200 px Breite in einem großzügigen Einstieg, im App-Kopf nach realem Asset und verfügbarem Raum bemessen. Schutzraum mindestens eine halbe Höhe des sichtbaren Logos. Diese Maße sind Produktvorschläge, keine nachgewiesene offizielle Logo-Schutzzone. Bei schmalen Flächen eine vorhandene freigegebene kompakte Variante nutzen.

### Bildsprache [B]

- Sichtbare Gründer- und Beraterpersönlichkeiten; freigestellte Personen auf hellen Flächen.
- Echte Teams, Bühnen, Veranstaltungen, Gespräche und Betriebe.
- Grüne Lichtstimmung, dunkle Überlagerungen, teilweise weiche Ausblendungen in den Hintergrund.
- Dokument- und Buchmockups in Ressourcenbereichen.
- Im Blog auch illustrative Motive; die Bildsprache ist dort heterogener als im Hauptauftritt.

Quellen: [Team](https://www.mission-mittelstand.de/ueber-uns/team), [Unternehmertraining](https://www.mission-mittelstand.de/beratung/unternehmertraining), [Fallstudie Baubranche](https://www.mission-mittelstand.de/fallstudien/baubranche).

**[S] Einsatz im Produkt:** Bilder tragen Identität im Login, Onboarding, Lernbereich und bei realen Ansprechpartnern. Operative Tabellen brauchen keine dekorativen Personenbilder. Originalbilder und Cover in ihrem tatsächlichen Verhältnis verwenden. Personen und Kundenstimmen müssen zum Inhalt gehören; keine fingierten Partner, Bewertungen oder Erfolgszahlen.

### Icons [B/S]

**[B]** Die Website kombiniert grüne quadratische Iconflächen, helle Linien-/Piktogrammicons, funktionale Pfeile, Pluszeichen und thematische Symbole. Es gibt mehrere Iconstile.

**[S]** Im Produkt eine einheitliche funktionale Familie verwenden: meist 20 px, ungefähr 1,75–2 px Strichstärke. Themenicons können in 40–48 px großen, leicht gerundeten grünen oder grüntönigen Flächen stehen. Kritische Aktionen erhalten verständliche Labels. KI-Funktionen über ihren Nutzen kennzeichnen; ein dekoratives Funkeln ersetzt keine Funktionsbeschreibung.

---

## 8. Komponenten für die Software

Alle konkreten Produktmaße und Zustandsdefinitionen in diesem Abschnitt sind **[S]**, sofern nicht anders gekennzeichnet.

### 8.1 Buttons

| Variante | Darstellung | Einsatz |
|---|---|---|
| Primär | Tiefes CTA-Grün `#06480C`, Weiß, Barlow 600, 4 px Radius | Wichtigster nächster Schritt |
| Sekundär | Weiß, grüne Kontur, dunkles Textgrün | Alternative Handlung |
| Tertiär | Transparente Fläche, Text und optional Icon | Zurück, Details, weniger wichtige Aktionen |
| Destruktiv | Eigene rote Semantik, explizites Verb | Löschen oder unwiderrufliche Aktionen |

Standardhöhe **44 px**, horizontaler Innenabstand **20 px**, Label **16 px**. Große Einstiegsaktion **48–52 px** hoch. Auf mobilen Formularen kann die Hauptaktion die gesamte verfügbare Breite erhalten.

Zustände:

- **Hover:** leichte Farbänderung, kein Springen oder Größenwechsel.
- **Fokus:** sichtbarer 2-px-Ring mit Abstand; auch auf dunklem Grund erkennbar.
- **Gedrückt:** etwas dunkler, Position unverändert.
- **Lädt:** ursprüngliche Breite erhalten, Spinner und konkreter Text, Mehrfachauslösung verhindern.
- **Deaktiviert:** klar als inaktiv erkennbar; falls der Grund nicht offensichtlich ist, kurz erklären.

**[M] Website-Referenz:** Der Standardbutton nutzt `#2F9250`, 600er Schrift, `0.75rem 1.25rem` Padding und `0.2rem` Radius; `.button.is-secondary` wird beim Hover grün mit weißer Schrift. Die Software-Farbanpassung für kleine Labels ist in Abschnitt 4 ausdrücklich festgelegt.

### 8.2 Navigation

Kurze fachliche Begriffe. Ein aktiver Eintrag bekommt eine grüne Randmarkierung, eine dezente grünliche Fläche und kräftigere Schrift. Aktivität bleibt auch ohne Farbwahrnehmung erkennbar. Navigation von Aktionen trennen; „Speichern“ ist kein dauerhafter Menüpunkt.

Mögliche Begriffe wie „Übersicht“, „Aufgaben“, „Kontakte“, „Prozesse“ und „Wissen“ sind nur Beispiele für die Gestaltung. Dieses Playbook definiert keinen verbindlichen Funktionsumfang der Software.

### 8.3 Karten

Weiße Fläche auf `#F7FAFB`, 24 px Padding, 5–8 px Radius. Oben bei Bedarf kleines Themenicon oder Oberzeile, darunter ein aussagekräftiger Titel. Eine primäre Kartenaktion genügt meistens.

Klickbare Karten erhalten Hover- und Tastaturfokus. Enthält eine Karte mehrere Bedienelemente, keine verschachtelten Links oder Buttons erzeugen. Titel, Zustandsanzeige und Aktion sollen ihre Position über gleichartige Karten hinweg behalten.

### 8.4 Kennzahlen

Große Barlow-Zahl, präzise Beschriftung, Zeitraum und gegebenenfalls Vergleich. Die Website verwendet große Zahlen als Vertrauenssignal; im Produkt zeigen sie echte Betriebsdaten.

Beispielstruktur: **Wert → Bedeutung → Zeitraum → Vergleich → Datenstand**. Fehlende Daten als „Noch keine Daten“ kennzeichnen. Kein Nullwert als Ersatz für eine fehlgeschlagene Abfrage, keine dekorative positive Prozentzahl ohne Berechnungsgrundlage.

### 8.5 Tabellen und Listen

**[B]** Die Startseite zeigt eine kleine vertriebsbezogene Listenansicht mit Namen, Statuschips und einer Abschlusskennzahl. Sie belegt eine klare, helle Tabellenästhetik, aber kein vollständiges CRM-Designsystem.

**[S]** Daraus ableiten: helle Kopfzeile, 14–16 px Text, 48–56 px Zeilenhöhe, feine horizontale Linien, dezenter Hover, Zahlen rechtsbündig. Links ein identifizierbarer Datensatz, rechts Status und gegebenenfalls die wichtigste Zeilenaktion. Sortierbarkeit sichtbar machen. Filter über der Tabelle, Details in einer klaren Folgesicht. Keine Rahmen um jede einzelne Zelle.

Auf kleinen Bildschirmen Prioritätsspalten oder eine strukturierte Listenansicht verwenden. Fachlich notwendige breite Tabellen dürfen innerhalb eines bezeichneten Bereichs horizontal scrollen; die gesamte Seite soll es nicht.

### 8.6 Statuslabels

Vier klar getrennte Grundfälle: **neutral**, **in Bearbeitung**, **erfolgreich**, **Aufmerksamkeit/Fehler**. Immer Text, optional Icon, Farbe unterstützend. Kleine rechteckige Badges mit 4 px Radius greifen die Mini-UI der Startseite auf.

„Automatisiert“ beschreibt eine Betriebsart, „Abgeschlossen“ einen Zustand. „KI-Assistent“ bezeichnet eine Funktion. Diese drei Begriffe nicht als austauschbare Statusfarben behandeln.

### 8.7 Formulare

Sichtbares Label oberhalb jedes Feldes, 44–48 px Eingabehöhe, 16 px Text, 4 px Radius. Weißer Hintergrund, ausreichend deutlicher Rahmen. Hilfe unmittelbar beim betreffenden Feld. Fehler verständlich erklären, Eingaben erhalten und den nächsten sinnvollen Schritt zeigen.

**[M] Website-Basis:** `.form-input` definiert mindestens 44 px Höhe, 16 px Schrift, weißen Grund, schwarze 1-px-Kontur und `8px 12px` Padding. Externe Buchungsformulare können andere Styles verwenden und wurden nicht vollständig vermessen.

### 8.8 Geführte Abläufe

Der [KI-Check](https://www.mission-mittelstand.de/ki-check) ist die stärkste öffentliche Referenz: eine klare Frage, kurze Erklärung, Auswahlkarten, anschließend eine konkrete Weiter-Aktion. Desktop zweispaltige Auswahl, mobil untereinander. **[B]**

Für die Software: Schritte benennen, Fortschritt und Rückweg anzeigen, Auswahl über Rand plus Symbol bestätigen, bereits eingegebene Daten erhalten. Nur tatsächlich benötigte Angaben abfragen. Die Website-Werte für Auswahl, Validierung und finale Report-Erzeugung wurden nicht vollständig interaktiv geprüft; diese Zustände sind neu zu spezifizieren.

### 8.9 Tabs und Filter

Die [Ressourcen](https://www.mission-mittelstand.de/ressourcen) und die [Angebotsübersicht](https://www.mission-mittelstand.de/links) liefern grüne aktive Tabs. Die [Branchenübersicht](https://www.mission-mittelstand.de/branchen) ergänzt einen alphabetischen Filter.

Für das Produkt kompakte Tabs verwenden, aktiven Zustand zusätzlich über Form oder Unterstreichung zeigen. Filter brauchen einen erkennbaren angewendeten Zustand und eine verständliche Rücksetzung. Keine Filteranzeige, die wie eine primäre Speichern-Aktion aussieht.

### 8.10 Akkordeons, Dialoge und Meldungen

FAQ-Muster: Frage links, Plus/Minus rechts, heller Hintergrund. Für die Software ganze Kopfzeile bedienbar, sinnvolle Tastatursteuerung und korrekt kommunizierten Offen-/Geschlossen-Zustand vorsehen.

Dialog: klarer Titel, kurzer Kontext, primäre und sekundäre Handlung in nachvollziehbarer Reihenfolge. Fokus hineinsetzen und nach Schließen zurückgeben. Eine Erfolgsmeldung bestätigt die erledigte Handlung, beispielsweise „Dein Prozess wurde gespeichert.“ Sie darf den nächsten Arbeitsschritt nicht blockieren.

### 8.11 KI-Assistent

Die Website rahmt KI als Unterstützung für praktische Arbeit. **[S]** Der Assistent sollte entsprechend konkrete Aufgaben bearbeiten, Eingaben und Ergebnis unterscheiden und nutzbare nächste Aktionen anbieten.

- Einstieg mit einer klaren Aufgabe statt einer leeren, technikorientierten Fläche.
- Antworten in Barlow, mit kurzen Absätzen und übersichtlichen Handlungsschritten.
- Quellen, zugrunde liegende Daten und Unsicherheit dort zeigen, wo sie für Entscheidungen wichtig sind.
- Entwurf, Prüfung und tatsächliche Ausführung sichtbar unterscheiden.
- Aktionen wie „Als Aufgabe übernehmen“ oder „Entwurf bearbeiten“ erst anbieten, wenn sie funktional vorhanden sind.
- Keine Erfolgsmeldung, solange nur ein Vorschlag erzeugt wurde.

Das visuelle Grundmuster bleibt hell, grün und sachlich. Eine zusätzliche bunte KI-Marke ist dafür nicht erforderlich.

---

## 9. Tonalität und UX Writing

**[B]** Im Hauptauftritt dominiert eine direkte Du-Ansprache, mit klarer Nutzenorientierung und aktiven Verben. Je nach Seite ist die Sprache werblicher oder sachlicher. [Beratung](https://www.mission-mittelstand.de/beratung), [Teamwerte](https://www.mission-mittelstand.de/ueber-uns/teamwerte), [KI-Check](https://www.mission-mittelstand.de/ki-check).

**[S] Sprachregeln für die Anwendung:**

1. „du“, „dein“, „dir“ im Satz einheitlich kleinschreiben; Satzanfänge normal groß.
2. Handlung benennen: „Aufgabe erstellen“, „Prozess speichern“, „Bericht öffnen“.
3. Kurze, vollständige Sätze. Fachwörter nur, wenn sie im Betrieb üblich sind.
4. Freundlich und entschlossen schreiben; nicht antreiben, wenn eine Fehlermeldung erklärt werden muss.
5. Erfolg sachlich bestätigen. Motivation in Einstieg und Meilensteinen, nicht in jeder Tabellenzelle.
6. Eine Aussage pro Hilfetext. Technische Fehlercodes ergänzend in Details.

Alle folgenden Texte sind **neu formulierte Produktbeispiele**, keine Originalzitate:

| Situation | Passende Formulierung |
|---|---|
| Einstieg | „Dein Betrieb im Überblick.“ |
| Noch keine Prozesse | „Lege deinen ersten Prozess an und mache den Ablauf für dein Team klar.“ |
| Hauptaktion | „Prozess anlegen“ |
| Validierung | „Trage eine gültige E-Mail-Adresse ein.“ |
| Speichern fehlgeschlagen | „Deine Änderungen wurden noch nicht gespeichert. Versuche es erneut.“ |
| Erfolg | „Deine Änderungen sind gespeichert.“ |
| KI arbeitet | „Dein Entwurf wird erstellt.“ |
| KI-Ergebnis | „Prüfe den Entwurf und passe ihn an deinen Betrieb an.“ |
| Fehlende Berechtigung | „Du kannst diesen Bereich ansehen. Zum Bearbeiten brauchst du die entsprechende Freigabe.“ |
| Keine Treffer | „Zu diesen Filtern gibt es keine Ergebnisse. Passe die Auswahl an.“ |

---

## 10. Bewegung und Interaktionsgefühl

**[B/M]** Die Website enthält animierte Einstiege, Slider, aufklappende Inhalte, Tabs und interaktive Miniaturen. Einzelne CSS-Übergänge sind mit 150 ms definiert. Daraus lässt sich keine einheitliche Motion-Spezifikation für alle Seiten ableiten.

**[S] Produktregeln:**

- Kleine Zustandswechsel: **120–180 ms**, `ease-out`.
- Dialog/Panel: **180–240 ms**, geringe Verschiebung plus Opazität.
- Kein Layoutsprung beim Laden, Hover oder Statuswechsel.
- Lange Aktionen bekommen sofort eine Rückmeldung; keine künstliche Wartezeit.
- Wiederkehrende Arbeitsbereiche ohne automatische Slider, permanente pulsierende CTAs oder Scrollinszenierungen.
- Bei reduzierter Bewegung nicht notwendige Animationen abschalten.

Markenenergie entsteht im Produkt vor allem durch klare Reaktionen und sichtbaren Fortschritt.

---

## 11. Drei konkrete Bildschirmrezepte

Die Rezepte sind **[S]** und dienen als Gestaltungsmuster für vorhandene oder künftig beschlossene Funktionen.

### A. Übersicht

Helle Navigation, hellgraue Arbeitsfläche. Oben ein kurzer Titel mit einer Hauptaktion. Darunter wenige relevante Kennzahlen auf weißen Karten; dann eine priorisierte Aufgaben- oder Aktivitätenliste. Optional ein kompakter dunkler Markenbereich für ein persönliches Ziel oder einen nächsten Meilenstein. Grüne Akzente kennzeichnen Auswahl und Fortschritt.

**Wirkung:** Überblick, Orientierung, Kontrolle.

### B. Prozessdetail

Breadcrumb, Prozessname, Status und eine klare Aktion. Hauptspalte mit Schritten; schmalere Kontextspalte mit Verantwortlichem, Termin und Fortschritt. Weiße Karten, feine Linien, kleine Radien. Jeder Schritt hat einen eindeutigen Erledigt-Zustand. Bearbeiten und Ausführen sind unterscheidbar.

**Wirkung:** Ordnung und Entlastung.

### C. Wissen oder Training

Barlow-Überschrift, ruhiger Lesebereich, linkes Inhaltsverzeichnis auf Desktop. Rechts beziehungsweise im Hauptbereich Text, vorhandenes Cover oder Video, anschließend eine konkrete Umsetzungsaktion. Fortschritt sichtbar; Bilder und grüne Themenakzente stärker zulassen als in einer Tabelle.

**Wirkung:** Persönliche Begleitung, Kompetenz und Anwendung.

### Weitere Zustände, die vor Freigabe gestaltet sein müssen

Laden, leerer Bereich, keine Suchtreffer, Fehler, keine Berechtigung, deaktivierte Aktion, Erfolg, ungespeicherte Änderungen, lange Texte, viele Datensätze und schmale Ansicht. Eine schöne befüllte Startansicht allein bildet die Markenwirkung noch nicht zuverlässig ab.

---

## 12. Seitentypen: Was wir aus der gesamten Website übernehmen

| Familie | Erfasster Umfang | Charakteristische Beobachtung / technische Einordnung | Übertragung in die Software [S] |
|---|---:|---|---|
| Startseite | 1 | Weißer Hero, schwere Barlow, grüner Akzent, Menschen, Mini-UI, dunkle Folgeabschnitte | Primäre Designreferenz |
| Beratung inkl. KMU, Unternehmer- und Skalierungstraining | 4 | Fotografie, dunkle Overlays, grüne CTAs, Kompetenz und Entwicklung | Einstiege, Bereichskontext und klare Nutzenhierarchie |
| Über uns, Team, Werte | 3 | Schräge Banner, Teamfoto, Iconkarten, Werteabschnitte | Identität, Zusammenarbeit und persönliche Nähe |
| Ressourcenübersicht | 1 | Tabs, Karten und Dokumentbezug | Wissensbibliothek |
| Blog | 1 Übersicht + 84 Artikel | Editoriale Hierarchie, Inhaltsnavigation, Seitenleiste, Download-CTA | Lesemodus und Wissensdetail |
| Branchen | 1 Übersicht + 67 Detailseiten | Verzeichnis und Filter, textreiche Detailtemplates | Suche, Kategorien und geordnete Information |
| Fallstudien | 16 | Covermockup, Nutzenbeschreibung, orange Downloadaktion | Reale Dokumente und klar beschriftete Downloads |
| Worksheets | 18 | Leadmagnet-Templates; teilweise rundere grüne Module | Vorlagenkatalog; Formvarianten bewusst vereinheitlichen |
| Events und Intensiv-Events | 2 | Dunkle, mediale Inszenierung; große Titel; Aktionsfarben | Termin-/Lernmodule, keine Scrollshow im Arbeitsbereich |
| Erstgespräch und Terminwege inkl. Beraterseiten | 7 | Reduzierte Buchungsrahmen, externe Einbettungen | Geführte Eingabe; Drittanbieterlook nicht ungeprüft übernehmen |
| KI-Check | 1 | Frage, Auswahlkarten, Weiter-Aktion | Beste Referenz für Onboarding und Assistenten |
| Kontakt, Karriere, Vertriebsrecruiting | 3 | Kontaktorientierung, Menschen, aktive Ansprache | Support und Ansprechpartner; Recruiting ist eigene Kampagne |
| FAQ, Medien, Links, Suche | 4 | Akkordeons, Übersichten, Kategorien, Suchrahmen | Hilfebereich, Filter, Informationszugang |
| Erfahrungen, Kosten | 2 | Vertrauens- und Erklärinhalte, Videos | Kontext und nachvollziehbare Entscheidungen |
| Führung mit System, Mitarbeitertraining, Family & Friends, MM Finanz | 4 | Zusätzliche Kampagnenfarben, größere Radien, Angebotsmodule | Sondervarianten, keine globale UI-Vorgabe |
| Live-Tour-Bewerbung und Live-Tour-Detail | 2 | Personen- und Veranstaltungskontext | Detailinformationen und persönliche Begleitung |
| Videoaktion | 1 | Ältere aktionsbezogene Seite | Als Bestand erfasst, geringe Priorität für neues Produktdesign |
| Dankeseiten | 2 | Bestätigung und Folgeschritte | Sinnvolle Erfolgssichten |
| Rechtliches | 4 | Lesetext mit Website-Rahmen | Ruhiger Textmodus; keine rechtliche Inhaltsbewertung |

Die Familien decken die 228 abgerufenen Seiten ab. Bei wiederkehrenden CMS-Seiten wurde die strukturelle Zugehörigkeit im HTML erfasst und das Design anhand repräsentativer Seiten geprüft. Unterschiede einzelner Artikelbilder und Inhalte begründen nicht automatisch ein neues Designsystem.

---

## 13. Abweichungen bewusst behandeln

### Kampagnenorange

Orange ist nachweisbar auf Fallstudien-, Trainings- und Angebotsseiten. **[S]** Es bleibt im Produkt für eine gezielte Angebotsvariante verfügbar. Nicht gleichzeitig Grün und Orange als konkurrierende primäre Aktionen auf derselben Arbeitsansicht einsetzen. Warnungsfarben unabhängig und verständlich definieren.

### Unterschiedliche Rundungen

Großzügig gerundete Kampagnencontainer und Pillen kommen vor. **[S]** Für die alltägliche Software gilt das kleinere Radiusset. Ein gesonderter Willkommen- oder Lernbereich kann eine der weicheren Varianten gezielt zitieren.

### Historische und technische Rückstände

Einzelne Seiten enthalten alte Veranstaltungsdaten, Vorlagenreste oder stark spezialisierte Kampagnenstile. Eine intern verlinkte Alt-URL führt zu 404. **[S]** Solche Befunde werden dokumentiert, aber nicht als gewünschtes Produktverhalten nachgebaut.

### Website und Arbeitssituation

**[S]** Die Website darf Aufmerksamkeit aufbauen. Die Software muss wiederholt bedienbar sein. Große Markenstatements gehören daher an Einstiege; wichtige Daten, Formulare und Aufgaben bleiben kompakt. Diese Anpassung betrifft die Informationsdichte, nicht die Identität.

---

## 14. Design-Tokens als Startpunkt

**Die Farbwerte mit „Quelle“ sind nachgewiesen [M]. Ihre semantische Zuordnung, die Produktskala und die Komponentenregeln sind [S].** Das Snippet ist ein Implementierungsstart, kein vollständiges Theme. Fontdateien müssen passend eingebunden werden.

```css
:root {
  /* Farben: Quelle Website */
  --mm-brand: #2f9250;
  --mm-brand-accent: #69af44;
  --mm-brand-deep: #06480c;
  --mm-brand-text: #1f6135;
  --mm-dark: #0e130c;
  --mm-black: #000000;
  --mm-text: #374040;
  --mm-muted-on-white: #767676;
  --mm-canvas: #f7fafb;
  --mm-surface: #ffffff;
  --mm-border: #d9d9d9;
  --mm-border-dark: #484848;
  --mm-hover: #eef1f2;
  --mm-soft-green: #edf0e9;
  --mm-campaign-orange: #e69433;

  /* Schriften: Quelle Website */
  --mm-font: "Barlow", sans-serif;
  --mm-font-eyebrow: "Poppins", Arial, sans-serif;

  /* Produktrollen: abgeleitet */
  --mm-action: var(--mm-brand-deep);
  --mm-action-hover: var(--mm-brand-text);
  --mm-on-action: #ffffff;
  --mm-link: var(--mm-brand-text);
  --mm-focus: var(--mm-brand-text);
  --mm-radius-control: 4px;
  --mm-radius-card: 5px;
  --mm-radius-panel: 8px;
  --mm-control-height: 44px;
  --mm-sidebar-width: 240px;
  --mm-topbar-height: 64px;
  --mm-content-max: 1360px;
  --mm-space-1: 4px;
  --mm-space-2: 8px;
  --mm-space-3: 12px;
  --mm-space-4: 16px;
  --mm-space-6: 24px;
  --mm-space-8: 32px;
  --mm-space-12: 48px;
  --mm-space-16: 64px;
  --mm-shadow-card: 0 1px 2px rgb(14 19 12 / 6%);
  --mm-shadow-overlay: 0 8px 24px rgb(14 19 12 / 12%);
  --mm-motion-fast: 150ms;
  --mm-motion-panel: 220ms;

  /* Ergänzte Funktionsfarben; keine extrahierten Markenfarben */
  --mm-danger: #b42318;
  --mm-danger-surface: #fef3f2;
  --mm-warning: #854d0e;
  --mm-warning-surface: #fefce8;
}

.mm-app {
  color: var(--mm-text);
  background: var(--mm-canvas);
  font: 400 16px/1.5 var(--mm-font);
}

.mm-page-title {
  color: var(--mm-black);
  font: 700 32px/1.1875 var(--mm-font);
  letter-spacing: -0.5px;
}

.mm-eyebrow {
  color: var(--mm-brand-text);
  font: 600 12px/1.5 var(--mm-font-eyebrow);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.mm-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--mm-control-height);
  padding: 8px 20px;
  border: 1px solid transparent;
  border-radius: var(--mm-radius-control);
  background: var(--mm-action);
  color: var(--mm-on-action);
  font: 600 16px/1.5 var(--mm-font);
  cursor: pointer;
  transition: background-color var(--mm-motion-fast) ease-out;
}

.mm-button:hover:not(:disabled) {
  background: var(--mm-action-hover);
}

.mm-button:focus-visible {
  outline: 2px solid var(--mm-focus);
  outline-offset: 3px;
}

.mm-button:disabled {
  background: var(--mm-border);
  color: var(--mm-text);
  cursor: not-allowed;
}

.mm-card {
  padding: 24px;
  border: 1px solid var(--mm-border);
  border-radius: var(--mm-radius-card);
  background: var(--mm-surface);
  box-shadow: var(--mm-shadow-card);
}

.mm-number {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 767px) {
  .mm-page-title { font-size: 28px; line-height: 1.2143; }
  .mm-card { padding: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .mm-app { --mm-motion-fast: 0ms; --mm-motion-panel: 0ms; }
}
```

Für dunkle Flächen eigene Text-, Fokus- und Randrollen ergänzen und prüfen. Dieses Snippet beansprucht keine vollständige Abdeckung aller Zustände.

---

## 15. Was das Ergebnis vom Markengefühl entfernen würde

**[S] Vermeiden:**

- Austausch von Barlow gegen die Standardschrift eines UI-Baukastens.
- Ein beliebiges Smaragdgrün statt der nachgewiesenen Palette.
- Große Rundungen und Pillen an sämtlichen Komponenten.
- Violette oder blaue KI-Verläufe als zusätzliche Leitästhetik.
- Zu kleine Schrift, zu wenig Kontrast und ausschließlich farbige Zustandsunterschiede.
- Gleichzeitige Konkurrenz mehrerer bunter Hauptaktionen.
- Überall Versalien und plakative Headlines in täglichen Arbeitsabläufen.
- Stockporträts als angebliche Ansprechpartner oder erfundene Erfolgsbelege.
- Unstrukturierte Dashboard-Kacheln ohne klare Priorität.
- Übernahme von Ladefehlern, alten Inhalten oder zufälligen CSS-Resten als Gestaltungsregel.

---

## 16. Abnahme: Wann die Software nach Mission Mittelstand aussieht

### Visueller Vergleich [S]

Die ersten echten Screens bei 1440 px und 390 px direkt neben Startseite, KI-Check und Ressourcenbereich prüfen. Gleicher Zoom, geladene Schriften, vergleichbare Ausschnitte. Zuerst Schrift und Proportionen, dann Farbe, dann Flächen und Komponenten, zuletzt Details beurteilen.

- [ ] Barlow ist tatsächlich geladen; Gewichte und Umlaute wirken korrekt.
- [ ] Oberzeilen verwenden Poppins nur dort, wo diese Ebene sinnvoll ist.
- [ ] Farben entsprechen den Tokens; Kampagnenvarianten sind bewusst begrenzt.
- [ ] Überschriften sind kräftig, Fließtexte ruhig, Hierarchien klar.
- [ ] Karten und Bedienelemente haben überwiegend kleine Radien.
- [ ] Ein typischer Screen hat eine erkennbare wichtigste Handlung.
- [ ] Fotos und Logos sind echte, passende Originalassets.
- [ ] Tonalität ist direkt, hilfreich und fachlich verständlich.
- [ ] Kontraste, Tastaturfokus und mobile Bedienung sind geprüft.
- [ ] Leer-, Lade-, Fehler- und Erfolgszustände sind gestaltet.
- [ ] Die Ansicht bleibt bei langen deutschen Texten und echten Daten stabil.
- [ ] KI-Vorschlag und tatsächlich ausgeführte Aktion sind unterscheidbar.

**Arbeitsweise:** Zuerst Funktion und Zustände fertigstellen. Anschließend eine eigene Designrunde mit unmittelbarem Vergleich der Referenzen durchführen. Markenähnlichkeit nicht nur über eine Tokenliste beurteilen.

### Noch benötigte Produktentscheidungen

Diese Punkte verhindern die Verwendung des Playbooks nicht, sind aber vor einer endgültigen visuellen Freigabe zu klären: konkreter Funktionsumfang, gewünschte originale Logo-Variante, zugelieferte Bild-/Iconassets sowie gegebenenfalls ein internes neueres Brand-Handbuch. Eine nicht öffentlich zugängliche bestehende Mission-Mittelstand-Anwendung könnte weitere Produktkonventionen enthalten; sie wurde hier nicht untersucht.

---

## 17. Quellen und technische Nachvollziehbarkeit

**Primärquelle:** [Mission Mittelstand](https://www.mission-mittelstand.de/), Unterseiten gemäß folgendem Register. Abruf am 2. Oktober 2026.

**Seitenregister:** [Sitemap XML](https://www.mission-mittelstand.de/sitemap.xml), ergänzt um Footer- und interne Links.

**Gemeinsames Stylesheet:** [mission-mittelstand-relaunch.shared.391916742.min.css](https://cdn.prod.website-files.com/62a9dd39c78579b79599d04e/css/mission-mittelstand-relaunch.shared.391916742.min.css). Der Name enthält einen veränderlichen Build-Hash. Nach einem Website-Update Werte erneut prüfen.

**Nachgewiesene Assetreferenzen:**

- [Kombinierte dunkle Wortmarke mit Slogan](https://cdn.prod.website-files.com/62a9dd39c78579b79599d04e/67d9ad9b36f1afd4b263818a_99c4f4bedacba191c7c73413c5d562a5_MM-MA-Logo_Slogan_2025_schwarz-gruen.webp)
- [Weiße Mission-Mittelstand-Wortmarke](https://cdn.prod.website-files.com/62a9dd39c78579b79599d04e/646b51adc2a3ea60ed4d3ab8_99c4f4bedacba191c7c73413c5d562a5_MM-Logo-white.webp)
- [Barlow Regular, Website-Datei](https://cdn.prod.website-files.com/62a9dd39c78579b79599d04e/630f0f38309945e369eff04c_Barlow-Regular.ttf)
- [Barlow Semibold, Website-Datei](https://cdn.prod.website-files.com/62a9dd39c78579b79599d04e/630f0f3815a7a271ddf3ff45_Barlow-SemiBold.ttf)
- [Barlow Black, Website-Datei](https://cdn.prod.website-files.com/62a9dd39c78579b79599d04e/630f0f3738a693507019724a_Barlow-Black.ttf)
- [Poppins Semibold, Website-Datei](https://cdn.prod.website-files.com/62a9dd39c78579b79599d04e/630f12cc4edc6b6ccb30812a_Poppins-SemiBold.ttf)

Die Links dokumentieren die Referenzen. Für die Umsetzung freigegebene Dateien im eigenen Assetbestand verwenden und ihre Bereitstellung nicht von veränderlichen Website-CDN-Links abhängig machen.

**Prüfgrenzen:** Kein offizielles Brand-Assetpaket, kein vollständiger Motion-Audit, kein abgeschlossener Buchungsprozess, kein Audit eines geschützten Produkts. Die beschriebenen Software-Komponenten sind präzise Entwurfsvorgaben auf Grundlage der untersuchten öffentlichen Marke.

---

## Anhang: Vollständiges Seitenregister

**H** = HTML erfolgreich abgerufen und strukturell erfasst. **V** = zusätzlich visuelle Stichprobe der Seite. **V/Mobil** = zusätzlich schmale Ansicht. V bedeutet nicht, dass alle Sektionen und Zustände geprüft wurden. Die Zuordnung erfolgt über den angefragten URL-Pfad; tatsächliche Weiterleitungen werden separat ausgewiesen.

### Haupt- und Sonderseiten (43)

| URL | Seitentitel beim Abruf | Prüfung |
|---|---|---|
| [/](https://www.mission-mittelstand.de) | Mission Mittelstand – KI-gestützte Beratung für Handwerk | H + V/Mobil |
| [/agb](https://www.mission-mittelstand.de/agb) | AGB | H |
| [/beratung](https://www.mission-mittelstand.de/beratung) | KI-gestützte Unternehmensberatung für den Mittelstand | H + V |
| [/events](https://www.mission-mittelstand.de/events) | Veranstaltungen – Events – Seminare für KMU und den Mittelstand | H + V |
| [/impressum](https://www.mission-mittelstand.de/impressum) | Impressum | H + V |
| [/karriere](https://www.mission-mittelstand.de/karriere) | Jetzt durchstarten! - Karriere – Mission Mittelstand GmbH | H + V |
| [/kontakt](https://www.mission-mittelstand.de/kontakt) | Kontakt - Mission Mittelstand GmbH – Matthias Aumann | H + V |
| [/ueber-uns/mission-mittelstand](https://www.mission-mittelstand.de/ueber-uns/mission-mittelstand) | Über Mission Mittelstand | H + V |
| [/ressourcen](https://www.mission-mittelstand.de/ressourcen) | Gratis Expertenwissen für Unternehmer – Mission Mittelstand | H + V |
| [/ueber-uns/team](https://www.mission-mittelstand.de/ueber-uns/team) | Mission Mittelstand Team | H + V |
| [/ueber-uns/teamwerte](https://www.mission-mittelstand.de/ueber-uns/teamwerte) | Teamwerte - Mission Mittelstand GmbH – Matthias Aumann | H + V |
| [/datenschutzhinweise-fuer-bewerbungen](https://www.mission-mittelstand.de/datenschutzhinweise-fuer-bewerbungen) | Datenschutzhinweise für Bewerbungen | H |
| [/beratung/unternehmertraining](https://www.mission-mittelstand.de/beratung/unternehmertraining) | Coaching für Unternehmer ⚡ Mission Mittelstand | H + V |
| [/beratung/skalierungstraining](https://www.mission-mittelstand.de/beratung/skalierungstraining) | Skalierungstraining für dein Unternehmenswachstum | H + V |
| [/fuehrung-mit-system](https://www.mission-mittelstand.de/fuehrung-mit-system) | Leadership Training von Matthias Aumann 🚀 Jetzt nur 49€Leadership Training von Matthias Aumann – Mission Mittelstand | H + V |
| [/blog](https://www.mission-mittelstand.de/blog) | Blog für Geschäftsführer & Führungskräfte im Mittelstand | H + V |
| [/mission-mittelstand-erstgespraech](https://www.mission-mittelstand.de/mission-mittelstand-erstgespraech) | Mission Mittelstand Erstgespräch | H + V |
| [/mission-mittelstand-terminplanung](https://www.mission-mittelstand.de/mission-mittelstand-terminplanung) | Mission Mittelstand Terminplanung | H |
| [/mission-mittelstand-termin-iframe-content](https://www.mission-mittelstand.de/mission-mittelstand-termin-iframe-content) | Mission Mittelstand Termin IFrame Content | H |
| [/erfahrungen](https://www.mission-mittelstand.de/erfahrungen) | Mission Mittelstand Erfahrungen & Erfolgsgeschichten | H + V |
| [/video-aktion](https://www.mission-mittelstand.de/video-aktion) | Video schauen und Ticket sichern – Mission Mittelstand | H |
| [/intensiv-events](https://www.mission-mittelstand.de/intensiv-events) | Intensiv-Events von Mission Mittelstand – 2 Tage für mehr Erfolg! | H + V |
| [/family-and-friends](https://www.mission-mittelstand.de/family-and-friends) | Family and Friends | H + V |
| [/links](https://www.mission-mittelstand.de/links) | Unsere Leistungen in einer Übersicht 🚀 Mission Mittelstand | H + V |
| [/branchen](https://www.mission-mittelstand.de/branchen) | Unsere Branchen bei Mission Mittelstand | H + V |
| [/live-tour-bewerbung](https://www.mission-mittelstand.de/live-tour-bewerbung) | Live Tour Bewerber | H |
| [/kosten](https://www.mission-mittelstand.de/kosten) | Was kostet eine Beratung bei Mission Mittelstand? | H |
| [/kmu-beratung](https://www.mission-mittelstand.de/kmu-beratung) | KMU-Beratung von Mission Mittelstand ► Werde Marktführer! | H |
| [/online-training/mitarbeiter](https://www.mission-mittelstand.de/online-training/mitarbeiter) | Online Training - Profitabel Mitarbeiter einstellen in 90 Tagen | H + V |
| [/termin-sichern](https://www.mission-mittelstand.de/termin-sichern) | Mission Mittelstand – Termin sichern | H |
| [/medien-bibliothek](https://www.mission-mittelstand.de/medien-bibliothek) | Matthias Aumann Medien – SAT1, Welt, BILD - Mission Mittelstand | H + V |
| [/search](https://www.mission-mittelstand.de/search) | Search Results | H |
| [/haeufig-gestellte-fragen](https://www.mission-mittelstand.de/haeufig-gestellte-fragen) | Häufig gestellte Fragen – FAQ | H + V |
| [/vielen-dank](https://www.mission-mittelstand.de/vielen-dank) | Dankeseite | H |
| [/vielen-dank-2](https://www.mission-mittelstand.de/vielen-dank-2) | Dankeseite | H + V |
| [/terminbuchung](https://www.mission-mittelstand.de/terminbuchung) | Mission Mittelstand Terminplanung | H |
| [/ki-check](https://www.mission-mittelstand.de/ki-check) | KI-Reifegrad-Check Mittelstand – kostenlos in 95 Sekunden | H + V/Mobil |
| [/mm-finanz](https://www.mission-mittelstand.de/mm-finanz) | Mission Mittelstand Finanz | H + V |
| [/recruiting-vertrieb-lp](https://www.mission-mittelstand.de/recruiting-vertrieb-lp) | Recruiting Vertrieb – LP | H |
| [/live-tour/lars-tremmel](https://www.mission-mittelstand.de/live-tour/lars-tremmel) | Mission Mittelstand Live Tour – 24.09.2026 – Lars Tremmel | H |
| [/termine-strategieberater/carsten-baecker](https://www.mission-mittelstand.de/termine-strategieberater/carsten-baecker) | Mission Mittelstand Homepage | H |
| [/termine-strategieberater/stefan-kuster](https://www.mission-mittelstand.de/termine-strategieberater/stefan-kuster) | Mission Mittelstand Homepage | H |
| [/datenschutz](https://www.mission-mittelstand.de/datenschutz) | Datenschutz | H |

### /fallstudien/ (16)

| URL | Seitentitel beim Abruf | Prüfung |
|---|---|---|
| [/fallstudien/baubranche](https://www.mission-mittelstand.de/fallstudien/baubranche) | Fallstudie der Baubranche – Mission Mittelstand | H + V |
| [/fallstudien/elektrotechnik](https://www.mission-mittelstand.de/fallstudien/elektrotechnik) | Unternehmenswachstum in der Elektrotechnik | H |
| [/fallstudien/fliesenleger](https://www.mission-mittelstand.de/fallstudien/fliesenleger) | Unternehmenswachstum für Fliesenleger – Mission Mittelstand | H |
| [/fallstudien/galabau](https://www.mission-mittelstand.de/fallstudien/galabau) | Fallstudie der Galabau-Branche – Mission Mittelstand | H |
| [/fallstudien/gebaeudeservice](https://www.mission-mittelstand.de/fallstudien/gebaeudeservice) | Fallstudie der Gebäudeservice-Branche – Mission Mittelstand | H |
| [/fallstudien/gesundheit-und-pflege](https://www.mission-mittelstand.de/fallstudien/gesundheit-und-pflege) | Fallstudie der Gesundheits- und Pflegebranche – Mission Mittelstand | H |
| [/fallstudien/immobilien](https://www.mission-mittelstand.de/fallstudien/immobilien) | Unternehmenswachstum für Immobilienmakler | H |
| [/fallstudien/it](https://www.mission-mittelstand.de/fallstudien/it) | Unternehmenswachstum für die IT Branche – Mission Mittelstand | H |
| [/fallstudien/lebensmittelhandwerk](https://www.mission-mittelstand.de/fallstudien/lebensmittelhandwerk) | Fallstudie der Lebensmittelhandwerk – Mission Mittelstand | H |
| [/fallstudien/photovoltaik](https://www.mission-mittelstand.de/fallstudien/photovoltaik) | Unternehmenswachstum in der Photovoltaik Branche | H |
| [/fallstudien/shk](https://www.mission-mittelstand.de/fallstudien/shk) | SHK-Branche Unternehmen voran bringen – Mission Mittelstand | H |
| [/fallstudien/smart-home](https://www.mission-mittelstand.de/fallstudien/smart-home) | Unternehmenswachstum in der Smart Home Branche | H |
| [/fallstudien/solar](https://www.mission-mittelstand.de/fallstudien/solar) | Fallstudie der Entwicklung der Solarbranche – Mission Mittelstand | H |
| [/fallstudien/tischlerei](https://www.mission-mittelstand.de/fallstudien/tischlerei) | Fallstudie der Tischlerbranche – Mission Mittelstand | H |
| [/fallstudien/unternehmer](https://www.mission-mittelstand.de/fallstudien/unternehmer) | Unternehmenswachstum im Mittelstand – Mission Mittelstand | H |
| [/fallstudien/vertrieb](https://www.mission-mittelstand.de/fallstudien/vertrieb) | Vertriebs-Checkliste für Handwerk & Mittelstand – Kostenlos herunterladen | H |

### /worksheets/ (18)

| URL | Seitentitel beim Abruf | Prüfung |
|---|---|---|
| [/worksheets/abmahnung](https://www.mission-mittelstand.de/worksheets/abmahnung) | Abmahn-Worksheet für deinen Handwerksbetrieb ⚡ Gratis Vorlage | H |
| [/worksheets/arbeitsvertrag](https://www.mission-mittelstand.de/worksheets/arbeitsvertrag) | Muster für den perfekten Arbeitsvertrag⚡ Gratis Vorlage | H |
| [/worksheets/die-kunst-des-delegierens](https://www.mission-mittelstand.de/worksheets/die-kunst-des-delegierens) | Richtig delegieren als Führungskraft | H |
| [/worksheets/ki-im-handwerk](https://www.mission-mittelstand.de/worksheets/ki-im-handwerk) | KI-Worksheet für Handwerksbetriebe ⚡ Gratis Vorlage | H + V |
| [/worksheets/kodex-der-macher](https://www.mission-mittelstand.de/worksheets/kodex-der-macher) | Top Unternehmer werden ⚡ Gratis Vorlage | H |
| [/worksheets/mitarbeitergespraech](https://www.mission-mittelstand.de/worksheets/mitarbeitergespraech) | Vorlage: Mitarbeitergespräch erfolgreich führen ⚡ Gratis Vorlage | H |
| [/worksheets/mitarbeitergespraeche](https://www.mission-mittelstand.de/worksheets/mitarbeitergespraeche) | Vorlage: Mitarbeitergespräch erfolgreich führen ⚡ Gratis Vorlage | H |
| [/worksheets/mmb](https://www.mission-mittelstand.de/worksheets/mmb) | Mitarbeiter maximal motivieren in 6 Schritten ⚡ Gratis Vorlage | H |
| [/worksheets/osborn](https://www.mission-mittelstand.de/worksheets/osborn) | Innovationen im Unternehmen entwickeln ⚡ Gratis Vorlage | H |
| [/worksheets/priorisierung](https://www.mission-mittelstand.de/worksheets/priorisierung) | Zeitmanagement für Geschäftsführer ⚡ Gratis Vorlage | H |
| [/worksheets/rechnungsvorlage](https://www.mission-mittelstand.de/worksheets/rechnungsvorlage) | Kostenlose Rechnungsvorlage für kleine Unternehmen | H |
| [/worksheets/smart-methode](https://www.mission-mittelstand.de/worksheets/smart-methode) | Smart Ziele für Unternehmen ⚡ Gratis Vorlage | H |
| [/worksheets/some-sichtbarkeit](https://www.mission-mittelstand.de/worksheets/some-sichtbarkeit) | Der optimale Instagram-Post für Unternehmen ⚡ Gratis Vorlage | H |
| [/worksheets/unternehmenswerte](https://www.mission-mittelstand.de/worksheets/unternehmenswerte) | Teambuilding Maßnahmen ⚡ Gratis Vorlage | H |
| [/worksheets/verkaufsaspekte](https://www.mission-mittelstand.de/worksheets/verkaufsaspekte) | Kunden überzeugen - Verkaufsprofi werden ⚡ Gratis Vorlage | H |
| [/worksheets/vertriebs-vorlage](https://www.mission-mittelstand.de/worksheets/vertriebs-vorlage) | In 5 Schritten zum hochwirksamen Angebot | H |
| [/worksheets/wunschkunden](https://www.mission-mittelstand.de/worksheets/wunschkunden) | Unternehmen positionieren ✚ Kunden anziehen⚡ Gratis Vorlage | H |
| [/worksheets/wunschmitarbeiter](https://www.mission-mittelstand.de/worksheets/wunschmitarbeiter) | Wunschmitarbeiter finden in 6 Schritten⚡ Gratis Vorlage | H |

### /branchen/ (67)

| URL | Seitentitel beim Abruf | Prüfung |
|---|---|---|
| [/branchen/autohauser](https://www.mission-mittelstand.de/branchen/autohauser) | Unternehmensberatung für Autohäuser | H |
| [/branchen/bau](https://www.mission-mittelstand.de/branchen/bau) | Unternehmensberatung für die Baubranche | H |
| [/branchen/konditoreien](https://www.mission-mittelstand.de/branchen/konditoreien) | Unternehmensberatung für Bäckereien & Konditoreien | H |
| [/branchen/lackierer](https://www.mission-mittelstand.de/branchen/lackierer) | Unternehmensberatung für Maler & Lackierer | H |
| [/branchen/optiker](https://www.mission-mittelstand.de/branchen/optiker) | Unternehmensberatung für Akustiker & Optiker – Mission Mittelstand | H |
| [/branchen/unternehmensberatung-abfallwirtschaft](https://www.mission-mittelstand.de/branchen/unternehmensberatung-abfallwirtschaft) | Unternehmensberatung für die Abfallwirtschaft | H |
| [/branchen/unternehmensberatung-agrar-landwirtschaft](https://www.mission-mittelstand.de/branchen/unternehmensberatung-agrar-landwirtschaft) | Unternehmensberatung für Agrar & Landwirtschaft | H |
| [/branchen/unternehmensberatung-akustiker-optiker](https://www.mission-mittelstand.de/branchen/unternehmensberatung-akustiker-optiker) | Unternehmensberatung für Akustiker & Optiker – Mission Mittelstand | H |
| [/branchen/unternehmensberatung-arzte](https://www.mission-mittelstand.de/branchen/unternehmensberatung-arzte) | Unternehmensberatung für Ärzte – Erfolgreiche Praxisführung | H |
| [/branchen/unternehmensberatung-baeckereien-konditoreien](https://www.mission-mittelstand.de/branchen/unternehmensberatung-baeckereien-konditoreien) | Unternehmensberatung für Bäckereien & Konditoreien | H |
| [/branchen/unternehmensberatung-baumaerkte](https://www.mission-mittelstand.de/branchen/unternehmensberatung-baumaerkte) | Unternehmensberatung für Baumärkte | H |
| [/branchen/unternehmensberatung-bestattungsunternehmen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-bestattungsunternehmen) | Unternehmensberatung für Bestattungsunternehmen | H |
| [/branchen/unternehmensberatung-buchhandel](https://www.mission-mittelstand.de/branchen/unternehmensberatung-buchhandel) | Unternehmensberatung für den Buchhandel | H |
| [/branchen/unternehmensberatung-dachdecker](https://www.mission-mittelstand.de/branchen/unternehmensberatung-dachdecker) | Unternehmensberatung für Dachdecker | H |
| [/branchen/unternehmensberatung-druckereien](https://www.mission-mittelstand.de/branchen/unternehmensberatung-druckereien) | Unternehmensberatung für Druckereien | H |
| [/branchen/unternehmensberatung-einzelhandel](https://www.mission-mittelstand.de/branchen/unternehmensberatung-einzelhandel) | Unternehmensberatung für den Einzelhandel | H |
| [/branchen/unternehmensberatung-elektrotechnik](https://www.mission-mittelstand.de/branchen/unternehmensberatung-elektrotechnik) | Unternehmensberatung für Elektrotechnik | H |
| [/branchen/unternehmensberatung-erneuerbare-energien](https://www.mission-mittelstand.de/branchen/unternehmensberatung-erneuerbare-energien) | Unternehmensberatung für Erneuerbare Energien | H |
| [/branchen/unternehmensberatung-eventmanagement](https://www.mission-mittelstand.de/branchen/unternehmensberatung-eventmanagement) | Unternehmensberatung für Eventmanagement | H |
| [/branchen/unternehmensberatung-fahrradhaendler](https://www.mission-mittelstand.de/branchen/unternehmensberatung-fahrradhaendler) | Unternehmensberatung für Fahrradhändler | H |
| [/branchen/unternehmensberatung-fahrschulen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-fahrschulen) | Unternehmensberatung für Fahrschulen | H |
| [/branchen/unternehmensberatung-feinkosthandel](https://www.mission-mittelstand.de/branchen/unternehmensberatung-feinkosthandel) | Unternehmensberatung für Feinkosthandel | H |
| [/branchen/unternehmensberatung-finanzdienstleister](https://www.mission-mittelstand.de/branchen/unternehmensberatung-finanzdienstleister) | Unternehmensberatung für Finanzdienstleister | H |
| [/branchen/unternehmensberatung-fitnessstudios](https://www.mission-mittelstand.de/branchen/unternehmensberatung-fitnessstudios) | Unternehmensberatung für Fitnessstudios | H |
| [/branchen/unternehmensberatung-fliesenleger](https://www.mission-mittelstand.de/branchen/unternehmensberatung-fliesenleger) | Unternehmensberatung für Fliesenleger | H |
| [/branchen/unternehmensberatung-floristen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-floristen) | Unternehmensberatung für Floristen | H |
| [/branchen/unternehmensberatung-fotografen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-fotografen) | Unternehmensberatung für Fotografen | H |
| [/branchen/unternehmensberatung-friseure](https://www.mission-mittelstand.de/branchen/unternehmensberatung-friseure) | Unternehmensberatung für Friseure | H |
| [/branchen/unternehmensberatung-gartenbau](https://www.mission-mittelstand.de/branchen/unternehmensberatung-gartenbau) | Unternehmensberatung für den Gartenbau | H |
| [/branchen/unternehmensberatung-geruestbau](https://www.mission-mittelstand.de/branchen/unternehmensberatung-geruestbau) | Unternehmensberatung für Gerüstbau | H |
| [/branchen/unternehmensberatung-gesundheitswesen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-gesundheitswesen) | Unternehmensberatung für das Gesundheitswesen | H |
| [/branchen/unternehmensberatung-getraenkehandel](https://www.mission-mittelstand.de/branchen/unternehmensberatung-getraenkehandel) | Unternehmensberatung für den Getränkehandel | H |
| [/branchen/unternehmensberatung-handwerker](https://www.mission-mittelstand.de/branchen/unternehmensberatung-handwerker) | Unternehmensberatung für Handwerker | H + V |
| [/branchen/unternehmensberatung-holzverarbeitung](https://www.mission-mittelstand.de/branchen/unternehmensberatung-holzverarbeitung) | Unternehmensberatung für Holzverarbeitung | H |
| [/branchen/unternehmensberatung-hotellerie](https://www.mission-mittelstand.de/branchen/unternehmensberatung-hotellerie) | Unternehmensberatung für Hotellerie | H |
| [/branchen/unternehmensberatung-hundeschulen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-hundeschulen) | Unternehmensberatung für Hundeschulen | H |
| [/branchen/unternehmensberatung-immobilienmakler](https://www.mission-mittelstand.de/branchen/unternehmensberatung-immobilienmakler) | Unternehmensberatung für Immobilienmakler | H |
| [/branchen/unternehmensberatung-it](https://www.mission-mittelstand.de/branchen/unternehmensberatung-it) | Unternehmensberatung für die IT-Branche | H |
| [/branchen/unternehmensberatung-juweliere](https://www.mission-mittelstand.de/branchen/unternehmensberatung-juweliere) | Unternehmensberatung für Juweliere | H |
| [/branchen/unternehmensberatung-kfz-werkstatt](https://www.mission-mittelstand.de/branchen/unternehmensberatung-kfz-werkstatt) | Unternehmensberatung für KfZ-Werkstätten | H |
| [/branchen/unternehmensberatung-kosmetikstudio](https://www.mission-mittelstand.de/branchen/unternehmensberatung-kosmetikstudio) | Unternehmensberatung für Kosmetiker | H |
| [/branchen/unternehmensberatung-logistik](https://www.mission-mittelstand.de/branchen/unternehmensberatung-logistik) | Unternehmensberatung für die Logistik | H |
| [/branchen/unternehmensberatung-maler-lackierer](https://www.mission-mittelstand.de/branchen/unternehmensberatung-maler-lackierer) | Unternehmensberatung für Maler & Lackierer | H |
| [/branchen/unternehmensberatung-medizintechnik](https://www.mission-mittelstand.de/branchen/unternehmensberatung-medizintechnik) | Unternehmensberatung für Medizintechnik | H |
| [/branchen/unternehmensberatung-metzger](https://www.mission-mittelstand.de/branchen/unternehmensberatung-metzger) | Unternehmensberatung für Metzger | H |
| [/branchen/unternehmensberatung-mobelhaeuser](https://www.mission-mittelstand.de/branchen/unternehmensberatung-mobelhaeuser) | Unternehmensberatung für Möbelhäuser – Lösungen für Wachstum und Effizienz | H |
| [/branchen/unternehmensberatung-modegeschaefte](https://www.mission-mittelstand.de/branchen/unternehmensberatung-modegeschaefte) | Unternehmensberatung für Modeläden | H |
| [/branchen/unternehmensberatung-musikschulen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-musikschulen) | Unternehmensberatung für Musikschulen | H |
| [/branchen/unternehmensberatung-nagelstudios](https://www.mission-mittelstand.de/branchen/unternehmensberatung-nagelstudios) | Unternehmensberatung für Nagelstudios | H |
| [/branchen/unternehmensberatung-photovoltaik](https://www.mission-mittelstand.de/branchen/unternehmensberatung-photovoltaik) | Unternehmensberatung für Photovoltaik | H |
| [/branchen/unternehmensberatung-physiotherapie](https://www.mission-mittelstand.de/branchen/unternehmensberatung-physiotherapie) | Unternehmensberatung für Physiotherapie | H |
| [/branchen/unternehmensberatung-reiseburo](https://www.mission-mittelstand.de/branchen/unternehmensberatung-reiseburo) | Unternehmensberatung für Reisebüros | H |
| [/branchen/unternehmensberatung-schlossereien](https://www.mission-mittelstand.de/branchen/unternehmensberatung-schlossereien) | Unternehmensberatung für Schlossereien | H |
| [/branchen/unternehmensberatung-schornsteinfeger](https://www.mission-mittelstand.de/branchen/unternehmensberatung-schornsteinfeger) | Unternehmensberatung für Schornsteinfeger | H |
| [/branchen/unternehmensberatung-shk](https://www.mission-mittelstand.de/branchen/unternehmensberatung-shk) | Unternehmensberatung für SHK | H |
| [/branchen/unternehmensberatung-sicherheitsdienste](https://www.mission-mittelstand.de/branchen/unternehmensberatung-sicherheitsdienste) | Unternehmensberatung für Sicherheitsdienste | H |
| [/branchen/unternehmensberatung-smart-home](https://www.mission-mittelstand.de/branchen/unternehmensberatung-smart-home) | Unternehmensberatung für Smart-Home-Dienstleister | H |
| [/branchen/unternehmensberatung-stahlbau](https://www.mission-mittelstand.de/branchen/unternehmensberatung-stahlbau) | Unternehmensberatung für Stahl- und Metallbau | H |
| [/branchen/unternehmensberatung-steuerberater](https://www.mission-mittelstand.de/branchen/unternehmensberatung-steuerberater) | Unternehmensberatung für Steuerberater | H |
| [/branchen/unternehmensberatung-tattoostudios](https://www.mission-mittelstand.de/branchen/unternehmensberatung-tattoostudios) | Unternehmensberatung für Tattoostudios | H |
| [/branchen/unternehmensberatung-taxiunternehmen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-taxiunternehmen) | Unternehmensberatung für Taxiunternehmen | H |
| [/branchen/unternehmensberatung-textilreinigungen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-textilreinigungen) | Unternehmensberatung für Textilreinigungen | H |
| [/branchen/unternehmensberatung-tierhandlungen](https://www.mission-mittelstand.de/branchen/unternehmensberatung-tierhandlungen) | Unternehmensberatung für Tierhandlungen | H |
| [/branchen/unternehmensberatung-tourismus](https://www.mission-mittelstand.de/branchen/unternehmensberatung-tourismus) | Unternehmensberatung für Tourismus | H |
| [/branchen/unternehmensberatung-veranstaltungstechnik](https://www.mission-mittelstand.de/branchen/unternehmensberatung-veranstaltungstechnik) | Unternehmensberatung für Veranstaltungstechnik | H |
| [/branchen/unternehmensberatung-verpackungsindustrie](https://www.mission-mittelstand.de/branchen/unternehmensberatung-verpackungsindustrie) | Unternehmensberatung in der Verpackungsindustrie | H |
| [/branchen/unternehmensberatung-versicherungsmakler](https://www.mission-mittelstand.de/branchen/unternehmensberatung-versicherungsmakler) | Unternehmensberatung für Versicherungsmakler | H |

### /blog/ (84)

| URL | Seitentitel beim Abruf | Prüfung |
|---|---|---|
| [/blog/3-tipps-fur-deinen-social-media-kanal](https://www.mission-mittelstand.de/blog/3-tipps-fur-deinen-social-media-kanal) | 3 Social Media Tipps für dein mittelständisches UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/abmahnung-schreiben-wann-sie-notig-ist-und-wie-du-sie-korrekt-formulierst](https://www.mission-mittelstand.de/blog/abmahnung-schreiben-wann-sie-notig-ist-und-wie-du-sie-korrekt-formulierst) | Inhalt einer Abmahnung: So schreibst du sie richtigFacebook iconLinkedIn icon | H |
| [/blog/agiles-projektmanagement-kmu](https://www.mission-mittelstand.de/blog/agiles-projektmanagement-kmu) | Agiles Projektmanagement für KMU – Mission MittelstandFacebook iconLinkedIn icon | H |
| [/blog/angemessenes-gehalt-als-geschaeftsfuehrer](https://www.mission-mittelstand.de/blog/angemessenes-gehalt-als-geschaeftsfuehrer) | Angemessenes Geschäftsführergehalt im MittelstandFacebook iconLinkedIn icon | H |
| [/blog/arbeitsvertrag-richtig-erstellen-diese-inhalte-durfen-nicht-fehlen](https://www.mission-mittelstand.de/blog/arbeitsvertrag-richtig-erstellen-diese-inhalte-durfen-nicht-fehlen) | Inhalt eines Arbeitsvertrags ✏️ Diese Punkte dürfen nicht fehlen!Facebook iconLinkedIn icon | H |
| [/blog/aufgaben-als-fuhrungskraft-delegieren-so-machst-du-dein-unternehmen-unabhangig-von-dir](https://www.mission-mittelstand.de/blog/aufgaben-als-fuhrungskraft-delegieren-so-machst-du-dein-unternehmen-unabhangig-von-dir) | Aufgaben als Führungskraft erfolgreich delegierenFacebook iconLinkedIn icon | H |
| [/blog/aufgaben-einer-geschaftsfuehrung](https://www.mission-mittelstand.de/blog/aufgaben-einer-geschaftsfuehrung) | Aufgaben einer Geschäftsführung: Ein umfassender LeitfadenFacebook iconLinkedIn icon | H |
| [/blog/azubis-als-top-mitarbeiter](https://www.mission-mittelstand.de/blog/azubis-als-top-mitarbeiter) | Azubis in KMU fördern – Deine Zukunft sichernFacebook iconLinkedIn icon | H |
| [/blog/beratung-familienunternehmen](https://www.mission-mittelstand.de/blog/beratung-familienunternehmen) | Professionelle Beratung für FamilienunternehmenFacebook iconLinkedIn icon | H |
| [/blog/brand-ambassador-marketing-so-machst-du-deine-mitarbeiter-zu-markenbotschaftern](https://www.mission-mittelstand.de/blog/brand-ambassador-marketing-so-machst-du-deine-mitarbeiter-zu-markenbotschaftern) | Brand Ambassador Marketing für kleine UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/businessplan-fuer-kmu](https://www.mission-mittelstand.de/blog/businessplan-fuer-kmu) | Businessplan für KMU ✏️ Leitfaden für kleine UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/chef-oder-kumpel-wie-du-eine-respektvolle-fuehrungskultur-etablierst](https://www.mission-mittelstand.de/blog/chef-oder-kumpel-wie-du-eine-respektvolle-fuehrungskultur-etablierst) | Mitarbeiterführung im Mittelstand: Chef oder Kumpel?Facebook iconLinkedIn icon | H |
| [/blog/controlling-in-kmu](https://www.mission-mittelstand.de/blog/controlling-in-kmu) | Controlling in KMU: Rechnungswesen für den MittelstandFacebook iconLinkedIn icon | H |
| [/blog/customer-experience-management-im-mittelstand](https://www.mission-mittelstand.de/blog/customer-experience-management-im-mittelstand) | Customer Experience Management im MittelstandFacebook iconLinkedIn icon | H |
| [/blog/das-pareto-prinzip](https://www.mission-mittelstand.de/blog/das-pareto-prinzip) | Das Pareto-Prinzip 🚀 Effizienzsteigerung für KMUsFacebook iconLinkedIn icon | H |
| [/blog/deine-prozesse-brauchen-ein-update-drei-klare-anzeichen-dass-du-handeln-musst](https://www.mission-mittelstand.de/blog/deine-prozesse-brauchen-ein-update-drei-klare-anzeichen-dass-du-handeln-musst) | Drei Anzeichen für notwendige Prozessoptimierung in KMUsFacebook iconLinkedIn icon | H |
| [/blog/deine-umwandlungsrate-im-vertrieb-optimieren](https://www.mission-mittelstand.de/blog/deine-umwandlungsrate-im-vertrieb-optimieren) | Umwandlungsrate im Vertrieb optimieren – Mission MittelstandFacebook iconLinkedIn icon | H |
| [/blog/der-deutsche-mittelstand](https://www.mission-mittelstand.de/blog/der-deutsche-mittelstand) | Mittelstand in Deutschland: Bedeutung und ChancenFacebook iconLinkedIn icon | H |
| [/blog/der-richtige-inhalt-fuer-deine-stellenbeschreibungen](https://www.mission-mittelstand.de/blog/der-richtige-inhalt-fuer-deine-stellenbeschreibungen) | Inhalt einer Stellenbeschreibung – So gelingt deine StellenanzeigeFacebook iconLinkedIn icon | H |
| [/blog/die-7-phasen-eines-erfolgreichen-verkaufsgesprachs](https://www.mission-mittelstand.de/blog/die-7-phasen-eines-erfolgreichen-verkaufsgesprachs) | Die 7 Phasen eines erfolgreichen VerkaufsgesprächsFacebook iconLinkedIn icon | H |
| [/blog/die-luege-vom-fachkraeftemangel](https://www.mission-mittelstand.de/blog/die-luege-vom-fachkraeftemangel) | Fachkräftemangel Lüge ❌ Was wirklich dahinter stecktFacebook iconLinkedIn icon | H |
| [/blog/digitale-tools-kmu](https://www.mission-mittelstand.de/blog/digitale-tools-kmu) | Die besten digitalen Tools für kleine & mittlere UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/digitalisierung-im-mittelstand](https://www.mission-mittelstand.de/blog/digitalisierung-im-mittelstand) | Digitalisierung für Unternehmen im Mittelstand – Mission MittelstandFacebook iconLinkedIn icon | H |
| [/blog/e-commerce-im-mittelstand](https://www.mission-mittelstand.de/blog/e-commerce-im-mittelstand) | E-Commerce im Mittelstand: Chancen und WachstumFacebook iconLinkedIn icon | H |
| [/blog/e-mail-marketing-im-mittelstand](https://www.mission-mittelstand.de/blog/e-mail-marketing-im-mittelstand) | E-Mail-Marketing im Mittelstand: So geht’s effektiv!Facebook iconLinkedIn icon | H |
| [/blog/effektive-liquiditatsplanung-fur-kmu](https://www.mission-mittelstand.de/blog/effektive-liquiditatsplanung-fur-kmu) | Liquiditätsplanung für KMU – So sicherst du deine FinanzenFacebook iconLinkedIn icon | H |
| [/blog/effizient-wachsen-wann-outsourcing-fur-dein-kmu-sinnvoll-ist](https://www.mission-mittelstand.de/blog/effizient-wachsen-wann-outsourcing-fur-dein-kmu-sinnvoll-ist) | Outsourcing für KMU: Effizient wachsen & Kosten sparenFacebook iconLinkedIn icon | H |
| [/blog/effiziente-uebergabe-so-erstellst-du-ein-sicheres-und-klares-uebergabeprotokoll](https://www.mission-mittelstand.de/blog/effiziente-uebergabe-so-erstellst-du-ein-sicheres-und-klares-uebergabeprotokoll) | Übergabeprotokoll von Mitarbeitern: Klare AufgabenübergabeFacebook iconLinkedIn icon | H |
| [/blog/effizienzsteigerung-in-deinem-unternehmen-5-massnahmen-die-sofort-wirken](https://www.mission-mittelstand.de/blog/effizienzsteigerung-in-deinem-unternehmen-5-massnahmen-die-sofort-wirken) | Effizienzsteigerung im Unternehmen: 5 Maßnahmen, die sofort wirkenFacebook iconLinkedIn icon | H |
| [/blog/eisenhower-prinzip-fur-dein-unternehmen](https://www.mission-mittelstand.de/blog/eisenhower-prinzip-fur-dein-unternehmen) | Das Eisenhower-Prinzip: Effektives ZeitmanagementFacebook iconLinkedIn icon | H |
| [/blog/employer-branding-fur-kmu](https://www.mission-mittelstand.de/blog/employer-branding-fur-kmu) | Employer Branding für KMU: So gewinnst du die besten TalenteFacebook iconLinkedIn icon | H |
| [/blog/entscheidungsfindung-als-geschaftsfuhrer](https://www.mission-mittelstand.de/blog/entscheidungsfindung-als-geschaftsfuhrer) | Methoden zur Entscheidungsfindung für KMU-GeschäftsführerFacebook iconLinkedIn icon | H |
| [/blog/erfolgreiche-einarbeitung-die-ultimative-schritt-fur-schritt-anleitung-fuer-neue-mitarbeiter](https://www.mission-mittelstand.de/blog/erfolgreiche-einarbeitung-die-ultimative-schritt-fur-schritt-anleitung-fuer-neue-mitarbeiter) | Facebook iconLinkedIn icon | H |
| [/blog/erfolgreiches-community-management-fur-kmu](https://www.mission-mittelstand.de/blog/erfolgreiches-community-management-fur-kmu) | Erfolgreiches Community Management für KMUFacebook iconLinkedIn icon | H |
| [/blog/erfolgsstrategien-fur-dein-kmu](https://www.mission-mittelstand.de/blog/erfolgsstrategien-fur-dein-kmu) | Mitarbeiterentwicklung im Mittelstand: Strategien für nachhaltigen ErfolgFacebook iconLinkedIn icon | H |
| [/blog/fachkraeftemangel-im-handwerk](https://www.mission-mittelstand.de/blog/fachkraeftemangel-im-handwerk) | Fachkräftemangel im HandwerkFacebook iconLinkedIn icon | H |
| [/blog/finanzmanagement-mittelstand](https://www.mission-mittelstand.de/blog/finanzmanagement-mittelstand) | Finanzmanagement im Mittelstand – Dein LeitfadenFacebook iconLinkedIn icon | H |
| [/blog/fordermittel-fur-kmu](https://www.mission-mittelstand.de/blog/fordermittel-fur-kmu) | Fördermittel für KMU: So sicherst du dir finanzielle UnterstützungFacebook iconLinkedIn icon | H |
| [/blog/innovationsmanagement-und-kreativitatsforderung-im-mittelstand](https://www.mission-mittelstand.de/blog/innovationsmanagement-und-kreativitatsforderung-im-mittelstand) | Innovationsmanagement und Kreativitätsförderung im MittelstandFacebook iconLinkedIn icon | H |
| [/blog/jahresziele-sind-zu-langsam--so-planst-du-als-geschaeftsfuhrer-in-quartalen-mit-echtem-fortschritt](https://www.mission-mittelstand.de/blog/jahresziele-sind-zu-langsam--so-planst-du-als-geschaeftsfuhrer-in-quartalen-mit-echtem-fortschritt) | Quartalsziele planen: Warum Jahresziele dich bremsenFacebook iconLinkedIn icon | H |
| [/blog/kommunikation-in-kmu](https://www.mission-mittelstand.de/blog/kommunikation-in-kmu) | Kommunikation in KMU verbessern – Tipps für kleine und mittelständische UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/kunstliche-intelligenz-im-mittelstand](https://www.mission-mittelstand.de/blog/kunstliche-intelligenz-im-mittelstand) | KI im Mittelstand ➡️ Revolution 🚀 oder Luftnummer ❌ ❓Facebook iconLinkedIn icon | H |
| [/blog/marketing-im-mittelstand](https://www.mission-mittelstand.de/blog/marketing-im-mittelstand) | Marketing im Mittelstand – Wege zum nachhaltigen ErfolgFacebook iconLinkedIn icon | H |
| [/blog/marktanalyse-fuer-kmu](https://www.mission-mittelstand.de/blog/marktanalyse-fuer-kmu) | Marktanalyse für kleine und mittelständische Unternehmen (KMU)Facebook iconLinkedIn icon | H |
| [/blog/marktpositionierung-als-kmu](https://www.mission-mittelstand.de/blog/marktpositionierung-als-kmu) | Marktpositionierung als KMU: Aufträge gewinnen & wachsenFacebook iconLinkedIn icon | H |
| [/blog/mehr-erreichen-als-unternehmer-3-gute-grunde-fur-regelmaessige-weiterbildung](https://www.mission-mittelstand.de/blog/mehr-erreichen-als-unternehmer-3-gute-grunde-fur-regelmaessige-weiterbildung) | Weiterbildung als Geschäftsführer: 3 gute Gründe für deinen ErfolgFacebook iconLinkedIn icon | H |
| [/blog/mehr-umsatz-durch-cross-selling](https://www.mission-mittelstand.de/blog/mehr-umsatz-durch-cross-selling) | Cross Selling im Mittelstand: Wie du deinen Umsatz clever steigerstFacebook iconLinkedIn icon | H |
| [/blog/mindset-wandel-fur-unternehmer](https://www.mission-mittelstand.de/blog/mindset-wandel-fur-unternehmer) | Bedeutung des Mindset-Wandels für UnternehmerFacebook iconLinkedIn icon | H |
| [/blog/mitarbeitermotivation-im-mittelstand](https://www.mission-mittelstand.de/blog/mitarbeitermotivation-im-mittelstand) | Mitarbeitermotivation für den Mittelstand – Mission MittelstandFacebook iconLinkedIn icon | H |
| [/blog/neukundenakquise-fur-kmu](https://www.mission-mittelstand.de/blog/neukundenakquise-fur-kmu) | Erfolgreiche Neukundenakquise für KMU – Tipps & StrategienFacebook iconLinkedIn icon | H |
| [/blog/online-marketing-fuer-kleine-unternehmen](https://www.mission-mittelstand.de/blog/online-marketing-fuer-kleine-unternehmen) | Online Marketing für kleine Unternehmen ⚙️ 5 Tipps & ToolsFacebook iconLinkedIn icon | H |
| [/blog/organigramm-in-kmu](https://www.mission-mittelstand.de/blog/organigramm-in-kmu) | Organigramm als Erfolgsfaktor für KMUFacebook iconLinkedIn icon | H |
| [/blog/perfektes-onboarding](https://www.mission-mittelstand.de/blog/perfektes-onboarding) | Onboarding neuer Mitarbeiter – Tipps und ChecklistenFacebook iconLinkedIn icon | H |
| [/blog/preisstrategien-im-mittelstand](https://www.mission-mittelstand.de/blog/preisstrategien-im-mittelstand) | Preisstrategien in KMU: Zwischen Premium- und NiedrigpreisFacebook iconLinkedIn icon | H |
| [/blog/priorisierungstechniken-fuer-geschaftsfuhrer](https://www.mission-mittelstand.de/blog/priorisierungstechniken-fuer-geschaftsfuhrer) | Priorisierungstechniken für Geschäftsführer – Ein LeitfadenFacebook iconLinkedIn icon | H |
| [/blog/projektmanagement-in-kmu](https://www.mission-mittelstand.de/blog/projektmanagement-in-kmu) | Effektives Projektmanagement in KMUFacebook iconLinkedIn icon | H |
| [/blog/prozessoptimierung-fur-kleine-und-mittelstandische-unternehmen](https://www.mission-mittelstand.de/blog/prozessoptimierung-fur-kleine-und-mittelstandische-unternehmen) | Prozessoptimierung für kleine & mittelständische UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/qualifiziertes-arbeitszeugnis-erstellen-so-bewertest-du-mitarbeiter-professionell](https://www.mission-mittelstand.de/blog/qualifiziertes-arbeitszeugnis-erstellen-so-bewertest-du-mitarbeiter-professionell) | Qualifiziertes Arbeitszeugnis erstellen – So geht’s richtigFacebook iconLinkedIn icon | H |
| [/blog/qualitaetsmanagement-fuer-kleine-und-mittlere-unternehmen](https://www.mission-mittelstand.de/blog/qualitaetsmanagement-fuer-kleine-und-mittlere-unternehmen) | Optimales Qualitätsmanagement für kleine und mittlere UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/recruiting-im-handwerk](https://www.mission-mittelstand.de/blog/recruiting-im-handwerk) | Mitarbeiter finden im Handwerk ⛏️ In 6 Schritten zum ErfolgFacebook iconLinkedIn icon | H |
| [/blog/recruiting-im-mittelstand](https://www.mission-mittelstand.de/blog/recruiting-im-mittelstand) | Erfolgreiches Recruiting im MittelstandFacebook iconLinkedIn icon | H |
| [/blog/recruiting-in-der-gastronomie](https://www.mission-mittelstand.de/blog/recruiting-in-der-gastronomie) | Personal in der Gastronomie finden: Ein praxisnaher LeitfadenFacebook iconLinkedIn icon | H |
| [/blog/resilienz-und-anpassungsfahigkeit-von-geschaftsfuhrern-im-mittelstand](https://www.mission-mittelstand.de/blog/resilienz-und-anpassungsfahigkeit-von-geschaftsfuhrern-im-mittelstand) | Anpassungsfähigkeit von Geschäftsführern im MittelstandFacebook iconLinkedIn icon | H |
| [/blog/risikomanagement-in-kmu](https://www.mission-mittelstand.de/blog/risikomanagement-in-kmu) | Erfolgreiches Risikomanagement in KMUFacebook iconLinkedIn icon | H |
| [/blog/sichtbarkeit-steigern-so-wird-dein-unternehmen-fur-deine-zielgruppe-unubersehbar](https://www.mission-mittelstand.de/blog/sichtbarkeit-steigern-so-wird-dein-unternehmen-fur-deine-zielgruppe-unubersehbar) | Sichtbarkeit von Unternehmen steigern: Praxisnahe Tipps für KMUFacebook iconLinkedIn icon | H |
| [/blog/skaliere-dein-kmu](https://www.mission-mittelstand.de/blog/skaliere-dein-kmu) | Nachhaltige Skalierung im Mittelstand: Erfolgreich wachsenFacebook iconLinkedIn icon | H |
| [/blog/smart-ziele-fur-geschaftsfuhrer](https://www.mission-mittelstand.de/blog/smart-ziele-fur-geschaftsfuhrer) | SMART-Ziele für Geschäftsführer: Erfolgreich Ziele definieren und erreichenFacebook iconLinkedIn icon | H |
| [/blog/so-erstellst-du-ein-mitarbeiterhandbuch-das-wirklich-genutzt-wird](https://www.mission-mittelstand.de/blog/so-erstellst-du-ein-mitarbeiterhandbuch-das-wirklich-genutzt-wird) | Mitarbeiterhandbuch erstellen: So gelingt die UmsetzungFacebook iconLinkedIn icon | H + V |
| [/blog/social-media-strategien-fur-kmu](https://www.mission-mittelstand.de/blog/social-media-strategien-fur-kmu) | Social Media Strategien für kleine und mittlere UnternehmenFacebook iconLinkedIn icon | H |
| [/blog/social-proof-fur-kmu](https://www.mission-mittelstand.de/blog/social-proof-fur-kmu) | Social Proof für Unternehmen: Mit Kundenstimmen Wachstum sichernFacebook iconLinkedIn icon | H |
| [/blog/storytelling-marketing-fur-kmu](https://www.mission-mittelstand.de/blog/storytelling-marketing-fur-kmu) | Storytelling Marketing im Mittelstand 🚀 So geht'sFacebook iconLinkedIn icon | H |
| [/blog/strategische-unternehmensplanung](https://www.mission-mittelstand.de/blog/strategische-unternehmensplanung) | Strategische Unternehmensplanung: Der Weg zum ErfolgFacebook iconLinkedIn icon | H |
| [/blog/umgang-mit-kritik-als-geschaftsfuhrer](https://www.mission-mittelstand.de/blog/umgang-mit-kritik-als-geschaftsfuhrer) | Kritikfähigkeit als Geschäftsführer: Erfolgsfaktor für WachstumFacebook iconLinkedIn icon | H |
| [/blog/unternehmensberatung-fur-mich-als-kmu-sinnvoll](https://www.mission-mittelstand.de/blog/unternehmensberatung-fur-mich-als-kmu-sinnvoll) | Unternehmensberatung – Ein Muss für KMU oder überflüssiger Luxus?Facebook iconLinkedIn icon | H |
| [/blog/unternehmenskultur-im-mittelstand](https://www.mission-mittelstand.de/blog/unternehmenskultur-im-mittelstand) | Unternehmenskultur im Mittelstand entwickelnFacebook iconLinkedIn icon | H |
| [/blog/unterschied-prokurist-und-geschaftsfuehrer](https://www.mission-mittelstand.de/blog/unterschied-prokurist-und-geschaftsfuehrer) | Unterschied zwischen Prokurist GeschäftsführerFacebook iconLinkedIn icon | H |
| [/blog/urlaubsantrag-genehmigen-diese-5-regeln-solltest-du-kennen](https://www.mission-mittelstand.de/blog/urlaubsantrag-genehmigen-diese-5-regeln-solltest-du-kennen) | Urlaubsantrag genehmigen – Diese 5 Regeln solltest du kennen!Facebook iconLinkedIn icon | H |
| [/blog/vertrieb-im-mittelstand](https://www.mission-mittelstand.de/blog/vertrieb-im-mittelstand) | Vertrieb im Mittelstand: Traditionelle Werte & digitale ZukunftFacebook iconLinkedIn icon | H |
| [/blog/wann-tiktok-fur-dich-als-unternehmer-sinn-ergibt-und-wann-nicht](https://www.mission-mittelstand.de/blog/wann-tiktok-fur-dich-als-unternehmer-sinn-ergibt-und-wann-nicht) | TikTok für kleine Unternehmen: Wie du die Plattform sinnvoll nutztFacebook iconLinkedIn icon | H |
| [/blog/warum-dein-unternehmen-an-dir-klebt-und-wie-du-es-systematisch-entkoppelst](https://www.mission-mittelstand.de/blog/warum-dein-unternehmen-an-dir-klebt-und-wie-du-es-systematisch-entkoppelst) | Warum dein Unternehmen an dir klebt – und wie du es systematisch entkoppelst​Facebook iconLinkedIn icon | H |
| [/blog/warum-deine-meetings-zeitverschwendung-sind-und-wie-du-sie-produktiv-machst](https://www.mission-mittelstand.de/blog/warum-deine-meetings-zeitverschwendung-sind-und-wie-du-sie-produktiv-machst) | Meetings effizient gestalten: So sparst du Zeit und NervenFacebook iconLinkedIn icon | H |
| [/blog/wichtige-kennzahlen-in-unternehmen-diese-5-zahlen-musst-du-als-geschaftsfuhrer-woechentlich-checken](https://www.mission-mittelstand.de/blog/wichtige-kennzahlen-in-unternehmen-diese-5-zahlen-musst-du-als-geschaftsfuhrer-woechentlich-checken) | Die 5 wichtigsten Unternehmenskennzahlen für dein KMUFacebook iconLinkedIn icon | H |
| [/blog/wie-du-mit-einem-gesprachsleitfaden-fuer-vorstellungsgespraeche-die-besten-talente-ueberzeugst](https://www.mission-mittelstand.de/blog/wie-du-mit-einem-gesprachsleitfaden-fuer-vorstellungsgespraeche-die-besten-talente-ueberzeugst) | Optimale Gesprächsleitfaden für VorstellungsprächeFacebook iconLinkedIn icon | H |
| [/blog/zeitmanagement-methoden-fur-geschaftsfuhrer-und-fuhrungskrafte](https://www.mission-mittelstand.de/blog/zeitmanagement-methoden-fur-geschaftsfuhrer-und-fuhrungskrafte) | Zeitmanagement für Führungskräfte ⚡ 5 bewährte MethodenFacebook iconLinkedIn icon | H |

### Ergänzende interne Links (4)

| Angefragte URL | Ergebnis |
|---|---|
| [/galabau](https://www.mission-mittelstand.de/galabau) | Weiterleitung zu [/fallstudien/galabau](https://www.mission-mittelstand.de/fallstudien/galabau), Ziel HTTP 200 |
| [/mittelstandsberatung/personalmanagement](https://www.mission-mittelstand.de/mittelstandsberatung/personalmanagement) | Weiterleitung zu [/blog](https://www.mission-mittelstand.de/blog), Ziel HTTP 200 |
| [/old-home](https://www.mission-mittelstand.de/old-home) | HTTP 404; keine Designreferenz |
| [/seminare](https://www.mission-mittelstand.de/seminare) | Weiterleitung zu [/intensiv-events](https://www.mission-mittelstand.de/intensiv-events), Ziel HTTP 200 |

### Technischer Fingerabdruck des Referenzstands

- `sitemap.xml`: SHA-256 `92feacd0e890937a8cbdcc8ab0bdcbe3574504bad8b7c62617887244493fc1fc`
- `styles-0.css`: SHA-256 `914b598d59d9cfbe3d0ae1e630869d064582f3218e217a5e3aab0a5b80d16012`

Die Hashes identifizieren den untersuchten Sitemap- und CSS-Stand. Sie ersetzen keine spätere Live-Prüfung nach Änderungen an der Website.
