/**
 * Kalender des Betriebs: gesetzliche Feiertage (bundesweit + je Bundesland) und Arbeitstage.
 * Einzige Quelle für „Ist an diesem Tag gearbeitet?“ – Verfügbarkeit, Planung, Urlaub,
 * Arbeitszeiten und Auswertungen nutzen diese Funktionen.
 *
 * Einstellungen: `plan.arbeitstage` (1 = Mo … 7 = So, Standard Mo–Fr) und
 * `plan.bundesland` (Kürzel wie „HE“, leer = nur bundesweite Feiertage).
 */
import { einstellung } from './einstellungen';
import { isoDatum, plusTage, wochentag } from './format';
import type { Datum } from './objects';

export type Bundesland =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export const BUNDESLAENDER: { wert: Bundesland; label: string }[] = [
  { wert: 'BW', label: 'Baden-Württemberg' },
  { wert: 'BY', label: 'Bayern' },
  { wert: 'BE', label: 'Berlin' },
  { wert: 'BB', label: 'Brandenburg' },
  { wert: 'HB', label: 'Bremen' },
  { wert: 'HH', label: 'Hamburg' },
  { wert: 'HE', label: 'Hessen' },
  { wert: 'MV', label: 'Mecklenburg-Vorpommern' },
  { wert: 'NI', label: 'Niedersachsen' },
  { wert: 'NW', label: 'Nordrhein-Westfalen' },
  { wert: 'RP', label: 'Rheinland-Pfalz' },
  { wert: 'SL', label: 'Saarland' },
  { wert: 'SN', label: 'Sachsen' },
  { wert: 'ST', label: 'Sachsen-Anhalt' },
  { wert: 'SH', label: 'Schleswig-Holstein' },
  { wert: 'TH', label: 'Thüringen' },
];

/** Arbeitstage 1 = Montag … 7 = Sonntag */
export const STANDARD_ARBEITSTAGE = [1, 2, 3, 4, 5];

/** Arbeitstage des Betriebs (Einstellung `plan.arbeitstage`, Standard Mo–Fr) */
export function betriebsArbeitstage(): number[] {
  const w = einstellung<number[]>('plan.arbeitstage', STANDARD_ARBEITSTAGE);
  return Array.isArray(w) && w.length ? w : STANDARD_ARBEITSTAGE;
}

/** Bundesland des Betriebs (Einstellung `plan.bundesland`) – für Landesfeiertage */
export function betriebsBundesland(): Bundesland | undefined {
  const b = einstellung<string>('plan.bundesland', '');
  return BUNDESLAENDER.some((x) => x.wert === b) ? (b as Bundesland) : undefined;
}

// ------------------------------------------------------------------ Feiertage

/** Ostersonntag (gregorianisch, Algorithmus nach Meeus/Jones/Butcher) */
export function ostersonntag(jahr: number): Datum {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDatum(new Date(jahr, monat - 1, tag, 12));
}

/** Buß- und Bettag: Mittwoch vor dem 23. November */
function bussUndBettag(jahr: number): Datum {
  const d = `${jahr}-11-22`;
  return plusTage(d, -((wochentag(d) - 3 + 7) % 7));
}

const cache = new Map<string, Map<Datum, string>>();

/**
 * Gesetzliche Feiertage eines Jahres: Datum → Name.
 * Ohne Bundesland nur die bundesweiten (9 Tage). Gemeindefeiertage (z. B. Augsburger
 * Friedensfest, Mariä Himmelfahrt in Teilen Bayerns) fehlen bewusst.
 */
export function feiertage(jahr: number, bundesland?: Bundesland | null): Map<Datum, string> {
  const schluessel = `${jahr}:${bundesland ?? ''}`;
  const vorhanden = cache.get(schluessel);
  if (vorhanden) return vorhanden;
  const ostern = ostersonntag(jahr);
  const liste: [Datum, string, Bundesland[]?][] = [
    [`${jahr}-01-01`, 'Neujahr'],
    [`${jahr}-01-06`, 'Heilige Drei Könige', ['BW', 'BY', 'ST']],
    [`${jahr}-03-08`, 'Internationaler Frauentag', ['BE', 'MV']],
    [plusTage(ostern, -2), 'Karfreitag'],
    [ostern, 'Ostersonntag', ['BB']],
    [plusTage(ostern, 1), 'Ostermontag'],
    [`${jahr}-05-01`, 'Tag der Arbeit'],
    [plusTage(ostern, 39), 'Christi Himmelfahrt'],
    [plusTage(ostern, 49), 'Pfingstsonntag', ['BB']],
    [plusTage(ostern, 50), 'Pfingstmontag'],
    [plusTage(ostern, 60), 'Fronleichnam', ['BW', 'BY', 'HE', 'NW', 'RP', 'SL']],
    [`${jahr}-08-15`, 'Mariä Himmelfahrt', ['SL']],
    [`${jahr}-09-20`, 'Weltkindertag', ['TH']],
    [`${jahr}-10-03`, 'Tag der Deutschen Einheit'],
    [`${jahr}-10-31`, 'Reformationstag', ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH']],
    [`${jahr}-11-01`, 'Allerheiligen', ['BW', 'BY', 'NW', 'RP', 'SL']],
    [bussUndBettag(jahr), 'Buß- und Bettag', ['SN']],
    [`${jahr}-12-25`, '1. Weihnachtstag'],
    [`${jahr}-12-26`, '2. Weihnachtstag'],
  ];
  const m = new Map<Datum, string>();
  for (const [d, name, laender] of liste) if (!laender || (bundesland && laender.includes(bundesland))) m.set(d, name);
  cache.set(schluessel, m);
  return m;
}

/** Name des Feiertags an diesem Datum (sonst `undefined`) */
export function feiertagName(datum: Datum, bundesland?: Bundesland | null): string | undefined {
  return feiertage(Number(datum.slice(0, 4)), bundesland).get(datum);
}

export function istFeiertag(datum: Datum, bundesland?: Bundesland | null): boolean {
  return feiertagName(datum, bundesland) !== undefined;
}

// ------------------------------------------------------------------ Arbeitstage

/**
 * Wird an diesem Tag gearbeitet? Wochentag gehört zu den Arbeitstagen und es ist kein Feiertag.
 * Weggelassene Angaben kommen aus den Einstellungen des Betriebs (`plan.arbeitstage`, `plan.bundesland`);
 * `bundesland: null` heißt ausdrücklich „nur bundesweite Feiertage“.
 */
export function istArbeitstag(datum: Datum, arbeitstage: number[] = betriebsArbeitstage(), bundesland: Bundesland | null = betriebsBundesland() ?? null): boolean {
  return arbeitstage.includes(wochentag(datum)) && !istFeiertag(datum, bundesland);
}

/** Anzahl Arbeitstage im Zeitraum (beide inklusive) */
export function arbeitstageZwischen(von: Datum, bis: Datum, arbeitstage: number[] = betriebsArbeitstage(), bundesland: Bundesland | null = betriebsBundesland() ?? null): number {
  let n = 0;
  for (let d = von; d <= bis; d = plusTage(d, 1)) if (istArbeitstag(d, arbeitstage, bundesland)) n++;
  return n;
}

/** Die nächsten `n` Arbeitstage ab (inklusive) `ab` */
export function naechsteArbeitstage(ab: Datum, n: number, arbeitstage: number[] = betriebsArbeitstage(), bundesland: Bundesland | null = betriebsBundesland() ?? null): Datum[] {
  const r: Datum[] = [];
  if (!arbeitstage.length) return r;
  for (let d = ab, i = 0; r.length < n && i < n * 7 + 31; i++, d = plusTage(d, 1)) if (istArbeitstag(d, arbeitstage, bundesland)) r.push(d);
  return r;
}
