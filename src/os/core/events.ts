/**
 * Ereignisbus: Zustandsänderungen als Events (`auftraege.created`, `rechnungen.updated` …).
 * Automationen und Benachrichtigungen hängen sich hier an – Module kennen einander nicht direkt.
 *
 * Zwei Arten von Events:
 * - Datenereignisse `<sammlung>.created|updated|removed|restored` – sendet die Datenschicht bei jeder Änderung.
 * - Fachliche Ereignisse `<objekt>.<partizip>` (`angebot.versendet`, `rechnung.bezahlt` …) – Katalog in
 *   `ereignisse.ts`. Viele leitet der Kern selbst aus Datenereignissen ab; Module senden die übrigen mit `emit`.
 *
 * Handler, die eine Automation in `start()` registriert, laufen automatisch im Namen dieser Automation
 * (Audit: „geändert durch Macher“).
 */
import { alsAkteur, registrierAkteur, type Akteur } from './akteur';
import type { Basis } from './objects';

export interface DbEvent {
  /** `<sammlung>.<aktion>` oder fachlich, z. B. `angebot.versendet` */
  typ: string;
  sammlung?: string;
  objekt?: Basis;
  vorher?: Basis;
  daten?: unknown;
  /** vom Kern aus einem Datenereignis abgeleitet (nicht von einem Modul gesendet) */
  abgeleitet?: boolean;
}

type Handler = (e: DbEvent) => void;
const handler = new Map<string, Set<Handler>>();
let tiefe = 0;

/** `on('auftraege.updated', …)`, `on('auftraege.*', …)` oder `on('*', …)` */
export function on(muster: string, h: Handler) {
  if (!handler.has(muster)) handler.set(muster, new Set());
  // Während eine Automation startet, läuft ihr Handler später in ihrem Namen
  const akteur: Akteur | undefined = registrierAkteur();
  const fn: Handler = akteur ? (e) => alsAkteur(akteur, () => h(e)) : h;
  handler.get(muster)!.add(fn);
  return () => handler.get(muster)!.delete(fn);
}

const DATEN_AKTIONEN = new Set(['created', 'updated', 'removed', 'restored']);

/** Datenereignis der Datenschicht (`kunden.created`) – im Gegensatz zu fachlichen Ereignissen */
export function istDatenEreignis(e: Pick<DbEvent, 'typ' | 'sammlung'>): boolean {
  if (!e.sammlung) return false;
  const i = e.typ.lastIndexOf('.');
  return e.typ.slice(0, i) === e.sammlung && DATEN_AKTIONEN.has(e.typ.slice(i + 1));
}

/** Zuletzt von Modulen selbst gesendete fachliche Ereignisse (`typ|objektId` → Zeit) – gegen doppelte Ableitung */
const gesendet = new Map<string, number>();
const DOPPELT_MS = 2000;

const eventSchluessel = (e: DbEvent) => `${e.typ}|${e.objekt?.id ?? ''}`;

/** Wurde dieses fachliche Ereignis gerade (vor höchstens 2 s) schon von einem Modul gesendet? */
export function kuerzlichGesendet(e: DbEvent): boolean {
  const t = gesendet.get(eventSchluessel(e));
  return t !== undefined && Date.now() - t < DOPPELT_MS;
}

export function emit(e: DbEvent) {
  // Schutz gegen Endlosschleifen (Automation ändert Objekt → Event → Automation …)
  if (tiefe > 5) return;
  if (!e.abgeleitet && !istDatenEreignis(e)) {
    gesendet.set(eventSchluessel(e), Date.now());
    if (gesendet.size > 500) for (const [k, t] of gesendet) if (Date.now() - t > DOPPELT_MS) gesendet.delete(k);
  }
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
