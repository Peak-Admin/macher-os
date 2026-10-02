import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { setzeEinstellung } from '@core/einstellungen';
import { on, type DbEvent } from '@core/events';
import type { Abwesenheit, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { autoPause, gutschriftTag, pflichtPause, sollPlanTag, sollTag, stundenkonto, tagAuswerten, tagesProbleme, zeitart } from './daten';
import { zeitenFreigeben, zeitenHinweise } from './einsatz';
import { arbeitsmodelle, modellAm, modellSpeichern, modellText, standardMinuten, stundenBuchen, wochenstundenGeaendert, type Arbeitsmodell, type Stundenbuchung } from './modell';
import { LOHN_KOPF, freigeben, kontoHinweise, lohnCsv, monatsAuswertung, monatsGrenzen, regeln, wochenStand } from './regelwerk';

let n = 0;
const z = (x: Partial<Zeiteintrag>): Zeiteintrag =>
  ({ id: `z${n++}`, erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm1', datum: '2026-10-05', start: '07:00', ende: '16:00', pauseMinuten: 0, art: 'arbeit', ...x }) as Zeiteintrag;

const ma = (x: Partial<Mitarbeiter> = {}): Mitarbeiter =>
  ({ id: 'm1', erstelltAm: '', geaendertAm: '', vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true, ...x }) as Mitarbeiter;

const abw = (x: Partial<Abwesenheit>): Abwesenheit =>
  ({ id: `a${n++}`, erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm1', art: 'urlaub', von: '2026-10-07', bis: '2026-10-07', status: 'genehmigt', ...x }) as Abwesenheit;

const modell = (minuten: number[], gueltigAb = '2000-01-01', x: Partial<Arbeitsmodell> = {}): Arbeitsmodell =>
  ({ id: `mo${n++}`, erstelltAm: `2026-01-01T00:00:0${n % 10}Z`, geaendertAm: '', mitarbeiterId: 'm1', gueltigAb, minuten, ...x }) as Arbeitsmodell;

const buchung = (x: Partial<Stundenbuchung>): Stundenbuchung =>
  ({ id: `b${n++}`, erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm1', datum: '2026-10-05', minuten: 60, art: 'korrektur', grund: 'Test', ...x }) as Stundenbuchung;

const neuerMa = (x: Partial<Mitarbeiter> = {}) =>
  db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true, ...x });

beforeEach(() => zuruecksetzen());

// ------------------------------------------------------------------ Pausenregel

describe('Pausenregel nach §4 ArbZG', () => {
  it('Pflichtpause: bis 6 h keine, über 6 h 30 min, über 9 h 45 min', () => {
    expect(pflichtPause(360)).toBe(0);
    expect(pflichtPause(361)).toBe(30);
    expect(pflichtPause(540)).toBe(30);
    expect(pflichtPause(541)).toBe(45);
    expect(pflichtPause(720)).toBe(45);
  });

  it('zieht gestaffelt nur so viel ab, wie fehlt', () => {
    expect(autoPause(360, 0)).toBe(0);
    expect(autoPause(370, 0)).toBe(10); // 6:10 h → 6:00 h, mehr ist nicht nötig
    expect(autoPause(420, 0)).toBe(30);
    expect(autoPause(420, 30)).toBe(0);
    expect(autoPause(420, 20)).toBe(10);
    expect(autoPause(550, 0)).toBe(30); // 9:10 h → 8:40 h mit 30 min Pause
    expect(autoPause(560, 30)).toBe(15); // 9:20 h + 30 min → 9:05 h + 45 min
    expect(autoPause(600, 0)).toBe(45);
    expect(autoPause(600, 45)).toBe(0);
  });

  it('wertet einen Tag aus: Netto, Pausen, Abzug, Zeitarten', () => {
    const w = tagAuswerten([z({ start: '07:00', ende: '14:00' })], { autoPause: true });
    expect(w).toMatchObject({ anwesenheit: 420, pauseErfasst: 0, pauseAuto: 30, netto: 390, laeuft: false });
    expect(w.jeArt).toEqual({ baustelle: 390, fahrt: 0, intern: 0 });
    expect(tagAuswerten([z({ start: '07:00', ende: '14:00' })], { autoPause: false }).netto).toBe(420);
  });

  it('zählt eingetragene Pausen und Lücken ab 15 Minuten', () => {
    expect(tagAuswerten([z({ start: '07:00', ende: '16:00', pauseMinuten: 15 })], { autoPause: true })).toMatchObject({ pauseErfasst: 15, pauseAuto: 15, netto: 510 });
    const geteilt = tagAuswerten([z({ start: '07:00', ende: '12:00' }), z({ start: '12:30', ende: '16:00' })], { autoPause: true });
    expect(geteilt).toMatchObject({ pauseErfasst: 30, pauseAuto: 0, netto: 510 });
    const kurz = tagAuswerten([z({ start: '07:00', ende: '12:00' }), z({ start: '12:10', ende: '16:00' })], { autoPause: true });
    expect(kurz).toMatchObject({ pauseErfasst: 0, pauseAuto: 30, netto: 500 });
  });

  it('zieht die Pause von der größten Zeitart ab und prüft laufende Tage erst zum Feierabend', () => {
    const w = tagAuswerten([z({ art: 'fahrt', start: '07:00', ende: '08:00' }), z({ art: 'arbeit', start: '08:00', ende: '15:00' }), z({ art: 'werkstatt', start: '15:00', ende: '15:30' })], { autoPause: true });
    expect(w.jeArt).toEqual({ baustelle: 420 - 30, fahrt: 60, intern: 30 });
    expect(w.netto).toBe(480);
    const laeuft = tagAuswerten([z({ start: '07:00', ende: undefined })], { autoPause: true, jetzt: { datum: '2026-10-05', uhr: '14:00' } });
    expect(laeuft).toMatchObject({ laeuft: true, pauseAuto: 0, netto: 420 });
  });

  it('ordnet Arten Lohn-Zeitarten zu', () => {
    expect([zeitart('arbeit'), zeitart('fahrt'), zeitart('werkstatt'), zeitart('buero')]).toEqual(['baustelle', 'fahrt', 'intern', 'intern']);
  });

  it('meldet eine abgezogene Pause verständlich statt als Verstoß', () => {
    const zeiten = [z({ start: '07:00', ende: '14:00' })];
    expect(tagesProbleme('m1', '2026-10-05', zeiten, true)).toEqual({ probleme: ['Pause fehlte – 30 min automatisch abgezogen'], pauseAuto: 30 });
    expect(tagesProbleme('m1', '2026-10-05', zeiten, false).probleme).toEqual(['Über 6 Stunden Arbeit: 30 Minuten Pause sind Pflicht']);
  });

  it('ist standardmäßig an und abschaltbar', () => {
    expect(regeln().autoPause).toBe(true);
    setzeEinstellung('arbeitszeiten.autoPause', false);
    expect(regeln().autoPause).toBe(false);
    expect(tagAuswerten([z({ start: '07:00', ende: '14:00' })]).pauseAuto).toBe(0);
  });
});

// ------------------------------------------------------------------ Soll, Modell, Feiertage

describe('Soll-Zeit, Arbeitszeitmodell und Feiertage', () => {
  it('verteilt Wochenstunden ohne Modell auf die Arbeitstage', () => {
    expect(standardMinuten(40, [1, 2, 3, 4, 5])).toEqual([480, 480, 480, 480, 480, 0, 0]);
    expect(standardMinuten(30, [1, 2, 3])).toEqual([600, 600, 600, 0, 0, 0, 0]);
    expect(sollPlanTag(ma(), '2026-10-05', [1, 2, 3, 4, 5], [])).toBe(480);
    expect(sollPlanTag(ma(), '2026-10-10', [1, 2, 3, 4, 5], [])).toBe(0); // Samstag
  });

  it('nimmt Teilzeit je Wochentag aus dem Modell', () => {
    const teilzeit = [modell([360, 360, 360, 360, 0, 0, 0])];
    expect(sollPlanTag(ma({ wochenstunden: 24 }), '2026-10-05', undefined, teilzeit)).toBe(360); // Montag
    expect(sollPlanTag(ma({ wochenstunden: 24 }), '2026-10-09', undefined, teilzeit)).toBe(0); // Freitag frei
    const samstags = [modell([480, 480, 480, 480, 0, 240, 0])];
    expect(sollPlanTag(ma(), '2026-10-10', undefined, samstags)).toBe(240);
    expect(modellText([480, 480, 480, 480, 360, 0, 0])).toBe('Mo–Do je 8 h, Fr 6 h');
  });

  it('wählt die gültige Version des Modells', () => {
    const liste = [modell([480, 480, 480, 480, 480, 0, 0], '2026-01-01'), modell([360, 360, 360, 360, 360, 0, 0], '2026-10-05')];
    expect(modellAm('m1', '2026-10-02', liste)?.gueltigAb).toBe('2026-01-01');
    expect(modellAm('m1', '2026-10-05', liste)?.gueltigAb).toBe('2026-10-05');
    expect(modellAm('m2', '2026-10-05', liste)).toBeUndefined();
  });

  it('gesetzliche Feiertage haben kein Soll, Landesfeiertage nur im Bundesland', () => {
    expect(sollPlanTag(ma(), '2026-05-01', undefined, [])).toBe(0); // Tag der Arbeit (Freitag)
    expect(sollPlanTag(ma(), '2026-05-14', undefined, [])).toBe(0); // Christi Himmelfahrt
    expect(sollPlanTag(ma(), '2026-06-04', undefined, [])).toBe(480); // Fronleichnam: nicht bundesweit
    setzeEinstellung('plan.bundesland', 'BY');
    expect(sollPlanTag(ma(), '2026-06-04', undefined, [])).toBe(0);
    // auch mit Modell: Feiertag schlägt den Wochentag
    expect(sollPlanTag(ma(), '2026-05-14', undefined, [modell([480, 480, 480, 480, 480, 0, 0])])).toBe(0);
  });

  it('Urlaub, Krankheit, Berufsschule zählen als erfüllt – Überstundenabbau nicht', () => {
    expect(gutschriftTag('m1', '2026-10-07', [abw({})], 480)).toBe(480);
    expect(gutschriftTag('m1', '2026-10-07', [abw({ art: 'krank' })], 480)).toBe(480);
    expect(gutschriftTag('m1', '2026-10-07', [abw({ art: 'schule' })], 480)).toBe(480);
    expect(gutschriftTag('m1', '2026-10-07', [abw({ halbtags: true })], 480)).toBe(240);
    expect(gutschriftTag('m1', '2026-10-07', [abw({ art: 'frei' })], 480)).toBe(0);
    expect(gutschriftTag('m1', '2026-10-07', [abw({ status: 'beantragt' })], 480)).toBe(0);
    expect(sollTag(ma(), '2026-10-07', [abw({ art: 'frei' })], undefined, [])).toBe(480);
    expect(sollTag(ma(), '2026-10-07', [abw({})], undefined, [])).toBe(0);
  });

  it('speichert ein neues Modell als Version und sichert die alte Soll-Zeit', () => {
    const m = neuerMa({ eintritt: '2026-01-01' });
    modellSpeichern(m.id, [360, 360, 360, 360, 360, 0, 0], '2026-10-05');
    const liste = arbeitsmodelle.all();
    expect(liste).toHaveLength(2);
    expect(db.mitarbeiter.get(m.id)?.wochenstunden).toBe(30);
    expect(sollTag(db.mitarbeiter.get(m.id)!, '2026-09-28', [], undefined, liste)).toBe(480);
    expect(sollTag(db.mitarbeiter.get(m.id)!, '2026-10-05', [], undefined, liste)).toBe(360);
    // gleicher Tag nochmal → ersetzt statt stapelt
    modellSpeichern(m.id, [480, 480, 480, 480, 0, 0, 0], '2026-10-05');
    expect(arbeitsmodelle.all()).toHaveLength(2);
    expect(db.mitarbeiter.get(m.id)?.wochenstunden).toBe(32);
  });

  it('rechnet geänderte Wochenstunden auf die Verteilung um', () => {
    const m = neuerMa({ eintritt: '2026-01-01', wochenstunden: 38 });
    modellSpeichern(m.id, [480, 480, 480, 480, 360, 0, 0], '2026-01-05');
    const neu = wochenstundenGeaendert(m.id, 38, 19, '2026-10-05');
    expect(neu?.minuten).toEqual([240, 240, 240, 240, 180, 0, 0]);
    expect(wochenstundenGeaendert(m.id, 19, 19)).toBeUndefined();
    // ohne Modell: alte Wochenstunden werden als erste Version gesichert
    const b = neuerMa({ eintritt: '2026-02-01', wochenstunden: 40 });
    wochenstundenGeaendert(b.id, 40, 20, '2026-10-05');
    const vonB = arbeitsmodelle.where((x) => x.mitarbeiterId === b.id);
    expect(vonB.map((x) => x.gueltigAb).sort()).toEqual(['2026-02-01', '2026-10-05']);
    expect(modellAm(b.id, '2026-10-05', vonB)?.minuten).toEqual([240, 240, 240, 240, 240, 0, 0]);
  });
});

// ------------------------------------------------------------------ Saldo / Stundenkonto

describe('Stundenkonto über Wochen', () => {
  // Woche 27.04.–01.05.2026 (Fr Feiertag), dann 04.05. (Mo) und 05.05. (Di Urlaub)
  const zeiten = [
    z({ datum: '2026-04-27', start: '07:00', ende: '16:00', pauseMinuten: 60 }),
    z({ datum: '2026-04-28', start: '07:00', ende: '16:00', pauseMinuten: 60 }),
    z({ datum: '2026-04-29', start: '07:00', ende: '16:00', pauseMinuten: 60 }),
    z({ datum: '2026-04-30', start: '07:00', ende: '17:00', pauseMinuten: 60 }), // +1 h
    z({ datum: '2026-05-04', start: '07:00', ende: '15:00', pauseMinuten: 0 }), // 8 h ohne Pause → 30 min ab
  ];
  const urlaub = [abw({ von: '2026-05-05', bis: '2026-05-05' })];

  it('rechnet Feiertage, Urlaub und automatische Pause ein', () => {
    const k = stundenkonto(ma(), zeiten, urlaub, '2026-05-05', undefined, { modelle: [], buchungen: [], autoPause: true });
    expect(k).toMatchObject({ von: '2026-04-27', soll: 5 * 480, ist: 4 * 480 + 60 + 450, gebucht: 0 });
    expect(k!.saldo).toBe(60 - 30);
  });

  it('nimmt Übertrag aus dem alten System und Auszahlungen auf', () => {
    const buchungen = [buchung({ art: 'startsaldo', datum: '2026-04-27', minuten: 600 }), buchung({ art: 'auszahlung', datum: '2026-05-05', minuten: -120 })];
    const k = stundenkonto(ma(), zeiten, urlaub, '2026-05-05', undefined, { modelle: [], buchungen, autoPause: true });
    expect(k).toMatchObject({ von: '2026-04-27', gebucht: 480, saldo: 30 + 480 });
  });

  it('Übertrag setzt den Beginn: ältere Zeiten zählen nicht mehr', () => {
    const buchungen = [buchung({ art: 'startsaldo', datum: '2026-05-04', minuten: 300 })];
    const k = stundenkonto(ma(), zeiten, urlaub, '2026-05-05', undefined, { modelle: [], buchungen, autoPause: true });
    expect(k).toMatchObject({ von: '2026-05-04', soll: 480, ist: 450, saldo: 300 - 30 });
  });

  it('läuft über den Jahreswechsel weiter', () => {
    const liste = [z({ datum: '2025-12-30', start: '07:00', ende: '17:00', pauseMinuten: 60 }), z({ datum: '2026-01-02', start: '07:00', ende: '16:00', pauseMinuten: 60 })];
    const k = stundenkonto(ma(), liste, [], '2026-01-02', undefined, { modelle: [], buchungen: [] });
    // 30.12. +1 h, 31.12. kein Eintrag (−8 h), 01.01. Feiertag, 02.01. ±0
    expect(k).toMatchObject({ von: '2025-12-30', saldo: 60 - 480 });
  });

  it('Überstundenabbau senkt das Konto', () => {
    const liste = [z({ datum: '2026-10-05', start: '07:00', ende: '16:00', pauseMinuten: 60 })];
    const frei = [abw({ art: 'frei', von: '2026-10-06', bis: '2026-10-06' })];
    expect(stundenkonto(ma(), liste, frei, '2026-10-06', undefined, { modelle: [], buchungen: [] })!.saldo).toBe(-480);
  });

  it('Teilzeit: freie Wochentage zählen nicht als Minus', () => {
    const liste = [z({ datum: '2026-10-05', start: '08:00', ende: '14:00' })];
    const k = stundenkonto(ma({ wochenstunden: 24 }), liste, [], '2026-10-09', undefined, { modelle: [modell([360, 360, 360, 360, 0, 0, 0])], buchungen: [] });
    // Mo 6 h gearbeitet (genau 6 h → keine Pflichtpause), Di–Do je −6 h, Fr kein Soll
    expect(k!.saldo).toBe(-3 * 360);
  });

  it('Stundenbuchung braucht einen Grund', () => {
    expect(() => stundenBuchen({ mitarbeiterId: 'm1', datum: '2026-10-05', minuten: 60, art: 'korrektur', grund: ' ' })).toThrow();
    expect(() => stundenBuchen({ mitarbeiterId: 'm1', datum: '2026-10-05', minuten: 0, art: 'korrektur', grund: 'x' })).toThrow();
    expect(stundenBuchen({ mitarbeiterId: 'm1', datum: '2026-10-05', minuten: 90.4, art: 'korrektur', grund: ' Nachweis Papier ' })).toMatchObject({ minuten: 90, grund: 'Nachweis Papier' });
  });
});

// ------------------------------------------------------------------ Wochenstand & Freigabe

describe('Wochenstand und Freigabe', () => {
  it('zeigt dem Monteur „Diese Woche: X von Y Std“ inklusive Urlaub', () => {
    const zeiten = [0, 1, 2, 3].map((i) => z({ datum: `2026-10-0${5 + i}`, start: '07:00', ende: '15:30', pauseMinuten: 30 }));
    const s = wochenStand(ma(), '2026-10-05', { zeiten: zeiten.slice(0, 3), abw: [abw({ von: '2026-10-08', bis: '2026-10-08' })], modelle: [] });
    expect(s).toMatchObject({ gearbeitet: 3 * 480, gutschrift: 480, soll: 5 * 480 });
    expect(s.text).toBe('Diese Woche: 32 von 40 Std');
    // Woche mit Feiertag: 25.12.2026 ist ein Freitag
    expect(wochenStand(ma(), '2026-12-21', { zeiten: [], abw: [], modelle: [] }).soll).toBe(4 * 480);
    expect(wochenStand(ma(), '2026-12-21', { zeiten: [], abw: [], modelle: [] }).text).toBe('Diese Woche: 0 von 32 Std');
  });

  it('gibt frei, meldet zeit.freigegeben und nimmt nur Abgeschlossenes', () => {
    const m = neuerMa();
    const a = db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-09-28', start: '07:00', ende: '15:00', pauseMinuten: 30, art: 'arbeit' });
    const b = db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-10-01', start: '07:00', ende: '15:00', pauseMinuten: 30, art: 'fahrt' });
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-10-02', start: '07:00', pauseMinuten: 0, art: 'arbeit' });
    const events: DbEvent[] = [];
    const aus = on('zeit.freigegeben', (e) => events.push(e));
    expect(freigeben(db.zeiten.all())).toBe(2);
    expect(freigeben(db.zeiten.all())).toBe(0);
    aus();
    expect(events).toHaveLength(1);
    expect(events[0].daten).toEqual({ zeitIds: [a.id, b.id], mitarbeiterIds: [m.id], von: '2026-09-28', bis: '2026-10-01' });
  });

  it('Wochenfreigabe über die Aktion begrenzt auf die Woche', () => {
    const m = neuerMa();
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-09-21', start: '07:00', ende: '15:00', pauseMinuten: 30, art: 'arbeit' });
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-09-29', start: '07:00', ende: '15:00', pauseMinuten: 30, art: 'arbeit' });
    expect(zeitenFreigeben('2026-10-04', '2026-09-28')).toBe(1);
    expect(db.zeiten.where((x) => !x.freigegeben)).toHaveLength(1);
  });

  it('Hinweis zur Freigabe je abgeschlossener Woche, nicht für die laufende', () => {
    const m = neuerMa({ eintritt: '2026-01-01' });
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-09-21', start: '07:00', ende: '15:30', pauseMinuten: 30, art: 'arbeit' });
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-09-29', start: '07:00', ende: '15:30', pauseMinuten: 30, art: 'arbeit' });
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-10-05', start: '07:00', ende: '15:30', pauseMinuten: 30, art: 'arbeit' });
    const h = zeitenHinweise('2026-10-06').filter((x) => x.schluessel.startsWith('zeiten-freigeben'));
    expect(h.map((x) => x.schluessel).sort()).toEqual(['zeiten-freigeben:2026-09-21', 'zeiten-freigeben:2026-09-28']);
    const alt = h.find((x) => x.schluessel.endsWith('09-21'))!;
    expect(alt.gewicht).toBeGreaterThan(h.find((x) => x.schluessel.endsWith('09-28'))!.gewicht);
    expect(alt.aktionen?.[0]).toMatchObject({ aktion: 'zeiten.freigeben', payload: { von: '2026-09-21', bis: '2026-09-27' } });
  });

  it('Hinweis zu fehlender Pause nennt den automatischen Abzug', () => {
    const m = neuerMa();
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-10-05', start: '07:00', ende: '15:00', pauseMinuten: 0, art: 'arbeit' });
    const h = zeitenHinweise('2026-10-06').find((x) => x.schluessel === `arbzg:${m.id}:2026-10-05`);
    expect(h?.titel).toMatch(/^Pause fehlte: Jonas/);
    expect(h?.text).toBe('Pause fehlte – 30 min automatisch abgezogen');
    expect(h?.aktionen?.[0].aktion).toBe('zeiten.pruefen');
  });

  it('fehlende Buchung nur an Tagen mit Soll laut Modell', () => {
    const m = neuerMa({ eintritt: '2026-01-01' });
    db.zeiten.create({ mitarbeiterId: m.id, datum: '2026-10-01', start: '07:00', ende: '13:00', pauseMinuten: 0, art: 'arbeit' });
    arbeitsmodelle.create({ mitarbeiterId: m.id, gueltigAb: '2026-01-01', minuten: [360, 360, 360, 360, 0, 0, 0] });
    // Freitag 02.10. hat kein Soll → kein Hinweis am Samstag
    expect(zeitenHinweise('2026-10-03').some((x) => x.schluessel === `keine-zeiten:${m.id}:2026-10-02`)).toBe(false);
    // Donnerstag 08.10. hat Soll → Hinweis am Freitag
    expect(zeitenHinweise('2026-10-09').some((x) => x.schluessel === `keine-zeiten:${m.id}:2026-10-08`)).toBe(true);
  });
});

// ------------------------------------------------------------------ Hinweise Stundenkonto

describe('Hinweise zum Stundenkonto', () => {
  it('meldet starkes Plus mit Vorschlag zum Abbau und starkes Minus mit Prüfauftrag', () => {
    const plus = neuerMa({ vorname: 'Ali', eintritt: '2026-01-01' });
    const minus = neuerMa({ vorname: 'Eva', eintritt: '2026-01-01' });
    const chef = neuerMa({ vorname: 'Chef', rolle: 'chef', eintritt: '2026-01-01' });
    for (const d of ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']) {
      db.zeiten.create({ mitarbeiterId: plus.id, datum: d, start: '06:00', ende: '17:45', pauseMinuten: 45, art: 'arbeit' });
      db.zeiten.create({ mitarbeiterId: chef.id, datum: d, start: '06:00', ende: '17:45', pauseMinuten: 45, art: 'buero' });
    }
    db.zeiten.create({ mitarbeiterId: minus.id, datum: '2026-09-28', start: '07:00', ende: '09:00', pauseMinuten: 0, art: 'arbeit' });
    setzeEinstellung('arbeitszeiten.grenzePlus', 10 * 60);
    setzeEinstellung('arbeitszeiten.grenzeMinus', 10 * 60);
    const h = kontoHinweise('2026-10-03');
    const p = h.find((x) => x.schluessel === `stundenkonto-plus:${plus.id}`);
    expect(p?.titel).toBe('Ali hat +15 h auf dem Stundenkonto');
    expect(p?.aktionen?.[0]).toMatchObject({ aktion: 'zeiten.abbauen', payload: { mitarbeiterId: plus.id } });
    const mi = h.find((x) => x.schluessel === `stundenkonto-minus:${minus.id}`);
    expect(mi?.titel).toBe('Eva hat −38 h auf dem Stundenkonto');
    expect(mi?.art).toBe('problem');
    expect(h.some((x) => x.bezug?.id === chef.id)).toBe(false);
    setzeEinstellung('arbeitszeiten.grenzePlus', 20 * 60);
    expect(kontoHinweise('2026-10-03').some((x) => x.schluessel.startsWith('stundenkonto-plus'))).toBe(false);
  });
});

// ------------------------------------------------------------------ Monat & Export

describe('Monatsauswertung und Export für den Lohn', () => {
  // Mai 2026: Feiertage 01.05. (Fr), 14.05. (Do), 25.05. (Mo) → 18 Arbeitstage
  const zeiten = [
    z({ datum: '2026-05-04', start: '07:00', ende: '08:00', art: 'fahrt' }),
    z({ datum: '2026-05-04', start: '08:00', ende: '16:00', pauseMinuten: 30, art: 'arbeit', freigegeben: true }),
    z({ datum: '2026-05-05', start: '07:00', ende: '15:00', pauseMinuten: 0, art: 'werkstatt' }), // 8 h ohne Pause → 30 min ab
    z({ datum: '2026-05-06', start: '07:00', ende: '15:30', pauseMinuten: 30, art: 'buero', freigegeben: true }),
  ];
  const abwesenheiten = [
    abw({ art: 'urlaub', von: '2026-05-11', bis: '2026-05-15' }), // 14.05. Feiertag → 4 Tage
    abw({ art: 'krank', von: '2026-05-18', bis: '2026-05-18', halbtags: true }),
    abw({ art: 'frei', von: '2026-05-19', bis: '2026-05-19' }),
  ];

  it('zeigt Monatsgrenzen bis gestern', () => {
    expect(monatsGrenzen('2026-05', '2026-10-01')).toEqual({ von: '2026-05-01', bis: '2026-05-31' });
    expect(monatsGrenzen('2026-10', '2026-10-01')).toEqual({ von: '2026-10-01', bis: '2026-10-01' });
    expect(monatsGrenzen('2026-02', '2026-10-01').bis).toBe('2026-02-28');
  });

  it('rechnet Soll, Zeitarten, Abwesenheitstage, Feiertage und Saldo', () => {
    const w = monatsAuswertung(ma(), '2026-05', { zeiten, abw: abwesenheiten, modelle: [], buchungen: [], stichtag: '2026-05-31', autoPause: true });
    expect(w.von).toBe('2026-05-04');
    expect(w.soll).toBe(18 * 480);
    expect(w.jeArt).toEqual({ baustelle: 450, fahrt: 60, intern: 450 + 480 });
    expect(w.gearbeitet).toBe(450 + 60 + 450 + 480);
    expect(w.pauseAuto).toBe(30);
    expect(w.abwesenheit).toMatchObject({ urlaub: 4, krank: 0.5, frei: 1 });
    expect(w.gutschrift).toBe(4 * 480 + 240);
    expect(w.feiertage).toBe(3);
    expect(w.offen).toBe(2);
    const sollte = w.gearbeitet + w.gutschrift - w.soll;
    expect(w.saldo).toBe(sollte);
    expect(w.minusstunden).toBe(-sollte);
    expect(w.ueberstunden).toBe(0);
    expect(w.kontoEnde).toBe(w.saldo);
    // Arbeitstage ohne Zeit und ohne Abwesenheit: 07., 08., 18. (halbtags krank zählt als Abwesenheit) … nicht 19. (Abbau)
    expect(w.tageOhneZeit).toContain('2026-05-07');
    expect(w.tageOhneZeit).not.toContain('2026-05-19');
    expect(w.tageOhneZeit).not.toContain('2026-05-14');
  });

  it('ohne Zeiten und ohne Übertrag zählt kein Soll (wie im Stundenkonto)', () => {
    const w = monatsAuswertung(ma(), '2026-05', { zeiten: [], abw: abwesenheiten, modelle: [], buchungen: [], stichtag: '2026-05-31' });
    expect(w).toMatchObject({ soll: 0, saldo: 0, kontoEnde: undefined, tageOhneZeit: [], feiertage: 3 });
    expect(w.abwesenheit.urlaub).toBe(4);
  });

  it('schreibt die Monatsübersicht als CSV fürs Lohnbüro', () => {
    const w = monatsAuswertung(ma(), '2026-05', { zeiten, abw: abwesenheiten, modelle: [], buchungen: [buchung({ datum: '2026-05-29', minuten: -120, art: 'auszahlung' })], stichtag: '2026-05-31', autoPause: true });
    const csv = lohnCsv([{ m: ma({ nachname: 'Müller; Sohn' }), w }]);
    const [kopf, zeile] = csv.split('\r\n');
    expect(kopf).toBe(LOHN_KOPF.join(';'));
    expect(kopf).toContain('Überstunden (h)');
    const f = zeile.split(';');
    // Nachname mit Semikolon wird gequotet → Spalten verschieben sich nicht
    expect(zeile.startsWith('05/2026;"Müller; Sohn";Jonas;144,00;24,00;7,50;1,00;15,50;0,50;36,00;-2,00;')).toBe(true);
    expect(f.slice(-8)).toEqual(['4', '0,5', '0', '0', '1', '0', '3', '2']);
  });
});
