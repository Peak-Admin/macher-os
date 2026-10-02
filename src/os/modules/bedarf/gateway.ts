/** Aktionen des Materialbedarfs für den Macher AI Gateway (`@core/gateway`). */
import type { AktionDef } from '@core/gateway';
import { berechneBedarf, bestellvorschlag } from './daten';
import { bedarfHinweisAktualisieren } from './pruefung';

export const BEDARF_AKTIONEN: AktionDef<Record<string, never>>[] = [
  {
    // „Bestell das fehlende Material“ – nur Entwürfe je Lieferant; bestellt ist erst, was der Mensch abschickt
    id: 'order.create_draft',
    titel: 'Bestellentwürfe angelegt',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (_d, k) => (berechneBedarf(k.heute).some((z) => z.fehl > 0) ? undefined : 'Es fehlt kein Material mehr.'),
    fuehreAus: (_d, k) => {
      const b = bestellvorschlag(berechneBedarf(k.heute));
      bedarfHinweisAktualisieren();
      return {
        bezug: b[0] ? { typ: 'bestellungen', id: b[0].id } : undefined,
        text: b.length === 1 ? '1 Bestellentwurf – prüf ihn und schick ihn an den Lieferanten.' : `${b.length} Bestellentwürfe – prüf sie und schick sie an die Lieferanten.`,
      };
    },
  },
];
