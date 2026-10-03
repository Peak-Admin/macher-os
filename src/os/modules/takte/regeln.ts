/**
 * Takte: feste Zeitpunkte statt Dauerbeschallung – und die Regeln, wann wer etwas bekommt.
 *
 * Reine Funktionen ohne Datenbank: dieselbe Logik plant im Browser (lokaler Rückfall)
 * und auf dem Server (`src/app/api/takte/cron`).
 */
import type { Datum, Rolle } from '../../core/objects';
import { minutenVonText, type Uhr } from './zeit';

export type TaktId = 'dein-tag' | 'tagesbrief' | 'zeiten' | 'wochenbilanz';

export interface TaktDef {
  id: TaktId;
  titel: string;
  /** Ein Satz: Was bekommst du? */
  beschreibung: string;
  /** Standard-Uhrzeit "HH:MM" (deutsche Zeit) */
  uhr: string;
  /** Wochentage, 1 = Montag */
  tage: number[];
  rollen: Rolle[];
}

const WERKTAGE = [1, 2, 3, 4, 5];

export const TAKTE: TaktDef[] = [
  { id: 'dein-tag', titel: 'Dein Tag', beschreibung: 'Erster Einsatz mit Adresse, Material und Hinweisen.', uhr: '06:30', tage: WERKTAGE, rollen: ['monteur', 'azubi'] },
  { id: 'tagesbrief', titel: 'Tagesbrief', beschreibung: 'Höchstens drei Entscheidungen und dein Geld: Eingänge und Überfälliges.', uhr: '07:00', tage: WERKTAGE, rollen: ['chef', 'buero'] },
  { id: 'zeiten', titel: 'Zeiten bestätigen', beschreibung: 'Deine Zeiten von heute – mit einem Tipp bestätigt.', uhr: '16:30', tage: WERKTAGE, rollen: ['monteur', 'azubi'] },
  { id: 'wochenbilanz', titel: 'Wochenbilanz', beschreibung: 'Umsatz, offene Posten, Aufträge und was Lotte erledigt hat.', uhr: '15:00', tage: [5], rollen: ['chef'] },
];

export const TAKT_IDS = TAKTE.map((t) => t.id);

export function taktDef(id: string): TaktDef | undefined {
  return TAKTE.find((t) => t.id === id);
}

/** Takte, die zu dieser Rolle gehören */
export function takteFuer(rolle: Rolle | undefined): TaktDef[] {
  return TAKTE.filter((t) => !rolle || t.rollen.includes(rolle));
}

// ------------------------------------------------------------------ Einstellungen je Nutzer

export type Kanal = 'push' | 'email';

export interface TaktEinstellungen {
  takte: Partial<Record<TaktId, { an?: boolean; uhr?: string }>>;
  kanal: Kanal;
  ruhe: {
    /** ab dieser Uhrzeit abends nichts mehr */
    ab: string;
    /** bis zu dieser Uhrzeit morgens nichts */
    bis: string;
    /** Samstag und Sonntag ruhig */
    wochenende: boolean;
  };
  /** Wer Notdienst hat, bekommt Dringendes auch in der Ruhezeit */
  notdienst: boolean;
}

export const STANDARD_EINSTELLUNGEN: TaktEinstellungen = {
  takte: {},
  kanal: 'push',
  ruhe: { ab: '18:00', bis: '06:00', wochenende: true },
  notdienst: false,
};

/** Schlüssel in der Sammlung `einstellungen` (je Mitarbeiter) */
export const einstellungsSchluessel = (mitarbeiterId: string) => `takte.nutzer.${mitarbeiterId}`;
/** Wann welcher Takt zuletzt zugestellt wurde (je Mitarbeiter) */
export const zuletztSchluessel = (mitarbeiterId: string) => `takte.zuletzt.${mitarbeiterId}`;

/** Gespeicherte (evtl. unvollständige oder alte) Werte mit den Standards auffüllen */
export function einstellungenAus(roh: unknown): TaktEinstellungen {
  const r = (roh && typeof roh === 'object' ? roh : {}) as Partial<TaktEinstellungen>;
  return {
    takte: { ...(r.takte ?? {}) },
    kanal: r.kanal === 'email' ? 'email' : 'push',
    ruhe: { ...STANDARD_EINSTELLUNGEN.ruhe, ...(r.ruhe ?? {}) },
    notdienst: !!r.notdienst,
  };
}

export function taktAn(e: TaktEinstellungen, id: TaktId): boolean {
  return e.takte[id]?.an ?? true;
}

export function taktUhr(e: TaktEinstellungen, id: TaktId): string {
  const eigene = e.takte[id]?.uhr;
  return eigene && minutenVonText(eigene) !== undefined ? eigene : taktDef(id)!.uhr;
}

// ------------------------------------------------------------------ Ruhezeiten

/** Liegt dieser Zeitpunkt in der Ruhezeit? (abends ab, morgens bis, Wochenende) */
export function inRuhezeit(e: TaktEinstellungen, uhr: Pick<Uhr, 'minuten' | 'wochentag'>): boolean {
  if (e.ruhe.wochenende && uhr.wochentag >= 6) return true;
  const ab = minutenVonText(e.ruhe.ab);
  const bis = minutenVonText(e.ruhe.bis);
  if (ab === undefined || bis === undefined || ab === bis) return false;
  // üblich: ab 18:00 bis 06:00 (über Mitternacht); sonst ein Fenster am selben Tag
  return ab > bis ? uhr.minuten >= ab || uhr.minuten < bis : uhr.minuten >= ab && uhr.minuten < bis;
}

/**
 * Darf jetzt etwas aufs Handy? In der Ruhezeit nur Dringendes – und das nur bei Notdienst.
 * Takte sind nie dringend: sie kommen in der Ruhezeit gar nicht.
 */
export function darfMelden(e: TaktEinstellungen, uhr: Pick<Uhr, 'minuten' | 'wochentag'>, opts: { dringend?: boolean } = {}): boolean {
  if (!inRuhezeit(e, uhr)) return true;
  return !!opts.dringend && e.notdienst;
}

// ------------------------------------------------------------------ Planer

/** So lange nach der Uhrzeit wird ein verpasster Takt noch nachgeholt (z. B. Handy war aus) */
export const NACHHOLEN_MINUTEN = 120;

export interface PlanEingabe {
  rolle: Rolle;
  einstellungen: TaktEinstellungen;
  uhr: Uhr;
  /** Takt → Datum der letzten Zustellung */
  zuletzt: Partial<Record<TaktId, Datum>>;
  /** Arbeitstag laut Betrieb (Feiertage, Arbeitstage). Standard: Mo–Fr */
  arbeitstag?: boolean;
}

/** Welche Takte sind für diese Person jetzt dran? */
export function faelligeTakte(p: PlanEingabe): TaktId[] {
  const arbeitstag = p.arbeitstag ?? p.uhr.wochentag <= 5;
  return takteFuer(p.rolle)
    .filter((t) => {
      if (!taktAn(p.einstellungen, t.id)) return false;
      if (!t.tage.includes(p.uhr.wochentag) || !arbeitstag) return false;
      if (p.zuletzt[t.id] === p.uhr.datum) return false;
      const start = minutenVonText(taktUhr(p.einstellungen, t.id))!;
      if (p.uhr.minuten < start || p.uhr.minuten >= start + NACHHOLEN_MINUTEN) return false;
      return darfMelden(p.einstellungen, p.uhr);
    })
    .map((t) => t.id);
}

/** Für die Einstellungen: Liegt die gewählte Uhrzeit eines Takts in der eigenen Ruhezeit? */
export function taktInRuhezeit(e: TaktEinstellungen, id: TaktId): boolean {
  const def = taktDef(id)!;
  const minuten = minutenVonText(taktUhr(e, id))!;
  return def.tage.every((wochentag) => inRuhezeit(e, { minuten, wochentag }));
}
