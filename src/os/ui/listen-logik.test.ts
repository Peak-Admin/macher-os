import { describe, expect, it } from 'vitest';
import type { Ereignis } from '@core/objects';
import {
  adresseKurz,
  auftragsAdresse,
  bearbeiterName,
  betragNach,
  gueltigeBetragsart,
  gueltigerZeitraum,
  imZeitraum,
  letzteBearbeitungen,
  nutzerSchluessel,
  OHNE_AUFTRAG,
  passtFinanzFilter,
  summeNach,
  zeitpunktKurz,
  zeitraumGrenzen,
  zuletztText,
} from './listen-logik';

const ev = (p: Partial<Ereignis> & { id: string; zeit: string; obj: string; typ?: string }): Ereignis => ({
  id: p.id,
  erstelltAm: p.zeit,
  geaendertAm: p.zeit,
  typ: `${p.typ ?? 'auftraege'}.updated`,
  bezug: { typ: p.typ ?? 'auftraege', id: p.obj },
  text: 'Geändert',
  aenderung: 'aenderung' in p ? p.aenderung : 'updated',
  quelle: p.quelle,
  vonMitarbeiterId: p.vonMitarbeiterId,
  geloeschtAm: p.geloeschtAm,
});

describe('letzteBearbeitungen', () => {
  it('nimmt je Objekt die neueste Änderung der Sammlung', () => {
    const m = letzteBearbeitungen(
      [
        ev({ id: '1', zeit: '2026-10-01T08:00:00.000Z', obj: 'a1', vonMitarbeiterId: 'm1' }),
        ev({ id: '2', zeit: '2026-10-02T12:32:00.000Z', obj: 'a1', vonMitarbeiterId: 'm2' }),
        ev({ id: '3', zeit: '2026-10-03T08:00:00.000Z', obj: 'a1', typ: 'angebote' }),
        ev({ id: '4', zeit: '2026-09-01T08:00:00.000Z', obj: 'a2', quelle: 'automation' }),
      ],
      'auftraege',
    );
    expect(m.get('a1')).toEqual({ zeit: '2026-10-02T12:32:00.000Z', mitarbeiterId: 'm2', quelle: undefined });
    expect(m.get('a2')?.quelle).toBe('automation');
    expect(m.size).toBe(2);
  });

  it('ignoriert Vermerke ohne Datenänderung, Abgleich und gelöschte Einträge', () => {
    const m = letzteBearbeitungen(
      [
        ev({ id: '1', zeit: '2026-10-01T08:00:00.000Z', obj: 'a1' }),
        ev({ id: '2', zeit: '2026-10-02T08:00:00.000Z', obj: 'a1', aenderung: undefined }),
        ev({ id: '3', zeit: '2026-10-03T08:00:00.000Z', obj: 'a1', quelle: 'sync' }),
        ev({ id: '4', zeit: '2026-10-04T08:00:00.000Z', obj: 'a1', geloeschtAm: '2026-10-04T09:00:00.000Z' }),
      ],
      'auftraege',
    );
    expect(m.get('a1')?.zeit).toBe('2026-10-01T08:00:00.000Z');
  });
});

describe('Zuletzt-bearbeitet-Text', () => {
  const jetzt = new Date(2026, 9, 2, 16, 0);
  it('Heute, Gestern, Datum, anderes Jahr', () => {
    expect(zeitpunktKurz(new Date(2026, 9, 2, 14, 32).toISOString(), jetzt)).toBe('Heute 14:32');
    expect(zeitpunktKurz(new Date(2026, 9, 1, 9, 5).toISOString(), jetzt)).toBe('Gestern 09:05');
    expect(zeitpunktKurz(new Date(2026, 8, 12, 9, 5).toISOString(), jetzt)).toBe('12.09.');
    expect(zeitpunktKurz(new Date(2025, 11, 31, 9, 5).toISOString(), jetzt)).toBe('31.12.2025');
    expect(zeitpunktKurz('kaputt', jetzt)).toBe('');
  });
  it('Gestern über den Monatswechsel', () => {
    expect(zeitpunktKurz(new Date(2026, 8, 30, 23, 59).toISOString(), new Date(2026, 9, 1, 0, 10))).toBe('Gestern 23:59');
  });
  it('mit und ohne Namen', () => {
    const b = { zeit: new Date(2026, 9, 2, 14, 32).toISOString() };
    expect(zuletztText(b, 'Anna', jetzt)).toBe('Heute 14:32 · Anna');
    expect(zuletztText(b, undefined, jetzt)).toBe('Heute 14:32');
  });
  it('Bearbeiter: Mensch, Lotte, Import', () => {
    expect(bearbeiterName({ zeit: '', quelle: 'user' }, 'Anna')).toBe('Anna');
    expect(bearbeiterName({ zeit: '', quelle: 'ai' }, undefined)).toBe('Lotte');
    expect(bearbeiterName({ zeit: '', quelle: 'automation' }, undefined)).toBe('Lotte');
    expect(bearbeiterName({ zeit: '', quelle: 'import' }, undefined)).toBe('Import');
    expect(bearbeiterName({ zeit: '' }, undefined)).toBeUndefined();
  });
});

describe('Adresse kurz', () => {
  it('Straße und Ort, ohne PLZ', () => {
    expect(adresseKurz({ strasse: 'Lindenweg 4', plz: '50667', ort: 'Köln' })).toBe('Lindenweg 4, Köln');
    expect(adresseKurz({ strasse: ' ', plz: '', ort: 'Köln' })).toBe('Köln');
    expect(adresseKurz(undefined)).toBe('');
  });
  it('Einsatzort vor Kundenadresse', () => {
    expect(auftragsAdresse({ strasse: 'Baustr. 1', ort: 'Bonn' }, { strasse: 'Hauptstr. 2', ort: 'Köln' })).toBe('Baustr. 1, Bonn');
    expect(auftragsAdresse(undefined, { strasse: 'Hauptstr. 2', ort: 'Köln' })).toBe('Hauptstr. 2, Köln');
    expect(auftragsAdresse({ strasse: '', ort: '' }, undefined)).toBe('');
  });
});

describe('Finanzmuster', () => {
  it('Zeitraumgrenzen', () => {
    expect(zeitraumGrenzen('alle', '2026-10-02')).toBeUndefined();
    expect(zeitraumGrenzen('monat', '2026-02-10')).toEqual({ von: '2026-02-01', bis: '2026-02-28' });
    expect(zeitraumGrenzen('monat', '2028-02-10')).toEqual({ von: '2028-02-01', bis: '2028-02-29' });
    expect(zeitraumGrenzen('vormonat', '2026-01-15')).toEqual({ von: '2025-12-01', bis: '2025-12-31' });
    expect(zeitraumGrenzen('quartal', '2026-11-03')).toEqual({ von: '2026-10-01', bis: '2026-12-31' });
    expect(zeitraumGrenzen('quartal', '2026-05-03')).toEqual({ von: '2026-04-01', bis: '2026-06-30' });
    expect(zeitraumGrenzen('jahr', '2026-05-03')).toEqual({ von: '2026-01-01', bis: '2026-12-31' });
    expect(zeitraumGrenzen('vorjahr', '2026-05-03')).toEqual({ von: '2025-01-01', bis: '2025-12-31' });
  });
  it('imZeitraum inklusive Grenzen, ohne Datum nur bei „alle“', () => {
    expect(imZeitraum('2026-10-31', 'monat', '2026-10-02')).toBe(true);
    expect(imZeitraum('2026-11-01', 'monat', '2026-10-02')).toBe(false);
    expect(imZeitraum('2026-10-01T10:00:00.000Z', 'monat', '2026-10-02')).toBe(true);
    expect(imZeitraum(undefined, 'monat', '2026-10-02')).toBe(false);
    expect(imZeitraum(undefined, 'alle', '2026-10-02')).toBe(true);
  });
  it('Zeitraum und Auftrag zusammen', () => {
    const f = { zeitraum: 'jahr' as const, auftragId: 'a1' };
    expect(passtFinanzFilter({ datum: '2026-03-01', auftragId: 'a1' }, f, '2026-10-02')).toBe(true);
    expect(passtFinanzFilter({ datum: '2026-03-01', auftragId: 'a2' }, f, '2026-10-02')).toBe(false);
    expect(passtFinanzFilter({ datum: '2025-03-01', auftragId: 'a1' }, f, '2026-10-02')).toBe(false);
    expect(passtFinanzFilter({ datum: '2025-03-01' }, { zeitraum: 'alle' }, '2026-10-02')).toBe(true);
  });
  it('„Ohne Auftrag“ zeigt nur Einträge ohne Auftragsbezug', () => {
    const f = { zeitraum: 'alle' as const, auftragId: OHNE_AUFTRAG };
    expect(passtFinanzFilter({ datum: '2026-03-01' }, f, '2026-10-02')).toBe(true);
    expect(passtFinanzFilter({ datum: '2026-03-01', auftragId: 'a1' }, f, '2026-10-02')).toBe(false);
  });
  it('Beträge und Summen passen sich der Betragsart an', () => {
    const l = [
      { netto: 10000, brutto: 11900 },
      { netto: 5000, brutto: 5950 },
    ];
    expect(betragNach('netto', l[0])).toBe(10000);
    expect(betragNach('brutto', l[0])).toBe(11900);
    expect(summeNach('netto', l)).toBe(15000);
    expect(summeNach('brutto', l)).toBe(17850);
    expect(summeNach('netto', [])).toBe(0);
  });
  it('gespeicherte Werte werden geprüft, Schlüssel je Nutzer', () => {
    expect(gueltigeBetragsart('netto')).toBe('netto');
    expect(gueltigeBetragsart('quatsch')).toBe('brutto');
    expect(gueltigerZeitraum('quartal')).toBe('quartal');
    expect(gueltigerZeitraum(42)).toBe('alle');
    expect(nutzerSchluessel('liste.betragsart', 'm1')).toBe('liste.betragsart.m1');
    expect(nutzerSchluessel('liste.betragsart', undefined)).toBe('liste.betragsart');
  });
});
