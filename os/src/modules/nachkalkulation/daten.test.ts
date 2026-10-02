import { describe, expect, it } from 'vitest';
import type { Angebot, Artikel, Auftrag, Leistung, Mitarbeiter, Position, Rechnung, Zeiteintrag } from '@core/objects';
import { leereBasis } from '../kosten/basis';
import { lerneffekte, lerneffektSatz, nachkalkulation, positionsMaterial, positionsMinuten, sollFuer, ueberPlan } from './daten';
import { kalkulationFuer, kalkulationLesen } from './kalkulation';
import { kalkulationen, rechne } from '@modules/kalkulation/daten';
import { db, zuruecksetzen } from '@core/db';

const basis = { id: '', erstelltAm: '', geaendertAm: '' };
const ma: Mitarbeiter = { ...basis, id: 'm1', vorname: 'J', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 4000, aktiv: true };
const leistung = (id: string, minuten: number, material?: Leistung['material']): Leistung => ({ ...basis, id, name: `Leistung ${id}`, einheit: 'Stk', preis: 10000, minuten, aktiv: true, material });
const artikel: Artikel = { ...basis, id: 'art1', name: 'Dose', einheit: 'Stk', ek: 200, vk: 400, aktiv: true };
const pos = (x: Partial<Position>): Position => ({ id: Math.random().toString(), art: 'leistung', text: 't', menge: 1, einheit: 'Stk', einzelpreis: 10000, ...x });
const auftrag = (id: string, x: Partial<Auftrag> = {}): Auftrag => ({ ...basis, id, nummer: id, titel: id, art: 'projekt', phase: 'erledigt', kundeId: 'k1', ...x });
const angebot = (auftragId: string, positionen: Position[], status: Angebot['status'] = 'angenommen'): Angebot => ({ ...basis, id: `an-${auftragId}`, nummer: 'AN', auftragId, kundeId: 'k1', titel: '', positionen, status, datum: '2026-01-01', gueltigBis: '2026-02-01', version: 1 });
const zeit = (auftragId: string, start: string, ende: string, art: Zeiteintrag['art'] = 'arbeit'): Zeiteintrag => ({ ...basis, id: Math.random().toString(), mitarbeiterId: 'm1', auftragId, datum: '2026-09-01', start, ende, pauseMinuten: 0, art });
const rechnung = (auftragId: string, positionen: Position[]): Rechnung => ({ ...basis, id: `r-${auftragId}`, nummer: 'R', art: 'rechnung', auftragId, kundeId: 'k1', titel: '', positionen, status: 'bezahlt', datum: '2026-09-10', faelligAm: '2026-09-24', mahnstufe: 0 });

describe('Soll aus Positionen', () => {
  const b = leereBasis({ leistungen: [leistung('l1', 60, [{ artikelId: 'art1', menge: 2 }])], artikel: [artikel] });
  it('rechnet Minuten aus Leistungen und Lohnstunden', () => {
    const r = positionsMinuten([pos({ leistungId: 'l1', menge: 3 }), pos({ art: 'lohn', einheit: 'h', menge: 2 }), pos({ leistungId: 'l1', optional: true })], b);
    expect(r.gesamt).toBe(300);
    expect(r.jeLeistung.get('l1')).toBe(180);
  });
  it('rechnet Material-EK aus Artikeln und Leistungsmaterial', () => {
    expect(positionsMaterial([pos({ leistungId: 'l1', menge: 3 }), pos({ art: 'material', artikelId: 'art1', menge: 5 })], b)).toBe(3 * 2 * 200 + 5 * 200);
    expect(positionsMaterial([pos({ art: 'pauschal' })], b)).toBeUndefined();
  });
});

describe('sollFuer', () => {
  it('nimmt die Kalkulation vor den geplanten Stunden vor dem Angebot', () => {
    const geplant = auftrag('a1', { geplanteStunden: 10 });
    const a = auftrag('a1');
    const b = leereBasis({ auftraege: [a], leistungen: [leistung('l1', 120)], angebote: [angebot('a1', [pos({ leistungId: 'l1', menge: 2 })])], mitarbeiter: [ma] });
    expect(sollFuer(geplant, b).minutenQuelle).toBe('auftrag');
    expect(sollFuer(geplant, b).minuten).toBe(600);
    expect(sollFuer(geplant, b, { stunden: 5 }).minuten).toBe(300);
    expect(sollFuer(a, b).minuten).toBe(240);
    expect(sollFuer(a, b).minutenQuelle).toBe('angebot');
    expect(sollFuer(a, b).umsatz).toBe(20000);
    expect(sollFuer(a, b, { stunden: 5 }).minuten).toBe(300);
    // Soll-Kosten: 4 h × 40 € (Teamdurchschnitt), kein Material
    expect(sollFuer(a, b).kosten).toBe(16000);
    expect(sollFuer(a, b).kostenQuelle).toBe('geschaetzt');
  });
  it('ignoriert abgelehnte Angebote', () => {
    const a = auftrag('a1');
    const b = leereBasis({ leistungen: [leistung('l1', 120)], angebote: [angebot('a1', [pos({ leistungId: 'l1' })], 'abgelehnt')] });
    expect(sollFuer(a, b).minuten).toBeUndefined();
  });
});

describe('nachkalkulation', () => {
  it('erklärt Abweichungen in Worten', () => {
    const a = auftrag('a1', { geplanteStunden: 8 });
    const b = leereBasis({
      auftraege: [a],
      mitarbeiter: [ma],
      zeiten: [zeit('a1', '07:00', '17:00'), zeit('a1', '06:00', '07:00', 'fahrt')],
      rechnungen: [rechnung('a1', [pos({ einzelpreis: 80000 })])],
    });
    const n = nachkalkulation(a, b);
    expect(n.ist.minuten).toBe(660);
    expect(n.saetze[0]).toBe('Ihr habt 11 h gebraucht, geplant waren 8 h – 3 h mehr (+38 %).');
    expect(n.saetze).toContain('Davon 1 h Fahrtzeit.');
    expect(n.bewertung.ton).toBe('achtung');
    expect(n.umsatz).toBe(80000);
    expect(n.db).toBe(80000 - 44000);
    expect(n.saetze.at(-1)).toContain('Deckungsbeitrag');
  });
  it('nennt verbrauchtes Material nicht „wie kalkuliert“, wenn kein Material kalkuliert war', () => {
    const a = auftrag('a1', { geplanteStunden: 1 });
    const n = nachkalkulation(a, leereBasis({ auftraege: [a], mitarbeiter: [ma], zeiten: [zeit('a1', '07:00', '08:00')] }), { stunden: 1, material: 0 });
    const mitMaterial = nachkalkulation(a, leereBasis({ auftraege: [a], mitarbeiter: [ma], zeiten: [zeit('a1', '07:00', '08:00')], material: [{ ...basis, id: 'mb', auftragId: 'a1', text: 'Dose', menge: 6, einheit: 'Stk', ek: 390, status: 'verbraucht' }] }), { stunden: 1, material: 0 });
    expect(n.saetze.join(' ')).not.toContain('Material');
    expect(mitMaterial.saetze.join(' ')).toMatch(/Material und Belege: 23,40\s€ – kalkuliert war kein Material\./);
  });
  it('sagt ehrlich, wenn Daten fehlen', () => {
    const n = nachkalkulation(auftrag('a1'), leereBasis());
    expect(n.hatSoll).toBe(false);
    expect(n.hatIst).toBe(false);
    expect(n.bewertung.text).toBe('Noch keine Ist-Daten');
  });
  it('wertet kleine Abweichungen als „im Plan“', () => {
    const a = auftrag('a1', { geplanteStunden: 10 });
    const b = leereBasis({ auftraege: [a], mitarbeiter: [ma], zeiten: [zeit('a1', '07:00', '17:30')] });
    expect(nachkalkulation(a, b).bewertung.text).toBe('Im Plan');
  });
});

describe('Lerneffekt', () => {
  const l1 = leistung('l1', 60);
  const l2 = leistung('l2', 60);
  // Auftrag x: 2 × l1 (120 min Soll) → 156 min Ist (+30 %)
  // Auftrag y: 1 × l1 + 1 × l2 (120 min Soll) → 156 min Ist (+30 %)
  const b = leereBasis({
    leistungen: [l1, l2],
    mitarbeiter: [ma],
    auftraege: [auftrag('x'), auftrag('y'), auftrag('z', { phase: 'in_arbeit' })],
    angebote: [angebot('x', [pos({ leistungId: 'l1', menge: 2 })]), angebot('y', [pos({ leistungId: 'l1' }), pos({ leistungId: 'l2' })])],
    zeiten: [zeit('x', '07:00', '09:36'), zeit('x', '06:00', '07:00', 'fahrt'), zeit('y', '07:00', '09:36'), zeit('z', '07:00', '17:00')],
  });

  it('erkennt Leistungen, die regelmäßig länger dauern', () => {
    const e = lerneffekte(b);
    expect(e).toHaveLength(1);
    expect(e[0].leistungId).toBe('l1');
    expect(e[0].auftraege).toBe(2);
    expect(Math.round(e[0].abweichung * 100)).toBe(30);
    expect(e[0].minutenNeu).toBe(78);
    expect(lerneffektSatz(e[0])).toBe('„Leistung l1“ dauert im Schnitt 30 % länger als kalkuliert');
  });
  it('braucht genug Aufträge', () => {
    expect(lerneffekte(b, { minAuftraege: 3 })).toHaveLength(0);
  });
  it('nimmt Rechnungspositionen, wenn kein Angebot da ist', () => {
    const c = leereBasis({ ...b, angebote: [], rechnungen: [rechnung('x', [pos({ leistungId: 'l1', menge: 2 })]), rechnung('y', [pos({ leistungId: 'l1', menge: 2 })])] });
    c.rechnungen[1] = { ...c.rechnungen[1], id: 'r-y2' };
    expect(lerneffekte(c)[0]?.leistungId).toBe('l1');
  });
  it('meldet laufende Aufträge über Plan', () => {
    const c = leereBasis({ ...b, auftraege: [auftrag('z', { phase: 'in_arbeit', geplanteStunden: 8 })] });
    expect(ueberPlan(c).map((n) => n.auftragId)).toEqual(['z']);
  });
});

describe('Kalkulation lesen', () => {
  const kalk = {
    zeilen: [{ id: 'z1', text: 'Dose setzen', menge: 6, einheit: 'Stk' as const, minuten: 30, material: 200, fremd: 0 }, { id: 'z2', text: 'Gerüst', menge: 1, einheit: 'Psch' as const, minuten: 0, material: 0, fremd: 5000 }],
    lohnkosten: 4000,
    gemeinkostenProzent: 50,
    materialZuschlagProzent: 20,
    wagnisGewinnProzent: 10,
  };

  it('rechnet Soll-Werte wie der Kalkulations-Editor', () => {
    const s = kalkulationLesen(kalk)!;
    expect(s.stunden).toBe(3);
    expect(s.material).toBe(1200 + 5000);
    expect(s.kosten).toBe(12000 + 1200 + 5000);
    expect(s.netto).toBe(rechne(kalk).summe.preis);
    expect(kalkulationLesen({ ...kalk, zeilen: [] })).toBeUndefined();
  });

  it('nimmt die Kalkulation aus der Sammlung des Moduls Kalkulation', () => {
    zuruecksetzen();
    kalkulationen.create({ auftragId: 'a1', titel: 'Alt', ...kalk });
    expect(kalkulationFuer('a1')?.stunden).toBe(3);
    expect(kalkulationFuer('a2')).toBeUndefined();
    const an = db.angebote.create({ nummer: 'AN', auftragId: 'a1', kundeId: 'k1', titel: '', positionen: [], status: 'angenommen', datum: '2026-01-01', gueltigBis: '2026-02-01', version: 1 });
    kalkulationen.create({ auftragId: 'a1', titel: 'Zum Angebot', ...kalk, zeilen: [kalk.zeilen[0]], angebotId: an.id });
    expect(kalkulationFuer('a1')?.stunden).toBe(3);
    expect(kalkulationFuer('a1')?.material).toBe(1200);
  });
});
