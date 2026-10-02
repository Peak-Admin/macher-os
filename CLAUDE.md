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
  - Primärbutton: `#06480C` mit weißer Schrift. Hover `#1F6135`.
  - Markengrün `#2F9250` für Akzente, aktive Rahmen, große Typo – nicht für kleinen weißen Buttontext.
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

## Marketing-Website (Next.js)

Next.js (App Router, Turbopack) + TypeScript + Tailwind CSS v4. Alles wird statisch erzeugt.

### Befehle

- `npm run dev` – Entwicklungsserver
- `npm run build` – Produktions-Build (prüft auch TypeScript)
- `npm run lint` – ESLint
- `python3 scripts/playbook-sweep.py src` – zieht Klassen idempotent auf das Playbook nach (nach größeren Änderungen ausführen)
- `node --experimental-strip-types src/content/werkzeuge/rechnen.test.mjs` – Tests der Rechner

### Struktur

- `src/app/(marketing)/` – alle Marketingseiten mit Header + Footer
- `src/app/(auth)/` – `/signup` und `/login` ohne Marketing-Navigation
- `src/components/ui/` – Grundbausteine (Section, SectionHeading, ButtonLink, ArrowLink, Card, CheckList, Badge, Faq, Icon, Breadcrumbs)
- `src/components/sections/` – wiederkehrende Abschnitte (PageHero, FinalCta, Steps, Flow, TrustRow, KundenCard, PlanCards)
- `src/components/mocks/` – stilisierte Produktansichten (ProductMock, PhoneMock, PlanBoardMock)
- `src/content/registry.ts` – kanonische Slugs aller Funktionen, Gewerke, Werkzeuge, Kunden. Querverlinkungen nur über diese Slugs.
- `src/content/*.ts` – Seiteninhalte als typisierte Daten
- `src/content/bilder.ts` – Bildregister; Fotos liegen unter `public/bilder/`, eingebunden nur über `<Foto bild="…" />`
  (`src/components/ui/Foto.tsx`, serverseitig). Fehlt eine Datei, erscheint eine Markenfläche. Liste: `docs/design/bilder.md`
- `src/components/sections/Bild.tsx` – Bildbausteine im Mission-Mittelstand-Stil (BildKarten, BereichsKarte, BildText, FotoBuehne, DunklerAbschnitt)
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
  (`signal` = Aktionsgrün `#06480C`, `signal-dark` = Textgrün `#1F6135`, `brand` = Markengrün `#2F9250`,
  `accent` = Akzentgrün `#69AF44` für dunkle Flächen, `ink` = Markendunkel, `paper` = Arbeitsfläche,
  `line`, `muted`; `font-display` = Barlow, `font-tagline` = Poppins für Oberzeilen). Keine festen HEX-Werte in Komponenten.
- Primäraktion: `bg-signal text-white hover:bg-signal-dark`. Auf dunklen Flächen Akzente mit `text-accent`.
