import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { faelligkeit, plusMonate, pruefhistorie, pruefungDokumentieren, standardIntervall } from './daten';

describe('Prüfungen', () => {
  beforeEach(() => zuruecksetzen());

  it('rechnet Monate sauber', () => {
    expect(plusMonate('2026-01-31', 1)).toBe('2026-02-28');
    expect(plusMonate('2026-10-02', 12)).toBe('2027-10-02');
    expect(plusMonate('2026-10-02', 24)).toBe('2028-10-02');
  });

  it('stuft Fälligkeit ein', () => {
    const b = (d: string) => ({ naechstePruefung: d }) as never;
    expect(faelligkeit(b('2026-09-30'), '2026-10-02').stufe).toBe('ueberfaellig');
    expect(faelligkeit(b('2026-10-02'), '2026-10-02').stufe).toBe('tage14');
    expect(faelligkeit(b('2026-10-16'), '2026-10-02').stufe).toBe('tage14');
    expect(faelligkeit(b('2026-10-17'), '2026-10-02').stufe).toBe('tage30');
    expect(faelligkeit(b('2026-11-01'), '2026-10-02').stufe).toBe('tage30');
    expect(faelligkeit(b('2026-11-02'), '2026-10-02').stufe).toBe('ok');
    expect(faelligkeit({} as never).stufe).toBe('keine');
  });

  it('kennt Standardintervalle', () => {
    expect(standardIntervall('TÜV/HU')).toBe(24);
    expect(standardIntervall('DGUV V3')).toBe(12);
    expect(standardIntervall('irgendwas')).toBe(12);
  });

  it('dokumentiert Prüfung und setzt nächste Frist', () => {
    const b = db.betriebsmittel.create({ art: 'maschine', name: 'Bohrhammer', status: 'verfuegbar', pruefungArt: 'DGUV V3', naechstePruefung: '2026-09-01' });
    expect(pruefungDokumentieren(b.id, { datum: '2026-10-02', ergebnis: 'bestanden', pruefer: 'Elektro Meier' })).toBe('2027-10-02');
    expect(db.betriebsmittel.get(b.id)!.naechstePruefung).toBe('2027-10-02');
    const h = pruefhistorie(b.id);
    expect(h).toHaveLength(1);
    expect(h[0].pruefer).toBe('Elektro Meier');
  });

  it('nicht bestanden → defekt; eigenes Intervall wird gemerkt', () => {
    const b = db.betriebsmittel.create({ art: 'werkzeug', name: 'Kabeltrommel', status: 'verfuegbar', pruefungArt: 'DGUV V3' });
    pruefungDokumentieren(b.id, { datum: '2026-10-02', ergebnis: 'nicht_bestanden', pruefer: 'X', intervallMonate: 6 });
    const neu = db.betriebsmittel.get(b.id)! as { status: string; naechstePruefung?: string; pruefIntervallMonate?: number };
    expect(neu.status).toBe('defekt');
    expect(neu.naechstePruefung).toBe('2027-04-02');
    expect(neu.pruefIntervallMonate).toBe(6);
  });
});
