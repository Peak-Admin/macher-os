/**
 * Mitarbeiter einarbeiten – eigene Sammlung `einarbeitungen`.
 * Beim Anlegen eines Mitarbeiters entsteht automatisch ein Plan je Rolle.
 * Unterweisungs-Schritte haken sich selbst ab, sobald der Mitarbeiter bestätigt.
 */
import { defineCollection, neueId } from '@core/db';
import { heute as heuteDatum, plusTage } from '@core/format';
import type { Basis, Datum, ID, Rolle, Zeitpunkt } from '@core/objects';

export type SchrittArt = 'unterlagen' | 'ausstattung' | 'zugang' | 'unterweisung' | 'praxis' | 'gespraech';

export interface Schritt {
  id: ID;
  titel: string;
  art: SchrittArt;
  /** Fällig am Tag X nach dem Start (0 = erster Tag) */
  tag: number;
  erledigt: boolean;
  erledigtAm?: Zeitpunkt;
  unterweisungId?: ID;
}

export interface Einarbeitung extends Basis {
  mitarbeiterId: ID;
  start: Datum;
  schritte: Schritt[];
  abgeschlossenAm?: Zeitpunkt;
}

export const einarbeitungen = defineCollection<Einarbeitung>('einarbeitungen');

export const ART_LABEL: Record<SchrittArt, string> = {
  unterlagen: 'Unterlagen',
  ausstattung: 'Ausstattung',
  zugang: 'Zugänge',
  unterweisung: 'Unterweisung',
  praxis: 'Praxis',
  gespraech: 'Gespräch',
};

type V = Omit<Schritt, 'id' | 'erledigt' | 'erledigtAm'> & { rollen?: Rolle[] };

const GEMEINSAM: V[] = [
  { titel: 'Arbeitsvertrag unterschrieben zurück', art: 'unterlagen', tag: 0 },
  { titel: 'Steuer-ID, Sozialversicherungsnummer, Krankenkasse und Bankverbindung abgeben', art: 'unterlagen', tag: 0 },
  { titel: 'Macher OS am Handy einrichten und anmelden', art: 'zugang', tag: 0 },
  { titel: 'Betrieb, Team und Ansprechpartner vorstellen', art: 'praxis', tag: 0 },
  { titel: 'Zeiterfassung zeigen: Start, Pause, Stopp', art: 'praxis', tag: 0 },
  { titel: 'Feedbackgespräch nach den ersten Wochen', art: 'gespraech', tag: 28 },
  { titel: 'Gespräch vor Ende der Probezeit', art: 'gespraech', tag: 150 },
];

const JE_ROLLE: V[] = [
  { titel: 'Arbeitskleidung und Schutzausrüstung ausgeben', art: 'ausstattung', tag: 0, rollen: ['monteur', 'azubi'] },
  { titel: 'Werkzeugkoffer und Messgeräte ausgeben (in Werkzeuge eintragen)', art: 'ausstattung', tag: 0, rollen: ['monteur', 'azubi'] },
  { titel: 'Fahrzeug zeigen, Führerschein kontrollieren', art: 'ausstattung', tag: 1, rollen: ['monteur'] },
  { titel: 'Erste Einsätze zusammen mit einem erfahrenen Kollegen', art: 'praxis', tag: 1, rollen: ['monteur', 'azubi'] },
  { titel: 'Ablauf auf der Baustelle: Fotos, Material, Bericht, Unterschrift', art: 'praxis', tag: 3, rollen: ['monteur', 'azubi'] },
  { titel: 'Ausbilder vorstellen, Ausbildungsplan besprechen', art: 'gespraech', tag: 0, rollen: ['azubi'] },
  { titel: 'Berufsschultage als Abwesenheit eintragen', art: 'zugang', tag: 3, rollen: ['azubi'] },
  { titel: 'Ausbildungsnachweis (Berichtsheft) erklären', art: 'unterlagen', tag: 5, rollen: ['azubi'] },
  { titel: 'Arbeitsplatz, Rechner und E-Mail einrichten', art: 'zugang', tag: 0, rollen: ['buero'] },
  { titel: 'Telefon, Postfach und Ablage erklären', art: 'praxis', tag: 1, rollen: ['buero'] },
  { titel: 'Angebote, Rechnungen und Mahnwesen in Macher OS zeigen', art: 'praxis', tag: 3, rollen: ['buero'] },
  { titel: 'Rechte in Macher OS prüfen (Rollen & Rechte)', art: 'zugang', tag: 0, rollen: ['buero', 'chef'] },
];

/** Einarbeitungsplan je Rolle inkl. der Pflicht-Unterweisungen dieser Rolle */
export function planFuer(rolle: Rolle, unterweisungen: { id: ID; titel: string; rollen: Rolle[]; aktiv: boolean }[]): Schritt[] {
  const vorlagen: V[] = [...GEMEINSAM, ...JE_ROLLE.filter((v) => !v.rollen || v.rollen.includes(rolle))];
  const uw: V[] = unterweisungen
    .filter((u) => u.aktiv && u.rollen.includes(rolle))
    .map((u) => ({ titel: `Unterweisung „${u.titel}“ bestätigen`, art: 'unterweisung' as const, tag: 2, unterweisungId: u.id }));
  return [...vorlagen, ...uw]
    .sort((a, b) => a.tag - b.tag)
    .map(({ rollen: _r, ...v }) => ({ ...v, id: neueId('s'), erledigt: false }));
}

export function fortschritt(e: Pick<Einarbeitung, 'schritte'>) {
  const fertig = e.schritte.filter((s) => s.erledigt).length;
  return { fertig, gesamt: e.schritte.length };
}

export function faelligAm(e: Pick<Einarbeitung, 'start'>, s: Pick<Schritt, 'tag'>): Datum {
  return plusTage(e.start, s.tag);
}

export function ueberfaellig(e: Einarbeitung, heute = heuteDatum()): Schritt[] {
  if (e.abgeschlossenAm) return [];
  return e.schritte.filter((s) => !s.erledigt && faelligAm(e, s) < heute);
}

export function phase(tag: number): string {
  if (tag === 0) return 'Erster Tag';
  if (tag <= 7) return 'Erste Woche';
  if (tag <= 31) return 'Erster Monat';
  return 'Probezeit';
}
