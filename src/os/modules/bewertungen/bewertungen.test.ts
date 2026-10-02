import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { setzeEinstellung } from '@core/einstellungen';
import type { Auftrag } from '@core/objects';
import { LINK_KEY, anfrageSenden, anfrageText, anfrageVorbereiten, bewertungen, empfehlerRangliste, empfehlungErfassen, sollAnfragen, type Bewertung } from './daten';

const a = (x: Partial<Auftrag> = {}) => ({ id: 'a1', phase: 'erledigt' as const, art: 'kundendienst' as const, kundeId: 'k', ...x });
const b = (x: Partial<Bewertung>) => ({ art: 'anfrage' as const, kundeId: 'k', erstelltAm: '2026-01-01', ...x });

describe('Bewertungen: Regeln', () => {
  it('fragt nach frisch erledigtem Auftrag', () => {
    expect(sollAnfragen(a(), 'abnahme', [], '2026-10-02')).toBe(true);
  });
  it('fragt nicht doppelt, nicht bei Reklamation, nicht ohne Phasenwechsel', () => {
    expect(sollAnfragen(a(), 'erledigt', [], '2026-10-02')).toBe(false);
    expect(sollAnfragen(a({ phase: 'in_arbeit' }), 'beauftragt', [], '2026-10-02')).toBe(false);
    expect(sollAnfragen(a({ art: 'reklamation' }), 'abnahme', [], '2026-10-02')).toBe(false);
    expect(sollAnfragen(a(), 'abnahme', [b({ auftragId: 'a1', status: 'verworfen' })], '2026-10-02')).toBe(false);
  });
  it('lässt kürzlich gefragte Kunden 180 Tage in Ruhe', () => {
    expect(sollAnfragen(a(), 'abnahme', [b({ auftragId: 'x', status: 'gesendet', gesendetAm: '2026-08-01T10:00:00Z' })], '2026-10-02')).toBe(false);
    expect(sollAnfragen(a(), 'abnahme', [b({ auftragId: 'x', status: 'gesendet', gesendetAm: '2025-08-01T10:00:00Z' })], '2026-10-02')).toBe(true);
  });
  it('fragt unzufriedene Kunden nicht', () => {
    expect(sollAnfragen(a(), 'abnahme', [b({ auftragId: 'x', status: 'gesendet', gesendetAm: '2024-01-01T00:00:00Z', zufriedenheit: 2 })], '2026-10-02')).toBe(false);
  });
  it('baut eine Rangliste der Empfehler', () => {
    const r = empfehlerRangliste([
      { art: 'empfehlung', kundeId: 'n1', empfohlenVonKundeId: 'e1' },
      { art: 'empfehlung', kundeId: 'n2', empfohlenVonKundeId: 'e2' },
      { art: 'empfehlung', kundeId: 'n3', empfohlenVonKundeId: 'e2' },
      { art: 'anfrage', kundeId: 'n4' },
    ]);
    expect(r.map((x) => [x.kundeId, x.anzahl])).toEqual([['e2', 2], ['e1', 1]]);
  });
  it('schreibt den Link in den Anfragetext', () => {
    expect(anfrageText({ name: 'Familie Muster', art: 'privat', ansprechpartner: [] }, { name: 'Elektro Max' }, 'https://g.page/r/x/review')).toContain('https://g.page/r/x/review');
  });
});

describe('Bewertungen: Ablauf', () => {
  it('sendet nur mit Link und Kontakt, als ausgehende Nachricht', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Petra Schulz', email: 'p@example.de', ansprechpartner: [] });
    const auf = db.auftraege.create({ nummer: 'A-9', titel: 'Bad', art: 'projekt', phase: 'erledigt', kundeId: k.id });
    anfrageVorbereiten(auf);
    expect(anfrageSenden(auf.id)).toEqual({ ok: false, grund: 'kein_link' });
    setzeEinstellung(LINK_KEY, 'https://g.page/r/x/review');
    expect(anfrageSenden(auf.id)).toEqual({ ok: true, kanal: 'email' });
    expect(bewertungen.where((x) => x.auftragId === auf.id)).toMatchObject([{ status: 'gesendet' }]);
    expect(db.nachrichten.where((n) => n.auftragId === auf.id)).toMatchObject([{ kanal: 'email', richtung: 'aus' }]);
  });
  it('erfasst Empfehlungen ohne Selbstempfehlung', () => {
    expect(() => empfehlungErfassen('x', 'x')).toThrow();
    const e = empfehlungErfassen('neu', 'alt');
    expect(e.empfohlenVonKundeId).toBe('alt');
    expect(empfehlungErfassen('neu', 'anders').id).toBe(e.id);
  });
});
