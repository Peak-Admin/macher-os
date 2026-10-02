/**
 * Uhrzeit des Betriebs – unabhängig davon, wo der Code läuft.
 * Der Server (Vercel) läuft in UTC, die Takte gelten in deutscher Zeit. Deshalb rechnen die Takte
 * nie mit `Date#getHours()`, sondern immer mit einer `Uhr` in der Zeitzone des Betriebs.
 *
 * Nur relative Importe und reine Funktionen: läuft im Browser und in Node (`src/app/api/takte/cron`).
 */
import type { Datum } from '../../core/objects';

export const ZEITZONE = 'Europe/Berlin';

export interface Uhr {
  /** Kalendertag in der Zeitzone des Betriebs */
  datum: Datum;
  /** Minuten seit Mitternacht (0–1439) */
  minuten: number;
  /** 1 = Montag … 7 = Sonntag */
  wochentag: number;
}

const WOCHENTAGE: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const formate = new Map<string, Intl.DateTimeFormat>();

function format(zone: string) {
  let f = formate.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    });
    formate.set(zone, f);
  }
  return f;
}

/** Zeitpunkt → Uhr in der Zeitzone des Betriebs */
export function uhrVon(zeit: Date | string, zone = ZEITZONE): Uhr {
  const d = typeof zeit === 'string' ? new Date(zeit) : zeit;
  const t: Record<string, string> = {};
  for (const p of format(zone).formatToParts(d)) t[p.type] = p.value;
  return {
    datum: `${t.year}-${t.month}-${t.day}`,
    minuten: (Number(t.hour) % 24) * 60 + Number(t.minute),
    wochentag: WOCHENTAGE[t.weekday] ?? 1,
  };
}

/** "06:30" → 390; ungültig → undefined */
export function minutenVonText(uhr: string | undefined): number | undefined {
  const m = /^(\d{1,2}):(\d{2})$/.exec(uhr ?? '');
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : undefined;
}

/** 390 → "06:30" */
export function textVonMinuten(min: number): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${z(Math.floor(min / 60) % 24)}:${z(min % 60)}`;
}
