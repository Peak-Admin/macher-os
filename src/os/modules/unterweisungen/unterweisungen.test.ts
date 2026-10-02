import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { bestaetigen, brauchtBestaetigung, offeneFuer, stand, unterweisungen } from './daten';
import { automatischErinnern } from './index';

describe('Unterweisungen', () => {
  beforeEach(() => zuruecksetzen());

  it('berechnet den Stand je Mitarbeiter', () => {
    const u = { intervallMonate: 12, bestaetigungen: [{ mitarbeiterId: 'm1', am: '2025-11-15T08:00:00' }] };
    expect(stand(u, 'm2', '2026-10-02').status).toBe('offen');
    expect(stand(u, 'm1', '2026-10-20')).toMatchObject({ status: 'bald', naechste: '2026-11-15' });
    expect(stand(u, 'm1', '2026-06-01').status).toBe('aktuell');
    expect(stand(u, 'm1', '2026-11-16').status).toBe('faellig');
    expect(brauchtBestaetigung(stand(u, 'm1', '2026-11-16'))).toBe(true);
  });

  it('Bestätigung schreibt den Nachweis der verknüpften Qualifikation fort', () => {
    const m = db.mitarbeiter.create({ vorname: 'J', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    const q = db.qualifikationen.create({ name: 'Arbeitsschutz-Unterweisung', kategorie: 'pflicht', gueltigMonate: 12 });
    const u = unterweisungen.create({ titel: 'Arbeitsschutz', inhalt: 'x', intervallMonate: 12, rollen: ['monteur'], qualifikationId: q.id, bestaetigungen: [], aktiv: true });
    expect(offeneFuer(m, unterweisungen.all(), '2026-10-02')).toHaveLength(1);
    bestaetigen(u.id, m.id, undefined, '2026-10-02T09:00:00');
    expect(unterweisungen.get(u.id)?.bestaetigungen).toHaveLength(1);
    expect(db.nachweise.all()[0]).toMatchObject({ mitarbeiterId: m.id, qualifikationId: q.id, erworbenAm: '2026-10-02', gueltigBis: '2027-10-02' });
    bestaetigen(u.id, m.id, undefined, '2027-09-20T09:00:00');
    expect(db.nachweise.all()).toHaveLength(1);
    expect(db.nachweise.all()[0].gueltigBis).toBe('2028-09-20');
    expect(offeneFuer(m, unterweisungen.all(), '2026-10-02')).toHaveLength(0);
  });

  it('erinnert je Mitarbeiter einmal, gebündelt über alle offenen Unterweisungen', () => {
    const neu = (vorname: string) => db.mitarbeiter.create({ vorname, nachname: 'X', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    neu('A');
    neu('B');
    for (const titel of ['Leitern', 'Elektro', 'Erste Hilfe']) unterweisungen.create({ titel, inhalt: 'x', intervallMonate: 12, rollen: ['monteur'], bestaetigungen: [], aktiv: true });
    expect(automatischErinnern('2026-10-02')).toBe(2);
    expect(db.benachrichtigungen.all()).toHaveLength(2);
    expect(db.benachrichtigungen.all()[0].titel).toBe('3 Unterweisungen bestätigen');
    expect(automatischErinnern('2026-10-02')).toBe(0);
  });
});
