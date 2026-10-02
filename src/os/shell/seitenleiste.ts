/**
 * Deine Seitenleiste: der persönliche Teil unter den vier Hauptbereichen (nach Peak One).
 * Jeder stellt sich hier selbst zusammen, was er sehen will – Module, Smart Views, gemerkte Seiten und Ordner,
 * beliebig sortiert und in Ordner gesteckt. Die vier Hauptbereiche oben bleiben immer gleich.
 *
 * Gespeichert als Einstellung je Mitarbeiter (`navigation.seitenleiste.<id>`). Eine Oberflächen-Vorliebe,
 * kein Wissen über den Betrieb – deshalb keine eigene Collection. Hier nur reine Funktionen, ohne React testbar.
 */
import type { Rolle } from '@core/objects';

/**
 * ordner: hält andere Einträge · modul: ein Modul aus dem Verzeichnis unter „Betrieb“ ·
 * smart: Smart View, eine eigene Seite aus Bausteinen (`/ansicht/:id`) · seite: eine gemerkte Seite (interner Pfad)
 */
export type EintragArt = 'ordner' | 'modul' | 'smart' | 'seite';

export interface LeistenEintrag {
  id: string;
  art: EintragArt;
  /** leer bei Modulen: dann gilt der Name des Moduls */
  titel: string;
  modulId?: string;
  pfad?: string;
  offen?: boolean;
  kinder?: LeistenEintrag[];
}

export interface Leiste {
  version: 1;
  eintraege: LeistenEintrag[];
}

/** Genug für jeden Betrieb, aber keine Endlosliste */
export const LEISTE_MAX = 40;
/** Ordner in Ordnern – höchstens drei Ebenen, sonst findet man nichts mehr */
export const LEISTE_TIEFE = 3;
const TITEL_MAX = 40;
const ARTEN: readonly EintragArt[] = ['ordner', 'modul', 'smart', 'seite'];

/** Startauswahl je Rolle, solange jemand seine Leiste noch nicht selbst eingerichtet hat */
export const STANDARD_LEISTE: Record<Rolle, string[]> = {
  chef: ['angebote', 'rechnungen', 'auswertung'],
  buero: ['anfragen', 'angebote', 'rechnungen'],
  monteur: ['arbeitszeiten', 'abwesenheiten', 'werkzeuge'],
  azubi: ['arbeitszeiten', 'abwesenheiten', 'schulungen'],
};

export const LEER: Leiste = { version: 1, eintraege: [] };

const text = (wert: unknown, max = TITEL_MAX) => (typeof wert === 'string' ? wert.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const idOk = (wert: unknown): wert is string => typeof wert === 'string' && /^[a-z0-9-]{2,40}$/.test(wert);

export function neueId(): string {
  return `l-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/** Nur Pfade innerhalb von Macher OS: „/auftraege?x=1“, nie „//fremd.de“ oder „https://…“ */
export function sichererPfad(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const pfad = wert.trim().slice(0, 300);
  if (!pfad.startsWith('/') || pfad.startsWith('//') || pfad.includes('\\')) return null;
  return /^\/[^\s<>"']*$/.test(pfad) ? pfad : null;
}

export const modulEintrag = (modulId: string): LeistenEintrag => ({ id: neueId(), art: 'modul', titel: '', modulId });

export function standardLeiste(rolle: Rolle | undefined): Leiste {
  return { version: 1, eintraege: (rolle ? STANDARD_LEISTE[rolle] : []).map((id) => ({ ...modulEintrag(id), id: `std-${id}` })) };
}

/**
 * Bereinigt, was aus dem Speicher kommt: unbekannte Arten, kaputte Pfade, Module ohne Zugriff, Doppelte
 * und zu tiefe Verschachtelung fallen weg. `modulOk` prüft, ob das Modul für diesen Nutzer sichtbar ist.
 */
export function bereinigen(roh: unknown, modulOk: (id: string) => boolean = () => true): Leiste {
  let anzahl = 0;
  const gesehen = new Set<string>();
  const laufen = (liste: unknown, tiefe: number): LeistenEintrag[] => {
    if (!Array.isArray(liste)) return [];
    const out: LeistenEintrag[] = [];
    for (const roh of liste) {
      if (anzahl >= LEISTE_MAX) break;
      const v = (roh ?? {}) as Record<string, unknown>;
      const art = v.art as EintragArt;
      if (!ARTEN.includes(art) || !idOk(v.id) || gesehen.has(v.id)) continue;
      const e: LeistenEintrag = { id: v.id, art, titel: text(v.titel) };
      if (art === 'modul') {
        if (typeof v.modulId !== 'string' || !modulOk(v.modulId)) continue;
        e.modulId = v.modulId;
      } else if (art === 'seite') {
        const pfad = sichererPfad(v.pfad);
        if (!pfad) continue;
        e.pfad = pfad;
      }
      if (art === 'ordner') {
        e.offen = v.offen !== false;
        e.kinder = tiefe + 1 < LEISTE_TIEFE ? laufen(v.kinder, tiefe + 1) : [];
      }
      if (!e.titel && art !== 'modul') e.titel = art === 'ordner' ? 'Ordner' : art === 'smart' ? 'Smart View' : 'Seite';
      gesehen.add(e.id);
      anzahl += 1;
      out.push(e);
    }
    return out;
  };
  return { version: 1, eintraege: laufen((roh as { eintraege?: unknown } | null)?.eintraege, 0) };
}

export function zaehlen(liste: LeistenEintrag[]): number {
  return liste.reduce((n, e) => n + 1 + zaehlen(e.kinder ?? []), 0);
}

export function finden(liste: LeistenEintrag[], id: string): LeistenEintrag | null {
  for (const e of liste) {
    if (e.id === id) return e;
    const treffer = finden(e.kinder ?? [], id);
    if (treffer) return treffer;
  }
  return null;
}

/** Alle Einträge flach, in Lesereihenfolge */
export function flach(liste: LeistenEintrag[]): LeistenEintrag[] {
  return liste.flatMap((e) => [e, ...flach(e.kinder ?? [])]);
}

/** Ebene eines Eintrags (0 = oberste), -1 = nicht gefunden */
function tiefeVon(liste: LeistenEintrag[], id: string, tiefe = 0): number {
  for (const e of liste) {
    if (e.id === id) return tiefe;
    const t = tiefeVon(e.kinder ?? [], id, tiefe + 1);
    if (t >= 0) return t;
  }
  return -1;
}

/** Wie viele Ebenen ein Eintrag samt Inhalt belegt: ein einfacher Eintrag = 1 */
function hoehe(e: LeistenEintrag): number {
  return 1 + Math.max(0, ...(e.kinder ?? []).map(hoehe));
}

function abbilden(liste: LeistenEintrag[], f: (liste: LeistenEintrag[], eltern: string | null) => LeistenEintrag[], eltern: string | null = null): LeistenEintrag[] {
  return f(liste, eltern).map((e) => (e.kinder ? { ...e, kinder: abbilden(e.kinder, f, e.id) } : e));
}

/** Hängt einen Eintrag ans Ende eines Ordners (oder der obersten Ebene). Volle Leiste oder zu tief: keine Änderung. */
export function hinzufuegen(l: Leiste, e: LeistenEintrag, ordnerId: string | null = null): Leiste {
  if (zaehlen(l.eintraege) + zaehlen([e]) > LEISTE_MAX) return l;
  if (ordnerId === null) return { ...l, eintraege: [...l.eintraege, e] };
  const ordner = finden(l.eintraege, ordnerId);
  if (!ordner || ordner.art !== 'ordner' || tiefeVon(l.eintraege, ordnerId) + 1 + hoehe(e) > LEISTE_TIEFE) return l;
  return { ...l, eintraege: abbilden(l.eintraege, (liste) => liste.map((x) => (x.id === ordnerId ? { ...x, offen: true, kinder: [...(x.kinder ?? []), e] } : x))) };
}

export function aendern(l: Leiste, id: string, teil: Partial<Pick<LeistenEintrag, 'titel' | 'offen'>>): Leiste {
  const sauber: Partial<LeistenEintrag> = { ...teil };
  if (teil.titel !== undefined) sauber.titel = text(teil.titel);
  return { ...l, eintraege: abbilden(l.eintraege, (liste) => liste.map((e) => (e.id === id ? { ...e, ...sauber } : e))) };
}

export function entfernen(l: Leiste, id: string): Leiste {
  return { ...l, eintraege: abbilden(l.eintraege, (liste) => liste.filter((e) => e.id !== id)) };
}

/** Eine Stelle nach oben oder unten, innerhalb derselben Ebene */
export function schieben(l: Leiste, id: string, richtung: -1 | 1): Leiste {
  return {
    ...l,
    eintraege: abbilden(l.eintraege, (liste) => {
      const i = liste.findIndex((e) => e.id === id);
      const j = i + richtung;
      if (i < 0 || j < 0 || j >= liste.length) return liste;
      const neu = [...liste];
      [neu[i], neu[j]] = [neu[j], neu[i]];
      return neu;
    }),
  };
}

/** Kann der Eintrag in diese Richtung? (für deaktivierte Knöpfe) */
export function kannSchieben(l: Leiste, id: string, richtung: -1 | 1): boolean {
  const eltern = elternVon(l.eintraege, id);
  if (eltern === undefined) return false;
  const liste = eltern === null ? l.eintraege : (finden(l.eintraege, eltern)?.kinder ?? []);
  const i = liste.findIndex((e) => e.id === id);
  return i + richtung >= 0 && i + richtung < liste.length;
}

/** In einen Ordner verschieben (null = oberste Ebene). Nie in sich selbst, nie tiefer als erlaubt. */
export function verschieben(l: Leiste, id: string, ordnerId: string | null): Leiste {
  const e = finden(l.eintraege, id);
  if (!e || id === ordnerId) return l;
  if (ordnerId !== null && (finden(e.kinder ?? [], ordnerId) || finden(l.eintraege, ordnerId)?.art !== 'ordner')) return l;
  if (elternVon(l.eintraege, id) === ordnerId) return l;
  const ohne = entfernen(l, id);
  const neu = hinzufuegen(ohne, e, ordnerId);
  return neu === ohne ? l : neu;
}

/** Ordner, in die ein Eintrag verschoben werden kann – mit Pfad („Geld / Mahnwesen“) für das Menü */
export function ziele(l: Leiste, id: string): { id: string; pfad: string }[] {
  const e = finden(l.eintraege, id);
  if (!e) return [];
  const out: { id: string; pfad: string }[] = [];
  const laufen = (liste: LeistenEintrag[], spur: string[], tiefe: number) => {
    for (const x of liste) {
      if (x.id === id || x.art !== 'ordner') continue;
      const pfad = [...spur, x.titel];
      if (tiefe + 1 + hoehe(e) <= LEISTE_TIEFE && !(x.kinder ?? []).some((k) => k.id === id)) out.push({ id: x.id, pfad: pfad.join(' / ') });
      laufen(x.kinder ?? [], pfad, tiefe + 1);
    }
  };
  laufen(l.eintraege, [], 0);
  return out;
}

/** Ordner, in dem ein Eintrag liegt (null = oberste Ebene, undefined = nicht gefunden) */
export function elternVon(liste: LeistenEintrag[], id: string, eltern: string | null = null): string | null | undefined {
  for (const e of liste) {
    if (e.id === id) return eltern;
    const treffer = elternVon(e.kinder ?? [], id, e.id);
    if (treffer !== undefined) return treffer;
  }
  return undefined;
}

/** Liegt dieses Modul schon irgendwo in der Leiste? */
export const modulDrin = (l: Leiste, modulId: string) => flach(l.eintraege).some((e) => e.art === 'modul' && e.modulId === modulId);

/** Stern im Modulverzeichnis: Modul hinzufügen oder überall herausnehmen */
export function modulUmschalten(l: Leiste, modulId: string): Leiste {
  if (!modulDrin(l, modulId)) return hinzufuegen(l, modulEintrag(modulId));
  const ids = flach(l.eintraege).filter((e) => e.art === 'modul' && e.modulId === modulId).map((e) => e.id);
  return ids.reduce(entfernen, l);
}

export const voll = (l: Leiste) => zaehlen(l.eintraege) >= LEISTE_MAX;

/** Breite der Seitenleiste (ziehbar, je Mitarbeiter gespeichert) */
export const BREITE_STANDARD = 264;
export const BREITE_MIN = 200;
export const BREITE_MAX = 400;
/** Gespeicherte Breite auf den erlaubten Bereich begrenzen */
export const leisteBreite = (b: unknown) => (typeof b === 'number' && Number.isFinite(b) ? Math.round(Math.min(BREITE_MAX, Math.max(BREITE_MIN, b))) : BREITE_STANDARD);
