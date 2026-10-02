import { describe, expect, test } from 'vitest';
import { eingabePruefen, sichtGueltig } from './oeffentlich';

const token = 'abcdefghijklmnopqrstuvwx';

describe('Öffentliche Links: Sicht ausliefern', () => {
  const sicht = { art: 'portal' as const, token, gueltigBis: '2026-12-31', sicht: {} };
  const jetzt = new Date('2026-10-02T10:00:00Z');
  test('gültig, abgelaufen, gesperrt, falsche Art', () => {
    expect(sichtGueltig(sicht, 'portal', undefined, jetzt)).toBe(true);
    expect(sichtGueltig({ ...sicht, gueltigBis: '2026-10-01' }, 'portal', undefined, jetzt)).toBe(false);
    expect(sichtGueltig({ ...sicht, widerrufen: true }, 'portal', undefined, jetzt)).toBe(false);
    expect(sichtGueltig(sicht, 'buchung', undefined, jetzt)).toBe(false);
    expect(sichtGueltig(undefined, 'portal', undefined, jetzt)).toBe(false);
  });
  test('Eintrag in oeffentliche_links hat Vorrang beim Ablauf', () => {
    expect(sichtGueltig(sicht, 'portal', { token, betrieb_id: 'b', art: 'portal', gueltig_bis: '2026-09-01T00:00:00Z' }, jetzt)).toBe(false);
  });
});

describe('Öffentliche Links: Eingaben vom Kunden', () => {
  test('Nachricht, Angebot, Buchung werden geprüft und gekürzt', () => {
    expect(eingabePruefen({ art: 'portal', token, typ: 'nachricht', daten: { text: 'Hallo', boese: 'x' } })).toEqual({ ok: true, eingabe: { art: 'portal', token, typ: 'nachricht', daten: { text: 'Hallo', auftragId: undefined } } });
    expect(eingabePruefen({ art: 'portal', token, typ: 'angebot', daten: { angebotId: 'a', entscheidung: 'angenommen', name: 'Petra' } })).toMatchObject({ ok: false });
    expect(eingabePruefen({ art: 'portal', token, typ: 'angebot', daten: { angebotId: 'a', entscheidung: 'angenommen', name: 'Petra Schulz' } }).ok).toBe(true);
    expect(eingabePruefen({ art: 'buchung', token, typ: 'buchung', daten: { fensterId: 'f', start: '2026-10-05T08:00:00Z', name: 'Jan', telefon: '0171 234567' } }).ok).toBe(true);
    expect(eingabePruefen({ art: 'buchung', token, typ: 'buchung', daten: { fensterId: 'f', start: 'morgen', name: 'Jan', telefon: '0171 234567' } }).ok).toBe(false);
  });
  test('falsche Art/Typ-Kombination oder kaputtes Token', () => {
    expect(eingabePruefen({ art: 'buchung', token, typ: 'angebot', daten: {} }).ok).toBe(false);
    expect(eingabePruefen({ art: 'portal', token: 'kurz', typ: 'geoeffnet' }).ok).toBe(false);
    expect(eingabePruefen({ art: 'portal', token, typ: 'geoeffnet', daten: { bezug: 'angebote:a1' } })).toMatchObject({ ok: true, eingabe: { daten: { bezug: 'angebote:a1' } } });
  });
});
