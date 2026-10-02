import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Materialbuchung } from '@core/objects';
import { alsPositionen, inRechnung, naechsterStatus, offenFuerRechnung, summeEk } from './logik';
import { zahlAus } from '@ui/index';
import { materialAbrechnen, materialAusAngebot, materialFuerRechnung } from './daten';

const b = (x: Partial<Materialbuchung>): Materialbuchung => ({ id: Math.random().toString(36).slice(2), erstelltAm: '', geaendertAm: '', auftragId: 'a', text: 'Kabel', menge: 10, einheit: 'm', ek: 62, status: 'verbraucht', ...x });

describe('Material am Auftrag', () => {
  it('rechnet EK in Cent und nach Status', () => {
    const l = [b({ menge: 2.5, ek: 199 }), b({ status: 'geplant', menge: 1, ek: 1000 })];
    expect(summeEk(l)).toBe(498 + 1000);
    expect(summeEk(l, 'verbraucht')).toBe(498);
  });
  it('kennt den nächsten Status und Mengen mit Komma', () => {
    expect(naechsterStatus('geplant')).toBe('bestellt');
    expect(naechsterStatus('verbraucht')).toBeUndefined();
    expect(zahlAus('2,5')).toBe(2.5);
  });
  it('macht nur offenes, verbrauchtes Material zu Rechnungspositionen', () => {
    const l = [b({ id: '1', artikelId: 'art' }), b({ id: '2', abgerechnetIn: 'r' }), b({ id: '3', status: 'bereit' }), b({ id: '4', text: 'Freitext', ek: 1000, menge: 1 })];
    const p = alsPositionen(l, (id) => (id === 'art' ? ({ vk: 110 } as never) : undefined), 20);
    expect(p.map((x) => [x.id, x.einzelpreis])).toEqual([
      ['mat_1', 110],
      ['mat_4', 1200],
    ]);
    expect(offenFuerRechnung(l[1])).toBe(false);
    expect(inRechnung(l, [{ id: 'x', text: 'freitext ' }]).map((x) => x.id)).toEqual(['4']);
  });

  describe('mit Datenschicht', () => {
    beforeEach(() => zuruecksetzen());
    it('plant Material aus angenommenem Angebot (Artikel + Leistungsmaterial), ohne Doppelte', () => {
      const art = db.artikel.create({ name: 'Dose', einheit: 'Stk', ek: 45, vk: 120, aktiv: true });
      const l = db.leistungen.create({ name: 'Steckdose setzen', einheit: 'Stk', preis: 6900, aktiv: true, material: [{ artikelId: art.id, menge: 1 }] });
      const an = db.angebote.create({ nummer: 'AN', auftragId: 'a1', kundeId: 'k', titel: '', positionen: [{ id: 'p', art: 'leistung', text: 'Steckdose', menge: 4, einheit: 'Stk', einzelpreis: 6900, leistungId: l.id }], status: 'angenommen', datum: '', gueltigBis: '', version: 1 });
      const neu = materialAusAngebot(an);
      expect(neu).toHaveLength(1);
      expect(neu[0]).toMatchObject({ artikelId: art.id, menge: 4, status: 'geplant', ek: 45 });
      expect(materialAusAngebot(an)).toHaveLength(0);
    });
    it('markiert Material als abgerechnet, wenn es auf der Rechnung steht', () => {
      const x = db.material.create({ auftragId: 'a1', text: 'Kabel', menge: 5, einheit: 'm', ek: 62, status: 'verbraucht' });
      db.material.create({ auftragId: 'a1', text: 'Anderes', menge: 1, einheit: 'Stk', ek: 100, status: 'verbraucht' });
      const pos = materialFuerRechnung('a1');
      expect(pos).toHaveLength(2);
      const n = materialAbrechnen({ id: 'r1', auftragId: 'a1', positionen: [pos[0]] });
      expect(n.map((m) => m.id)).toEqual([x.id]);
      expect(db.material.get(x.id)?.abgerechnetIn).toBe('r1');
      expect(materialFuerRechnung('a1')).toHaveLength(1);
    });
  });
});
