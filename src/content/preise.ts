import type { FaqItem } from "@/components/ui";
import { app } from "@/lib/site";
/**
 * Pläne: ein Preis je Betrieb nach Teamgröße, alles drin.
 *
 * Gemeinsame Quelle der Werte (Namen, Grenzen, Preise, Testtage) ist
 * `src/os/modules/abo/plaene.ts` – dieselbe Datei rechnet in der App „Dein Plan“ und
 * in den Server-Funktionen für Stripe. Hier nur Texte für die Website ergänzen, keine Zahlen.
 *
 * ACHTUNG: Die Preise sind vorläufig (`preiseVorlaeufig`), bis sie freigegeben sind.
 * Alle Preise netto pro Monat.
 */
import { PLAN_QUELLE } from "@/os/modules/abo/plaene";

export type Plan = {
  id: "solo" | "team" | "betrieb" | "unternehmen";
  name: string;
  fuer: string;
  /** höchstens so viele aktive Leute; `null` = unbegrenzt */
  bis: number | null;
  monatlich: number | null;
  /** Monatspreis bei jährlicher Zahlung */
  jaehrlich: number | null;
  nutzer: string;
  vorteile: string[];
  hervorgehoben?: boolean;
  cta: { label: string; href: string };
};

export const preiseVorlaeufig = PLAN_QUELLE.vorlaeufig;
export const testTage = PLAN_QUELLE.testTage;

const texte: Record<Plan["id"], { fuer: string; nutzer: string }> = {
  solo: { fuer: "Nur du oder zu zweit", nutzer: "1–2 Leute" },
  team: { fuer: "Betriebe mit 3 bis 10 Leuten", nutzer: "bis 10 Leute" },
  betrieb: { fuer: "Betriebe mit 11 bis 30 Leuten", nutzer: "bis 30 Leute" },
  unternehmen: { fuer: "Mehr als 30 Leute oder mehrere Standorte", nutzer: "ab 31 Leuten" },
};

export const plaene: Plan[] = PLAN_QUELLE.plaene.map((p) => ({
  ...p,
  ...texte[p.id],
  vorteile:
    p.monatlich === null
      ? ["Alles drin", "Persönliches Angebot", "Hilfe bei Einrichtung und Umstieg"]
      : ["Alles drin – alle Funktionen", `${testTage} Tage kostenlos testen`, "Monatlich kündbar"],
  hervorgehoben: p.id === "team",
  cta: p.monatlich === null ? { label: "Kontakt aufnehmen", href: "/kontakt" } : { label: "Kostenlos testen", href: app.einrichten() },
}));

/** Der passende Plan für so viele aktive Leute – dieselbe Regel wie in der App */
export function planFuerTeam(personen: number): Plan {
  return plaene.find((p) => p.bis === null || personen <= p.bis) ?? plaene[plaene.length - 1];
}

/** In jedem Plan dabei – es gibt keine Funktions-Pakete und keine Zusatzmodule zum Freischalten. */
export const allesDrin = [
  "Anfragen, Angebote & Rechnungen",
  "Kalender, Plantafel & Einsatzplanung",
  "App fürs Handy auf der Baustelle",
  "Zeiterfassung, Material & Lager",
  "Kundenbereich & Online-Terminbuchung",
  "Lotte erledigt Büroarbeit automatisch",
  "Auswertungen & Steuerberater-Export",
  "Rechte und Rollen für dein Team",
];

export const immerDabei = ["Alle Funktionen, alle Updates", "Support auf Deutsch", "Export deiner Daten – immer kostenlos", "Monatlich kündbar"];

export const preiseFaq: FaqItem[] = [
  {
    frage: "Was kostet Handwerk OS am Ende wirklich?",
    antwort:
      "Ein fester Monatspreis für deinen Betrieb – er richtet sich nur danach, wie viele Leute mitarbeiten. Alle Funktionen sind drin. Es gibt keine Zusatzmodule und keine Pakete zum Freischalten. Die Preise sind netto, zuzüglich Mehrwertsteuer.",
  },
  {
    frage: "Brauche ich zum Testen Zahlungsdaten?",
    antwort: `Nein. Du testest ${testTage} Tage kostenlos – ohne Kreditkarte, ohne Bankverbindung. Erst wenn du weitermachen willst, buchst du deinen Plan.`,
  },
  {
    frage: "Wie bezahle ich?",
    antwort:
      "Am einfachsten per SEPA-Lastschrift von deinem Geschäftskonto. Eine Karte geht auch. Die Rechnung liegt nach jeder Abbuchung in Handwerk OS zum Herunterladen – für dich und deinen Steuerberater.",
  },
  {
    frage: "Wie lange binde ich mich?",
    antwort:
      "Gar nicht. Monatlich kündbar, in zwei Klicks direkt in Handwerk OS. Wer jährlich zahlt, bekommt einen günstigeren Monatspreis und zahlt das Jahr im Voraus.",
  },
  {
    frage: "Was passiert mit meinen Daten, wenn ich nicht weiter zahle?",
    antwort:
      "Nichts geht verloren. Nach der Testphase oder nach dem Kündigen bleibt alles lesbar, und du kannst jederzeit alles exportieren. Dein Kundenbereich und offene Rechnungen laufen weiter. Nur Neues anlegen geht erst wieder mit einem Plan.",
  },
  {
    frage: "Was passiert, wenn mein Team wächst?",
    antwort:
      "Handwerk OS zählt die aktiven Leute in deinem Team. Passt ein anderer Plan, fragt Handwerk OS dich vorher – der Preis ändert sich erst, wenn du zustimmst. Der Unterschied wird tagesgenau verrechnet.",
  },
  {
    frage: "Sind die Preise schon endgültig?",
    antwort:
      "Noch nicht. Die Preise sind vorläufig, bis wir sie freigeben. Vor der ersten Abbuchung siehst du den endgültigen Preis und bestätigst ihn.",
  },
  {
    frage: "Hilft ihr mir beim Umstieg von einem anderen Programm?",
    antwort:
      "Ja. Kunden, Mitarbeiter und Artikel kannst du übernehmen. Wie das geht, steht unter „Daten übernehmen“ – und wenn es hakt, helfen wir dir persönlich.",
  },
];

export function formatPreis(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
