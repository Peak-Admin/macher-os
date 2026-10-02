/** Aktionen „Material am Auftrag“ für den Macher AI Gateway (`@core/gateway`). */
import { db, vermerken } from '@core/db';
import type { AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';

export interface ReservierenDaten {
  auftragId: ID;
  artikelId: ID;
  menge: number;
}

/** Was bereitgelegt ist, gilt im Bedarf als reserviert (Status „bereit“) und wird nicht doppelt verplant. */
export const MATERIAL_AKTIONEN: AktionDef<ReservierenDaten>[] = [
  {
    id: 'material.reserve',
    titel: 'Material reserviert',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (d) => {
      const a = db.artikel.get(d.artikelId);
      if (!db.auftraege.get(d.auftragId)) return 'Den Auftrag gibt es nicht mehr.';
      if (!a) return 'Den Artikel gibt es nicht mehr.';
      if (!(d.menge > 0)) return 'Gib eine Menge größer 0 an.';
      if (a.bestand != null) {
        const reserviert = db.material.where((m) => m.status === 'bereit' && m.artikelId === a.id).reduce((s, m) => s + m.menge, 0);
        const frei = a.bestand - reserviert;
        if (d.menge > frei) return `Im Lager sind nur noch ${Math.max(0, frei).toLocaleString('de-DE')} ${a.einheit} ${a.name} frei.`;
      }
      return undefined;
    },
    fuehreAus: (d) => {
      const a = db.artikel.get(d.artikelId)!;
      db.material.create({ auftragId: d.auftragId, artikelId: a.id, text: a.name, menge: d.menge, einheit: a.einheit, ek: a.ek, status: 'bereit' });
      vermerken({ typ: 'auftraege', id: d.auftragId }, 'material.reserviert', `${d.menge.toLocaleString('de-DE')} ${a.einheit} ${a.name} reserviert`);
      return { bezug: { typ: 'auftraege', id: d.auftragId }, text: `${d.menge.toLocaleString('de-DE')} ${a.einheit} ${a.name}` };
    },
  },
];
