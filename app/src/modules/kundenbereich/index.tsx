import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import type { Angebot, ID } from '@core/objects';
import { Portal } from './Portal';
import { KundenbereichPanel, Zugaenge } from './Buero';
import { aktiverZugang, portalzugaenge, zugangErzeugen } from './daten';

const REGEL = 'kundenbereich.link';

export default defineModul({
  id: 'kundenbereich',
  titel: 'Kundenbereich',
  bereich: 'auftraege',
  beschreibung: 'Deine Kunden sehen Termine, Angebote, Rechnungen und Unterlagen – und nehmen Angebote online an.',
  icon: 'link',
  gewicht: 30,
  navigation: 'hub',
  routen: [{ pfad: '', element: Zugaenge }],
  vollbildRouten: [{ pfad: '/k/:token', element: Portal }],
  panels: [{ objekt: 'kunden', component: KundenbereichPanel, gewicht: 40 }],

  automationen: [
    {
      id: REGEL,
      titel: 'Kundenbereich-Link bereitstellen',
      beschreibung: 'Wird ein Angebot versendet, legt Macher für den Kunden einen Link zum Kundenbereich an – dort kann er es direkt annehmen.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('angebot.versendet', (e) => {
          const angebot = (e.objekt as Angebot | undefined) ?? db.angebote.get((e.daten as { angebotId?: ID } | undefined)?.angebotId);
          if (!angebot || aktiverZugang(angebot.kundeId)) return;
          zugangErzeugen(angebot.kundeId);
          erledigt(REGEL, `Link zum Kundenbereich für ${db.kunden.get(angebot.kundeId)?.name ?? 'Kunde'} angelegt`, {
            text: `Damit kann ${angebot.nummer} online angenommen werden.`,
            bezug: { typ: 'kunden', id: angebot.kundeId },
          });
        }),
    },
  ],

  init: () => {
    // Zusammengeführte Kunden: Zugänge mitnehmen
    on('kunde.zusammengefuehrt', (e) => {
      const { zielId, quelleId } = e.daten as { zielId: ID; quelleId: ID };
      portalzugaenge.where((z) => z.kundeId === quelleId).forEach((z) => portalzugaenge.update(z.id, { kundeId: zielId }));
    });
  },

  seed: () => {
    // Ein Beispielkunde mit offenem Angebot bekommt direkt einen Link – zum Ausprobieren
    const angebot = db.angebote.all().find((a) => a.beispiel && a.status === 'versendet');
    if (angebot && !aktiverZugang(angebot.kundeId)) zugangErzeugen(angebot.kundeId, 90, { beispiel: true });
  },
});
