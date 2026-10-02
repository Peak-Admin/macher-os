import { describe, expect, it } from 'vitest';
import { genutzteMittel, pruefeWerkzeug, werkzeugProbleme } from './daten';
import { auftrag, ctx, ma, MO, mittel, termin } from '../autoplanung/testhilfe';

const basis = () =>
  ctx({
    mitarbeiter: [ma('jonas'), ma('mehmet')],
    auftraege: [auftrag('a1')],
    betriebsmittel: [
      mittel('crafter', { art: 'fahrzeug', name: 'VW Crafter', kennzeichen: 'KS-1', mitarbeiterId: 'jonas', status: 'im_einsatz' }),
      mittel('transit', { art: 'fahrzeug', name: 'Transit', kennzeichen: 'KS-2' }),
      mittel('hammer', { art: 'maschine', name: 'Bohrhammer' }),
      mittel('hammer2', { art: 'maschine', name: 'Bohrhammer 2' }),
    ],
  });

describe('Werkzeug & Fahrzeug bereit?', () => {
  it('nimmt eingeplante Mittel und das Fahrzeug des Mitarbeiters', () => {
    const c = basis();
    const t = termin('t', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'], betriebsmittelIds: ['hammer'] });
    expect(genutzteMittel(c, t).map((g) => g.mittel.id).sort()).toEqual(['crafter', 'hammer']);
    expect(pruefeWerkzeug(c, t).every((p) => p.ergebnis === 'ok')).toBe(true);
  });

  it('meldet defekt und schlägt Ersatz gleicher Art vor', () => {
    const c = basis();
    c.betriebsmittel[2].status = 'defekt';
    const r = pruefeWerkzeug(c, termin('t', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'], betriebsmittelIds: ['hammer'] }));
    const p = r.find((x) => x.betriebsmittelId === 'hammer')!;
    expect(p.ergebnis).toBe('problem');
    expect(p.loesung).toContain('Bohrhammer 2');
  });

  it('meldet abgelaufene Prüffrist am Termindatum', () => {
    const c = basis();
    c.betriebsmittel[2].naechstePruefung = '2026-10-04';
    c.betriebsmittel[2].pruefungArt = 'DGUV V3';
    const p = pruefeWerkzeug(c, termin('t', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'], betriebsmittelIds: ['hammer'] })).find((x) => x.betriebsmittelId === 'hammer')!;
    expect(p.ergebnis).toBe('problem');
    expect(p.text).toContain('DGUV V3');
    // Prüfung erst nach dem Termin fällig, aber innerhalb einer Woche → nur Warnung
    c.betriebsmittel[2].naechstePruefung = '2026-10-08';
    expect(pruefeWerkzeug(c, termin('t', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'], betriebsmittelIds: ['hammer'] })).find((x) => x.betriebsmittelId === 'hammer')!.ergebnis).toBe('warnung');
  });

  it('erkennt Doppelbelegung zur gleichen Zeit, nicht aber nacheinander', () => {
    const c = basis();
    const a = termin('a', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'], betriebsmittelIds: ['hammer'] });
    const b = termin('b', MO, '10:00', '14:00', { auftragId: 'a1', mitarbeiterIds: ['mehmet'], betriebsmittelIds: ['hammer', 'transit'] });
    const n = termin('n', MO, '12:00', '14:00', { auftragId: 'a1', mitarbeiterIds: ['mehmet'], betriebsmittelIds: ['hammer', 'transit'] });
    c.termine.push(a, b);
    const p = pruefeWerkzeug(c, a).find((x) => x.betriebsmittelId === 'hammer')!;
    expect(p.ergebnis).toBe('problem');
    expect(p.text).toContain('Termin b');
    c.termine.splice(1, 1, n);
    expect(pruefeWerkzeug(c, a).find((x) => x.betriebsmittelId === 'hammer')!.ergebnis).toBe('ok');
  });

  it('warnt, wenn kein Fahrzeug dabei ist, und nennt ein freies', () => {
    const c = basis();
    const r = pruefeWerkzeug(c, termin('t', MO, '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['mehmet'] }));
    expect(r[0].ergebnis).toBe('warnung');
    expect(r[0].loesung).toContain('Transit');
  });

  it('listet Probleme der nächsten Tage', () => {
    const c = basis();
    c.betriebsmittel[0].status = 'defekt';
    c.termine.push(termin('t', '2026-10-06', '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] }), termin('spaet', '2026-10-30', '08:00', '12:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] }));
    const r = werkzeugProbleme(c, 7);
    expect(r.map((x) => x.termin.id)).toEqual(['t']);
  });
});
