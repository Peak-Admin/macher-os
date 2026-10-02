/** Findet alle Module automatisch: `src/modules/<id>/index.ts(x)` mit `export default defineModul(...)` */
import { registriereModule, type ModulDef } from '@core/modul';

const gefunden = import.meta.glob<{ default: ModulDef }>('../modules/*/index.{ts,tsx}', { eager: true });

export function ladeModule() {
  const liste = Object.entries(gefunden)
    .map(([pfad, m]) => {
      if (!m.default) console.warn(`Modul ${pfad} exportiert kein default defineModul(...)`);
      return m.default;
    })
    .filter(Boolean);
  registriereModule(liste);
  for (const m of liste) {
    try {
      m.init?.();
    } catch (e) {
      console.error(`Init von Modul ${m.id} fehlgeschlagen`, e);
    }
  }
  return liste;
}
