import { describe, expect, it } from 'vitest';
import { kostenSumme, nachweisStatus, subHinweise, subStatus, type Subunternehmer } from './daten';

const HEUTE = '2026-10-02';
const sub = (x: Partial<Subunternehmer>): Subunternehmer => ({
  id: 's1', erstelltAm: '', geaendertAm: '', lieferantId: 'l1', gewerk: 'Gerüstbau', nachweise: [], einsaetze: [], aktiv: true, ...x,
});
const einsatz = { id: 'e1', auftragId: 'a1', von: HEUTE, leistung: 'Gerüst', status: 'geplant' as const, kosten: 150000 };

describe('Nachweise', () => {
  it('erkennt gültig, bald ablaufend, abgelaufen', () => {
    expect(nachweisStatus({ id: 'n', art: 'haftpflicht', gueltigBis: '2027-01-01' }, HEUTE)).toBe('gueltig');
    expect(nachweisStatus({ id: 'n', art: 'haftpflicht', gueltigBis: '2026-10-20' }, HEUTE)).toBe('laeuft_ab');
    expect(nachweisStatus({ id: 'n', art: 'haftpflicht', gueltigBis: '2026-10-01' }, HEUTE)).toBe('abgelaufen');
    expect(nachweisStatus({ id: 'n', art: 'haftpflicht' }, HEUTE)).toBe('ohne_datum');
  });
  it('nimmt den neuesten Nachweis einer Art', () => {
    const s = sub({ nachweise: [
      { id: 'alt', art: 'freistellung_48b', gueltigBis: '2026-01-01' },
      { id: 'neu', art: 'freistellung_48b', gueltigBis: '2027-12-31' },
    ] });
    expect(subStatus(s, HEUTE)).toEqual({ text: 'Nachweise in Ordnung', ton: 'erfolg' });
  });
  it('meldet fehlende Freistellung als Erstes', () => {
    expect(subStatus(sub({}), HEUTE).text).toBe('Freistellung fehlt');
  });
});

describe('Hinweise', () => {
  const name = () => 'Gerüstbau Krause';
  it('warnt bei fehlender Freistellung nur, wenn ein Einsatz offen ist', () => {
    expect(subHinweise([sub({})], name, HEUTE)).toEqual([]);
    const h = subHinweise([sub({ einsaetze: [einsatz] })], name, HEUTE);
    expect(h).toHaveLength(1);
    expect(h[0].gewicht).toBe(80);
    expect(h[0].titel).toBe('Freistellungsbescheinigung von Gerüstbau Krause fehlt');
  });
  it('kündigt Ablauf an', () => {
    const h = subHinweise([sub({ nachweise: [{ id: 'n', art: 'freistellung_48b', gueltigBis: '2026-10-12' }] })], name, HEUTE);
    expect(h.map((x) => x.titel)).toEqual(['Freistellungsbescheinigung § 48b EStG von Gerüstbau Krause läuft in 10 Tagen ab']);
  });
  it('ignoriert inaktive Subunternehmer', () => {
    expect(subHinweise([sub({ aktiv: false, einsaetze: [einsatz] })], name, HEUTE)).toEqual([]);
  });
  it('summiert Kosten', () => {
    expect(kostenSumme([einsatz, { ...einsatz, id: 'e2', kosten: undefined }, { ...einsatz, id: 'e3', kosten: 5000 }])).toBe(155000);
  });
});
