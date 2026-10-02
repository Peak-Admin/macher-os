import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { heute, plusTage } from '@core/format';
import { aktiverZugang, angebotEntscheiden, nachrichtSenden, neuesToken, portalDaten, rechnungStatusKunde, zugangErzeugen, zugangPruefen, zugangWiderrufen } from './daten';

const kunde = () => db.kunden.create({ art: 'privat', name: 'Petra Schulz', ansprechpartner: [] });
const auftrag = (kundeId: string) => db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'angebot', kundeId });
const angebot = (kundeId: string, auftragId: string, x = {}) =>
  db.angebote.create({ nummer: 'AN-1', auftragId, kundeId, titel: 'Bad', positionen: [{ id: 'p', art: 'pauschal', text: 'Bad', menge: 1, einheit: 'Psch', einzelpreis: 100000 }], status: 'versendet', datum: heute(), gueltigBis: plusTage(heute(), 10), version: 1, ...x });

describe('Kundenbereich: Zugang', () => {
  it('erzeugt URL-sichere, eindeutige Tokens', () => {
    const a = neuesToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(neuesToken()).not.toBe(a);
  });
  it('prüft Ablauf und Widerruf', () => {
    const k = kunde();
    const z = zugangErzeugen(k.id, 30);
    expect(zugangPruefen(z).ok).toBe(true);
    expect(zugangPruefen({ ...z, gueltigBis: plusTage(heute(), -1) })).toEqual({ ok: false, grund: 'abgelaufen' });
    expect(zugangPruefen(undefined)).toEqual({ ok: false, grund: 'unbekannt' });
    expect(aktiverZugang(k.id)?.id).toBe(z.id);
    zugangWiderrufen(z.id);
    expect(aktiverZugang(k.id)).toBeUndefined();
  });
});

describe('Kundenbereich: Sichtbarkeit', () => {
  it('zeigt nur eigene, freigegebene Daten', () => {
    const k = kunde();
    const fremd = kunde();
    const a = auftrag(k.id);
    angebot(k.id, a.id);
    angebot(k.id, a.id, { status: 'entwurf' });
    angebot(fremd.id, auftrag(fremd.id).id);
    db.dokumente.create({ art: 'foto', titel: 'Vorher', auftragId: a.id, fuerKunde: true });
    db.dokumente.create({ art: 'foto', titel: 'Intern', auftragId: a.id });
    db.termine.create({ art: 'einsatz', titel: 'Einsatz', start: new Date(Date.now() + 86_400_000).toISOString(), ende: new Date(Date.now() + 90_000_000).toISOString(), auftragId: a.id, mitarbeiterIds: [], status: 'geplant' });
    db.termine.create({ art: 'intern', titel: 'Intern', start: new Date().toISOString(), ende: new Date(Date.now() + 3_600_000).toISOString(), kundeId: k.id, mitarbeiterIds: [], status: 'geplant' });
    const d = portalDaten(k.id);
    expect(d.angebote).toHaveLength(1);
    expect(d.dokumente.map((x) => x.titel)).toEqual(['Vorher']);
    expect(d.termine.map((x) => x.titel)).toEqual(['Einsatz']);
  });
  it('zeigt Rechnungsstatus aus Kundensicht', () => {
    expect(rechnungStatusKunde({ status: 'bezahlt', faelligAm: '2020-01-01' }).text).toBe('Bezahlt');
    expect(rechnungStatusKunde({ status: 'versendet', faelligAm: '2026-09-01' }, '2026-10-02').text).toBe('Zahlung überfällig');
    expect(rechnungStatusKunde({ status: 'versendet', faelligAm: '2026-10-16' }, '2026-10-02').text).toBe('Offen, fällig 16.10.2026');
  });
});

describe('Kundenbereich: Angebot annehmen', () => {
  it('verlangt den vollständigen Namen', () => {
    const k = kunde();
    const an = angebot(k.id, auftrag(k.id).id);
    expect(angebotEntscheiden(k.id, an.id, 'angenommen', 'Petra').ok).toBe(false);
    expect(db.angebote.get(an.id)?.status).toBe('versendet');
  });
  it('setzt Status und feuert angebot.angenommen', () => {
    const k = kunde();
    const an = angebot(k.id, auftrag(k.id).id);
    let daten: { name?: string; quelle?: string } | undefined;
    const aus = on('angebot.angenommen', (e) => (daten = e.daten as typeof daten));
    expect(angebotEntscheiden(k.id, an.id, 'angenommen', 'Petra Schulz')).toEqual({ ok: true });
    aus();
    expect(db.angebote.get(an.id)?.status).toBe('angenommen');
    expect(daten).toMatchObject({ name: 'Petra Schulz', quelle: 'portal' });
    expect(angebotEntscheiden(k.id, an.id, 'abgelehnt', 'Petra Schulz').ok).toBe(false);
  });
  it('lässt fremde und abgelaufene Angebote nicht zu', () => {
    const k = kunde();
    const fremd = kunde();
    const an = angebot(k.id, auftrag(k.id).id, { gueltigBis: plusTage(heute(), -1) });
    expect(angebotEntscheiden(fremd.id, an.id, 'angenommen', 'Max Muster').ok).toBe(false);
    expect(angebotEntscheiden(k.id, an.id, 'angenommen', 'Petra Schulz')).toMatchObject({ ok: false, fehler: expect.stringContaining('abgelaufen') });
  });
  it('legt Nachrichten im Kanal portal an', () => {
    const k = kunde();
    expect(nachrichtSenden(k.id, ' ').ok).toBe(false);
    expect(nachrichtSenden(k.id, 'Passt Dienstag?').ok).toBe(true);
    expect(db.nachrichten.where((n) => n.kundeId === k.id)).toMatchObject([{ kanal: 'portal', richtung: 'ein', gelesen: false }]);
  });
});
