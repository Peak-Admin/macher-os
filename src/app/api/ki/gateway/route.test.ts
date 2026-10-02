// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const erstellen = vi.fn();
vi.mock('@anthropic-ai/sdk', async (original) => {
  const echt = (await original()) as { default: { APIError: unknown; RateLimitError: unknown } };
  class Fake {
    beta = { messages: { create: erstellen } };
    static APIError = echt.default.APIError;
    static RateLimitError = echt.default.RateLimitError;
  }
  return { default: Fake };
});

const { GET, POST } = await import('./route');
const { kostenCent, laneFrei, modellFuer } = await import('./lanes');

const anfrage = (body: unknown, kopf: Record<string, string> = {}) =>
  new Request('https://macher.example/api/ki/gateway', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://macher.example', host: 'macher.example', 'x-forwarded-for': `10.1.0.${Math.floor(Math.random() * 250)}`, ...kopf },
    body: JSON.stringify(body),
  });

const antwort = (text: string, extra: Record<string, unknown> = {}) => ({ model: 'claude-haiku-4-5', stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 1000, output_tokens: 100 }, ...extra });

describe('/api/ki/gateway', () => {
  beforeEach(() => {
    erstellen.mockReset();
    process.env.ANTHROPIC_API_KEY = 'test';
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.KI_LANES;
    delete process.env.KI_MODELL_LUNA;
  });

  it('ohne Schlüssel: 501 und keine Lane frei', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect((await POST(anfrage({ lane: 1, aufgabe: 'erkennen', text: 'x', absichten: [{ id: 'a', titel: 'A' }] }))).status).toBe(501);
    expect(await GET().json()).toEqual({ lanes: { 1: false, 2: false, 3: false } });
  });

  it('Lanes lassen sich einschränken, Modelle umstellen', async () => {
    process.env.KI_LANES = '1,2';
    process.env.KI_MODELL_LUNA = 'claude-opus-5-5';
    expect(await GET().json()).toEqual({ lanes: { 1: true, 2: true, 3: false } });
    expect([laneFrei(3), modellFuer(1), modellFuer(2), modellFuer(3)]).toEqual([false, 'claude-haiku-4-5', 'claude-opus-5-5', 'claude-opus-5-5']);
    expect((await POST(anfrage({ lane: 3, aufgabe: 'schreiben', text: 'x' }))).status).toBe(501);
  });

  it('rechnet Kosten je Modell', () => {
    expect(kostenCent('claude-haiku-4-5', 1_000_000, 0)).toBeCloseTo(92);
    expect(kostenCent('claude-sonnet-5-5', 0, 1_000_000)).toBeCloseTo(920);
  });

  it('nur von der eigenen Seite', async () => {
    expect((await POST(anfrage({ lane: 1 }, { origin: 'https://fremd.example' }))).status).toBe(403);
  });

  it('Jev: wählt nur Absichten aus der Liste, mit Kosten', async () => {
    erstellen.mockResolvedValue(antwort(JSON.stringify({ absicht: 'invoice.list', sicherheit: 0.92, werte: { kunde: 'Müller' } })));
    const r = await POST(anfrage({ lane: 1, aufgabe: 'erkennen', text: 'Was schuldet uns Müller?', absichten: [{ id: 'invoice.list', titel: 'Offene Rechnungen' }] }));
    expect(r.status).toBe(200);
    const d = await r.json();
    expect(d).toMatchObject({ absicht: 'invoice.list', sicherheit: 0.92, werte: { kunde: 'Müller' } });
    expect(d.kostenCent).toBeGreaterThan(0);
    const body = erstellen.mock.calls[0][0];
    expect(body.model).toBe('claude-haiku-4-5');
    expect(body.output_config.format.schema.properties.absicht.enum).toEqual(['invoice.list', 'unbekannt']);
    expect(body.fallbacks).toBeUndefined();

    erstellen.mockResolvedValue(antwort(JSON.stringify({ absicht: 'erfunden', sicherheit: 0.99, werte: {} })));
    const r2 = await (await POST(anfrage({ lane: 1, aufgabe: 'erkennen', text: 'x', absichten: [{ id: 'invoice.list', titel: 'A' }] }))).json();
    expect(r2).toMatchObject({ sicherheit: 0 });
    expect(r2.absicht).toBeUndefined();
  });

  it('Luna: schreibt Text aus minimalem Kontext, mit Ausweichmodell', async () => {
    erstellen.mockResolvedValue(antwort('Guten Tag Herr Schneider, …', { model: 'claude-sonnet-5-5' }));
    const r = await (await POST(anfrage({ lane: 2, aufgabe: 'schreiben', text: 'Schreib Schneider, dass wir später kommen', kontext: { kunde: { name: 'Schneider' } } }))).json();
    expect(r.text).toBe('Guten Tag Herr Schneider, …');
    const body = erstellen.mock.calls[0][0];
    expect(body).toMatchObject({ model: 'claude-sonnet-5-5', fallbacks: 'default', betas: ['server-side-fallback-2026-07-01'], output_config: { effort: 'low' } });
    expect(body.messages[0].content).toContain('"name":"Schneider"');
  });

  it('Angebotspositionen: strukturierte Ausgabe statt Fließtext', async () => {
    const json = JSON.stringify({ positionen: [{ katalogId: 'l1', text: 'Fliesen', menge: 8, einheit: 'm²', preisEuro: 0 }] });
    erstellen.mockResolvedValue(antwort(json));
    const r = await (await POST(anfrage({ lane: 2, aufgabe: 'schreiben', text: 'Bad 8 m² fliesen', kontext: { format: 'angebot.positionen', katalog: [] } }))).json();
    expect(r.text).toBe(json);
    const aufruf = erstellen.mock.calls[0][0];
    expect(aufruf.output_config.format.type).toBe('json_schema');
    expect(aufruf.system).toContain('Angebotspositionen');
  });

  it('Ablehnung oder leere Antwort → 422', async () => {
    erstellen.mockResolvedValue(antwort('', { stop_reason: 'refusal' }));
    expect((await POST(anfrage({ lane: 2, aufgabe: 'schreiben', text: 'x' }))).status).toBe(422);
  });
});
