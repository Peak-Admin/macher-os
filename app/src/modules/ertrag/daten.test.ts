import { describe, expect, it } from 'vitest';
import type { Auftrag, Mitarbeiter, Position, Rechnung, Zeiteintrag } from '@core/objects';
import { leereBasis } from '../kosten/basis';
import { ertraege, ertragJeLeistung, gruppieren, OHNE_LEISTUNG, rechnungBrutto, rechnungNetto, umsatzJeAuftrag } from './daten';

const basis = { id: '', erstelltAm: '', geaendertAm: '' };
const pos = (einzelpreis: number, x: Partial<Position> = {}): Position => ({ id: Math.random().toString(), art: 'leistung', text: 't', menge: 1, einheit: 'Stk', einzelpreis, ...x });
const r = (id: string, x: Partial<Rechnung>): Rechnung => ({ ...basis, id, nummer: id, art: 'rechnung', kundeId: 'k1', titel: '', positionen: [], status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0, ...x });
const auftrag = (id: string, x: Partial<Auftrag> = {}): Auftrag => ({ ...basis, id, nummer: id, titel: id, art: 'projekt', phase: 'erledigt', kundeId: 'k1', ...x });
const ma: Mitarbeiter = { ...basis, id: 'm1', vorname: 'J', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 5000, aktiv: true };
const zeit = (auftragId: string, stunden: number): Zeiteintrag => ({ ...basis, id: Math.random().toString(), mitarbeiterId: 'm1', auftragId, datum: '2026-09-01', start: '06:00', ende: `${String(6 + stunden).padStart(2, '0')}:00`, pauseMinuten: 0, art: 'arbeit' });

describe('Rechnungsbeträge', () => {
  const ab = r('ab', { art: 'abschlag', positionen: [pos(40000)] });
  const schluss = r('s', { art: 'schluss', positionen: [pos(100000)], abzugRechnungIds: ['ab'] });
  const alle = [ab, schluss];
  it('zieht Abschläge in der Schlussrechnung ab', () => {
    expect(rechnungNetto(schluss, alle)).toBe(60000);
    expect(rechnungNetto(ab, alle) + rechnungNetto(schluss, alle)).toBe(100000);
    expect(rechnungBrutto(schluss, alle, 19)).toBe(71400);
  });
  it('zählt Entwürfe und Stornos nicht, Gutschriften negativ', () => {
    expect(rechnungNetto(r('e', { status: 'entwurf', positionen: [pos(100)] }), [])).toBe(0);
    expect(rechnungNetto(r('st', { status: 'storniert', positionen: [pos(100)] }), [])).toBe(0);
    expect(rechnungNetto(r('g', { art: 'gutschrift', positionen: [pos(500)] }), [])).toBe(-500);
  });
});

describe('Ertrag', () => {
  const b = leereBasis({
    mitarbeiter: [ma],
    auftraege: [auftrag('gut', { kundeId: 'k1', art: 'kundendienst' }), auftrag('schlecht', { kundeId: 'k2' }), auftrag('offen', { phase: 'in_arbeit' })],
    zeiten: [zeit('gut', 2), zeit('schlecht', 10), zeit('offen', 3)],
    rechnungen: [
      r('r1', { auftragId: 'gut', positionen: [pos(30000, { leistungId: 'l1' })], datum: '2026-09-05' }),
      r('r2', { auftragId: 'schlecht', positionen: [pos(30000, { leistungId: 'l1' }), pos(10000, { art: 'material' })], datum: '2026-08-05' }),
      r('r3', { positionen: [pos(100)] }),
    ],
  });

  it('rechnet Deckungsbeitrag je Auftrag, beste zuerst', () => {
    const e = ertraege(b);
    expect(e.zeilen.map((z) => [z.auftragId, z.db])).toEqual([
      ['gut', 30000 - 10000],
      ['schlecht', 40000 - 50000],
    ]);
    expect(e.zeilen[0].marge).toBeCloseTo(2 / 3);
    expect(e.ohneRechnung).toBe(0);
    expect(e.laufend).toBe(1);
    expect(e.rechnungenOhneAuftrag).toBe(1);
  });

  it('zählt laufende Aufträge mit Abschlag nicht', () => {
    const c = leereBasis({ ...b, rechnungen: [...b.rechnungen, r('r4', { auftragId: 'offen', art: 'abschlag', positionen: [pos(90000)] })] });
    expect(ertraege(c).zeilen.map((z) => z.auftragId)).not.toContain('offen');
  });

  it('filtert nach Zeitraum (letzte Rechnung)', () => {
    expect(ertraege(b, { von: '2026-09-01', bis: '2026-09-30' }).zeilen.map((z) => z.auftragId)).toEqual(['gut']);
  });

  it('gruppiert je Kunde und Auftragsart', () => {
    const z = ertraege(b).zeilen;
    expect(gruppieren(z, (x) => x.kundeId).map((g) => [g.schluessel, g.db])).toEqual([
      ['k1', 20000],
      ['k2', -10000],
    ]);
    expect(gruppieren(z, (x) => x.art).find((g) => g.schluessel === 'projekt')?.anzahl).toBe(1);
  });

  it('verteilt Kosten anteilig auf Leistungen', () => {
    const g = ertragJeLeistung(ertraege(b).zeilen, b);
    const l1 = g.find((x) => x.schluessel === 'l1')!;
    // gut: 300 € Umsatz, 100 € Kosten; schlecht: 300 € von 400 € → 3/4 der 500 € Kosten = 375 €
    expect(l1.umsatz).toBe(60000);
    expect(l1.kosten).toBe(10000 + 37500);
    expect(l1.anzahl).toBe(2);
    expect(g.find((x) => x.schluessel === OHNE_LEISTUNG)?.kosten).toBe(12500);
  });

  it('summiert Umsatz je Auftrag', () => {
    expect(umsatzJeAuftrag(b).get('gut')?.netto).toBe(30000);
  });
});
