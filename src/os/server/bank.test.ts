import { describe, expect, it } from 'vitest';
import { centAusBetrag, eingangLesen, transaktionLesen, umsatzZeilen } from './bank';
import { gleich, hmacSha256Hex, signaturPruefen, webhookSignatur } from './signatur';

describe('Bank-Eingang', () => {
  it('liest das eigene Format und PSD2-Felder, nur Eingänge in Euro', () => {
    const e = eingangLesen({
      transaktionen: [
        { id: 'tx-1', datum: '2026-10-02', betrag: 119, name: 'Familie Hoffmann', iban: 'DE89 3704 0044 0532 0130 00', zweck: 'RE 2026 42' },
        { transactionId: 'tx-2', bookingDate: '2026-10-02', transactionAmount: { amount: '238.00', currency: 'EUR' }, debtorName: 'Sommer KG', debtorAccount: { iban: 'DE02120300000000202051' }, remittanceInformationUnstructured: ['R-2026-00', '43'] },
        { id: 'tx-3', datum: '2026-10-02', betrag: -89, zweck: 'Strom' },
        { id: 'tx-4', datum: '2026-10-02', betrag: '50,00', creditDebitIndicator: 'DBIT' },
        { id: 'tx-5', datum: '2026-10-02', amount: { amount: 10, currency: 'USD' } },
        { datum: '2026-10-02', betrag: 10 },
      ],
    })!;
    expect(e.uebersprungen).toBe(4);
    expect(e.liste).toEqual([
      { referenz: 'bank:tx-1', datum: '2026-10-02', betrag: 11900, name: 'Familie Hoffmann', iban: 'DE89370400440532013000', zweck: 'RE 2026 42' },
      { referenz: 'bank:tx-2', datum: '2026-10-02', betrag: 23800, name: 'Sommer KG', iban: 'DE02120300000000202051', zweck: 'R-2026-0043' },
    ]);
    expect(eingangLesen('quatsch')).toBeUndefined();
    expect(eingangLesen({ nichts: [] })).toBeUndefined();
  });

  it('Beträge in deutscher und englischer Schreibweise', () => {
    expect(centAusBetrag('1.190,50')).toBe(119050);
    expect(centAusBetrag('1,190.50')).toBe(119050);
    expect(centAusBetrag(12.3)).toBe(1230);
    expect(centAusBetrag('x')).toBeUndefined();
    expect(transaktionLesen({ id: 'a', datum: 'gestern', betrag: 1 })).toBeUndefined();
  });

  it('baut Objekt-Zeilen ohne Dubletten', () => {
    const liste = eingangLesen([{ id: 'a', datum: '2026-10-02', betrag: 1 }, { id: 'b', datum: '2026-10-02', betrag: 2 }, { id: 'a', datum: '2026-10-02', betrag: 1 }])!.liste;
    let n = 0;
    const z = umsatzZeilen('betrieb-1', liste, new Set(['bank:b']), () => `id-${++n}`, '2026-10-02T00:00:00Z');
    expect(z).toHaveLength(1);
    expect(z[0]).toMatchObject({ betrieb_id: 'betrieb-1', sammlung: 'bankumsaetze', id: 'id-1', daten: { referenz: 'bank:a', status: 'neu', quelle: 'bank', betrag: 100 } });
  });
});

describe('Signatur', () => {
  it('HMAC-SHA256 nach RFC-Beispiel', async () => {
    expect(await hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  });

  it('prüft eingehende Signaturen', async () => {
    const kopf = await webhookSignatur('geheim', '{"a":1}');
    expect(kopf.startsWith('sha256=')).toBe(true);
    expect(await signaturPruefen('geheim', '{"a":1}', kopf)).toBe(true);
    expect(await signaturPruefen('geheim', '{"a":1}', kopf.slice(7))).toBe(true);
    expect(await signaturPruefen('geheim', '{"a":2}', kopf)).toBe(false);
    expect(await signaturPruefen('anders', '{"a":1}', kopf)).toBe(false);
    expect(await signaturPruefen('geheim', '{"a":1}', null)).toBe(false);
    expect(gleich('abc', 'abd')).toBe(false);
  });
});
