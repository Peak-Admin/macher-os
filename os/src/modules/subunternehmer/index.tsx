import { defineModul } from '@core/modul';
import { batch, db } from '@core/db';
import { heute, passt, plusTage } from '@core/format';
import { subHinweise, subStatus, subunternehmer } from './daten';
import { subName } from './name';
import { SubListe } from './SubListe';
import { SubDetail } from './SubDetail';
import { SubForm } from './SubForm';
import { AuftragSubunternehmer, einsaetzeAmAuftrag } from './AuftragTab';

export default defineModul({
  id: 'subunternehmer',
  titel: 'Subunternehmer',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Fremdfirmen, Einsätze, Kosten und Nachweise wie die Freistellungsbescheinigung.',
  icon: 'team',
  gewicht: 48,
  routen: [
    { pfad: '', element: SubListe },
    { pfad: 'neu', element: SubForm },
    { pfad: ':id', element: SubDetail },
    { pfad: ':id/bearbeiten', element: SubForm },
  ],
  erstellen: [{ label: 'Subunternehmer anlegen', pfad: '/betrieb/subunternehmer/neu', gewicht: 5 }],
  kurzinfo: () => {
    const aktiv = subunternehmer.where((s) => s.aktiv);
    if (!aktiv.length) return { text: 'Noch keine Subunternehmer' };
    const probleme = aktiv.filter((s) => subStatus(s, heute()).ton === 'achtung').length;
    if (probleme) return { text: probleme === 1 ? '1 Nachweis fehlt oder ist abgelaufen' : `${probleme} mit fehlenden Nachweisen`, ton: 'achtung' };
    return { text: aktiv.length === 1 ? '1 Firma, Nachweise in Ordnung' : `${aktiv.length} Firmen, Nachweise in Ordnung`, ton: 'erfolg' };
  },
  hinweise: () => subHinweise(subunternehmer.all(), subName, heute()),
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Subunternehmer',
      component: AuftragSubunternehmer,
      gewicht: 25,
      zaehler: (id) => einsaetzeAmAuftrag(id).length,
      sichtbar: (id) => einsaetzeAmAuftrag(id).length > 0 || db.auftraege.get(id)?.art === 'projekt',
    },
  ],
  suche: (q) =>
    subunternehmer
      .where((s) => passt(q, subName(s), s.gewerk, s.ansprechpartner))
      .slice(0, 5)
      .map((s) => ({ typ: 'Subunternehmer', titel: subName(s), untertitel: s.gewerk, pfad: `/betrieb/subunternehmer/${s.id}`, relevanz: 30 })),
  seed: () => {
    if (subunternehmer.allMitGeloeschten().length) return;
    // nur, wenn der Betrieb mit Beispieldaten startet
    if (!db.mitarbeiter.all().some((m) => m.beispiel)) return;
    const t = heute();
    const projekt = db.auftraege.all().find((a) => a.beispiel && a.art === 'projekt' && a.phase === 'in_arbeit');
    const B = { beispiel: true };
    batch(() => {
      const l1 = db.lieferanten.create({ name: 'Gerüstbau Krause GmbH', telefon: '0561 7070700', email: 'dispo@geruest-krause.example', adresse: { strasse: 'Industriestraße 8', plz: '34123', ort: 'Kassel' }, notiz: 'Subunternehmer', ...B }, { leise: true });
      subunternehmer.create(
        {
          lieferantId: l1.id,
          gewerk: 'Gerüstbau',
          ansprechpartner: 'Herr Krause',
          stundensatz: 4800,
          aktiv: true,
          nachweise: [
            { id: 'sn1', art: 'freistellung_48b', gueltigBis: plusTage(t, 210) },
            { id: 'sn2', art: 'unbedenklichkeit_krankenkasse', gueltigBis: plusTage(t, 75) },
          ],
          einsaetze: projekt ? [{ id: 'se1', auftragId: projekt.id, von: plusTage(t, -6), bis: plusTage(t, 20), leistung: 'Fassadengerüst stellen, vorhalten und abbauen', kosten: 185000, status: 'laeuft' }] : [],
          ...B,
        },
        { leise: true },
      );
      const l2 = db.lieferanten.create({ name: 'Trockenbau Özdemir', telefon: '0176 5554433', email: 'info@trockenbau-oezdemir.example', notiz: 'Subunternehmer', ...B }, { leise: true });
      subunternehmer.create(
        {
          lieferantId: l2.id,
          gewerk: 'Trockenbau',
          ansprechpartner: 'Kemal Özdemir',
          stundensatz: 5200,
          aktiv: true,
          nachweise: [{ id: 'sn3', art: 'freistellung_48b', gueltigBis: plusTage(t, 12) }],
          einsaetze: projekt ? [{ id: 'se2', auftragId: projekt.id, von: plusTage(t, 8), bis: plusTage(t, 10), leistung: 'Vorwandinstallation beplanken', kosten: 96000, status: 'geplant' }] : [],
          ...B,
        },
        { leise: true },
      );
    });
  },
});
