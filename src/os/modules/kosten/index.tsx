import { defineModul, pfadZu } from '@core/modul';
import { db } from '@core/db';
import { darf } from '@core/session';
import { personName } from '@core/format';
import { basisAusDb } from './basis';
import { auftragKosten } from './daten';
import { KostenTab } from './KostenAuftrag';
import { KostenDetail, KostenListe } from './KostenSeiten';

const VORHER = ['anfrage', 'besichtigung', 'angebot', 'verloren'];

/** Mitarbeiter mit gebuchten Zeiten, aber ohne Kostensatz */
function ohneKostensatz() {
  const mitZeit = new Set(db.zeiten.where((z) => !!z.auftragId).map((z) => z.mitarbeiterId));
  return db.mitarbeiter.where((m) => mitZeit.has(m.id) && !m.kostensatz);
}

export default defineModul({
  id: 'kosten',
  titel: 'Kosten',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Zeigt die tatsächlichen Kosten eines Auftrags.',
  icon: 'euro',
  gewicht: 60,
  routen: [
    { pfad: '', element: KostenListe },
    { pfad: ':id', element: KostenDetail },
  ],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Kosten',
      component: KostenTab,
      gewicht: 35,
      sichtbar: (id) => {
        if (!darf('geld')) return false;
        const a = db.auftraege.get(id);
        if (!a) return false;
        return !VORHER.includes(a.phase) || auftragKosten(id, basisAusDb()).hatDaten;
      },
    },
  ],
  kurzinfo: () => {
    if (!darf('geld')) return undefined;
    const fehlt = ohneKostensatz().length;
    if (fehlt) return { text: fehlt === 1 ? 'Bei 1 Mitarbeiter fehlt der Kostensatz' : `Bei ${fehlt} Mitarbeitern fehlt der Kostensatz`, ton: 'achtung' };
    return undefined;
  },
  hinweise: () =>
    ohneKostensatz().map((m) => ({
      schluessel: `kosten-kostensatz-fehlt:${m.id}`,
      art: 'problem' as const,
      titel: `Kostensatz fehlt bei ${personName(m)}`,
      text: 'Die Stunden zählen in den Auftragskosten mit 0 €. Trag den Kostensatz (Lohn + Nebenkosten je Stunde) ein.',
      bezug: { typ: 'mitarbeiter' as const, id: m.id },
      gewicht: 42,
      fuerRollen: ['chef' as const],
      pfad: pfadZu({ typ: 'mitarbeiter', id: m.id }),
    })),
});
