import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { kundeSichern } from '@modules/angebote/erstwert';
import { rechnungSenden, schnellEntwurf } from './RechnungSchnellVersand';

const betrieb = (patch = {}) =>
  db.betrieb.create({
    id: 'betrieb', name: 'Elektro Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 1,
    adresse: { strasse: 'Werkstr. 1', plz: '70173', ort: 'Stuttgart' }, telefon: '0711 1', email: 'info@test.de', steuernummer: '12/345/67890',
    iban: 'DE02120300000000202051', stundensatz: 6800, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true, ...patch,
  });

describe('Rechnung in 1 Minute', () => {
  beforeEach(() => {
    zuruecksetzen();
    globalThis.open = vi.fn() as unknown as typeof globalThis.open;
  });

  it('schreibt fest (Nummer), hängt XRechnung an und sendet über den Rückfall', async () => {
    betrieb();
    const k = kundeSichern({ name: 'Herr Weber', kontakt: 'weber@example.de' });
    db.kunden.update(k.id, { adresse: { strasse: 'Hauptstr. 1', plz: '70173', ort: 'Stuttgart' } });
    const r = schnellEntwurf({ kundeId: k.id }, [{ id: 'p1', art: 'leistung', text: 'Störungssuche', menge: 1.5, einheit: 'h', einzelpreis: 7400 }], '02.10.2026');
    const { r: versand, rechnung } = await rechnungSenden(r!.id, 'weber@example.de', 'email');
    expect(versand.status).toBe('geoeffnet');
    expect(rechnung?.nummer).toMatch(/\d/);
    expect(rechnung?.status).toBe('versendet');
    expect(decodeURIComponent(String(vi.mocked(globalThis.open).mock.calls[0][0]))).toContain('/k/');
  });

  it('ohne Pflichtangaben wird nichts festgeschrieben und nichts gesendet', async () => {
    betrieb({ steuernummer: '', adresse: { strasse: '', plz: '', ort: '' } });
    const k = kundeSichern({ name: 'Herr Weber', kontakt: 'weber@example.de' });
    const r = schnellEntwurf({ kundeId: k.id }, [{ id: 'p1', art: 'leistung', text: 'Störungssuche', menge: 1, einheit: 'h', einzelpreis: 7400 }], '02.10.2026');
    const e = await rechnungSenden(r!.id, 'weber@example.de', 'email');
    expect(e.r.status).toBe('fehler');
    expect(e.maengel?.map((m) => m.feld)).toEqual(expect.arrayContaining(['betrieb.adresse', 'betrieb.steuernummer', 'kunde.adresse']));
    expect(db.rechnungen.get(r!.id)?.status).toBe('entwurf');
    expect(globalThis.open).not.toHaveBeenCalled();
  });
});
