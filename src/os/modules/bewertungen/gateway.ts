/** Aktionen der Bewertungen für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';
import { LINK_KEY, anfrageFuerAuftrag, anfrageSenden } from './daten';

export const BEWERTUNG_AKTIONEN: AktionDef<{ auftragId: ID }>[] = [
  {
    id: 'review.request',
    titel: 'Bewertung angefragt',
    risiko: 'kritisch',
    endgueltig: 'Eine gesendete Anfrage lässt sich nicht zurückholen.',
    rechte: ['veroeffentlichen'],
    pruefe: (d) => {
      const a = db.auftraege.get(d.auftragId);
      const k = db.kunden.get(a?.kundeId);
      if (!a || !k) return 'Den Auftrag gibt es nicht mehr.';
      if (anfrageFuerAuftrag(d.auftragId)?.status === 'gesendet') return 'Die Bewertungsanfrage ist schon raus.';
      if (!einstellung<string>(LINK_KEY, '').trim()) return 'Hinterlege zuerst deinen Bewertungslink unter Bewertungen.';
      if (!k.email && !k.telefon) return `Für ${k.name} ist keine E-Mail oder Telefonnummer hinterlegt.`;
      return undefined;
    },
    fuehreAus: (d) => {
      const r = anfrageSenden(d.auftragId);
      if (!r.ok) throw new AktionsFehler('Die Bewertungsanfrage wurde nicht gesendet.');
      return { bezug: { typ: 'auftraege', id: d.auftragId }, text: r.kanal === 'email' ? 'Per E-Mail' : 'Per SMS' };
    },
  },
];
