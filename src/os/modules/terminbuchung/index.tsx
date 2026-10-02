import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datumKurz, personName, uhrzeit } from '@core/format';
import type { Termin } from '@core/objects';
import { kontextAusDb, terminKonflikte } from '../verfuegbarkeit/daten';
import { buchungsfenster, standardFenster, zuBestaetigen } from './daten';
import { BuchenSeite } from './BuchenSeite';
import { KundenBuchungPanel, Terminbuchung } from './Terminbuchung';

const terminPfad = (id: string) => `/plan/kalender/termin/${id}`;

export default defineModul({
  id: 'terminbuchung',
  titel: 'Terminbuchung',
  bereich: 'plan',
  beschreibung: 'Kunden buchen freie Termine selbst – du bestätigst nur noch.',
  icon: 'link',
  gewicht: 60,
  routen: [{ pfad: '', element: Terminbuchung }],
  vollbildRouten: [{ pfad: '/buchen/:token', element: BuchenSeite }],
  panels: [{ objekt: 'kunden', component: KundenBuchungPanel, gewicht: 30 }],
  kurzinfo: () => {
    const n = zuBestaetigen(db.termine.all()).length;
    if (n) return { text: n === 1 ? '1 Buchung bestätigen' : `${n} Buchungen bestätigen`, ton: 'achtung' };
    const aktiv = buchungsfenster.where((f) => f.aktiv).length;
    return { text: aktiv ? `${aktiv} Terminarten buchbar` : 'Noch nicht eingerichtet', ton: 'neutral' };
  },
  hinweise: () =>
    zuBestaetigen(db.termine.all()).map((t) => ({
      schluessel: `buchung-bestaetigen:${t.id}`,
      art: 'freigabe' as const,
      titel: `Online gebucht – bitte bestätigen: ${db.kunden.get(t.kundeId)?.name ?? t.titel}`,
      text: `${t.titel} · ${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr · ${t.mitarbeiterIds.map((m) => personName(db.mitarbeiter.get(m))).join(', ') || 'noch niemand'}`,
      bezug: { typ: 'termine' as const, id: t.id },
      gewicht: 76,
      fuerRollen: ['chef' as const, 'buero' as const],
      faellig: t.start.slice(0, 10),
      pfad: terminPfad(t.id),
      aktionen: [{ aktion: 'termin.bestaetigen', label: 'Bestätigen', primaer: true, payload: { terminId: t.id } }],
    })),
  automationen: [
    {
      id: 'terminbuchung.auto-bestaetigen',
      titel: 'Online-Buchungen ohne Konflikt sofort bestätigen',
      beschreibung: 'Bucht ein Kunde einen freien Termin und passt alles, bestätigt Macher ihn sofort. Sonst landet er bei dir.',
      standardAn: false,
      minuten: 3,
      start: () =>
        on('termine.created', (e) => {
          const t = e.objekt as Termin;
          if (!t.selbstGebucht || t.status !== 'geplant') return;
          if (terminKonflikte(t, kontextAusDb()).some((k) => k.gruende.some((g) => g.blockiert))) return;
          db.termine.update(t.id, { status: 'bestaetigt' }, { text: 'Automatisch bestätigt' });
          erledigt('terminbuchung.auto-bestaetigen', `Online-Buchung bestätigt: ${t.titel}`, {
            text: `${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr – ohne Konflikt.`,
            bezug: { typ: 'termine', id: t.id },
            rueckgaengig: { aktion: 'termin.zuruecksetzen', payload: { terminId: t.id } },
          });
        }),
    },
  ],
  aktionen: {
    'termin.zuruecksetzen': (payload) => {
      const { terminId } = (payload ?? {}) as { terminId?: string };
      if (terminId) db.termine.update(terminId, { status: 'geplant' }, { text: 'Bestätigung zurückgenommen' });
    },
  },
  seed: () => {
    if (buchungsfenster.all().length) return;
    standardFenster().forEach((f) => buchungsfenster.create({ ...f }));
  },
});
