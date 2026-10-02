import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { aufmasse, neueZeile } from '@modules/aufmass/daten';
import { inAngebotUebernehmen } from '@modules/aufmass/uebernahme';
import { kalkulationen } from './daten';
import { kalkulationUebernehmen, zeilenAusAufmass } from './uebernahme';

describe('Aufmaß → Kalkulation → Angebot', () => {
  let auftragId = '';
  let aufmassId = '';
  beforeEach(() => {
    zuruecksetzen();
    const k = db.kunden.create({ art: 'privat', name: 'Hartmann', ansprechpartner: [] });
    const l = db.leistungen.create({ name: 'Steckdose setzen', einheit: 'Stk', preis: 4500, minuten: 30, aktiv: true });
    auftragId = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'besichtigung', kundeId: k.id }).id;
    aufmassId = aufmasse.create({ auftragId, titel: 'Aufmaß', datum: '2026-10-02', raeume: [{ id: 'r', name: 'Bad', zeilen: [{ ...neueZeile(), art: 'stueck', anzahl: 6, leistungId: l.id }] }] }).id;
  });

  it('übernimmt ein Aufmaß zweimal ohne doppelte Positionen', () => {
    inAngebotUebernehmen(aufmassId);
    const ang = inAngebotUebernehmen(aufmassId)!;
    expect(ang.positionen).toHaveLength(1);
    expect(db.angebote.where((a) => a.auftragId === auftragId)).toHaveLength(1);
  });

  it('Kalkulation aus dem Aufmaß ersetzt dessen Positionen im Angebot', () => {
    inAngebotUebernehmen(aufmassId);
    const { zeilen, aufmassIds } = zeilenAusAufmass(auftragId);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]).toMatchObject({ menge: 6, minuten: 30 });
    const k = kalkulationen.create({ auftragId, titel: 'K', zeilen, ausAufmassIds: aufmassIds, lohnkosten: 4000, gemeinkostenProzent: 50, materialZuschlagProzent: 0, wagnisGewinnProzent: 10 });
    kalkulationUebernehmen(k.id);
    const ang = kalkulationUebernehmen(k.id)!;
    expect(ang.positionen).toHaveLength(1);
    // 6 × 0,5 h × 40 € = 120 € + 60 € GK = 180 € + 10 % = 198 € → 33 € je Stück
    expect(ang.positionen[0]).toMatchObject({ menge: 6, einzelpreis: 3300 });
  });
});
