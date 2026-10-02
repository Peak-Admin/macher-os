import { describe, expect, it } from 'vitest';
import { db, zeitstrahl } from '@core/db';
import { on } from '@core/events';
import { heute, plusTage } from '@core/format';
import { zugangErzeugen, zugangWiderrufen } from './daten';
import { bezugAusSuche, eingabenVerarbeiten, eingabeVerarbeiter, oeffentlicheEingaben, oeffentlicheSichten, portalEingabe, portalSicht, portalSichtenVeroeffentlichen, sichtSpeichern, type PortalSicht } from './oeffentlich';

const kunde = () => db.kunden.create({ art: 'privat', name: 'Petra Schulz', ansprechpartner: [] });
const auftrag = (kundeId: string) => db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'angebot', kundeId });
const angebot = (kundeId: string, auftragId: string, x = {}) =>
  db.angebote.create({ nummer: 'AN-1', auftragId, kundeId, titel: 'Bad', positionen: [{ id: 'p', art: 'pauschal', text: 'Bad', menge: 1, einheit: 'Psch', einzelpreis: 100000 }], status: 'versendet', datum: heute(), gueltigBis: plusTage(heute(), 10), version: 1, ...x });

describe('Öffentliche Sicht des Kundenbereichs', () => {
  it('enthält nur, was der Kunde sehen darf – ohne große Data-URLs', () => {
    const k = kunde();
    const a = auftrag(k.id);
    angebot(k.id, a.id);
    angebot(k.id, a.id, { status: 'entwurf' });
    db.dokumente.create({ art: 'foto', titel: 'Vorher', auftragId: a.id, fuerKunde: true, url: 'data:image/png;base64,AAAA' });
    db.dokumente.create({ art: 'foto', titel: 'Intern', auftragId: a.id });
    const s = portalSicht(k.id)!;
    expect(s.kunde.name).toBe('Petra Schulz');
    expect(s.angebote).toHaveLength(1);
    expect(s.angebote[0].brutto).toBeGreaterThan(100000);
    expect(s.dokumente.map((d) => d.titel)).toEqual(['Vorher']);
    expect(s.dokumente[0].url).toBeUndefined();
  });

  it('speichert nur bei Änderung und markiert gesperrte Links', () => {
    const k = kunde();
    const z = zugangErzeugen(k.id);
    portalSichtenVeroeffentlichen();
    const erst = oeffentlicheSichten.get(z.token)!;
    expect((erst.sicht as PortalSicht).kunde.id).toBe(k.id);
    expect(sichtSpeichern('portal', z.token, { ...(erst.sicht as PortalSicht), stand: 'später' }, { gueltigBis: z.gueltigBis })).toBe(false);
    zugangWiderrufen(z.id);
    portalSichtenVeroeffentlichen();
    expect(oeffentlicheSichten.get(z.token)?.widerrufen).toBe(true);
  });
});

describe('Eingaben vom Kundengerät', () => {
  it('„geöffnet“ → Event portal.geoeffnet { kundeId, bezug } + Vermerk', () => {
    const k = kunde();
    const a = auftrag(k.id);
    const an = angebot(k.id, a.id);
    const z = zugangErzeugen(k.id);
    const events: unknown[] = [];
    const aus = on('portal.geoeffnet', (e) => events.push(e.daten));
    eingabeVerarbeiter('portal', portalEingabe);
    oeffentlicheEingaben.create({ art: 'portal', token: z.token, typ: 'geoeffnet', daten: { bezug: `angebote:${an.id}` } });
    expect(eingabenVerarbeiten()).toBe(1);
    aus();
    expect(events[0]).toMatchObject({ kundeId: k.id, bezug: { typ: 'angebote', id: an.id }, quelle: 'server' });
    expect(zeitstrahl({ typ: 'kunden', id: k.id }).some((e) => e.typ === 'portal.geoeffnet')).toBe(true);
    // genau einmal
    expect(eingabenVerarbeiten()).toBe(0);
  });

  it('Nachricht und Angebotsannahme laufen über dieselbe Logik wie im Büro', () => {
    const k = kunde();
    const a = auftrag(k.id);
    const an = angebot(k.id, a.id);
    const z = zugangErzeugen(k.id);
    eingabeVerarbeiter('portal', portalEingabe);
    oeffentlicheEingaben.create({ art: 'portal', token: z.token, typ: 'nachricht', daten: { text: 'Passt Dienstag?' } });
    oeffentlicheEingaben.create({ art: 'portal', token: z.token, typ: 'angebot', daten: { angebotId: an.id, entscheidung: 'angenommen', name: 'Petra Schulz' } });
    eingabenVerarbeiten();
    expect(db.nachrichten.where((n) => n.kundeId === k.id && n.kanal === 'portal')).toHaveLength(1);
    expect(db.angebote.get(an.id)?.status).toBe('angenommen');
  });

  it('gesperrter Link wirkt nicht', () => {
    const k = kunde();
    const z = zugangErzeugen(k.id);
    zugangWiderrufen(z.id);
    const e = oeffentlicheEingaben.create({ art: 'portal', token: z.token, typ: 'nachricht', daten: { text: 'Hallo' } });
    expect(portalEingabe(e)).toContain('ungültig');
  });

  it('bezug aus der Adresse', () => {
    expect(bezugAusSuche('?bezug=angebote:abc-1')).toEqual({ typ: 'angebote', id: 'abc-1' });
    expect(bezugAusSuche('?x=1')).toBeUndefined();
  });
});
