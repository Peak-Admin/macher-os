import { describe, expect, it } from 'vitest';
import type { Mitarbeiter, Zeiteintrag } from '@core/objects';
import { dateiname, filterAnzahl, filterAus, filterZu, istAktuell, summeMinuten, verschieben, zeitenFiltern, zeitraumText, zeitraumWechseln } from './alle';
import { csvExport } from './daten';

const HEUTE = '2026-10-02';

const z = (x: Partial<Zeiteintrag>): Zeiteintrag =>
  ({ id: Math.random().toString(), erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm1', datum: '2026-10-01', start: '07:00', ende: '16:00', pauseMinuten: 30, art: 'arbeit', ...x }) as Zeiteintrag;

const p = (s: string) => new URLSearchParams(s);

describe('Alle Zeiten – Filter aus der URL', () => {
  it('nimmt ohne Angaben diesen Monat und alles', () => {
    expect(filterAus(p(''), HEUTE)).toEqual({ zeitraum: 'monat', von: '2026-10-01', bis: '2026-10-31', ma: '', auftrag: '', art: '' });
  });

  it('liest Woche, Monat und freien Zeitraum', () => {
    expect(filterAus(p('zeitraum=woche'), HEUTE)).toMatchObject({ von: '2026-09-28', bis: '2026-10-04' });
    expect(filterAus(p('von=2026-02-14'), HEUTE)).toMatchObject({ zeitraum: 'monat', von: '2026-02-01', bis: '2026-02-28' });
    expect(filterAus(p('zeitraum=frei&von=2026-09-10&bis=2026-09-20'), HEUTE)).toMatchObject({ von: '2026-09-10', bis: '2026-09-20' });
    // vertauschte Grenzen werden gedreht, kaputte Werte ignoriert
    expect(filterAus(p('zeitraum=frei&von=2026-09-20&bis=2026-09-10'), HEUTE)).toMatchObject({ von: '2026-09-10', bis: '2026-09-20' });
    expect(filterAus(p('zeitraum=quatsch&von=gestern&art=pause'), HEUTE)).toMatchObject({ zeitraum: 'monat', von: '2026-10-01', art: '' });
  });

  it('schreibt nur, was vom Standard abweicht, und liest es gleich zurück', () => {
    const standard = filterAus(p(''), HEUTE);
    expect(filterZu(standard, HEUTE).toString()).toBe('');
    const f = { ...filterAus(p('zeitraum=woche&von=2026-09-15'), HEUTE), ma: 'm2', auftrag: 'a1', art: 'fahrt' as const };
    const url = filterZu(f, HEUTE);
    expect(url.get('zeitraum')).toBe('woche');
    expect(filterAus(url, HEUTE)).toEqual(f);
    expect(filterAnzahl(f)).toBe(3);
  });

  it('blättert und wechselt die Zeitraum-Art', () => {
    const monat = filterAus(p(''), HEUTE);
    expect(verschieben(monat, -1)).toMatchObject({ von: '2026-09-01', bis: '2026-09-30' });
    expect(istAktuell(verschieben(monat, -1), HEUTE)).toBe(false);
    const woche = zeitraumWechseln(monat, 'woche', HEUTE);
    expect(woche).toMatchObject({ zeitraum: 'woche', von: '2026-09-28', bis: '2026-10-04' });
    expect(verschieben(woche, 1)).toMatchObject({ von: '2026-10-05', bis: '2026-10-11' });
    // frei übernimmt die bisherigen Grenzen
    expect(zeitraumWechseln(monat, 'frei', HEUTE)).toMatchObject({ zeitraum: 'frei', von: '2026-10-01', bis: '2026-10-31' });
    // vergangener Monat → Woche bleibt in diesem Monat
    expect(zeitraumWechseln(verschieben(monat, -1), 'woche', HEUTE)).toMatchObject({ von: '2026-08-31' });
  });

  it('beschreibt den Zeitraum', () => {
    expect(zeitraumText(filterAus(p(''), HEUTE))).toBe('Oktober 2026');
    expect(zeitraumText(filterAus(p('zeitraum=woche'), HEUTE))).toBe('28.09.2026 bis 04.10.2026');
    expect(dateiname({ von: '2026-10-01', bis: '2026-10-31' })).toBe('zeiten-2026-10-01-bis-2026-10-31.csv');
  });
});

describe('Alle Zeiten – filtern und summieren', () => {
  const zeiten = [
    z({ id: 'a', datum: '2026-10-01', auftragId: 'A1' }),
    z({ id: 'b', datum: '2026-10-02', mitarbeiterId: 'm2', art: 'fahrt', start: '06:30', ende: '07:00', pauseMinuten: 0, auftragId: 'A1' }),
    z({ id: 'c', datum: '2026-09-30', art: 'werkstatt' }),
    z({ id: 'd', datum: '2026-10-02', geloeschtAm: '2026-10-02T10:00:00Z' }),
    z({ id: 'e', datum: '2026-10-02', start: '08:00', ende: undefined, pauseMinuten: 0 }),
  ];

  it('filtert nach Zeitraum, Mitarbeiter, Auftrag und Art – neueste zuerst, ohne Gelöschte', () => {
    const monat = filterAus(p(''), HEUTE);
    expect(zeitenFiltern(zeiten, monat).map((x) => x.id)).toEqual(['e', 'b', 'a']);
    expect(zeitenFiltern(zeiten, { ...monat, ma: 'm2' }).map((x) => x.id)).toEqual(['b']);
    expect(zeitenFiltern(zeiten, { ...monat, auftrag: 'A1' }).map((x) => x.id)).toEqual(['b', 'a']);
    expect(zeitenFiltern(zeiten, { ...monat, art: 'werkstatt' })).toEqual([]);
    expect(zeitenFiltern(zeiten, filterAus(p('zeitraum=woche'), HEUTE)).map((x) => x.id)).toEqual(['e', 'b', 'a', 'c']);
  });

  it('summiert Netto-Minuten, laufende Zeiten bis jetzt', () => {
    const liste = zeitenFiltern(zeiten, filterAus(p(''), HEUTE));
    expect(summeMinuten(liste)).toBe(510 + 30);
    expect(summeMinuten(liste, { datum: HEUTE, uhr: '10:00' })).toBe(510 + 30 + 120);
  });

  it('exportiert Excel-tauglich: Semikolon, deutsches Datum, Komma als Dezimalzeichen', () => {
    const ma = { vorname: 'Jonas', nachname: 'Becker' } as Mitarbeiter;
    const csv = csvExport(zeitenFiltern(zeiten, filterAus(p(''), HEUTE)), () => ma, (id) => (id ? 'A-1 · Bad' : ''));
    const [kopf, erste] = csv.split('\r\n');
    expect(kopf.split(';')).toContain('Stunden');
    expect(erste).toBe('01.10.2026;Becker;Jonas;Arbeit;A-1 · Bad;07:00;16:00;30;8,50;nein;');
  });
});
