import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fuehreAus, kiProtokoll, registriereGateway } from '@core/gateway';
import { db, zuruecksetzen } from '@core/db';
import { zeitpunkt } from '@core/format';
import { ABSICHTEN, AKTIONEN, aufgabeAusEntwurf, aufgabeAusText, fragen, erinnerungAusText, beantworte, findeKunde, verfuegbarkeit, type Kontext } from './assistent';
import { wochenStart } from '@core/format';
import { zeitraumAus } from './zeit';

const HEUTE = '2026-10-02'; // Freitag

function basis() {
  zuruecksetzen();
  db.betrieb.create({ id: 'betrieb', name: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 3, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
  const chef = db.mitarbeiter.create({ vorname: 'Max', nachname: 'Macher', rolle: 'chef', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const jonas = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const mehmet = db.mitarbeiter.create({ vorname: 'Mehmet', nachname: 'Yılmaz', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const hoffmann = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], telefon: '0171 2345678', adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' } });
  return { chef, jonas, mehmet, hoffmann };
}

const kontext = (ich = db.mitarbeiter.all()[0], rechte: string[] = ['lesen', 'schreiben', 'geld', 'personal']): Kontext => ({
  heute: HEUTE,
  jetzt: new Date(`${HEUTE}T10:00:00`),
  ich,
  darf: (r) => rechte.includes(r),
});

describe('Zeitangaben', () => {
  it('versteht Alltagssprache', () => {
    expect(zeitraumAus('Was steht morgen an?', HEUTE)).toMatchObject({ von: '2026-10-03', tag: true });
    expect(zeitraumAus('übermorgen', HEUTE)?.von).toBe('2026-10-04');
    expect(zeitraumAus('bis Freitag', HEUTE)?.von).toBe('2026-10-02');
    expect(zeitraumAus('am Montag', HEUTE)?.von).toBe('2026-10-05');
    expect(zeitraumAus('Wer hat nächste Woche Zeit?', HEUTE)).toMatchObject({ von: '2026-10-05', bis: '2026-10-11', tag: false });
    expect(zeitraumAus('am 12.10.', HEUTE)?.von).toBe('2026-10-12');
    expect(zeitraumAus('am 03.01.', HEUTE)?.von).toBe('2027-01-03');
    expect(zeitraumAus('Was kostet das?', HEUTE)).toBeUndefined();
    expect(wochenStart('2026-10-04')).toBe('2026-09-28');
  });
});

describe('Macher fragen', () => {
  beforeEach(() => basis());

  it('macht aus einem Satz einen Aufgaben-Entwurf', () => {
    const jonas = db.mitarbeiter.all().find((m) => m.vorname === 'Jonas')!;
    expect(aufgabeAusText('Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag', HEUTE)).toEqual({ titel: 'Leiter prüfen', zustaendigId: jonas.id, faellig: '2026-10-02', auftragId: undefined });
    expect(aufgabeAusText('Leg eine Aufgabe für Jonas an: Leiter am Lager prüfen bis morgen', HEUTE)).toMatchObject({ titel: 'Leiter am Lager prüfen', faellig: '2026-10-03' });
    expect(aufgabeAusText('Neue Aufgabe für Mehmet Kabel bestellen', HEUTE)).toMatchObject({ titel: 'Kabel bestellen' });
  });

  it('legt die Aufgabe erst nach Bestätigung an', () => {
    const a = beantworte('Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag', kontext());
    expect(a.absicht).toBe('aufgabe-entwurf');
    expect(db.aufgaben.all()).toHaveLength(0);
    const v = a.vorschlaege![0];
    if (v.art !== 'aufgabe') throw new Error('falscher Vorschlag');
    aufgabeAusEntwurf(v.entwurf, kontext());
    expect(db.aufgaben.all()[0]).toMatchObject({ titel: 'Leiter prüfen', faellig: '2026-10-02', quelle: 'macher' });
  });

  it('beachtet Rechte', () => {
    expect(beantworte('Welche Rechnungen sind offen?', kontext(undefined, ['lesen'])).absicht).toBe('keine-berechtigung');
    expect(beantworte('Leg eine Aufgabe für Jonas an: Test', kontext(undefined, ['lesen'])).absicht).toBe('keine-berechtigung');
    expect(() => aufgabeAusEntwurf({ titel: 'x' }, { darf: () => false })).toThrow();
  });

  it('rechnet offene Rechnungen mit Teilzahlungen', () => {
    const k = db.kunden.all()[0];
    const r = db.rechnungen.create({ nummer: 'R-2026-0001', art: 'rechnung', kundeId: k.id, titel: 'Test', positionen: [{ id: 'p', art: 'pauschal', text: 'x', menge: 1, einheit: 'Psch', einzelpreis: 10000 }], status: 'teilbezahlt', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0 });
    db.zahlungen.create({ rechnungId: r.id, betrag: 4000, datum: '2026-09-20', art: 'ueberweisung' });
    db.rechnungen.create({ nummer: 'R-2026-0002', art: 'rechnung', kundeId: k.id, titel: 'Bezahlt', positionen: [], status: 'bezahlt', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0 });
    const a = beantworte('Welche Rechnungen sind offen?', kontext());
    expect(a.absicht).toBe('rechnungen-offen');
    expect(a.eintraege).toHaveLength(1);
    expect(a.text).toMatch(/1 Rechnung ist offen, zusammen 79,00/);
    expect(a.eintraege![0].status?.ton).toBe('achtung');
  });

  it('beantwortet „Was steht morgen an?“', () => {
    const jonas = db.mitarbeiter.all().find((m) => m.vorname === 'Jonas')!;
    db.termine.create({ art: 'einsatz', titel: 'Zähler tauschen', start: zeitpunkt('2026-10-03', '08:00'), ende: zeitpunkt('2026-10-03', '10:00'), mitarbeiterIds: [jonas.id], status: 'geplant' });
    db.termine.create({ art: 'einsatz', titel: 'Heute', start: zeitpunkt(HEUTE, '08:00'), ende: zeitpunkt(HEUTE, '10:00'), mitarbeiterIds: [jonas.id], status: 'geplant' });
    const a = beantworte('Was steht morgen an?', kontext());
    expect(a.absicht).toBe('agenda');
    expect(a.eintraege).toHaveLength(1);
    expect(a.eintraege![0].titel).toContain('Zähler tauschen');
  });

  it('findet Kunden und Kollegen', () => {
    expect(findeKunde('Wo ist Familie Hoffmann?')?.name).toBe('Familie Hoffmann');
    const a = beantworte('Wo ist Familie Hoffmann?', kontext());
    expect(a.absicht).toBe('wo-kunde');
    expect(a.text).toContain('Lindenweg 12');
    const jonas = db.mitarbeiter.all().find((m) => m.vorname === 'Jonas')!;
    db.termine.create({ art: 'einsatz', titel: 'Baustelle', kundeId: db.kunden.all()[0].id, start: zeitpunkt(HEUTE, '07:00'), ende: zeitpunkt(HEUTE, '12:00'), mitarbeiterIds: [jonas.id], status: 'geplant' });
    const b = beantworte('Wo ist Jonas?', kontext());
    expect(b.absicht).toBe('wo-mitarbeiter');
    expect(b.text).toContain('gerade bei Familie Hoffmann');
  });

  it('schätzt freie Zeit aus Terminen und Abwesenheiten', () => {
    const { jonas, mehmet } = { jonas: db.mitarbeiter.all()[1], mehmet: db.mitarbeiter.all()[2] };
    db.termine.create({ art: 'einsatz', titel: 'x', start: zeitpunkt('2026-10-05', '07:00'), ende: zeitpunkt('2026-10-05', '15:00'), mitarbeiterIds: [jonas.id], status: 'geplant' });
    db.abwesenheiten.create({ mitarbeiterId: mehmet.id, art: 'urlaub', von: '2026-10-05', bis: '2026-10-09', status: 'genehmigt' });
    const v = verfuegbarkeit({ von: '2026-10-05', bis: '2026-10-11' });
    expect(v.find((x) => x.m.id === jonas.id)).toMatchObject({ frei: 32, verplant: 8 });
    expect(v.find((x) => x.m.id === mehmet.id)).toMatchObject({ frei: 0 });
    const a = beantworte('Wer hat nächste Woche Zeit?', kontext());
    expect(a.absicht).toBe('verfuegbarkeit');
    expect(a.eintraege?.find((e) => e.titel.startsWith('Mehmet'))?.status?.text).toBe('Abwesend');
  });

  it('fällt auf Hilfe zurück, statt zu raten', () => {
    const a = beantworte('Wie wird das Wetter?', kontext());
    expect(a.absicht).toBe('unbekannt');
    expect(a.folgefragen?.length).toBeGreaterThan(0);
  });
});

describe('Erinnerung per Satz', () => {
  it('macht aus „Erinnere mich morgen …“ eine Aufgabe für mich', () => {
    expect(erinnerungAusText('Erinnere mich morgen daran, Familie Hartmann anzurufen', '2026-10-02', 'ich')).toEqual({ titel: 'Familie Hartmann anrufen', zustaendigId: 'ich', faellig: '2026-10-03' });
    expect(erinnerungAusText('Erinnere mich heute an Material bestellen', '2026-10-02', 'ich')).toMatchObject({ titel: 'Material bestellen', faellig: '2026-10-02' });
    expect(erinnerungAusText('Erinnere mich daran, die Leiter zu prüfen', '2026-10-02', 'ich')).toMatchObject({ titel: 'Die Leiter prüfen' });
  });
});

describe('Macher fragen über den Gateway', () => {
  let aus: () => void;
  beforeEach(() => {
    basis();
    aus = registriereGateway({ absichten: ABSICHTEN, aktionen: AKTIONEN });
  });
  afterEach(() => aus());

  it('beantwortet und protokolliert jede Frage', async () => {
    const { antwort, modell } = await fragen('Was steht morgen an?', kontext(), 'sprache');
    expect(antwort.absicht).toBe('agenda');
    expect(modell).toBe('Regeln');
    expect(kiProtokoll.all()[0]).toMatchObject({ absicht: 'appointment.list', kanal: 'sprache', lane: 0, ergebnis: 'beantwortet' });
  });

  it('zeigt fehlende Rechte als normale Antwort', async () => {
    expect((await fragen('Welche Rechnungen sind offen?', kontext(undefined, ['lesen']))).antwort.absicht).toBe('keine-berechtigung');
  });

  it('legt Aufgaben nur über die bestätigte Aktion an', async () => {
    const { antwort } = await fragen('Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag', kontext());
    const v = antwort.vorschlaege![0];
    if (v.art !== 'aufgabe') throw new Error('falscher Vorschlag');
    expect(kiProtokoll.all()[0].ergebnis).toBe('vorgeschlagen');
    expect(await fuehreAus({ aktion: 'task.create', daten: v.entwurf }, kontext())).toMatchObject({ ok: false, grund: 'bestaetigung' });
    const r = await fuehreAus({ aktion: 'task.create', daten: v.entwurf }, kontext(), { bestaetigt: true });
    expect(r.ok).toBe(true);
    expect(db.aufgaben.all()).toHaveLength(1);
  });
});
