import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import type { Angebot, ID } from '@core/objects';
import { Portal } from './Portal';
import { KundenbereichPanel, Zugaenge } from './Buero';
import { aktiverZugang, portalzugaenge, zugangErzeugen } from './daten';
import { eingabenVerarbeiten, eingabeVerarbeiter, portalEingabe, portalSichtenVeroeffentlichen, veroeffentlichenNoetig } from './oeffentlich';

const REGEL = 'kundenbereich.link';
const VEROEFFENTLICHEN = 'kundenbereich.oeffentlich';

/** Änderungen bündeln: höchstens alle 2 Sekunden neu veröffentlichen */
function entprellt(f: () => void, ms = 2000) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t) return;
    t = setTimeout(() => ((t = undefined), f()), ms);
  };
}

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
      beschreibung: 'Wird ein Angebot versendet, legt Lotte für den Kunden einen Link zum Kundenbereich an – dort kann er es direkt annehmen.',
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
    {
      id: VEROEFFENTLICHEN,
      titel: 'Kundenbereich für Kunden bereitstellen',
      beschreibung: 'Hält die Kundenbereiche aktuell, die deine Kunden auf ihrem eigenen Gerät öffnen, und übernimmt Antworten, Nachrichten und Annahmen von dort.',
      standardAn: true,
      minuten: 1,
      start: () => {
        const veroeffentlichen = () => {
          if (veroeffentlichenNoetig()) portalSichtenVeroeffentlichen();
        };
        const spaeter = entprellt(veroeffentlichen);
        const aus = on('*', (e) => {
          if (e.typ.startsWith('oeffentliche_eingaben.')) eingabenVerarbeiten();
          else if (!e.typ.startsWith('oeffentliche_sichten.') && !e.typ.startsWith('ereignisse.')) spaeter();
        });
        const takt = setInterval(() => (eingabenVerarbeiten(), veroeffentlichen()), 5 * 60_000);
        eingabenVerarbeiten();
        veroeffentlichen();
        return () => (aus(), clearInterval(takt));
      },
    },
  ],

  init: () => {
    eingabeVerarbeiter('portal', portalEingabe);
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
