/**
 * Speichergrenze im Browser.
 *
 * Macher OS speichert in IndexedDB (viel Platz), im Rückfall im localStorage (wenige MB).
 * Vor dem Speichern großer Inhalte (Fotos, Sprachnotizen, Dateien) prüfen wir, ob der Platz reicht.
 */
import { platzFuer, speicherStatus } from '@core/db';

const PROBE_KEY = 'macher-os:platzprobe';
/** Puffer für Zeitstrahl, Hinweise usw., die mit jedem Speichern wachsen */
const PUFFER = 64 * 1024;

/** Passt `zeichen` zusätzlich in den Speicher? Probiert es wirklich aus. */
export function platzFrei(zeichen: number): boolean {
  if (speicherStatus().ort === 'indexeddb') return platzFuer(zeichen * 2 + PUFFER);
  const ls = globalThis.localStorage;
  if (!ls) return true;
  try {
    ls.setItem(PROBE_KEY, 'x'.repeat(Math.max(0, Math.ceil(zeichen + PUFFER))));
    ls.removeItem(PROBE_KEY);
    return true;
  } catch {
    try {
      ls.removeItem(PROBE_KEY);
    } catch {
      /* egal */
    }
    return false;
  }
}

/** Belegte Bytes im Browser-Speicher (Näherung für die Anzeige) */
export function speicherBelegt(): number {
  const st = speicherStatus();
  if (st.ort === 'indexeddb') return st.belegt ?? 0;
  const ls = globalThis.localStorage;
  if (!ls) return 0;
  let n = 0;
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k) n += k.length + (ls.getItem(k)?.length ?? 0);
  }
  return n * 2; // UTF-16: 2 Byte je Zeichen
}

export const SPEICHER_VOLL_TEXT =
  'Der Speicher in diesem Browser ist voll. Macher OS speichert lokal auf deinem Gerät. Lösche alte Fotos oder Dateien, die du nicht mehr brauchst, und versuch es dann noch mal.';
