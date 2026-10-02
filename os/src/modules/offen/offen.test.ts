import { describe, expect, it } from 'vitest';
import type { Auftrag, Termin } from '@core/objects';
import { offenEinzuplanen } from './daten';

const jetzt = new Date('2030-03-10T10:00:00');
const auftrag = (id: string, x: Partial<Auftrag>): Auftrag => ({
  id,
  erstelltAm: '2030-03-01T10:00:00.000Z',
  geaendertAm: '',
  nummer: id,
  titel: id,
  art: 'kundendienst',
  phase: 'beauftragt',
  kundeId: 'k',
  ...x,
});
const termin = (auftragId: string, tag: string, x: Partial<Termin> = {}): Termin => ({
  id: `t-${auftragId}-${tag}`,
  erstelltAm: '',
  geaendertAm: '',
  art: 'einsatz',
  titel: '',
  start: new Date(`${tag}T08:00:00`).toISOString(),
  ende: new Date(`${tag}T10:00:00`).toISOString(),
  mitarbeiterIds: [],
  status: 'geplant',
  auftragId,
  ...x,
});

describe('Offen einzuplanen', () => {
  it('findet beauftragte Aufträge ohne künftigen Termin', () => {
    const r = offenEinzuplanen(
      [auftrag('ohne', {}), auftrag('mit', {}), auftrag('nurAlt', {}), auftrag('abgesagt', {}), auftrag('inArbeit', { phase: 'in_arbeit' })],
      [termin('mit', '2030-03-12'), termin('nurAlt', '2030-03-01'), termin('abgesagt', '2030-03-12', { status: 'abgesagt' })],
      jetzt,
    );
    expect(r.map((e) => e.auftrag.id).sort()).toEqual(['abgesagt', 'nurAlt', 'ohne']);
    expect(r.every((e) => e.grund === 'einsatz')).toBe(true);
  });

  it('nimmt Anfragen nur mit Besichtigungswunsch auf', () => {
    const r = offenEinzuplanen(
      [
        auftrag('wunsch', { phase: 'anfrage', wunschtermin: 'nächste Woche' }),
        auftrag('dringend', { phase: 'anfrage', dringend: true }),
        auftrag('nurAnfrage', { phase: 'anfrage' }),
        auftrag('besichtigung', { phase: 'besichtigung' }),
        auftrag('angebot', { phase: 'angebot' }),
      ],
      [],
      jetzt,
    );
    expect(r.map((e) => e.auftrag.id).sort()).toEqual(['besichtigung', 'dringend', 'wunsch']);
    expect(r.every((e) => e.grund === 'besichtigung')).toBe(true);
  });

  it('sortiert dringend vor Wunschtermin vor Alter', () => {
    const r = offenEinzuplanen(
      [
        auftrag('jung', { erstelltAm: '2030-03-09T10:00:00.000Z' }),
        auftrag('alt', { erstelltAm: '2030-02-01T10:00:00.000Z' }),
        auftrag('wunsch', { wunschtermin: 'Freitag', erstelltAm: '2030-03-09T10:00:00.000Z' }),
        auftrag('dringend', { dringend: true, erstelltAm: '2030-03-10T09:00:00.000Z' }),
      ],
      [],
      jetzt,
    );
    expect(r.map((e) => e.auftrag.id)).toEqual(['dringend', 'wunsch', 'alt', 'jung']);
    expect(r.find((e) => e.auftrag.id === 'alt')!.alterTage).toBe(37);
  });
});
