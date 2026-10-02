import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { pfadZu } from '@core/modul';
import { datumKurz, datumVon, plusTage } from '@core/format';
import type { ID, Termin } from '@core/objects';
import { kontextAusDb } from '../autoplanung/basis';
import { terminZaehlt } from '../verfuegbarkeit/daten';
import { ersatzFuer, pruefeWerkzeug, werkzeugProbleme } from './daten';
import { WerkzeugBereit } from './WerkzeugBereit';

const AUTOMATION = 'werkzeug.beim-einplanen';

export default defineModul({
  id: 'werkzeug-bereit',
  titel: 'Werkzeug & Fahrzeug bereit?',
  bereich: 'plan',
  beschreibung: 'Prüft, ob Werkzeuge, Maschinen und Fahrzeuge für die Einsätze heil, geprüft und frei sind.',
  icon: 'werkzeug',
  gewicht: 60,
  navigation: 'hub',
  routen: [{ pfad: '', element: WerkzeugBereit }],
  hinweise: () => {
    const ctx = kontextAusDb();
    const r: HinweisVorschlag[] = [];
    for (const { termin: t, pruefungen } of werkzeugProbleme(ctx, 7)) {
      const d = datumVon(t.start);
      for (const p of pruefungen.filter((x) => x.ergebnis === 'problem')) {
        const b = db.betriebsmittel.get(p.betriebsmittelId);
        const ersatz = b && (t.betriebsmittelIds ?? []).includes(b.id) ? ersatzFuer(ctx, b, t) : undefined;
        r.push({
          schluessel: `werkzeug:${t.id}:${p.betriebsmittelId ?? 'fahrzeug'}`,
          art: 'problem',
          titel: `${b?.art === 'fahrzeug' ? 'Fahrzeug' : 'Werkzeug'} nicht bereit: ${t.titel}, ${datumKurz(d)}`,
          text: `${p.text} ${p.loesung ?? ''}`.trim(),
          bezug: { typ: 'termine', id: t.id },
          gewicht: d <= plusTage(ctx.heute, 1) ? 70 : 58,
          faellig: d,
          pfad: pfadZu({ typ: 'termine', id: t.id }),
          aktionen: ersatz
            ? [{ aktion: 'werkzeug.tauschen', label: `${ersatz.name} nehmen`, primaer: true, payload: { terminId: t.id, alt: b!.id, neu: ersatz.id } }]
            : undefined,
        });
      }
    }
    return r;
  },
  aktionen: {
    'werkzeug.tauschen': (payload) => {
      const { terminId, alt, neu } = (payload ?? {}) as { terminId?: ID; alt?: ID; neu?: ID };
      const t = db.termine.get(terminId);
      const a = db.betriebsmittel.get(alt);
      const n = db.betriebsmittel.get(neu);
      if (!t || !a || !n) return;
      db.termine.update(t.id, { betriebsmittelIds: (t.betriebsmittelIds ?? []).map((x) => (x === a.id ? n.id : x)) }, { text: `${a.name} durch ${n.name} ersetzt` });
      erledigt('werkzeug.getauscht', `${n.name} statt ${a.name}: ${t.titel}`, { bezug: { typ: 'termine', id: t.id }, minuten: 5 });
      return pfadZu({ typ: 'termine', id: t.id });
    },
  },
  automationen: [
    {
      id: AUTOMATION,
      titel: 'Werkzeug & Fahrzeug beim Einplanen prüfen',
      beschreibung: 'Wird ein Einsatz geplant oder geändert, prüft Macher Zustand, Prüffrist und Doppelbelegung der Betriebsmittel.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const pruefe = (t: Termin, vorher?: Termin) => {
          if (!terminZaehlt(t) || t.status === 'erledigt') return;
          if (
            vorher &&
            vorher.start === t.start &&
            vorher.ende === t.ende &&
            (vorher.betriebsmittelIds ?? []).join() === (t.betriebsmittelIds ?? []).join() &&
            vorher.mitarbeiterIds.join() === t.mitarbeiterIds.join()
          )
            return;
          const ctx = kontextAusDb();
          if (datumVon(t.start) < ctx.heute) return;
          const probleme = pruefeWerkzeug(ctx, t).filter((p) => p.ergebnis === 'problem');
          if (!probleme.length) return;
          benachrichtigen(`Werkzeug/Fahrzeug nicht bereit: ${t.titel}`, { text: probleme.map((p) => `${p.text} ${p.loesung ?? ''}`).join(' '), bezug: { typ: 'termine', id: t.id }, art: 'werkzeug.fehlt' });
          erledigt(AUTOMATION, `Einsatz geprüft: Betriebsmittel-Problem bei „${t.titel}“`, { bezug: { typ: 'termine', id: t.id } });
        };
        const a = on('termine.created', (e) => pruefe(e.objekt as Termin));
        const b = on('termine.updated', (e) => pruefe(e.objekt as Termin, e.vorher as Termin));
        return () => {
          a();
          b();
        };
      },
    },
  ],
});
