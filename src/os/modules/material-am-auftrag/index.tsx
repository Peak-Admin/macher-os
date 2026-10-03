import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on, type DbEvent } from '@core/events';
import { euro } from '@core/format';
import type { Angebot, Rechnung } from '@core/objects';
import { MaterialSeite } from './MaterialSeite';
import { MaterialAmAuftrag } from './MaterialAmAuftrag';
import { MaterialFormular } from './MaterialFormular';
import { materialAbrechnen, materialAusAngebot } from './daten';
import { offenFuerRechnung, summeEk } from './logik';
import { erledigt } from '@core/macher';
import { MATERIAL_AKTIONEN } from './gateway';

const wurde = (e: DbEvent, werte: string[]) => {
  const n = e.objekt as { status?: string } | undefined;
  const v = e.vorher as { status?: string } | undefined;
  return !!n?.status && werte.includes(n.status) && (!v || !werte.includes(v.status ?? ''));
};

export default defineModul({
  id: 'material-am-auftrag',
  titel: 'Material am Auftrag',
  bereich: 'auftraege',
  beschreibung: 'Welches Material ein Auftrag braucht, was bestellt ist und was verbaut wurde.',
  icon: 'paket',
  gewicht: 50,
  navigation: 'hub',
  routen: [{ pfad: '', element: MaterialSeite }],
  kurzinfo: () => {
    const n = db.material.where((b) => b.status === 'geplant' && !!db.auftraege.get(b.auftragId) && !['erledigt', 'verloren'].includes(db.auftraege.get(b.auftragId)!.phase)).length;
    return n ? { text: n === 1 ? '1 Position zu bestellen' : `${n} Positionen zu bestellen`, ton: 'aktiv' } : undefined;
  },
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Material',
      component: MaterialAmAuftrag,
      gewicht: 70,
      zaehler: (id) => db.material.where((b) => b.auftragId === id).length || undefined,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return !!a && (!['anfrage', 'besichtigung'].includes(a.phase) || db.material.where((b) => b.auftragId === id).length > 0);
      },
    },
  ],
  schnell: [
    {
      id: 'material',
      label: 'Material buchen',
      icon: 'paket',
      gewicht: 70,
      component: ({ fertig, auftragId }) => <MaterialFormular auftragId={auftragId} onFertig={fertig} />,
    },
  ],
  hinweise: () =>
    db.auftraege
      .where((a) => a.phase === 'abrechnung' || a.phase === 'erledigt')
      .flatMap((a) => {
        // Rechnung ist raus, aber verbautes Material steht auf keiner Rechnung → Geld verschenkt
        const raus = db.rechnungen.where((r) => r.auftragId === a.id && (r.art === 'schluss' || r.art === 'rechnung') && ['versendet', 'teilbezahlt', 'bezahlt'].includes(r.status));
        if (!raus.length) return [];
        const offen = db.material.where((b) => b.auftragId === a.id && offenFuerRechnung(b));
        if (!offen.length) return [];
        return [
          {
            schluessel: `material-nicht-abgerechnet:${a.id}`,
            art: 'entscheidung' as const,
            titel: `${a.titel}: verbautes Material nicht abgerechnet`,
            text: `${offen.length === 1 ? '1 Position' : `${offen.length} Positionen`}, EK ${euro(summeEk(offen))}. Nachberechnen oder als erledigt markieren.`,
            bezug: { typ: 'auftraege' as const, id: a.id },
            gewicht: 60,
            aktionen: [
              { aktion: 'auftrag.oeffnen', label: 'Ansehen', primaer: true, payload: { auftragId: a.id } },
              { aktion: 'material.nicht-berechnen', label: 'Nicht berechnen', payload: { auftragId: a.id, rechnungId: raus[0].id } },
            ],
            pfad: `/auftrag/${a.id}`,
          },
        ];
      }),
  gateway: { aktionen: [...MATERIAL_AKTIONEN] },
  aktionen: {
    /** Material bewusst nicht berechnen (z. B. Kulanz): der zuletzt versendeten Rechnung zuordnen */
    'material.nicht-berechnen': (p) => {
      const x = p as { auftragId?: string; rechnungId?: string };
      if (!x?.auftragId || !x.rechnungId) return;
      db.material.where((b) => b.auftragId === x.auftragId && offenFuerRechnung(b)).forEach((b) => db.material.update(b.id, { abgerechnetIn: x.rechnungId }, { text: 'Nicht berechnet (Kulanz)' }));
    },
  },
  automationen: [
    {
      id: 'material.aus-angebot',
      titel: 'Material aus dem Angebot planen',
      beschreibung: 'Nimmt der Kunde das Angebot an, plant Lotte das Material aus den Positionen am Auftrag – fertig zum Bestellen.',
      standardAn: true,
      minuten: 5,
      start: () => {
        const a = on('angebote.updated', (e) => wurde(e, ['angenommen']) && materialAusAngebot(e.objekt as Angebot));
        const b = on('angebot.angenommen', (e) => {
          const an = (e.objekt as Angebot | undefined)?.positionen ? (e.objekt as Angebot) : db.angebote.get((e.daten as { angebotId?: string } | undefined)?.angebotId);
          if (an) materialAusAngebot(an);
        });
        return () => (a(), b());
      },
    },
    {
      id: 'material.abgerechnet',
      titel: 'Abgerechnetes Material markieren',
      beschreibung: 'Geht eine Rechnung raus, markiert Lotte das verbaute Material darauf als abgerechnet – so wird nichts doppelt oder gar nicht berechnet.',
      standardAn: true,
      minuten: 3,
      start: () =>
        on('rechnungen.updated', (e) => {
          if (!wurde(e, ['versendet', 'teilbezahlt', 'bezahlt'])) return;
          const r = e.objekt as Rechnung;
          const n = materialAbrechnen(r);
          if (n.length) erledigt('material.abgerechnet', `${r.nummer}: ${n.length === 1 ? '1 Materialposition' : `${n.length} Materialpositionen`} als abgerechnet markiert`, { bezug: { typ: 'rechnungen', id: r.id } });
        }),
    },
  ],
});
