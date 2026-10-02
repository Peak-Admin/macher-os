import { describe, expect, it } from 'vitest';
import type { Mitarbeiter } from '@core/objects';
import { geordnet, verschoben } from './reihenfolge';

const m = (id: string, vorname: string, rolle: Mitarbeiter['rolle'] = 'monteur'): Mitarbeiter =>
  ({ id, vorname, nachname: 'X', rolle, aktiv: true, wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, erstelltAm: '', geaendertAm: '' }) as Mitarbeiter;

describe('Reihenfolge der Plantafel', () => {
  const team = [m('c', 'Chris', 'chef'), m('b', 'Berta'), m('a', 'Anton'), m('z', 'Zoe', 'azubi')];

  it('ohne eigene Reihenfolge: Monteure, Chef, Azubis', () => {
    expect(geordnet(team, undefined).map((x) => x.id)).toEqual(['a', 'b', 'c', 'z']);
  });

  it('eigene Reihenfolge gewinnt, Neue hängen hinten an', () => {
    expect(geordnet(team, ['z', 'c']).map((x) => x.id)).toEqual(['z', 'c', 'a', 'b']);
  });

  it('Gelöschte in der Reihenfolge stören nicht', () => {
    expect(geordnet(team, ['weg', 'b', 'a']).map((x) => x.id)).toEqual(['b', 'a', 'c', 'z']);
  });

  it('verschiebt nach oben und unten', () => {
    expect(verschoben(['a', 'b', 'c', 'd'], 'c', 1)).toEqual(['a', 'c', 'b', 'd']);
    expect(verschoben(['a', 'b', 'c', 'd'], 'a', 1)).toEqual(['b', 'a', 'c', 'd']);
    expect(verschoben(['a', 'b', 'c', 'd'], 'a', 3)).toEqual(['b', 'c', 'd', 'a']);
    expect(verschoben(['a', 'b', 'c', 'd'], 'd', 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(verschoben(['a', 'b'], 'x', 0)).toEqual(['a', 'b']);
  });
});
