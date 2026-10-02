import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { LOKALE_CLOUD, setzeCloud, type Versand } from '@core/cloud';
import { unterwegsAusloesen, unterwegsSenden, unterwegsText, unterwegsZiel, schonGemeldet } from './unterwegs';

afterEach(() => setzeCloud(LOKALE_CLOUD));

function einsatz(kunde: { telefon?: string; email?: string } = { telefon: '0171 2345678' }) {
  const k = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], ...kunde });
  const m = db.mitarbeiter.create({ vorname: 'Tim', nachname: 'Berg', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const start = new Date(Date.now() + 3_600_000).toISOString();
  return db.termine.create({ art: 'einsatz', titel: 'Steckdosen', start, ende: start, kundeId: k.id, mitarbeiterIds: [m.id], status: 'geplant' });
}

describe('„Wir sind unterwegs“', () => {
  it('SMS bevorzugt, sonst E-Mail, sonst nichts', () => {
    expect(unterwegsZiel({ telefon: '0171 234567', email: 'a@b.de', ansprechpartner: [] })).toEqual({ kanal: 'sms', an: '0171 234567' });
    expect(unterwegsZiel({ email: 'a@b.de', ansprechpartner: [] })).toEqual({ kanal: 'email', an: 'a@b.de' });
    expect(unterwegsZiel({ ansprechpartner: [] })).toBeUndefined();
  });

  it('Text: höflich, mit Termin, ohne erfundene Ankunftszeit', () => {
    const t = unterwegsText({ kunde: 'Familie Hoffmann', betrieb: 'Elektro Weiß', vorname: 'Tim', termin: { start: '2026-10-02T07:30:00.000Z' } });
    expect(t).toMatch(/^Guten Tag Familie Hoffmann, Tim von Elektro Weiß ist jetzt auf dem Weg zu Ihnen \(Termin \d\d:\d\d Uhr\)/);
    expect(t).not.toMatch(/voraussichtlich|Minuten/);
  });

  it('ohne Backend nur Vorschlag für den Monteur – nichts geht ungefragt raus', () => {
    const t = einsatz();
    expect(unterwegsAusloesen(t.id)).toBe('vorschlag');
    const h = db.hinweise.all().find((x) => x.schluessel === `unterwegs:${t.id}`);
    expect(h).toMatchObject({ status: 'offen', fuerMitarbeiterId: t.mitarbeiterIds[0] });
    expect(h?.aktionen?.[0].label).toBe('SMS senden');
  });

  it('mit Backend: genau einmal senden, festhalten, Vorschlag schließen', async () => {
    const t = einsatz();
    unterwegsAusloesen(t.id); // Vorschlag (lokal)
    const gesendet: Versand[] = [];
    setzeCloud({ ...LOKALE_CLOUD, aktiv: () => true, senden: async (v) => (gesendet.push(v), { status: 'gesendet' }) });
    expect(await unterwegsSenden(t.id)).toBe(true);
    expect(gesendet[0]).toMatchObject({ kanal: 'sms', an: '0171 2345678', bezug: { typ: 'termine', id: t.id } });
    expect(schonGemeldet(t.id)).toBe(true);
    expect(db.hinweise.all().find((x) => x.schluessel === `unterwegs:${t.id}`)?.status).toBe('erledigt');
    expect(await unterwegsSenden(t.id)).toBe(false);
    expect(unterwegsAusloesen(t.id)).toBeUndefined();
    expect(gesendet).toHaveLength(1);
  });

  it('Kunde ohne Kontakt → nichts; Beispieltermin mit Backend → nie echte Nachricht', () => {
    expect(unterwegsAusloesen(einsatz({}).id)).toBeUndefined();
    const t = einsatz();
    db.termine.update(t.id, { beispiel: true });
    setzeCloud({ ...LOKALE_CLOUD, aktiv: () => true });
    expect(unterwegsAusloesen(t.id)).toBeUndefined();
  });
});
