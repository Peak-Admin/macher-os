import { defineModul } from '@core/modul';
import type { ID } from '@core/objects';
import { darf } from '@core/session';
import { Schnittstellen } from './Schnittstellen';
import { Export } from './Export';
import { DatanormImport } from './DatanormImport';
import { GaebImport } from './GaebImport';
import { Webhooks } from './Webhooks';
import { connectoren, ZUSTAND_LABEL } from './connectoren';

const PFAD = '/betrieb/schnittstellen';

export default defineModul({
  id: 'schnittstellen',
  titel: 'Schnittstellen',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Bank, DATEV, Großhandel (DATANORM), Ausschreibungen (GAEB), Kalender, E-Mail und Webhooks verbinden.',
  icon: 'stecker',
  gewicht: 28,
  navigation: 'hub',
  routen: [
    { pfad: '', element: Schnittstellen },
    { pfad: 'export', element: Export },
    { pfad: 'datanorm', element: DatanormImport },
    { pfad: 'gaeb', element: GaebImport },
    { pfad: 'webhooks', element: Webhooks },
  ],
  kurzinfo: () => {
    const sichtbar = connectoren().filter((c) => !c.recht || darf(c.recht));
    const fehler = sichtbar.find((c) => c.status().zustand === 'fehler');
    if (fehler) return { text: `${fehler.titel}: ${ZUSTAND_LABEL.fehler}`, ton: 'achtung' };
    const verbunden = sichtbar.filter((c) => c.status().zustand === 'verbunden').length;
    return { text: verbunden ? `${verbunden === 1 ? '1 Verbindung' : `${verbunden} Verbindungen`} in Gebrauch` : 'Kalender, Bank, DATEV und mehr verbinden' };
  },
  aktionen: {
    /** Leistungsverzeichnis (GAEB) ins Angebot eines Auftrags übernehmen */
    'angebot.lv_importieren': (payload) => `${PFAD}/gaeb${(payload as { auftragId?: ID } | undefined)?.auftragId ? `?auftrag=${(payload as { auftragId: ID }).auftragId}` : ''}`,
    /** Artikel des Großhändlers (DATANORM) einlesen */
    'artikel.datanorm_importieren': () => `${PFAD}/datanorm`,
  },
  suche: (q) => {
    const t = q.toLowerCase();
    const treffer = connectoren()
      .filter((c) => !c.recht || darf(c.recht))
      .filter((c) => `${c.titel} ${c.text} ${c.faehigkeiten.join(' ')} ${(c.technik ?? []).join(' ')}`.toLowerCase().includes(t) && t.length >= 3)
      .slice(0, 4)
      .map((c) => ({ typ: 'Schnittstelle', titel: c.titel, untertitel: c.text, pfad: c.verfuegbar && c.pfad ? c.pfad : PFAD, relevanz: 25 }));
    if (treffer.length) return treffer;
    return /kalender|ics|outlook|google|export|json|datev|datanorm|ids|ugl|oci|gaeb|leistungsverzeichnis|ausschreibung|bank|camt|fints|webhook|api|schnittstelle/i.test(q)
      ? [{ typ: 'Einstellung', titel: 'Schnittstellen', untertitel: 'Bank, DATEV, Großhandel, Ausschreibungen, Kalender, Webhooks', pfad: PFAD, relevanz: 25 }]
      : [];
  },
});
