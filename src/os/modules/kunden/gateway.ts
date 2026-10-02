/** Aktionen der Kunden für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import type { AktionDef } from '@core/gateway';
import type { Kunde } from '@core/objects';
import { aehnlicheKunden, naechsteKundennummer } from './daten';

export interface KundeDaten {
  name: string;
  art?: Kunde['art'];
  telefon?: string;
  email?: string;
}

export const KUNDEN_AKTIONEN: AktionDef<KundeDaten>[] = [
  {
    id: 'customer.create',
    titel: 'Kunde angelegt',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (d) => {
      if (d.name.trim().length < 2) return 'Wie heißt der Kunde?';
      const gleich = aehnlicheKunden({ name: d.name, telefon: d.telefon, email: d.email, ansprechpartner: [] }, db.kunden.all());
      if (gleich.length) return `Den Kunden gibt es vielleicht schon: ${gleich.map((k) => k.name).slice(0, 3).join(', ')}.`;
      return undefined;
    },
    fuehreAus: (d) => {
      const k = db.kunden.create({
        art: d.art ?? (/\b(gmbh|kg|ag|ug|ohg|gbr|e\.k\.)\b/i.test(d.name) ? 'firma' : 'privat'),
        name: d.name.trim(),
        telefon: d.telefon?.trim() || undefined,
        email: d.email?.trim() || undefined,
        nummer: naechsteKundennummer(),
        ansprechpartner: [],
        quelle: undefined,
      });
      return { bezug: { typ: 'kunden', id: k.id } };
    },
  },
];
