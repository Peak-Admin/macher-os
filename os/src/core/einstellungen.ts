/** Schlüssel-Wert-Einstellungen (Automationen an/aus, Modul-Optionen …). */
import { defineCollection } from './db';
import type { Basis } from './objects';

interface Einstellung extends Basis {
  wert: unknown;
}

const einstellungen = defineCollection<Einstellung>('einstellungen');

export function einstellung<T>(schluessel: string, standard: T): T {
  const e = einstellungen.get(schluessel);
  return e ? (e.wert as T) : standard;
}

export function setzeEinstellung(schluessel: string, wert: unknown) {
  if (einstellungen.get(schluessel)) einstellungen.update(schluessel, { wert }, { leise: true });
  else einstellungen.create({ id: schluessel, wert }, { leise: true });
}

export function useEinstellung<T>(schluessel: string, standard: T): [T, (w: T) => void] {
  const e = einstellungen.useOne(schluessel);
  return [e ? (e.wert as T) : standard, (w: T) => setzeEinstellung(schluessel, w)];
}
