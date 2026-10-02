import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { zuruecksetzen } from './db';
import { frage, kostenAnteilMonat, kostenBuchen, kostenMonat, registriereGateway, waehleLane, type GatewayKontext } from './gateway';
import { verbindeModelle, verbindungZuruecksetzen } from './ki-modelle';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const k = (): GatewayKontext => ({ heute: '2026-10-02', jetzt: new Date('2026-10-02T10:00:00Z'), darf: () => true });

const aus: (() => void)[] = [];
beforeEach(() => {
  zuruecksetzen();
  verbindungZuruecksetzen();
});
afterEach(() => aus.splice(0).forEach((f) => f()));

describe('Modelle anschließen', () => {
  it('ohne Server bleibt alles bei Regeln', async () => {
    const holen = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await verbindeModelle(holen)).toEqual([]);
    expect(waehleLane(1, k())).toBeUndefined();
  });

  it('meldet eingerichtete Lanes an und bucht die Kosten', async () => {
    const holen = vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init) return json({ lanes: { 1: true, 2: false, 3: false } });
      return json({ absicht: 'invoice.list', sicherheit: 0.9, werte: {}, kostenCent: 0.5 });
    });
    expect(await verbindeModelle(holen as never)).toEqual([1]);
    aus.push(
      registriereGateway({
        absichten: [
          { id: 'invoice.list', titel: 'Offene Rechnungen', risiko: 'lesen', beantworte: () => 'liste' },
          { id: 'search', titel: 'Suche', risiko: 'lesen', auffang: true, beantworte: () => 'suche' },
        ],
      }),
    );
    const g = await frage<string>('Was schuldet uns Müller?', k());
    expect(g).toMatchObject({ ergebnis: 'liste', erkennung: { lane: 1 }, modell: 'Jev' });
    expect(holen.mock.calls[1][1]?.body).toContain('"lane":1');
    expect(kostenMonat(new Date('2026-10-02T10:00:00Z'))).toBe(0.5);
  });

  it('misst den Kostenanteil am Monatsbeitrag', () => {
    const jetzt = new Date('2026-10-15T10:00:00Z');
    kostenBuchen(890, jetzt);
    expect(kostenAnteilMonat(jetzt)).toBeCloseTo(0.1);
    kostenBuchen(1000, jetzt);
    expect(kostenAnteilMonat(jetzt)).toBeGreaterThan(0.2);
    expect(kostenAnteilMonat(new Date('2026-11-01T10:00:00Z'))).toBe(0);
  });
});
