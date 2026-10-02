/**
 * Bewerber – eigene Sammlung `bewerber`.
 * Pipeline: neu → Gespräch → Probearbeiten → Zusage/Absage.
 * Bei Zusage wird ein Mitarbeiter angelegt; der Bewerber verweist dann auf ihn.
 */
import { defineCollection } from '@core/db';
import { tageZwischen, datumVon } from '@core/format';
import type { Basis, Datum, ID, Kanal, Rolle, Zeitpunkt } from '@core/objects';

export type BewerberStatus = 'neu' | 'gespraech' | 'probearbeiten' | 'zusage' | 'absage';

export interface Bewerber extends Basis {
  vorname: string;
  nachname: string;
  telefon?: string;
  email?: string;
  /** Stelle als Rolle im Betrieb */
  stelle: Rolle;
  quelle?: Kanal | 'aushang' | 'jobportal';
  status: BewerberStatus;
  eingegangenAm: Datum;
  /** letzte Antwort an den Bewerber (Mail, Anruf) */
  beantwortetAm?: Zeitpunkt;
  notiz?: string;
  /** Termin für Gespräch / Probearbeiten im Kalender */
  terminId?: ID;
  /** nach Zusage: der angelegte Mitarbeiter */
  mitarbeiterId?: ID;
}

export const bewerber = defineCollection<Bewerber>('bewerber');

export const STATUS: { id: BewerberStatus; label: string }[] = [
  { id: 'neu', label: 'Neu' },
  { id: 'gespraech', label: 'Gespräch' },
  { id: 'probearbeiten', label: 'Probearbeiten' },
  { id: 'zusage', label: 'Zusage' },
  { id: 'absage', label: 'Absage' },
];

export const STATUS_LABEL = Object.fromEntries(STATUS.map((s) => [s.id, s.label])) as Record<BewerberStatus, string>;

export const STELLE_LABEL: Record<Rolle, string> = {
  monteur: 'Monteur / Geselle',
  azubi: 'Azubi',
  buero: 'Büro',
  chef: 'Meister / Bauleitung',
};

export const QUELLE_LABEL: Record<string, string> = {
  telefon: 'Anruf',
  email: 'E-Mail',
  website: 'Website',
  whatsapp: 'WhatsApp',
  empfehlung: 'Empfehlung',
  aushang: 'Aushang / Fahrzeug',
  jobportal: 'Jobportal',
  vor_ort: 'Persönlich',
  sonstiges: 'Sonstiges',
};

/** Ab wann eine Bewerbung als „liegt zu lange“ gilt */
export const ANTWORT_TAGE = 3;

export function offen(b: Bewerber) {
  return b.status !== 'zusage' && b.status !== 'absage';
}

/** Tage seit Eingang ohne Antwort; undefined = beantwortet oder abgeschlossen */
export function unbeantwortetTage(b: Bewerber, heute: Datum): number | undefined {
  if (!offen(b) || b.beantwortetAm || b.status !== 'neu') return undefined;
  return tageZwischen(b.eingegangenAm, heute);
}

export function wartetZuLange(b: Bewerber, heute: Datum): boolean {
  const t = unbeantwortetTage(b, heute);
  return t != null && t > ANTWORT_TAGE;
}

export function zuletztBeantwortet(b: Bewerber): Datum | undefined {
  return b.beantwortetAm ? datumVon(b.beantwortetAm) : undefined;
}

// ------------------------------------------------------------------ Antwortvorlagen

export interface Vorlage {
  id: string;
  label: string;
  betreff: string;
  text: string;
  /** Status, der nach dem Senden vorgeschlagen wird */
  naechsterStatus?: BewerberStatus;
}

export function vorlagen(b: Pick<Bewerber, 'vorname' | 'stelle'>, betrieb: string, absender: string): Vorlage[] {
  const stelle = STELLE_LABEL[b.stelle];
  const gruss = `\n\nViele Grüße\n${absender}\n${betrieb}`;
  return [
    {
      id: 'eingang',
      label: 'Eingang bestätigen',
      betreff: `Deine Bewerbung als ${stelle}`,
      text: `Hallo ${b.vorname},\n\ndanke für deine Bewerbung als ${stelle}! Wir haben sie bekommen und melden uns in den nächsten Tagen mit einem Terminvorschlag.${gruss}`,
    },
    {
      id: 'gespraech',
      label: 'Zum Gespräch einladen',
      betreff: `Kennenlernen – ${betrieb}`,
      text: `Hallo ${b.vorname},\n\nwir würden dich gern kennenlernen. Passt dir ein Gespräch bei uns im Betrieb? Schlag gern zwei, drei Termine vor oder ruf kurz an.${gruss}`,
      naechsterStatus: 'gespraech',
    },
    {
      id: 'probearbeiten',
      label: 'Zum Probearbeiten einladen',
      betreff: `Probearbeiten bei ${betrieb}`,
      text: `Hallo ${b.vorname},\n\ndanke für das gute Gespräch! Hast du Lust, einen Tag bei uns mitzuarbeiten? Dann lernst du das Team und die Baustellen kennen. Arbeitskleidung und Sicherheitsschuhe bitte mitbringen.${gruss}`,
      naechsterStatus: 'probearbeiten',
    },
    {
      id: 'zusage',
      label: 'Zusage schicken',
      betreff: `Willkommen bei ${betrieb}`,
      text: `Hallo ${b.vorname},\n\nwir freuen uns: Wir möchten dich als ${stelle} einstellen! Den Vertrag und alles Weitere besprechen wir in den nächsten Tagen.${gruss}`,
      naechsterStatus: 'zusage',
    },
    {
      id: 'absage',
      label: 'Absage schicken',
      betreff: `Deine Bewerbung als ${stelle}`,
      text: `Hallo ${b.vorname},\n\ndanke für dein Interesse und deine Zeit. Wir haben uns diesmal für jemand anderen entschieden. Wir wünschen dir alles Gute für deinen weiteren Weg.${gruss}`,
      naechsterStatus: 'absage',
    },
  ];
}

export function mailtoLink(email: string | undefined, v: Pick<Vorlage, 'betreff' | 'text'>): string {
  return `mailto:${email ?? ''}?subject=${encodeURIComponent(v.betreff)}&body=${encodeURIComponent(v.text)}`;
}
