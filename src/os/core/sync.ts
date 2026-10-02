/**
 * Abgleich local-first: IndexedDB bleibt der schnelle Cache, die Tabelle `objekte` (Supabase) ist die Quelle.
 *
 * - Eigene Änderungen (die Datenschicht meldet sie je Tab) kommen in eine Warteschlange und werden hochgeladen,
 *   sobald eine Verbindung besteht. Die Warteschlange überlebt Neuladen und Offline-Zeiten.
 * - Fremde Änderungen kommen per Realtime (sofort) und per Nachladen „alles seit Stand X“ (nach Offline-Zeiten).
 * - Konflikt (dasselbe Objekt hier und woanders geändert): Felder, die nur eine Seite geändert hat, werden
 *   zusammengeführt; bei demselben Feld gewinnt die letzte Änderung. Der Zeitstrahl des Objekts zeigt beide Werte.
 * - Beispieldaten (`beispiel: true`) bleiben auf dem Gerät. Zurücksetzen/Import wird nicht hochgeladen.
 *
 * Ohne Konto wird `starteSync` nie aufgerufen – dann bleibt alles wie bisher lokal.
 */
import { useSyncExternalStore } from 'react';
import { exportieren, fremdeAenderungen, rohObjekt, setzeSyncBeobachter, vermerken } from './db';
import { emit } from './events';
import type { Basis, Ereignis, ID } from './objects';

/** Eine Zeile der Tabelle `objekte` (ohne betrieb_id – die kennt der Adapter) */
export interface ObjektZeile {
  sammlung: string;
  id: ID;
  /** null = endgültig entfernt */
  daten: Basis | null;
  /** Serverzeit der letzten Speicherung */
  geaendert_am?: string;
  geloescht_am?: string | null;
}

/** Verbindung zum Server – im Browser über Supabase, in Tests als Attrappe */
export interface SyncAdapter {
  hochladen(zeilen: ObjektZeile[]): Promise<void>;
  /** alle Zeilen mit `geaendert_am` nach `seit` (oder alle), aufsteigend sortiert */
  laden(seit: string | undefined): Promise<ObjektZeile[]>;
  /** Realtime: ruft `zeile` bei jeder fremden Änderung; `verbunden` meldet den Kanalstatus */
  abonnieren(zeile: (z: ObjektZeile) => void, verbunden?: (ja: boolean) => void): () => void;
}

export interface SyncStatus {
  zustand: 'aus' | 'verbindet' | 'bereit' | 'sendet' | 'offline' | 'fehler';
  /** Änderungen, die noch nicht auf dem Server sind */
  wartend: number;
  /** letzter erfolgreicher Abgleich (ISO) */
  zuletzt?: string;
  fehler?: string;
  /** Übernahme bestehender Daten: hochgeladen / gesamt */
  uebernahme?: { fertig: number; gesamt: number };
}

/** Fachliche Ereignisse, die der Server schreibt und die auf allen Geräten als Event ankommen sollen */
const FACH_EREIGNISSE = new Set(['portal.geoeffnet', 'dokument.geoeffnet', 'team.beigetreten']);
/** Sammlungen ohne Konfliktvermerk im Zeitstrahl */
const OHNE_VERMERK = new Set(['ereignisse', 'einstellungen', 'benachrichtigungen']);
/** höchstens so viele Bytes je Upload (Supabase-Anfrage) */
const MAX_BYTES = 1_500_000;
const MAX_ZEILEN = 500;

const schluessel = (sammlung: string, id: ID) => `${sammlung}/${id}`;
/** Zeilen `<sammlung>#geschuetzt` tragen Felder, die nur Chef und Büro lesen (siehe Migration „Rechte“) */
const GESCHUETZT = '#geschuetzt';
function ohneVerwaltung(d: Basis): Record<string, unknown> {
  const r = { ...d } as unknown as Record<string, unknown>;
  delete r.id;
  delete r.geaendertAm;
  return r;
}
const teile = (k: string) => {
  const i = k.indexOf('/');
  return { sammlung: k.slice(0, i), id: k.slice(i + 1) };
};

// ------------------------------------------------------------------ Zusammenführen

export interface FeldKonflikt {
  feld: string;
  hier: unknown;
  dort: unknown;
  gewonnen: 'hier' | 'dort';
}

function gleich(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

const VERWALTUNG = new Set(['geaendertAm']);

/**
 * Drei-Wege-Zusammenführung je Feld. `basis` = letzte bekannte Serverfassung (falls bekannt).
 * Ohne Basis gilt das ganze Objekt der neueren Seite; abweichende Felder werden als Konflikt gemeldet.
 */
export function zusammenfuehren(
  basis: Basis | undefined,
  hier: Basis | undefined,
  dort: Basis | null,
): { objekt: Basis | null; konflikte: FeldKonflikt[] } {
  // Kein Datenverlust: was eine Seite noch hat, bleibt erhalten
  if (!dort) return { objekt: hier ?? null, konflikte: [] };
  if (!hier) return { objekt: dort, konflikte: [] };
  const hierNeuer = (hier.geaendertAm ?? '') > (dort.geaendertAm ?? '');
  const felder = new Set([...Object.keys(hier), ...Object.keys(dort), ...Object.keys(basis ?? {})]);
  const ergebnis: Record<string, unknown> = {};
  const konflikte: FeldKonflikt[] = [];
  const h = hier as unknown as Record<string, unknown>;
  const d = dort as unknown as Record<string, unknown>;
  const b = basis as unknown as Record<string, unknown> | undefined;
  for (const f of felder) {
    if (VERWALTUNG.has(f)) continue;
    const hv = h[f];
    const dv = d[f];
    let wert: unknown;
    if (gleich(hv, dv)) wert = hv;
    else if (b) {
      const hGeaendert = !gleich(hv, b[f]);
      const dGeaendert = !gleich(dv, b[f]);
      if (hGeaendert && dGeaendert) {
        wert = hierNeuer ? hv : dv;
        konflikte.push({ feld: f, hier: hv, dort: dv, gewonnen: hierNeuer ? 'hier' : 'dort' });
      } else wert = hGeaendert ? hv : dv;
    } else {
      wert = hierNeuer ? hv : dv;
      konflikte.push({ feld: f, hier: hv, dort: dv, gewonnen: hierNeuer ? 'hier' : 'dort' });
    }
    if (wert !== undefined) ergebnis[f] = wert;
  }
  // Neue Fassung, wenn sie keiner Seite entspricht – sonst würden andere Geräte sie für bekannt halten
  // (und der Server nimmt nur Fassungen an, die nicht älter sind als seine)
  ergebnis.geaendertAm = dort.geaendertAm;
  if (!gleichesObjekt(ergebnis, d)) {
    const neuester = Date.parse(hierNeuer ? hier.geaendertAm : dort.geaendertAm) || 0;
    ergebnis.geaendertAm = new Date(Math.max(Date.now(), neuester + 1)).toISOString();
  }
  return { objekt: ergebnis as unknown as Basis, konflikte };
}

/** Gleiche Felder und Werte, unabhängig von der Reihenfolge der Schlüssel */
export function gleichesObjekt(a: object, b: object): boolean {
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const felder = new Set([...Object.keys(x), ...Object.keys(y)]);
  for (const f of felder) if (!gleich(x[f], y[f])) return false;
  return true;
}

function konfliktText(k: FeldKonflikt[]): string {
  const felder = k.map((x) => x.feld).join(', ');
  return `Auf zwei Geräten gleichzeitig geändert (${felder}). Die neuere Änderung gilt, die andere steht hier im Verlauf.`;
}

// ------------------------------------------------------------------ Zustand

let status: SyncStatus = { zustand: 'aus', wartend: 0 };
const statusHoerer = new Set<() => void>();
function setzeStatus(s: Partial<SyncStatus>) {
  status = { ...status, ...s };
  statusHoerer.forEach((l) => l());
}

export function syncStatus(): SyncStatus {
  return status;
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => (statusHoerer.add(l), () => statusHoerer.delete(l)),
    () => status,
    () => status,
  );
}

export interface SyncSteuerung {
  /** Nachladen und Hochladen jetzt anstoßen; erfüllt sich, wenn der Durchgang fertig ist */
  abgleichen(): Promise<void>;
  /** Übernahme: alle vorhandenen Objekte (ohne Beispieldaten) einmalig hochladen. Liefert die Anzahl. */
  allesHochladen(): Promise<number>;
  stoppen(): void;
}

export interface SyncOptionen {
  /** Betrieb – trennt Warteschlange und Stand je Mandant */
  betriebId: string;
  speicher?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  /** Wartezeit vor dem Hochladen (bündelt Tippen) */
  verzoegerung?: number;
  /** Ist das Gerät online? (Standard: navigator.onLine) */
  online?: () => boolean;
}

let aktiv: SyncSteuerung | undefined;

export function laufenderSync(): SyncSteuerung | undefined {
  return aktiv;
}

export function starteSync(adapter: SyncAdapter, opt: SyncOptionen): SyncSteuerung {
  aktiv?.stoppen();
  const speicher = opt.speicher ?? globalThis.localStorage;
  const K_WARTESCHLANGE = `macher-os:sync:${opt.betriebId}:warteschlange`;
  const K_STAND = `macher-os:sync:${opt.betriebId}:stand`;
  const K_GESCHUETZT = `macher-os:sync:${opt.betriebId}:geschuetzt`;
  const verzoegerung = opt.verzoegerung ?? 800;
  const online = opt.online ?? (() => globalThis.navigator?.onLine ?? true);

  const lesen = (k: string) => {
    try {
      return speicher?.getItem(k) ?? undefined;
    } catch {
      return undefined;
    }
  };
  const schreiben = (k: string, v: string) => {
    try {
      speicher?.setItem(k, v);
    } catch {
      /* Warteschlange bleibt im Arbeitsspeicher */
    }
  };

  const warteschlange = new Set<string>(JSON.parse(lesen(K_WARTESCHLANGE) ?? '[]') as string[]);
  /** letzte bekannte Serverfassung je Objekt (nur Verweise, keine Kopien) */
  const bekannt = new Map<string, Basis | null>();
  /** gerade hochgeladene Fassungen – ihr Echo per Realtime ist kein Konflikt */
  const unterwegs = new Map<string, Basis | null>();
  let stand = lesen(K_STAND);
  /** geschützte Felder je Objekt (nur bei Chef/Büro gefüllt) – überlebt Neuladen */
  const geschuetzt = new Map<string, Record<string, unknown>>(
    (() => {
      try {
        return JSON.parse(lesen(K_GESCHUETZT) ?? '[]') as [string, Record<string, unknown>][];
      } catch {
        return [];
      }
    })(),
  );
  let gestoppt = false;
  let laeuft: Promise<void> | undefined;
  let nochmal = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let versuch = 0;

  const merken = () => {
    schreiben(K_WARTESCHLANGE, JSON.stringify([...warteschlange]));
    setzeStatus({ wartend: warteschlange.size });
  };

  const planen = (ms = verzoegerung) => {
    if (gestoppt) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void durchgang();
    }, ms);
  };

  // ---------------------------------------------------------------- Empfang

  function empfangen(zeilen: ObjektZeile[]) {
    /** in diesem Durchgang neu eingespielte Fassungen (Schlüssel → Objekt) */
    const einspielen = new Map<string, { sammlung: string; id: ID; objekt: Basis | null }>();
    const aktuell = (sammlung: string, id: ID) => {
      const e = einspielen.get(schluessel(sammlung, id));
      return e ? (e.objekt ?? undefined) : rohObjekt(sammlung, id);
    };
    const vermerke: { sammlung: string; id: ID; konflikte: FeldKonflikt[] }[] = [];
    const ereignisse: Ereignis[] = [];
    let neuerStand = stand;
    let geschuetztGeaendert = false;
    for (const z of zeilen) {
      if (z.geaendert_am && (!neuerStand || z.geaendert_am > neuerStand)) neuerStand = z.geaendert_am;
      if (z.sammlung.endsWith(GESCHUETZT)) {
        // geschützte Felder (nur Chef/Büro) in das eigentliche Objekt einfügen
        const sammlung = z.sammlung.slice(0, -GESCHUETZT.length);
        const k = schluessel(sammlung, z.id);
        const felder = z.daten ? ohneVerwaltung(z.daten) : undefined;
        if (felder) geschuetzt.set(k, felder);
        else geschuetzt.delete(k);
        geschuetztGeaendert = true;
        const lokal = aktuell(sammlung, z.id);
        if (lokal && felder && !gleichesObjekt({ ...lokal, ...felder }, lokal)) einspielen.set(k, { sammlung, id: z.id, objekt: { ...lokal, ...felder } as Basis });
        continue;
      }
      const k = schluessel(z.sammlung, z.id);
      const lokal = aktuell(z.sammlung, z.id);
      const fern = z.daten ? ({ ...z.daten, ...geschuetzt.get(k) } as Basis) : null;
      const echo = unterwegs.get(k);
      if (unterwegs.has(k) && (echo?.geaendertAm ?? null) === (fern?.geaendertAm ?? null)) {
        bekannt.set(k, fern);
        continue;
      }
      if (lokal && fern && lokal.geaendertAm === fern.geaendertAm) {
        bekannt.set(k, fern);
        continue;
      }
      if (!lokal && !fern) continue;
      if (warteschlange.has(k)) {
        const { objekt, konflikte } = zusammenfuehren(bekannt.get(k) ?? undefined, lokal, fern);
        bekannt.set(k, fern);
        if (objekt !== lokal) einspielen.set(k, { sammlung: z.sammlung, id: z.id, objekt });
        if (objekt && fern && gleichesObjekt(objekt, fern)) warteschlange.delete(k);
        if (konflikte.length && !OHNE_VERMERK.has(z.sammlung)) vermerke.push({ sammlung: z.sammlung, id: z.id, konflikte });
      } else {
        bekannt.set(k, fern);
        einspielen.set(k, { sammlung: z.sammlung, id: z.id, objekt: fern });
        if (!lokal && fern && z.sammlung === 'ereignisse' && FACH_EREIGNISSE.has((fern as Ereignis).typ)) ereignisse.push(fern as Ereignis);
      }
    }
    fremdeAenderungen([...einspielen.values()]);
    if (geschuetztGeaendert) schreiben(K_GESCHUETZT, JSON.stringify([...geschuetzt]));
    for (const v of vermerke) {
      try {
        vermerken({ typ: v.sammlung, id: v.id }, 'sync.konflikt', konfliktText(v.konflikte), { konflikte: v.konflikte });
      } catch {
        /* z. B. Lesemodus – der Konflikt ist trotzdem aufgelöst */
      }
    }
    for (const e of ereignisse) emit({ typ: e.typ, daten: e.daten, objekt: e });
    if (neuerStand && neuerStand !== stand) {
      stand = neuerStand;
      schreiben(K_STAND, stand);
    }
    merken();
  }

  // ---------------------------------------------------------------- Hochladen

  function zeileFuer(k: string): ObjektZeile | undefined {
    const { sammlung, id } = teile(k);
    const obj = rohObjekt(sammlung, id);
    if (obj?.beispiel) return undefined;
    // Zeitstrahl-Einträge zu Beispieldaten bleiben ebenfalls auf dem Gerät
    const bezug = sammlung === 'ereignisse' ? (obj as Ereignis | undefined)?.bezug : undefined;
    if (bezug && rohObjekt(bezug.typ, bezug.id)?.beispiel) return undefined;
    return {
      sammlung,
      id,
      daten: obj ?? null,
      geloescht_am: obj ? (obj.geloeschtAm ?? null) : new Date().toISOString(),
    };
  }

  async function hochladen() {
    while (warteschlange.size && !gestoppt) {
      const paket: { k: string; zeile: ObjektZeile }[] = [];
      let bytes = 0;
      for (const k of warteschlange) {
        const zeile = zeileFuer(k);
        if (!zeile) {
          warteschlange.delete(k);
          continue;
        }
        const groesse = JSON.stringify(zeile.daten ?? null).length;
        if (paket.length && (bytes + groesse > MAX_BYTES || paket.length >= MAX_ZEILEN)) break;
        paket.push({ k, zeile });
        bytes += groesse;
      }
      if (!paket.length) break;
      setzeStatus({ zustand: 'sendet' });
      for (const { k, zeile } of paket) unterwegs.set(k, zeile.daten);
      try {
        await adapter.hochladen(paket.map((p) => p.zeile));
      } finally {
        for (const { k } of paket) unterwegs.delete(k);
      }
      for (const { k, zeile } of paket) {
        bekannt.set(k, zeile.daten);
        const { sammlung, id } = teile(k);
        // Während des Hochladens erneut geändert? Dann bleibt es in der Warteschlange.
        if ((rohObjekt(sammlung, id) ?? null) === zeile.daten) warteschlange.delete(k);
      }
      merken();
      const u = status.uebernahme;
      if (u) setzeStatus({ uebernahme: { ...u, fertig: Math.min(u.gesamt, u.fertig + paket.length) } });
    }
  }

  // ---------------------------------------------------------------- Durchgang: erst laden, dann hochladen

  async function durchgang(): Promise<void> {
    if (laeuft) {
      nochmal = true;
      return laeuft;
    }
    laeuft = (async () => {
      do {
        nochmal = false;
        if (gestoppt) return;
        if (!online()) {
          setzeStatus({ zustand: 'offline' });
          return;
        }
        try {
          empfangen(await adapter.laden(stand));
          await hochladen();
          versuch = 0;
          setzeStatus({ zustand: 'bereit', zuletzt: new Date().toISOString(), fehler: undefined });
        } catch (e) {
          versuch++;
          const text = e instanceof Error ? e.message : String(e);
          const berechtigung = (e as { berechtigung?: boolean }).berechtigung;
          setzeStatus({
            zustand: online() ? 'fehler' : 'offline',
            fehler: berechtigung ? 'Keine Berechtigung für diesen Betrieb. Bist du noch Mitglied? Melde dich neu an.' : text,
          });
          // erneut versuchen: 2 s, 4 s, 8 s … höchstens 60 s
          planen(Math.min(60_000, 1000 * 2 ** versuch));
          return;
        }
      } while (nochmal && !gestoppt);
    })().finally(() => {
      laeuft = undefined;
    });
    return laeuft;
  }

  // ---------------------------------------------------------------- Anschluss

  setzeSyncBeobachter({
    geaendert(sammlung, id) {
      warteschlange.add(schluessel(sammlung, id));
      merken();
      planen();
    },
    ersetzt() {
      // Zurücksetzen/Import/Spielwiese: nichts davon automatisch hochladen
      warteschlange.clear();
      merken();
    },
  });

  const abmelden = adapter.abonnieren(
    (z) => empfangen([z]),
    (ja) => {
      if (ja) planen(0);
    },
  );
  const wiederOnline = () => planen(0);
  globalThis.addEventListener?.('online', wiederOnline);
  // Sicherheitsnetz: Realtime kann Nachrichten verlieren (Funkloch, große Objekte) → jede Minute nachladen
  const regelmaessig = setInterval(() => {
    if (globalThis.document?.visibilityState !== 'hidden' || warteschlange.size) void durchgang();
  }, 60_000);

  setzeStatus({ zustand: 'verbindet', wartend: warteschlange.size, fehler: undefined, uebernahme: undefined });

  const steuerung: SyncSteuerung = {
    abgleichen: () => durchgang(),
    async allesHochladen() {
      const alles = exportieren();
      let n = 0;
      for (const [sammlung, tabelle] of Object.entries(alles)) {
        for (const [id, obj] of Object.entries(tabelle)) {
          if (obj.beispiel) continue;
          warteschlange.add(schluessel(sammlung, id));
          n++;
        }
      }
      setzeStatus({ uebernahme: { fertig: 0, gesamt: n } });
      merken();
      await durchgang();
      if (warteschlange.size) throw new Error(status.fehler ?? 'Noch nicht alles hochgeladen – es geht automatisch weiter.');
      setzeStatus({ uebernahme: undefined });
      return n;
    },
    stoppen() {
      gestoppt = true;
      if (timer) clearTimeout(timer);
      clearInterval(regelmaessig);
      globalThis.removeEventListener?.('online', wiederOnline);
      abmelden();
      setzeSyncBeobachter(undefined);
      if (aktiv === steuerung) aktiv = undefined;
      setzeStatus({ zustand: 'aus', uebernahme: undefined });
    },
  };
  aktiv = steuerung;
  void durchgang();
  return steuerung;
}
