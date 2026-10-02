@AGENTS.md

# Macher OS – Marketing-Website

Next.js (App Router, Turbopack) + TypeScript + Tailwind CSS v4. Alles wird statisch erzeugt.

## Befehle

- `npm run dev` – Entwicklungsserver
- `npm run build` – Produktions-Build (prüft auch TypeScript)
- `npm run lint` – ESLint

## Struktur

- `src/app/(marketing)/` – alle Marketingseiten mit Header + Footer
- `src/app/(auth)/` – `/signup` und `/login` ohne Marketing-Navigation
- `src/components/ui/` – Grundbausteine (Section, SectionHeading, ButtonLink, ArrowLink, Card, CheckList, Badge, Faq, Icon, Breadcrumbs)
- `src/components/sections/` – wiederkehrende Abschnitte (PageHero, FinalCta, Steps, Flow, TrustRow, KundenCard, PlanCards)
- `src/components/mocks/` – stilisierte Produktansichten (ProductMock, PhoneMock, PlanBoardMock)
- `src/content/registry.ts` – kanonische Slugs aller Funktionen, Gewerke, Werkzeuge, Kunden. Querverlinkungen nur über diese Slugs.
- `src/content/*.ts` – Seiteninhalte als typisierte Daten
- `src/lib/site.ts` – Navigation, Footer, CTAs
- `src/lib/metadata.ts` – `pageMeta()` für Titel, Beschreibung, Canonical

## Regeln

- Sprache: einfaches Deutsch, Handwerkersprache, kurze Sätze, „du“. Keine SaaS-/ERP-Begriffe
  („Mitarbeiter planen“ statt „Workforce Management“, „Werkzeuge“ statt „Tools“).
- CTA-System: primär „Kostenlos testen“ (`/signup`), sekundär „Demo ansehen“ (`/demo`).
- Jede wichtige Seite: Nutzen-Headline, Produktbeweis/Visual, Alltagssituation, Funktionsweise,
  Vertrauen, FAQ, eindeutiger CTA (`FinalCta`).
- Keine erfundenen Fakten als echt ausgeben: Kundenstories sind als „Beispiel“ markiert,
  keine erfundenen Kennzahlen, Zertifikate oder Firmendaten. Preise in `src/content/preise.ts` sind Platzhalter.
- Dynamische Routen: `generateStaticParams` + `export const dynamicParams = false`; `params` ist ein Promise.
- Farben/Fonts nur über die Tokens in `src/app/globals.css` (`ink`, `paper`, `sand`, `line`, `muted`,
  `signal`, `moss`, `sky`; `font-display`).
