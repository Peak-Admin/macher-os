import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { euro, passt } from '@core/format';
import type { Rechnung } from '@core/objects';
import { ZusatzDetail, ZusatzListe, ZusatzTab } from './Ansichten';
import { ZusatzErfassen } from './Erfassen';
import { abrechenbar, anRechnungHaengen, betrag, passenderEntwurf, vonRechnungLoesen, zusatzHinweise, zusatzleistungen, type Zusatzleistung } from './daten';
import { pfadZu } from '@core/modul';

export default defineModul({
  id: 'zusatzleistungen',
  titel: 'Zusatzleistungen',
  bereich: 'auftraege',
  beschreibung: 'Erfasst zusätzliche Arbeiten vor Ort, lässt sie freigeben und bringt sie in die Rechnung.',
  icon: 'plus',
  gewicht: 68,
  navigation: 'hub',
  routen: [
    { pfad: '', element: ZusatzListe },
    { pfad: ':id', element: ZusatzDetail },
  ],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Zusatzleistungen',
      component: ZusatzTab,
      gewicht: 66,
      zaehler: (id) => zusatzleistungen.where((z) => z.auftragId === id && z.status !== 'abgelehnt').length || undefined,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return !!a && (['beauftragt', 'in_arbeit', 'abnahme', 'abrechnung'].includes(a.phase) || zusatzleistungen.all().some((z) => z.auftragId === id));
      },
    },
  ],
  schnell: [{ id: 'zusatzleistung', label: 'Zusatzleistung', icon: 'plus', component: ZusatzErfassen, gewicht: 72 }],
  kurzinfo: () => {
    const n = zusatzleistungen.where((z) => z.status === 'offen').length;
    return n ? { text: n === 1 ? '1 Nachtrag ohne Freigabe' : `${n} Nachträge ohne Freigabe`, ton: 'achtung' } : undefined;
  },
  hinweise: () => zusatzHinweise(zusatzleistungen.all(), db.auftraege.all(), db.rechnungen.all()),
  aktionen: {
    'zusatzleistungen.uebernehmen': (payload) => {
      const { auftragId } = (payload ?? {}) as { auftragId?: string };
      const r = auftragId ? passenderEntwurf(auftragId, db.rechnungen.all()) : undefined;
      if (!r) return `/auftraege/zusatzleistungen${auftragId ? `?auftrag=${auftragId}` : ''}`;
      const n = anRechnungHaengen(r);
      if (n) erledigt('zusatzleistungen.abrechnen', `${n === 1 ? '1 Nachtrag' : `${n} Nachträge`} in Rechnung ${r.nummer} übernommen`, { bezug: { typ: 'rechnungen', id: r.id } });
      return pfadZu({ typ: 'rechnungen', id: r.id }) ?? `/auftraege/zusatzleistungen?auftrag=${auftragId}`;
    },
  },
  automationen: [
    {
      id: 'zusatzleistungen.abrechnen',
      titel: 'Freigegebene Nachträge in die Rechnung',
      beschreibung: 'Wird zu einem Auftrag eine Rechnung angelegt (oder liegt schon ein Entwurf vor), übernimmt Macher alle freigegebenen Nachträge als Positionen. Wird sie storniert, sind die Nachträge wieder abrechenbar.',
      standardAn: true,
      minuten: 5,
      start: () => {
        const aus1 = on('rechnungen.created', (e) => {
          const r = e.objekt as Rechnung | undefined;
          if (!r) return;
          const vorher = zusatzleistungen.where((z) => z.auftragId === r.auftragId && abrechenbar(z));
          const n = anRechnungHaengen(r);
          if (n)
            erledigt('zusatzleistungen.abrechnen', `${n === 1 ? '1 Nachtrag' : `${n} Nachträge`} in Rechnung ${r.nummer} übernommen`, {
              text: `Zusammen ${euro(vorher.reduce((s, z) => s + betrag(z), 0))} netto.`,
              bezug: { typ: 'rechnungen', id: r.id },
            });
        });
        const loesen = (r: Rechnung | undefined) => {
          if (!r) return;
          const n = vonRechnungLoesen(r.id);
          if (n) erledigt('zusatzleistungen.abrechnen', `${n === 1 ? '1 Nachtrag' : `${n} Nachträge`} nach Storno wieder abrechenbar`, { bezug: { typ: 'rechnungen', id: r.id } });
        };
        const aus2 = on('rechnungen.updated', (e) => {
          const r = e.objekt as Rechnung | undefined;
          if (r?.status === 'storniert' && (e.vorher as Rechnung | undefined)?.status !== 'storniert') loesen(r);
        });
        const aus3 = on('rechnungen.removed', (e) => loesen(e.objekt as Rechnung | undefined));
        // Nachtrag nachträglich freigegeben, Rechnungsentwurf liegt schon da → direkt übernehmen
        const aus4 = on('zusatzleistungen.updated', (e) => {
          const z = e.objekt as Zusatzleistung | undefined;
          if (z?.status !== 'freigegeben' || (e.vorher as Zusatzleistung | undefined)?.status === 'freigegeben') return;
          const r = passenderEntwurf(z.auftragId, db.rechnungen.all());
          if (r && anRechnungHaengen(r)) erledigt('zusatzleistungen.abrechnen', `Nachtrag „${z.text}“ in Rechnung ${r.nummer} übernommen`, { bezug: { typ: 'rechnungen', id: r.id } });
        });
        return () => {
          aus1();
          aus2();
          aus3();
          aus4();
        };
      },
    },
  ],
  suche: (q) =>
    zusatzleistungen
      .where((z) => passt(q, z.text, z.notiz, 'nachtrag', db.auftraege.get(z.auftragId)?.nummer))
      .slice(0, 5)
      .map((z) => ({ typ: 'Zusatzleistung', titel: z.text, untertitel: db.auftraege.get(z.auftragId)?.titel, pfad: `/auftraege/zusatzleistungen/${z.id}`, relevanz: 35 })),
  seed: () => {
    const finde = (titel: string) => db.auftraege.all().find((a) => a.beispiel && a.titel === titel);
    const a4 = finde('Sanierung Wohnanlage, Haus 24');
    const a6 = finde('Kleinreparatur Treppenhaus');
    const stundensatz = db.betrieb.get('betrieb')?.stundensatz ?? 0;
    const B = { beispiel: true, fotoIds: [] };
    if (a4) {
      zusatzleistungen.create({ auftragId: a4.id, text: 'Alte Verteilung im Keller abgeklemmt und gesichert', berechnung: 'stunden', menge: 2, einheit: 'h', einzelpreis: stundensatz, status: 'offen', notiz: 'Wand feucht, siehe Foto. Hausmeister war dabei.', ...B });
      zusatzleistungen.create({ auftragId: a4.id, text: 'Zusätzliche Außenleuchte am Eingang', berechnung: 'pauschal', menge: 1, einheit: 'Psch', einzelpreis: 18500, status: 'freigegeben', freigabeAnders: 'per E-Mail, Frau Neumann', freigegebenAm: new Date().toISOString(), ...B });
    }
    if (a6) zusatzleistungen.create({ auftragId: a6.id, text: 'Treppenhauslicht: Bewegungsmelder getauscht', berechnung: 'stunden', menge: 0.5, einheit: 'h', einzelpreis: stundensatz, status: 'freigegeben', freigabeAnders: 'mündlich vor Ort, Herr Albers – bitte schriftlich nachholen', freigegebenAm: new Date().toISOString(), ...B });
  },
});
