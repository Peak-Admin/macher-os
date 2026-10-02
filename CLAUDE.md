@AGENTS.md

# macher-os – Hinweise für Claude

macher-os ist ein Handwerks-OS (siehe `README.md`). Projektsprache ist Deutsch.

## Design & Marke – verbindlich

Für **jede** Oberfläche, jedes Mockup und jeden UI-Text gilt das Brand & Software Design Playbook:
**[`docs/design/brand-playbook.md`](docs/design/brand-playbook.md)** (Mission Mittelstand, v1.0).

Zusätzlich gelten die bestätigten Festlegungen und Orientierungsbeispiele in
**[`docs/design/festlegungen.md`](docs/design/festlegungen.md)** (Primärbutton, Icon-Kacheln, Wechsler, Referenzmuster) –
bei Widerspruch haben sie Vorrang vor dem Playbook.

Vor UI-Arbeit lesen: Abschnitte 2–5 (Marke, Farben, Schrift), 6–11 (Layout, Komponenten, Tonalität, Screens),
14 (Design-Tokens als CSS-Start), 16 (Abnahmecheckliste).

Die wichtigsten Festlegungen in Kürze:

- **Schrift:** Barlow (400–900) für alles; Poppins 600 nur für kleine Oberzeilen in Versalien. Kein Ersatz durch Inter/System-Fonts.
- **Farben:** nur die Palette aus Abschnitt 4 / Tokens aus Abschnitt 14 (`--mm-*`).
  - Primärbutton: Markengrün `#2F9250`, weiße Schrift 19 px fett (darunter reicht der Kontrast nicht). Hover `#1F6135`.
  - Tiefes Grün `#06480C` für kleine weiße Texte auf Grün (Badges, Schrittnummern).
  - Kleine grüne Links/Texte: `#1F6135`.
  - Arbeitsfläche hell: `#F7FAFB`, Karten `#FFFFFF`, Linien `#D9D9D9`, Text `#374040`.
  - Orange `#E69433` nur für Kampagnen, nie als konkurrierende Hauptaktion.
- **Form:** kleine Radien (Controls 4 px, Karten 5–8 px, Dialoge 8 px), überwiegend flach, feine Schatten.
- **Raster:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px. Sidebar 240 px, Topbar 64 px, max. Inhaltsbreite 1360 px.
- **Controls:** Höhe 44 px, Label oberhalb jedes Feldes, sichtbarer 2-px-Fokusring.
- **Status:** immer Text + optional Icon, nie nur Farbe (neutral / in Bearbeitung / erfolgreich / Aufmerksamkeit).
- **Tonalität:** direkte Du-Ansprache („du“, „dein“ klein), konkrete Verben („Auftrag anlegen“), kurze Sätze, keine erfundenen Zahlen.
- **Bewegung:** 120–180 ms ease-out, keine Layoutsprünge, `prefers-reduced-motion` respektieren.
- **Vermeiden:** große Pillen-Radien überall, beliebiges Smaragdgrün, lila/blaue KI-Verläufe, Versalien im Arbeitsalltag,
  Stockfotos als Ansprechpartner, mehrere bunte Hauptaktionen.
- Jeder Screen braucht gestaltete Leer-, Lade-, Fehler- und Erfolgszustände und funktioniert bei 390 px Breite.

## Website und Software (ein Next.js-Projekt)

Next.js (App Router, Turbopack) + TypeScript + Tailwind CSS v4. Alles wird statisch erzeugt.
Website und Software laufen in **einem** Projekt auf **einer** Domain: Website unter `/`, Macher OS (die Software) unter `/os`.
Es gibt kein eigenes App-Projekt mehr (früher `os/` bzw. `macher-os-app`).

### Deployment – nur `macher-os`

- Einziges Ziel: Vercel-Team „01 Peak Atlas Web“ → Projekt **`macher-os`**. Nur sein Check zählt.
- **`macher-os-app` ist stillgelegt.** Es hängt noch am Repo und baut bei jedem Push mit – und schlägt fehl.
  Diesen roten Check ignorieren: nicht reparieren, nichts dorthin deployen, keine Einstellungen oder Variablen dort anlegen.
- Code der Software gehört nach `src/os/`. Den alten Ordner `os/` nicht anfassen und nicht neu anlegen.

### Befehle

- `npm run dev` – Entwicklungsserver
- `npm run build` – Produktions-Build (prüft auch TypeScript)
- `npm run lint` – ESLint
- `npm run typecheck` – TypeScript (Website und Software)
- `npm test` – Tests der Software (vitest, `src/os/**/*.test.ts`)
- `python3 scripts/playbook-sweep.py src` – zieht Klassen idempotent auf das Playbook nach (nach größeren Änderungen ausführen)
- `node --experimental-strip-types src/content/werkzeuge/rechnen.test.mjs` – Tests der Rechner

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
- `src/components/mocks/` – stilisierte Produktansichten (ProductMock, PhoneMock, PlanBoardMock)
- `src/content/registry.ts` – kanonische Slugs aller Funktionen, Gewerke, Werkzeuge, Kunden. Querverlinkungen nur über diese Slugs.
- `src/content/*.ts` – Seiteninhalte als typisierte Daten
- `src/content/bilder.ts` – Bildregister; Fotos liegen unter `public/bilder/`, eingebunden nur über `<Foto bild="…" />`
  (`src/components/ui/Foto.tsx`, serverseitig). Fehlt eine Datei, erscheint eine Markenfläche. Liste: `docs/design/bilder.md`
- `src/components/sections/Bild.tsx` – Bildbausteine im Mission-Mittelstand-Stil (BildKarten, BereichsKarte, BildText, FotoBuehne, DunklerAbschnitt)
- `src/components/auftakt/` – Markenauftakt (Preloader, einmal pro Sitzung, Website und Software). Doku: `docs/design/auftakt.md`
- `src/lib/site.ts` – Navigation, Footer, CTAs
- `src/lib/metadata.ts` – `pageMeta()` für Titel, Beschreibung, Canonical

### Regeln

- Sprache: einfaches Deutsch, Handwerkersprache, kurze Sätze, „du“. Keine SaaS-/ERP-Begriffe
  („Mitarbeiter planen“ statt „Workforce Management“, „Werkzeuge“ statt „Tools“).
- CTA-System: primär „Kostenlos testen“ (`/signup`), sekundär „Demo ansehen“ (`/demo`).
- Jede wichtige Seite: Nutzen-Headline, Produktbeweis/Visual, Alltagssituation, Funktionsweise,
  Vertrauen, FAQ, eindeutiger CTA (`FinalCta`).
- Keine erfundenen Fakten als echt ausgeben: Kundenstories sind als „Beispiel“ markiert,
  keine erfundenen Kennzahlen, Zertifikate oder Firmendaten. Preise in `src/content/preise.ts` sind Platzhalter.
- Dynamische Routen: `generateStaticParams` + `export const dynamicParams = false`; `params` ist ein Promise.
- Farben/Fonts nur über die Tokens in `src/app/globals.css` – sie bilden das Playbook ab
  (`primary` = Primärbutton `#2F9250`, `signal` = tiefes Grün `#06480C`, `signal-dark` = Textgrün `#1F6135`, `brand` = Markengrün `#2F9250`,
  `accent` = Akzentgrün `#69AF44` für dunkle Flächen, `ink` = Markendunkel, `paper` = Arbeitsfläche,
  `line`, `muted`; `font-display` = Barlow, `font-tagline` = Poppins für Oberzeilen). Keine festen HEX-Werte in Komponenten.
- Primäraktion: `btn-primaer` (bzw. `ButtonLink` Variante `primary`). Auf dunklen Flächen Akzente mit `text-accent`.

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

Größere Module werden mit einer **Master Build Specification** (§66) und der **Peak Build Sequence** (§65) geplant.
