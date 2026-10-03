/**
 * Orb-Zustände: Was zeigt der Lotte-Orb, solange die KI arbeitet? Reine Regeln, ohne React testbar.
 *
 * Eigene, ruhige Animationsvarianten in den Markengrüns (`orb.css`). Neben dem Orb steht immer ein Statustext
 * (`orbText`) – die Animation ist nie die einzige Information.
 *
 *   arbeitet    working     KI-Bürokraft arbeitet (Standard)
 *   sucht       searching   Rechnung, Kunde, Projekt finden; Suche
 *   prueft      solving     Angebot kalkulieren oder prüfen
 *   hoert       listening   Spracheingabe
 *   verbindet   connecting  DATEV, Kalender, Schnittstellen verbinden; Daten einlesen
 *   schreibt    composing   E-Mail, Nachricht, Angebotstext formulieren
 *   formt       shaping     Angebot oder Rechnung erzeugen
 *   denkt       breathing   allgemeines Nachdenken
 *   verknuepft  weaving     mehrere Dinge zusammenführen (Mehrschritt-Pläne, Einplanen)
 */

export const ORB_ZUSTAENDE = ['arbeitet', 'sucht', 'prueft', 'hoert', 'verbindet', 'schreibt', 'formt', 'denkt', 'verknuepft'] as const;

export type OrbZustand = (typeof ORB_ZUSTAENDE)[number];

const TEXT: Record<OrbZustand, string> = {
  arbeitet: 'Lotte arbeitet …',
  sucht: 'Lotte sucht …',
  prueft: 'Lotte prüft …',
  hoert: 'Lotte hört zu …',
  verbindet: 'Lotte verbindet …',
  schreibt: 'Lotte schreibt …',
  formt: 'Lotte bereitet vor …',
  denkt: 'Lotte denkt nach …',
  verknuepft: 'Lotte führt zusammen …',
};

/** Statustext neben dem Orb */
export function orbText(z: OrbZustand): string {
  return TEXT[z];
}

/**
 * Absicht oder Gateway-Aktion (`invoice.list`, `offer.create_draft`, `message.send` …) → Orb-Zustand.
 * Reihenfolge zählt: Die genaueren Regeln stehen oben. Unbekanntes → `arbeitet`, nichts → `denkt`.
 */
export function orbFuer(id: string | undefined, kanal?: 'text' | 'sprache'): OrbZustand {
  if (kanal === 'sprache') return 'hoert';
  if (!id) return 'denkt';
  const t = id.toLowerCase();
  if (/(^voice|speech|sprache|diktat|\.listen$)/.test(t)) return 'hoert';
  if (/(connect|datev|sync|import|schnittstelle|kalender\.verbinden|website)/.test(t)) return 'verbindet';
  if (/(job\.finish|job\.complete|schedule|plan|release_plan)/.test(t)) return 'verknuepft';
  if (/(calculate|kalkul|check|pruef|missing)/.test(t)) return 'prueft';
  if (/^(reminder|task)\.create/.test(t)) return 'formt';
  if (/(message|remind|followup|review\.request|compose|send)/.test(t)) return 'schreibt';
  if (/(create_draft|prepare|create|draft)/.test(t)) return 'formt';
  if (/(\.list$|find|search|availability|suche)/.test(t) || t === 'search') return 'sucht';
  if (/(help|think|attention)/.test(t)) return 'denkt';
  return 'arbeitet';
}
