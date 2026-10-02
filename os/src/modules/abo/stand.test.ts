import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { SchreibGesperrt, db, setzeSchreibschutz, zuruecksetzen } from '@core/db';
import { on } from '@core/events';
import { setzeEinstellung } from '@core/einstellungen';
import type { Betrieb } from '@core/objects';
import { aktuellerZustand, lesemodusEinhaengen, standUebernehmen, statusPruefen, VERSATZ_KEY } from './stand';

const betrieb = () =>
  db.betrieb.create({ id: 'betrieb', name: 'Test GmbH', gewerk: 'shk', arbeitsweisen: [], teamgroesse: 3, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6800, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true } as unknown as Betrieb);

describe('Lesemodus über setzeSchreibschutz', () => {
  beforeEach(() => {
    zuruecksetzen();
    setzeSchreibschutz(undefined);
    betrieb();
    lesemodusEinhaengen();
  });
  afterEach(() => setzeSchreibschutz(undefined));

  test('in der Testphase ist alles frei', () => {
    expect(aktuellerZustand().status).toBe('test');
    expect(() => db.kunden.create({ art: 'privat', name: 'A', ansprechpartner: [] })).not.toThrow();
  });

  test('nach Ablauf (Zeit per Einstellung) nur lesen – System, Geld und Kundenbereich bleiben frei', () => {
    const k = db.kunden.create({ art: 'privat', name: 'A', ansprechpartner: [] });
    const r = db.rechnungen.create({ nummer: 'R-1', kundeId: k.id, status: 'versendet' } as never);
    setzeEinstellung(VERSATZ_KEY, 31);
    expect(aktuellerZustand()).toMatchObject({ status: 'lesemodus', grund: 'test_abgelaufen' });

    expect(() => db.kunden.create({ art: 'privat', name: 'B', ansprechpartner: [] })).toThrow(SchreibGesperrt);
    expect(() => db.kunden.update(k.id, { name: 'C' })).toThrow(/Testphase ist vorbei/);
    expect(() => db.rechnungen.create({ nummer: 'R-2' } as never)).toThrow(SchreibGesperrt);
    // offene Rechnung als bezahlt markieren, Zahlung erfassen, Hinweise, Einstellungen
    expect(() => db.rechnungen.update(r.id, { status: 'bezahlt' })).not.toThrow();
    expect(() => db.zahlungen.create({ rechnungId: r.id, betrag: 100, datum: '2026-10-02', art: 'ueberweisung' })).not.toThrow();
    expect(() => db.benachrichtigungen.create({ titel: 'x', gelesen: false } as never)).not.toThrow();
    expect(() => setzeEinstellung('irgendwas', 1)).not.toThrow();
    expect(db.kunden.get(k.id)?.name).toBe('A');
  });

  test('Wechsel in den Lesemodus wird einmal gemeldet', () => {
    const gemeldet: unknown[] = [];
    const aus = on('abo.lesemodus', (e) => gemeldet.push(e.daten));
    statusPruefen();
    setzeEinstellung(VERSATZ_KEY, 40);
    statusPruefen();
    statusPruefen();
    aus();
    expect(gemeldet).toEqual([{ grund: 'test_abgelaufen', planId: undefined }]);
  });

  test('bezahlter Plan vom Server hebt den Lesemodus auf', () => {
    setzeEinstellung(VERSATZ_KEY, 40);
    expect(aktuellerZustand().status).toBe('lesemodus');
    standUebernehmen({ plan: 'team', testBis: '2026-01-01' });
    expect(aktuellerZustand()).toEqual({ status: 'aktiv', planId: 'team' });
    expect(() => db.kunden.create({ art: 'privat', name: 'D', ansprechpartner: [] })).not.toThrow();
  });
});
