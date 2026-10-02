/** Aktionen der Angebote für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import type { ID, Position } from '@core/objects';
import { kontaktArt } from '@modules/start/daten';
import { angebotSenden } from './erstwert';
import { neuesAngebot } from './daten';

export interface AngebotSendenDaten {
  angebotId: ID;
  /** E-Mail oder Telefonnummer; ohne Angabe die des Kunden */
  an?: string;
}

const zielFuer = (d: AngebotSendenDaten) => {
  const a = db.angebote.get(d.angebotId);
  const k = db.kunden.get(a?.kundeId);
  return (d.an || k?.email || k?.telefon || '').trim();
};

export const ANGEBOT_AKTIONEN: AktionDef<AngebotSendenDaten>[] = [
  {
    id: 'offer.send',
    titel: 'Angebot versendet',
    risiko: 'kritisch',
    endgueltig: 'Ein gesendetes Angebot lässt sich nicht zurückholen.',
    rechte: ['veroeffentlichen'],
    pruefe: (d) => {
      const a = db.angebote.get(d.angebotId);
      if (!a) return 'Das Angebot gibt es nicht mehr.';
      if (a.status !== 'entwurf' && a.status !== 'versendet') return `Angebot ${a.nummer} ist schon entschieden.`;
      if (!a.positionen.length) return `Angebot ${a.nummer} hat noch keine Positionen.`;
      if (!kontaktArt(zielFuer(d))) return `Für ${db.kunden.get(a.kundeId)?.name ?? 'den Kunden'} ist keine E-Mail oder Handynummer hinterlegt.`;
      return undefined;
    },
    fuehreAus: async (d) => {
      const ziel = zielFuer(d);
      const r = await angebotSenden(d.angebotId, ziel, kontaktArt(ziel)!);
      if (r.status === 'fehler') throw new AktionsFehler(r.fehler ?? 'Das Angebot wurde nicht versendet.');
      return { bezug: { typ: 'angebote', id: d.angebotId }, text: `An ${ziel}` };
    },
  },
];

export interface AngebotEntwurfDaten {
  /** die Anfrage (Auftrag in Phase Anfrage/Besichtigung) */
  auftragId: ID;
  /** in der Vorschau erkannte Positionen – leer: Leistungen des Auftrags */
  positionen: Position[];
}

/** „Angebot aus Anfrage vorbereiten“ – nur ein Entwurf, versendet wird im Angebot selbst. */
export const ANGEBOT_ENTWURF: AktionDef<AngebotEntwurfDaten>[] = [
  {
    id: 'offer.create_draft',
    titel: 'Angebotsentwurf vorbereitet',
    risiko: 'schreiben',
    rechte: ['schreiben', 'geld'],
    pruefe: (d) => {
      const a = db.auftraege.get(d.auftragId);
      if (!a || a.geloeschtAm) return 'Die Anfrage gibt es nicht mehr.';
      if (a.phase === 'verloren') return 'Die Anfrage ist abgesagt.';
      return undefined;
    },
    fuehreAus: (d) => {
      const a = neuesAngebot(d.auftragId, d.positionen.length ? d.positionen : undefined);
      return { bezug: { typ: 'angebote', id: a.id }, text: `Entwurf ${a.nummer}` };
    },
  },
];
