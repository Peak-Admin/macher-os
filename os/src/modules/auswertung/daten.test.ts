import { describe, expect, it } from 'vitest';
import type { Angebot, Auftrag, Mitarbeiter, Position, Rechnung, Termin, Zahlung } from '@core/objects';
import { leereBasis } from '../kosten/basis';
import { angebotsquote, auftragsbestand, auslastung, kennzahlen, offenePosten, umsatz, veraenderung, zahlungsdauer, zeitraum } from './daten';

const basis = { id: '', erstelltAm: '', geaendertAm: '' };
const pos = (einzelpreis: number): Position => ({ id: 'p', art: 'leistung', text: 't', menge: 1, einheit: 'Stk', einzelpreis });
const r = (id: string, x: Partial<Rechnung>): Rechnung => ({ ...basis, id, nummer: id, art: 'rechnung', kundeId: 'k1', titel: '', positionen: [pos(10000)], status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0, ...x });
const z = (rechnungId: string, betrag: number, datum: string): Zahlung => ({ ...basis, id: Math.random().toString(), rechnungId, betrag, datum, art: 'ueberweisung' });
const an = (id: string, x: Partial<Angebot>): Angebot => ({ ...basis, id, nummer: id, auftragId: 'a1', kundeId: 'k1', titel: '', positionen: [pos(50000)], status: 'versendet', datum: '2026-09-01', gueltigBis: '2026-10-01', version: 1, ...x });

describe('zeitraum', () => {
  it('vergleicht den laufenden Monat mit dem Vormonat bis zum gleichen Tag', () => {
    expect(zeitraum('monat', '2026-10-02')).toEqual({ von: '2026-10-01', bis: '2026-10-02', label: 'Oktober 2026', vor: { von: '2026-09-01', bis: '2026-09-02', label: 'September 2026' } });
    expect(zeitraum('monat', '2026-03-31').vor).toEqual({ von: '2026-02-01', bis: '2026-02-28', label: 'Februar 2026' });
  });
  it('kennt Vormonat, Quartal und Jahr', () => {
    expect(zeitraum('vormonat', '2026-01-15')).toMatchObject({ von: '2025-12-01', bis: '2025-12-31', vor: { von: '2025-11-01', bis: '2025-11-30' } });
    expect(zeitraum('quartal', '2026-02-10')).toMatchObject({ von: '2026-01-01', label: '1. Quartal 2026', vor: { von: '2025-10-01', bis: '2025-11-10', label: '4. Quartal 2025' } });
    expect(zeitraum('jahr', '2026-10-02')).toMatchObject({ von: '2026-01-01', vor: { von: '2025-01-01', bis: '2025-10-02' } });
  });
});

describe('Kennzahlen', () => {
  const sept = { von: '2026-09-01', bis: '2026-09-30', label: '' };

  it('Umsatz netto nur aus versendeten Rechnungen im Zeitraum', () => {
    const b = leereBasis({ rechnungen: [r('1', {}), r('2', { status: 'entwurf' }), r('3', { datum: '2026-08-31' })] });
    expect(umsatz(b, sept)).toEqual({ netto: 10000, anzahl: 1 });
  });

  it('offene Posten brutto minus Zahlungen, überfällige getrennt', () => {
    const b = leereBasis({
      rechnungen: [r('1', { faelligAm: '2026-09-10' }), r('2', { status: 'teilbezahlt', faelligAm: '2026-10-10' }), r('3', { status: 'bezahlt' })],
      zahlungen: [z('2', 5000, '2026-09-20')],
    });
    expect(offenePosten(b, '2026-10-01')).toEqual({ summe: 11900 + 6900, anzahl: 2, ueberfaellig: 11900, anzahlUeberfaellig: 1 });
  });

  it('Auftragsbestand aus angenommenen Angeboten minus Berechnetem', () => {
    const auftraege: Auftrag[] = [
      { ...basis, id: 'a1', nummer: '1', titel: '', art: 'projekt', phase: 'in_arbeit', kundeId: 'k1' },
      { ...basis, id: 'a2', nummer: '2', titel: '', art: 'projekt', phase: 'beauftragt', kundeId: 'k1' },
    ];
    const b = leereBasis({ auftraege, angebote: [an('x', { status: 'angenommen' })], rechnungen: [r('ab', { auftragId: 'a1', art: 'abschlag' })] });
    expect(auftragsbestand(b)).toEqual({ summe: 40000, anzahl: 1, ohneAngebot: 1 });
  });

  it('Auslastung: verplante Stunden ÷ Arbeitszeit an Werktagen', () => {
    const team: Mitarbeiter[] = [
      { ...basis, id: 'm1', vorname: 'a', nachname: 'b', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true },
      { ...basis, id: 'b1', vorname: 'a', nachname: 'b', rolle: 'buero', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true },
    ];
    const t: Termin = { ...basis, id: 't', art: 'einsatz', titel: '', start: new Date(2026, 8, 7, 7).toISOString(), ende: new Date(2026, 8, 7, 11).toISOString(), mitarbeiterIds: ['m1', 'b1'], status: 'geplant' };
    const woche = { von: '2026-09-07', bis: '2026-09-13', label: '' }; // Mo–So
    const a = auslastung(leereBasis({ mitarbeiter: team, termine: [t, { ...t, id: 'x', status: 'abgesagt' }] }), woche)!;
    expect(a.kapazitaetMinuten).toBe(40 * 60);
    expect(a.geplantMinuten).toBe(240);
    expect(a.anteil).toBeCloseTo(0.1);
    expect(auslastung(leereBasis(), woche)).toBeUndefined();
  });

  it('Angebotsquote aus entschiedenen Angeboten', () => {
    const b = leereBasis({
      angebote: [
        an('1', { status: 'angenommen', entschiedenAm: '2026-09-03T10:00:00Z' }),
        an('2', { status: 'abgelehnt', entschiedenAm: '2026-09-04T10:00:00Z' }),
        an('3', { status: 'abgelaufen', gueltigBis: '2026-09-20' }),
        an('4', { status: 'versendet' }),
      ],
    });
    expect(angebotsquote(b, sept)).toEqual({ anteil: 1 / 3, angenommen: 1, entschieden: 3 });
    expect(angebotsquote(leereBasis(), sept)).toBeUndefined();
  });

  it('Zahlungsdauer bis zur letzten Zahlung', () => {
    const b = leereBasis({
      rechnungen: [r('1', { status: 'bezahlt', datum: '2026-08-20' }), r('2', { status: 'bezahlt', datum: '2026-09-01' })],
      zahlungen: [z('1', 5000, '2026-08-25'), z('1', 6900, '2026-09-09'), z('2', 11900, '2026-09-11')],
    });
    expect(zahlungsdauer(b, sept)).toEqual({ tage: 15, anzahl: 2 });
  });

  it('Veränderung nur mit Vergleichswert', () => {
    expect(veraenderung(120, 100)).toBeCloseTo(0.2);
    expect(veraenderung(120, 0)).toBeUndefined();
    expect(veraenderung(undefined, 100)).toBeUndefined();
  });

  it('bündelt alles für einen Zeitraum', () => {
    const k = kennzahlen(leereBasis({ rechnungen: [r('1', { datum: '2026-10-01' }), r('2', { datum: '2026-09-02' })] }), 'monat', '2026-10-02');
    expect(k.umsatz.netto).toBe(10000);
    expect(k.umsatzVor.netto).toBe(10000);
    expect(k.quote).toBeUndefined();
  });
});
