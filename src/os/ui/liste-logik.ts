/** Reine Logik der Uhrzeitwahl (`UhrzeitEingabe`), getrennt testbar */

/** „07:30“ → 450 Minuten; ungültig → undefined */
export function uhrMinuten(s: string | undefined): number | undefined {
  const m = /^(\d{2}):(\d{2})/.exec(s ?? '');
  if (!m) return undefined;
  const h = +m[1];
  const min = +m[2];
  return h < 24 && min < 60 ? h * 60 + min : undefined;
}

const zwei = (n: number) => String(n).padStart(2, '0');

/** Alle Uhrzeiten eines Tages im Takt (Minuten) */
export function uhrzeiten(takt: number): string[] {
  const liste: string[] = [];
  for (let m = 0; m < 24 * 60; m += takt) liste.push(`${zwei(Math.floor(m / 60))}:${zwei(m % 60)}`);
  return liste;
}

/**
 * Getippte Uhrzeit lesen: „8“, „08“, „830“, „0830“, „8:30“, „8.30“, „8,30“, „8 Uhr“, „8:30 Uhr“, „8h“.
 * Leer → '' (Feld geleert); nicht lesbar → undefined.
 */
export function uhrLesen(text: string): string | undefined {
  const t = text.trim().toLowerCase().replace(/\s*(uhr|h)$/, '').trim();
  if (!t) return '';
  let h: number;
  let m: number;
  const getrennt = /^(\d{1,2})\s*[:.,]\s*(\d{1,2})$/.exec(t);
  if (getrennt) {
    h = +getrennt[1];
    m = getrennt[2].length === 1 ? +getrennt[2] * 10 : +getrennt[2];
  } else if (/^\d{1,4}$/.test(t)) {
    h = t.length <= 2 ? +t : +t.slice(0, t.length - 2);
    m = t.length <= 2 ? 0 : +t.slice(-2);
  } else return undefined;
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return undefined;
  if (h === 24) h = 0;
  return `${zwei(h)}:${zwei(m)}`;
}
