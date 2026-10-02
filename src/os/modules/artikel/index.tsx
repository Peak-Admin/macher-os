import { Navigate, useLocation, useParams } from 'react-router-dom';
import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { passt } from '@core/format';
import { ArtikelDetail } from './ArtikelDetail';
import { ArtikelFormular } from './ArtikelFormular';
import { ArtikelImport } from './ArtikelImport';
import { ArtikelListe } from './ArtikelListe';

/** `/betrieb/artikel/…` → `/betrieb/katalog/material/…` (Unterpfad und Filter bleiben erhalten) */
function AlteAdresse() {
  const rest = useParams()['*'];
  const { search, hash } = useLocation();
  return <Navigate to={`/betrieb/katalog/material${rest ? `/${rest}` : ''}${search}${hash}`} replace />;
}

function KatalogStart() {
  return <Navigate to="/betrieb/katalog/material" replace />;
}

export default defineModul({
  id: 'artikel',
  titel: 'Artikel & Material',
  bereich: 'betrieb',
  basisPfad: '/betrieb/katalog/material',
  gruppe: 'material',
  beschreibung: 'Material und Artikel mit Einheiten, Einkaufs- und Verkaufspreisen.',
  icon: 'paket',
  gewicht: 55,
  routen: [
    // frühere Adresse (vor dem gemeinsamen Katalog) – Links und Lesezeichen funktionieren weiter
    { pfad: '/betrieb/artikel/*', element: AlteAdresse },
    // „Katalog“ ohne Ansicht öffnet Material, die erste Ansicht
    { pfad: '/betrieb/katalog', element: KatalogStart },
    { pfad: '', element: ArtikelListe },
    { pfad: 'neu', element: ArtikelFormular },
    { pfad: 'import', element: ArtikelImport },
    { pfad: ':id', element: ArtikelDetail },
    { pfad: ':id/bearbeiten', element: ArtikelFormular },
  ],
  detail: [{ objekt: 'artikel', pfad: (id) => `/betrieb/katalog/material/${id}` }],
  kurzinfo: () => {
    const n = db.artikel.where((a) => a.aktiv).length;
    return n ? { text: `${n} Artikel im Katalog` } : undefined;
  },
  erstellen: [{ label: 'Artikel anlegen', pfad: '/betrieb/katalog/material/neu', gewicht: 30 }],
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
        pfad: `/betrieb/katalog/material/${a.id}`,
        relevanz: a.nummer === exakt || a.ean === exakt ? 90 : 45,
      }));
  },
});
