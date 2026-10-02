import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { passt } from '@core/format';
import { KundenListe } from './KundenListe';
import { KundeDetail } from './KundeDetail';
import { KundeNeu } from './KundeNeu';

export default defineModul({
  id: 'kunden',
  titel: 'Kunden',
  bereich: 'auftraege',
  beschreibung: 'Kunden, Firmen, Ansprechpartner und Kontaktdaten.',
  icon: 'person',
  gewicht: 70,
  routen: [
    { pfad: '', element: KundenListe },
    { pfad: 'neu', element: KundeNeu },
    { pfad: ':id', element: KundeDetail },
  ],
  detail: [{ objekt: 'kunden', pfad: (id) => `/auftraege/kunden/${id}` }],
  erstellen: [{ label: 'Kunde anlegen', pfad: '/auftraege/kunden/neu', gewicht: 60 }],
  suche: (q) =>
    db.kunden
      .where((k) => passt(q, k.name, k.firma, k.telefon, k.email, k.nummer, k.adresse?.ort, k.adresse?.strasse))
      .slice(0, 8)
      .map((k) => ({ typ: 'Kunde', titel: k.name, untertitel: [k.adresse?.ort, k.telefon].filter(Boolean).join(' · '), pfad: `/auftraege/kunden/${k.id}`, relevanz: 60 })),
});
