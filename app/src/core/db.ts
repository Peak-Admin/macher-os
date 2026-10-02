/**
 * Datenschicht: eine Quelle für alle Objekte.
 *
 * - Jede Sammlung hat einen eindeutigen Namen. Kernobjekte stehen in `objects.ts`.
 * - Module dürfen nur NEUE Objekttypen anlegen (`defineCollection`), nie Kopien
 *   bestehender Objekte. Verweise immer per ID (`kundeId`, `auftragId` …).
 * - Jede Änderung erzeugt ein Ereignis (Zeitstrahl/Audit) und informiert Abonnenten.
 * - Löschen ist reversibel (Soft Delete).
 *
 * Speicherung aktuell lokal (localStorage). Die API ist so geschnitten, dass sie
 * später 1:1 gegen ein Backend (z. B. Supabase mit RLS) getauscht werden kann.
 */
import { useSyncExternalStore, useMemo } from 'react';
import type { Basis, Bezug, ID, ObjektMap, ObjektTyp, Ereignis } from './objects';
import { emit } from './events';

const SPEICHER_KEY = 'macher-os:v1';

type Tabelle = Record<ID, Basis>;
type Daten = Record<string, Tabelle>;

let daten: Daten = laden();
let version = 0;
const listeners = new Set<() => void>();
const definiert = new Set<string>();
let speichernGeplant = false;
let aktuellerNutzer: ID | undefined;

function laden(): Daten {
  try {
    const roh = globalThis.localStorage?.getItem(SPEICHER_KEY);
    return roh ? (JSON.parse(roh) as Daten) : {};
  } catch {
    return {};
  }
}

function speichern() {
  if (speichernGeplant) return;
  speichernGeplant = true;
  queueMicrotask(() => {
    speichernGeplant = false;
    try {
      globalThis.localStorage?.setItem(SPEICHER_KEY, JSON.stringify(daten));
    } catch {
      // Speicher voll oder nicht verfügbar – Daten bleiben im Arbeitsspeicher.
    }
  });
}

let batchTiefe = 0;

function geaendert() {
  version++;
  speichern();
  if (batchTiefe === 0) listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getVersion() {
  return version;
}

/** Wer gerade arbeitet – wird bei Ereignissen und `erstelltVon` vermerkt. */
export function setAktuellerNutzer(id: ID | undefined) {
  aktuellerNutzer = id;
}

export function neueId(prefix = ''): ID {
  const zufall =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${zufall}` : zufall;
}

const jetzt = () => new Date().toISOString();

// ------------------------------------------------------------------ Collection

export type Neu<T extends Basis> = Omit<T, keyof Basis> & Partial<Pick<Basis, 'id' | 'beispiel'>>;

export interface Collection<T extends Basis> {
  readonly name: string;
  /** alle nicht gelöschten Einträge */
  all(): T[];
  /** inkl. Papierkorb */
  allMitGeloeschten(): T[];
  get(id: ID | undefined): T | undefined;
  where(pred: (t: T) => boolean): T[];
  create(neu: Neu<T>, opts?: { leise?: boolean }): T;
  update(id: ID, patch: Partial<T>, opts?: { leise?: boolean; text?: string }): T | undefined;
  /** Soft Delete */
  remove(id: ID): void;
  restore(id: ID): void;
  /** endgültig löschen (nur für Beispieldaten/Papierkorb) */
  purge(id: ID): void;
  /** React-Hook: alle Einträge, optional gefiltert; rendert bei Änderungen neu */
  use(pred?: (t: T) => boolean, deps?: unknown[]): T[];
  useOne(id: ID | undefined): T | undefined;
}

function tabelle(name: string): Tabelle {
  return (daten[name] ??= {});
}

function protokoll(name: string, aktion: string, obj: Basis, text?: string) {
  if (name === 'ereignisse') return;
  const typ = `${name}.${aktion}`;
  const e: Ereignis = {
    id: neueId('e'),
    erstelltAm: jetzt(),
    geaendertAm: jetzt(),
    erstelltVon: aktuellerNutzer,
    typ,
    bezug: { typ: name as ObjektTyp, id: obj.id },
    text: text ?? standardText(aktion),
    vonMitarbeiterId: aktuellerNutzer,
  };
  tabelle('ereignisse')[e.id] = e;
}

function standardText(aktion: string) {
  switch (aktion) {
    case 'created':
      return 'Angelegt';
    case 'updated':
      return 'Geändert';
    case 'removed':
      return 'In den Papierkorb gelegt';
    case 'restored':
      return 'Wiederhergestellt';
    default:
      return aktion;
  }
}

/**
 * Legt eine Sammlung an. Jeder Name darf genau einmal definiert werden –
 * so kann kein Objekttyp doppelt existieren.
 */
export function defineCollection<T extends Basis>(name: string): Collection<T> {
  if (definiert.has(name)) {
    throw new Error(
      `Sammlung "${name}" existiert bereits. Jedes Objekt gibt es genau einmal – nutze die bestehende Sammlung.`,
    );
  }
  definiert.add(name);
  return collection<T>(name);
}

function collection<T extends Basis>(name: string): Collection<T> {
  const c: Collection<T> = {
    name,
    all: () => Object.values(tabelle(name)).filter((x) => !x.geloeschtAm) as T[],
    allMitGeloeschten: () => Object.values(tabelle(name)) as T[],
    get: (id) => (id ? (tabelle(name)[id] as T | undefined) : undefined),
    where: (pred) => c.all().filter(pred),
    create(neu, opts) {
      const zeit = jetzt();
      const obj = {
        ...neu,
        id: neu.id ?? neueId(),
        erstelltAm: zeit,
        geaendertAm: zeit,
        erstelltVon: aktuellerNutzer,
      } as unknown as T;
      tabelle(name)[obj.id] = obj;
      if (!opts?.leise) protokoll(name, 'created', obj);
      geaendert();
      if (!opts?.leise) emit({ typ: `${name}.created`, sammlung: name, objekt: obj });
      return obj;
    },
    update(id, patch, opts) {
      const alt = tabelle(name)[id] as T | undefined;
      if (!alt) return undefined;
      const neu = { ...alt, ...patch, id, geaendertAm: jetzt() } as T;
      tabelle(name)[id] = neu;
      if (!opts?.leise) protokoll(name, 'updated', neu, opts?.text);
      geaendert();
      if (!opts?.leise) emit({ typ: `${name}.updated`, sammlung: name, objekt: neu, vorher: alt });
      return neu;
    },
    remove(id) {
      const alt = tabelle(name)[id];
      if (!alt) return;
      const neu = { ...alt, geloeschtAm: jetzt() };
      tabelle(name)[id] = neu;
      protokoll(name, 'removed', neu);
      geaendert();
      emit({ typ: `${name}.removed`, sammlung: name, objekt: neu });
    },
    restore(id) {
      const alt = tabelle(name)[id];
      if (!alt) return;
      const neu = { ...alt };
      delete neu.geloeschtAm;
      tabelle(name)[id] = neu;
      protokoll(name, 'restored', neu);
      geaendert();
    },
    purge(id) {
      delete tabelle(name)[id];
      geaendert();
    },
    use(pred, deps = []) {
      const v = useSyncExternalStore(subscribe, getVersion, getVersion);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return useMemo(() => (pred ? c.all().filter(pred) : c.all()), [v, ...deps]);
    },
    useOne(id) {
      const v = useSyncExternalStore(subscribe, getVersion, getVersion);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return useMemo(() => c.get(id), [v, id]);
    },
  };
  return c;
}

/** Re-render bei jeder Datenänderung (für abgeleitete Berechnungen über mehrere Sammlungen). */
export function useDatenstand() {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

/** Mehrere Änderungen bündeln (nur ein Re-Render). */
export function batch(fn: () => void) {
  batchTiefe++;
  try {
    fn();
  } finally {
    batchTiefe--;
    if (batchTiefe === 0) geaendert();
  }
}

// ------------------------------------------------------------------ Kernsammlungen

type KernCollections = { [K in ObjektTyp]: Collection<ObjektMap[K]> };

export const db: KernCollections = Object.fromEntries(
  (
    [
      'betrieb',
      'mitarbeiter',
      'qualifikationen',
      'nachweise',
      'abwesenheiten',
      'kunden',
      'orte',
      'anlagen',
      'auftraege',
      'aufgaben',
      'termine',
      'leistungen',
      'lieferanten',
      'artikel',
      'angebote',
      'rechnungen',
      'zahlungen',
      'belege',
      'zeiten',
      'material',
      'dokumente',
      'nachrichten',
      'betriebsmittel',
      'hinweise',
      'erledigungen',
      'benachrichtigungen',
      'ereignisse',
    ] as ObjektTyp[]
  ).map((n) => [n, defineCollection(n)]),
) as KernCollections;

/** Generischer Zugriff über einen Bezug */
export function aufloesen(b: Bezug | undefined): Basis | undefined {
  if (!b) return undefined;
  return tabelle(b.typ)[b.id];
}

/** Zeitstrahl eines Objekts (neueste zuerst) */
export function zeitstrahl(b: Bezug): Ereignis[] {
  return db.ereignisse
    .where((e) => e.bezug.typ === b.typ && e.bezug.id === b.id)
    .sort((a, z) => z.erstelltAm.localeCompare(a.erstelltAm));
}

/** Eigenen Eintrag in den Zeitstrahl schreiben (z. B. "Angebot versendet") */
export function vermerken(bezug: Bezug, typ: string, text: string, datenZusatz?: unknown) {
  db.ereignisse.create(
    { typ, bezug, text, vonMitarbeiterId: aktuellerNutzer, daten: datenZusatz } as never,
    { leise: true },
  );
}

/** Alles zurücksetzen (Onboarding neu starten, Tests) */
export function zuruecksetzen() {
  daten = {};
  geaendert();
}

/** Rohdaten exportieren (Backup, Steuerberater-Export, Tests) */
export function exportieren(): Daten {
  return JSON.parse(JSON.stringify(daten));
}

export function importieren(d: Daten) {
  daten = d;
  geaendert();
}
