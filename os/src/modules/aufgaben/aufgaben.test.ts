import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Aufgabe } from '@core/objects';
import { gruppeVon, gruppiere, sortiere } from './logik';
import { abhaken, aufgabenZumAuftragSchliessen } from './daten';

const a = (x: Partial<Aufgabe>): Aufgabe => ({ id: Math.random().toString(), erstelltAm: '2026-01-01', geaendertAm: '2026-01-01', titel: 't', erledigt: false, prioritaet: 'normal', ...x });

describe('Aufgaben', () => {
  const h = '2026-10-02';
  it('gruppiert nach Fälligkeit', () => {
    expect(gruppeVon(a({ faellig: '2026-10-01' }), h)).toBe('ueberfaellig');
    expect(gruppeVon(a({ faellig: h }), h)).toBe('heute');
    expect(gruppeVon(a({ faellig: '2026-10-09' }), h)).toBe('demnaechst');
    expect(gruppeVon(a({ faellig: '2026-10-10' }), h)).toBe('spaeter');
    expect(gruppeVon(a({}), h)).toBe('ohne');
    expect(gruppeVon(a({ erledigt: true, faellig: '2026-01-01' }), h)).toBe('erledigt');
    expect(gruppiere([a({ faellig: h }), a({})], h).map((g) => g.gruppe)).toEqual(['heute', 'ohne']);
  });
  it('sortiert Wichtiges und Fälliges nach vorn', () => {
    const l = sortiere([a({ titel: 'spät', faellig: '2026-12-01' }), a({ titel: 'wichtig', prioritaet: 'hoch' }), a({ titel: 'früh', faellig: '2026-10-03' })]);
    expect(l.map((x) => x.titel)).toEqual(['wichtig', 'früh', 'spät']);
  });

  describe('mit Datenschicht', () => {
    beforeEach(() => zuruecksetzen());
    it('hakt ab und öffnet wieder', () => {
      const x = db.aufgaben.create({ titel: 'X', erledigt: false, prioritaet: 'normal' });
      expect(abhaken(x.id, true)?.erledigtAm).toBeTruthy();
      expect(abhaken(x.id, false)?.erledigtAm).toBeUndefined();
    });
    it('schließt nur automatische Aufgaben mit dem Auftrag', () => {
      const au = db.auftraege.create({ nummer: 'A', titel: 'A', art: 'projekt', phase: 'erledigt', kundeId: 'k' });
      const auto = db.aufgaben.create({ titel: 'Auto', auftragId: au.id, erledigt: false, prioritaet: 'normal', quelle: 'auftrag' });
      const eigen = db.aufgaben.create({ titel: 'Eigen', auftragId: au.id, erledigt: false, prioritaet: 'normal', quelle: 'manuell' });
      expect(aufgabenZumAuftragSchliessen(au.id)).toHaveLength(1);
      expect(db.aufgaben.get(auto.id)?.erledigt).toBe(true);
      expect(db.aufgaben.get(eigen.id)?.erledigt).toBe(false);
    });
  });
});
