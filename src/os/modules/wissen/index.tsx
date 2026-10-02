import { defineModul } from '@core/modul';
import { batch, db, vermerken } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { passt } from '@core/format';
import type { Auftrag } from '@core/objects';
import { WissenListe } from './WissenListe';
import { WissenArtikel } from './WissenArtikel';
import { WissenBearbeiten } from './WissenBearbeiten';
import { AnlageAnleitungen, AuftragAnleitungen, vorschlaegeFuer, vorschlaegeFuerAnlage, vorschlaegeFuerAuftrag } from './ArtikelTab';
import { wissen } from './daten';
import { STARTARTIKEL } from './start';

const VORSCHLAG_AUTOMATION = 'wissen.anleitung-vorschlagen';

export default defineModul({
  id: 'wissen',
  titel: 'Wissen & Anleitungen',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Abläufe, Firmenwissen und Herstellerinfos – griffbereit am Auftrag.',
  icon: 'wissen',
  gewicht: 42,
  routen: [
    { pfad: '', element: WissenListe },
    { pfad: 'neu', element: WissenBearbeiten },
    { pfad: ':id', element: WissenArtikel },
    { pfad: ':id/bearbeiten', element: WissenBearbeiten },
  ],
  erstellen: [{ label: 'Anleitung schreiben', pfad: '/betrieb/wissen/neu', gewicht: 10 }],
  kurzinfo: () => {
    const n = wissen.all().length;
    return n ? { text: n === 1 ? '1 Anleitung' : `${n} Anleitungen` } : { text: 'Noch keine Anleitungen' };
  },
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Anleitungen',
      component: AuftragAnleitungen,
      gewicht: 20,
      zaehler: (id) => vorschlaegeFuerAuftrag(id).length,
      sichtbar: (id) => vorschlaegeFuerAuftrag(id).length > 0,
    },
    {
      objekt: 'anlagen',
      titel: 'Anleitungen',
      component: AnlageAnleitungen,
      gewicht: 30,
      zaehler: (id) => vorschlaegeFuerAnlage(id).length,
      sichtbar: (id) => vorschlaegeFuerAnlage(id).length > 0,
    },
  ],
  suche: (q) =>
    wissen
      .where((a) => passt(q, a.titel, a.kategorie, a.text, ...(a.anlagentypen ?? [])))
      .slice(0, 6)
      .map((a) => ({ typ: 'Anleitung', titel: a.titel, untertitel: a.kategorie, pfad: `/betrieb/wissen/${a.id}`, relevanz: passt(q, a.titel) ? 35 : 15 })),
  automationen: [
    {
      id: VORSCHLAG_AUTOMATION,
      titel: 'Passende Anleitung am Auftrag vermerken',
      beschreibung: 'Bekommt ein Auftrag eine Anlage oder Leistung, für die es eine Anleitung gibt, vermerkt Macher sie im Verlauf des Auftrags.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const pruefen = (a: Auftrag, vorher?: Auftrag) => {
          const schon = new Set(vorher ? vorschlaegeFuer(vorher).map((v) => v.artikel.id) : []);
          const neu = vorschlaegeFuerAuftrag(a.id).filter((v) => !schon.has(v.artikel.id));
          if (!neu.length) return;
          vermerken({ typ: 'auftraege', id: a.id }, 'wissen.vorschlag', `Passende Anleitung: ${neu.map((v) => v.artikel.titel).join(', ')}`);
          erledigt(VORSCHLAG_AUTOMATION, neu.length === 1 ? `Anleitung „${neu[0].artikel.titel}“ zu ${a.nummer} vorgeschlagen` : `${neu.length} Anleitungen zu ${a.nummer} vorgeschlagen`, {
            bezug: { typ: 'auftraege', id: a.id },
          });
        };
        const aus1 = on('auftraege.created', (e) => pruefen(e.objekt as Auftrag));
        const aus2 = on('auftraege.updated', (e) => {
          const a = e.objekt as Auftrag;
          const v = e.vorher as Auftrag | undefined;
          if (v && (a.anlageIds ?? []).join() === (v.anlageIds ?? []).join() && (a.leistungIds ?? []).join() === (v.leistungIds ?? []).join()) return;
          pruefen(a, v);
        });
        return () => {
          aus1();
          aus2();
        };
      },
    },
  ],
  seed: () => {
    if (wissen.allMitGeloeschten().length) return;
    const gewerk = db.betrieb.get('betrieb')?.gewerk ?? 'sonstiges';
    const leistungen = db.leistungen.all();
    batch(() =>
      STARTARTIKEL(gewerk).forEach(({ leistungNamen, ...a }) => {
        const leistungIds = (leistungNamen ?? []).map((n) => leistungen.find((l) => l.name === n)?.id).filter((x): x is string => !!x);
        wissen.create({ ...a, leistungIds: leistungIds.length ? leistungIds : undefined }, { leise: true });
      }),
    );
  },
});

