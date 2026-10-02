/** Rendert das Home mit Beispieldaten für jede Rolle und jedes Widget in jeder Größe – findet Laufzeitfehler. */
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { einrichten } from '@core/seed';
import { setzeIch } from '@core/session';
import type { Rolle } from '@core/objects';
import { ToastProvider } from '@ui/index';
import { ladeModule } from '../module';
import { HomeSeite } from './HomeSeite';
import { STANDARD_HOME } from './layout';
import { layoutSchluessel } from './useHomeLayout';
import { erlaubteWidgets, WIDGETS } from './registry';
import { WidgetRahmen } from './Rahmen';
import type { HomeLayout } from './typen';

ladeModule();
einrichten({ betriebName: 'Test', gewerk: 'shk', arbeitsweisen: [], teamgroesse: 3, chefVorname: 'Markus', chefNachname: 'Meister', beispiele: true });

afterEach(cleanup);

const huelle = (el: React.ReactNode) => render(<MemoryRouter><ToastProvider>{el}</ToastProvider></MemoryRouter>);
const person = (rolle: Rolle) => db.mitarbeiter.all().find((m) => m.rolle === rolle);

describe('Widget-Bibliothek', () => {
  it('hat eindeutige IDs, gültige Größen, und jedes Standard-Widget existiert', () => {
    expect(new Set(WIDGETS.map((w) => w.id)).size).toBe(WIDGETS.length);
    for (const w of WIDGETS) expect(w.availableSizes).toContain(w.defaultSize);
    for (const liste of Object.values(STANDARD_HOME)) {
      expect(liste.length).toBeLessThanOrEqual(4);
      for (const s of liste) expect(WIDGETS.some((w) => w.id === s.id)).toBe(true);
    }
    expect(WIDGETS.length).toBeGreaterThanOrEqual(20);
  });

  it('respektiert Rollen und Rechte', () => {
    const chef = person('chef')!;
    const monteur = person('monteur') ?? { ...chef, id: 'x', rolle: 'monteur' as const };
    const fuerChef = erlaubteWidgets(chef).map((w) => w.id);
    const fuerMonteur = erlaubteWidgets(monteur).map((w) => w.id);
    expect(fuerChef).toContain('offene-posten');
    expect(fuerMonteur).not.toContain('offene-posten');
    expect(fuerMonteur).not.toContain('ansprechpartner');
  });

  it('jedes Widget rendert in jeder Größe ohne Fehler', () => {
    const chef = person('chef')!;
    for (const def of WIDGETS)
      for (const g of def.availableSizes) {
        const W = def.component;
        huelle(
          <WidgetRahmen def={def}>
            <W groesse={g} ich={chef} />
          </WidgetRahmen>,
        ).unmount();
      }
  });
});

describe('Home', () => {
  it('zeigt Begrüßung und die vier Standard-Widgets', async () => {
    setzeIch(person('chef')!.id);
    const { unmount } = huelle(<HomeSeite />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Servus, Markus');
    for (const titel of ['Dein nächster Schritt', 'Dein Ansprechpartner', 'Deine Arbeit', 'Neu für dich']) expect(screen.getByRole('heading', { name: titel })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Offene Rechnungen' })).toBeNull();
    // Inhalte laden unabhängig
    expect(await screen.findByText('Julia Muster', { exact: false })).toBeTruthy();
    unmount();
  });

  it('rendert für jede Rolle', () => {
    for (const r of ['chef', 'buero', 'monteur', 'azubi'] as Rolle[]) {
      const m = person(r);
      if (!m) continue;
      setzeIch(m.id);
      huelle(<HomeSeite />).unmount();
    }
  });

  it('Home anpassen: Widget aus der Bibliothek hinzufügen, Größe ändern, ausblenden – gespeichert je Nutzer', async () => {
    const chef = person('chef')!;
    setzeIch(chef.id);
    const { unmount } = huelle(<HomeSeite />);
    fireEvent.click(screen.getByRole('button', { name: 'Home anpassen' }));
    expect(screen.getByRole('heading', { name: 'Home anpassen' })).toBeTruthy();

    const bibliothek = screen.getByRole('complementary', { name: 'Widget-Bibliothek' });
    await act(async () => fireEvent.click(within(bibliothek).getByRole('button', { name: 'Offene Rechnungen hinzufügen' })));
    let l = einstellung<HomeLayout | null>(layoutSchluessel(chef.id), null)!;
    expect(l.widgets.filter((w) => w.visible).map((w) => w.widgetId)).toEqual(['naechster-schritt', 'ansprechpartner', 'arbeit', 'neu', 'offene-posten']);

    const gruppe = screen.getByRole('group', { name: 'Größe von Offene Rechnungen' });
    await act(async () => fireEvent.click(within(gruppe).getByRole('button', { name: 'Groß' })));
    l = einstellung<HomeLayout | null>(layoutSchluessel(chef.id), null)!;
    expect(l.widgets.find((w) => w.widgetId === 'offene-posten')!.size).toBe('gross');

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Neu für dich ausblenden' })));
    l = einstellung<HomeLayout | null>(layoutSchluessel(chef.id), null)!;
    expect(l.widgets.find((w) => w.widgetId === 'neu')!.visible).toBe(false);

    // Tastatur: Griff fokussieren, Pfeil hoch
    const griff = screen.getByRole('button', { name: 'Deine Arbeit verschieben' });
    await act(async () => fireEvent.keyDown(griff, { key: 'ArrowUp' }));
    l = einstellung<HomeLayout | null>(layoutSchluessel(chef.id), null)!;
    const sichtbar = l.widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order).map((w) => w.widgetId);
    expect(sichtbar.indexOf('arbeit')).toBeLessThan(sichtbar.indexOf('naechster-schritt'));

    fireEvent.click(screen.getByRole('button', { name: 'Fertig' }));
    expect(screen.getByRole('heading', { name: 'Offene Rechnungen' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Neu für dich' })).toBeNull();
    unmount();

    // Andere Nutzer behalten ihr eigenes Home
    const buero = person('buero');
    if (buero) {
      setzeIch(buero.id);
      huelle(<HomeSeite />);
      expect(screen.getByRole('heading', { name: 'Neu für dich' })).toBeTruthy();
    }
  });
});

describe('Einrichtung im nächsten Schritt', () => {
  it('zeigt links die Schritte, rechts den aktiven Schritt mit genau einer Aktion', async () => {
    const { Einrichtung } = await import('./widgets/kern');
    huelle(
      <Einrichtung
        danach={[]}
        a={{
          id: 'einrichtung:kunden',
          type: 'onboarding',
          title: 'Macher fertig machen',
          description: 'Als Nächstes: Kunden & Preise übernehmen.',
          priority: 40,
          icon: 'start',
          actionLabel: 'Weiter einrichten',
          actionUrl: '/betrieb/import?art=kunden',
          completed: false,
          ausblenden: 'start.karteAus',
          progress: {
            erledigt: 2,
            gesamt: 4,
            schritte: [
              { id: 'betrieb', titel: 'Betrieb eingerichtet', erledigt: true },
              { id: 'gewerk', titel: 'Gewerk eingerichtet', erledigt: true },
              { id: 'kunden', titel: 'Kunden & Preise übernehmen', erledigt: false, aktion: { label: 'Kunden & Preise übernehmen', pfad: '/betrieb/import?art=kunden' } },
              { id: 'team', titel: 'Team hinzufügen', erledigt: false, aktion: { label: 'Team hinzufügen', pfad: '/betrieb/mitarbeiter/neu' } },
            ],
          },
        }}
      />,
    );
    const aktiv = document.querySelector('[aria-current="step"]');
    expect(aktiv?.textContent).toContain('Kunden & Preise übernehmen');
    const rechts = document.querySelector('.mm-home-setup-aktiv') as HTMLElement;
    const knoepfe = within(rechts).getAllByRole('link');
    expect(knoepfe).toHaveLength(1);
    expect(knoepfe[0].getAttribute('href')).toBe('/betrieb/import?art=kunden');
    expect(rechts.querySelector('img.mm-asset')).toBeTruthy();
  });
});
