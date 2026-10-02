/**
 * Rechnungsliste: Filter nach Art, CSV zum Herunterladen (Zeitraum, Auftrag, Brutto/Netto: `@ui/listen`). Reine Logik, ohne Oberfläche.
 */
import { db } from '@core/db';
import type { Cent } from '@core/objects';
import { ART_LABEL, offenerBetrag, rechnungsSummen, statusText } from './logik';
import type { RechnungX } from './typen';

/** Art für Filter und Export – Storno ist technisch eine Gutschrift mit Verweis, für dich aber eine eigene Art */
export type ListenArt = RechnungX['art'] | 'storno';

export const LISTEN_ART_LABEL: Record<ListenArt, string> = { ...ART_LABEL, storno: 'Storno' };

export const listenArt = (r: Pick<RechnungX, 'art' | 'stornoFuerId'>): ListenArt => (r.stornoFuerId ? 'storno' : r.art);

/** Was diese Rechnung selbst berechnet (bei Schlussrechnungen ohne die abgezogenen Abschläge) */
export function berechnet(r: RechnungX): { netto: Cent; ust: Cent; brutto: Cent } {
  const s = rechnungsSummen(r);
  return { netto: s.netto - s.abzugNetto, ust: s.ust - s.abzugUst, brutto: s.brutto - s.abzugBrutto };
}

// ------------------------------------------------------------------ CSV

/** 123456 → "1234,56" (deutsches Excel) */
export function betragCsv(cent: Cent): string {
  const minus = cent < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cent));
  return `${minus}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

function zelle(v: string): string {
  return /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Zeilen → CSV mit Semikolon und BOM, damit Excel Umlaute und Spalten richtig liest */
export function csvText(zeilen: string[][]): string {
  return '﻿' + zeilen.map((z) => z.map(zelle).join(';')).join('\r\n') + '\r\n';
}

const tmj = (d: string | undefined) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : '');

export const RECHNUNG_CSV_SPALTEN = ['Nummer', 'Art', 'Datum', 'Kunde', 'Auftrag', 'Netto', 'USt', 'Brutto', 'Status', 'Offen'];

export function rechnungenCsv(rs: RechnungX[]): string {
  const zeilen = rs.map((r) => {
    const b = berechnet(r);
    const entwurf = r.status === 'entwurf';
    return [
      r.nummer || 'Entwurf',
      LISTEN_ART_LABEL[listenArt(r)],
      entwurf ? '' : tmj(r.datum),
      db.kunden.get(r.kundeId)?.name ?? '',
      db.auftraege.get(r.auftragId)?.nummer ?? '',
      betragCsv(b.netto),
      betragCsv(b.ust),
      betragCsv(b.brutto),
      statusText(r).text,
      betragCsv(offenerBetrag(r)),
    ];
  });
  return csvText([RECHNUNG_CSV_SPALTEN, ...zeilen]);
}
