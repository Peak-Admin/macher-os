import { defineModul } from '@core/modul';
import { Schnittstellen } from './Schnittstellen';

export default defineModul({
  id: 'schnittstellen',
  titel: 'Schnittstellen',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'DATEV, Großhandel, Bank, Kalender und Datenexport.',
  icon: 'stecker',
  gewicht: 28,
  navigation: 'hub',
  routen: [{ pfad: '', element: Schnittstellen }],
  kurzinfo: () => ({ text: 'Kalender und Datenexport verfügbar' }),
  suche: (q) =>
    /kalender|ics|outlook|google|export|json|datev|datanorm|ids|ugl|bank|fints|schnittstelle/i.test(q)
      ? [{ typ: 'Einstellung', titel: 'Schnittstellen', untertitel: 'Kalender-Export, JSON-Export, DATEV, Großhandel, Bank', pfad: '/betrieb/schnittstellen', relevanz: 25 }]
      : [],
});
