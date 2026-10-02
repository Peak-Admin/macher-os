import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, zeitstrahl, zuruecksetzen } from '@core/db';
import { emit, on } from '@core/events';
import { messpunkte } from '@core/messung';
import { portalzugaenge } from '@modules/kundenbereich/daten';
import { angebotSenden, erkanntAlsPosition, geoeffnetAm, kundeSichern, portalGeoeffnet, schnellAngebotAnlegen, titelAus } from './erstwert';

describe('Angebot in drei Minuten', () => {
  beforeEach(() => {
    zuruecksetzen();
    globalThis.open = vi.fn() as unknown as typeof globalThis.open;
  });

  it('legt Kunde (Name + Kontakt reicht), Auftrag und Angebot an', () => {
    const k = kundeSichern({ name: ' Familie Hoffmann ', kontakt: 'hoffmann@example.de' });
    expect(k).toMatchObject({ name: 'Familie Hoffmann', email: 'hoffmann@example.de', art: 'privat' });
    const p = erkanntAlsPosition({ roh: 'Bewegungsmelder montieren', menge: 2 });
    expect(p).toMatchObject({ art: 'pauschal', text: 'Bewegungsmelder montieren', menge: 2, einheit: 'Stk', einzelpreis: 0 });
    const a = schnellAngebotAnlegen(k.id, [{ ...p, text: 'Steckdose setzen inkl. Dose', einzelpreis: 6900 }]);
    expect(a.status).toBe('entwurf');
    expect(a.titel).toBe('Steckdose setzen');
    expect(db.auftraege.get(a.auftragId)).toMatchObject({ kundeId: k.id, phase: 'angebot' });
    // vorhandener Kunde: Telefon wird ergänzt, kein zweiter Kunde
    kundeSichern({ kundeId: k.id, name: k.name, kontakt: '0171 2345678' });
    expect(db.kunden.all()).toHaveLength(1);
    expect(db.kunden.get(k.id)?.telefon).toBe('0171 2345678');
  });

  it('Titel aus den Positionen', () => {
    expect(titelAus([])).toBe('Angebot');
    expect(titelAus([erkanntAlsPosition({ roh: 'wallbox installieren', menge: 1 }), erkanntAlsPosition({ roh: 'anfahrt', menge: 1 })])).toBe('Wallbox installieren u. a.');
  });

  it('sendet lokal über das Mailprogramm – mit Link zum Kundenbereich, Event und Messpunkt', async () => {
    const k = kundeSichern({ name: 'Familie Hoffmann', kontakt: 'hoffmann@example.de' });
    const a = schnellAngebotAnlegen(k.id, [erkanntAlsPosition({ roh: 'Steckdose', menge: 2 })]);
    const events: unknown[] = [];
    const weg = on('dokument.versendet', (e) => events.push(e.daten));
    const r = await angebotSenden(a.id, 'hoffmann@example.de', 'email', { sekunden: 120 });
    weg();
    expect(r.status).toBe('geoeffnet');
    const url = String(vi.mocked(globalThis.open).mock.calls[0][0]);
    expect(url).toMatch(/^mailto:hoffmann%40example\.de\?subject=Angebot/);
    const token = portalzugaenge.where((z) => z.kundeId === k.id)[0]?.token;
    expect(token).toBeTruthy();
    expect(decodeURIComponent(url)).toContain(`/os/k/${token}?angebot=${a.id}`);
    expect(portalzugaenge.all()).toHaveLength(1);
    expect(db.angebote.get(a.id)?.status).toBe('versendet');
    expect(events).toEqual([{ bezug: { typ: 'angebote', id: a.id }, kanal: 'email', status: 'geoeffnet' }]);
    expect(messpunkte().at(-1)).toMatchObject({ ereignis: 'erstwert.dokument_versendet', daten: { sekunden: 120 } });
    expect(zeitstrahl({ typ: 'angebote', id: a.id }).some((e) => e.text.includes('im eigenen Programm geöffnet'))).toBe(true);
  });

  it('„Kunde hat geöffnet“: Vermerk, Benachrichtigung, Messpunkt – nur beim ersten Mal', async () => {
    const k = kundeSichern({ name: 'Familie Hoffmann', kontakt: '0171 2345678' });
    const a = schnellAngebotAnlegen(k.id, [erkanntAlsPosition({ roh: 'Steckdose', menge: 1 })]);
    await angebotSenden(a.id, '0171 2345678', 'sms');
    expect(portalGeoeffnet({ kundeId: k.id }).map((x) => x.id)).toEqual([a.id]);
    expect(geoeffnetAm(a.id)).toBeTruthy();
    expect(db.benachrichtigungen.all().filter((b) => b.titel === 'Familie Hoffmann hat dein Angebot geöffnet')).toHaveLength(1);
    expect(zeitstrahl({ typ: 'angebote', id: a.id }).some((e) => e.typ === 'angebot.geoeffnet')).toBe(true);
    expect(messpunkte().at(-1)?.ereignis).toBe('erstwert.dokument_geoeffnet');
    expect(db.angebote.get(a.id)?.geoeffnetAm).toBeTruthy();
    // zweites Öffnen: keine zweite Benachrichtigung
    expect(portalGeoeffnet({ kundeId: k.id, bezug: { typ: 'angebote', id: a.id } })).toEqual([]);
    expect(db.benachrichtigungen.all()).toHaveLength(1);
  });

  it('Entwürfe zählen nicht als geöffnet; Event-Weg über das Modul', () => {
    const k = kundeSichern({ name: 'Herr Weber', kontakt: 'w@example.de' });
    const a = schnellAngebotAnlegen(k.id, []);
    expect(portalGeoeffnet({ kundeId: k.id })).toEqual([]);
    expect(portalGeoeffnet(undefined)).toEqual([]);
    expect(geoeffnetAm(a.id)).toBeUndefined();
    // ohne registriertes Modul passiert beim Event nichts Schlimmes
    emit({ typ: 'portal.geoeffnet', daten: { kundeId: k.id } });
  });
});
