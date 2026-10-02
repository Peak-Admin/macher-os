import { describe, expect, it } from 'vitest';
import { benoetigteQualifikationen, hatGueltigenNachweis, pruefeQualifikation, qualifizierteErsatzleute } from './daten';
import { auftrag, ctx, ma, MO, nachweis, termin } from '../autoplanung/testhilfe';

const basisCtx = () =>
  ctx({
    mitarbeiter: [ma('jonas'), ma('mehmet'), ma('lukas', { rolle: 'azubi' }), ma('sandra', { rolle: 'buero' })],
    auftraege: [auftrag('a1', { qualifikationIds: ['q1'] })],
    nachweise: [nachweis('mehmet', 'q1'), nachweis('sandra', 'q1')],
  });

describe('Qualifikation bei der Planung', () => {
  it('sammelt Qualifikationen aus Auftrag und Leistungen ohne Doppelte', () => {
    const c = ctx({
      qualifikationen: [
        { id: 'q1', name: 'A', kategorie: 'fachlich', erstelltAm: '', geaendertAm: '' },
        { id: 'q2', name: 'B', kategorie: 'pflicht', erstelltAm: '', geaendertAm: '' },
      ],
      leistungen: [{ id: 'l1', name: 'L', einheit: 'Stk', preis: 0, aktiv: true, qualifikationIds: ['q1', 'q2'], erstelltAm: '', geaendertAm: '' }],
    });
    expect(benoetigteQualifikationen(c, auftrag('a', { qualifikationIds: ['q1'], leistungIds: ['l1'] })).sort()).toEqual(['q1', 'q2']);
    expect(benoetigteQualifikationen(c, auftrag('a'))).toEqual([]);
  });

  it('beachtet das Ablaufdatum am Termintag', () => {
    const c = ctx({ nachweise: [nachweis('jonas', 'q1', '2026-10-06')] });
    expect(hatGueltigenNachweis(c, 'jonas', 'q1', '2026-10-06')).toBe(true);
    expect(hatGueltigenNachweis(c, 'jonas', 'q1', '2026-10-07')).toBe(false);
  });

  it('ist ok, wenn eine Person im Team die Qualifikation hat', () => {
    const c = basisCtx();
    const t = termin('t1', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas', 'mehmet'] });
    const r = pruefeQualifikation(c, t);
    expect(r).toHaveLength(1);
    expect(r[0].ergebnis).toBe('ok');
  });

  it('meldet ein Problem und schlägt qualifizierte, freie Leute vor (kein Büro, kein Azubi)', () => {
    const c = basisCtx();
    const t = termin('t1', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] });
    const [r] = pruefeQualifikation(c, t);
    expect(r.ergebnis).toBe('problem');
    expect(r.text).toContain('Elektrofachkraft');
    expect(r.loesung).toContain('mehmet');
    expect(r.loesung).not.toContain('sandra');
  });

  it('nennt den abgelaufenen Nachweis', () => {
    const c = basisCtx();
    c.nachweise.push(nachweis('jonas', 'q1', '2026-09-30'));
    const [r] = pruefeQualifikation(c, termin('t1', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] }));
    expect(r.ergebnis).toBe('problem');
    expect(r.text).toContain('abgelaufen am 30.09.2026');
  });

  it('schlägt niemanden vor, der zur Zeit verplant oder abwesend ist', () => {
    const c = basisCtx();
    c.termine.push(termin('anders', MO, '10:00', '11:00', { mitarbeiterIds: ['mehmet'] }));
    const t = termin('t1', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] });
    expect(qualifizierteErsatzleute(c, t, ['q1'])).toEqual([]);
    const [r] = pruefeQualifikation(c, t);
    expect(r.loesung).toContain('Niemand Qualifiziertes');

    const c2 = basisCtx();
    c2.abwesenheiten.push({ id: 'u', mitarbeiterId: 'mehmet', art: 'urlaub', von: MO, bis: MO, status: 'genehmigt', erstelltAm: '', geaendertAm: '' });
    expect(qualifizierteErsatzleute(c2, t, ['q1'])).toEqual([]);
  });

  it('ist ok ohne Anforderungen und warnt ohne eingeplante Person', () => {
    const c = basisCtx();
    expect(pruefeQualifikation(c, termin('t', MO, '08:00', '09:00'))[0].ergebnis).toBe('ok');
    expect(pruefeQualifikation(c, termin('t', MO, '08:00', '09:00', { auftragId: 'a1' }))[0].ergebnis).toBe('warnung');
  });
});
