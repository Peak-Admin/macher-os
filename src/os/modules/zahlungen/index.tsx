import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt, hinweisErledigen } from '@core/macher';
import { euro } from '@core/format';
import type { Cent, Datum, ID, Zahlung } from '@core/objects';
import { OffenePosten } from './OffenePosten';
import { KontoauszugImport } from './KontoauszugImport';
import { statusAbgleichen, zahlungBuchen } from './logik';
import { istUeberfaellig, offenePosten, offenerBetrag } from '../rechnungen/logik';
import { rechnungX } from '../rechnungen/typen';

function freigabeSchliessen(schluessel: string) {
  for (const h of db.hinweise.where((x) => x.schluessel === schluessel && x.status === 'offen')) hinweisErledigen(h.id);
}

export default defineModul({
  id: 'zahlungen',
  titel: 'Zahlungen',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Offene Posten, Zahlungseingänge und Kontoauszug-Import.',
  icon: 'euro',
  gewicht: 85,
  rollen: ['chef', 'buero'],
  routen: [
    { pfad: '', element: OffenePosten },
    { pfad: 'import', element: KontoauszugImport },
  ],
  // Kein eigenes Hub-Widget: „Offene Posten“ steht schon in „Zahlen auf einen Blick“ (Auswertung) – jede Zahl genau einmal
  kurzinfo: () => {
    const p = offenePosten();
    if (!p.length) return { text: 'Alles bezahlt', ton: 'erfolg' };
    const u = p.filter((r) => istUeberfaellig(r)).length;
    return { text: `${euro(p.reduce((s, r) => s + offenerBetrag(r), 0))} offen${u ? `, ${u} überfällig` : ''}`, ton: u ? 'achtung' : 'aktiv' };
  },
  aktionen: {
    'zahlung.erfassen': (payload) => `/betrieb/zahlungen?rechnung=${(payload as { rechnungId: ID }).rechnungId}`,
    'zahlung.bestaetigen': (payload) => {
      const p = payload as { rechnungId: ID; betrag: Cent; datum: Datum; zweck?: string; name?: string; schluessel: string };
      zahlungBuchen({ rechnungId: p.rechnungId, betrag: p.betrag, datum: p.datum, verwendungszweck: p.zweck, zahler: p.name, quelle: 'kontoauszug' });
      freigabeSchliessen(p.schluessel);
    },
    'zahlung.verwerfen': (payload) => {
      freigabeSchliessen((payload as { schluessel: string }).schluessel);
      return '/betrieb/zahlungen';
    },
  },
  automationen: [
    {
      id: 'zahlungen.status',
      titel: 'Rechnungsstatus nach Zahlungseingang setzen',
      beschreibung: 'Geht Geld ein, setzt Macher die Rechnung auf „teilbezahlt“ oder „bezahlt“ und vermerkt es am Auftrag.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const aus = [
          on('zahlungen.created', (e) => {
            const z = e.objekt as Zahlung | undefined;
            if (!z) return;
            const neu = statusAbgleichen(z.rechnungId);
            const r = rechnungX(z.rechnungId);
            if (r && neu === 'bezahlt') {
              erledigt('zahlungen.status', `${r.nummer} ist bezahlt`, { text: `${db.kunden.get(r.kundeId)?.name ?? ''} · ${euro(z.betrag)}`, bezug: { typ: 'rechnungen', id: r.id } });
            }
          }),
          on('zahlungen.removed', (e) => {
            const z = e.objekt as Zahlung | undefined;
            if (z) statusAbgleichen(z.rechnungId);
          }),
          on('zahlungen.updated', (e) => {
            const z = e.objekt as Zahlung | undefined;
            if (z) statusAbgleichen(z.rechnungId);
          }),
        ];
        return () => aus.forEach((f) => f());
      },
    },
  ],
});
