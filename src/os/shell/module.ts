/** Findet alle Module automatisch: `src/os/modules/<id>/index.ts(x)` mit `export default defineModul(...)`.
 *  Die Liste erzeugt `scripts/os-module.mjs` (läuft vor `dev`, `build` und `test`). */
import { registriereModule } from '@core/modul';
import { modulListe } from './module-liste';

export function ladeModule() {
  const liste = modulListe
    .map(([id, m]) => {
      if (!m) console.warn(`Modul ${id} exportiert kein default defineModul(...)`);
      return m;
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
