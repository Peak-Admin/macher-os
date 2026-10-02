/** Aktionen der Rechnungen für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';
import { kontaktArt } from '@modules/start/daten';
import { pflichtangabenPruefen, rechnungErstellen } from './logik';
import { rechnungSenden } from './RechnungSchnellVersand';
import { rechnungX } from './typen';

export const RECHNUNG_AKTIONEN: AktionDef<{ auftragId: ID }>[] = [
  {
    id: 'invoice.create_draft',
    titel: 'Rechnungsentwurf vorbereitet',
    risiko: 'schreiben',
    rechte: ['schreiben', 'geld'],
    pruefe: (d) => {
      const a = db.auftraege.get(d.auftragId);
      if (!a) return 'Den Auftrag gibt es nicht mehr.';
      if (a.phase === 'verloren') return 'Der Auftrag ist nicht zustande gekommen.';
      return undefined;
    },
    // Nur ein Entwurf: versendet wird die Rechnung erst in der Rechnung selbst.
    fuehreAus: (d) => {
      const r = rechnungErstellen(d.auftragId, 'rechnung', { vonMacher: true });
      if (!r) throw new AktionsFehler('Der Rechnungsentwurf konnte nicht angelegt werden.');
      return { bezug: { typ: 'rechnungen', id: r.id } };
    },
  },
];

export interface RechnungSendenDaten {
  rechnungId: ID;
  /** E-Mail oder Handynummer; ohne Angabe die des Kunden */
  an?: string;
}

const zielFuer = (d: RechnungSendenDaten) => {
  const k = db.kunden.get(rechnungX(d.rechnungId)?.kundeId);
  return (d.an || k?.email || k?.telefon || '').trim();
};

export const RECHNUNG_SENDEN: AktionDef<RechnungSendenDaten>[] = [
  {
    // Festschreiben (fortlaufende Nummer, GoBD) und an den Kunden senden – mit XRechnung
    id: 'invoice.send',
    titel: 'Rechnung versendet',
    risiko: 'kritisch',
    endgueltig: 'Eine versendete Rechnung ist festgeschrieben – korrigieren geht nur per Storno.',
    rechte: ['geld', 'veroeffentlichen'],
    pruefe: (d) => {
      const r = rechnungX(d.rechnungId);
      if (!r) return 'Die Rechnung gibt es nicht mehr.';
      if (r.status !== 'entwurf') return `Rechnung ${r.nummer || ''} ist schon versendet.`.replace('  ', ' ');
      const p = pflichtangabenPruefen(r);
      if (!p.ok) return p.pflicht.map((m) => m.text).join(' ');
      if (!kontaktArt(zielFuer(d))) return `Für ${db.kunden.get(r.kundeId)?.name ?? 'den Kunden'} ist keine E-Mail oder Handynummer hinterlegt.`;
      return undefined;
    },
    fuehreAus: async (d) => {
      const ziel = zielFuer(d);
      const { r, maengel } = await rechnungSenden(d.rechnungId, ziel, kontaktArt(ziel)!);
      if (maengel?.length) throw new AktionsFehler(maengel.map((m) => m.text).join(' '));
      if (r.status === 'fehler') throw new AktionsFehler(r.fehler ?? 'Die Rechnung wurde nicht versendet.');
      return { bezug: { typ: 'rechnungen', id: d.rechnungId }, text: `An ${ziel}` };
    },
  },
];
