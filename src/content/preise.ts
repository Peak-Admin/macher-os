/**
 * Preispläne. ACHTUNG: Platzhalterwerte – vor dem Livegang durch die echten
 * Preise ersetzen. Alle Preise netto pro Monat.
 */
export type Plan = {
  id: string;
  name: string;
  fuer: string;
  monatlich: number | null;
  /** Monatspreis bei jährlicher Zahlung */
  jaehrlich: number | null;
  nutzer: string;
  vorteile: string[];
  hervorgehoben?: boolean;
  cta: { label: string; href: string };
};

export const plaene: Plan[] = [
  {
    id: "solo",
    name: "Solo",
    fuer: "Für Ein-Mann-Betriebe und Gründer",
    monatlich: 39,
    jaehrlich: 32,
    nutzer: "1 Chef + 1 Mitarbeiter",
    vorteile: ["Anfragen, Angebote & Rechnungen", "Kalender & Termine", "App für die Baustelle", "Vorlagen für dein Gewerk"],
    cta: { label: "Kostenlos testen", href: "/signup?plan=solo" },
  },
  {
    id: "team",
    name: "Team",
    fuer: "Für Betriebe mit 3–10 Leuten",
    monatlich: 89,
    jaehrlich: 74,
    nutzer: "bis 10 Mitarbeiter",
    vorteile: [
      "Alles aus Solo",
      "Einsatzplanung & Plantafel",
      "Zeiterfassung",
      "Material & Lager",
      "Macher erledigt Büroarbeit automatisch",
    ],
    hervorgehoben: true,
    cta: { label: "Kostenlos testen", href: "/signup?plan=team" },
  },
  {
    id: "betrieb",
    name: "Betrieb",
    fuer: "Für Betriebe mit 10–30 Leuten",
    monatlich: 179,
    jaehrlich: 149,
    nutzer: "bis 30 Mitarbeiter",
    vorteile: [
      "Alles aus Team",
      "Automatische Planung",
      "Qualifikationen & Schulungen",
      "Nachkalkulation & Auswertungen",
      "Rechte und Rollen",
    ],
    cta: { label: "Kostenlos testen", href: "/signup?plan=betrieb" },
  },
  {
    id: "unternehmen",
    name: "Unternehmen",
    fuer: "Für größere und mehrere Standorte",
    monatlich: null,
    jaehrlich: null,
    nutzer: "unbegrenzt",
    vorteile: ["Alles aus Betrieb", "Mehrere Standorte", "Persönliche Einrichtung", "Spezielle Schnittstellen"],
    cta: { label: "Kontakt aufnehmen", href: "/kontakt" },
  },
];

export const immerDabei = ["Mobile App für iPhone & Android", "Alle Updates", "Support auf Deutsch", "Datensicherheit", "Alle Grundfunktionen"];

export function formatPreis(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
