import { describe, expect, it } from 'vitest';
import type { Mitarbeiter, Termin } from '@core/objects';
import type { PlanKontext } from '../verfuegbarkeit/daten';
import { aufZelleVerschieben, restStunden, verplanteStunden, vorbelegung } from './daten';

const MO = '2030-03-04';
const iso = (d: string, uhr: string) => new Date(`${d}T${uhr}:00`).toISOString();
const t = (id: string, ids: string[], von: string, bis: string, x: Partial<Termin> = {}): Termin => ({
  id,
  erstelltAm: '',
  geaendertAm: '',
  art: 'einsatz',
  titel: id,
  start: iso(MO, von),
  ende: iso(MO, bis),
  mitarbeiterIds: ids,
  status: 'geplant',
  auftragId: 'A',
  ...x,
});
const ma = (id: string): Mitarbeiter => ({ id, erstelltAm: '', geaendertAm: '', vorname: id, nachname: '', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
const k = (termine: Termin[] = []): PlanKontext => ({ arbeitsbeginn: '07:00', arbeitsende: '16:00', arbeitstage: [1, 2, 3, 4, 5], mitarbeiter: [ma('j'), ma('m')], abwesenheiten: [], termine });

describe('Einsatzplanung', () => {
  it('rechnet verplante Personenstunden und Rest', () => {
    const termine = [t('a', ['j', 'm'], '07:00', '11:00'), t('b', ['j'], '12:00', '14:00'), t('c', ['j'], '14:00', '16:00', { status: 'abgesagt' })];
    expect(verplanteStunden('A', termine)).toBe(10);
    expect(restStunden({ id: 'A', geplanteStunden: 16 }, termine)).toBe(6);
    expect(restStunden({ id: 'A', geplanteStunden: 4 }, termine)).toBe(0);
    expect(restStunden({ id: 'A' }, termine)).toBeUndefined();
  });

  it('belegt die erste freie Zeit am Tag vor', () => {
    expect(vorbelegung({ id: 'X', geplanteStunden: 3 }, 'j', MO, k())).toEqual({ von: '07:00', bis: '10:00', frei: true });
    expect(vorbelegung({ id: 'X', geplanteStunden: 3 }, 'j', MO, k([t('a', ['j'], '07:00', '12:00', { auftragId: 'Y' })]))).toEqual({ von: '12:00', bis: '15:00', frei: true });
    // großer Auftrag: höchstens ein Arbeitstag
    expect(vorbelegung({ id: 'X', geplanteStunden: 40 }, 'j', MO, k())).toEqual({ von: '07:00', bis: '16:00', frei: true });
    // Rest passt nicht mehr ganz: kürzeres Stück
    expect(vorbelegung({ id: 'X', geplanteStunden: 6 }, 'j', MO, k([t('a', ['j'], '07:00', '13:00', { auftragId: 'Y' })]))).toEqual({ von: '13:00', bis: '16:00', frei: true });
    // voll belegt
    expect(vorbelegung({ id: 'X', geplanteStunden: 2 }, 'j', MO, k([t('a', ['j'], '07:00', '16:00', { auftragId: 'Y' })])).frei).toBe(false);
  });

  it('verschiebt per Drag & Drop auf anderen Tag und Mitarbeiter', () => {
    const r = aufZelleVerschieben(t('a', ['j', 'x'], '08:00', '10:00'), 'j', 'm', '2030-03-06');
    expect(r).toEqual({ start: iso('2030-03-06', '08:00'), ende: iso('2030-03-06', '10:00'), mitarbeiterIds: ['x', 'm'] });
    const gleich = aufZelleVerschieben(t('a', ['j', 'm'], '08:00', '10:00'), 'j', 'm', MO);
    expect(gleich.mitarbeiterIds).toEqual(['m']);
    expect(gleich.start).toBe(iso(MO, '08:00'));
  });
});
