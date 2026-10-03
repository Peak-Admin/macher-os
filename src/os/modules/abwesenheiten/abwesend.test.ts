import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { on, type DbEvent } from '@core/events';
import { abwesendBeobachten, eintragen, entscheiden } from './logik';

describe('Event mitarbeiter.abwesend', () => {
  let events: DbEvent[] = [];
  let aus: (() => void)[] = [];
  beforeEach(() => {
    zuruecksetzen();
    events = [];
    aus = [abwesendBeobachten(), on('mitarbeiter.abwesend', (e) => events.push(e))];
  });
  afterEach(() => aus.forEach((f) => f()));

  it('Krankmeldung ist sofort wirksam und wird gemeldet', () => {
    const a = eintragen({ mitarbeiterId: 'm1', art: 'krank', von: '2026-10-05', bis: '2026-10-06' });
    expect(events).toHaveLength(1);
    expect(events[0].daten).toEqual({ mitarbeiterId: 'm1', abwesenheitId: a.id, art: 'krank', von: '2026-10-05', bis: '2026-10-06', halbtags: false });
  });

  it('Urlaubsantrag erst bei Genehmigung, Ablehnung nie', () => {
    const a = eintragen({ mitarbeiterId: 'm1', art: 'urlaub', von: '2026-10-12', bis: '2026-10-16' });
    expect(events).toHaveLength(0);
    entscheiden(a.id, true);
    expect(events).toHaveLength(1);
    // weitere Änderung an der genehmigten Abwesenheit meldet nicht erneut
    db.abwesenheiten.update(a.id, { notiz: 'Ostsee' });
    expect(events).toHaveLength(1);
    const b = eintragen({ mitarbeiterId: 'm1', art: 'urlaub', von: '2026-11-02', bis: '2026-11-02' });
    entscheiden(b.id, false);
    expect(events).toHaveLength(1);
  });

  it('auch direkt angelegte Abwesenheiten (z. B. von Lotte) werden gemeldet', () => {
    db.abwesenheiten.create({ mitarbeiterId: 'm2', art: 'schule', von: '2026-10-07', bis: '2026-10-07', status: 'genehmigt', halbtags: true });
    expect(events.map((e) => (e.daten as { art: string }).art)).toEqual(['schule']);
  });
});
