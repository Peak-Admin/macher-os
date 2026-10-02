import { describe, expect, it } from 'vitest';
import type { Auftrag, Beleg, Materialbuchung, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { leereBasis, prozentText, stundenText } from './basis';
import { auftragKosten, kostenUebersicht, zeitMinuten } from './daten';

const basis = { id: '', erstelltAm: '', geaendertAm: '' };
const ma = (id: string, kostensatz: number): Mitarbeiter => ({ ...basis, id, vorname: id, nachname: 'X', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz, aktiv: true });
const zeit = (x: Partial<Zeiteintrag>): Zeiteintrag => ({ ...basis, id: Math.random().toString(), mitarbeiterId: 'm1', auftragId: 'a1', datum: '2026-09-01', start: '07:00', ende: '16:00', pauseMinuten: 60, art: 'arbeit', ...x });
const mat = (x: Partial<Materialbuchung>): Materialbuchung => ({ ...basis, id: Math.random().toString(), auftragId: 'a1', text: 'Kabel', menge: 10, einheit: 'm', ek: 150, status: 'verbraucht', ...x });
const beleg = (x: Partial<Beleg>): Beleg => ({ ...basis, id: Math.random().toString(), art: 'eingangsrechnung', datum: '2026-09-02', netto: 10000, ust: 1900, status: 'neu', ...x });
const auftrag = (id: string): Auftrag => ({ ...basis, id, nummer: id, titel: id, art: 'projekt', phase: 'in_arbeit', kundeId: 'k1' });

describe('zeitMinuten', () => {
  it('rechnet Dauer minus Pause', () => {
    expect(zeitMinuten({ datum: '2026-09-01', start: '07:00', ende: '16:00', pauseMinuten: 45 })).toBe(495);
  });
  it('kann über Mitternacht', () => {
    expect(zeitMinuten({ datum: '2026-09-01', start: '22:00', ende: '02:00', pauseMinuten: 0 })).toBe(240);
  });
  it('zählt laufende Zeit von heute bis jetzt', () => {
    const jetzt = new Date(2026, 8, 1, 10, 30);
    expect(zeitMinuten({ datum: '2026-09-01', start: '07:00', pauseMinuten: 0 }, jetzt)).toBe(210);
  });
  it('liefert nichts für vergessene Zeiten aus der Vergangenheit', () => {
    const jetzt = new Date(2026, 8, 3, 10, 30);
    expect(zeitMinuten({ datum: '2026-09-01', start: '07:00', pauseMinuten: 0 }, jetzt)).toBeUndefined();
  });
  it('ignoriert kaputte Uhrzeiten', () => {
    expect(zeitMinuten({ datum: '2026-09-01', start: 'xx', ende: '16:00', pauseMinuten: 0 })).toBeUndefined();
  });
});

describe('auftragKosten', () => {
  const b = leereBasis({
    auftraege: [auftrag('a1'), auftrag('a2')],
    mitarbeiter: [ma('m1', 4000), ma('m2', 0)],
    zeiten: [
      zeit({ mitarbeiterId: 'm1' }), // 8 h × 40 € = 320 €
      zeit({ mitarbeiterId: 'm1', start: '06:30', ende: '07:00', pauseMinuten: 0, art: 'fahrt' }), // 0,5 h = 20 €
      zeit({ mitarbeiterId: 'm2', start: '08:00', ende: '10:00', pauseMinuten: 0 }), // ohne Kostensatz
      zeit({ mitarbeiterId: 'm1', ende: undefined, datum: '2026-08-01' }), // vergessen
      zeit({ auftragId: 'a2' }),
    ],
    material: [mat({}), mat({ status: 'geplant', menge: 4, ek: 1000 }), mat({ auftragId: 'a2' })],
    belege: [beleg({ auftragId: 'a1', lieferantName: 'Großhandel', kategorie: 'Material' }), beleg({})],
  });

  it('summiert Lohn, Material und Belege', () => {
    const k = auftragKosten('a1', b, new Date(2026, 8, 5));
    expect(k.lohn).toBe(34000);
    expect(k.material).toBe(1500);
    expect(k.belege).toBe(10000);
    expect(k.gesamt).toBe(45500);
    expect(k.minuten).toBe(480 + 30 + 120);
    expect(k.fahrtMinuten).toBe(30);
  });

  it('weist auf Lücken hin statt zu raten', () => {
    const k = auftragKosten('a1', b, new Date(2026, 8, 5));
    expect(k.ohneKostensatz).toEqual(['m2']);
    expect(k.unvollstaendig).toBe(1);
    expect(k.materialOffen).toBe(4000);
    expect(k.belegZeilen[0].text).toContain('Großhandel');
  });

  it('meldet „keine Daten“ für Aufträge ohne Buchungen', () => {
    expect(auftragKosten('leer', b).hatDaten).toBe(false);
    expect(kostenUebersicht(b, new Date(2026, 8, 5)).map((k) => k.auftragId)).toEqual(['a1', 'a2']);
  });
});

describe('Texte', () => {
  it('formatiert Prozent und Stunden', () => {
    expect(prozentText(0.234)).toBe('+23 %');
    expect(prozentText(-0.1)).toBe('−10 %');
    expect(prozentText(0)).toBe('±0 %');
    expect(stundenText(90)).toBe('1,5 h');
  });
});
