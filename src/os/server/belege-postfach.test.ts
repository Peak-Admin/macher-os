import { afterEach, describe, expect, test, vi } from 'vitest';
import { mailLesen } from './postfach';
import {
  anhaengeLesen,
  base64Bytes,
  belegAnhaenge,
  belegePlanen,
  belegePostfachAdresse,
  belegMime,
  hauptDomain,
  lieferantVorschlagen,
  rechnungsnummerAus,
  slugAusBelegeAdresse,
  urspruenglicherAbsender,
} from './belege-postfach';
import { belegeEingang, downloadErlaubt, speicherName } from './belege-eingang';

const PDF = btoa('%PDF-1.4 Rechnung');

const postmark = (x: Record<string, unknown> = {}) => ({
  FromFull: { Email: 'rechnung@sonepar.de', Name: 'Sonepar Rechnungsversand' },
  ToFull: [{ Email: 'belege@mueller-elektro.macher-os.de' }],
  Subject: 'Ihre Rechnung Nr. RE-2026-0815',
  TextBody: 'Anbei Ihre Rechnung.',
  MessageID: 'pm-77',
  Attachments: [
    { Name: 'RE-2026-0815.pdf', Content: PDF, ContentType: 'application/pdf', ContentLength: 17 },
    { Name: 'logo.png', Content: btoa('png'), ContentType: 'image/png', ContentLength: 3000, ContentID: 'logo@sonepar' },
    { Name: 'agb.docx', Content: btoa('x'), ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ContentLength: 1 },
  ],
  ...x,
});

describe('Belege-Postfach: Adresse', () => {
  test('eigene Adresse je Betrieb neben dem Anfrage-Postfach', () => {
    expect(belegePostfachAdresse('Müller Elektro GmbH')).toBe('belege@mueller-elektro.macher-os.de');
    expect(slugAusBelegeAdresse('Belege <belege@mueller-elektro.macher-os.de>')).toBe('mueller-elektro');
    expect(slugAusBelegeAdresse('belege+sonepar@mueller-elektro.macher-os.de')).toBe('mueller-elektro');
    expect(slugAusBelegeAdresse('anfragen@mueller-elektro.macher-os.de')).toBeUndefined();
    expect(slugAusBelegeAdresse('belege@mueller-elektro.de')).toBeUndefined();
  });
});

describe('Belege-Postfach: Anhänge', () => {
  test('Postmark: nur PDF/JPG/PNG, keine eingebetteten Logos', () => {
    const a = anhaengeLesen(postmark());
    expect(a).toHaveLength(3);
    const { passend, uebersprungen } = belegAnhaenge(a);
    expect(passend.map((x) => x.name)).toEqual(['RE-2026-0815.pdf']);
    expect(uebersprungen).toEqual([
      { name: 'logo.png', grund: 'Logo oder Signatur' },
      { name: 'agb.docx', grund: 'kein PDF, JPG oder PNG' },
    ]);
  });

  test('Resend/allgemein: Endung entscheidet bei octet-stream, Inhalt per Link oder gar nicht', () => {
    const a = anhaengeLesen({
      type: 'email.received',
      data: {
        from: 'Max <max@example.de>',
        attachments: [
          { filename: 'scan.JPG', content_type: 'application/octet-stream', content: btoa('jpg'), size: 3 },
          { filename: 'rechnung.pdf', content_type: 'application/pdf', download_url: 'https://dl.example.com/x' },
          { filename: 'ohne.pdf', content_type: 'application/pdf', id: 'att_1' },
        ],
      },
    });
    expect(a.map((x) => belegMime(x))).toEqual(['image/jpeg', 'application/pdf', 'application/pdf']);
    const { passend, uebersprungen } = belegAnhaenge(a);
    expect(passend.map((x) => x.name)).toEqual(['scan.JPG', 'rechnung.pdf']);
    expect(uebersprungen).toEqual([{ name: 'ohne.pdf', grund: 'ohne Inhalt geliefert' }]);
  });

  test('zu große Anhänge werden übersprungen, Größe aus Base64 geschätzt', () => {
    expect(base64Bytes(btoa('abcd'))).toBe(4);
    const { uebersprungen } = belegAnhaenge([{ name: 'riesig.pdf', mime: 'application/pdf', inhalt: 'x', bytes: 11 * 1024 * 1024, eingebettet: false }]);
    expect(uebersprungen[0].grund).toBe('größer als 10 MB');
  });
});

describe('Belege-Postfach: Absender → Lieferant', () => {
  const lieferanten = [
    { id: 'l1', name: 'Sonepar Deutschland GmbH', website: 'www.sonepar.de' },
    { id: 'l2', name: 'Würth', email: 'buchhaltung@wuerth.com' },
    { id: 'l3', name: 'Alter Händler', email: 'alt@example.de', geloeschtAm: '2026-01-01' },
  ];
  test('bekannte Adresse, sonst Firmen-Domain, sonst Name', () => {
    expect(lieferantVorschlagen(lieferanten, { email: 'buchhaltung@wuerth.com' })).toMatchObject({ lieferantId: 'l2' });
    expect(lieferantVorschlagen(lieferanten, { email: 'rechnung@mail.sonepar.de' })).toMatchObject({ lieferantId: 'l1', grund: 'Absender-Domain sonepar.de passt' });
    expect(lieferantVorschlagen(lieferanten, { email: 'x@gmail.com', name: 'Würth' })).toMatchObject({ lieferantId: 'l2' });
  });
  test('unbekannt: Vorschlag aus Domain, bei Freemail aus dem Namen; gelöschte zählen nicht', () => {
    expect(lieferantVorschlagen(lieferanten, { email: 'rechnung@elektro-gross.de', name: 'Rechnung' })).toEqual({ lieferantName: 'Elektro Gross', grund: 'aus dem Absender übernommen' });
    expect(lieferantVorschlagen(lieferanten, { email: 'max.bau@web.de', name: 'Max Bau' })).toMatchObject({ lieferantName: 'Max Bau' });
    expect(lieferantVorschlagen(lieferanten, { email: 'alt@example.de' }).lieferantId).toBeUndefined();
    expect(hauptDomain('rechnung.shop.example.co.uk')).toBe('example.co.uk');
  });
  test('weitergeleitete Mail: ursprünglicher Absender aus dem Text', () => {
    const m = { betreff: 'WG: Rechnung 4711', text: 'Bitte buchen.\n\n-------- Weitergeleitete Nachricht --------\nVon: Sonepar <rechnung@sonepar.de>\nBetreff: Rechnung 4711' };
    expect(urspruenglicherAbsender(m)).toEqual({ email: 'rechnung@sonepar.de', name: 'Sonepar' });
    expect(urspruenglicherAbsender({ betreff: 'Rechnung', text: 'Hallo' })).toBeUndefined();
  });
  test('Rechnungsnummer aus dem Betreff, nur mit Ziffer', () => {
    expect(rechnungsnummerAus('Ihre Rechnung Nr. RE-2026-0815')).toBe('RE-2026-0815');
    expect(rechnungsnummerAus('AW: Rechnung 4711.')).toBe('4711');
    expect(rechnungsnummerAus('Rechnung für Oktober')).toBeUndefined();
  });
});

describe('Belege-Postfach: Plan', () => {
  const jetzt = new Date('2026-10-01T22:30:00Z'); // in Deutschland schon der 2.10.
  let n = 0;
  const id = () => `id-${++n}`;

  test('je Anhang ein Beleg (neu, Quelle E-Mail) mit Dokument', () => {
    n = 0;
    const mail = mailLesen(postmark())!;
    const plan = belegePlanen(mail, anhaengeLesen(postmark()), { lieferanten: [{ id: 'l1', name: 'Sonepar', email: 'rechnung@sonepar.de' }], belege: [] }, { id, jetzt });
    expect(plan.doppelt).toBe(false);
    expect(plan.belege).toHaveLength(1);
    expect(plan.belege[0].daten).toMatchObject({
      art: 'eingangsrechnung',
      status: 'neu',
      quelle: 'email',
      lieferantId: 'l1',
      nummer: 'RE-2026-0815',
      datum: '2026-10-02',
      netto: 0,
      ust: 0,
      dokumentId: plan.dokumente[0].id,
      eingangId: 'pm-77#1',
      eingangVon: 'rechnung@sonepar.de',
    });
    expect(plan.dokumente[0].daten).toMatchObject({ art: 'pdf', mime: 'application/pdf', bezug: { typ: 'belege', id: plan.belege[0].id } });
  });

  test('doppelt zugestellt → nichts anlegen', () => {
    const mail = mailLesen(postmark())!;
    const plan = belegePlanen(mail, anhaengeLesen(postmark()), { lieferanten: [], belege: [{ id: 'b', eingangId: 'pm-77#1' }] }, { id, jetzt });
    expect(plan.doppelt).toBe(true);
    expect(plan.belege).toHaveLength(0);
  });
});

describe('Belege-Eingang (Server)', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('Hilfen: Dateiname und erlaubte Download-Links', () => {
    expect(speicherName('Rechnung März 2026.pdf')).toBe('Rechnung-Marz-2026.pdf');
    expect(downloadErlaubt('https://dl.example.com/a.pdf')).toBe(true);
    expect(downloadErlaubt('http://dl.example.com/a.pdf')).toBe(false);
    expect(downloadErlaubt('https://127.0.0.1/a')).toBe(false);
    expect(downloadErlaubt('https://localhost/a')).toBe(false);
  });

  test('lädt den Anhang hoch und schreibt Dokument + Beleg in den richtigen Betrieb', async () => {
    const betriebId = '11111111-2222-3333-4444-555555555555';
    const aufrufe: { url: string; method: string; body?: unknown }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
      aufrufe.push({ url, method: init.method ?? 'GET', body: init.body });
      if (url.includes('/rest/v1/betriebe') && url.includes('postfach=eq.mueller-elektro')) return new Response(JSON.stringify([{ id: betriebId }]));
      if (url.includes('/rest/v1/objekte?select=')) return new Response(JSON.stringify(url.includes('sammlung=eq.lieferanten') ? [{ id: 'l1', daten: { name: 'Sonepar', email: 'rechnung@sonepar.de' } }] : []));
      if (url.includes('/storage/v1/object/dateien/')) return new Response('{}');
      if (url.includes('/rest/v1/objekte?on_conflict')) return new Response(null, { status: 201 });
      return new Response('nicht erwartet', { status: 500 });
    });
    const body = postmark();
    const r = await belegeEingang({ v: { url: 'https://db.example.co', schluessel: 'svc' }, body, mail: mailLesen(body)!, slug: 'mueller-elektro', appBasis: 'https://macher-os.de' });
    const ergebnis = await r.json();
    expect(r.status).toBe(200);
    expect(ergebnis.ok).toBe(true);
    expect(ergebnis.belege).toHaveLength(1);
    const upload = aufrufe.find((a) => a.url.includes('/storage/v1/object/dateien/'))!;
    expect(upload.url).toMatch(new RegExp(`/dateien/${betriebId}/\\w+-RE-2026-0815\\.pdf$`));
    const schreiben = aufrufe.find((a) => a.url.includes('on_conflict'))!;
    const zeilen = JSON.parse(String(schreiben.body)) as { betrieb_id: string; sammlung: string; daten: Record<string, unknown> }[];
    expect(zeilen.map((z) => z.sammlung)).toEqual(['dokumente', 'belege']);
    expect(zeilen.every((z) => z.betrieb_id === betriebId)).toBe(true);
    expect(String(zeilen[0].daten.url)).toMatch(/^https:\/\/macher-os\.de\/api\/cloud\/datei\?p=.+&s=.+/);
    expect(zeilen[1].daten).toMatchObject({ status: 'neu', quelle: 'email', lieferantId: 'l1' });
  });

  test('unbekannter Betrieb oder kein passender Anhang → 200 ohne Schreiben', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/rest/v1/betriebe')) return new Response(JSON.stringify(url.includes('postfach=eq.') ? [] : [{ id: 'b1', name: 'Müller Elektro' }]));
      if (url.includes('/rest/v1/objekte?select=')) return new Response('[]');
      return new Response('nicht erwartet', { status: 500 });
    });
    const v = { url: 'https://db.example.co', schluessel: 'svc' };
    const fremd = await belegeEingang({ v, body: postmark(), mail: mailLesen(postmark())!, slug: 'unbekannt', appBasis: 'https://macher-os.de' });
    expect(fremd.status).toBe(200);
    expect((await fremd.json()).fehler).toBe('Betrieb nicht gefunden');
    const ohne = postmark({ Attachments: [] });
    const leer = await belegeEingang({ v, body: ohne, mail: mailLesen(ohne)!, slug: 'mueller-elektro', appBasis: 'https://macher-os.de' });
    expect(leer.status).toBe(200);
    expect((await leer.json()).fehler).toBe('Kein PDF, JPG oder PNG im Anhang');
  });
});
