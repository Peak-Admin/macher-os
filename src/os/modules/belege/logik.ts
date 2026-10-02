/**
 * Eingangsrechnungen & Belege: Konditionen (Skonto/Zahlungsziel) lesen, Auftrag vorschlagen,
 * Fristen erkennen, Fotos verkleinern.
 */
import { db } from '@core/db';
import { heute, plusTage, tageZwischen } from '@core/format';
import type { Cent, Datum, ID } from '@core/objects';
import type { BelegX } from '../rechnungen/typen';
import { dateiLesen } from '@ui/index';
import { betragCsv, csvText } from '../rechnungen/liste';

export const alleBelege = () => db.belege.all() as BelegX[];
export const belegX = (id: ID | undefined) => db.belege.get(id) as BelegX | undefined;

export const ART_LABEL: Record<BelegX['art'], string> = {
  eingangsrechnung: 'Eingangsrechnung',
  quittung: 'Quittung',
  tankbeleg: 'Tankbeleg',
  sonstiges: 'Sonstiges',
};

export const KATEGORIEN = ['Material', 'Fahrzeug', 'Werkzeug', 'Subunternehmer', 'Büro', 'Sonstiges'];

export interface Konditionen {
  skontoProzent?: number;
  skontoTage?: number;
  zielTage?: number;
}

/** "3 % Skonto 10 Tage, 30 Tage netto" → { skontoProzent: 3, skontoTage: 10, zielTage: 30 } */
export function konditionenLesen(text: string | undefined): Konditionen {
  if (!text) return {};
  const t = text.toLowerCase().replace(/(\d),(\d)/g, '$1.$2');
  const k: Konditionen = {};
  const a = t.match(/(\d+(?:\.\d+)?)\s*%\s*skonto[^\d]*(\d+)\s*tag/);
  const b = t.match(/(\d+)\s*tage?\s*(\d+(?:\.\d+)?)\s*%\s*skonto/);
  if (a) {
    k.skontoProzent = Number(a[1]);
    k.skontoTage = Number(a[2]);
  } else if (b) {
    k.skontoTage = Number(b[1]);
    k.skontoProzent = Number(b[2]);
  }
  const ziel = t.match(/(\d+)\s*tage?\s*(?:netto|rein|ohne abzug)/) ?? t.match(/(?:netto|zahlbar)\s*(?:in|innerhalb)?\s*(\d+)\s*tag/);
  if (ziel) k.zielTage = Number(ziel[1]);
  return k;
}

/** Fälligkeit und Skontofrist aus Lieferanten-Konditionen ableiten (nur wenn nicht schon gesetzt) */
export function fristenAusKonditionen(b: Pick<BelegX, 'datum' | 'lieferantId' | 'faelligAm' | 'skontoBis' | 'skontoProzent'>) {
  const l = db.lieferanten.get(b.lieferantId);
  const k = konditionenLesen(l?.konditionen);
  return {
    faelligAm: b.faelligAm ?? (k.zielTage != null ? plusTage(b.datum, k.zielTage) : undefined),
    skontoBis: b.skontoBis ?? (k.skontoTage != null ? plusTage(b.datum, k.skontoTage) : undefined),
    skontoProzent: b.skontoProzent ?? k.skontoProzent,
  };
}

export const brutto = (b: Pick<BelegX, 'netto' | 'ust'>) => b.netto + b.ust;

/** Netto und USt aus Bruttobetrag */
export function ausBrutto(brutto: Cent, satz: number): { netto: Cent; ust: Cent } {
  const netto = Math.round(brutto / (1 + satz / 100));
  return { netto, ust: brutto - netto };
}

export function lieferantName(b: BelegX) {
  return db.lieferanten.get(b.lieferantId)?.name ?? b.lieferantName ?? 'Unbekannter Lieferant';
}

// ------------------------------------------------------------------ Auftrag vorschlagen

export interface Vorschlag {
  auftragId: ID;
  punkte: number;
  gruende: string[];
}

/**
 * Welcher Auftrag passt? Punkte für: Material vom gleichen Lieferanten am Auftrag,
 * Einsatz/Zeiten nahe am Belegdatum, Auftrag gerade in Arbeit.
 */
export function auftragVorschlaege(b: Pick<BelegX, 'datum' | 'lieferantId' | 'lieferantName' | 'kategorie'>): Vorschlag[] {
  const kandidaten = db.auftraege.where((a) => !['anfrage', 'verloren'].includes(a.phase));
  const name = (b.lieferantName ?? db.lieferanten.get(b.lieferantId)?.name ?? '').toLowerCase().trim();
  const liste: Vorschlag[] = [];
  for (const a of kandidaten) {
    const gruende: string[] = [];
    let punkte = 0;
    const material = db.material.where((m) => m.auftragId === a.id);
    const vomLieferanten = material.filter((m) => {
      const art = db.artikel.get(m.artikelId);
      if (b.lieferantId && art?.lieferantId === b.lieferantId) return true;
      const ln = db.lieferanten.get(art?.lieferantId)?.name.toLowerCase() ?? '';
      return !!name && !!ln && (ln.includes(name) || name.includes(ln.split(' ')[0]));
    });
    if (vomLieferanten.length) {
      punkte += 40;
      gruende.push(`Material vom selben Lieferanten am Auftrag`);
    } else if (material.length && (!b.kategorie || b.kategorie === 'Material')) {
      punkte += 10;
      gruende.push('Material am Auftrag');
    }
    const tage = [
      ...db.termine.where((t) => t.auftragId === a.id && t.status !== 'abgesagt').map((t) => t.start.slice(0, 10)),
      ...db.zeiten.where((z) => z.auftragId === a.id).map((z) => z.datum),
      ...material.map((m) => m.datum).filter(Boolean) as Datum[],
    ];
    const abstand = tage.length ? Math.min(...tage.map((d) => Math.abs(tageZwischen(d, b.datum)))) : Infinity;
    if (abstand <= 1) {
      punkte += 35;
      gruende.push(abstand === 0 ? 'Einsatz am selben Tag' : 'Einsatz einen Tag daneben');
    } else if (abstand <= 3) {
      punkte += 25;
      gruende.push(`Einsatz ${abstand} Tage daneben`);
    } else if (abstand <= 7) {
      punkte += 10;
      gruende.push('Einsatz in derselben Woche');
    }
    if (a.phase === 'in_arbeit') {
      punkte += 10;
      gruende.push('Auftrag läuft gerade');
    }
    if (punkte > 0) liste.push({ auftragId: a.id, punkte, gruende });
  }
  return liste.sort((x, y) => y.punkte - x.punkte);
}

/** Sicher genug, um automatisch zuzuordnen? Eindeutiger Spitzenreiter mit starken Gründen. */
export function sichererVorschlag(v: Vorschlag[]): Vorschlag | undefined {
  const [erster, zweiter] = v;
  if (!erster || erster.punkte < 60) return undefined;
  if (zweiter && erster.punkte - zweiter.punkte < 25) return undefined;
  return erster;
}

// ------------------------------------------------------------------ Fristen

export interface Frist {
  art: 'skonto' | 'faellig';
  datum: Datum;
  tage: number;
  betrag?: Cent;
}

/** nächste relevante Frist eines unbezahlten Belegs */
export function naechsteFrist(b: BelegX, stichtag: Datum = heute()): Frist | undefined {
  if (b.status === 'bezahlt') return undefined;
  if (b.skontoBis && b.skontoBis >= stichtag) {
    const ersparnis = b.skontoProzent ? Math.round((brutto(b) * b.skontoProzent) / 100) : undefined;
    return { art: 'skonto', datum: b.skontoBis, tage: tageZwischen(stichtag, b.skontoBis), betrag: ersparnis };
  }
  if (b.faelligAm) return { art: 'faellig', datum: b.faelligAm, tage: tageZwischen(stichtag, b.faelligAm) };
  return undefined;
}

// ------------------------------------------------------------------ Dateien

/** Foto/PDF als Dokument ablegen und Beleg anlegen */
export async function dateiAblegen(datei: File, opts: { auftragId?: ID } = {}) {
  const d = await dateiLesen(datei);
  return db.dokumente.create({
    art: d.istBild ? 'foto' : 'pdf',
    titel: datei.name || 'Beleg',
    url: d.url,
    mime: d.mime,
    groesse: d.bytes,
    auftragId: opts.auftragId,
    tags: ['beleg'],
  });
}

// ------------------------------------------------------------------ Liste & Export

export const STATUS_LABEL: Record<BelegX['status'], string> = { neu: 'Zu prüfen', geprueft: 'Geprüft', bezahlt: 'Bezahlt' };

/** Zuordnungsfilter: `''` = alle, `'auftrag'` = mit Auftrag, `'ohne'` = weder Auftrag noch Bereich, sonst Bereichsname */
export type ZuordnungFilter = string;

export function passtZuordnung(b: Pick<BelegX, 'auftragId' | 'bereich'>, f: ZuordnungFilter): boolean {
  if (!f) return true;
  if (f === 'auftrag') return !!b.auftragId;
  if (f === 'ohne') return !b.auftragId && !b.bereich;
  return !b.auftragId && b.bereich === f;
}

const tmj = (d: string | undefined) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : '');

export const BELEG_CSV_SPALTEN = ['Datum', 'Lieferant', 'Art', 'Nummer', 'Auftrag', 'Betriebsbereich', 'Kategorie', 'Netto', 'USt', 'Brutto', 'Status', 'Zahlen bis'];

export function belegeCsv(liste: BelegX[]): string {
  return csvText([
    BELEG_CSV_SPALTEN,
    ...liste.map((b) => [
      tmj(b.datum),
      lieferantName(b),
      ART_LABEL[b.art],
      b.nummer ?? '',
      db.auftraege.get(b.auftragId)?.nummer ?? '',
      b.auftragId ? '' : (b.bereich ?? ''),
      b.kategorie ?? '',
      betragCsv(b.netto),
      betragCsv(b.ust),
      betragCsv(brutto(b)),
      STATUS_LABEL[b.status],
      tmj(b.faelligAm),
    ]),
  ]);
}
