import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { nachweiseErzeugen, schulungen, vorschlaege } from './daten';

const neuerMa = (vorname: string, rolle: 'monteur' | 'buero' = 'monteur') =>
  db.mitarbeiter.create({ vorname, nachname: 'X', rolle, wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });

describe('Schulungen', () => {
  beforeEach(() => zuruecksetzen());

  it('erzeugt Nachweise für Teilnehmer mit Ablaufdatum – nur einmal', () => {
    const a = neuerMa('A');
    const b = neuerMa('B');
    const q = db.qualifikationen.create({ name: 'Erste Hilfe', kategorie: 'pflicht', gueltigMonate: 24 });
    const t = db.termine.create({ art: 'schulung', titel: 'EH', start: '2026-10-10T08:00:00', ende: '2026-10-10T16:00:00', mitarbeiterIds: [a.id, b.id], status: 'geplant' });
    const s = schulungen.create({ terminId: t.id, qualifikationId: q.id, status: 'abgeschlossen', teilgenommenIds: [a.id] });
    expect(nachweiseErzeugen(s)).toBe(1);
    expect(nachweiseErzeugen(s)).toBe(0);
    expect(db.nachweise.all()[0]).toMatchObject({ mitarbeiterId: a.id, erworbenAm: '2026-10-10', gueltigBis: '2028-10-10' });
  });

  it('schlägt vor, wer als Nächstes muss – ohne bereits Angemeldete und ohne Büro bei fehlender Pflicht', () => {
    const a = neuerMa('A');
    const b = neuerMa('B');
    neuerMa('Sandra', 'buero');
    const q = db.qualifikationen.create({ name: 'Erste Hilfe', kategorie: 'pflicht', gueltigMonate: 24 });
    db.nachweise.create({ mitarbeiterId: a.id, qualifikationId: q.id, gueltigBis: '2026-10-14' });
    const basis = { heute: '2026-10-02', qualifikationen: db.qualifikationen.all(), mitarbeiter: db.mitarbeiter.all(), nachweise: db.nachweise.all(), termine: db.termine.all(), schulungen: schulungen.all() };
    const v = vorschlaege(basis);
    expect(v).toHaveLength(1);
    expect(v[0].personen.map((p) => [p.mitarbeiter.vorname, p.grund])).toEqual([
      ['A', 'läuft in 12 Tagen ab'],
      ['B', 'fehlt noch'],
    ]);
    const t = db.termine.create({ art: 'schulung', titel: 'EH', start: '2026-10-20T08:00:00', ende: '2026-10-20T16:00:00', mitarbeiterIds: [b.id], status: 'geplant' });
    schulungen.create({ terminId: t.id, qualifikationId: q.id, status: 'geplant' });
    const v2 = vorschlaege({ ...basis, termine: db.termine.all(), schulungen: schulungen.all() });
    expect(v2[0].personen.map((p) => p.mitarbeiter.vorname)).toEqual(['A']);
    expect(vorschlaege({ ...basis, ohneQualiIds: new Set([q.id]) })).toEqual([]);
  });
});
