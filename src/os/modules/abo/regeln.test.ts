import { describe, expect, test } from 'vitest';
import {
  PLAENE,
  abbuchungCent,
  aktivePersonen,
  bilanz,
  bilanzText,
  buchbar,
  jahresRabattProzent,
  mahnstufe,
  planFuer,
  planKodieren,
  planLesen,
  plusTage,
  schreibGrund,
  testBisAus,
  wertspitze,
  zustand,
} from './regeln';

describe('Planwahl nach Teamgröße', () => {
  test('kleinster passender Plan', () => {
    expect(planFuer(1).id).toBe('solo');
    expect(planFuer(2).id).toBe('solo');
    expect(planFuer(3).id).toBe('team');
    expect(planFuer(10).id).toBe('team');
    expect(planFuer(11).id).toBe('betrieb');
    expect(planFuer(30).id).toBe('betrieb');
    expect(planFuer(31).id).toBe('unternehmen');
  });

  test('aktive Leute ohne Papierkorb, Beispiele und Ausgeschiedene – mindestens 1', () => {
    expect(aktivePersonen([])).toBe(1);
    expect(
      aktivePersonen([{ aktiv: true }, { aktiv: true }, { aktiv: false }, { aktiv: true, beispiel: true }, { aktiv: true, geloeschtAm: '2026-01-01' }]),
    ).toBe(2);
  });

  test('Preise: monatlich, jährlich, auf Anfrage', () => {
    const team = PLAENE.find((p) => p.id === 'team')!;
    expect(abbuchungCent(team, 'monat')).toBe(8900);
    expect(abbuchungCent(team, 'jahr')).toBe(7400 * 12);
    expect(jahresRabattProzent(team)).toBe(17);
    expect(buchbar(PLAENE.find((p) => p.id === 'unternehmen')!)).toBe(false);
  });
});

describe('Testphase', () => {
  test('30 Tage ab Einrichtung, letzter Tag einschließlich', () => {
    expect(testBisAus('2026-10-02T08:00:00.000Z')).toBe('2026-11-01');
    expect(zustand({ plan: 'test', testBis: '2026-11-01' }, '2026-10-02')).toMatchObject({ status: 'test', tag: 0, tageUebrig: 30 });
    expect(zustand({ plan: 'test', testBis: '2026-11-01' }, '2026-11-01')).toMatchObject({ status: 'test', tag: 30, tageUebrig: 0 });
    expect(zustand({ plan: 'test', testBis: '2026-11-01' }, '2026-11-02')).toMatchObject({ status: 'lesemodus', grund: 'test_abgelaufen' });
  });

  test('Wertspitzen an Tag 21, 27 und 30 – sonst still', () => {
    const am = (tag: number) => wertspitze(zustand({ plan: 'test', testBis: '2026-11-01' }, plusTage('2026-10-02', tag)));
    expect(am(0)).toBeUndefined();
    expect(am(20)).toBeUndefined();
    expect(am(21)).toBe(21);
    expect(am(26)).toBe(21);
    expect(am(27)).toBe(27);
    expect(am(29)).toBe(27);
    expect(am(30)).toBe(30);
    expect(wertspitze(zustand({ plan: 'team' }, '2026-11-01'))).toBeUndefined();
  });
});

describe('Zustände', () => {
  test('Kodierung im Datenvertrag hin und zurück', () => {
    expect(planKodieren('team')).toBe('team');
    expect(planKodieren('team', 'zahlung_offen', '2026-10-01')).toBe('team:zahlung_offen:2026-10-01');
    expect(planLesen('team:gekuendigt:2026-11-30')).toEqual({ planId: 'team', status: 'gekuendigt', datum: '2026-11-30' });
    expect(planLesen('quatsch')).toEqual({ test: true });
    expect(planLesen(undefined)).toEqual({ test: true });
    expect(planLesen('lesemodus')).toEqual({ beendet: true });
  });

  test('aktiv', () => {
    expect(zustand({ plan: 'betrieb' }, '2026-10-02')).toEqual({ status: 'aktiv', planId: 'betrieb' });
  });

  test('Zahlung offen: drei freundliche Stufen, 14 Tage Kulanz, dann Lesemodus', () => {
    const plan = planKodieren('team', 'zahlung_offen', '2026-10-01');
    expect(zustand({ plan }, '2026-10-01')).toMatchObject({ status: 'zahlung_offen', mahnstufe: 1, kulanzBis: '2026-10-14', tageUebrig: 13 });
    expect(zustand({ plan }, '2026-10-06')).toMatchObject({ mahnstufe: 2 });
    expect(zustand({ plan }, '2026-10-11')).toMatchObject({ mahnstufe: 3 });
    expect(zustand({ plan }, '2026-10-14')).toMatchObject({ status: 'zahlung_offen', tageUebrig: 0 });
    expect(zustand({ plan }, '2026-10-15')).toMatchObject({ status: 'lesemodus', grund: 'zahlung' });
    expect(mahnstufe('2026-10-01', '2026-10-04')).toBe(1);
  });

  test('gekündigt läuft bis zum Ende, danach lesbar', () => {
    const plan = planKodieren('solo', 'gekuendigt', '2026-10-31');
    expect(zustand({ plan }, '2026-10-31')).toMatchObject({ status: 'gekuendigt', aktivBis: '2026-10-31' });
    expect(zustand({ plan }, '2026-11-01')).toMatchObject({ status: 'lesemodus', grund: 'beendet' });
    expect(zustand({ plan: 'lesemodus' }, '2026-11-01')).toMatchObject({ status: 'lesemodus', grund: 'beendet' });
  });
});

describe('Lesemodus', () => {
  const lesen = zustand({ plan: 'test', testBis: '2026-10-01' }, '2026-10-02');
  test('außerhalb des Lesemodus ist alles frei', () => {
    expect(schreibGrund('kunden', zustand({ plan: 'team' }, '2026-10-02'), 'anlegen')).toBeUndefined();
    expect(schreibGrund('kunden', zustand({ plan: 'team:zahlung_offen:2026-10-01' }, '2026-10-02'), 'anlegen')).toBeUndefined();
  });
  test('Neues anlegen und Ändern gesperrt', () => {
    expect(schreibGrund('kunden', lesen, 'anlegen')).toMatch(/Testphase ist vorbei/);
    expect(schreibGrund('kunden', lesen, 'aendern')).toBeTruthy();
    expect(schreibGrund('rechnungen', lesen, 'anlegen')).toBeTruthy();
  });
  test('ohne Bezahlmöglichkeit wird niemand ausgesperrt', () => {
    expect(schreibGrund('kunden', { ...lesen, durchgesetzt: false }, 'anlegen')).toBeUndefined();
    expect(schreibGrund('kunden', { ...lesen, durchgesetzt: true }, 'anlegen')).toBeTruthy();
  });
  test('Systemsammlungen, laufende Vorgänge und Kundenbereich bleiben frei', () => {
    for (const s of ['ereignisse', 'einstellungen', 'benachrichtigungen', 'erledigungen', 'hinweise', 'chat', 'portalzugaenge', 'zahlungen', 'mahnungen', 'nachrichten']) {
      expect(schreibGrund(s, lesen, 'anlegen'), s).toBeUndefined();
    }
    for (const s of ['rechnungen', 'angebote', 'auftraege', 'termine']) expect(schreibGrund(s, lesen, 'aendern'), s).toBeUndefined();
  });
});

describe('Bilanz mit echten Zahlen', () => {
  test('zählt nur Echtes', () => {
    const b = bilanz({
      angebote: [{ status: 'versendet' }, { status: 'entwurf' }, { status: 'angenommen', beispiel: true }, { status: 'angenommen' }],
      rechnungen: [{ status: 'bezahlt' }, { status: 'storniert' }, { status: 'versendet', geloeschtAm: 'x' }],
      zahlungen: [{ betrag: 2_340_000 }, { betrag: 5000, beispiel: true }],
    });
    expect(b).toEqual({ angebote: 2, rechnungen: 1, bezahltCent: 2_340_000 });
    expect(bilanzText(b)?.replace(/\u00a0/g, ' ')).toBe('Seit dem Start: 2 Angebote, 1 Rechnung, 23.400 € bezahlt');
  });
  test('ohne Daten keine erfundene Bilanz', () => {
    expect(bilanzText({ angebote: 0, rechnungen: 0, bezahltCent: 0 })).toBeUndefined();
    expect(bilanzText({ angebote: 14, rechnungen: 9, bezahltCent: 0 })).toBe('Seit dem Start: 14 Angebote, 9 Rechnungen');
  });
});
