# CLAUDE.md

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

Visuelle Sprache: clean, premium, Ivory/Off-White, Burgundy als Akzent, funktionale Bento-Hierarchie, Motion nur zur Erklärung.

Größere Module werden mit einer **Master Build Specification** (§66) und der **Peak Build Sequence** (§65) geplant.
