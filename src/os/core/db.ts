/**
 * Datenschicht: eine Quelle für alle Objekte.
 *
 * - Jede Sammlung hat einen eindeutigen Namen. Kernobjekte stehen in `objects.ts`.
 * - Module dürfen nur NEUE Objekttypen anlegen (`defineCollection`), nie Kopien
 *   bestehender Objekte. Verweise immer per ID (`kundeId`, `auftragId` …).
 * - Jede Änderung erzeugt ein Ereignis (Zeitstrahl/Audit) und informiert Abonnenten.
 * - Löschen ist reversibel (Soft Delete).
 *
 * Speicherung lokal im Browser: IndexedDB (genug Platz für Fotos und Dateien), Rückfall
 * auf localStorage. Mit Konto ist IndexedDB nur noch der Cache: `sync.ts` hängt sich über
 * `setzeSyncBeobachter` an, lädt geänderte Objekte hoch und spielt fremde Änderungen über
 * `fremdeAenderungen` ein. Die API für Module bleibt dieselbe.
 */
import { useSyncExternalStore, useMemo } from 'react';
import type { Basis, Bezug, ID, ObjektMap, ObjektTyp, Ereignis, FeldAenderung } from './objects';
import { emit } from './events';
import { aktuellerAkteur, eintragGemerkt, type Akteur } from './akteur';
import { verlaufText } from './audit-text';

const SPEICHER_KEY = 'macher-os:v1';
const IDB_NAME = 'macher-os';
const IDB_STORE = 'stand';

type Tabelle = Record<ID, Basis>;
type Daten = Record<string, Tabelle>;

let daten: Daten = ladenLocal();
let version = 0;
const listeners = new Set<() => void>();
const sammlungen = new Map<string, Collection<Basis>>();
let speichernGeplant: ReturnType<typeof setTimeout> | undefined;
let aktuellerNutzer: ID | undefined;
let idb: IDBDatabase | undefined;
/**
 * Seit dem letzten Speichern geänderte Einträge (Sammlung → IDs). Gespeichert wird nur, was dieser Tab
 * geändert hat – so überschreibt ein zweiter Tab (Druckansicht, Kundenbereich) nie die Änderungen eines anderen.
 */
let offen = new Map<string, Set<ID>>();
/** Ganzer Stand ersetzt (Zurücksetzen, Import) */
let allesOffen = false;
const kanal: BroadcastChannel | undefined = typeof BroadcastChannel === 'function' ? new BroadcastChannel('macher-os:daten') : undefined;

function markieren(name: string, id: ID) {
  let ids = offen.get(name);
  if (!ids) offen.set(name, (ids = new Set()));
  ids.add(id);
}

// ------------------------------------------------------------------ Anbindung an den Abgleich (Sync)

export interface SyncBeobachter {
  /** Dieser Tab hat ein Objekt angelegt, geändert oder entfernt */
  geaendert(sammlung: string, id: ID): void;
  /** Der ganze Stand wurde ersetzt (Zurücksetzen, Import) – wird bewusst nicht hochgeladen */
  ersetzt?(): void;
}
let syncBeobachter: SyncBeobachter | undefined;

/** Vom Abgleich (`sync.ts`) gesetzt, solange ein Konto verbunden ist */
export function setzeSyncBeobachter(b: SyncBeobachter | undefined) {
  syncBeobachter = b;
}

/** Eigene Änderung: speichern und (mit Konto) hochladen */
function lokalGeaendert(name: string, id: ID) {
  markieren(name, id);
  try {
    syncBeobachter?.geaendert(name, id);
  } catch (e) {
    console.warn('Abgleich konnte die Änderung nicht vormerken.', e);
  }
}

/** Ein Objekt so, wie es gerade im Speicher liegt (ohne Kopie) */
export function rohObjekt(sammlung: string, id: ID): Basis | undefined {
  return daten[sammlung]?.[id];
}

/** Änderungen von anderen Geräten einspielen. `objekt: null` = endgültig entfernt. Erzeugt keine Ereignisse. */
export function fremdeAenderungen(liste: { sammlung: string; id: ID; objekt: Basis | null }[]) {
  if (!liste.length) return;
  for (const { sammlung: name, id, objekt } of liste) {
    if (objekt) tabelle(name)[id] = objekt;
    else if (daten[name]) delete daten[name][id];
    markieren(name, id);
  }
  geaendert();
}

/**
 * Kompletten Stand als Sicherung in IndexedDB ablegen (z. B. bevor ein Gerät die Daten eines Betriebs übernimmt).
 * Liefert den Schlüssel der Sicherung oder undefined, wenn es keinen dauerhaften Speicher gibt.
 */
export async function sicherungAnlegen(grund: string): Promise<string | undefined> {
  if (!idb) return undefined;
  const schluessel = `sicherung:${jetzt()}`;
  const tx = idb.transaction(IDB_STORE, 'readwrite');
  tx.objectStore(IDB_STORE).put({ grund, angelegtAm: jetzt(), daten: exportieren() }, schluessel);
  await new Promise<void>((ok, fehler) => {
    tx.oncomplete = () => ok();
    tx.onerror = () => fehler(tx.error);
    tx.onabort = () => fehler(tx.error);
  });
  return schluessel;
}

/** Eine mit `sicherungAnlegen` abgelegte Sicherung lesen (z. B. zum Herunterladen) */
export async function sicherungLesen(schluessel: string): Promise<{ grund: string; angelegtAm: string; daten: Daten } | undefined> {
  if (!idb) return undefined;
  return (await idbAnfrage(idb.transaction(IDB_STORE).objectStore(IDB_STORE).get(schluessel))) as
    | { grund: string; angelegtAm: string; daten: Daten }
    | undefined;
}

export interface SpeicherStatus {
  ort: 'indexeddb' | 'localstorage' | 'arbeitsspeicher';
  fehler?: string;
  /** belegte und verfügbare Bytes laut Browser (Schätzung) */
  belegt?: number;
  verfuegbar?: number;
}
let status: SpeicherStatus = { ort: globalThis.localStorage ? 'localstorage' : 'arbeitsspeicher' };
const statusListener = new Set<() => void>();
function setzeStatus(s: Partial<SpeicherStatus>) {
  status = { ...status, ...s };
  statusListener.forEach((l) => l());
}

function ladenLocal(): Daten {
  try {
    const roh = globalThis.localStorage?.getItem(SPEICHER_KEY);
    return roh ? (JSON.parse(roh) as Daten) : {};
  } catch {
    return {};
  }
}

function idbAnfrage<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((ok, fehler) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fehler(r.error);
  });
}

/**
 * Beim App-Start einmal aufrufen (vor dem ersten Rendern). Öffnet IndexedDB und lädt den Stand;
 * vorhandene localStorage-Daten werden einmalig übernommen.
 */
export async function initDb(): Promise<void> {
  if (!globalThis.indexedDB) return;
  try {
    const open = indexedDB.open(IDB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(IDB_STORE);
    idb = await idbAnfrage(open);
    const gespeichert = await idbAnfrage(idb.transaction(IDB_STORE).objectStore(IDB_STORE).get('daten'));
    if (gespeichert) {
      daten = gespeichert as Daten;
    } else if (Object.keys(daten).length) {
      allesOffen = true;
      await schreibeIdb();
    }
    try {
      globalThis.localStorage?.removeItem(SPEICHER_KEY);
    } catch {
      /* egal */
    }
    setzeStatus({ ort: 'indexeddb', fehler: undefined });
    if (kanal) kanal.onmessage = () => void neuLaden();
    void schaetzePlatz();
    version++;
    listeners.forEach((l) => l());
  } catch (e) {
    idb = undefined;
    console.warn('IndexedDB nicht verfügbar – speichere im localStorage.', e);
  }
}

/** Gespeicherten Stand mit den noch nicht gespeicherten eigenen Änderungen überlagern */
export function ueberlagern(gespeichert: Daten, aenderungen: Map<string, Set<ID>>, quelle: Daten): Daten {
  for (const [name, ids] of aenderungen) {
    const t = (gespeichert[name] ??= {});
    for (const id of ids) {
      const x = quelle[name]?.[id];
      if (x) t[id] = x;
      else delete t[id];
    }
  }
  return gespeichert;
}

/**
 * Schreibt nur die geänderten Einträge in den gespeicherten Stand (in einer Transaktion) und übernimmt
 * dabei, was andere Tabs inzwischen gespeichert haben.
 */
async function schreibeIdb(): Promise<void> {
  if (!idb) return;
  const ganz = allesOffen;
  const aenderungen = offen;
  offen = new Map();
  allesOffen = false;
  const tx = idb.transaction(IDB_STORE, 'readwrite');
  const store = tx.objectStore(IDB_STORE);
  let neuerStand: Daten | undefined;
  if (ganz) store.put(daten, 'daten');
  else {
    const g = store.get('daten');
    g.onsuccess = () => {
      neuerStand = ueberlagern((g.result as Daten | undefined) ?? {}, aenderungen, daten);
      store.put(neuerStand, 'daten');
    };
  }
  try {
    await new Promise<void>((ok, fehler) => {
      tx.oncomplete = () => ok();
      tx.onerror = () => fehler(tx.error);
      tx.onabort = () => fehler(tx.error);
    });
  } catch (e) {
    // nicht verlieren: beim nächsten Speichern erneut versuchen
    for (const [name, ids] of aenderungen) ids.forEach((id) => markieren(name, id));
    allesOffen ||= ganz;
    throw e;
  }
  kanal?.postMessage('gespeichert');
  if (neuerStand) uebernehmen(neuerStand);
}

/** Fremden Stand übernehmen, ohne eigene ungespeicherte Änderungen zu verlieren */
function uebernehmen(stand: Daten) {
  if (allesOffen) return;
  daten = ueberlagern(stand, offen, daten);
  version++;
  if (batchTiefe === 0) listeners.forEach((l) => l());
}

/** Ein anderer Tab hat gespeichert → Stand neu laden */
async function neuLaden() {
  if (!idb) return;
  try {
    const g = await idbAnfrage(idb.transaction(IDB_STORE).objectStore(IDB_STORE).get('daten'));
    if (g) uebernehmen(g as Daten);
  } catch {
    /* beim nächsten Mal */
  }
}

async function schaetzePlatz() {
  try {
    const e = await navigator.storage?.estimate?.();
    if (e) setzeStatus({ belegt: e.usage, verfuegbar: e.quota });
  } catch {
    /* egal */
  }
}

const SPEICHER_FEHLER = 'Deine letzten Änderungen konnten nicht dauerhaft gespeichert werden. Der Speicher ist voll oder gesperrt.';

function speichern() {
  if (speichernGeplant) return;
  speichernGeplant = setTimeout(async () => {
    speichernGeplant = undefined;
    if (idb) {
      try {
        await schreibeIdb();
        if (status.fehler) setzeStatus({ fehler: undefined });
        void schaetzePlatz();
      } catch {
        setzeStatus({ fehler: SPEICHER_FEHLER });
      }
      return;
    }
    offen = new Map();
    allesOffen = false;
    try {
      globalThis.localStorage?.setItem(SPEICHER_KEY, JSON.stringify(daten));
      if (status.fehler) setzeStatus({ fehler: undefined });
    } catch {
      setzeStatus({ fehler: SPEICHER_FEHLER });
    }
  }, 150);
}

/** Speicherort, Fehler und Platz – z. B. für Fotos: vor großen Uploads prüfen */
export function speicherStatus(): SpeicherStatus {
  return status;
}

export function useSpeicherStatus(): SpeicherStatus {
  return useSyncExternalStore(
    (l) => (statusListener.add(l), () => statusListener.delete(l)),
    () => status,
    () => status,
  );
}

/** Passen weitere `bytes` noch in den Speicher? (bei IndexedDB anhand der Browser-Schätzung) */
export function platzFuer(bytes: number): boolean {
  if (status.ort === 'indexeddb') {
    if (status.verfuegbar == null || status.belegt == null) return true;
    return status.belegt + bytes < status.verfuegbar * 0.95;
  }
  return true;
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

/** Der angemeldete Mensch (für Audit und Ereignisprotokoll) */
export function aktuellerNutzerId(): ID | undefined {
  return aktuellerNutzer;
}

export function neueId(prefix = ''): ID {
  const zufall =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${zufall}` : zufall;
}

const jetzt = () => new Date().toISOString();

// ------------------------------------------------------------------ Schreibschutz

/** Wird geworfen, wenn Schreiben gesperrt ist (z. B. Testphase abgelaufen → Lesemodus). */
export class SchreibGesperrt extends Error {
  constructor(grund: string) {
    super(grund);
    this.name = 'SchreibGesperrt';
  }
}

let schreibPruefer: ((sammlung: string) => string | undefined) | undefined;

/**
 * Hängt eine Prüfung vor jedes create/update/remove. Gibt sie einen Grund zurück, wird nicht
 * geschrieben und `SchreibGesperrt` geworfen. Systemsammlungen (Ereignisse, Einstellungen …)
 * entscheidet der Prüfer selbst. Genutzt vom Paket Paid (Lesemodus nach der Testphase).
 */
export function setzeSchreibschutz(pruefer: ((sammlung: string) => string | undefined) | undefined) {
  schreibPruefer = pruefer;
}

function schreibenPruefen(name: string) {
  const grund = schreibPruefer?.(name);
  if (grund) throw new SchreibGesperrt(grund);
}

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

// ------------------------------------------------------------------ Audit (Verlauf am Objekt)

/** Sammlungen ohne Feld-Protokoll und ohne Protokoll stiller Änderungen (Systemdaten, Chat …) */
const OHNE_FELDER = new Set(['ereignisse', 'einstellungen', 'benachrichtigungen', 'hinweise', 'erledigungen']);
/** Größter gespeicherter Feldwert (Zeichen JSON). Größeres (Fotos als Data-URL) wird nur als „geändert“ vermerkt. */
const MAX_FELDWERT = 4000;
/** stille Änderungen (Tippen im Editor) desselben Akteurs innerhalb dieser Zeit landen in einem Eintrag */
const ZUSAMMENFASSEN_MS = 30 * 60 * 1000;
const NIE_VERGLEICHEN = new Set(['id', 'erstelltAm', 'geaendertAm']);
const zuletztStill = new Map<string, { id: ID; zeit: number; akteur: string }>();

/**
 * Sammlung vom Feld-Protokoll ausnehmen (z. B. Chatverlauf, Caches). Angelegt/Gelöscht wird weiter vermerkt,
 * geänderte Felder und stille Änderungen nicht.
 */
export function auditAusnehmen(name: string) {
  OHNE_FELDER.add(name);
}

const json = (x: unknown) => (x === undefined ? undefined : JSON.stringify(x));

/**
 * Werte, die nicht in den (für alle Mitglieder lesbaren) Verlauf gehören. Spiegelt die Server-Rechte
 * (Migration „Rechte“: Sammlungen nur für Chef/Büro, geschützte Felder). Hier steht nur „geändert“, ohne Werte –
 * außer dem Status. Weitere per `auditWerteSchuetzen`.
 */
const GESCHUETZTE_SAMMLUNGEN = new Set(['rechnungen', 'zahlungen', 'belege', 'mahnungen']);
const GESCHUETZTE_FELDER = new Set(['mitarbeiter.kostensatz']);
const OFFENE_FELDER = new Set(['status']);

/** Sammlung (ohne Feld) oder einzelnes Feld vom Wert-Protokoll ausnehmen: `auditWerteSchuetzen('mitarbeiter', 'lohn')` */
export function auditWerteSchuetzen(sammlungName: string, feld?: string) {
  if (feld) GESCHUETZTE_FELDER.add(`${sammlungName}.${feld}`);
  else GESCHUETZTE_SAMMLUNGEN.add(sammlungName);
}

const wertGeschuetzt = (name: string | undefined, k: string) =>
  !!name && ((GESCHUETZTE_SAMMLUNGEN.has(name) && !OFFENE_FELDER.has(k)) || GESCHUETZTE_FELDER.has(`${name}.${k}`));

/** Nur geänderte Felder mit vorher/nachher (tief kopiert, große Werte gekürzt, geschützte Werte ohne Inhalt) */
export function feldAenderungen(alt: Basis, neu: Basis, name?: string): Record<string, FeldAenderung> {
  const a = alt as unknown as Record<string, unknown>;
  const n = neu as unknown as Record<string, unknown>;
  const r: Record<string, FeldAenderung> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(n)])) {
    if (NIE_VERGLEICHEN.has(k) || a[k] === n[k]) continue;
    const ja = json(a[k]);
    const jn = json(n[k]);
    if (ja === jn) continue;
    if (wertGeschuetzt(name, k)) r[k] = { geschuetzt: true };
    else if ((ja?.length ?? 0) > MAX_FELDWERT || (jn?.length ?? 0) > MAX_FELDWERT) r[k] = { gekuerzt: true };
    else r[k] = { vorher: ja === undefined ? undefined : JSON.parse(ja), nachher: jn === undefined ? undefined : JSON.parse(jn) };
  }
  return r;
}

function akteurFelder(a: Akteur | undefined) {
  const quelle = a?.quelle ?? 'user';
  return { quelle, akteurId: a?.id, vonMitarbeiterId: quelle === 'user' ? (a?.mitarbeiterId ?? aktuellerNutzer) : a?.mitarbeiterId };
}

function protokoll(name: string, aktion: 'created' | 'updated' | 'removed' | 'restored', obj: Basis, text?: string, alt?: Basis) {
  if (name === 'ereignisse') return;
  const typ = `${name}.${aktion}`;
  const akteur = aktuellerAkteur();
  const f = aktion === 'updated' && alt && !OHNE_FELDER.has(name) ? feldAenderungen(alt, obj, name) : undefined;
  const felder = f && Object.keys(f).length ? f : undefined;
  const e: Ereignis = {
    id: neueId('e'),
    erstelltAm: jetzt(),
    geaendertAm: jetzt(),
    erstelltVon: aktuellerNutzer,
    typ,
    bezug: { typ: name as ObjektTyp, id: obj.id },
    text: verlaufText(aktion, { text, felder, akteur }),
    ...akteurFelder(akteur),
    aenderung: aktion,
  };
  if (felder) e.felder = felder;
  if (e.akteurId === undefined) delete e.akteurId;
  if (e.vonMitarbeiterId === undefined) delete e.vonMitarbeiterId;
  tabelle('ereignisse')[e.id] = e;
  lokalGeaendert('ereignisse', e.id);
  zuletztStill.delete(`${name}:${obj.id}`);
  eintragGemerkt(e.id);
}

/**
 * Stille Änderung (`{ leise: true }`, z. B. Tippen im Angebots-Editor) trotzdem protokollieren – aber
 * zusammengefasst: Folgeänderungen desselben Akteurs am selben Objekt ergänzen den letzten Eintrag.
 */
function stillProtokollieren(name: string, alt: Basis, neu: Basis) {
  if (name === 'ereignisse' || OHNE_FELDER.has(name)) return;
  const f = feldAenderungen(alt, neu, name);
  if (!Object.keys(f).length) return;
  const akteur = aktuellerAkteur();
  const af = akteurFelder(akteur);
  const wer = `${af.quelle}:${af.akteurId ?? ''}:${af.vonMitarbeiterId ?? ''}`;
  const schluessel = `${name}:${neu.id}`;
  const letzt = zuletztStill.get(schluessel);
  const vorhanden = letzt && letzt.akteur === wer && Date.now() - letzt.zeit < ZUSAMMENFASSEN_MS ? (tabelle('ereignisse')[letzt.id] as Ereignis | undefined) : undefined;
  if (vorhanden && !vorhanden.rueckgaengigAm && !vorhanden.geloeschtAm) {
    const felder: Record<string, FeldAenderung> = { ...vorhanden.felder };
    for (const [k, w] of Object.entries(f)) {
      const bisher = felder[k];
      const neuW: FeldAenderung = !bisher ? w : w.geschuetzt ? w : bisher.gekuerzt || w.gekuerzt ? { gekuerzt: true } : { vorher: bisher.vorher, nachher: w.nachher };
      if (!neuW.gekuerzt && !neuW.geschuetzt && json(neuW.vorher) === json(neuW.nachher)) delete felder[k];
      else felder[k] = neuW;
    }
    if (!Object.keys(felder).length) {
      delete tabelle('ereignisse')[vorhanden.id];
      lokalGeaendert('ereignisse', vorhanden.id);
      zuletztStill.delete(schluessel);
      return;
    }
    tabelle('ereignisse')[vorhanden.id] = { ...vorhanden, felder, geaendertAm: jetzt(), text: verlaufText('updated', { felder, akteur, still: true }) } as Ereignis;
    lokalGeaendert('ereignisse', vorhanden.id);
    zuletztStill.set(schluessel, { ...letzt!, zeit: Date.now() });
    eintragGemerkt(vorhanden.id);
    return;
  }
  const e: Ereignis = {
    id: neueId('e'),
    erstelltAm: jetzt(),
    geaendertAm: jetzt(),
    erstelltVon: aktuellerNutzer,
    typ: `${name}.updated`,
    bezug: { typ: name as ObjektTyp, id: neu.id },
    text: verlaufText('updated', { felder: f, akteur, still: true }),
    ...af,
    aenderung: 'updated',
    felder: f,
    zusammengefasst: true,
  };
  if (e.akteurId === undefined) delete e.akteurId;
  if (e.vonMitarbeiterId === undefined) delete e.vonMitarbeiterId;
  tabelle('ereignisse')[e.id] = e;
  lokalGeaendert('ereignisse', e.id);
  zuletztStill.set(schluessel, { id: e.id, zeit: Date.now(), akteur: wer });
  eintragGemerkt(e.id);
}

/**
 * Einträge nur auf diesem Gerät entfernen (Rotation von Verlauf und Ereignisprotokoll). Der Abgleich
 * erfährt davon nichts – auf dem Server bleibt die Historie vollständig.
 */
export function vergessen(sammlungName: string, ids: ID[]) {
  if (!ids.length) return;
  const t = daten[sammlungName];
  if (!t) return;
  for (const id of ids) {
    delete t[id];
    markieren(sammlungName, id);
  }
  geaendert();
}

/**
 * Legt eine Sammlung an. Jeder Name darf genau einmal definiert werden –
 * so kann kein Objekttyp doppelt existieren.
 */
export function defineCollection<T extends Basis>(name: string): Collection<T> {
  if (sammlungen.has(name)) {
    throw new Error(
      `Sammlung "${name}" existiert bereits. Jedes Objekt gibt es genau einmal – nutze die bestehende Sammlung.`,
    );
  }
  const c = collection<T>(name);
  sammlungen.set(name, c as unknown as Collection<Basis>);
  return c;
}

/** Zugriff auf eine beliebige Sammlung über ihren Namen (auch Modul-Sammlungen) */
export function sammlung<T extends Basis = Basis>(name: string): Collection<T> | undefined {
  return sammlungen.get(name) as Collection<T> | undefined;
}

/** Alle registrierten Sammlungen (Kern und Module) */
export function alleSammlungen(): Collection<Basis>[] {
  return [...sammlungen.values()];
}

function collection<T extends Basis>(name: string): Collection<T> {
  const c: Collection<T> = {
    name,
    all: () => Object.values(tabelle(name)).filter((x) => !x.geloeschtAm) as T[],
    allMitGeloeschten: () => Object.values(tabelle(name)) as T[],
    get: (id) => (id ? (tabelle(name)[id] as T | undefined) : undefined),
    where: (pred) => c.all().filter(pred),
    create(neu, opts) {
      schreibenPruefen(name);
      const zeit = jetzt();
      const obj = {
        ...neu,
        id: neu.id ?? neueId(),
        erstelltAm: zeit,
        geaendertAm: zeit,
        erstelltVon: aktuellerNutzer,
      } as unknown as T;
      tabelle(name)[obj.id] = obj;
      lokalGeaendert(name, obj.id);
      if (!opts?.leise) protokoll(name, 'created', obj);
      geaendert();
      if (!opts?.leise) emit({ typ: `${name}.created`, sammlung: name, objekt: obj });
      return obj;
    },
    update(id, patch, opts) {
      schreibenPruefen(name);
      const alt = tabelle(name)[id] as T | undefined;
      if (!alt) return undefined;
      const neu = { ...alt, ...patch, id, geaendertAm: jetzt() } as T;
      tabelle(name)[id] = neu;
      lokalGeaendert(name, id);
      if (!opts?.leise) protokoll(name, 'updated', neu, opts?.text, alt);
      else stillProtokollieren(name, alt, neu);
      geaendert();
      if (!opts?.leise) emit({ typ: `${name}.updated`, sammlung: name, objekt: neu, vorher: alt });
      return neu;
    },
    remove(id) {
      schreibenPruefen(name);
      const alt = tabelle(name)[id];
      if (!alt) return;
      const neu = { ...alt, geloeschtAm: jetzt() };
      tabelle(name)[id] = neu;
      lokalGeaendert(name, id);
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
      lokalGeaendert(name, id);
      protokoll(name, 'restored', neu);
      geaendert();
      emit({ typ: `${name}.restored`, sammlung: name, objekt: neu });
    },
    purge(id) {
      delete tabelle(name)[id];
      lokalGeaendert(name, id);
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
  return daten[b.typ]?.[b.id];
}

/** Zeitstrahl eines Objekts (neueste zuerst) */
export function zeitstrahl(b: Bezug): Ereignis[] {
  // bei gleicher Zeit (in einem Rutsch geändert) zählt die Reihenfolge des Eintragens: Neuestes zuerst
  return db.ereignisse
    .where((e) => e.bezug.typ === b.typ && e.bezug.id === b.id)
    .map((e, i) => [e, i] as const)
    .sort(([a, ia], [z, iz]) => z.erstelltAm.localeCompare(a.erstelltAm) || iz - ia)
    .map(([e]) => e);
}

/** Eigenen Eintrag in den Zeitstrahl schreiben (z. B. "Angebot versendet") */
export function vermerken(bezug: Bezug, typ: string, text: string, datenZusatz?: unknown) {
  const akteur = aktuellerAkteur();
  const af = akteurFelder(akteur);
  const e = db.ereignisse.create(
    {
      typ,
      bezug,
      text,
      vonMitarbeiterId: af.vonMitarbeiterId,
      daten: datenZusatz,
      ...(akteur ? { quelle: af.quelle, akteurId: af.akteurId } : {}),
    } as never,
    { leise: true },
  );
  eintragGemerkt(e.id);
  return e;
}

/** Alles zurücksetzen (Onboarding neu starten, Tests) */
export function zuruecksetzen() {
  daten = {};
  zuletztStill.clear();
  offen = new Map();
  allesOffen = true;
  syncBeobachter?.ersetzt?.();
  geaendert();
}

/** Rohdaten exportieren (Backup, Steuerberater-Export, Tests) */
export function exportieren(): Daten {
  return JSON.parse(JSON.stringify(daten));
}

export function importieren(d: Daten) {
  daten = d;
  zuletztStill.clear();
  offen = new Map();
  allesOffen = true;
  syncBeobachter?.ersetzt?.();
  geaendert();
}
