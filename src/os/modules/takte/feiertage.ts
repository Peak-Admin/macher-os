/**
 * Feiertage für den Server-Takt. Gleiche Regeln wie `src/core/kalender.ts` – dort hängen sie aber an den
 * Einstellungen (und damit an `db`), deshalb hier rein und ohne Abhängigkeiten. Ein Test sichert, dass
 * beide für alle Bundesländer übereinstimmen.
 */
import { isoDatum, plusTage, wochentag } from '../../core/format';
import type { Datum } from '../../core/objects';

function ostersonntag(jahr: number): Datum {
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

/** Gesetzliche Feiertage eines Jahres (bundesweit + ggf. Land) */
export function feiertageImJahr(jahr: number, bundesland?: string | null): Set<Datum> {
  const ostern = ostersonntag(jahr);
  const buss = plusTage(`${jahr}-11-22`, -((wochentag(`${jahr}-11-22`) - 3 + 7) % 7));
  const liste: [Datum, string[]?][] = [
    [`${jahr}-01-01`],
    [`${jahr}-01-06`, ['BW', 'BY', 'ST']],
    [`${jahr}-03-08`, ['BE', 'MV']],
    [plusTage(ostern, -2)],
    [ostern, ['BB']],
    [plusTage(ostern, 1)],
    [`${jahr}-05-01`],
    [plusTage(ostern, 39)],
    [plusTage(ostern, 49), ['BB']],
    [plusTage(ostern, 50)],
    [plusTage(ostern, 60), ['BW', 'BY', 'HE', 'NW', 'RP', 'SL']],
    [`${jahr}-08-15`, ['SL']],
    [`${jahr}-09-20`, ['TH']],
    [`${jahr}-10-03`],
    [`${jahr}-10-31`, ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH']],
    [`${jahr}-11-01`, ['BW', 'BY', 'NW', 'RP', 'SL']],
    [buss, ['SN']],
    [`${jahr}-12-25`],
    [`${jahr}-12-26`],
  ];
  return new Set(liste.filter(([, laender]) => !laender || (!!bundesland && laender.includes(bundesland))).map(([d]) => d));
}

/** Arbeitstag laut Betrieb: Wochentag in `arbeitstage` und kein Feiertag */
export function istArbeitstagServer(datum: Datum, arbeitstage: number[], bundesland?: string | null): boolean {
  return arbeitstage.includes(wochentag(datum)) && !feiertageImJahr(Number(datum.slice(0, 4)), bundesland).has(datum);
}
