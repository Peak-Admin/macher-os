import { describe, expect, it } from 'vitest';
import { betriebsDaten, type ObjektZeile } from './planen';
import { aktionAnwenden, aktionenMitSchluessel, schluesselErstellen, schluesselPruefen } from './serverAktionen';
import type { Mitarbeiter } from '@core/objects';

const B = { erstelltAm: '2026-09-01T08:00:00Z', geaendertAm: '2026-09-01T08:00:00Z' };
const zeile = (sammlung: string, id: string, daten: Record<string, unknown>): ObjektZeile => ({ sammlung, id, daten: { ...B, id, ...daten } });
const ma = (id: string, rolle: string) => zeile('mitarbeiter', id, { vorname: id, nachname: 'T', rolle, aktiv: true });
const d = betriebsDaten([
  ma('chef', 'chef'),
  ma('sandra', 'buero'),
  ma('jonas', 'monteur'),
  zeile('abwesenheiten', 'ab1', { mitarbeiterId: 'jonas', art: 'urlaub', von: '2026-10-12', bis: '2026-10-16', status: 'beantragt', notiz: 'Familie' }),
  zeile('termine', 't1', { art: 'einsatz', titel: 'Wartung', start: '2026-10-05T06:00:00Z', ende: '2026-10-05T08:00:00Z', mitarbeiterIds: ['jonas'], status: 'geplant' }),
  zeile('zeiten', 'z1', { mitarbeiterId: 'jonas', datum: '2026-10-02', start: '07:00', ende: '11:30', pauseMinuten: 30, art: 'arbeit' }),
  zeile('zeiten', 'z2', { mitarbeiterId: 'jonas', datum: '2026-10-02', start: '12:00', pauseMinuten: 0, art: 'arbeit' }),
]);
const wer = (id: string) => d.bestand.mitarbeiter.find((m) => m.id === id) as Mitarbeiter;
const HALB5 = new Date('2026-10-02T14:30:00Z');

describe('Schlüssel an Push-Aktionen', () => {
  it('signiert, prüft und läuft ab', () => {
    const s = schluesselErstellen({ b: 'b1', m: 'chef', a: 'abwesenheit.genehmigen', p: { id: 'ab1' }, t: 'tagesbrief', bis: 2_000 }, 'geheim');
    expect(schluesselPruefen(s, 'geheim', 1_000)).toMatchObject({ m: 'chef', p: { id: 'ab1' } });
    expect(schluesselPruefen(s, 'geheim', 3_000)).toBeUndefined();
    expect(schluesselPruefen(s, 'anderes', 1_000)).toBeUndefined();
    const [daten, sig] = s.split('.');
    const gefaelscht = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(daten, 'base64url').toString()), m: 'jonas' })).toString('base64url');
    expect(schluesselPruefen(`${gefaelscht}.${sig}`, 'geheim', 1_000)).toBeUndefined();
  });
  it('nur serverseitig ausführbare Aktionen bekommen einen Schlüssel, ohne Geheimnis keiner', () => {
    const aktionen = [{ aktion: 'abwesenheit.genehmigen', label: 'Genehmigen', payload: { id: 'ab1' } }, { aktion: 'mahnung.senden', label: 'Senden' }];
    const mit = aktionenMitSchluessel(aktionen, { betriebId: 'b1', mitarbeiterId: 'chef', takt: 'tagesbrief', geheim: 'g' });
    expect(typeof mit[0].schluessel).toBe('string');
    expect(mit[1].schluessel).toBeUndefined();
    expect(aktionenMitSchluessel(aktionen, { betriebId: 'b1', mitarbeiterId: 'chef', takt: 'tagesbrief' })).toEqual(aktionen);
  });
});

describe('Aktionen auf dem Server', () => {
  it('Chef genehmigt Urlaub: Status + Zeitstrahl, übrige Felder bleiben', () => {
    const r = aktionAnwenden('abwesenheit.genehmigen', { id: 'ab1' }, d, wer('chef'), HALB5);
    if ('fehler' in r) throw new Error(r.fehler);
    expect(r.text).toBe('Urlaub genehmigt.');
    expect(r.zeilen[0]).toMatchObject({ sammlung: 'abwesenheiten', id: 'ab1', daten: { status: 'genehmigt', notiz: 'Familie', von: '2026-10-12' } });
    expect(r.zeilen[1]).toMatchObject({ sammlung: 'ereignisse', daten: { typ: 'genehmigt', bezug: { typ: 'abwesenheiten', id: 'ab1' }, vonMitarbeiterId: 'chef' } });
  });
  it('Recht wird geprüft: Büro darf keinen Urlaub genehmigen, aber Termine bestätigen; Monteur nichts davon', () => {
    expect(aktionAnwenden('abwesenheit.genehmigen', { id: 'ab1' }, d, wer('sandra'))).toEqual({ fehler: 'Dafür fehlt dir das Recht.' });
    expect(aktionAnwenden('termin.bestaetigen', { terminId: 't1' }, d, wer('sandra'))).toMatchObject({ text: 'Termin bestätigt.' });
    expect(aktionAnwenden('termin.bestaetigen', { terminId: 't1' }, d, wer('jonas'))).toEqual({ fehler: 'Dafür fehlt dir das Recht.' });
    expect(aktionAnwenden('mahnung.senden', {}, d, wer('chef'))).toEqual({ fehler: 'Diese Aktion geht nur in der App.' });
  });
  it('schon entschieden → ehrliche Meldung statt doppelt', () => {
    const genehmigt = betriebsDaten([ma('chef', 'chef'), zeile('abwesenheiten', 'ab1', { mitarbeiterId: 'x', art: 'urlaub', von: '2026-10-12', bis: '2026-10-12', status: 'genehmigt' })]);
    expect(aktionAnwenden('abwesenheit.ablehnen', { id: 'ab1' }, genehmigt, genehmigt.bestand.mitarbeiter[0] as Mitarbeiter)).toEqual({ fehler: 'Der Antrag ist schon genehmigt.' });
  });
  it('Monteur bestätigt nur eigene Zeiten; laufende endet jetzt (deutsche Zeit)', () => {
    expect(aktionAnwenden('takte.zeiten-bestaetigen', { mitarbeiterId: 'chef', datum: '2026-10-02' }, d, wer('jonas'), HALB5)).toEqual({ fehler: 'Du kannst nur deine eigenen Zeiten bestätigen.' });
    const r = aktionAnwenden('takte.zeiten-bestaetigen', { mitarbeiterId: 'jonas', datum: '2026-10-02' }, d, wer('jonas'), HALB5);
    if ('fehler' in r) throw new Error(r.fehler);
    expect(r.zeilen.find((z) => z.id === 'z2')?.daten).toMatchObject({ ende: '16:30', start: '12:00' });
    expect(r.zeilen.filter((z) => z.sammlung === 'ereignisse')).toHaveLength(2);
    expect(r.zeilen.at(-1)).toMatchObject({ sammlung: 'einstellungen', id: 'takte.zeiten-bestaetigt.jonas.2026-10-02' });
    expect(aktionAnwenden('takte.zeiten-bestaetigen', { mitarbeiterId: 'jonas', datum: '2026-10-01' }, d, wer('jonas'))).toEqual({ fehler: 'Für diesen Tag ist noch keine Zeit erfasst.' });
  });
});
