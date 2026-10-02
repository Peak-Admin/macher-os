import { describe, expect, it } from 'vitest';
import { buendeln, type OffenerHinweis } from './macher';

const h = (schluessel: string, gewicht: number, id?: string, aktionen: OffenerHinweis['aktionen'] = []): OffenerHinweis => ({
  schluessel,
  art: 'problem',
  titel: schluessel,
  gewicht,
  bezug: id ? { typ: 'auftraege', id } : undefined,
  aktionen,
});

describe('Hinweise bündeln', () => {
  it('fasst Hinweise zum selben Objekt zusammen, der wichtigste führt', () => {
    const r = buendeln([
      h('a', 50, 'x', [{ aktion: 'plan.einplanen', label: 'Einplanen', primaer: true }]),
      h('b', 80, 'x', [{ aktion: 'plan.vorschlag', label: 'So einplanen', primaer: true }]),
      h('c', 70, 'y'),
      h('d', 40),
    ]);
    expect(r.map((x) => x.schluessel)).toEqual(['b', 'c', 'd']);
    expect(r[0].weitere?.map((x) => x.schluessel)).toEqual(['a']);
    expect(r[0].aktionen?.map((a) => a.label)).toEqual(['So einplanen', 'Einplanen']);
    expect(r[0].aktionen?.[1].primaer).toBe(false);
  });
});
