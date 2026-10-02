import { describe, expect, it } from 'vitest';
import type { Abwesenheit, Mitarbeiter, Termin } from '@core/objects';
import {
  anwesenheit,
  freieSlots,
  geplanteStunden,
  lokal,
  pruefeVerfuegbarkeit,
  terminKonflikte,
  verfuegbar,
  verfuegbareStunden,
  wochenStart,
  type PlanKontext,
} from './daten';

// 2030-03-04 ist ein Montag
const MO = '2030-03-04';
const DI = '2030-03-05';
const SA = '2030-03-09';
const iso = (d: string, uhr: string) => lokal(d, Number(uhr.slice(0, 2)) * 60 + Number(uhr.slice(3))).toISOString();
const basis = { erstelltAm: '', geaendertAm: '' };

const ma = (id: string, x: Partial<Mitarbeiter> = {}): Mitarbeiter => ({
  ...basis,
  id,
  vorname: id,
  nachname: 'Test',
  rolle: 'monteur',
  wochenstunden: 40,
  urlaubstageJahr: 30,
  kostensatz: 0,
  aktiv: true,
  ...x,
});
const termin = (id: string, mitarbeiterIds: string[], tag: string, von: string, bis: string, x: Partial<Termin> = {}): Termin => ({
  ...basis,
  id,
  art: 'einsatz',
  titel: id,
  start: iso(tag, von),
  ende: iso(tag, bis),
  mitarbeiterIds,
  status: 'geplant',
  ...x,
});
const abw = (id: string, mitarbeiterId: string, von: string, bis: string, x: Partial<Abwesenheit> = {}): Abwesenheit => ({
  ...basis,
  id,
  mitarbeiterId,
  art: 'urlaub',
  von,
  bis,
  status: 'genehmigt',
  ...x,
});

const kontext = (x: Partial<PlanKontext> = {}): PlanKontext => ({
  arbeitsbeginn: '07:00',
  arbeitsende: '16:00',
  arbeitstage: [1, 2, 3, 4, 5],
  mitarbeiter: [ma('jonas'), ma('mehmet'), ma('alt', { aktiv: false })],
  abwesenheiten: [],
  termine: [],
  ...x,
});

describe('verfuegbar', () => {
  it('ist frei in der Arbeitszeit ohne Termine', () => {
    expect(verfuegbar('jonas', iso(MO, '08:00'), iso(MO, '10:00'), { kontext: kontext() })).toBe(true);
  });

  it('erkennt Doppelbuchung, aber nicht bei abgesagten Terminen', () => {
    const k = kontext({ termine: [termin('t1', ['jonas'], MO, '09:00', '11:00'), termin('t2', ['jonas'], MO, '13:00', '14:00', { status: 'abgesagt' })] });
    const p = pruefeVerfuegbarkeit('jonas', iso(MO, '10:00'), iso(MO, '12:00'), { kontext: k });
    expect(p.verfuegbar).toBe(false);
    expect(p.gruende).toEqual([expect.objectContaining({ art: 'termin', terminId: 't1', text: 'Doppelt gebucht' })]);
    expect(verfuegbar('jonas', iso(MO, '13:00'), iso(MO, '14:00'), { kontext: k })).toBe(true);
    // direkt anschließend ist kein Konflikt
    expect(verfuegbar('jonas', iso(MO, '11:00'), iso(MO, '12:00'), { kontext: k })).toBe(true);
    // eigenen Termin beim Verschieben ignorieren
    expect(verfuegbar('jonas', iso(MO, '10:00'), iso(MO, '12:00'), { kontext: k, ohneTerminId: 't1' })).toBe(true);
  });

  it('blockiert genehmigte Abwesenheit, warnt bei beantragter', () => {
    const k = kontext({ abwesenheiten: [abw('a1', 'jonas', MO, DI), abw('a2', 'mehmet', MO, MO, { status: 'beantragt' }), abw('a3', 'mehmet', DI, DI, { status: 'abgelehnt' })] });
    expect(pruefeVerfuegbarkeit('jonas', iso(DI, '08:00'), iso(DI, '09:00'), { kontext: k }).gruende[0]).toMatchObject({ art: 'abwesend', text: 'Urlaub' });
    const p = pruefeVerfuegbarkeit('mehmet', iso(MO, '08:00'), iso(MO, '09:00'), { kontext: k });
    expect(p.verfuegbar).toBe(true);
    expect(p.gruende[0]).toMatchObject({ art: 'abwesend_beantragt', blockiert: false });
    expect(verfuegbar('mehmet', iso(DI, '08:00'), iso(DI, '09:00'), { kontext: k })).toBe(true);
  });

  it('halbtags blockiert nur den Vormittag', () => {
    const k = kontext({ abwesenheiten: [abw('a1', 'jonas', MO, MO, { halbtags: true, art: 'schule' })] });
    expect(verfuegbar('jonas', iso(MO, '08:00'), iso(MO, '09:00'), { kontext: k })).toBe(false);
    expect(verfuegbar('jonas', iso(MO, '13:00'), iso(MO, '15:00'), { kontext: k })).toBe(true);
  });

  it('prüft Arbeitszeit, Arbeitstage und aktive Mitarbeiter', () => {
    const k = kontext();
    expect(pruefeVerfuegbarkeit('jonas', iso(MO, '15:00'), iso(MO, '17:00'), { kontext: k }).gruende[0].art).toBe('ausserhalb');
    expect(pruefeVerfuegbarkeit('jonas', iso(MO, '06:00'), iso(MO, '08:00'), { kontext: k }).verfuegbar).toBe(false);
    expect(pruefeVerfuegbarkeit('jonas', iso(SA, '09:00'), iso(SA, '10:00'), { kontext: k }).gruende[0].art).toBe('kein_arbeitstag');
    expect(pruefeVerfuegbarkeit('alt', iso(MO, '09:00'), iso(MO, '10:00'), { kontext: k }).gruende[0].art).toBe('inaktiv');
    expect(verfuegbar('gibtsnicht', iso(MO, '09:00'), iso(MO, '10:00'), { kontext: k })).toBe(false);
  });

  it('ganztägige Termine belegen den ganzen Arbeitstag', () => {
    const k = kontext({ termine: [termin('g', ['jonas'], MO, '00:00', '23:59', { ganztags: true })] });
    expect(verfuegbar('jonas', iso(MO, '15:00'), iso(MO, '15:30'), { kontext: k })).toBe(false);
    expect(verfuegbar('jonas', iso(DI, '07:00'), iso(DI, '08:00'), { kontext: k })).toBe(true);
  });
});

describe('terminKonflikte', () => {
  it('listet Konflikte je Mitarbeiter, ignoriert den Termin selbst', () => {
    const t = termin('neu', ['jonas', 'mehmet'], MO, '09:00', '12:00');
    const k = kontext({ termine: [t, termin('alt', ['jonas'], MO, '11:00', '13:00')], abwesenheiten: [abw('u', 'mehmet', MO, MO)] });
    const r = terminKonflikte(t, k);
    expect(r).toHaveLength(2);
    expect(r.find((x) => x.mitarbeiterId === 'jonas')!.gruende.map((g) => g.text)).toEqual(['Doppelt gebucht']);
    expect(r.find((x) => x.mitarbeiterId === 'mehmet')!.gruende.map((g) => g.text)).toEqual(['Urlaub']);
    expect(terminKonflikte({ ...t, status: 'abgesagt' }, k)).toEqual([]);
  });
});

describe('freieSlots', () => {
  const ab = new Date('2000-01-01');

  it('findet Slots im Raster innerhalb der Arbeitszeit', () => {
    const slots = freieSlots({ von: MO, bis: MO, dauerMinuten: 60, rasterMinuten: 60, mitarbeiterIds: ['jonas'], kontext: kontext(), ab });
    expect(slots).toHaveLength(9); // 07–16 Uhr
    expect(slots[0].start).toBe(iso(MO, '07:00'));
    expect(slots.at(-1)!.ende).toBe(iso(MO, '16:00'));
  });

  it('lässt belegte Zeiten, Abwesenheiten und Wochenenden aus', () => {
    const k = kontext({
      termine: [termin('t', ['jonas'], MO, '08:00', '15:00')],
      abwesenheiten: [abw('u', 'mehmet', MO, MO)],
    });
    const slots = freieSlots({ von: MO, bis: SA, dauerMinuten: 60, rasterMinuten: 60, kontext: k, ab, zeitVon: '07:00', zeitBis: '09:00' });
    // Montag: Jonas 07–08 frei, Mehmet im Urlaub, "alt" inaktiv
    const montag = slots.filter((s) => s.start.startsWith(iso(MO, '07:00').slice(0, 10)) && s.start < iso(DI, '00:00'));
    expect(montag.map((s) => s.start)).toEqual([iso(MO, '07:00')]);
    expect(montag[0].mitarbeiterIds).toEqual(['jonas']);
    // Di–Fr je 2 Slots, Samstag keiner
    expect(slots).toHaveLength(1 + 4 * 2);
  });

  it('respektiert Wochentage, mindestens, Puffer, ab und max', () => {
    const k = kontext({ termine: [termin('t', ['jonas'], DI, '10:00', '11:00')] });
    expect(freieSlots({ von: MO, bis: '2030-03-08', dauerMinuten: 60, wochentage: [2], kontext: k, ab }).every((s) => s.start.slice(0, 10) <= DI)).toBe(true);
    const zwei = freieSlots({ von: DI, bis: DI, dauerMinuten: 60, rasterMinuten: 60, mindestens: 2, kontext: k, ab });
    expect(zwei.map((s) => s.start)).not.toContain(iso(DI, '10:00'));
    const puffer = freieSlots({ von: DI, bis: DI, dauerMinuten: 60, rasterMinuten: 60, mitarbeiterIds: ['jonas'], pufferMinuten: 30, kontext: k, ab });
    expect(puffer.map((s) => s.start)).not.toContain(iso(DI, '09:00'));
    expect(puffer.map((s) => s.start)).not.toContain(iso(DI, '11:00'));
    expect(freieSlots({ von: MO, bis: MO, dauerMinuten: 60, kontext: k, ab: new Date(iso(MO, '15:00')) })).toHaveLength(1);
    expect(freieSlots({ von: MO, bis: DI, dauerMinuten: 30, kontext: k, ab, max: 3 })).toHaveLength(3);
  });
});

describe('Stunden', () => {
  it('berechnet verfügbare Stunden abzüglich Abwesenheiten', () => {
    const k = kontext({ abwesenheiten: [abw('u', 'jonas', MO, DI), abw('s', 'jonas', '2030-03-06', '2030-03-06', { halbtags: true })] });
    expect(verfuegbareStunden('mehmet', MO, '2030-03-10', k)).toBe(40);
    expect(verfuegbareStunden('jonas', MO, '2030-03-10', k)).toBe(20);
    expect(verfuegbareStunden('alt', MO, '2030-03-10', k)).toBe(0);
  });

  it('summiert geplante Stunden, schneidet am Zeitraum ab', () => {
    const k = kontext({
      termine: [
        termin('a', ['jonas'], MO, '07:00', '12:00'),
        termin('b', ['jonas', 'mehmet'], DI, '13:00', '14:30'),
        termin('c', ['jonas'], DI, '15:00', '16:00', { status: 'abgesagt' }),
        termin('g', ['jonas'], '2030-03-06', '00:00', '23:00', { ganztags: true }),
        termin('x', ['jonas'], '2030-03-11', '07:00', '12:00'),
      ],
    });
    expect(geplanteStunden('jonas', MO, '2030-03-10', k)).toBe(5 + 1.5 + 8);
    expect(geplanteStunden('mehmet', MO, '2030-03-10', k)).toBe(1.5);
  });
});

describe('anwesenheit & Woche', () => {
  it('liefert Text-Status je Tag', () => {
    const k = kontext({ abwesenheiten: [abw('k', 'jonas', MO, MO, { art: 'krank' }), abw('b', 'mehmet', MO, MO, { status: 'beantragt' })] });
    expect(anwesenheit('jonas', MO, k)).toMatchObject({ status: 'abwesend', text: 'Krank' });
    expect(anwesenheit('mehmet', MO, k)).toMatchObject({ status: 'beantragt', text: 'Urlaub beantragt' });
    expect(anwesenheit('mehmet', DI, k)).toMatchObject({ status: 'da', text: 'Da 07:00–16:00' });
    expect(anwesenheit('mehmet', SA, k).status).toBe('frei');
  });

  it('findet den Montag', () => {
    expect(wochenStart('2030-03-10')).toBe(MO);
    expect(wochenStart(MO)).toBe(MO);
    expect(wochenStart('2030-03-06')).toBe(MO);
  });
});
