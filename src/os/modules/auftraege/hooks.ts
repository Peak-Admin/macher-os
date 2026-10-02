import { useSyncExternalStore } from 'react';

/** true ab der angegebenen Breite (Desktop-Spalten vs. mobile Liste) */
export function useAbBreite(px: number): boolean {
  const q = `(min-width: ${px}px)`;
  return useSyncExternalStore(
    (f) => {
      const m = globalThis.matchMedia?.(q);
      m?.addEventListener('change', f);
      return () => m?.removeEventListener('change', f);
    },
    () => globalThis.matchMedia?.(q).matches ?? true,
    () => true,
  );
}
