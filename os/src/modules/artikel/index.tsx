import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { passt } from '@core/format';
import { ArtikelDetail } from './ArtikelDetail';
import { ArtikelFormular } from './ArtikelFormular';
import { ArtikelImport } from './ArtikelImport';
import { ArtikelListe } from './ArtikelListe';

export default defineModul({
  id: 'artikel',
  titel: 'Artikel & Material',
  bereich: 'betrieb',
  gruppe: 'material',
  beschreibung: 'Material und Artikel mit Einheiten, Einkaufs- und Verkaufspreisen.',
  icon: 'paket',
  gewicht: 55,
  routen: [
    { pfad: '', element: ArtikelListe },
    { pfad: 'neu', element: ArtikelFormular },
    { pfad: 'import', element: ArtikelImport },
    { pfad: ':id', element: ArtikelDetail },
    { pfad: ':id/bearbeiten', element: ArtikelFormular },
  ],
  detail: [{ objekt: 'artikel', pfad: (id) => `/betrieb/artikel/${id}` }],
  kurzinfo: () => {
    const n = db.artikel.where((a) => a.aktiv).length;
    return n ? { text: `${n} Artikel im Katalog` } : undefined;
  },
  erstellen: [{ label: 'Artikel anlegen', pfad: '/betrieb/artikel/neu', gewicht: 30 }],
  suche: (q) => {
    const exakt = q.trim();
    return db.artikel
      .where((a) => passt(q, a.name, a.nummer, a.ean, a.herstellerNummer, a.kategorie))
      .sort((a, b) => Number(b.nummer === exakt || b.ean === exakt) - Number(a.nummer === exakt || a.ean === exakt))
      .slice(0, 8)
      .map((a) => ({
        typ: 'Artikel',
        titel: a.name,
        untertitel: [a.nummer, a.ean && `EAN ${a.ean}`, a.bestand != null ? `Bestand ${a.bestand} ${a.einheit}` : null].filter(Boolean).join(' · '),
        pfad: `/betrieb/artikel/${a.id}`,
        relevanz: a.nummer === exakt || a.ean === exakt ? 90 : 45,
      }));
  },
});
