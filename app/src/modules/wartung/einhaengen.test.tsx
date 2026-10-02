/** Rendert alle Tabs/Panels des Pakets „service“ mit Beispieldaten – findet Laufzeitfehler,
 *  auch wenn die Host-Ansichten (Auftragsakte, Anlage) auf diesem Branch fehlen. */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { registriereModule, tabsFuer, panelsFuer, alleSchnellAktionen } from '@core/modul';
import { db } from '@core/db';
import { einrichten } from '@core/seed';
import { ToastProvider } from '@ui/index';
import wartung from './index';
import servicevertraege from '../servicevertraege/index';
import reklamationen from '../reklamationen/index';
import wiederkehrend from '../wiederkehrend/index';
import { wartungenAnlegen } from './logik';

describe('Tabs und Panels rendern', () => {
  registriereModule([wartung, servicevertraege, reklamationen, wiederkehrend]);
  einrichten({ betriebName: 'Test', gewerk: 'shk', arbeitsweisen: [], teamgroesse: 3, chefVorname: 'A', chefNachname: 'B', beispiele: true });
  wartungenAnlegen();
  const huelle = (el: React.ReactNode) => render(<MemoryRouter><ToastProvider>{el}</ToastProvider></MemoryRouter>);

  it('Auftrags-Tabs', () => {
    for (const a of db.auftraege.all()) {
      for (const t of tabsFuer('auftraege').filter((t) => !t.sichtbar || t.sichtbar(a.id))) {
        const { unmount } = huelle(<t.component id={a.id} />);
        unmount();
      }
    }
    const w = db.auftraege.all().find((a) => a.art === 'wartung' && a.anlageIds?.length)!;
    const { getByText, unmount } = huelle(<>{tabsFuer('auftraege').filter((t) => t.titel === 'Wartung').map((T) => <T.component key="w" id={w.id} />)}</>);
    expect(getByText('Prüfpunkte')).toBeTruthy();
    unmount();
  });

  it('Panels an Anlage, Kunde, Termin', () => {
    for (const objekt of ['anlagen', 'kunden', 'termine'] as const) {
      for (const x of db[objekt].all()) for (const p of panelsFuer(objekt)) huelle(<p.component id={x.id} />).unmount();
    }
  });

  it('Schnell erfassen und Hinweise', () => {
    for (const s of alleSchnellAktionen()) huelle(<s.component fertig={() => {}} />).unmount();
    const hinweise = [wartung, servicevertraege, reklamationen, wiederkehrend].flatMap((m) => m.hinweise?.() ?? []);
    expect(hinweise.length).toBeGreaterThan(0);
    expect(new Set(hinweise.map((h) => h.schluessel)).size).toBe(hinweise.length);
  });
});
