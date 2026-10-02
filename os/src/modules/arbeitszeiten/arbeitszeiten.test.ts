import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { on } from '@core/events';
import { heute, kalenderwoche, wochenStart } from '@core/format';
import type { Abwesenheit, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { csvExport, dauer, pauseBeenden, pauseStarten, pruefeMitarbeiterTag, pruefeTag, ruhezeitVerletzt, saldoText, sollTag, starten, stoppen, stundenkonto } from './daten';
import { einsatzBeenden, einsatzStarten, zeitenFreigeben, zeitenHinweise } from './einsatz';

const z = (x: Partial<Zeiteintrag>): Zeiteintrag =>
  ({ id: Math.random().toString(), erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm1', datum: '2026-10-05', start: '07:00', ende: '16:00', pauseMinuten: 45, art: 'arbeit', ...x }) as Zeiteintrag;

const ma = (x: Partial<Mitarbeiter> = {}): Mitarbeiter =>
  ({ id: 'm1', erstelltAm: '', geaendertAm: '', vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true, ...x }) as Mitarbeiter;

describe('Dauer & Anzeige', () => {
  it('rechnet Netto-Minuten, auch über Mitternacht und für laufende Zeiten', () => {
    expect(dauer(z({}))).toBe(9 * 60 - 45);
    expect(dauer(z({ start: '22:00', ende: '02:00', pauseMinuten: 0 }))).toBe(240);
    expect(dauer(z({ ende: undefined, pauseMinuten: 0 }), { datum: '2026-10-05', uhr: '09:30' })).toBe(150);
    expect(dauer(z({ ende: undefined }))).toBe(0);
  });

  it('formatiert Salden', () => {
    expect(saldoText(150)).toBe('+2,5 h');
    expect(saldoText(-60)).toBe('−1 h');
    expect(saldoText(0)).toBe('0 h');
  });

  it('findet Montag und Kalenderwoche', () => {
    expect(wochenStart('2026-10-02')).toBe('2026-09-28');
    expect(wochenStart('2026-10-04')).toBe('2026-09-28'); // Sonntag
    expect(kalenderwoche('2026-10-02')).toBe(40);
    expect(kalenderwoche('2026-01-01')).toBe(1);
  });
});

describe('Arbeitszeitgesetz', () => {
  it('verlangt 30 min Pause ab mehr als 6 h und 45 min ab mehr als 9 h', () => {
    expect(pruefeTag([z({ start: '07:00', ende: '13:30', pauseMinuten: 0 })]).probleme).toEqual(['Über 6 Stunden Arbeit: 30 Minuten Pause sind Pflicht']);
    expect(pruefeTag([z({ start: '07:00', ende: '13:30', pauseMinuten: 30 })]).probleme).toEqual([]);
    expect(pruefeTag([z({ start: '06:00', ende: '16:00', pauseMinuten: 30 })]).probleme).toEqual(['Über 9 Stunden Arbeit: 45 Minuten Pause sind Pflicht']);
  });

  it('zählt Lücken ab 15 Minuten zwischen Einträgen als Pause', () => {
    const tag = [z({ start: '07:00', ende: '12:00', pauseMinuten: 0 }), z({ start: '12:30', ende: '16:00', pauseMinuten: 0 })];
    const p = pruefeTag(tag);
    expect(p.pauseMin).toBe(30);
    expect(p.arbeitMin).toBe(510);
    expect(p.probleme).toEqual([]);
  });

  it('meldet mehr als 10 Stunden und zu kurze Ruhezeit', () => {
    expect(pruefeTag([z({ start: '05:00', ende: '17:00', pauseMinuten: 60 })]).probleme[0]).toMatch(/Mehr als 10 Stunden/);
    expect(ruhezeitVerletzt('22:00', '06:00')).toBe(true);
    expect(ruhezeitVerletzt('17:00', '06:00')).toBe(false);
    const zeiten = [z({ datum: '2026-10-05', start: '12:00', ende: '22:00', pauseMinuten: 45 }), z({ datum: '2026-10-06', start: '06:00', ende: '14:00', pauseMinuten: 30 })];
    expect(pruefeMitarbeiterTag('m1', '2026-10-06', zeiten).probleme).toContain('Weniger als 11 Stunden Ruhezeit seit gestern');
  });
});

describe('Soll & Stundenkonto', () => {
  const urlaub = { id: 'u', mitarbeiterId: 'm1', art: 'urlaub', von: '2026-10-07', bis: '2026-10-07', status: 'genehmigt' } as Abwesenheit;

  it('Soll = Wochenstunden / 5, Wochenende/Feiertag 0, Urlaub gutgeschrieben', () => {
    expect(sollTag(ma(), '2026-10-05', [])).toBe(480);
    expect(sollTag(ma(), '2026-10-03', [])).toBe(0);
    expect(sollTag(ma(), '2026-10-07', [urlaub])).toBe(0);
    expect(sollTag(ma(), '2026-10-07', [{ ...urlaub, halbtags: true }])).toBe(240);
    expect(sollTag(ma({ eintritt: '2026-10-06' }), '2026-10-05', [])).toBe(0);
  });

  it('beginnt mit der ersten erfassten Zeit und zählt Überstunden', () => {
    const zeiten = [z({ datum: '2026-10-05', start: '07:00', ende: '16:45', pauseMinuten: 45 }), z({ datum: '2026-10-06', start: '07:00', ende: '15:30', pauseMinuten: 30 })];
    const k = stundenkonto(ma(), zeiten, [urlaub], '2026-10-07');
    expect(k).toMatchObject({ von: '2026-10-05', soll: 960, ist: 540 + 480, saldo: 60 });
    expect(stundenkonto(ma(), [], [], '2026-10-07')).toBeUndefined();
  });
});

describe('CSV für die Lohnabrechnung', () => {
  it('schreibt Semikolon-CSV mit Dezimalkomma und lässt laufende Zeiten weg', () => {
    const csv = csvExport([z({ notiz: 'Material; geholt' }), z({ ende: undefined })], () => ma(), () => 'A-2026-0004');
    const zeilen = csv.split('\r\n');
    expect(zeilen).toHaveLength(2);
    expect(zeilen[0]).toBe('Datum;Nachname;Vorname;Art;Auftrag;Beginn;Ende;Pause (min);Stunden;Freigegeben;Notiz');
    expect(zeilen[1]).toBe('05.10.2026;Becker;Jonas;Arbeit;A-2026-0004;07:00;16:00;45;8,25;nein;"Material; geholt"');
  });
});

describe('Stempeln & Einsatz', () => {
  beforeEach(() => zuruecksetzen());

  it('Start stoppt die laufende Zeit, Pause wird angerechnet', () => {
    const a = starten('m1', { art: 'fahrt', uhr: '07:00' });
    const b = starten('m1', { art: 'arbeit', uhr: '07:30' });
    expect(db.zeiten.get(a.id)?.ende).toBe('07:30');
    pauseStarten(b, '12:00');
    pauseBeenden(db.zeiten.get(b.id)!, '12:30');
    stoppen(db.zeiten.get(b.id)!, '16:00');
    expect(db.zeiten.get(b.id)).toMatchObject({ ende: '16:00', pauseMinuten: 30 });
  });

  it('einsatz.starten/beenden setzt Zeit, Terminstatus und feuert Events', () => {
    const m = db.mitarbeiter.create({ vorname: 'J', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    const t = db.termine.create({ art: 'einsatz', titel: 'Wartung', start: new Date().toISOString(), ende: new Date().toISOString(), mitarbeiterIds: [m.id], status: 'bestaetigt', auftragId: 'a1' });
    const events: string[] = [];
    const aus = on('einsatz.*', (e) => events.push(e.typ));
    const zeit = einsatzStarten({ terminId: t.id, mitarbeiterId: m.id });
    expect(zeit).toMatchObject({ terminId: t.id, auftragId: 'a1', art: 'arbeit' });
    expect(db.termine.get(t.id)?.status).toBe('vor_ort');
    // zweimal starten legt keine zweite Zeit an
    einsatzStarten({ terminId: t.id, mitarbeiterId: m.id });
    expect(db.zeiten.where((x) => x.terminId === t.id)).toHaveLength(1);
    einsatzBeenden({ terminId: t.id, mitarbeiterId: m.id });
    aus();
    expect(db.zeiten.get(zeit!.id)?.ende).toBeTruthy();
    expect(db.termine.get(t.id)?.status).toBe('erledigt');
    expect(events).toEqual(['einsatz.gestartet', 'einsatz.gestartet', 'einsatz.beendet']);
  });

  it('meldet „läuft seit gestern“ und gibt Zeiten frei', () => {
    const m = db.mitarbeiter.create({ vorname: 'J', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    const gestern = new Date(Date.now() - 86_400_000);
    const d = `${gestern.getFullYear()}-${String(gestern.getMonth() + 1).padStart(2, '0')}-${String(gestern.getDate()).padStart(2, '0')}`;
    db.zeiten.create({ mitarbeiterId: m.id, datum: d, start: '07:00', pauseMinuten: 0, art: 'arbeit' });
    const h = zeitenHinweise(heute()).find((x) => x.schluessel.startsWith('zeit-laeuft'));
    expect(h?.fuerMitarbeiterId).toBe(m.id);
    expect(h?.titel).toMatch(/seit gestern/);
    db.zeiten.create({ mitarbeiterId: m.id, datum: d, start: '07:00', ende: '08:00', pauseMinuten: 0, art: 'fahrt' });
    expect(zeitenFreigeben(d)).toBe(1);
  });
});
