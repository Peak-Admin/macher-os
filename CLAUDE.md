@AGENTS.md

# macher-os – Hinweise für Claude

macher-os ist ein Handwerks-OS (siehe `README.md`). Projektsprache ist Deutsch.

## Design & Marke – verbindlich

Für **jede** Oberfläche, jedes Mockup und jeden UI-Text gilt die UX- und Designspezifikation (Oktober 2026):
**[`docs/design/ux-spezifikation.md`](docs/design/ux-spezifikation.md)**.
**Sie überschreibt alle bisherigen Designvorgaben.** Das Brand Playbook
([`docs/design/brand-playbook.md`](docs/design/brand-playbook.md)) und die älteren Festlegungen
([`docs/design/festlegungen.md`](docs/design/festlegungen.md)) gelten nur noch, wo die Spezifikation nichts sagt
(z. B. Logo, Bildsprache, Markenauftakt). Leitsatz: „Das sieht ordentlich aus. Das verstehe ich. Damit kann ich arbeiten.“

Bildsprache: **[`docs/design/visual-assets.md`](docs/design/visual-assets.md)** – „das digitale Werkzeug“. Echte Fotos von
Handwerksobjekten (Register `src/lib/objekte.ts`; Website `<Objekt>`, Card-Prop `objekt`) als ruhige Ebene – ein starkes
Objekt pro Karte, nie in Listen, Tabellen, Formularen. **In der Software** stehen statt Objektfotos Zeichnungen: Türen und
Widget-Köpfe `<SkizzenKachel>`, `Leer` zeigt automatisch die Fenster-Skizze (`MacherAsset` nur noch, wenn ausdrücklich gewollt).
Fotos von Mission Mittelstand / Matthias Aumann nur mit Freigabe des Betreibers (siehe `missionMittelstandBilder`).
Karten, die eine Funktion kurz erklären, zeigen statt Foto oder Icon eine abstrakte **Skizze** (`<Skizze motiv="angebote" />`,
Card-Prop `skizze`) oder eine **UI-Ebene** mit Beispieldaten (`<UiEbene>`). Einstiegs- und Teaserkarten (erste Schritte,
Schnittstellen, „Kommt bald“) zeigen die **Fenster-Skizze**: Drahtgitter-Fenster mit grauem Glas-Icon (`src/os/ui/fenster.tsx`,
Website `<Fenster>` bzw. Card-Prop `fenster`). Regeln: `docs/design/festlegungen.md`.

Reihenfolge bei Zielkonflikten: 1. Aufgabe verstehen und erledigen · 2. Orientierung, Lesbarkeit, Fehlertoleranz ·
3. konsistente, ruhige Gestaltung · 4. Markenwirkung und Dekoration.

Die wichtigsten Festlegungen in Kürze (Tokens: `src/os/ui/tokens.css` für die Software, `src/app/globals.css` für die Website):

- **Schrift:** Barlow für alles; Poppins 600 nur für kurze Marketing-Überzeilen in Versalien. Kein Fontwechsel.
  App-Text 16 px, Feldbeschriftungen 16 px, 14 px nur für Metadaten und Hilfetexte. Abschnittstitel in normaler Schreibweise,
  keine automatische Silbentrennung in Überschriften und Navigation.
- **Farben:** ein Grün für alle Hauptaktionen: `#0d6b45` (Hover `#095436`, aktiv `#073f29`), helle Grünfläche `#e8f2ec`,
  dunkles Grün für Text/Links `#164c34`, Waldgrün `#102c21` für dunkle Markenflächen.
  Canvas `#f5f6f3`, Flächen `#ffffff`, ruhige Fläche `#eef1ed`, Text `#222c26`, Sekundärtext `#536057`,
  Linien `#dce2dc`, Feldrahmen `#7a8780`. Status: Warnung `#765000` auf `#fff4d6`, Gefahr `#a02b24` auf `#fdeceb`,
  Erfolg `#1f6040` auf `#e8f2ec`. Akzentgrün `#69af44` nur auf dunklen Flächen. Orange `#e69433` nur für Kampagnen.
  EU-Blau `#003399` (Token `eu` / `--mm-eu`) nur für den Vertrauenskasten (DSGVO, Server in Frankfurt, EU AI Act).
- **Form:** Radien Controls 8 px, Karten/Panels 12 px, Menüs/Dialoge 16 px; flach, feine Schatten.
- **Raster:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 px. App: Sidebar 232 px, Topbar 64 px, Inhalt max. 1280 px, Formulare max. 800 px.
- **Controls:** Buttons und Felder 48 px hoch, Label oberhalb, sichtbarer 3-px-Fokusring. Primärbutton: Weiß auf `#0d6b45`, 16 px halbfett.
  Genau eine gefüllte grüne Hauptaktion je Aufgabe; häufige Nebenaktionen sichtbar.
- **Steuerelemente:** Bereichsnavigation als unterstrichene Reihe, untergeordnete Ansichten als heller Umschalter –
  keine dunklen Balken, keine dunklen Filterflächen.
- **App-Flächen:** deckend und ruhig – kein Foto und kein Glas (`backdrop-filter`) hinter Daten, Formularen, Listen.
- **Icons:** Themen-Icons ab ca. 32 px sind Glas-Icons (`src/os/ui/glas.tsx`, eine Quelle für Website und Software;
  Website über `IconTile`, Software über `ThemenIcon`). Bedien-Icons und alles Kleinere bleiben Strich-Icons.
  Die Navigation der Software (Seitenleiste, untere Leiste, Favoriten) zeigt ebenfalls Glas-Icons.
  Neue Motive in `glas.tsx` ergänzen. Details: `docs/design/festlegungen.md`.
- **Status:** immer Text + optional Icon, nie nur Farbe. Neutral als Standard; Rot nur für echte Sperre/Gefahr („Nicht verwenden“).
- **Tonalität:** direkte Du-Ansprache („du“, „dein“ klein), konkrete Verben („Auftrag anlegen“), kurze Sätze, keine erfundenen Zahlen.
- **Bewegung:** 140–180 ms ease-out, keine Layoutsprünge, `prefers-reduced-motion` respektieren. Markenintro nur beim Erstkontakt.
- **Vermeiden:** durchscheinende Fotos hinter Arbeitsinhalt, nur per Hover/Swipe/Drag-and-drop erreichbare Aktionen,
  reine Icon-Navigation, globales Plus-Menü, Auto-Carousels, mehrere konkurrierende Grüntöne, kleine kontrastarme Schrift.
- Jeder Screen braucht gestaltete Leer-, Lade-, Fehler- und Erfolgszustände und funktioniert ab 320 px Breite ohne waagerechten Überlauf.

## Website und Software (ein Next.js-Projekt)

Next.js (App Router, Turbopack) + TypeScript + Tailwind CSS v4. Alles wird statisch erzeugt.
Website und Software laufen in **einem** Projekt auf **einer** Domain: Website unter `/`, Macher OS (die Software) unter `/os`.
Es gibt kein eigenes App-Projekt mehr (früher `os/` bzw. `macher-os-app`).

### Deployment – nur `macher-os`

- Einziges Ziel: Vercel-Team „01 Peak Atlas Web“ → Projekt **`macher-os`**. Nur sein Check zählt.
- **`macher-os-app` ist stillgelegt.** Taucht noch ein (roter) Check „macher-os-app“ auf: ignorieren.
  Nicht reparieren, nichts dorthin deployen, keine Einstellungen oder Variablen dort anlegen.
- Code der Software gehört nach `src/os/`. Den alten Ordner `os/` nicht anfassen und nicht neu anlegen.

### Befehle

- `npm run dev` – Entwicklungsserver
- `npm run build` – Produktions-Build (prüft auch TypeScript)
- `npm run lint` – ESLint
- `npm run typecheck` – TypeScript (Website und Software)
- `npm test` – Tests der Software (vitest, `src/os/**/*.test.ts`)
- `python3 scripts/playbook-sweep.py src` – zieht Klassen idempotent auf das Playbook nach (nach größeren Änderungen ausführen)
- `node --experimental-strip-types src/content/werkzeuge/rechnen.test.mjs` – Tests der Rechner
- `npm run test:ux` – Verhaltenstests im echten Browser: Website-Navigation und „Auftrag anlegen“ (Playwright; Server muss laufen)
- `node scripts/ux/screenshots.mjs <ordner>` – Vorher-/Nachher-Screenshots der Kernseiten (Spielwiese, 390/1440 px)

### Struktur

- `src/app/(marketing)/` – alle Marketingseiten mit Header + Footer (eigenes Root-Layout)
- `src/app/(os)/os/` – Route `/os` mit eigenem Root-Layout; lädt die Software nur im Browser. Jede Adresse `/os/…`
  zeigt per Rewrite (`next.config.ts`) diese Seite, den Rest regelt React Router (`basename` = `BASIS` aus `src/os/core/basis.ts`).
  Links außerhalb des Routers (`window.open`, kopierte Links) immer mit `appPfad()` bauen.
- `src/os/` – **Macher OS, die Software** (Module, Kern, UI). Regeln: `docs/os/MODULE.md`, `docs/os/PAKETE.md`.
  Eigene Stile (`src/os/ui/*.css`, `--mm-*`), keine Tailwind-Klassen. Die Modulliste `src/os/shell/module-liste.ts`
  erzeugt `scripts/os-module.mjs` automatisch (vor `dev`, `build`, `test`).
- `/signup` und `/login` leiten in die Software (`/os/willkommen`, `/os/heute`)
- `src/components/ui/` – Grundbausteine (Section, SectionHeading, ButtonLink, ArrowLink, Card, CheckList, Badge, Faq, Icon, Breadcrumbs)
- `src/components/sections/` – wiederkehrende Abschnitte (PageHero, FinalCta, Steps, Flow, TrustRow, KundenCard, PlanCards)
- `src/components/mocks/` – stilisierte Produktansichten (AppVorschau = klickbare Vorschau, PhoneMock, PlanBoardMock); auf der Website liegen sie im grünen `VorschauRahmen`
- `src/content/registry.ts` – kanonische Slugs aller Funktionen, Gewerke, Werkzeuge, Kunden. Querverlinkungen nur über diese Slugs.
- `src/content/*.ts` – Seiteninhalte als typisierte Daten
- `src/content/bilder.ts` – Bildregister; Fotos liegen unter `public/bilder/`, eingebunden nur über `<Foto bild="…" />`
  (`src/components/ui/Foto.tsx`, serverseitig). Fehlt eine Datei, erscheint eine Markenfläche. Liste: `docs/design/bilder.md`
- `src/components/sections/Bild.tsx` – Bildbausteine im Mission-Mittelstand-Stil (BildKarten, BereichsKarte, BildText, FotoBuehne, DunklerAbschnitt)
- `src/components/auftakt/` – Markenauftakt (Preloader, einmal pro Sitzung, Website und Software). Doku: `docs/design/auftakt.md`
- `src/lib/site.ts` – Navigation, Footer, CTAs
- `src/lib/metadata.ts` – `pageMeta()` für Titel, Beschreibung, Canonical

### Regeln

- Verkaufsargumente nur gegen einen Einwand aus `docs/produkt/einwaende.md` und nur, wenn sie heute stimmen.
- Sprache: einfaches Deutsch, Handwerkersprache, kurze Sätze, „du“. Keine SaaS-/ERP-Begriffe
  („Mitarbeiter planen“ statt „Workforce Management“, „Werkzeuge“ statt „Tools“).
- CTA-System: primär „Kostenlos testen“ (`/signup`), sekundär „Demo ansehen“ (`/demo`).
- Jede wichtige Seite: Nutzen-Headline, Produktbeweis/Visual, Alltagssituation, Funktionsweise,
  Vertrauen, FAQ, eindeutiger CTA (`FinalCta`).
- Keine erfundenen Fakten als echt ausgeben: Kundenstories sind als „Beispiel“ markiert,
  keine erfundenen Kennzahlen, Zertifikate oder Firmendaten. Preise in `src/content/preise.ts` sind Platzhalter.
- Dynamische Routen: `generateStaticParams` + `export const dynamicParams = false`; `params` ist ein Promise.
- Farben/Fonts nur über die Tokens in `src/app/globals.css` – sie bilden die UX-Spezifikation ab
  (`primary`/`brand` = Aktionsgrün `#0d6b45`, `signal`/`signal-dark` = dunkles Grün `#164c34` für Text und Badges,
  `signal-soft` = helle Grünfläche, `accent` = Akzentgrün nur auf dunklen Flächen, `ink` = Waldgrün `#102c21`,
  `paper` = Canvas, `line`, `muted` = Sekundärtext, `logo` = Logogrün; `font-display` = Barlow, `font-tagline` = Poppins).
  Keine festen HEX-Werte in Komponenten.
- Primäraktion: `btn-primaer` (bzw. `ButtonLink` Variante `primary`), mind. 48 px hoch. Auf dunklen Flächen Akzente mit `text-accent`.
- Website-Navigation: Daten in `mainNav` (`src/lib/site.ts`), Kopf in `src/components/layout/Header.tsx`.
  Desktop ab 1200 px (`nav:`-Breakpoint), Mega-Menüs per Klick, höchstens vier Links je Gruppe, nur echte Ziele.
  Darunter ein modaler `<dialog>` (`showModal`). Der Kopf ist ein fester Glas-Kopf nach Peak One, der auf dem Hero liegt
  und der Box darunter folgt (`data-header-theme="dunkel" | "hell"`). `backdrop-filter` nur auf den eigenen Glasebenen
  (`.kopf-glas`), nie auf `<header>` selbst (macht ihn zum Bezugsrahmen für fest positionierte Kinder).
- Website-Abschnitte als Boxen (`Zone` aus `src/components/ui/Zone.tsx`, nach Peak One `mk-zone`): Rand zum Fenster,
  Radius 12/16/24 px, Töne im Wechsel dunkelgrün · beige (`beige` = `#f4efe6`, Gegenfarbe) · weiß; Footer und
  Abschluss-CTA sind ebenfalls Boxen.

## Verbindlicher Architektur- & Produktstandard

Alle Arbeit an macher-os folgt der **Peak Atlas Software Constitution v1.0**:
[`docs/Peak_Atlas_Software_Constitution_v1.0.md`](docs/Peak_Atlas_Software_Constitution_v1.0.md).

Vor Architektur-, Datenmodell- oder UX-Entscheidungen das Dokument konsultieren. Kernregeln (Kurzfassung von §70):

1. **Eine Business-Realität, viele Lenses.** Kanonische Objekte (Kunde, Auftrag/Projekt, Task, Dokument, Angebot, Rechnung, …) existieren genau einmal – eine ID, eine Source of Truth. Apps/Module sind Sichten, keine Silos. Keine Duplikate, Beziehungen statt kopierter Daten.
2. **Ein Task ist überall derselbe Task.** Domänen ergänzen nur Kontext-Metadaten.
3. **Generische Relationship-Schicht**, Timeline/Audit pro Objekt, **Events** für relevante Zustandsänderungen (`task.created`, `invoice.overdue`, …).
4. **Pain Score = Frequenz × Intensität (je 1–10).** Er bestimmt Navigation, Workflow-Position und visuelle Hierarchie. Ausnahmen, Risiken und nötige Entscheidungen zuerst zeigen (Exception-First).
5. **3–4 primäre Navigationspunkte**, workflow-orientiert; Progressive Disclosure; Opinionated Defaults; Focus over Feature Density.
6. **Multi-Tenant von Anfang an** (Organization → Workspace → …), RLS als Pflicht. Supabase als zentrales transaktionales Fundament.
7. **AI-native:** KI kennt Kontext und respektiert dieselben Berechtigungen wie Menschen. Capabilities getrennt nach READ / WRITE / MONEY / PUBLICATION / DESTRUCTIVE / ADMIN; risikobasierte Freigaben.
8. **Konfiguration statt kundenspezifischer Forks.** Reversibel per Default (Soft Delete, Versionen, Audit).
9. **Evidenz & Lineage** für wichtige Fakten und Empfehlungen (FACT / CALCULATION / INFERENCE / ESTIMATE / RECOMMENDATION).
10. **Jedes größere Feature muss einen ausreichend wichtigen Pain lösen.** Das Produkt wird einfacher, während das System mächtiger wird.

Visuelle Sprache: Für macher-os gelten das Brand Playbook und die Festlegungen (oben). Die Farbangaben der Constitution (Ivory, Burgundy) gelten hier nicht.

**KI:** Jede KI-Funktion läuft über den Macher AI Gateway (`src/os/core/gateway.ts`, Strategie und Stand:
[`docs/os/KI-GATEWAY.md`](docs/os/KI-GATEWAY.md)). Kein Modul spricht direkt mit einem Modell; Module melden Absichten
und Aktionen über `defineModul({ gateway })` an. Regeln vor Jev vor Luna vor stärkerem Modell; kritische Aktionen immer bestätigen.

Größere Module werden mit einer **Master Build Specification** (§66) und der **Peak Build Sequence** (§65) geplant.
