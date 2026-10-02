import { describe, expect, it } from 'vitest';
import type { Mitarbeiter, Termin } from '@core/objects';
import type { PlanKontext } from '../verfuegbarkeit/daten';
import { auslastung, bewerte, teamWoche } from './daten';

const MO = '2030-03-04';
const iso = (d: string, uhr: string) => new Date(`${d}T${uhr}:00`).toISOString();
const ma = (id: string, x: Partial<Mitarbeiter> = {}): Mitarbeiter => ({ id, erstelltAm: '', geaendertAm: '', vorname: id, nachname: '', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true, ...x });
const t = (ids: string[], tag: string, von: string, bis: string): Termin => ({ id: `${tag}${von}${ids}`, erstelltAm: '', geaendertAm: '', art: 'einsatz', titel: '', start: iso(tag, von), ende: iso(tag, bis), mitarbeiterIds: ids, status: 'geplant' });

describe('Auslastung', () => {
  it('bewertet als Text-Status', () => {
    expect(bewerte(45, 40)).toMatchObject({ bewertung: 'ueberlast', ton: 'achtung', text: 'Überlast: 5 h zu viel' });
    expect(bewerte(36, 40).bewertung).toBe('voll');
    expect(bewerte(24, 40)).toMatchObject({ bewertung: 'gut', text: 'Gut ausgelastet, 16 h frei' });
    expect(bewerte(8, 40)).toMatchObject({ bewertung: 'freiraum', text: 'Freiraum: 32 h frei' });
    expect(bewerte(0, 0).bewertung).toBe('nicht_da');
    expect(bewerte(4, 0).bewertung).toBe('ueberlast');
  });

  it('rechnet 4 Wochen je aktivem Mitarbeiter', () => {
    const k: PlanKontext = {
      arbeitsbeginn: '07:00',
      arbeitsende: '16:00',
      arbeitstage: [1, 2, 3, 4, 5],
      mitarbeiter: [ma('j'), ma('m'), ma('x', { aktiv: false })],
      abwesenheiten: [{ id: 'u', erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm', art: 'urlaub', von: '2030-03-11', bis: '2030-03-15', status: 'genehmigt' }],
      termine: [t(['j', 'm'], MO, '07:00', '16:00'), t(['j'], '2030-03-05', '07:00', '16:00'), t(['m'], '2030-03-12', '07:00', '09:00')],
    };
    const r = auslastung(k, '2030-03-06');
    expect(r.map((x) => x.mitarbeiterId)).toEqual(['j', 'm']);
    expect(r[0].wochen).toHaveLength(4);
    expect(r[0].wochen[0]).toMatchObject({ wochenStart: MO, geplant: 18, verfuegbar: 40 });
    expect(r[1].wochen[1]).toMatchObject({ geplant: 2, verfuegbar: 0, bewertung: 'ueberlast' });
    expect(teamWoche(r, 0)).toEqual({ geplant: 27, verfuegbar: 80, quote: 27 / 80 });
  });
});
