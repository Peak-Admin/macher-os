/**
 * Globale Overlays (Suche, Macher fragen, Schnell erfassen, Benachrichtigungen).
 * Die Shell löst sie aus, Module rendern sie über `global` in ihrer ModulDef.
 */
import { useSyncExternalStore } from 'react';

export type OverlayName = 'suche' | 'macher' | 'schnell' | 'benachrichtigungen' | (string & {});

let offen: { name: OverlayName; payload?: unknown } | null = null;
const l = new Set<() => void>();
const sub = (f: () => void) => (l.add(f), () => l.delete(f));
const get = () => offen;

export function oeffne(name: OverlayName, payload?: unknown) {
  offen = { name, payload };
  l.forEach((f) => f());
}

export function schliesse() {
  offen = null;
  l.forEach((f) => f());
}

/** `const { offen, payload } = useOverlay('suche')` */
export function useOverlay(name: OverlayName) {
  const o = useSyncExternalStore(sub, get, get);
  return { offen: o?.name === name, payload: o?.name === name ? o.payload : undefined, schliessen: schliesse };
}
