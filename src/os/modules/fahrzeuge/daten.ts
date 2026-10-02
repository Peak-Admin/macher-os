/**
 * Fahrzeug-Lage: Wer hat es, ist es frei, wann wieder?
 * Alles abgeleitet aus Kernobjekten (Betriebsmittel, Termine, Abwesenheiten) – nichts doppelt gespeichert.
 */
import { db } from '@core/db';
import { datumKurz, datumVon, heute, isoDatum, uhrzeit } from '@core/format';
import type { Betriebsmittel, ID, Termin } from '@core/objects';
import { faelligkeit } from '../pruefungen/daten';
import { bmx } from '../werkzeuge/daten';

/** Ampel: grün = frei, gelb = gerade unterwegs, rot = nicht fahren */
export type Ampel = 'frei' | 'belegt' | 'gesperrt';

export interface FahrzeugLage {
  ampel: Ampel;
  /** Statuswort, z. B. „Verfügbar“ */
  text: string;
  /** Wann wieder frei / was als Nächstes kommt */
  info?: string;
}

export const AMPEL_LABEL: Record<Ampel, string> = { frei: 'Grün', belegt: 'Gelb', gesperrt: 'Rot' };

/** Zwei Einsätze mit höchstens so viel Pause dazwischen gelten als ein Block */
const PAUSE_MIN = 30;

/** Heutige Termine, in denen das Fahrzeug steckt – ausdrücklich eingeplant oder über seinen Fahrer */
export function termineHeute(f: Betriebsmittel, jetzt: Date): Termin[] {
  const tag = isoDatum(jetzt);
  return db.termine
    .where(
      (t) =>
        t.status !== 'abgesagt' &&
        t.status !== 'erledigt' &&
        !t.ganztags &&
        datumVon(t.start) === tag &&
        ((t.betriebsmittelIds ?? []).includes(f.id) || (!!f.mitarbeiterId && t.mitarbeiterIds.includes(f.mitarbeiterId))),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Ende des Einsatzblocks, der gerade läuft (Folgetermine mit kurzer Pause zählen mit) */
function blockEnde(termine: Termin[], laufend: Termin): string {
  let ende = laufend.ende;
  for (const t of termine) {
    if (t.start <= laufend.start) continue;
    if (new Date(t.start).getTime() - new Date(ende).getTime() > PAUSE_MIN * 60_000) break;
    if (t.ende > ende) ende = t.ende;
  }
  return ende;
}

function fahrerAbwesend(mitarbeiterId: ID | undefined, tag: string) {
  if (!mitarbeiterId) return undefined;
  return db.abwesenheiten.where((a) => a.mitarbeiterId === mitarbeiterId && a.status === 'genehmigt' && a.von <= tag && a.bis >= tag)[0];
}

export function lageVon(f: Betriebsmittel, jetzt: Date = new Date()): FahrzeugLage {
  const wieder = bmx(f).wiederVerfuegbarAb;
  const wiederText = wieder && wieder >= heute() ? `Wieder da ab ${datumKurz(wieder)}` : 'Wann wieder da: noch offen';
  if (f.status === 'defekt') return { ampel: 'gesperrt', text: 'Defekt', info: wiederText };
  if (f.status === 'in_pruefung') return { ampel: 'gesperrt', text: 'In der Werkstatt', info: wiederText };
  if (faelligkeit(f, isoDatum(jetzt)).stufe === 'ueberfaellig') return { ampel: 'gesperrt', text: `${f.pruefungArt ?? 'Prüfung'} überfällig`, info: 'Erst nach der Prüfung fahren' };

  const termine = termineHeute(f, jetzt);
  const iso = jetzt.toISOString();
  const laufend = termine.find((t) => new Date(t.start) <= jetzt && new Date(t.ende) > jetzt);
  if (laufend) return { ampel: 'belegt', text: 'Im Einsatz', info: `Frei ab ${uhrzeit(blockEnde(termine, laufend))} Uhr` };

  const abwesend = fahrerAbwesend(f.mitarbeiterId, isoDatum(jetzt));
  if (abwesend) {
    const name = db.mitarbeiter.get(abwesend.mitarbeiterId)?.vorname ?? 'Der Fahrer';
    return { ampel: 'frei', text: 'Verfügbar', info: `${name} ist bis ${datumKurz(abwesend.bis)} nicht da` };
  }
  const naechster = termine.find((t) => new Date(t.start).toISOString() > iso);
  if (naechster) return { ampel: 'frei', text: 'Verfügbar', info: `Bis ${uhrzeit(naechster.start)} Uhr, dann im Einsatz` };
  return { ampel: 'frei', text: 'Verfügbar' };
}

/** Reihenfolge der Karten: erst was nicht fahren darf, dann unterwegs, dann frei */
export const AMPEL_RANG: Record<Ampel, number> = { gesperrt: 0, belegt: 1, frei: 2 };
