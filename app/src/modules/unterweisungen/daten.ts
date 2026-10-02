/**
 * Unterweisungen – eigene Sammlung `unterweisungen`.
 * Eine Unterweisung ist ein wiederkehrendes Pflichtthema mit Inhalt. Bestätigungen der
 * Mitarbeiter (digital am Handy oder vom Büro eingetragen) sind der Nachweis.
 * Ist eine Qualifikation verknüpft, wird dort automatisch der Nachweis fortgeschrieben.
 */
import { db, defineCollection, vermerken } from '@core/db';
import { heute as heuteDatum, tageZwischen, datumVon } from '@core/format';
import type { Basis, Datum, ID, Mitarbeiter, Rolle, Zeitpunkt } from '@core/objects';
import type { Ton } from '@core/modul';
import { gueltigBisAus } from '@modules/qualifikationen/daten';

export interface Bestaetigung {
  mitarbeiterId: ID;
  am: Zeitpunkt;
  /** vom Büro eingetragen (Präsenz-Unterweisung mit Unterschrift auf Papier) */
  durchId?: ID;
}

export interface Unterweisung extends Basis {
  titel: string;
  /** Inhalt als Text, ein Punkt je Zeile */
  inhalt: string;
  /** Wiederholung in Monaten (jährlich = 12) */
  intervallMonate: number;
  /** für welche Rollen Pflicht */
  rollen: Rolle[];
  qualifikationId?: ID;
  bestaetigungen: Bestaetigung[];
  aktiv: boolean;
}

export const unterweisungen = defineCollection<Unterweisung>('unterweisungen');

export type UStatus = 'offen' | 'faellig' | 'bald' | 'aktuell';

export interface UStand {
  status: UStatus;
  letzte?: Zeitpunkt;
  naechste?: Datum;
}

/** Wann muss Mitarbeiter X diese Unterweisung (wieder) bestätigen? */
export function stand(u: Pick<Unterweisung, 'bestaetigungen' | 'intervallMonate'>, maId: ID, heute: Datum): UStand {
  const letzte = u.bestaetigungen
    .filter((b) => b.mitarbeiterId === maId)
    .map((b) => b.am)
    .sort()
    .pop();
  if (!letzte) return { status: 'offen' };
  const naechste = gueltigBisAus(datumVon(letzte), u.intervallMonate)!;
  const t = tageZwischen(heute, naechste);
  return { letzte, naechste, status: t < 0 ? 'faellig' : t <= 30 ? 'bald' : 'aktuell' };
}

export function brauchtBestaetigung(s: UStand) {
  return s.status === 'offen' || s.status === 'faellig';
}

export function standAnzeige(s: UStand): { text: string; ton: Ton } {
  switch (s.status) {
    case 'offen':
      return { text: 'Noch nie unterwiesen', ton: 'achtung' };
    case 'faellig':
      return { text: 'Fällig', ton: 'achtung' };
    case 'bald':
      return { text: 'Bald fällig', ton: 'aktiv' };
    default:
      return { text: 'Aktuell', ton: 'erfolg' };
  }
}

/** Für wen gilt die Unterweisung? Aktive Mitarbeiter mit passender Rolle. */
export function zielgruppe(u: Pick<Unterweisung, 'rollen'>, mitarbeiter: Mitarbeiter[]): Mitarbeiter[] {
  return mitarbeiter.filter((m) => m.aktiv && !m.geloeschtAm && u.rollen.includes(m.rolle));
}

/** Bestätigung speichern und – falls verknüpft – Qualifikations-Nachweis fortschreiben */
export function bestaetigen(uId: ID, maId: ID, durchId?: ID, am = new Date().toISOString()) {
  const u = unterweisungen.get(uId);
  if (!u) return;
  unterweisungen.update(uId, { bestaetigungen: [...u.bestaetigungen, { mitarbeiterId: maId, am, durchId }] }, { text: 'Unterweisung bestätigt' });
  const m = db.mitarbeiter.get(maId);
  vermerken({ typ: 'mitarbeiter', id: maId }, 'unterweisung.bestaetigt', `Unterweisung „${u.titel}“ ${durchId && durchId !== maId ? 'eingetragen' : 'bestätigt'}`);
  if (u.qualifikationId && m) {
    const erworbenAm = datumVon(am);
    const gueltigBis = gueltigBisAus(erworbenAm, u.intervallMonate);
    const vorhanden = db.nachweise.all().find((n) => n.mitarbeiterId === maId && n.qualifikationId === u.qualifikationId);
    if (vorhanden) db.nachweise.update(vorhanden.id, { erworbenAm, gueltigBis }, { text: `Durch Unterweisung „${u.titel}“ verlängert` });
    else db.nachweise.create({ mitarbeiterId: maId, qualifikationId: u.qualifikationId, erworbenAm, gueltigBis });
  }
}

/** Offene Unterweisungen eines Mitarbeiters */
export function offeneFuer(m: Mitarbeiter, alle: Unterweisung[], heute = heuteDatum()) {
  return alle.filter((u) => u.aktiv && !u.geloeschtAm && u.rollen.includes(m.rolle) && brauchtBestaetigung(stand(u, m.id, heute)));
}

// ------------------------------------------------------------------ Vorlagen

const ALLE: Rolle[] = ['chef', 'buero', 'monteur', 'azubi'];
const BAUSTELLE: Rolle[] = ['chef', 'monteur', 'azubi'];

export interface UVorlage {
  titel: string;
  inhalt: string;
  intervallMonate: number;
  rollen: Rolle[];
  /** Name der Qualifikation, die verknüpft wird (falls im Betrieb vorhanden) */
  quali?: string;
  gewerke?: string[];
}

/** Startinhalte – vom Betrieb anzupassen (Gefährdungsbeurteilung ist Chefsache). */
export const VORLAGEN: UVorlage[] = [
  {
    titel: 'Arbeitsschutz allgemein',
    quali: 'Arbeitsschutz-Unterweisung',
    intervallMonate: 12,
    rollen: ALLE,
    inhalt: [
      'Wer ist bei uns Ansprechpartner für Arbeitsschutz und Erste Hilfe?',
      'Wo hängen Verbandkasten, Feuerlöscher und Notrufnummern – in der Werkstatt und im Fahrzeug?',
      'Unfälle und Beinahe-Unfälle sofort dem Chef melden, auch kleine Verletzungen ins Verbandbuch.',
      'Persönliche Schutzausrüstung (Sicherheitsschuhe, Handschuhe, Brille, Gehörschutz) nutzen, wo die Arbeit es verlangt.',
      'Defektes Werkzeug nicht benutzen, sondern kennzeichnen und melden.',
      'Ordnung auf der Baustelle: Stolperstellen vermeiden, Kabel sicher verlegen.',
    ].join('\n'),
  },
  {
    titel: 'Leitern und Tritte',
    quali: 'Arbeiten auf Leitern und Gerüsten',
    intervallMonate: 12,
    rollen: BAUSTELLE,
    inhalt: [
      'Vor jeder Nutzung Sichtprüfung: Holme, Sprossen, Füße, Spreizsicherung.',
      'Nur geprüfte Leitern verwenden – Prüfplakette beachten.',
      'Leiter standsicher aufstellen, Anlegeleitern gegen Wegrutschen sichern.',
      'Nicht von der Leiter zur Seite lehnen, Material sicher hochreichen.',
      'Beschädigte Leitern sofort aussortieren und melden.',
    ].join('\n'),
  },
  {
    titel: 'Elektrische Gefährdungen',
    intervallMonate: 12,
    rollen: BAUSTELLE,
    gewerke: ['elektro'],
    inhalt: [
      'Die fünf Sicherheitsregeln: Freischalten, gegen Wiedereinschalten sichern, Spannungsfreiheit feststellen, Erden und Kurzschließen, benachbarte Teile abdecken.',
      'Arbeiten an Anlagen nur im Rahmen deiner Qualifikation (Elektrofachkraft / festgelegte Tätigkeiten).',
      'Messgeräte vor Benutzung prüfen.',
      'Verhalten bei Stromunfall: Stromkreis unterbrechen, Notruf, Erste Hilfe.',
    ].join('\n'),
  },
  {
    titel: 'Fahrzeug und Ladungssicherung',
    intervallMonate: 12,
    rollen: BAUSTELLE,
    inhalt: [
      'Vor Fahrtantritt: Licht, Reifen, Bremsen, Ladung kurz prüfen.',
      'Ladung immer sichern – Werkzeug und Material dürfen beim Bremsen nicht verrutschen.',
      'Schäden am Fahrzeug sofort melden.',
      'Kein Handy am Steuer, Navi vor der Fahrt einstellen.',
    ].join('\n'),
  },
  {
    titel: 'Gefahrstoffe und Staub',
    intervallMonate: 12,
    rollen: BAUSTELLE,
    inhalt: [
      'Sicherheitsdatenblätter und Betriebsanweisungen: wo sie liegen und was drinsteht.',
      'Staub vermeiden: absaugen statt fegen, Maske tragen, wo vorgeschrieben.',
      'Gefahrstoffe nur in gekennzeichneten Behältern lagern und transportieren.',
      'Haut schützen: Handschuhe, Hautschutzplan beachten.',
    ].join('\n'),
  },
];
