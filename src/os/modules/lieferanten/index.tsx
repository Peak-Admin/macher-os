import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { passt } from '@core/format';
import { LieferantDetail } from './LieferantDetail';
import { LieferantenListe } from './LieferantenListe';
import { LieferantFormular } from './LieferantFormular';
import { lieferzeitText } from './daten';

export default defineModul({
  id: 'lieferanten',
  titel: 'Lieferanten',
  bereich: 'betrieb',
  gruppe: 'material',
  beschreibung: 'Lieferanten mit Kundennummer, Konditionen, Ansprechpartner und Lieferzeit.',
  icon: 'person',
  gewicht: 35,
  routen: [
    { pfad: '', element: LieferantenListe },
    { pfad: 'neu', element: LieferantFormular },
    { pfad: ':id', element: LieferantDetail },
    { pfad: ':id/bearbeiten', element: LieferantFormular },
  ],
  detail: [{ objekt: 'lieferanten', pfad: (id) => `/betrieb/lieferanten/${id}` }],
  kurzinfo: () => {
    const l = db.lieferanten.all();
    if (!l.length) return undefined;
    const ohneMail = l.filter((x) => !x.email).length;
    return ohneMail ? { text: `${ohneMail} ohne Bestell-E-Mail`, ton: 'aktiv' } : { text: `${l.length} Lieferant${l.length === 1 ? '' : 'en'}` };
  },
  erstellen: [{ label: 'Lieferant anlegen', pfad: '/betrieb/lieferanten/neu', gewicht: 10 }],
  suche: (q) =>
    db.lieferanten
      .where((l) => passt(q, l.name, l.kundennummer, l.email, l.telefon, l.adresse?.ort))
      .slice(0, 5)
      .map((l) => ({ typ: 'Lieferant', titel: l.name, untertitel: [l.kundennummer && `Kd.-Nr. ${l.kundennummer}`, lieferzeitText(l)].filter(Boolean).join(' · '), pfad: `/betrieb/lieferanten/${l.id}`, relevanz: 40 })),
});
