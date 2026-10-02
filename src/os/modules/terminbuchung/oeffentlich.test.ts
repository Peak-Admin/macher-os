import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { lokal } from '@core/format';
import { oeffentlicheEingaben } from '@modules/kundenbereich/oeffentlich';
import { buchungsfenster, buchungsToken, linkAufloesen, standardFenster } from './daten';
import { buchungEingabe, buchungsSicht } from './oeffentlich';

describe('Terminbuchung für echte Kunden', () => {
  beforeEach(() => {
    zuruecksetzen();
    db.betrieb.create({ id: 'betrieb', name: 'Elektro Weiß', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 2, adresse: { strasse: '', plz: '', ort: '' }, telefon: '0561 123', email: '', stundensatz: 0, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
    db.mitarbeiter.create({ id: 'j', vorname: 'Jonas', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  });
  const jetzt = lokal('2030-03-04', 8 * 60);
  const fenster = () => buchungsfenster.create({ ...standardFenster()[0], wochentage: [3], von: '08:00', bis: '12:00', pufferMinuten: 0 });

  it('Sicht: freie Termine je Terminart und Absender – keine internen Daten', () => {
    const f = fenster();
    const s = buchungsSicht(linkAufloesen(buchungsToken())!, jetzt);
    expect(s.betrieb).toMatchObject({ name: 'Elektro Weiß', telefon: '0561 123' });
    expect(s.fenster[0]).toMatchObject({ id: f.id, name: f.name });
    expect(s.fenster[0].slots.length).toBeGreaterThan(0);
    expect(JSON.stringify(s)).not.toContain('Jonas');
  });

  it('Buchung vom Kundengerät → Termin + Anfrage wie lokal', () => {
    const f = fenster();
    const token = buchungsToken();
    const slot = buchungsSicht(linkAufloesen(token)!, jetzt).fenster[0].slots[0];
    const e = oeffentlicheEingaben.create({ art: 'buchung', token, typ: 'buchung', daten: { fensterId: f.id, start: slot.start, name: 'Anna Berg', telefon: '0171 2345678' } });
    expect(buchungEingabe(e, jetzt)).toMatch(/gebucht/);
    expect(db.termine.all()).toHaveLength(1);
    expect(db.auftraege.all()[0]).toMatchObject({ phase: 'anfrage', quelle: 'website' });
  });

  it('Termin inzwischen vergeben → keine Buchung verloren: Anfrage mit Wunschtermin + Benachrichtigung', () => {
    const f = fenster();
    const token = buchungsToken();
    const e = oeffentlicheEingaben.create({ art: 'buchung', token, typ: 'buchung', daten: { fensterId: f.id, start: '2030-03-06T23:00:00.000Z', name: 'Anna Berg', telefon: '0171 2345678' } });
    expect(buchungEingabe(e, jetzt)).toMatch(/Anfrage/);
    expect(db.termine.all()).toHaveLength(0);
    expect(db.auftraege.all()[0].wunschtermin).toContain('war nicht mehr frei');
    expect(db.benachrichtigungen.all().some((b) => b.wichtig && b.titel.includes('Anna Berg'))).toBe(true);
  });
});
