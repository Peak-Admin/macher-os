import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Termin } from '@core/objects';
import { besichtigungPlanen, ergebnisFestlegen, konflikte, ueberschneidet } from './daten';

const t = (x: Partial<Termin>): Termin => ({ id: 't', erstelltAm: '', geaendertAm: '', art: 'einsatz', titel: '', start: '2026-10-02T08:00:00Z', ende: '2026-10-02T10:00:00Z', mitarbeiterIds: ['m1'], status: 'geplant', ...x });

describe('Besichtigungen', () => {
  beforeEach(() => zuruecksetzen());

  it('erkennt Überschneidungen nur bei denselben Leuten', () => {
    expect(ueberschneidet({ start: '09', ende: '10' }, { start: '10', ende: '11' })).toBe(false);
    expect(konflikte(['m1'], '2026-10-02T09:00:00Z', '2026-10-02T09:30:00Z', [t({})])).toHaveLength(1);
    expect(konflikte(['m2'], '2026-10-02T09:00:00Z', '2026-10-02T09:30:00Z', [t({})])).toHaveLength(0);
    expect(konflikte(['m1'], '2026-10-02T09:00:00Z', '2026-10-02T09:30:00Z', [t({ status: 'abgesagt' })])).toHaveLength(0);
  });

  it('plant als Termin mit Art Besichtigung und schließt mit Ergebnis ab', () => {
    const k = db.kunden.create({ art: 'privat', name: 'K', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Dach', art: 'projekt', phase: 'anfrage', kundeId: k.id });
    const termin = besichtigungPlanen({ auftragId: a.id, start: '2026-10-03T13:00:00Z', ende: '2026-10-03T14:00:00Z', mitarbeiterIds: ['m1'] });
    expect(termin).toMatchObject({ art: 'besichtigung', auftragId: a.id, kundeId: k.id });
    expect(db.auftraege.get(a.id)?.phase).toBe('besichtigung');
    ergebnisFestlegen(termin.id, 'kein_auftrag', 'Zu teuer für den Kunden');
    expect(db.termine.get(termin.id)?.status).toBe('erledigt');
    expect(db.auftraege.get(a.id)).toMatchObject({ phase: 'verloren', verlorenGrund: 'Zu teuer für den Kunden' });
  });
});
