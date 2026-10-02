/**
 * Speichergrenze im Browser.
 *
 * Macher OS speichert aktuell alles im localStorage (wenige MB je Browser). Die Datenschicht
 * verschluckt einen vollen Speicher still – deshalb prüfen wir VOR dem Speichern großer
 * Inhalte (Fotos, Sprachnotizen, Dateien), ob der Platz reicht, und sagen es ehrlich.
 */
const PROBE_KEY = 'macher-os:platzprobe';
/** Puffer für Zeitstrahl, Hinweise usw., die mit jedem Speichern wachsen */
const PUFFER = 64 * 1024;

/** Passt `zeichen` zusätzlich in den Speicher? Probiert es wirklich aus. */
export function platzFrei(zeichen: number): boolean {
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

/** Belegte Zeichen im localStorage (Näherung für die Anzeige) */
export function speicherBelegt(): number {
  const ls = globalThis.localStorage;
  if (!ls) return 0;
  let n = 0;
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k) n += k.length + (ls.getItem(k)?.length ?? 0);
  }
  return n;
}

export const SPEICHER_VOLL_TEXT =
  'Der Speicher in diesem Browser ist voll. Macher OS speichert gerade noch lokal auf deinem Gerät. Lösche alte Fotos oder Dateien, die du nicht mehr brauchst, und versuch es dann noch mal.';
