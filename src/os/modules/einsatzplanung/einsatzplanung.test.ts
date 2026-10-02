import { describe, expect, it } from 'vitest';
import type { Auftrag, Mitarbeiter, Termin } from '@core/objects';
import { auftragStunden, restStunden, type PlanKontext } from '../verfuegbarkeit/daten';
import { auftragsBalken, aufZelleVerschieben, vorbelegung } from './daten';

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
    expect(auftragStunden('A', termine)).toBe(10);
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

describe('Auftragsbalken über der Plantafel', () => {
  // Woche 4.–8. März 2030 (Mo–Fr), Wochenende ausgeblendet
  const woche = ['2030-03-04', '2030-03-05', '2030-03-06', '2030-03-07', '2030-03-08'];
  const auf = (id: string, x: Partial<Auftrag> = {}): Auftrag => ({
    id,
    erstelltAm: '',
    geaendertAm: '',
    nummer: `A-${id}`,
    titel: id,
    art: 'projekt',
    phase: 'in_arbeit',
    kundeId: 'k',
    ...x,
  });
  const am = (id: string, auftragId: string, tag: string, x: Partial<Termin> = {}) =>
    t(id, ['j'], '08:00', '12:00', {
      auftragId,
      start: iso(tag, '08:00'),
      ende: iso(tag, '12:00'),
      ...x,
    });

  it('leitet den Zeitraum aus den Terminen ab und zählt Einsätze je Tag', () => {
    const termine = [am('1', 'A', '2030-03-05'), am('2', 'A', '2030-03-07'), am('3', 'A', '2030-03-07', { mitarbeiterIds: ['m'] })];
    const [b] = auftragsBalken([auf('A')], termine, woche);
    expect(b).toMatchObject({
      start: '2030-03-05',
      ende: '2030-03-07',
      spalteVon: 1,
      spalteBis: 3,
      beginntFrueher: false,
      endetSpaeter: false,
      status: { text: 'In Arbeit', ton: 'neutral' },
    });
    expect(b.proTag).toEqual({ '2030-03-05': 1, '2030-03-07': 2 });
    expect(b.terminIds).toEqual(['1', '2', '3']);
  });

  it('zeigt Aufträge, die über die Woche hinausgehen, als durchgehenden Balken', () => {
    const termine = [am('1', 'A', '2030-02-25'), am('2', 'A', '2030-03-14')];
    const [b] = auftragsBalken([auf('A')], termine, woche);
    expect(b).toMatchObject({
      spalteVon: 0,
      spalteBis: 4,
      beginntFrueher: true,
      endetSpaeter: true,
      terminIds: [],
    });
    expect(b.proTag).toEqual({});
  });

  it('lässt abgesagte, gelöschte und fremde Termine weg und sortiert nach Start', () => {
    const termine = [
      am('1', 'A', '2030-03-06'),
      am('2', 'B', '2030-03-04'),
      am('3', 'A', '2030-03-04', { status: 'abgesagt' }),
      am('4', 'C', '2030-03-05', { geloeschtAm: '2030-03-01T00:00:00Z' }),
      am('5', 'D', '2030-03-20'),
      am('6', 'V', '2030-03-05'),
    ];
    const liste = auftragsBalken([auf('A'), auf('B', { phase: 'erledigt' }), auf('C'), auf('D'), auf('V', { phase: 'verloren' })], termine, woche);
    expect(liste.map((b) => b.auftrag.id)).toEqual(['B', 'A']);
    expect(liste[0].status).toEqual({ text: 'Erledigt', ton: 'erfolg' });
    expect(liste[1]).toMatchObject({ spalteVon: 2, spalteBis: 2 });
  });

  it('hängt Aufträge ohne Termin ohne Balken an – ohne Doppelte', () => {
    const liste = auftragsBalken([auf('A'), auf('N', { phase: 'beauftragt' })], [am('1', 'A', '2030-03-04')], woche, ['N', 'A', 'N', 'fehlt']);
    expect(liste.map((b) => [b.auftrag.id, b.spalteVon])).toEqual([
      ['A', 0],
      ['N', -1],
    ]);
    expect(liste[1].status.text).toBe('Beauftragt');
  });

  it('berücksichtigt ausgeblendete Tage und mehrtägige Termine', () => {
    // Termin nur an einem ausgeblendeten Tag (Arbeitstage Mo, Mi, Fr; Termin am Di) → kein Balken
    expect(auftragsBalken([auf('A')], [am('1', 'A', '2030-03-05')], ['2030-03-04', '2030-03-06', '2030-03-08'])).toEqual([]);
    // Termin in der Vorwoche → kein Balken
    expect(auftragsBalken([auf('A')], [am('1', 'A', '2030-03-03')], woche)).toEqual([]);
    // ganztägig Mi bis Do (endet Fr 00:00)
    const lang = t('1', ['j'], '00:00', '00:00', {
      auftragId: 'A',
      ganztags: true,
      start: iso('2030-03-06', '00:00'),
      ende: iso('2030-03-08', '00:00'),
    });
    const [b] = auftragsBalken([auf('A')], [lang], woche);
    expect(b).toMatchObject({
      start: '2030-03-06',
      ende: '2030-03-07',
      spalteVon: 2,
      spalteBis: 3,
    });
    expect(b.proTag).toEqual({ '2030-03-06': 1, '2030-03-07': 1 });
    expect(auftragsBalken([auf('A')], [lang], [])).toEqual([]);
  });
});
