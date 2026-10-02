# macher-os

**Das Betriebssystem für Handwerksbetriebe.**

macher-os ist ein Handwerks-OS: eine zentrale Plattform, die Handwerksbetrieben hilft, ihren Alltag digital zu organisieren – vom ersten Kundenkontakt bis zur fertigen Rechnung.

## Vision

Handwerker sollen sich auf ihr Handwerk konzentrieren können, nicht auf Zettelwirtschaft und Verwaltung. macher-os bündelt alles, was ein Betrieb täglich braucht, an einem Ort – einfach, mobil und praxisnah.

## Mögliche Bereiche

- **Kunden & Anfragen** – Kontakte, Anfragen und Kommunikation verwalten
- **Angebote & Rechnungen** – schnell erstellen, versenden und nachverfolgen
- **Aufträge & Projekte** – Baustellen planen und den Fortschritt im Blick behalten
- **Termine & Einsatzplanung** – Mitarbeiter und Einsätze koordinieren
- **Zeiterfassung** – Arbeitszeiten direkt auf der Baustelle erfassen
- **Material & Lager** – Bestände und Bestellungen im Griff
- **Dokumentation** – Fotos, Notizen und Abnahmen pro Auftrag

## Design

Gestaltung und Tonalität folgen dem [Brand & Software Design Playbook](docs/design/brand-playbook.md).

## Struktur

| Ordner | Inhalt |
|---|---|
| `os/` | **Macher OS – die Software** (React + Vite): 81 Module in den Bereichen Heute · Aufträge · Plan · Betrieb, plus Macher (Assistenz & Automation) |
| `src/` | Marketing-Website (Next.js) |
| `docs/` | Design-Playbook, Produkt-Modulliste (`docs/produkt/module.md`), Website-Struktur |

## Macher OS (Software) entwickeln

```bash
cd os
npm install
npm run dev        # http://localhost:5173 → Onboarding unter /willkommen
npx tsc -b && npx vitest run && npx vite build
```

Architektur und Regeln: [`os/MODULE.md`](os/MODULE.md) (Modul bauen, Kern-APIs), [`os/PAKETE.md`](os/PAKETE.md)
(Pakete, Verträge zwischen Modulen). Grundsatz: **jedes Objekt existiert genau einmal** (`os/src/core/objects.ts`),
Module sind nur Sichten darauf und hängen sich über `defineModul` automatisch ein. Daten liegen derzeit lokal im
Browser (IndexedDB); die Datenschicht ist für ein späteres Backend (z. B. Supabase) geschnitten. Je Modul liegt eine
Pain-Point-Analyse in `os/src/modules/<modul>/PAINPOINTS.md`.

## Marketing-Website entwickeln

Die Marketing-Website ist eine Next.js-App. Siehe `CLAUDE.md` für Struktur und Regeln und `docs/marketing-website-struktur.md` für die Informationsarchitektur.

```bash
npm install
npm run dev
```

## Status

🚧 Erste vollständige Fassung der Software (lokal im Browser lauffähig) und der Marketing-Website.
