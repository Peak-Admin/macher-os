/**
 * Betriebsmittel (Werkzeuge, Maschinen, Fahrzeuge): Wo ist was, wer hat was.
 * Kernobjekt `db.betriebsmittel` – hier nur Logik, keine eigene Sammlung.
 */
import { db, vermerken } from '@core/db';
import { personName } from '@core/format';
import type { Ton } from '@core/modul';
import type { Betriebsmittel, BetriebsmittelArt, ID } from '@core/objects';

/**
 * Felder, die der Kern (noch) nicht kennt. Sie werden am selben Objekt gespeichert
 * (keine Kopie, keine zweite Sammlung). Kernwunsch: in `Betriebsmittel` aufnehmen.
 */
export type BetriebsmittelX = Betriebsmittel & {
  kilometerstand?: number;
  /** Prüfintervall in Monaten (überschreibt den Standard der Prüfart) */
  pruefIntervallMonate?: number;
  ausgegebenAm?: string;
};

export const bmx = (b: Betriebsmittel) => b as BetriebsmittelX;

export const ART_LABEL: Record<BetriebsmittelArt, string> = {
  werkzeug: 'Werkzeug',
  maschine: 'Maschine',
  fahrzeug: 'Fahrzeug',
};

export const ART_MODUL: Record<BetriebsmittelArt, string> = {
  werkzeug: '/betrieb/werkzeuge',
  maschine: '/betrieb/maschinen',
  fahrzeug: '/betrieb/fahrzeuge',
};

export const STATUS_LABEL: Record<Betriebsmittel['status'], { text: string; ton: Ton }> = {
  verfuegbar: { text: 'Verfügbar', ton: 'erfolg' },
  im_einsatz: { text: 'Ausgegeben', ton: 'aktiv' },
  defekt: { text: 'Defekt', ton: 'achtung' },
  in_pruefung: { text: 'In Prüfung', ton: 'neutral' },
  ausgemustert: { text: 'Ausgemustert', ton: 'neutral' },
};

/** Statustext je Art: ein Fahrzeug mit Fahrer ist „im Einsatz“, ein Werkzeug „ausgegeben“. */
export function statusVon(b: Betriebsmittel): { text: string; ton: Ton } {
  if (b.art === 'fahrzeug' && b.status === 'im_einsatz') return { text: 'Im Einsatz', ton: 'aktiv' };
  return STATUS_LABEL[b.status];
}

export function fahrzeuge(): Betriebsmittel[] {
  return db.betriebsmittel.where((b) => b.art === 'fahrzeug' && b.status !== 'ausgemustert');
}

export function fahrzeugText(f: Betriebsmittel | undefined): string {
  if (!f) return '–';
  return f.kennzeichen ? `${f.name} (${f.kennzeichen})` : f.name;
}

/** Standort-Text → Fahrzeug (ID, Kennzeichen oder Name). */
export function fahrzeugVon(standort: string | undefined, liste = fahrzeuge()): Betriebsmittel | undefined {
  if (!standort) return undefined;
  const s = standort.trim().toLowerCase();
  return liste.find((f) => f.id === standort || f.kennzeichen?.toLowerCase() === s || f.name.toLowerCase() === s);
}

/** Was im Standortfeld gespeichert wird, wenn ein Gerät in ein Fahrzeug kommt. */
export function fahrzeugStandort(f: Betriebsmittel): string {
  return f.kennzeichen || f.name;
}

export interface Ort {
  text: string;
  ton: Ton;
  mitarbeiterId?: ID;
  fahrzeugId?: ID;
}

/** „Wer hat den Bohrhammer?“ – die Antwort in einem Satz. */
export function woIst(b: Betriebsmittel): Ort {
  if (b.art === 'fahrzeug') {
    if (b.mitarbeiterId) return { text: `Fahrer: ${personName(db.mitarbeiter.get(b.mitarbeiterId))}`, ton: 'aktiv', mitarbeiterId: b.mitarbeiterId };
    return { text: b.standort ? `Steht: ${b.standort}` : 'Kein fester Fahrer', ton: 'neutral' };
  }
  if (b.mitarbeiterId) {
    return { text: `Bei ${personName(db.mitarbeiter.get(b.mitarbeiterId))}`, ton: 'aktiv', mitarbeiterId: b.mitarbeiterId };
  }
  const f = fahrzeugVon(b.standort);
  if (f) return { text: `Im Fahrzeug ${fahrzeugText(f)}`, ton: 'neutral', fahrzeugId: f.id };
  if (b.standort) return { text: `Standort: ${b.standort}`, ton: 'neutral' };
  return { text: 'Standort unbekannt', ton: 'achtung' };
}

export type Ziel = { typ: 'mitarbeiter'; id: ID } | { typ: 'fahrzeug'; id: ID } | { typ: 'ort'; text: string };

export function zielText(z: Ziel): string {
  if (z.typ === 'mitarbeiter') return personName(db.mitarbeiter.get(z.id));
  if (z.typ === 'fahrzeug') return fahrzeugText(db.betriebsmittel.get(z.id));
  return z.text;
}

/** Ausgabe mit einem Tap. Gibt eine Fehlermeldung zurück, falls nicht möglich. */
export function ausgeben(id: ID, ziel: Ziel): string | undefined {
  const b = db.betriebsmittel.get(id);
  if (!b) return 'Gerät nicht gefunden.';
  if (b.status === 'ausgemustert') return 'Das Gerät ist ausgemustert.';
  const jetzt = new Date().toISOString();
  if (b.art === 'fahrzeug') {
    // Bei Fahrzeugen heißt „ausgeben“: Fahrer festlegen
    if (ziel.typ !== 'mitarbeiter') return 'Ein Fahrzeug bekommt einen Fahrer.';
    db.betriebsmittel.update(id, { mitarbeiterId: ziel.id, status: b.status === 'defekt' ? 'defekt' : 'im_einsatz', ausgegebenAm: jetzt } as Partial<BetriebsmittelX>, {
      text: `Fahrer: ${zielText(ziel)}`,
    });
    return;
  }
  const patch: Partial<BetriebsmittelX> =
    ziel.typ === 'mitarbeiter'
      ? { mitarbeiterId: ziel.id, standort: undefined, status: keepStatus(b, 'im_einsatz'), ausgegebenAm: jetzt }
      : ziel.typ === 'fahrzeug'
        ? { mitarbeiterId: undefined, standort: fahrzeugStandort(db.betriebsmittel.get(ziel.id)!), status: keepStatus(b, 'verfuegbar'), ausgegebenAm: jetzt }
        : { mitarbeiterId: undefined, standort: ziel.text, status: keepStatus(b, 'verfuegbar'), ausgegebenAm: undefined };
  db.betriebsmittel.update(id, patch, { text: `Ausgegeben an ${zielText(ziel)}` });
}

/** Defekt/in Prüfung bleibt erhalten – Ausgabe ändert nur den Ort. */
function keepStatus(b: Betriebsmittel, neu: Betriebsmittel['status']): Betriebsmittel['status'] {
  return b.status === 'defekt' || b.status === 'in_pruefung' ? b.status : neu;
}

export const STANDARD_LAGER = 'Lager';

export function zurueckgeben(id: ID) {
  const b = db.betriebsmittel.get(id);
  if (!b) return;
  if (b.art === 'fahrzeug') {
    db.betriebsmittel.update(id, { mitarbeiterId: undefined, status: keepStatus(b, 'verfuegbar') }, { text: 'Fahrer entfernt' });
    return;
  }
  db.betriebsmittel.update(id, { mitarbeiterId: undefined, standort: STANDARD_LAGER, status: keepStatus(b, 'verfuegbar'), ausgegebenAm: undefined } as Partial<BetriebsmittelX>, {
    text: 'Zurück ins Lager',
  });
}

export function defektMelden(id: ID, text: string) {
  const b = db.betriebsmittel.get(id);
  if (!b) return;
  const notiz = [b.notiz, `Defekt (${new Date().toLocaleDateString('de-DE')}): ${text.trim() || 'ohne Beschreibung'}`].filter(Boolean).join('\n');
  db.betriebsmittel.update(id, { status: 'defekt', notiz }, { text: `Defekt gemeldet: ${text.trim() || 'ohne Beschreibung'}` });
}

export function wiederEinsatzbereit(id: ID) {
  const b = db.betriebsmittel.get(id);
  if (!b) return;
  db.betriebsmittel.update(id, { status: b.mitarbeiterId ? 'im_einsatz' : 'verfuegbar' }, { text: 'Wieder einsatzbereit' });
  vermerken({ typ: 'betriebsmittel', id }, 'betriebsmittel.repariert', 'Repariert und wieder einsatzbereit');
}

/** Was liegt in diesem Fahrzeug? */
export function ausstattung(fahrzeugId: ID): Betriebsmittel[] {
  const f = db.betriebsmittel.get(fahrzeugId);
  if (!f) return [];
  const liste = fahrzeuge();
  return db.betriebsmittel.where((b) => b.art !== 'fahrzeug' && b.status !== 'ausgemustert' && !b.mitarbeiterId && fahrzeugVon(b.standort, liste)?.id === f.id);
}

/** Geräte, die ein Mitarbeiter gerade hat */
export function beiMitarbeiter(mitarbeiterId: ID): Betriebsmittel[] {
  return db.betriebsmittel.where((b) => b.art !== 'fahrzeug' && b.mitarbeiterId === mitarbeiterId && b.status !== 'ausgemustert');
}

/** Statuszeile für die Kachel in „Betrieb“ */
export function kurzinfoFuer(art: BetriebsmittelArt): { text: string; ton: Ton } | undefined {
  const liste = db.betriebsmittel.where((b) => b.art === art && b.status !== 'ausgemustert');
  if (!liste.length) return undefined;
  const defekt = liste.filter((b) => b.status === 'defekt').length;
  if (defekt) return { text: `${defekt} defekt`, ton: 'achtung' as const };
  if (art === 'fahrzeug') return { text: `${liste.length} Fahrzeug${liste.length === 1 ? '' : 'e'}`, ton: 'neutral' as const };
  const weg = liste.filter((b) => b.mitarbeiterId).length;
  return { text: weg ? `${weg} von ${liste.length} ausgegeben` : `${liste.length} im Bestand`, ton: 'neutral' as const };
}

