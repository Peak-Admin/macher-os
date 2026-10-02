/**
 * Reine Regeln der Auftragsliste: Filter (Ansicht, Phase, Mitarbeiter, Zeitraum, Suche) und Sortierung.
 * Ohne UI und Speicher – die Seite gibt Daten über `ListenKontext` hinein. Filter stehen in der URL.
 */
import { passt, plusTage, wochenStart } from '@core/format';
import type { Auftrag, Datum, ID, Kunde, Phase, Termin } from '@core/objects';
import { AKTIVE_PHASEN, istOffen } from './logik';

export type Sicht = 'aktiv' | 'meine' | 'abgeschlossen';
export type Zeitraum = 'woche' | 'monat' | 'frei';
export type Sortierung = 'wichtig' | 'neueste' | 'nummer' | 'kunde' | 'termin';

export const INAKTIVE_PHASEN: Phase[] = ['erledigt', 'verloren'];

export const SORTIERUNG_LABEL: Record<Sortierung, string> = {
  wichtig: 'Dringend zuerst',
  neueste: 'Neueste zuerst',
  nummer: 'Nummer',
  kunde: 'Kunde A–Z',
  termin: 'Nächster Termin',
};

export const ZEITRAUM_LABEL: Record<Zeitraum, string> = {
  woche: 'Diese Woche',
  monat: 'Dieser Monat',
  frei: 'Eigener Zeitraum',
};

export interface ListenFilter {
  q?: string;
  sicht?: Sicht;
  /** genaue Phase – ersetzt die Unterscheidung aktiv/abgeschlossen der Ansicht */
  phase?: Phase;
  mitarbeiterId?: ID;
  zeitraum?: Zeitraum;
  von?: Datum;
  bis?: Datum;
  sort?: Sortierung;
}

export interface ListenKontext {
  heute: Datum;
  /** Aufträge, die „mir“ gehören (verantwortlich, Team, Termin, Aufgabe) */
  meine: Set<ID>;
  kunde: (id: ID) => Pick<Kunde, 'name'> & Partial<Pick<Kunde, 'firma'>> | undefined;
  ortText: (id: ID | undefined) => string | undefined;
  termine: (auftragId: ID) => Termin[];
}

/** Erster und letzter Tag eines Zeitraums (einschließlich) */
export function zeitraumGrenzen(f: Pick<ListenFilter, 'zeitraum' | 'von' | 'bis'>, heute: Datum): { von?: Datum; bis?: Datum } | undefined {
  if (f.zeitraum === 'woche') {
    const von = wochenStart(heute);
    return { von, bis: plusTage(von, 6) };
  }
  if (f.zeitraum === 'monat') {
    const [j, m] = heute.split('-').map(Number);
    const letzter = new Date(Date.UTC(j, m, 0)).getUTCDate();
    return { von: `${heute.slice(0, 7)}-01`, bis: `${heute.slice(0, 7)}-${String(letzter).padStart(2, '0')}` };
  }
  if (f.zeitraum === 'frei' && (f.von || f.bis)) return { von: f.von, bis: f.bis };
  return undefined;
}

const imBereich = (tag: Datum, g: { von?: Datum; bis?: Datum }) => (!g.von || tag >= g.von) && (!g.bis || tag <= g.bis);

/** Ist jemand am Auftrag beteiligt: verantwortlich, im Team oder bei einem Einsatz eingeplant? */
export function istBeteiligt(a: Auftrag, mitarbeiterId: ID, termine: Termin[]): boolean {
  return a.verantwortlichId === mitarbeiterId || !!a.mitarbeiterIds?.includes(mitarbeiterId) || termine.some((t) => t.mitarbeiterIds.includes(mitarbeiterId));
}

/** Passt der Auftrag zur Ansicht (Aktiv/Meine/Abgeschlossen) bzw. zur genauen Phase? */
export function passtZurSicht(a: Auftrag, sicht: Sicht, meine: Set<ID>, phase?: Phase): boolean {
  if (phase) return a.phase === phase && (sicht !== 'meine' || meine.has(a.id));
  if (sicht === 'abgeschlossen') return !istOffen(a);
  return istOffen(a) && (sicht === 'aktiv' || meine.has(a.id));
}

/** Nächster offener Termin (oder ohne kommende der letzte) – für Zeitraum und Sortierung */
const naechsterTermin = (termine: Termin[], heute: Datum) => {
  const offen = termine.filter((t) => t.status !== 'abgesagt').sort((x, y) => x.start.localeCompare(y.start));
  return offen.find((t) => t.start.slice(0, 10) >= heute)?.start;
};

/** Zahlenteile vergleichen: `2610-002` vor `2610-010`, alte `A-…`-Nummern danach */
const nummerVergleich = (x: string, y: string) => x.localeCompare(y, 'de', { numeric: true });

export function auftraegeFiltern(alle: Auftrag[], f: ListenFilter, k: ListenKontext): Auftrag[] {
  const sicht = f.sicht ?? 'aktiv';
  const q = (f.q ?? '').trim().replace(/^#/, '');
  const grenzen = zeitraumGrenzen(f, k.heute);
  const kundeName = (a: Auftrag) => k.kunde(a.kundeId)?.name ?? '';
  const treffer = alle.filter((a) => {
    if (!passtZurSicht(a, sicht, k.meine, f.phase)) return false;
    if (q && !passt(q, a.nummer, a.titel, a.beschreibung, kundeName(a), k.kunde(a.kundeId)?.firma, k.ortText(a.ortId))) return false;
    if (f.mitarbeiterId && !istBeteiligt(a, f.mitarbeiterId, k.termine(a.id))) return false;
    if (grenzen) {
      const angelegt = imBereich(a.erstelltAm.slice(0, 10), grenzen);
      if (!angelegt && !k.termine(a.id).some((t) => t.status !== 'abgesagt' && imBereich(t.start.slice(0, 10), grenzen))) return false;
    }
    return true;
  });
  const sort = f.sort ?? 'wichtig';
  const ende = (a: Auftrag) => a.abgeschlossenAm ?? a.geaendertAm;
  const termin = new Map(sort === 'termin' ? treffer.map((a) => [a.id, naechsterTermin(k.termine(a.id), k.heute)]) : []);
  return treffer.sort((x, y) => {
    switch (sort) {
      case 'neueste':
        return y.erstelltAm.localeCompare(x.erstelltAm);
      case 'nummer':
        return nummerVergleich(y.nummer, x.nummer);
      case 'kunde':
        return kundeName(x).localeCompare(kundeName(y), 'de') || y.geaendertAm.localeCompare(x.geaendertAm);
      case 'termin': {
        const tx = termin.get(x.id);
        const ty = termin.get(y.id);
        return tx && ty ? tx.localeCompare(ty) : tx ? -1 : ty ? 1 : y.geaendertAm.localeCompare(x.geaendertAm);
      }
      default:
        return sicht === 'abgeschlossen' && !f.phase
          ? ende(y).localeCompare(ende(x))
          : Number(!!y.dringend && istOffen(y)) - Number(!!x.dringend && istOffen(x)) || y.geaendertAm.localeCompare(x.geaendertAm);
    }
  });
}

/** Wie viele Zusatzfilter (über die Schnellfilter hinaus) sind gesetzt? Für den Zähler am Knopf „Filter“. */
export function zusatzFilterAnzahl(f: ListenFilter): number {
  return [f.phase, f.mitarbeiterId, f.zeitraum, f.sort && f.sort !== 'wichtig' ? f.sort : undefined].filter(Boolean).length;
}

/** Phasen für die Auswahl, gruppiert nach aktiv und inaktiv */
export const PHASEN_GRUPPEN: { label: string; phasen: Phase[] }[] = [
  { label: 'Aktiv', phasen: AKTIVE_PHASEN },
  { label: 'Inaktiv', phasen: INAKTIVE_PHASEN },
];
