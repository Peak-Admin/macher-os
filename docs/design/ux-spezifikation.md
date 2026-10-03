# Handwerk OS: moderne, elegante und vertraute Bedienung

Verbindliche Umsetzungsspezifikation für Claude Code · 2. Oktober 2026

## 0. Auftrag und Ziel

Überarbeite Marketingseiten, Marketingnavigation und App von Handwerk OS nach dieser Spezifikation. Die wichtigste Qualität ist eine verständliche User Experience für wenig technikaffine Handwerker. Das Ergebnis soll modern und elegant wirken, sich aber sofort vertraut bedienen lassen.

**Leitsatz: „Das sieht ordentlich aus. Das verstehe ich. Damit kann ich arbeiten.“**

Reihenfolge bei Zielkonflikten:

1. Aufgabe verstehen und zuverlässig erledigen.
2. Orientierung, Lesbarkeit und Fehlertoleranz.
3. Konsistente, ruhige Gestaltung.
4. Markenwirkung und dekorative Details.

Eleganz entsteht durch präzise Abstände, klare Typografie, konsistente Komponenten und wenige konkurrierende Entscheidungen. Die Oberfläche soll keine Kenntnisse über Softwarekonzepte, KI-Prompts oder versteckte Gesten voraussetzen.

### Arbeitsweise

- Implementiere im vorhandenen Repository und bestehenden Komponentenmodell. Bestehende Regeln in AGENTS.md und die vorhandene Designarchitektur berücksichtigen.
- Vor Änderungen Branch, Arbeitsverzeichnis und uncommittete Änderungen prüfen. Parallele Arbeit bewahren; bei Bedarf isolierten Worktree verwenden.
- Zuerst vorhandene Tokens, Komponenten und Bilder inventarisieren. Bestehende Komponenten korrigieren, bevor neue Varianten angelegt werden.
- Alle Codebeispiele unten sind **Zielspezifikationen**. Die tatsächlichen Quelldateien, Klassennamen, Routingbibliothek und CSS-Architektur wurden für dieses Dokument nicht geprüft. Ordne die Beispiele den echten Komponenten zu. Erzeuge keine zweite UI neben der bestehenden.
- Die vorgeschlagenen `data-surface`- und `data-ui`-Attribute können als stabile Styling-Hooks verwendet werden. Alternativ dieselben Regeln in vorhandene CSS-Module oder Utility-Klassen übersetzen.
- Alle Funktionen, Berechtigungen, Daten, Routen und Integrationen erhalten. Änderungen an sichtbarer Priorität dürfen keine Funktionen unauffindbar machen.
- Preise, Leistungsversprechen, automatische Aktionen und Kundenergebnisse nicht erfinden oder verändern.
- Dieses Dokument ist ein Implementierungsbriefing. Es ist keine zusätzliche Freigabe für Deployment, Veröffentlichung oder externe Kommunikation. Maßgeblich ist die im ausführenden Chat tatsächlich erteilte Freigabe.

## 1. Ausgangslage und Evidenz

Live geprüfte Referenzen:

- Marketing: <https://macher-os.vercel.app/>
- Funktionsseite: <https://macher-os.vercel.app/funktionen/einsatzplanung>
- Gewerkeseite: <https://macher-os.vercel.app/gewerke/elektriker>
- Preise: <https://macher-os.vercel.app/preise>
- Kunden: <https://macher-os.vercel.app/kunden>
- Aktuelle integrierte App: <https://macher-os.vercel.app/os/heute>
- Aufträge: <https://macher-os.vercel.app/os/auftraege/auftraege>
- Auftrag anlegen: <https://macher-os.vercel.app/os/auftraege/auftraege/neu>
- Betrieb: <https://macher-os.vercel.app/os/betrieb>
- Kalender: <https://macher-os.vercel.app/os/plan/kalender>

Zusätzlich wurde die separate App-Domain `macher-os-app.vercel.app` betrachtet. Sie unterscheidet sich sichtbar von der integrierten App. **Die integrierte App ist die Referenz für dieses Briefing.** Vor Umsetzung die aktuelle Deployment-/Repository-Zuordnung feststellen.

Beobachtungen aus der visuellen Prüfung, keine vollständige Funktionsprüfung:

| Befund | Konsequenz |
|---|---|
| Vier App-Hauptbereiche sind vorhanden: Heute, Aufträge, Planen, Betrieb. | Behalten und konsistent gestalten. |
| Werkstattfoto scheint durch große Arbeitsflächen. | Arbeitsinhalt deckend gestalten. |
| Mehrere dunkle Segmentleisten, Tabs und Filter konkurrieren. | Eine klare Hierarchie der Steuerelemente herstellen. |
| Einrichtung und Warnungen stehen vor dem Tagesablauf. | Startseite nach tatsächlicher Rolle und Dringlichkeit priorisieren. |
| Auftragsformular zeigt mehrere optionale Adressfelder sofort. | Bekannte Daten übernehmen und zusätzliche Eingaben bedarfsgerecht öffnen. |
| Funktions-Mega-Menü: 32 Funktionslinks und zwei weiterführende Links. | Doppelte Ziele zusammenführen; verständliche Kernauswahl. |
| Gewerke-Menü: zwei lange Textspalten mit insgesamt 16 Links. | Die acht hervorgehobenen Gewerke als kompakte Bildzeilen darstellen. |
| Wissen-Menü: Wissen, Hilfe und Werkzeuge; zusätzliche Links im Abschluss. | Kürzere Gruppen und ein gezielter visueller Einstieg. |
| Bei 390 px wechselte der mobile Menüknopf zu „Schließen“, die Menüfläche blieb aber unsichtbar hinter dem Seiteninhalt. Wiederholtes Öffnen zeigte dasselbe Verhalten. | Priorität P0: tatsächliche Sichtbarkeit und Bedienbarkeit korrigieren. |
| Das mobile Navigationselement war laut DOM sichtbar, `position: static`, `z-index: auto`, mit einer Fläche unterhalb der Kopfzeile. | Verdacht auf Schichtung/Überdeckung. **Die konkrete CSS-Ursache ist noch nicht nachgewiesen.** |

Die früher vergebenen Designpunkte sind subjektive Orientierung. Keine neuen Punktzahlen als Ersatz für die Abnahme verwenden. Entscheidend sind die Kriterien in Abschnitt 12.

## 2. Verbindliche gestalterische Entscheidungen

### Behalten

- Grüne Markenidentität, direkte deutsche Sprache, verständliche Fachbegriffe.
- Vier feste App-Hauptbereiche; mobile Navigation am unteren Rand.
- Sichtbare Beschriftungen an Navigation und wichtigen Aktionen.
- Vertraute Listen, Kalender, Formulare und klare Buttons.
- Bestehende Fotos, soweit passend und in ausreichender Qualität vorhanden.
- Eine bestehende, gut lesbare Markenschrift. Kein Fontwechsel allein für vermeintliche Modernität.

### Vermeiden

- Durchscheinende Fotos hinter Daten, Formularen, Aufträgen und Tabellen.
- Große dunkle Balken für untergeordnete Ansichtswechsel.
- Nur beim Hover erkennbare Aktionen; reine Icon-Navigation als Standard.
- Ein globales Plus-Menü mit vielen möglichen Vorgängen.
- Drag-and-drop, Swipe oder freie KI-Eingabe als einziger Weg zur Aufgabe.
- Dekorative 3D-Objekte, animierte Hintergründe, bewegliche Menüvorschauen oder Auto-Carousels.
- Ein wiederkehrendes Markenintro vor täglicher Arbeit.
- Wichtige Aktionen pauschal unter drei Punkten verstecken.
- Symmetrische Kachelraster als universelle Lösung für jede Seite.
- Kleine, kontrastarme Schrift, um mehr Informationen auf den Screen zu pressen.

## 3. Design-Tokens und CSS-Grundlage

Die folgenden Werte sind konkrete Startwerte. Existiert ein verbindlicher Markenfarbwert, wird dieser gezielt übernommen und auf Kontrast geprüft. **Nicht mehrere konkurrierende Grüntöne für gleichartige Aktionen verwenden.**

```css
/* In vorhandene semantische Tokens integrieren. Kein zweites Theme anlegen. */
:root {
  --mo-canvas: #f5f6f3;
  --mo-surface: #ffffff;
  --mo-surface-subtle: #eef1ed;
  --mo-text: #222c26;
  --mo-text-secondary: #536057;
  --mo-text-muted: #626e65;
  --mo-border: #dce2dc;          /* dekorative Trennlinien */
  --mo-control-border: #7a8780;  /* erkennbare Feldbegrenzung */

  --mo-brand: #0d6b45;
  --mo-brand-hover: #095436;
  --mo-brand-active: #073f29;
  --mo-brand-soft: #e8f2ec;
  --mo-brand-ink: #164c34;
  --mo-forest: #102c21;          /* Marketing und Markenflächen */

  --mo-warning-bg: #fff4d6;
  --mo-warning-text: #765000;
  --mo-danger-bg: #fdeceb;
  --mo-danger-text: #a02b24;
  --mo-success-bg: #e8f2ec;
  --mo-success-text: #1f6040;

  --mo-space-1: 4px;
  --mo-space-2: 8px;
  --mo-space-3: 12px;
  --mo-space-4: 16px;
  --mo-space-5: 24px;
  --mo-space-6: 32px;
  --mo-space-7: 48px;
  --mo-space-8: 64px;
  --mo-space-9: 96px;

  --mo-radius-control: 8px;
  --mo-radius-panel: 12px;
  --mo-radius-menu: 16px;
  --mo-shadow-panel: 0 1px 2px rgb(16 44 33 / 4%);
  --mo-shadow-popover: 0 16px 40px rgb(16 44 33 / 12%),
                       0 2px 8px rgb(16 44 33 / 5%);

  --mo-duration-fast: 140ms;
  --mo-duration-panel: 180ms;
  --mo-ease: cubic-bezier(.2, .7, .2, 1);
  --mo-focus: #0d6b45;
}

/* Bei Portals diese Attribute auch auf deren Wurzel setzen. */
:where([data-surface="app"], [data-surface="marketing"]) {
  color: var(--mo-text);
  font-family: var(--font-ui, inherit); /* an die vorhandene Schrift anbinden */
  font-size: 16px;
  line-height: 1.5;
}

:where([data-surface="app"], [data-surface="marketing"]),
:where([data-surface="app"], [data-surface="marketing"]) * {
  box-sizing: border-box;
}

:where([data-surface="app"], [data-surface="marketing"])
  :where(button, input, select, textarea) {
  font: inherit;
}

:where([data-surface="app"], [data-surface="marketing"])
  :where(button, a, input, select, textarea, summary):focus-visible {
  outline: 3px solid var(--mo-focus);
  outline-offset: 3px;
}

[data-ui="dark-surface"] {
  --mo-focus: #c3e8cf;
  color: white;
  background: var(--mo-forest);
}

[data-ui="page-title"] {
  margin: 0;
  font-size: clamp(26px, 2.2vw, 32px);
  line-height: 1.2;
  font-weight: 650; /* bei nichtvariabler Schrift verfügbares Gewicht nutzen */
  letter-spacing: -.02em;
  text-wrap: balance;
}

[data-ui="section-title"] {
  margin: 0 0 16px;
  font-size: 20px;
  line-height: 1.35;
  font-weight: 650;
  letter-spacing: -.01em;
}

[data-ui="help-text"] {
  color: var(--mo-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

[data-ui="numeric"] {
  font-variant-numeric: tabular-nums;
}
```

Typografische Regeln:

- App-Fließtext und Hauptinformationen: 16 px; Feldbeschriftungen: 15–16 px.
- 14 px nur für ergänzende Metadaten und Hilfetexte; nicht für die eigentliche Aufgabe.
- Abschnittstitel in normaler Schreibweise. Versalien höchstens als kurze Marketing-Überzeile.
- Keine automatische Silbentrennung in kurzen Überschriften und Navigationspunkten.
- Überschriften max. 2–3 Zeilen. Bei Platzmangel Layout ändern, nicht Schrift beliebig verkleinern.
- Lange Kundennamen und Adressen dürfen umbrechen. Kritische Werte nicht allein mit Ellipse abschneiden.
- Standardisierte Abstände: 8 px innerhalb kleiner Gruppen, 16 px zwischen Feldern, 24–32 px zwischen App-Abschnitten.

## 4. App-Shell: ruhig, deckend und vorhersehbar

### Aufbau

- Desktop ab 1024 px: Sidebar 232 px; Inhalt flexibel und mindestens 0 px breit im Grid.
- Sidebar und Inhalt erhalten deckende Flächen. Der Arbeitsinhalt verwendet keinen `backdrop-filter`.
- Standardmäßig neutraler Hintergrund. Ein optionaler bestehender Fotohintergrund darf nur außerhalb deckender Panels sichtbar bleiben.
- Keine großen dekorativen Schatten an Listen, Tabellen oder jedem Abschnitt.
- Tablet und Handy: Header mit Seitentitel, Suche und Profil; vier beschriftete Hauptbereiche unten.
- Keine zusätzliche schwebende Plus-Aktion.
- Der Inhalt muss bis zum letzten Eintrag scrollbar sein. Navigation und Hinweisleisten dürfen nichts verdecken.

```css
[data-ui="app-shell"] {
  --mo-bottom-nav-height: 72px;
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--mo-canvas);
}

[data-ui="app-sidebar"] {
  position: sticky;
  top: 0;
  align-self: start;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: 20px 12px 12px;
  overflow-y: auto;
  background: var(--mo-surface);
  border-right: 1px solid var(--mo-border);
}

[data-ui="app-sidebar-main"] { flex: 1; }
[data-ui="app-sidebar-footer"] { margin-top: 24px; }

[data-ui="nav-link"] {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: var(--mo-radius-control);
  color: var(--mo-text-secondary);
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
}

[data-ui="nav-link"] svg {
  width: 20px;
  height: 20px;
  flex: none;
  stroke-width: 1.75;
}

[data-ui="nav-link"][aria-current="page"] {
  color: var(--mo-brand-ink);
  background: var(--mo-brand-soft);
  font-weight: 650;
}

[data-ui="app-main"] {
  min-width: 0;
  padding: 32px;
  background: var(--mo-canvas);
}

[data-ui="app-page"] {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
}

[data-ui="app-page"][data-layout="form"] { max-width: 800px; }
[data-ui="app-page"][data-layout="schedule"] { max-width: none; }

[data-ui="mobile-app-header"],
[data-ui="bottom-nav"] { display: none; }

@media (max-width: 1023px) {
  [data-ui="app-shell"] { display: block; }
  [data-ui="app-sidebar"] { display: none; }

  [data-ui="mobile-app-header"] {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 64px;
    padding: 8px 16px;
    background: var(--mo-surface);
    border-bottom: 1px solid var(--mo-border);
  }

  [data-ui="app-main"] {
    padding: 24px 16px calc(var(--mo-bottom-nav-height) +
      env(safe-area-inset-bottom, 0px) + 24px);
  }

  [data-ui="bottom-nav"] {
    position: fixed;
    z-index: 30;
    inset-inline: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    min-height: calc(var(--mo-bottom-nav-height) +
      env(safe-area-inset-bottom, 0px));
    padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
    background: var(--mo-surface);
    border-top: 1px solid var(--mo-border);
  }

  [data-ui="bottom-nav"] a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 48px;
    border-radius: 8px;
    font-size: 14px;
    color: var(--mo-text-secondary);
    text-decoration: none;
  }

  [data-ui="bottom-nav"] a[aria-current="page"] {
    color: var(--mo-brand-ink);
    background: var(--mo-brand-soft);
    font-weight: 650;
  }
}
```

**Achtung:** Keine globale `overflow-x: hidden`-Regel verwenden, um Layoutfehler zu kaschieren. Überbreite Elemente, starre Mindestbreiten und fehlendes `min-width: 0` an der Ursache korrigieren. Tabellen dürfen innerhalb eines klar erkennbaren eigenen Containers horizontal scrollen; die komplette Seite nicht.

## 5. Gemeinsame Komponenten

### 5.1 Buttons

```css
[data-ui="button"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 11px 16px;
  border: 1px solid transparent;
  border-radius: var(--mo-radius-control);
  font-size: 16px;
  line-height: 1.4;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--mo-duration-fast),
              border-color var(--mo-duration-fast),
              color var(--mo-duration-fast);
}

[data-ui="button"][data-variant="primary"] {
  color: white;
  background: var(--mo-brand);
}

[data-ui="button"][data-variant="secondary"] {
  color: var(--mo-brand-ink);
  background: white;
  border-color: var(--mo-control-border);
}

[data-ui="button"][data-variant="quiet"] {
  color: var(--mo-brand-ink);
  background: transparent;
}

[data-ui="button"] svg { width: 20px; height: 20px; flex: none; }

@media (hover: hover) {
  [data-ui="button"][data-variant="primary"]:hover {
    background: var(--mo-brand-hover);
  }
  [data-ui="button"][data-variant="secondary"]:hover,
  [data-ui="button"][data-variant="quiet"]:hover {
    background: var(--mo-brand-soft);
  }
}

[data-ui="button"]:disabled {
  cursor: not-allowed;
  color: var(--mo-text-muted);
  background: var(--mo-surface-subtle);
  border-color: var(--mo-border);
}
```

- Hauptaktion: genau ein gefüllter grüner Button innerhalb einer zusammengehörigen Aufgabe.
- Mehrere unabhängige Aufgaben dürfen jeweils eine Aktion haben. Nicht mechanisch alle Buttons einer langen Seite entfernen.
- Häufige Nebenaktionen wie „Foto hinzufügen“ und „Notiz schreiben“ sichtbar halten.
- Icon-only-Buttons nur für verbreitete Funktionen wie Schließen; mindestens 48 × 48 px, zugänglicher Name.
- Während Speichern: „Wird gespeichert …“, Mehrfachabsenden verhindern, Breite möglichst stabil halten.
- Erfolg konkret melden: „Termin für Montag, 12:00 Uhr bestätigt.“ Rückgängig anbieten, wenn die Aktion zuverlässig reversibel ist.
- Bei Fehlern eingegebene Werte erhalten. Fehlerursache und möglichen nächsten Schritt nennen.

### 5.2 Tabs, Filter und Ansichtswechsel

- Linknavigation mit `<a>` und `aria-current`; echte In-Page-Tabs mit passendem Tab-Verhalten. Nicht allein für das Styling `role="tab"` setzen.
- Hauptnavigation eines Bereichs: eine unterstrichene Reihe.
- Untergeordnete Ansichten: kompakter heller Umschalter oder beschriftete Auswahl, maximal Inhaltsbreite.
- Filter bekommen keine flächigen dunklen Hintergründe.
- Aufträge: vorhandene Ziele vollständig abbilden. Falls die zweite Navigationsreihe in eine Auswahl überführt wird, lautet deren sichtbare Beschriftung z. B. „Ansicht: Aufträge“ mit Optionen „Aufträge“, „Angebote“, „Aufgaben“. „Eingang“, „Kunden“ und „Service“ bleiben in der übergeordneten Navigation erreichbar.
- Desktop-Auftragssuche und Statusfilter zusammenführen. Auf Mobile dürfen sie in zwei sauber gruppierten Zeilen stehen.

```css
[data-ui="page-tabs"] {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--mo-border);
  overflow-x: auto;
}

[data-ui="page-tabs"] > :where(a, button) {
  flex: none;
  min-height: 48px;
  padding: 12px 0;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--mo-text-secondary);
  font-weight: 500;
  text-decoration: none;
}

[data-ui="page-tabs"] > [aria-current="page"],
[data-ui="page-tabs"] > [aria-selected="true"] {
  border-bottom-color: var(--mo-brand);
  color: var(--mo-brand-ink);
  font-weight: 650;
}

[data-ui="view-switch"] {
  display: inline-flex;
  max-width: 100%;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: var(--mo-surface-subtle);
}

[data-ui="view-switch"] > button {
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--mo-text-secondary);
  font-weight: 500;
}

[data-ui="view-switch"] > button[aria-pressed="true"] {
  color: var(--mo-brand-ink);
  background: var(--mo-surface);
  border-color: var(--mo-control-border);
  font-weight: 600;
}
```

Wenn der vorhandene Umschalter semantisch Radiobuttons benutzt, diese Semantik erhalten und den aktiven Zustand korrekt auf `:checked` abbilden. Nicht unpassend `aria-pressed` ergänzen. Für schmale Touchansichten bei Bedarf 48 px statt 44 px Zielhöhe verwenden.

### 5.3 Formulare

```css
[data-ui="form-panel"] {
  padding: 24px;
  background: var(--mo-surface);
  border: 1px solid var(--mo-border);
  border-radius: var(--mo-radius-panel);
}

[data-ui="form-stack"] { display: grid; gap: 24px; }
[data-ui="field"] { display: grid; gap: 8px; min-width: 0; }
[data-ui="field"] label { font-size: 16px; font-weight: 600; }

[data-ui="field"] :where(input, select, textarea) {
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 11px 12px;
  color: var(--mo-text);
  background: white;
  border: 1px solid var(--mo-control-border);
  border-radius: var(--mo-radius-control);
  font-size: 16px;
}

[data-ui="field"] textarea { min-height: 112px; resize: vertical; }
[data-ui="field"] [aria-invalid="true"] {
  border-color: var(--mo-danger-text);
}
[data-ui="field-error"] { color: var(--mo-danger-text); font-size: 14px; }

[data-ui="form-two-columns"] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 639px) {
  [data-ui="form-panel"] { padding: 20px 16px; }
  [data-ui="form-two-columns"] { grid-template-columns: minmax(0, 1fr); }
}
```

- Labels stehen dauerhaft oberhalb des Felds; Placeholder nur als Beispiel.
- Hilfetexte und Fehler über `aria-describedby` verknüpfen.
- Native Auswahlfelder sind erlaubt. Keine komplexe Custom-Komponente nur aus optischen Gründen bauen.
- Eine kundenseitig große Liste benötigt Suche. Vorhandene zugängliche Combobox verwenden; Tastaturbedienung und „Neuer Kunde“ erhalten.
- Optionsfelder und Checkboxen mit vollständigem klickbarem Label; Zeilenhöhe mindestens 48 px.
- Fehlermeldungen nach verlässlicher Validierung zeigen, nicht bei jedem unvollständigen Tastendruck.

### 5.4 Statusanzeigen

```css
[data-ui="status"] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--mo-surface-subtle);
  color: var(--mo-text-secondary);
  font-size: 14px;
  line-height: 1.35;
  font-weight: 550;
}
[data-ui="status"][data-tone="warning"] {
  background: var(--mo-warning-bg); color: var(--mo-warning-text);
}
[data-ui="status"][data-tone="danger"] {
  background: var(--mo-danger-bg); color: var(--mo-danger-text);
}
[data-ui="status"][data-tone="success"] {
  background: var(--mo-success-bg); color: var(--mo-success-text);
}
```

| Zustand | Darstellung | Beispieltext |
|---|---|---|
| Normaler nächster Schritt | Neutral | Termin fehlt |
| Freigabe ohne unmittelbare Frist | Neutral | Freigabe offen |
| Zeitkritisch (noch nicht überfällig) | Amber + Text | Termin fehlt |
| Überfällig | Rot (hell) + dunkelroter Text | Rechnung überfällig |
| Tatsächliche Sperre/Gefahr | Rot + eindeutiger Text | Nicht verwenden |
| Bestätigt/erledigt | Zurückhaltendes Grün + Text | Termin bestätigt |

Farbe niemals als einzige Zustandsinformation verwenden. Die Einstufung basiert auf echten Geschäftsregeln; nicht allein auf Worterkennung im Titel.

## 6. App-Seiten: konkrete Zielzustände

### 6.1 Heute

**Monteur:** Nächster bzw. laufender Einsatz → weitere Termine heute → zugehörige offene Aufgaben.

**Inhaber/Büro:** Wichtigste tatsächliche Entscheidung → heutiger Ablauf → weitere Entscheidungen gebündelt.

- Rollen aus dem vorhandenen Berechtigungssystem ableiten. Keine neue Schattenrolle und keine sicherheitsrelevante Freigabe allein durch UI-Ausblendung.
- Existiert noch keine belastbare Rollenzuordnung, eine verständliche Standardansicht mit Tagesablauf und dringenden Entscheidungen bauen; die Rollenlogik separat als offene Abhängigkeit ausweisen.
- Akute Sicherheitswarnungen sind vom Mengenlimit ausgenommen und bleiben unmittelbar erkennbar.
- Initial höchstens drei normale Entscheidungseinträge. Vollständige Liste mit Anzahl direkt öffnen können.
- „Dein Start – noch 3 von 3“ zu einer kompakten Fortschrittszeile mit „Einrichtung fortsetzen“ machen. Die Schritte nach Öffnen zeigen.
- Beispieleinsatz: Uhrzeit, Kunde, kurze Aufgabe, Adresse. Eine zustandsabhängige Hauptaktion; häufige Nebenaktionen erreichbar.
- Keine erfundenen Zeitersparnisse, Erledigt-Zähler oder Stimmungstexte.

```css
[data-ui="today-layout"] { display: grid; gap: 32px; }
[data-ui="setup-summary"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid var(--mo-border);
  border-radius: 8px;
  background: var(--mo-surface);
}
[data-ui="next-job"] {
  padding: 24px;
  background: var(--mo-surface);
  border: 1px solid var(--mo-border);
  border-radius: 12px;
}
[data-ui="next-job-title"] { font-size: 22px; line-height: 1.3; margin: 8px 0; }
@media (max-width: 639px) {
  [data-ui="setup-summary"] { flex-wrap: wrap; gap: 8px; }
  [data-ui="next-job"] { padding: 20px 16px; }
}
```

### 6.2 Auftragsliste

- Titel „Aufträge“ und „Auftrag anlegen“ gehören in eine gemeinsame Kopfgruppe.
- Der erste Auftrag soll am üblichen Desktop ohne Scrollen sichtbar sein.
- Desktop: erkennbare Spalten Auftrag/Kunde, nächster Schritt, Termin, Status. Nur tatsächlich vorhandene Daten zeigen.
- Mobile: Auftrag und Kunde, darunter nächster Schritt bzw. Termin. Status klar zuordnen.
- Zeilen mindestens 64 px; mit längeren Inhalten automatisch wachsen lassen.
- Ganze Zeile darf ein Link zum Auftrag sein. Keine Buttons innerhalb desselben Links verschachteln.
- Ist eine semantische Tabelle geeignet, `<table>` beibehalten. CSS-Grid-Beispiel unten ist für eine Linkliste gedacht, nicht zum Überschreiben von Tabellen-Semantik.

```css
[data-ui="job-row"] {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) minmax(160px, 1fr)
                         minmax(120px, .8fr) max-content;
  align-items: center;
  gap: 20px;
  min-height: 72px;
  padding: 16px;
  background: var(--mo-surface);
  border-bottom: 1px solid var(--mo-border);
  color: var(--mo-text);
  text-decoration: none;
}
[data-ui="job-row"] > * { min-width: 0; }
@media (max-width: 1199px) {
  [data-ui="job-row"] {
    grid-template-columns: minmax(0, 1fr) max-content;
    gap: 8px 16px;
  }
}
@media (hover: hover) {
  [data-ui="job-row"]:hover { background: #f7faf7; }
}
```

Für den schmalen Zustand Grid-Areas oder Komponentenreihenfolge ausdrücklich definieren: Titel links oben, Status rechts oben, Metadaten unter dem Titel. DOM-Lesereihenfolge muss weiterhin verständlich sein. Bei langen Statusbegriffen auf eine Spalte wechseln.

### 6.3 Auftrag anlegen

Zielreihenfolge:

1. Kunde auswählen oder neuen Kunden erfassen.
2. „Was ist zu tun?“ mit Beispiel „Steckdosen im Bad erneuern“.
3. Auftragsart mit sinnvoller bestehender Vorauswahl; jederzeit änderbar.
4. Bekannte Einsatzadresse als lesbare Zusammenfassung und „Adresse ändern“.
5. „Weitere Angaben“ für Zugang, Zusatznotizen und zusätzliche optionale Felder.
6. Bestehende Dringlichkeitserfassung sichtbar und verständlich halten.
7. „Auftrag anlegen“.

Wichtige Bedingungen:

- Eine Kundenadresse nicht ungeprüft mit einem Einsatzort gleichsetzen. Bei mehreren Einsatzorten Auswahl verlangen; bei fehlendem Ort „Einsatzort noch offen“ ermöglichen, sofern fachlich zulässig.
- Bereits eingegebene Felder dürfen beim Zuklappen nicht verloren gehen.
- Fehler innerhalb zugeklappter Angaben öffnen den Abschnitt und führen zum fehlerhaften Feld.
- Keine zusätzlichen Wizard-Schritte für dieses überschaubare Formular einführen.
- Native `<details><summary>Weitere Angaben</summary>…</details>` ist geeignet, sofern Fokus- und Fehlerverhalten korrekt ergänzt werden.

### 6.4 Betrieb

- Die vier Einstiege Geld, Team, Ausstattung, Unternehmen behalten.
- Je Einstieg ein klares Icon, Titel und maximal eine kurze Statuszeile. Keine Liste aller Probleme in der Karte.
- Darunter maximal vier zuletzt verwendete, berechtigte Module, sofern echte Nutzungsdaten vorhanden sind.
- Ohne solche Daten keine fiktive Nutzung zeigen. Direkt „Alle Module“ mit Suche anbieten.
- Vollständiges Verzeichnis über einen deutlich sichtbaren Zugang. Suche darf alle berechtigten Module finden, nicht nur die gerade eingeblendeten.
- Bestehende Favoriten erhalten; nicht zurücksetzen. Die Obergrenze nicht ohne Produktentscheidung ändern.

### 6.5 Kalender

- Kalender, Einplanen, Kapazität bleiben verständliche Arbeitsbereiche.
- Desktop: Wochenansicht als echtes Zeitraster vorsehen; Dauer durch Blockhöhe abbilden. Überlappungen nebeneinander, Konflikt mit Text kennzeichnen.
- Arbeitstage aus den vorhandenen Betriebseinstellungen ableiten. Falls nicht vorhanden, Mo–Fr als änderbare Ansicht; Wochenendtermine nicht unsichtbar verlieren.
- Mobile: chronologische Tagesagenda beibehalten. Datumsauswahl und Mitarbeiterfilter kompakt über der Liste.
- Kein Zwang zu Drag-and-drop: Termin öffnen, Datum/Uhrzeit ändern, speichern muss immer möglich sein.
- **Zeitlayout ist eine funktionale Änderung, kein CSS-Schnellfix.** Separat nach Shell, Navigation und Lesbarkeit umsetzen und testen: Zeitbereiche, Überschneidungen, Zeitzonen, Tageswechsel, Ganztag und leere Tage.

### 6.6 Beispielbetrieb und Markenintro

- Beispielbetrieb einmal klar und dauerhaft markieren. Auf Mobile eine kompakte Zeile im Layout, keine große schwebende Karte über den Daten.
- Exportierte/versendbare Beispieldokumente müssen weiterhin eindeutig als Beispiele erkennbar bleiben.
- Markenintro höchstens beim passenden Erstkontakt. Wiederkehrende Arbeitswege ohne vorgeschaltete Animation.
- Vorhandene Überspringen-Funktion erhalten. Reduced Motion respektieren; kein automatisch startender Ton.
- Nicht jede Seitenänderung, jeder Tabwechsel oder jede neu geladene Sitzung darf erneut ein Intro erzwingen.

## 7. Marketing-Mega-Menüs: Zielkomposition

### 7.1 Gemeinsame Regeln

Das Menü soll das Produkt erklären und die Auswahl erleichtern. Es ist keine vollständige Sitemap.

- Desktop-Menü ab **1200 px**. Darunter mobile Navigation verwenden, damit Logo, Menüpunkte und Aktionen nicht zusammengequetscht werden.
- Maximale Panelbreite **1200 px**, Abstand zum Viewportrand mindestens **24 px**.
- Hintergrund Weiß, dezente Kontur, ein zurückhaltender Schatten. Keine Transparenz, kein Foto hinter Links.
- Innenabstand **32 px**, Spaltenabstand **32 px**.
- Linktext **16 px**, Zeilenhöhe **1.4**, Gewicht **500**.
- Gruppentitel **18 px**, Gewicht **650**, normale Schreibweise.
- Einträge mindestens **48 px** hoch. Maximal vier Hauptlinks pro Funktionsgruppe.
- Pro Menü höchstens eine zusätzliche große Vorschaufläche. Bei Gewerken übernehmen kleine Fotos neben den Einträgen diese Funktion.
- Linktexte stehen außerhalb von Bildern; Vorschauen erklären die verlinkte Seite.
- Keine nachlaufenden Vorschauen bei Hover und keine automatisch wechselnden Bilder.
- Links führen zu bestehenden, passenden Zielen. Ein Sammellink darf nicht in eine unpassende Einzelansicht führen.
- Vollständige Übersicht bleibt erreichbar. Kürzung des Menüs ist kein Löschen von Funktionen.

### 7.2 Funktionen: drei Gruppen und ein Produktbeweis

Desktop-Aufteilung: drei Linkspalten plus eine etwas breitere Vorschau.

| Aufträge | Planen | Betrieb | Vorschau |
|---|---|---|---|
| Anfragen & Kunden | Kalender & Termine | Mitarbeiter & Zeiten | Lesbarer Screenshot eines einzelnen Einsatzes |
| Angebote schreiben | Einsätze & Mitarbeiter | Material & Lager | „Ein Einsatz. Alles dabei.“ |
| Aufträge bearbeiten | Material & Fahrzeuge | Werkzeuge & Fahrzeuge | „Kunde, Termin und Aufgabe an einem Ort.“ |
| Rechnungen schreiben | Automatische Planung | Zahlen & Auswertung | „Beispiel ansehen“ |

**Routenabgleich ist verpflichtend:** Die Texte oben sind vorgeschlagene Informationsgruppen. Vor Umsetzung prüfen, ob die bestehende Zielseite den gesamten Begriff abdeckt. Falls beispielsweise „Anfragen & Kunden“ keine geeignete gemeinsame Seite hat, entweder eine vorhandene echte Übersichtsseite verwenden oder den Link präzise „Anfragen“ nennen. Keine leeren Zwischenrouten und keine irreführenden Sammelbegriffe erzeugen.

Geeignete vorhandene Einzelziele, am Prüftag beobachtet:

| Ziel | Vorhandener Pfad |
|---|---|
| Anfragen | `/funktionen/anfragen` |
| Kunden | `/funktionen/kunden` |
| Angebote | `/funktionen/angebote` |
| Aufträge | `/funktionen/auftraege` |
| Rechnungen | `/funktionen/rechnungen` |
| Kalender | `/funktionen/kalender` |
| Einsatzplanung | `/funktionen/einsatzplanung` |
| Material | `/funktionen/material` |
| Mitarbeiter | `/funktionen/mitarbeiter` |
| Arbeitszeiten | `/funktionen/zeiterfassung` |
| Lager | `/funktionen/lager` |
| Werkzeuge | `/funktionen/werkzeuge` |
| Fahrzeuge | `/funktionen/fahrzeuge` |
| Auswertung | `/funktionen/auswertung` |
| Automatisch erledigen | `/funktionen/automatisch-erledigen` |
| Vollständige Übersicht | `/funktionen` |

Einsatzplanung, Mitarbeiterplanung und automatische Planung verlinkten am Prüftag dieselbe Seite. Nicht drei gleichgewichtete Einträge mit nahezu gleichem Ziel beibehalten. Den eigenständigen Platz „Automatische Planung“ nur verwenden, wenn die Zielseite einen klar adressierbaren passenden Abschnitt oder eigenen Inhalt bietet. Sonst mit „Einsätze & Mitarbeiter“ zusammenführen und drei statt vier Links akzeptieren. **Keine künstlichen Einträge zum Auffüllen einer Spalte.**

Abschluss unter dem Panel: feine Linie, links „Alle Funktionen ansehen“, rechts optional „So arbeitet Macher automatisch“. Keine weitere Reihe mit vier Werbeaktionen.

### 7.3 Gewerke: Wiedererkennen durch kleine echte Bilder

Zwei Hauptspalten mit je vier Einträgen. Jeder Eintrag ist eine Zeile aus Foto und ausgeschriebenem Gewerk.

| Linke Spalte | Rechte Spalte |
|---|---|
| Elektriker | Tischler & Schreiner |
| Sanitär, Heizung & Klima | Dachdecker |
| Maler & Lackierer | Maurer & Bau |
| Fliesenleger | Garten- & Landschaftsbau |

- Zeilenhöhe mindestens **88 px**, Foto **80 × 60 px**, Radius **6 px**.
- 16 px Abstand zwischen Bild und Text; 12 px vertikaler Abstand zwischen Zeilen.
- Fotos müssen das Gewerk erkennbar zeigen. Vorhandene Assetbibliothek nutzen. Keine neuen generischen KI-Bilder und keine Hotlinks.
- Bilder als verlinkte Inhaltsausschnitte mit sinnvoll geprüftem Fokuspunkt darstellen. Wenn ein Crop die Arbeit oder Person unverständlich macht, anderes Motiv wählen oder vollständiges Bild zeigen.
- Sind keine geeigneten Fotos vorhanden, ein einheitliches Linienicon als zeitweiligen Ersatz verwenden und fehlende Bilder dokumentieren. Keine Pfeilgrafik als vermeintliches Handwerksfoto.
- Beschriftung ohne Fachabkürzungszwang: „Sanitär, Heizung & Klima“ statt ausschließlich „SHK“.
- Unter beiden Spalten „Alle Gewerke ansehen“ zur vollständigen Übersicht. Zusätzliche 16 Branchen müssen nicht gleichzeitig im Menü stehen.
- Optional rechts ein schmaler, ruhiger Hinweis „Dein Gewerk ist dabei“ mit Übersichtslink. Nicht zusätzlich acht weitere Textlinks hineinpressen.

### 7.4 Wissen: drei Aufgaben und eine echte Vorschau

| Praxistipps | Vorlagen & Rechner | Hilfe beim Start | Vorschau |
|---|---|---|---|
| Blog | Vorlagen & Checklisten | Schnellstart | Eine vorhandene Vorlage als echte Dokumentvorschau |
| Webinare | Stundensatz berechnen | Daten übernehmen | Tatsächlicher Titel der Vorlage |
| Macher Akademie | Angebot berechnen | Hilfe-Center | Format nennen, falls bekannt, z. B. PDF |
|  | Alle Rechner | Kontakt & Support | „Vorlage ansehen“ |

- „Stundensatz“ und „Stundenverrechnungssatz“ nicht ohne Erklärung direkt nebeneinander priorisieren. Beide dürfen in der vollständigen Rechnerübersicht erhalten bleiben.
- „Kundenwissen“ und „Kunden ansehen“ sind für diese Auswahl nicht nötig; Kunden bleiben über den vorhandenen Hauptnavigationspunkt zugänglich.
- Vorschau nur auf ein tatsächlich vorhandenes Asset/Angebot verlinken. Kein erfundenes Cover, kein erfundenes Webinar, keine falsche Gratis-Aussage.
- Fehlt eine passende Vorlage, eine echte vorhandene Produkt-/Hilfevorschau verwenden oder die Vorschau zunächst weglassen. Kein dekoratives Dummy-Asset veröffentlichen.

## 8. Mega-Menü: konkrete CSS- und Verhaltensspezifikation

### 8.1 Desktop-Struktur

Semantisches Strukturbeispiel; in vorhandene Framework-Komponenten übersetzen:

```html
<!-- Normale Seitennavigation, kein ARIA-Anwendungsmenü. -->
<nav aria-label="Hauptnavigation">
  <button type="button"
          aria-expanded="true"
          aria-controls="mega-funktionen">
    Funktionen
    <!-- Pfeil dekorativ: aria-hidden="true" -->
  </button>
</nav>

<!-- Darf bei Bedarf als Portal an document.body gerendert werden. -->
<div data-surface="marketing" data-ui="mega-root">
  <div id="mega-funktionen"
       data-ui="mega-panel"
       aria-labelledby="mega-title-funktionen">
    <h2 id="mega-title-funktionen" class="sr-only">Funktionen</h2>
    <div data-ui="mega-grid" data-kind="functions">
      <section data-ui="mega-group" aria-labelledby="mega-auftraege">
        <h3 id="mega-auftraege">Aufträge</h3>
        <ul>
          <li><a data-ui="mega-link" href="/funktionen/anfragen">Anfragen</a></li>
          <li><a data-ui="mega-link" href="/funktionen/angebote">Angebote schreiben</a></li>
          <li><a data-ui="mega-link" href="/funktionen/auftraege">Aufträge bearbeiten</a></li>
          <li><a data-ui="mega-link" href="/funktionen/rechnungen">Rechnungen schreiben</a></li>
        </ul>
      </section>
      <!-- Weitere Gruppen mit der gleichen Struktur. -->
      <!-- Rechts eine einzige vollständig klickbare Vorschau ohne verschachtelte Buttons. -->
    </div>
    <div data-ui="mega-footer">
      <a href="/funktionen">Alle Funktionen ansehen</a>
    </div>
  </div>
</div>
```

`sr-only` aus dem bestehenden Designsystem verwenden. Eine neue Utility nur anlegen, wenn keine vorhanden ist.

```css
[data-ui="marketing-header"] {
  position: sticky;
  top: 0;
  z-index: 80;
  background: var(--mo-surface);
  border-bottom: 1px solid var(--mo-border);
}

[data-ui="marketing-header-inner"] {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 72px;
  max-width: 1280px;
  margin-inline: auto;
  padding: 12px 24px;
}

[data-ui="desktop-marketing-nav"] { flex: 1; min-width: 0; }

[data-ui="mega-root"] {
  /* Der Wert wird aus der tatsächlichen Unterkante des Headers abgeleitet. */
  position: fixed;
  z-index: 90;
  top: var(--mo-header-bottom, 72px);
  inset-inline: 24px;
}

[data-ui="mega-panel"] {
  width: min(1200px, 100%);
  max-height: calc(100dvh - var(--mo-header-bottom, 72px) - 24px);
  margin-inline: auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 32px 32px 20px;
  background: var(--mo-surface);
  border: 1px solid var(--mo-border);
  border-radius: 0 0 var(--mo-radius-menu) var(--mo-radius-menu);
  box-shadow: var(--mo-shadow-popover);
  animation: mo-menu-in var(--mo-duration-panel) var(--mo-ease);
}

[data-ui="mega-grid"] { display: grid; align-items: start; gap: 32px; }
[data-ui="mega-grid"][data-kind="functions"],
[data-ui="mega-grid"][data-kind="knowledge"] {
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(240px, 1.25fr);
}
[data-ui="mega-grid"][data-kind="trades"] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 40px;
}

[data-ui="mega-group"] { min-width: 0; }
[data-ui="mega-group"] h3 {
  margin: 0 0 12px;
  color: var(--mo-text);
  font-size: 18px;
  line-height: 1.35;
  font-weight: 650;
}
[data-ui="mega-group"] ul { list-style: none; margin: 0; padding: 0; }

[data-ui="mega-link"] {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  margin-inline: -8px;
  padding: 10px 8px;
  border-radius: 8px;
  color: var(--mo-text);
  font-size: 16px;
  line-height: 1.4;
  font-weight: 500;
  text-decoration: none;
}

[data-ui="mega-link"]:focus-visible {
  background: var(--mo-brand-soft);
}
@media (hover: hover) {
  [data-ui="mega-link"]:hover {
    background: var(--mo-brand-soft);
    color: var(--mo-brand-ink);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
}

[data-ui="mega-feature"] {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  background: var(--mo-brand-soft);
  color: var(--mo-text);
  text-decoration: none;
}
[data-ui="mega-feature"] img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--mo-border);
  border-radius: 8px;
}
[data-ui="mega-feature-title"] {
  margin: 16px 0 8px;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 650;
}
[data-ui="mega-feature-copy"] {
  margin: 0 0 16px;
  color: var(--mo-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}
[data-ui="mega-feature-action"] {
  margin-top: auto;
  color: var(--mo-brand-ink);
  font-size: 16px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 4px;
}

[data-ui="trade-link"] {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 88px;
  padding: 12px;
  color: var(--mo-text);
  border-radius: 10px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 550;
}
[data-ui="trade-link"] img {
  flex: none;
  width: 80px;
  height: 60px;
  object-fit: cover;
  object-position: var(--mo-image-focus, center);
  border-radius: 6px;
}
@media (hover: hover) {
  [data-ui="trade-link"]:hover { background: var(--mo-brand-soft); }
}

[data-ui="mega-footer"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--mo-border);
}
[data-ui="mega-footer"] a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--mo-brand-ink);
  font-size: 16px;
  font-weight: 600;
  text-underline-offset: 4px;
}

@keyframes mo-menu-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1199px) {
  [data-ui="desktop-marketing-nav"],
  [data-ui="mega-root"] { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  [data-ui="mega-panel"] { animation: none; }
  [data-ui="button"], [data-ui="mega-link"] { transition: none; }
}
```

### 8.2 Desktop-Verhalten

Pflichtverhalten:

1. Klick, Enter oder Leertaste auf den Trigger öffnet das zugehörige Panel.
2. Erneuter Klick auf denselben Trigger schließt es.
3. Ein anderer Trigger wechselt direkt zum entsprechenden Panel; nie zwei Panels gleichzeitig.
4. Escape schließt und setzt den Fokus auf den auslösenden Trigger zurück.
5. Klick außerhalb schließt, blockiert aber keine ausdrücklich gewählte Navigation.
6. Beim Verlassen der gesamten Navigation per Tastatur schließt das Panel. Kein Focus Trap im Desktop-Menü.
7. Ein Linkwechsel schließt das Panel. Fokusübergang nach Navigation erfolgt nach den vorhandenen Router-Regeln.
8. Ausgeblendete Panels enthalten keine fokussierbaren Elemente im Tabablauf: unmounten oder `hidden` verwenden, nicht nur `opacity: 0`.
9. Hover ist für diese Zielgruppe nicht zum Öffnen erforderlich. Falls bestehendes Hover-Verhalten erhalten bleibt, darf es nicht zusammen mit Klick ein sofortiges Öffnen-und-Schließen verursachen.
10. Button besitzt `aria-expanded` und `aria-controls`; Gruppentitel und Links bleiben echte HTML-Elemente. Kein `role="menu"` mit unvollständig implementierter Anwendungsmenü-Tastatursteuerung.

**Portal-Fokusreihenfolge:** Wenn das Panel an `document.body` gerendert wird, eine vorhandene zugängliche Popover-/Navigation-Komponente verwenden, die die logische Tab-Reihenfolge erhält. Andernfalls die Panelstruktur im Header belassen und störende Stacking Contexts dort gezielt korrigieren. Ein Portal allein löst keine Tastaturbedienung.

**Headerposition:** `--mo-header-bottom` beim Öffnen aus `header.getBoundingClientRect().bottom` ableiten. Änderungen der Headerhöhe per `ResizeObserver` berücksichtigen. Bei nicht feststehendem Header zusätzlich Scrollposition berücksichtigen oder Menü beim Scrollen passend schließen. Keine `72px`-Annahme gegen einen tatsächlich zweizeiligen Header verwenden.

### 8.3 Mobile: P0-Sichtbarkeitsfehler korrekt beheben

Zuerst Ursache im Repository und gerenderten DOM prüfen:

- Liegt das Menü unter dem Hero oder einem anderen Stacking Context?
- Erzeugen Vorfahren `transform`, `filter`, `backdrop-filter`, `opacity`, `isolation` oder `contain`?
- Wird es durch `overflow: hidden/clip`, feste Headerhöhe oder falsche Positionierung abgeschnitten?
- Stimmt die Breite mit dem mobilen Viewport überein?
- Gibt es einen unsichtbaren Layer oberhalb der Navigation?

**Keine Reparatur durch beliebige Werte wie `z-index: 999999` ohne Ursachenprüfung.**

Ziel: eine deckende, modal geöffnete Navigation über der gesamten Seite. Am einfachsten die vorhandene zugängliche Dialog-/Sheet-Komponente mit Portal verwenden. Falls keine vorhanden ist, ein natives `<dialog>` mit `showModal()` einsetzen. Ein mit `open` versehenes Dialogelement allein ist noch kein modaler Top-Layer-Dialog.

Struktur:

```html
<dialog data-surface="marketing"
        data-ui="mobile-menu"
        aria-labelledby="mobile-menu-title">
  <div data-ui="mobile-menu-header">
    <h2 id="mobile-menu-title">Menü</h2>
    <button type="button" data-ui="button" data-variant="quiet">
      Schließen
    </button>
  </div>
  <div data-ui="mobile-menu-body">
    <nav aria-label="Mobile Hauptnavigation">
      <!-- Start: Funktionen, Gewerke, Wissen, Kunden, Preise. -->
      <!-- Eine Unteransicht zeigt Zurück, ihren Titel und die passenden Linkgruppen. -->
    </nav>
  </div>
  <div data-ui="mobile-menu-footer">
    <a data-ui="button" data-variant="primary" href="/os/willkommen">Kostenlos testen</a>
    <a href="/demo">Demo ansehen</a>
    <a href="/os/heute">App öffnen</a>
  </div>
</dialog>
```

Das Beispiel ist die Struktur, nicht die fertige Dialogsteuerung. Vorhandene Dialogbibliotheken und deren Fokusmanagement nicht mit einer parallelen Handimplementierung vermischen.

```css
[data-ui="mobile-menu"] {
  position: fixed;
  inset: 0;
  width: 100%;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--mo-text);
  background: var(--mo-surface);
}

/* Wichtig: geschlossen nicht durch eine unbedingte display:grid-Regel überschreiben. */
[data-ui="mobile-menu"][open] {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}
[data-ui="mobile-menu"]::backdrop { background: rgb(16 44 33 / 24%); }

[data-ui="mobile-menu-header"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 20px 12px;
  border-bottom: 1px solid var(--mo-border);
}
[data-ui="mobile-menu-header"] h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}
[data-ui="mobile-menu-body"] {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px 20px 24px;
}
[data-ui="mobile-menu-row"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 56px;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid var(--mo-border);
  background: transparent;
  color: var(--mo-text);
  font-size: 18px;
  font-weight: 550;
  text-align: left;
  text-decoration: none;
}
[data-ui="mobile-menu-footer"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  background: var(--mo-surface);
  border-top: 1px solid var(--mo-border);
}
[data-ui="mobile-menu-footer"] [data-ui="button"] { width: 100%; }
[data-ui="mobile-menu-footer"] > a:not([data-ui="button"]) {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--mo-brand-ink);
  text-underline-offset: 4px;
}

@media (max-height: 500px) {
  [data-ui="mobile-menu"][open] {
    display: block;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  [data-ui="mobile-menu-header"] {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--mo-surface);
  }
  [data-ui="mobile-menu-body"] { overflow: visible; }
}
```

Bei geringer Höhe scrollt damit das gesamte Dialogfenster; der Header mit Schließen bleibt sichtbar und die Fußaktionen sind am Ende erreichbar. Bei stärkerer Textvergrößerung ebenfalls prüfen, ob dieser Modus nötig ist. Es darf keine nicht erreichbare Fußzeile geben.

Mobile Zustandslogik:

- `closed` → `root` → `functions | trades | knowledge`.
- Eine Unteransicht besitzt „Zurück zum Menü“ und ihren Titel. Keine weitere Menüebene darunter.
- Unter „Funktionen“ erscheinen die drei Gruppen mit ihren direkten Links; die große Desktop-Vorschau entfällt.
- Unter „Gewerke“ erscheinen die acht Bildzeilen und „Alle Gewerke“.
- Unter „Wissen“ erscheinen die drei kurzen Gruppen; die Vorschau folgt nur, wenn sie nicht den Zugang zu den Links verdrängt.
- Fokus beim Öffnen auf einen sinnvollen ersten Dialogeintrag; nach Unteransichtswechsel auf die Überschrift mit `tabindex="-1"`; nach Zurück auf den vorherigen Gruppenbutton.
- Escape und „Schließen“ schließen das gesamte Dialogfenster. Fokus kehrt zum Menütrigger zurück.
- Hintergrund während des geöffneten Dialogs nicht bedienbar und nicht scrollbar. Vorhandene Scroll-Lock-Lösung der Dialogkomponente verwenden; vorherigen Scrollzustand beim Schließen exakt herstellen.
- Browser-Zurück nicht unkontrolliert überschreiben. Falls das Projekt Menüzustände im Router führt, dessen vorhandenes Verhalten konsistent nutzen.
- Beim Wechsel auf Desktop-Breite Dialog schließen und Scroll-Lock vollständig lösen.
- Ein Linkwechsel schließt Dialog und Scroll-Lock; keine unsichtbare Interaktionssperre zurücklassen.

## 9. Marketingseiten: modern und leicht verständlich

### 9.1 Header

- Logo bleibt lesbar; keine Verkleinerung bis zur Unkenntlichkeit.
- Desktop: Funktionen, Gewerke, Wissen, Kunden, Preise. Rechts App öffnen, Demo ansehen, Kostenlos testen.
- Tablet/Mobile: Logo und beschrifteter Menübutton; bei ausreichendem Platz ein kompakter Testen-Button.
- Bei 320 px lieber den zusätzlichen CTA im Header ausblenden und ihn im Hero und Menü erhalten, als Logo oder Menü über den Rand zu drücken.
- Der Menübutton braucht mindestens 48 px Höhe und eine erkennbare Beschriftung oder einen zugänglichen eindeutigen Namen. Kein halb abgeschnittenes Hamburger-Symbol.

```css
[data-ui="mobile-marketing-actions"] { display: none; }
@media (max-width: 1199px) {
  [data-ui="marketing-header-inner"] {
    min-height: 64px;
    padding: 8px 16px;
    gap: 12px;
    justify-content: space-between;
  }
  [data-ui="desktop-marketing-actions"] { display: none; }
  [data-ui="mobile-marketing-actions"] {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
@media (max-width: 359px) {
  [data-ui="header-trial-link"] { display: none; }
}
```

### 9.2 Hero und Seitenrhythmus

- Die bestehende klare Aussage „Dein Betrieb. Eine Software.“ kann bleiben.
- Ergänzung als konkreter Nutzen, z. B. „Aufträge, Termine und Rechnungen an einem Ort. Für dich und dein Team.“ Nur zutreffende Aussagen verwenden.
- Eine kräftige Markenfläche, ein aussagekräftiges Bild, eine klare Aktion.
- Typografie nicht durchgehend in Versalien. Der Hero darf diese Markensprache behalten; spätere Abschnitte ruhig setzen.
- Wiederholte Pfeilgrafiken durch vorhandene aussagekräftige Fotos oder reale Produktansichten ersetzen.
- UI-Screenshots unverzerrt und lesbar darstellen. Kein kompletter Desktop-Screen als unlesbare Miniatur.
- Mobile Reihenfolge: Aussage → Nutzen → Hauptaktion → Produktausschnitt. Keine hohe Dekorationsfläche vor der Aussage.
- Kapitel: Versprechen, Produktablauf, Gewerke, belegbare Erfahrungen/Beispiele, Preis, Einstieg. Bestehende sinnvolle Inhalte erhalten und sinnvoll zusammenführen.
- Kein Scroll-Zwang durch riesige Bildschirmhöhen. Kein Scroll-Hijacking.

```css
[data-ui="marketing-container"] {
  width: min(1200px, calc(100% - 48px));
  margin-inline: auto;
}
[data-ui="marketing-section"] { padding-block: 80px; }
[data-ui="marketing-section-title"] {
  max-width: 22ch;
  margin: 0 0 16px;
  font-size: clamp(30px, 3.4vw, 44px);
  line-height: 1.15;
  letter-spacing: -.025em;
  font-weight: 650;
  text-wrap: balance;
  hyphens: none;
}
[data-ui="marketing-copy"] {
  max-width: 60ch;
  margin: 0;
  color: var(--mo-text-secondary);
  font-size: 18px;
  line-height: 1.6;
}
[data-ui="hero-grid"] {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  align-items: center;
  gap: 48px;
  padding-block: 72px;
}
[data-ui="hero-title"] {
  max-width: 16ch;
  margin: 0 0 24px;
  font-size: clamp(40px, 4.5vw, 64px);
  line-height: 1.05;
  letter-spacing: -.035em;
  font-weight: 700;
  text-wrap: balance;
  hyphens: none;
}
[data-ui="hero-actions"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}
[data-ui="product-image"] {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  border: 1px solid var(--mo-border);
}
@media (max-width: 767px) {
  [data-ui="marketing-container"] { width: calc(100% - 32px); }
  [data-ui="marketing-section"] { padding-block: 48px; }
  [data-ui="hero-grid"] {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
    padding-block: 40px;
  }
  [data-ui="hero-title"] { font-size: clamp(34px, 9vw, 42px); }
  [data-ui="marketing-copy"] { font-size: 16px; line-height: 1.6; }
}
```

Bei dunklen Marketingflächen Fließtext hell und gut lesbar setzen, z. B. `#e0e9e3`. Keine dunklen Sekundärtext-Tokens ungeprüft auf dunklem Hintergrund verwenden. Kleine grüne Texte im Hero müssen den geforderten Textkontrast erfüllen.

### 9.3 Produktvorschauen

- Dieselbe Navigation, Beschriftung, Farbwelt und Komponentenlogik wie in der echten App verwenden.
- Beispiel: „Termin bestätigen“ im Marketing und im Produkt identisch benennen.
- Beispieldaten klar markieren. Keine ausgedachten aktiven Integrationen oder automatisch erledigten Vorgänge als reale Produktleistung darstellen.
- Für neue Screenshots einen stabilen Beispielzustand verwenden. Keine privaten Kundendaten in Marketingmaterial übernehmen.
- Keine neue vollwertige Demo-App nur für dekorative Vorschauen implementieren. Vorhandene UI-Komponenten oder statische, verifizierte Screenshots nutzen.

### 9.4 Kunden und Preise

- Vorhandene fiktive Kundengeschichten eindeutig als Beispielszenarien darstellen. Keine Erfolgszitate wie „6 Stunden weniger“ als Kundenbeweis verwenden, wenn sie nur erfundenes Beispiel sind.
- Echte Kundenbelege nur mit vorhandener Quelle und Freigabe verwenden.
- Auf der Preisseite kurze Einleitung; Teamgröße und passender Preis früh sichtbar.
- Vorläufige Preise unmittelbar am Preis kennzeichnen. Keine vorhandenen Preiswerte, Rabatte oder Vertragsbedingungen aus Designgründen ändern.
- „Alle Funktionen enthalten“ und ähnliche Aussagen gegen die vorhandene Produktlogik prüfen, bevor sie prominenter platziert werden.

## 10. Reihenfolge der Implementierung

### P0: Bedienbarkeit

1. Mobile Marketingnavigation sichtbar, bedienbar und scrollbar machen.
2. Fokus, Schließen, Scroll-Lock, Routing und Resize-Verhalten prüfen.
3. Horizontale Seitenüberläufe und verdeckte Aktionen beseitigen.

### P1: gemeinsames Erscheinungsbild

4. Tokens den vorhandenen Variablen zuordnen.
5. App-Arbeitsflächen deckend gestalten; transparentes Fotolayout zurücknehmen.
6. Buttons, Felder, Tabs, Umschalter, Statusanzeigen und Navigation konsolidieren.
7. Mobilen Beispielbetrieb-Hinweis in den normalen Layoutfluss integrieren.

### P2: Orientierung und Marketingmenüs

8. Mega-Menü-Inhalte deduplizieren und echte Routen zuordnen.
9. Funktionsmenü als drei Gruppen mit einer Produktvorschau bauen.
10. Gewerke-Menü mit acht echten Bildzeilen; Wissen mit kurzen Gruppen und vorhandener Vorschau.
11. Heute und Auftragsformular entsprechend priorisieren; vorhandene Geschäftsregeln bewahren.
12. Header, Hero und Produktvorschauen angleichen.

### P3: funktionale Vertiefung

13. Falls nötig Zeitraster des Kalenders separat implementieren und fachlich testen.
14. Weitere App-Seiten mit denselben Komponenten aktualisieren. Kein nur auf drei Screens beschränktes neues Design hinterlassen.

Nach jedem Paket visuell prüfen. Keine gleichzeitig wechselnden Farben, Schriften, Navigationen und Geschäftsvorgänge ohne Zwischenkontrolle.

## 11. Konkrete Implementierungsfehler vermeiden

| Nicht tun | Stattdessen |
|---|---|
| Neue Klassen einfügen, die keine Komponente verwendet. | Styling an gerenderte Komponenten binden und im Browser nachweisen. |
| Alle Elemente mit globalem `button { … }` verändern. | Anwendungsbereiche und gemeinsame Komponenten gezielt kapseln. |
| `opacity: .6` auf ganze Karten oder Sidebar anwenden. | Hintergrundfarbe und Textfarbe getrennt definieren. |
| Stacking-Probleme nur mit extremem z-index beantworten. | Stacking Contexts untersuchen; richtige Ebene bzw. Dialog/Portal verwenden. |
| Desktop-Menü per CSS auf Mobile ausblenden, aber Fokus darin lassen. | Zustände schließen, Fokus sinnvoll setzen, Portal unmounten. |
| `display: grid` auf geschlossenem nativen Dialog. | Ausschließlich `[open]` sichtbar gestalten. |
| Inhaltsreihenfolge per CSS stark gegenüber DOM ändern. | DOM so strukturieren, dass visuelle und vorgelesene Reihenfolge stimmen. |
| Funktionen löschen, um die Oberfläche leer zu bekommen. | Kürzere Standardansicht mit klarem Zugang zu vollständigen Funktionen. |
| „Modern“ durch kleine Schrift, blasse Linien und Icon-only-Aktionen übersetzen. | Gute Lesbarkeit, beschriftete Aktionen, erkennbare Eingabefelder. |
| Neue Bilder erfinden oder fremde URLs einbetten. | Vorhandene Assets nutzen; fehlende Assets konkret benennen. |
| Formulardaten beim Auf-/Zuklappen neu initialisieren. | Eingaben stabil erhalten und sichtbar validieren. |
| Einen Erfolg nur durch Farbwechsel zeigen. | Konkrete textliche Bestätigung und gegebenenfalls Rückgängig. |
| Einen Bug mit `overflow: hidden` am Body verdecken. | Das überbreite oder falsch positionierte Element korrigieren. |
| Alle Status automatisch grün einfärben. | Zustände semantisch differenzieren; neutral als Standard. |

## 12. Abnahmekriterien und Beweise

### 12.1 Bildschirmgrößen

Mindestens prüfen:

- 320 × 740: schmales Handy.
- 390 × 844: übliches Handy.
- 768 × 1024: Tablet.
- 1024 × 768: kleiner Laptop/Querformat.
- 1440 × 900: Desktop.
- 200 % Browserzoom auf Desktop: Inhalt nutzbar, Layout wechselt bei Bedarf in die schmalere Ansicht.

### 12.2 Marketingnavigation

- [ ] Funktionen, Gewerke und Wissen öffnen per Klick und Tastatur.
- [ ] Nur ein Desktop-Panel ist gleichzeitig offen.
- [ ] Menütexte sind vollständig lesbar und kein Link liegt hinter dem Hero.
- [ ] Desktop-Menü funktioniert auch bei geringer Bildschirmhöhe; alle Links erreichbar.
- [ ] Escape schließt; Fokus kehrt sinnvoll zurück.
- [ ] Tab-Reihenfolge folgt Triggern und Panel logisch, auch bei Portal.
- [ ] Geschlossene Menüs haben keine versteckten fokussierbaren Links.
- [ ] Klick außerhalb schließt; Links funktionieren ohne Doppel-Klick.
- [ ] Mobile Navigation ist sichtbar, überdeckt den Inhalt vollständig und besitzt einen klaren Schließen-Zugang.
- [ ] Unteransichten haben einen sichtbaren Zurückweg.
- [ ] Hintergrund bleibt während des mobilen Menüs nicht bedienbar.
- [ ] Nach Schließen, Navigation und Breakpointwechsel ist die Seite wieder scrollbar.
- [ ] Verlinkte Routen stimmen mit den Beschriftungen überein.
- [ ] Fotos/Vorschauen sind vorhanden, sinnvoll zugeschnitten und ohne Verzerrung.

### 12.3 App

- [ ] Heute, Aufträge, Planen, Betrieb sind konstant erreichbar und beschriftet.
- [ ] Formulare und Daten liegen auf deckenden, ruhigen Flächen.
- [ ] Typografie verwendet die festgelegte Hierarchie ohne willkürlich kleine Ausnahmen.
- [ ] Touchziele sind grundsätzlich mindestens 44 × 44 px, wichtige Aktionen und mobile Navigation mindestens 48 px hoch.
- [ ] Normaler Text erreicht mindestens 4,5:1 Kontrast; Bedienelementgrenzen und Fokusindikatoren werden separat geprüft.
- [ ] Eine Person erkennt pro Arbeitsbereich die Hauptaktion durch Beschriftung und Gestaltung.
- [ ] Lange Kundennamen, Auftragsnamen und Adressen sprengen das Layout nicht.
- [ ] Auftragsformular funktioniert mit bestehendem Kunden, neuem Kunden, mehreren Einsatzorten und fehlender Adresse gemäß bestehender Fachlogik.
- [ ] Optionale Felder verlieren beim Zuklappen keine Werte; Fehler öffnen nötige Bereiche.
- [ ] Lade-, Fehler-, Leer- und Erfolgszustände bleiben verständlich.
- [ ] Rollen und Berechtigungen funktionieren unverändert; keine UI-Abkürzung umgeht Regeln.
- [ ] Beispielbetrieb-Hinweis verdeckt keine Aktion und keine untere Navigation.
- [ ] Keine wiederkehrende Markenanimation blockiert den täglichen Einstieg.
- [ ] Wichtige Aktionen bleiben ohne Hover, Drag-and-drop, Swipe oder KI-Prompt ausführbar.

### 12.4 Sinnvolle technische Checks

- Vorhandenes Linting, Typecheck und Build ausführen, soweit im Repository vorgesehen.
- Bestehende relevante Tests ausführen. Keine Tests schreiben, die nur CSS-Klassennamen spiegeln.
- Für den konkreten mobilen Menüfehler einen Verhaltenstest ergänzen: öffnen → eine sichtbare Menüoption per Pointer wählen → korrekte Navigation → Scroll-Lock gelöst. Zusätzlich Screenshot der offenen Menüfläche prüfen; DOM-Präsenz allein reicht nicht.
- Für Fokussteuerung: öffnen → Tab navigieren → Escape → Fokus auf Trigger.
- Formularzustand testen, falls die Formularlogik geändert wird: optionale Angaben eintragen → zuklappen → öffnen → Werte erhalten; Fehler im geschlossenen Abschnitt werden erreichbar.
- Wenn Kalenderfunktion geändert wird, relevante Zeit- und Konfliktfälle gesondert testen.

### 12.5 Visuelle Beweisführung

Screenshots vor und nach Änderung mit gleicher Viewportgröße und demselben Beispielzustand aufnehmen:

1. Heute, Desktop und Mobile.
2. Auftragsliste, Desktop und Mobile.
3. Auftrag anlegen, Desktop und Mobile.
4. Betrieb.
5. Kalender, Desktop und Mobile.
6. Marketing-Hero, Desktop und Mobile.
7. Geöffnetes Funktions-, Gewerke- und Wissen-Menü, Desktop.
8. Geöffnete mobile Hauptnavigation und eine Unteransicht.
9. Mindestens ein Fehler-/Leerzustand nach tatsächlich veränderter Komponentenlogik.

Keine positive visuelle Abnahme allein aus Build, HTTP-Status oder Accessibility-Tree ableiten. Sichtbar gerenderte Screens prüfen.

### 12.6 Menschlicher Verständlichkeitstest

Nach der technischen Umsetzung mit fünf wenig technikaffinen Personen aus dem Handwerksumfeld prüfen, wenn diese verfügbar sind:

- Finde deinen nächsten Einsatz und seine Adresse.
- Lege einen Auftrag für einen bestehenden Kunden an.
- Finde eine Rechnung.
- Ordne einem Auftrag ein Foto zu.
- Finde auf der Website dein Gewerk und die passende Funktion.

Keine Einweisung während der Aufgabe. Festhalten: Erfolg ohne Hilfe, Zeit bis zur ersten sinnvollen Aktion, Fehlwege, Rückfragen und Stellen, an denen Unsicherheit entsteht. Als erster Zielwert sollen mindestens vier von fünf Personen die zentralen Aufgaben ohne Hilfestellung schaffen. Das ist ein Produktziel, keine bereits nachgewiesene Eigenschaft.

## 13. Abschlussbericht von Claude Code

Nach Umsetzung kurz und nachprüfbar berichten:

1. Welche konkreten Komponenten/Seiten geändert wurden.
2. Welche vorgeschlagenen Menübegriffe auf welche echten Routen abgebildet wurden.
3. Welche bestehenden Assets verwendet wurden und welche noch fehlen.
4. Welche Checks bestanden sind und welche nicht durchgeführt werden konnten.
5. Links/Pfade zu den visuellen Vorher-/Nachher-Belegen.
6. Noch offene fachliche Punkte, z. B. Rollenzuordnung oder Kalenderlogik.
7. Status getrennt: lokal implementiert, technisch geprüft, visuell geprüft, deployed. Nur tatsächlich erreichte Zustände nennen.

**Definition of Done:** Die wesentlichen Alltagsaufgaben sind direkt verständlich, die mobile Navigation funktioniert sichtbar, Marketingmenüs bieten eine klare Auswahl, und die App wirkt durch konsistente Details ruhig und hochwertig. Ein dekorativer Umbau ohne bessere Bedienbarkeit erfüllt diesen Auftrag nicht.

## Anhang: Prüfung der vorgeschlagenen Farben

Rechnerisch geprüfte Kontrastverhältnisse der deckenden Farbpaare dieses Dokuments:

| Kombination | Kontrast |
|---|---:|
| Haupttext auf Weiß | 14,42:1 |
| Sekundärtext auf Weiß | 6,61:1 |
| Gedämpfter Text auf Canvas | 4,92:1 |
| Weiß auf primärem Grün | 6,55:1 |
| Dunkles Grün auf heller Grünfläche | 8,66:1 |
| Warntext auf Warnfläche | 6,57:1 |
| Gefahrentext auf Gefahrenfläche | 6,41:1 |
| Erfolgstext auf Erfolgsfläche | 6,54:1 |
| Feldbegrenzung auf Weiß | 3,75:1 |

Diese Berechnung bestätigt nur die angegebenen deckenden Farbpaare. Im gerenderten Produkt müssen Transparenz, Hintergrundbilder, tatsächliche Tokenzuordnung, Fokuszustände und alle weiteren Kombinationen erneut geprüft werden. Die CSS-Beispiele wurden für dieses Briefing auf ausgeglichene Blockklammern und die Markdown-Codeblöcke auf vollständige Begrenzung geprüft; sie wurden nicht im unbekannten Zielrepository ausgeführt.

## Nachtrag Oktober 2026 (Entscheidung des Betreibers)

Ergänzt und ändert die Abschnitte oben, wo sie widersprechen:

- **Seitenleiste:** 264 px breit, schwebend mit 16 px Abstand zum Fensterrand (auch oben), Radius 20 px.
- **Aufgelegte Flächen:** Seitenleiste, Karten, Listen und Home-Widgets bekommen den Schatten `--mm-shadow-lift`
  (Lichtkante oben, Kontakt- und weicher Fallschatten) – wie Karten, die auf den Tisch gelegt wurden. Weiter deckend, kein Glas.
- **Bento nach Bedeutung:** Boxen sind nicht alle gleichfarbig. Die wichtigste große Box darf grün sein (weiße Schrift,
  weißer Hauptknopf); Begleitboxen warm beige oder hellgrün; Arbeitslisten bleiben weiß.
- **KI-Zeichen:** Kugel Pink → Orange (`--mm-ki-*`), nur für Macher (KI). In der Navigation nur eine Fläche:
  Lupe, „Suchen“ und Kürzel – keine Kugel. Ein Klick öffnet die KI-Leiste (Eingabe mit Verlaufsrand und Kugel).
- **Dringend ist rot** (Gefahr-Ton), nie gelb. Überfällig ist ebenfalls rot (hellrote Fläche, dunkelrote Schrift) und färbt die ganze Kennzahl-Karte.
- **Typ-Icons in Listen:** einfache Strich-Icons, keine Glas-Icons; **Kunden** mit Logo von ihrer Website oder Initialen.
- **Farbtöne je Art:** Typ-Kacheln bekommen je Art einen eigenen Ton – heller Grund, dunklere Linie im selben Ton
  (`TypIcon ton`, Tokens `--mm-ton-*`: grün, blau, petrol, gelb, lila, sand, rose). Gelb nur für Arten, die Aufmerksamkeit
  brauchen (Reklamation). Töne unterscheiden Arten, nie Status.
- **Emojis für Werte:** vor Werten, die eine Art beschreiben (Abwesenheit, Terminart, Zeitart), immer zusammen mit Text –
  in Auswahlen, Listen und Meldungen gleich (`src/os/core/zeichen.ts`). Nie für Status, Geld, Zahlen oder Aktionen.
- **Titel-Icons:** Karten und Dialoge, die eine Aufgabe überschreiben, tragen ein kleines Strich-Icon vor dem Titel (`icon`).
- **Kalender:** links Datum und Blättern, rechts Ansicht und Filter.
