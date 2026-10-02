/**
 * Ereignisbus: Zustandsänderungen als Events (`auftraege.created`, `rechnungen.updated` …).
 * Automationen und Benachrichtigungen hängen sich hier an – Module kennen einander nicht direkt.
 */
import type { Basis } from './objects';

export interface DbEvent {
  /** `<sammlung>.<aktion>` oder fachlich, z. B. `angebot.versendet` */
  typ: string;
  sammlung?: string;
  objekt?: Basis;
  vorher?: Basis;
  daten?: unknown;
}

type Handler = (e: DbEvent) => void;
const handler = new Map<string, Set<Handler>>();
let tiefe = 0;

/** `on('auftraege.updated', …)`, `on('auftraege.*', …)` oder `on('*', …)` */
export function on(muster: string, h: Handler) {
  if (!handler.has(muster)) handler.set(muster, new Set());
  handler.get(muster)!.add(h);
  return () => handler.get(muster)!.delete(h);
}

export function emit(e: DbEvent) {
  // Schutz gegen Endlosschleifen (Automation ändert Objekt → Event → Automation …)
  if (tiefe > 5) return;
  tiefe++;
  try {
    const [praefix] = e.typ.split('.');
    for (const key of [e.typ, `${praefix}.*`, '*']) {
      handler.get(key)?.forEach((h) => {
        try {
          h(e);
        } catch (err) {
          console.error(`Fehler im Event-Handler für ${e.typ}`, err);
        }
      });
    }
  } finally {
    tiefe--;
  }
}
