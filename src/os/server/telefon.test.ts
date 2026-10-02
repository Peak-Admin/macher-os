import { describe, expect, it } from 'vitest';
import type { AnrufErgebnis } from '@/os/modules/telefon/anbieter/typen';
import { kundeBekannt, telefonEingangPlanen } from './telefon';

const ergebnis = (anrufId: string): AnrufErgebnis => ({ anrufId, anbieter: 'simulator', von: '0171 2345678', beginn: '2026-10-02T08:00:00.000Z', felder: { anliegen: 'Heizung aus', name: 'Eva Sommer' } });
let n = 0;
const neu = { id: () => `id-${++n}`, jetzt: new Date('2026-10-02T08:05:00Z') };

describe('Telefon-Eingang (Server)', () => {
  it('legt je beendetem Anruf eine rohe Nachricht ab und erkennt doppelte Zustellung', () => {
    const plan = telefonEingangPlanen(
      [
        { typ: 'anruf.begonnen', anrufId: 'a1', anbieter: 'simulator', von: '0171', zeit: '2026-10-02T08:00:00Z' },
        { typ: 'anruf.beendet', ergebnis: ergebnis('a1') },
        { typ: 'anruf.beendet', ergebnis: ergebnis('a1') },
        { typ: 'anruf.beendet', ergebnis: ergebnis('alt') },
      ],
      { nachrichten: [{ id: 'n0', anruf: { anrufId: 'alt' } }], kunden: [] },
      neu,
    );
    expect(plan.doppelt).toBe(2);
    expect(plan.zeilen).toHaveLength(1);
    expect(plan.zeilen[0].daten).toMatchObject({ kanal: 'telefon', richtung: 'ein', betreff: 'Anruf von Eva Sommer', erstelltAm: '2026-10-02T08:05:00.000Z', anruf: { anrufId: 'a1', status: 'neu', quelle: 'ki-assistent' } });
  });

  it('beantwortet kunde_suchen nur mit „bekannt“', () => {
    const kunden = [{ id: 'k1', name: 'Hoffmann', telefon: '0171 2345678' }, { id: 'k2', ansprechpartner: [{ telefon: '0561 99 88 77' }] }, { id: 'k3', telefon: '0151 1111111', geloeschtAm: '2026-01-01' }];
    expect(kundeBekannt(kunden, '+49 171 2345678')).toBe(true);
    expect(kundeBekannt(kunden, '0561998877')).toBe(true);
    expect(kundeBekannt(kunden, '0151 1111111')).toBe(false);
    expect(kundeBekannt(kunden, '')).toBe(false);
    const plan = telefonEingangPlanen([{ typ: 'werkzeug.aufgerufen', anrufId: 'a2', anbieter: 'simulator', werkzeug: 'kunde_suchen', argumente: { telefon: '0171 2345678' } }], { nachrichten: [], kunden }, neu);
    expect(plan.werkzeuge).toEqual([{ anrufId: 'a2', werkzeug: 'kunde_suchen', ergebnis: { bekannt: true } }]);
    expect(plan.zeilen).toHaveLength(0);
  });
});
