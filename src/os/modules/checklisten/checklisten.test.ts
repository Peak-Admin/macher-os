import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Gewerk } from '@core/objects';
import { automatischAnlegen, checklisten, checklistenVorlagen, offenePflichtpunkte, passendeVorlagen, punktSetzen, stand, type ChecklistenVorlage } from './daten';
import { vorlagenFuer } from './vorlagen';
import { seedChecklisten } from './seed';

describe('Checklisten', () => {
  beforeEach(() => zuruecksetzen());

  it('Foto-Pflicht: abgehakt ohne Foto bleibt offen', () => {
    const s = stand({
      punkte: [
        { id: '1', text: 'a', erledigt: true },
        { id: '2', text: 'b', erledigt: true, fotoPflicht: true, pflicht: true },
        { id: '3', text: 'c', erledigt: false, pflicht: true },
      ],
    });
    expect(s).toEqual({ erledigt: 1, gesamt: 3, offenePflicht: 2, fehlendeFotos: 1, fertig: false });
  });

  it('jedes Gewerk bekommt sinnvolle Vorlagen', () => {
    const gewerke: Gewerk[] = ['elektro', 'shk', 'maler', 'dach', 'tischler', 'fliesen', 'garten', 'metall', 'bau', 'sonstiges'];
    for (const g of gewerke) {
      const v = vorlagenFuer(g);
      expect(v.length).toBeGreaterThanOrEqual(3);
      expect(v.every((x) => x.punkte.length >= 3 && x.arten.length)).toBe(true);
    }
    expect(vorlagenFuer('shk').some((v) => v.name.includes('heizung'))).toBe(true);
  });

  it('wählt Vorlagen nach Gewerk und Auftragsart', () => {
    const v = (x: Partial<ChecklistenVorlage>) => ({ id: Math.random().toString(), erstelltAm: '', geaendertAm: '', name: 'v', arten: ['wartung'], automatisch: true, punkte: [], aktiv: true, ...x }) as ChecklistenVorlage;
    const alle = [v({ name: 'alle' }), v({ name: 'shk', gewerke: ['shk'] }), v({ name: 'elektro', gewerke: ['elektro'] }), v({ name: 'aus', aktiv: false }), v({ name: 'projekt', arten: ['projekt'] })];
    expect(passendeVorlagen(alle, 'shk', 'wartung').map((x) => x.name)).toEqual(['alle', 'shk']);
  });

  it('hängt automatische Vorlagen einmal an und meldet offene Pflichtpunkte', () => {
    db.betrieb.create({ id: 'betrieb', gewerk: 'shk' } as never);
    seedChecklisten();
    expect(checklistenVorlagen.all().length).toBeGreaterThan(3);
    const a = db.auftraege.create({ nummer: 'A', titel: 'Wartung', art: 'wartung', phase: 'beauftragt', kundeId: 'k' });
    const neu = automatischAnlegen(a);
    expect(neu.map((c) => c.titel)).toEqual(['Wartung Gas-Brennwertheizung']);
    expect(automatischAnlegen(a)).toHaveLength(0);
    const c = neu[0];
    const pflicht = c.punkte.filter((p) => p.pflicht).length;
    expect(offenePflichtpunkte(a.id)).toHaveLength(pflicht);
    punktSetzen(c.id, c.punkte.find((p) => p.pflicht)!.id, { erledigt: true }, 'm1');
    expect(offenePflichtpunkte(a.id)).toHaveLength(pflicht - 1);
    expect(checklisten.get(c.id)!.punkte.find((p) => p.erledigt)?.erledigtVon).toBe('m1');
    expect(db.erledigungen.all()).toHaveLength(1);
  });
});
