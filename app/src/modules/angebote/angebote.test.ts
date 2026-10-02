import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { on } from '@core/events';
import type { Angebot } from '@core/objects';
import { ablehnen, angebotSummen, annehmen, istAktuelleVersion, laeuftBaldAb, nachfassenFaellig, neueVersion, neuesAngebot, optionalSumme, phaseVor, versenden } from './daten';
import { zahlAus } from './felder';

const ang = (x: Partial<Angebot>): Angebot => ({ id: 'a', erstelltAm: '', geaendertAm: '', nummer: 'AN-1', auftragId: 'x', kundeId: 'k', titel: '', positionen: [], status: 'versendet', datum: '2026-09-20', gueltigBis: '2026-10-20', versendetAm: '2026-09-23T10:00:00Z', version: 1, ...x });

describe('Angebotsregeln', () => {
  it('fasst nach X Tagen ohne Antwort nach – und nach dem Nachfassen erst wieder später', () => {
    expect(nachfassenFaellig(ang({}), '2026-09-29', 7, undefined)).toBe(false);
    expect(nachfassenFaellig(ang({}), '2026-09-30', 7, undefined)).toBe(true);
    expect(nachfassenFaellig(ang({}), '2026-10-02', 7, '2026-09-30T08:00:00Z')).toBe(false);
    expect(nachfassenFaellig(ang({ status: 'angenommen' }), '2026-10-02', 7, undefined)).toBe(false);
    expect(nachfassenFaellig(ang({ gueltigBis: '2026-10-01' }), '2026-10-02', 7, undefined)).toBe(false);
  });

  it('erkennt bald ablaufende Angebote', () => {
    expect(laeuftBaldAb(ang({ gueltigBis: '2026-10-04' }), '2026-10-02')).toBe(true);
    expect(laeuftBaldAb(ang({ gueltigBis: '2026-10-10' }), '2026-10-02')).toBe(false);
    expect(laeuftBaldAb(ang({ gueltigBis: '2026-10-01' }), '2026-10-02')).toBe(false);
  });

  it('setzt Phasen nur vorwärts', () => {
    expect(phaseVor('anfrage', 'angebot')).toBe(true);
    expect(phaseVor('in_arbeit', 'angebot')).toBe(false);
    expect(phaseVor('verloren', 'beauftragt')).toBe(true);
  });

  it('rechnet Bedarfspositionen nicht in die Summe', () => {
    const a = ang({ positionen: [{ id: '1', art: 'leistung', text: '', menge: 2, einheit: 'Stk', einzelpreis: 1000 }, { id: '2', art: 'leistung', text: '', menge: 1, einheit: 'Stk', einzelpreis: 500, optional: true }], rabattProzent: 10 });
    expect(angebotSummen(a, 19)).toEqual({ netto: 1800, rabatt: 200, ust: 342, brutto: 2142 });
    expect(optionalSumme(a)).toBe(500);
  });

  it('liest deutsche Zahlen', () => {
    expect(zahlAus('12,5')).toBe(12.5);
    expect(zahlAus('1.234,5')).toBe(1234.5);
    expect(zahlAus('3.5')).toBe(3.5);
    expect(zahlAus('abc')).toBeUndefined();
  });
});

describe('Angebotsablauf', () => {
  beforeEach(() => zuruecksetzen());
  const auftrag = () => {
    const k = db.kunden.create({ art: 'privat', name: 'K', ansprechpartner: [] });
    return db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'anfrage', kundeId: k.id });
  };

  it('Entwurf → versendet → angenommen setzt den Auftrag auf beauftragt und feuert Events', () => {
    const a = auftrag();
    const events: string[] = [];
    const aus = on('angebot.*', (e) => events.push(e.typ));
    const an = neuesAngebot(a.id);
    expect(db.auftraege.get(a.id)?.phase).toBe('angebot');
    versenden(an.id);
    expect(db.angebote.get(an.id)?.status).toBe('versendet');
    annehmen(an.id);
    aus();
    expect(db.auftraege.get(a.id)?.phase).toBe('beauftragt');
    expect(events).toEqual(['angebot.versendet', 'angebot.angenommen']);
  });

  it('Versionen behalten die Nummer, nur die neueste zählt', () => {
    const a = auftrag();
    const v1 = neuesAngebot(a.id);
    const v2 = neueVersion(v1.id)!;
    expect(v2).toMatchObject({ nummer: v1.nummer, version: 2, status: 'entwurf' });
    const alle = db.angebote.all();
    expect(istAktuelleVersion(db.angebote.get(v1.id)!, alle)).toBe(false);
    expect(istAktuelleVersion(v2, alle)).toBe(true);
  });

  it('Ablehnung ohne weiteres Angebot legt den Auftrag ab', () => {
    const a = auftrag();
    const an = neuesAngebot(a.id);
    versenden(an.id);
    ablehnen(an.id, 'Zu teuer');
    expect(db.auftraege.get(a.id)).toMatchObject({ phase: 'verloren', verlorenGrund: 'Zu teuer' });
  });
});
