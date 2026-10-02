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
| `src/os/` | **Macher OS – die Software** (React, läuft unter `/os`): 81 Module, sichtbar in genau vier Bereichen Heute · Aufträge · Planen · Betrieb (Zielstruktur: [`docs/produkt/navigation.md`](docs/produkt/navigation.md)) |
| `src/app/(os)/` | Next.js-Route `/os`, die die Software lädt |
| `src/app/(marketing)/`, `src/components/`, `src/content/` | Marketing-Website |
| `docs/` | Design-Playbook, Produkt-Modulliste (`docs/produkt/module.md`), Website-Struktur |

## Entwickeln

Website und Software sind **ein** Next.js-Projekt mit **einer** Domain: die Website unter `/`, die Software unter `/os`.

```bash
npm install
npm run dev        # http://localhost:3000 → Website, http://localhost:3000/os/willkommen → Einrichtung der Software
npm run typecheck && npm test && npm run lint && npm run build
```

Architektur und Regeln der Software: [`docs/os/MODULE.md`](docs/os/MODULE.md) (Modul bauen, Kern-APIs), [`docs/os/PAKETE.md`](docs/os/PAKETE.md)
(Pakete, Verträge zwischen Modulen). Grundsatz: **jedes Objekt existiert genau einmal** (`src/os/core/objects.ts`),
Module sind nur Sichten darauf und hängen sich über `defineModul` automatisch ein. Daten liegen derzeit lokal im
Browser (IndexedDB); die Datenschicht ist für ein späteres Backend (z. B. Supabase) geschnitten. Je Modul liegt eine
Pain-Point-Analyse in `src/os/modules/<modul>/PAINPOINTS.md`.

Zur Website: Struktur und Regeln in `CLAUDE.md`, Informationsarchitektur in `docs/marketing-website-struktur.md`.

## Status

🚧 Erste vollständige Fassung der Software (lokal im Browser lauffähig) und der Marketing-Website.
