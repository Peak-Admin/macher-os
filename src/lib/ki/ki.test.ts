import { afterEach, describe, expect, it } from 'vitest';
import { briefkopfBereinigen, briefkopfErkennen, htmlText, istInterneAdresse, KiFehler, logoKandidaten, POST as briefkopfPOST, sicherAbrufen, websiteUrl } from './briefkopf';
import { kundenlisteErkennen } from './kundenliste';
import { preiseBereinigen, preislisteErkennen } from './preisliste';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const claude = (daten: unknown, stop = 'end_turn') => json(200, { stop_reason: stop, content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(daten) }] });

const ERKANNT = {
  name: ' Elektro Meier GmbH ', inhaber: 'Max Meier', strasse: 'Hauptstr. 1', plz: '34117', ort: 'Kassel', telefon: '0561 1', email: 'Info@Meier.de', website: '',
  steuernummer: '026 123 45678', ustId: 'de 123456789', iban: 'DE89 3704 0044 0532 0130 00', bic: 'cobadeffxxx', zahlungszielTage: 14, stundensatz: 68,
  logo: { gefunden: true, x: 0.05, y: 0.02, breite: 0.3, hoehe: 0.1 },
};

describe('Server: Briefkopf erkennen (gemockter fetch)', () => {
  const env = { ANTHROPIC_API_KEY: undefined as string | undefined };
  afterEach(() => {
    delete (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.ANTHROPIC_API_KEY;
  });

  it('antwortet ohne Schlüssel mit 501 „nicht verbunden“', async () => {
    const r = await briefkopfPOST(new Request('http://x/api/ki/briefkopf', { method: 'POST', body: '{}' }));
    expect(r.status).toBe(501);
    expect(await r.json()).toEqual({ fehler: 'nicht verbunden' });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('schickt das Foto an Claude (strukturierte Ausgabe) und säubert das Ergebnis', async () => {
    const aufrufe: { url: string; init: RequestInit }[] = [];
    const f = (async (url: string, init: RequestInit) => (aufrufe.push({ url, init }), claude(ERKANNT))) as unknown as typeof fetch;
    const b = await briefkopfErkennen({ bild: { daten: 'data:image/jpeg;base64,QUJD', mime: 'image/jpeg' } }, { apiKey: 'k', fetch: f });
    expect(b).toMatchObject({ name: 'Elektro Meier GmbH', email: 'info@meier.de', ustId: 'DE123456789', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', zahlungszielTage: 14, logo: { gefunden: true, breite: 0.3 } });
    expect(aufrufe).toHaveLength(1);
    expect(aufrufe[0].url).toBe('https://api.anthropic.com/v1/messages');
    const h = aufrufe[0].init.headers as Record<string, string>;
    expect(h['x-api-key']).toBe('k');
    expect(h['anthropic-version']).toBe('2023-06-01');
    const body = JSON.parse(String(aufrufe[0].init.body));
    expect(body.model).toBe('claude-opus-5-5');
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } });
  });

  const oeffentlich = async () => ['93.184.216.34'];

  it('liest bei einer Website Startseite und Impressum und lädt das Logo', async () => {
    const geholt: string[] = [];
    let anClaude = '';
    const f = (async (url: string, init?: RequestInit) => {
      geholt.push(url);
      if (url.startsWith('https://api.anthropic.com')) return (anClaude = String(init?.body)), claude(ERKANNT);
      if (url.endsWith('/impressum')) return new Response('<html><script>x()</script><p>Steuernummer 026&nbsp;123 45678</p></html>', { status: 200 });
      if (url.endsWith('/bilder/logo.png')) return new Response(new Uint8Array([137, 80, 78, 71]), { status: 200, headers: { 'content-type': 'image/png' } });
      return new Response('<h1>Willkommen</h1><img class="site-logo" src="/bilder/logo.png" alt="Elektro Meier">', { status: 200 });
    }) as unknown as typeof fetch;
    const b = await briefkopfErkennen({ website: 'elektro-meier.de' }, { apiKey: 'k', fetch: f, aufloesen: oeffentlich });
    expect(geholt.slice(0, 2)).toEqual(['https://elektro-meier.de/', 'https://elektro-meier.de/impressum']);
    expect(anClaude).toContain('Steuernummer 026 123 45678');
    expect(anClaude).not.toContain('x()');
    expect(b.logo.gefunden).toBe(false);
    expect(b.logoBild).toBe('data:image/png;base64,iVBORw==');
  });

  it('ruft keine internen Adressen ab – auch nicht über Weiterleitungen', async () => {
    expect(['10.0.0.1', '127.0.0.1', '169.254.169.254', '172.20.1.1', '192.168.1.5', '100.64.0.1', '::1', 'fd00::1', '::ffff:10.1.2.3'].every(istInterneAdresse)).toBe(true);
    expect(['93.184.216.34', '2a00:1450::1'].some(istInterneAdresse)).toBe(false);
    const geholt: string[] = [];
    const f = (async (url: string) => {
      geholt.push(url);
      return new Response('', { status: 302, headers: { location: 'http://intern.example/' } });
    }) as unknown as typeof fetch;
    const aufloesen = async (host: string) => (host === 'intern.example' ? ['10.0.0.5'] : ['93.184.216.34']);
    expect(await sicherAbrufen(new URL('https://meier.de/'), { fetch: f, aufloesen }, 'text/html')).toBeUndefined();
    expect(geholt).toEqual(['https://meier.de/']);
    expect(await sicherAbrufen(new URL('https://intern.example/'), { fetch: f, aufloesen }, 'text/html')).toBeUndefined();
    expect(logoKandidaten('<img src="a.jpg"><img src="/l.svg" alt="Logo"><link rel="apple-touch-icon" href="/t.png">', new URL('https://x.de/seite/')).map((u) => u.href)).toEqual(['https://x.de/l.svg', 'https://x.de/t.png']);
  });

  it('weist lokale Adressen, fehlende Eingaben und Ablehnungen verständlich ab', async () => {
    expect(() => websiteUrl('http://localhost:3000')).toThrow(KiFehler);
    expect(() => websiteUrl('192.168.0.1')).toThrow(KiFehler);
    await expect(briefkopfErkennen({}, { apiKey: 'k', fetch: (async () => claude({})) as unknown as typeof fetch })).rejects.toMatchObject({ status: 400 });
    await expect(briefkopfErkennen({ bild: { daten: 'QUJD', mime: 'application/zip' } }, { apiKey: 'k' })).rejects.toMatchObject({ status: 415 });
    await expect(briefkopfErkennen({ bild: { daten: 'QUJD', mime: 'image/png' } }, { apiKey: 'k', fetch: (async () => claude({}, 'refusal')) as unknown as typeof fetch })).rejects.toMatchObject({ status: 422 });
    await expect(briefkopfErkennen({ bild: { daten: 'QUJD', mime: 'image/png' } }, { apiKey: 'k', fetch: (async () => json(529, {})) as unknown as typeof fetch })).rejects.toMatchObject({ status: 502 });
  });

  it('gibt über POST mit Schlüssel das Ergebnis als JSON zurück', async () => {
    (globalThis as unknown as { process: { env: Record<string, string> } }).process.env.ANTHROPIC_API_KEY = 'k';
    const original = globalThis.fetch;
    globalThis.fetch = (async () => claude(ERKANNT)) as unknown as typeof fetch;
    try {
      const r = await briefkopfPOST(new Request('http://x/api/ki/briefkopf', { method: 'POST', body: JSON.stringify({ bild: { daten: 'QUJD', mime: 'image/png' } }) }));
      expect(r.status).toBe(200);
      expect((await r.json()).briefkopf.name).toBe('Elektro Meier GmbH');
    } finally {
      globalThis.fetch = original;
    }
  });

  it('säubert unplausible Werte', () => {
    const b = briefkopfBereinigen({ plz: '3411', zahlungszielTage: -3, logo: { gefunden: true, x: 2, y: 0, breite: 0, hoehe: 0 } });
    expect(b).toMatchObject({ plz: '', zahlungszielTage: 0, logo: { gefunden: false } });
    expect(htmlText('a<br>b &amp; c')).toBe('a\nb & c');
  });
});

describe('Server: Preisliste erkennen (gemockter fetch)', () => {
  it('liest Foto oder PDF, rechnet brutto in netto und entfernt Doppelte', async () => {
    let body: { messages: { content: { type: string }[] }[] } | undefined;
    const f = (async (_u: string, init: RequestInit) => (
      (body = JSON.parse(String(init.body))),
      claude({ leistungen: [
        { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 68, brutto: false, kategorie: 'Lohn' },
        { name: 'Anfahrt', einheit: 'Psch', preis: 47.6, brutto: true, kategorie: '' },
        { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 70, brutto: false, kategorie: 'Lohn' },
        { name: 'Ohne Preis', einheit: 'Stk', preis: 0, brutto: false, kategorie: 'X' },
      ] })
    )) as unknown as typeof fetch;
    const l = await preislisteErkennen({ datei: { daten: 'QUJD', mime: 'application/pdf' } }, { apiKey: 'k', fetch: f });
    expect(body?.messages[0].content[0].type).toBe('document');
    expect(l).toEqual([
      { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 68, kategorie: 'Lohn' },
      { name: 'Anfahrt', einheit: 'Psch', preis: 40, kategorie: 'Leistung' },
    ]);
  });

  it('meldet leere Ergebnisse und fehlenden Schlüssel', async () => {
    expect(preiseBereinigen({ leistungen: [{ name: 'X', einheit: 'egal', preis: 5 }] })[0].einheit).toBe('Stk');
    await expect(preislisteErkennen({ datei: { daten: 'QUJD', mime: 'image/png' } }, { apiKey: 'k', fetch: (async () => claude({ leistungen: [] })) as unknown as typeof fetch })).rejects.toMatchObject({ status: 422 });
    await expect(preislisteErkennen({}, {})).rejects.toMatchObject({ status: 501 });
  });
});

describe('Server: Kundenliste per Foto (gemockter fetch)', () => {
  it('liest Kunden aus Foto/PDF und lässt Leere weg', async () => {
    const f = (async () => claude({ kunden: [
      { name: 'Familie Hoffmann', firma: '', telefon: '0171 2345678', email: '', strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' },
      { name: '', firma: '', telefon: '', email: '', strasse: '', plz: '', ort: '' },
      { name: '', firma: 'Bäckerei Sommer KG', telefon: '', email: 'INFO@sommer.de', strasse: '', plz: '3424', ort: 'Vellmar' },
    ] })) as unknown as typeof fetch;
    const k = await kundenlisteErkennen({ datei: { daten: 'QUJD', mime: 'image/jpeg' } }, { apiKey: 'k', fetch: f });
    expect(k).toEqual([
      { name: 'Familie Hoffmann', firma: '', telefon: '0171 2345678', email: '', strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' },
      { name: 'Bäckerei Sommer KG', firma: 'Bäckerei Sommer KG', telefon: '', email: 'info@sommer.de', strasse: '', plz: '', ort: 'Vellmar' },
    ]);
    await expect(kundenlisteErkennen({}, {})).rejects.toMatchObject({ status: 501 });
  });
});
