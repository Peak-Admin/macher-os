import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { passt } from '@core/format';
import type { Kunde } from '@core/objects';
import { KundenListe } from './KundenListe';
import { AnsprechpartnerTab, KundeDetail, VerlaufTab } from './KundeDetail';
import { KundeNeu } from './KundeNeu';
import { Dubletten } from './Dubletten';
import { aktuelleDubletten, naechsteKundennummer } from './daten';
import { KUNDEN_AKTIONEN } from './gateway';

const OFFEN = (p: string) => !['erledigt', 'verloren'].includes(p);

export default defineModul({
  id: 'kunden',
  titel: 'Kunden',
  bereich: 'auftraege',
  beschreibung: 'Kunden, Firmen, Ansprechpartner und Kontaktdaten.',
  icon: 'person',
  gewicht: 70,
  navigation: 'haupt',
  routen: [
    { pfad: '', element: KundenListe },
    { pfad: 'neu', element: KundeNeu },
    { pfad: 'dubletten', element: Dubletten },
    { pfad: ':id', element: KundeDetail },
  ],
  detail: [{ objekt: 'kunden', pfad: (id) => `/auftraege/kunden/${id}` }],
  tabs: [
    { objekt: 'kunden', titel: 'Ansprechpartner', component: AnsprechpartnerTab, gewicht: 60, zaehler: (id) => db.kunden.get(id)?.ansprechpartner.length },
    { objekt: 'kunden', titel: 'Verlauf', component: VerlaufTab, gewicht: 1 },
  ],
  erstellen: [{ label: 'Kunde anlegen', pfad: '/auftraege/kunden/neu', gewicht: 60 }],
  kurzinfo: () => {
    const n = aktuelleDubletten().length;
    return n ? { text: n === 1 ? '1 Kunde doppelt' : `${n} Kunden doppelt`, ton: 'achtung' } : undefined;
  },

  hinweise: () => {
    const liste: HinweisVorschlag[] = [];
    const d = aktuelleDubletten();
    if (d.length) {
      liste.push({
        schluessel: `kunden-dubletten:${d.map((x) => `${x.a.id}|${x.b.id}`).join(',')}`,
        art: 'entscheidung',
        titel: d.length === 1 ? `${d[0].a.name} ist vermutlich doppelt angelegt` : `${d.length} Kunden sind vermutlich doppelt angelegt`,
        text: 'Führe sie zusammen, damit Aufträge, Rechnungen und Verlauf an einer Stelle liegen.',
        gewicht: 24,
        pfad: '/auftraege/kunden/dubletten',
      });
    }
    // Monteur steht vor der Tür und kann niemanden anrufen
    const ohneKontakt = new Map<string, Kunde>();
    for (const a of db.auftraege.where((a) => ['beauftragt', 'in_arbeit'].includes(a.phase))) {
      const k = db.kunden.get(a.kundeId);
      if (k && !k.geloeschtAm && !k.telefon && !k.ansprechpartner.some((x) => x.telefon)) ohneKontakt.set(k.id, k);
    }
    for (const k of ohneKontakt.values()) {
      liste.push({
        schluessel: `kunde-ohne-telefon:${k.id}`,
        art: 'problem',
        titel: `Telefonnummer von ${k.name} fehlt`,
        text: 'Der Auftrag läuft, aber vor Ort kann niemand den Kunden erreichen.',
        bezug: { typ: 'kunden', id: k.id },
        gewicht: 30,
        pfad: `/auftraege/kunden/${k.id}`,
      });
    }
    return liste;
  },

  automationen: [
    {
      id: 'kunden.nummer',
      titel: 'Kundennummer vergeben',
      beschreibung: 'Neue Kunden bekommen automatisch die nächste freie Kundennummer – auch wenn sie aus einer Anfrage entstehen.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('kunden.created', (e) => {
          const k = e.objekt as Kunde | undefined;
          if (!k || k.nummer) return;
          const nummer = naechsteKundennummer();
          db.kunden.update(k.id, { nummer }, { leise: true });
          erledigt('kunden.nummer', `Kundennummer ${nummer} für ${k.name} vergeben`, { bezug: { typ: 'kunden', id: k.id } });
        }),
    },
  ],

  gateway: { aktionen: [...KUNDEN_AKTIONEN] },
  suche: (q) => {
    const offen = db.auftraege.where((a) => OFFEN(a.phase));
    return db.kunden
      .where((k) => passt(q, k.name, k.firma, k.telefon, k.email, k.nummer, k.adresse?.ort, k.adresse?.strasse, ...k.ansprechpartner.flatMap((a) => [a.name, a.telefon])))
      .slice(0, 8)
      .map((k) => ({
        typ: 'Kunde',
        titel: k.name,
        untertitel: [k.nummer, k.adresse?.ort, k.telefon].filter(Boolean).join(' · '),
        pfad: `/auftraege/kunden/${k.id}`,
        relevanz: 60 + (offen.some((a) => a.kundeId === k.id) ? 5 : 0),
      }));
  },
});
