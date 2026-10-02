import { defineModul } from '@core/modul';
import { ZEITEN_BESTAETIGEN, zeitenBestaetigen } from './aktionen';
import { TaktSeite } from './Ansicht';
import { takteAutomation } from './automation';
import { taktPfad } from './zustellung';

/**
 * Takte: Dein Tag (6:30), Tagesbrief (7:00), Zeiten bestätigen (16:30), Wochenbilanz (Fr 15:00).
 * Ort: Kontext unter Heute – erreichbar über die Benachrichtigung, die Glocke und die Suche.
 * Einstellungen je Nutzer stehen im Modul Benachrichtigungen.
 */
export default defineModul({
  id: 'takte',
  titel: 'Takte',
  bereich: 'macher',
  beschreibung: 'Tagesbrief, Dein Tag, Zeiten bestätigen und Wochenbilanz – feste Zeiten statt Dauerbeschallung.',
  icon: 'uhr',
  gewicht: 60,
  navigation: 'versteckt',
  routen: [{ pfad: ':takt', element: TaktSeite }],
  // Takt-Benachrichtigungen verweisen auf `{ typ: 'takte', id: <takt> }` → Takt-Ansicht
  detail: [{ objekt: 'takte', pfad: (id) => `${taktPfad(id)}?quelle=benachrichtigung` }],
  automationen: [takteAutomation],
  aktionen: {
    [ZEITEN_BESTAETIGEN]: (p) => {
      zeitenBestaetigen(p as { mitarbeiterId: string; datum: string });
    },
  },
  suche: (q) => {
    const s = q.trim().toLowerCase();
    if (s.length < 3) return [];
    const treffer = [
      { titel: 'Tagesbrief', pfad: taktPfad('tagesbrief'), worte: 'tagesbrief morgen brief entscheidungen' },
      { titel: 'Dein Tag', pfad: taktPfad('dein-tag'), worte: 'dein tag tagesplan einsatz morgen' },
      { titel: 'Zeiten bestätigen', pfad: taktPfad('zeiten'), worte: 'zeiten bestätigen stunden feierabend' },
      { titel: 'Wochenbilanz', pfad: taktPfad('wochenbilanz'), worte: 'wochenbilanz woche bilanz umsatz' },
    ];
    return treffer.filter((t) => t.worte.includes(s)).map((t) => ({ titel: t.titel, untertitel: 'Takt', pfad: t.pfad, typ: 'Takt', relevanz: 40 }));
  },
});
