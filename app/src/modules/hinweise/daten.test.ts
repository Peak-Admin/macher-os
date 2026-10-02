import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { defineModul, registriereModule } from '@core/modul';
import { hinweis, hinweisAusblenden, hinweisErledigen, offeneHinweise } from '@core/macher';
import { aktionVerfuegbar, erledigteSeit, filtern, zaehlen, zielPfad } from './daten';

describe('Hinweise & Freigaben', () => {
  beforeEach(() => {
    zuruecksetzen();
    registriereModule([
      defineModul({
        id: 'x',
        titel: 'X',
        bereich: 'betrieb',
        beschreibung: '',
        detail: [{ objekt: 'kunden', pfad: (id) => `/k/${id}` }],
        aktionen: { 'x.tun': () => '/ziel' },
        hinweise: () => [
          { schluessel: 'live:1', art: 'problem', titel: 'Prüfung überfällig', gewicht: 80 },
          { schluessel: 'live:2', art: 'info', titel: 'Hinweis', gewicht: 10, bezug: { typ: 'kunden', id: 'k1' } },
        ],
      }),
    ]);
  });

  it('filtert und zählt nach Art', () => {
    hinweis({ art: 'freigabe', titel: 'Urlaub freigeben', gewicht: 50, schluessel: 'g:1' });
    const alle = offeneHinweise();
    expect(zaehlen(alle)).toEqual({ alle: 3, problem: 1, entscheidung: 0, freigabe: 1, info: 1 });
    expect(filtern(alle, 'problem').map((h) => h.titel)).toEqual(['Prüfung überfällig']);
    expect(filtern(alle, 'alle')).toHaveLength(3);
  });

  it('blendet aus und listet Erledigte', () => {
    const h = hinweis({ art: 'freigabe', titel: 'Urlaub freigeben', gewicht: 50, schluessel: 'g:1' });
    hinweisAusblenden('live:1');
    hinweisErledigen(h.id);
    expect(offeneHinweise().map((x) => x.schluessel)).toEqual(['live:2']);
    expect(erledigteSeit(7).map((x) => x.id)).toEqual([h.id]);
    expect(erledigteSeit(7, Date.now() + 8 * 86_400_000)).toHaveLength(0);
    expect(db.hinweise.get(h.id)?.status).toBe('erledigt');
  });

  it('bietet nur registrierte Aktionen an und findet das Ziel', () => {
    expect(aktionVerfuegbar('x.tun')).toBe(true);
    expect(aktionVerfuegbar('gibt.es.nicht')).toBe(false);
    expect(zielPfad({ bezug: { typ: 'kunden', id: 'k1' } })).toBe('/k/k1');
    expect(zielPfad({ pfad: '/p', bezug: { typ: 'kunden', id: 'k1' } })).toBe('/p');
  });
});
