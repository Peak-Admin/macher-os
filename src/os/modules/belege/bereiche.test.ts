import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { heute } from '@core/format';
import { testBetrieb } from '../rechnungen/testdaten';
import type { BelegX } from '../rechnungen/typen';
import { BEREICHE_KEY, STANDARD_BEREICHE, bereichVorschlag, bereicheBereinigen, bereicheSpeichern, betriebsbereiche, zuAuftrag, zuBereich } from './bereiche';
import { belegeCsv, BELEG_CSV_SPALTEN, passtZuordnung } from './logik';
import { belegAusWerten, leereWerte } from './Formular';
import { einstellung } from '@core/einstellungen';
import belegeModul from './index';

let t: ReturnType<typeof testBetrieb>;
beforeEach(() => {
  t = testBetrieb();
});

const beleg = (x: Partial<BelegX> = {}) =>
  db.belege.create({ art: 'eingangsrechnung', datum: heute(), netto: 10000, ust: 1900, status: 'neu', ...x } as Parameters<typeof db.belege.create>[0]) as BelegX;

describe('Betriebsbereiche', () => {
  it('hat die Standardliste und lässt sich anpassen', () => {
    expect(betriebsbereiche()).toEqual(STANDARD_BEREICHE);
    bereicheSpeichern([' Lager ', 'Büro', 'büro', '', 'Baustellen-Container']);
    expect(einstellung(BEREICHE_KEY, [])).toEqual(['Lager', 'Büro', 'Baustellen-Container']);
    expect(bereicheBereinigen(['  a  b ', 'A  B'])).toEqual(['a b']);
  });

  it('Auftrag oder Bereich – nie beides', () => {
    expect(zuAuftrag('a1')).toEqual({ auftragId: 'a1', bereich: undefined, zuordnungGrund: undefined });
    expect(zuBereich('Lager')).toEqual({ bereich: 'Lager', auftragId: undefined, zuordnungGrund: undefined });
    expect(belegAusWerten({ ...leereWerte(), brutto: 1190, auftragId: t.auftrag.id, bereich: 'Lager' }).bereich).toBeUndefined();
    expect(belegAusWerten({ ...leereWerte(), brutto: 1190, bereich: 'Lager' })).toMatchObject({ bereich: 'Lager', auftragId: undefined });
  });
});

describe('Bereich vorschlagen', () => {
  it('Tankbeleg und Tankstelle → Fahrzeuge (sicher)', () => {
    expect(bereichVorschlag({ art: 'tankbeleg' })).toEqual({ bereich: 'Fahrzeuge', grund: 'Tankbeleg', sicher: true });
    expect(bereichVorschlag({ art: 'quittung', lieferantName: 'ARAL Station Kassel' })).toMatchObject({ bereich: 'Fahrzeuge', sicher: true });
  });

  it('nimmt den Bereich, in den derselbe Lieferant zuletzt gebucht wurde', () => {
    const l = db.lieferanten.create({ name: 'Würth' });
    beleg({ lieferantId: l.id, bereich: 'Lager', datum: '2026-01-10' });
    beleg({ lieferantId: l.id, bereich: 'Büro', datum: '2026-03-10' });
    beleg({ lieferantId: l.id, auftragId: t.auftrag.id, datum: '2026-04-10' });
    expect(bereichVorschlag({ art: 'eingangsrechnung', lieferantId: l.id, kategorie: 'Werkzeug' })).toEqual({ bereich: 'Büro', grund: 'Gleicher Lieferant wie bei früheren Belegen', sicher: true });
    beleg({ lieferantName: 'Bäckerei Sommer', bereich: 'Mitarbeiter' });
    expect(bereichVorschlag({ art: 'quittung', lieferantName: ' bäckerei sommer' })).toMatchObject({ bereich: 'Mitarbeiter', sicher: true });
  });

  it('schlägt nur vor (nicht sicher) bei Kategorie-Regeln und kennt nur Bereiche aus der Liste', () => {
    expect(bereichVorschlag({ art: 'eingangsrechnung', kategorie: 'Werkzeug' })).toEqual({ bereich: 'Werkstatt', grund: 'Werkzeug', sicher: false });
    expect(bereichVorschlag({ art: 'eingangsrechnung', kategorie: 'Material' })).toMatchObject({ bereich: 'Lager', sicher: false });
    expect(bereichVorschlag({ art: 'eingangsrechnung', kategorie: 'Subunternehmer' })).toBeUndefined();
    expect(bereichVorschlag({ art: 'tankbeleg' }, [], ['Lager', 'Büro'])).toBeUndefined();
    expect(bereichVorschlag({ art: 'tankbeleg' }, [], ['Lager', 'fahrzeuge'])?.bereich).toBe('fahrzeuge');
  });
});

describe('Belegliste', () => {
  it('filtert nach Zuordnung', () => {
    expect(passtZuordnung({ auftragId: 'a1' }, 'auftrag')).toBe(true);
    expect(passtZuordnung({ bereich: 'Lager' }, 'Lager')).toBe(true);
    expect(passtZuordnung({ bereich: 'Lager' }, 'Büro')).toBe(false);
    expect(passtZuordnung({}, 'ohne')).toBe(true);
    expect(passtZuordnung({ bereich: 'Lager' }, 'ohne')).toBe(false);
    expect(passtZuordnung({ bereich: 'Lager' }, '')).toBe(true);
  });

  it('exportiert Belege als CSV mit Auftrag oder Bereich', () => {
    const b1 = beleg({ lieferantName: 'Sonepar', nummer: 'RE-1', auftragId: t.auftrag.id, datum: '2026-09-01', faelligAm: '2026-09-30' });
    const b2 = beleg({ art: 'tankbeleg', lieferantName: 'Aral', bereich: 'Fahrzeuge', datum: '2026-09-02', status: 'bezahlt' });
    const zeilen = belegeCsv([b1, b2]).replace('﻿', '').trim().split('\r\n');
    expect(zeilen[0]).toBe(BELEG_CSV_SPALTEN.join(';'));
    expect(zeilen[1]).toBe('01.09.2026;Sonepar;Eingangsrechnung;RE-1;A-2026-0001;;;100,00;19,00;119,00;Zu prüfen;30.09.2026');
    expect(zeilen[2]).toBe('02.09.2026;Aral;Tankbeleg;;;Fahrzeuge;;100,00;19,00;119,00;Bezahlt;');
  });
});

describe('Automation: zuordnen', () => {
  it('ordnet einen Tankbeleg ohne passenden Auftrag dem Bereich Fahrzeuge zu – mit Grund', async () => {
    const stopp = belegeModul.automationen!.find((a) => a.id === 'belege.zuordnen')!.start();
    try {
      const b = beleg({ art: 'tankbeleg', lieferantName: 'Shell' });
      await Promise.resolve();
      expect(db.belege.get(b.id)).toMatchObject({ bereich: 'Fahrzeuge', zuordnungGrund: 'Tankbeleg' });
      const unklar = beleg({ art: 'eingangsrechnung', kategorie: 'Subunternehmer' });
      await Promise.resolve();
      expect(db.belege.get(unklar.id)?.bereich).toBeUndefined();
    } finally {
      stopp();
    }
  });
});
