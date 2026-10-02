import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Nachweis } from '@core/objects';
import { ablaufStufe, aktuellerNachweis, gueltigBisAus, hatGueltig, nachweisStatus, statusAnzeige } from './daten';
import { gueltigkeitErgaenzen, qualiHinweise } from './logik';

const n = (x: Partial<Nachweis>): Nachweis => ({ id: Math.random().toString(), erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm1', qualifikationId: 'q1', ...x }) as Nachweis;

describe('Gültigkeit', () => {
  it('rechnet Monate korrekt, auch am Monatsende', () => {
    expect(gueltigBisAus('2026-03-15', 24)).toBe('2028-03-15');
    expect(gueltigBisAus('2026-01-31', 1)).toBe('2026-02-28');
    expect(gueltigBisAus('2026-01-31', undefined)).toBeUndefined();
  });

  it('stuft Ablauf 60/30/0 Tage ein', () => {
    const heute = '2026-10-02';
    expect(ablaufStufe(n({ gueltigBis: '2027-01-01' }), heute)).toBeUndefined();
    expect(ablaufStufe(n({ gueltigBis: '2026-11-20' }), heute)).toBe(60);
    expect(ablaufStufe(n({ gueltigBis: '2026-10-20' }), heute)).toBe(30);
    expect(ablaufStufe(n({ gueltigBis: '2026-10-01' }), heute)).toBe(0);
    expect(ablaufStufe(n({}), heute)).toBeUndefined();
    expect(nachweisStatus(n({}), heute)).toBe('unbefristet');
    expect(statusAnzeige(n({ gueltigBis: '2026-10-14' }), heute)).toEqual({ text: 'Läuft in 12 Tagen ab', ton: 'achtung' });
  });

  it('nimmt den aktuellsten Nachweis (unbefristet gewinnt)', () => {
    const liste = [n({ id: 'alt', gueltigBis: '2025-01-01' }), n({ id: 'neu', gueltigBis: '2027-01-01' })];
    expect(aktuellerNachweis(liste, 'm1', 'q1')?.id).toBe('neu');
    expect(aktuellerNachweis([...liste, n({ id: 'immer' })], 'm1', 'q1')?.id).toBe('immer');
    expect(hatGueltig(liste, 'm1', 'q1', '2026-10-02')).toBe(true);
    expect(hatGueltig([liste[0]], 'm1', 'q1', '2026-10-02')).toBe(false);
  });
});

describe('Hinweise & Automation', () => {
  beforeEach(() => zuruecksetzen());

  it('ergänzt Gültig-bis und meldet Ablauf mit Aktion „Schulung planen“', () => {
    const m = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    const q = db.qualifikationen.create({ name: 'Erste Hilfe', kategorie: 'pflicht', gueltigMonate: 24 });
    const x = db.nachweise.create({ mitarbeiterId: m.id, qualifikationId: q.id, erworbenAm: '2024-10-20' });
    expect(gueltigkeitErgaenzen(x)).toBe(true);
    expect(db.nachweise.get(x.id)?.gueltigBis).toBe('2026-10-20');
    const h = qualiHinweise('2026-10-02');
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ schluessel: `quali-ablauf:${x.id}:30`, gewicht: 55 });
    expect(h[0].aktionen?.[0].aktion).toBe('schulung.planen');
  });
});
