import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { db, zuruecksetzen } from '@core/db';
import { on } from '@core/events';
import { Portal } from './Portal';
import { zugangErzeugen } from './daten';

describe('Kundenbereich meldet das Öffnen', () => {
  beforeEach(() => zuruecksetzen());

  const oeffne = (pfad: string) =>
    render(
      <MemoryRouter initialEntries={[pfad]}>
        <Routes>
          <Route path="/k/:token" element={<Portal />} />
        </Routes>
      </MemoryRouter>,
    );

  it('feuert portal.geoeffnet – mit Angebotsbezug aus dem Link, sonst für den Kunden', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [] });
    const fremd = db.kunden.create({ art: 'privat', name: 'Andere', ansprechpartner: [] });
    const z = zugangErzeugen(k.id);
    const angebot = db.angebote.create({ nummer: 'AN-1', auftragId: 'x', kundeId: k.id, titel: 'Steckdosen', positionen: [], status: 'versendet', datum: '2026-10-02', gueltigBis: '2026-11-01', version: 1 });
    const fremdesAngebot = db.angebote.create({ nummer: 'AN-2', auftragId: 'y', kundeId: fremd.id, titel: 'X', positionen: [], status: 'versendet', datum: '2026-10-02', gueltigBis: '2026-11-01', version: 1 });
    const events: unknown[] = [];
    const weg = on('portal.geoeffnet', (e) => events.push(e.daten));
    oeffne(`/k/${z.token}?angebot=${angebot.id}`).unmount();
    oeffne(`/k/${z.token}?angebot=${fremdesAngebot.id}`).unmount();
    weg();
    expect(events[0]).toEqual({ kundeId: k.id, bezug: { typ: 'angebote', id: angebot.id } });
    // fremdes Angebot im Link: zählt nicht als dessen Öffnen
    expect(events.at(-1)).toEqual({ kundeId: k.id, bezug: { typ: 'kunden', id: k.id } });
  });

  it('unbekannter Link meldet nichts', () => {
    const events: unknown[] = [];
    const weg = on('portal.geoeffnet', (e) => events.push(e));
    oeffne('/k/gibtsnicht');
    weg();
    expect(events).toEqual([]);
  });
});
