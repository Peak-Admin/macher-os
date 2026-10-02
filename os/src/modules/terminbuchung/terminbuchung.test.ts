import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Kunde } from '@core/objects';
import { lokal } from '@core/format';
import type { PlanKontext } from '../verfuegbarkeit/daten';
import { buchen, buchungsfenster, buchungsToken, kundeErkennen, linkAufloesen, pruefeAngaben, slotsFuer, standardFenster, telefonNormal, zuBestaetigen, zustaendige } from './daten';

const kunde = (id: string, x: Partial<Kunde>): Kunde => ({ id, erstelltAm: '', geaendertAm: '', art: 'privat', name: id, ansprechpartner: [], ...x });

describe('Kunde erkennen', () => {
  it('normalisiert Telefonnummern', () => {
    expect(telefonNormal('+49 171 / 234 56-78')).toBe('01712345678');
    expect(telefonNormal('0171 2345678')).toBe('01712345678');
    expect(telefonNormal('12')).toBe('');
  });

  it('findet Kunden über E-Mail oder Telefon', () => {
    const liste = [kunde('a', { email: 'Anna@Example.de' }), kunde('b', { telefon: '0561 99 88 77' }), kunde('c', { ansprechpartner: [{ id: 'x', name: 'X', telefon: '0170 1111111' }] })];
    expect(kundeErkennen(liste, { email: ' anna@example.de ' })?.id).toBe('a');
    expect(kundeErkennen(liste, { telefon: '+49561998877' })?.id).toBe('b');
    expect(kundeErkennen(liste, { telefon: '01701111111' })?.id).toBe('c');
    expect(kundeErkennen(liste, { email: 'neu@example.de', telefon: '0151 000000' })).toBeUndefined();
  });

  it('prüft Pflichtangaben', () => {
    expect(pruefeAngaben({ name: 'A', telefon: '1', email: 'x' })).toEqual({ name: expect.any(String), telefon: expect.any(String), email: expect.any(String) });
    expect(pruefeAngaben({ name: 'Anna', telefon: '0171 2345678', email: '' })).toEqual({});
  });
});

describe('Slots für Buchungsfenster', () => {
  const ma = (id: string, rolle: 'monteur' | 'buero' | 'chef' = 'monteur') => ({ id, erstelltAm: '', geaendertAm: '', vorname: id, nachname: '', rolle, wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const k: PlanKontext = { arbeitsbeginn: '07:00', arbeitsende: '16:00', arbeitstage: [1, 2, 3, 4, 5], mitarbeiter: [ma('j'), ma('s', 'buero')], abwesenheiten: [], termine: [] };
  const f = { ...standardFenster()[0], id: 'f', erstelltAm: '', geaendertAm: '', wochentage: [2], von: '09:00', bis: '12:00', vorlaufStunden: 24, horizontTage: 10 };

  it('nimmt nur Monteure und Chefs, wenn niemand gewählt ist', () => {
    expect(zustaendige(f, k)).toEqual(['j']);
    expect(zustaendige({ mitarbeiterIds: ['s'] }, k)).toEqual(['s']);
  });

  it('liefert Slots nur im Fenster, mit Vorlauf und Horizont', () => {
    // Montag 2030-03-04, 10 Uhr → Dienstag ist < 24 h? nein: Di 09:00 liegt 23 h später → erst ab Di 10:00
    const slots = slotsFuer(f, k, lokal('2030-03-04', 10 * 60));
    expect(slots.map((s) => new Date(s.start).getHours())).toEqual([10, 11, 9, 10, 11]);
    expect(new Date(slots.at(-1)!.start).getDate()).toBe(12);
  });
});

describe('Buchen', () => {
  beforeEach(() => {
    zuruecksetzen();
    db.betrieb.create({ id: 'betrieb', name: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 2, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 0, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
    db.mitarbeiter.create({ id: 'j', vorname: 'Jonas', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  });

  const jetzt = lokal('2030-03-04', 8 * 60);
  const fenster = () => buchungsfenster.create({ ...standardFenster()[0], wochentage: [3], von: '08:00', bis: '12:00', pufferMinuten: 0 });

  it('legt Kunde, Anfrage und selbst gebuchten Termin an', () => {
    const f = fenster();
    const token = buchungsToken();
    expect(buchungsToken()).toBe(token);
    const start = slotsFuer(f, undefined, jetzt)[0].start;
    const r = buchen({ token, fensterId: f.id, start, name: 'Anna Neu', telefon: '0171 2345678', email: 'anna@example.de', strasse: 'Weg 1', plz: '34117', ort: 'Kassel', anliegen: 'Steckdose defekt' }, jetzt);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.neuerKunde).toBe(true);
    expect(r.auftrag).toMatchObject({ phase: 'anfrage', kundeId: r.kunde.id, quelle: 'website' });
    expect(r.termin).toMatchObject({ selbstGebucht: true, status: 'geplant', mitarbeiterIds: ['j'], auftragId: r.auftrag.id, start });
    expect(db.orte.where((o) => o.kundeId === r.kunde.id)).toHaveLength(1);
    expect(zuBestaetigen(db.termine.all(), jetzt).map((t) => t.id)).toEqual([r.termin.id]);
    expect(db.erledigungen.all().some((e) => e.regel === 'terminbuchung.buchung')).toBe(true);

    // gleicher Slot ist jetzt vergeben
    const zweit = buchen({ token, fensterId: f.id, start, name: 'Bernd', telefon: '0151 7654321' }, jetzt);
    expect(zweit).toEqual({ ok: false, fehler: expect.stringContaining('vergeben') });
  });

  it('erkennt bestehende Kunden und nutzt den Kundenlink', () => {
    const f = fenster();
    const k = db.kunden.create({ art: 'privat', name: 'Petra Schulz', telefon: '0160 1112233', ansprechpartner: [] });
    const start = slotsFuer(f, undefined, jetzt)[0].start;
    const r = buchen({ token: buchungsToken(), fensterId: f.id, start, name: 'P. Schulz', telefon: '+49 160 1112233', email: 'p@example.de' }, jetzt);
    expect(r.ok && r.kunde.id).toBe(k.id);
    expect(db.kunden.get(k.id)?.email).toBe('p@example.de');
    expect(db.kunden.all()).toHaveLength(1);

    const andere = db.kunden.create({ art: 'privat', name: 'Firma X', ansprechpartner: [] });
    const t2 = buchungsToken(andere.id);
    expect(linkAufloesen(t2)?.kundeId).toBe(andere.id);
    const r2 = buchen({ token: t2, fensterId: f.id, start: slotsFuer(f, undefined, jetzt)[0].start, name: 'Jemand', telefon: '0151 999999' }, jetzt);
    expect(r2.ok && r2.kunde.id).toBe(andere.id);
  });

  it('lehnt ungültige Links und inaktive Fenster ab', () => {
    const f = fenster();
    expect(buchen({ token: 'falsch', fensterId: f.id, start: '', name: 'Anna', telefon: '0171 2345678' }, jetzt).ok).toBe(false);
    buchungsfenster.update(f.id, { aktiv: false });
    expect(buchen({ token: buchungsToken(), fensterId: f.id, start: '', name: 'Anna', telefon: '0171 2345678' }, jetzt)).toEqual({ ok: false, fehler: expect.stringContaining('Terminart') });
  });
});
