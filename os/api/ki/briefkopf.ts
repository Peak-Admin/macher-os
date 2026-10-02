/**
 * Server-Funktion (Vercel, Node): Briefkopf aus einem Foto (alte Rechnung, Briefbogen) oder einer
 * Website (Impressum) erkennen. Ruft die Claude-API per `fetch` auf; der Schlüssel `ANTHROPIC_API_KEY`
 * bleibt auf dem Server. Ohne Schlüssel: `501 { fehler: "nicht verbunden" }` – der Browser zeigt dann
 * die vier Felder zum Ausfüllen.
 *
 * Das Ergebnis ist ein ENTWURF: Der Mensch bestätigt im Setup, erst dann wird übernommen.
 *
 * POST /api/ki/briefkopf
 *   { bild: { daten: base64, mime: "image/jpeg" } }  oder  { website: "elektro-meier.de" }
 * → 200 { briefkopf: BriefkopfErkannt }
 */

export interface BriefkopfErkannt {
  name: string;
  inhaber: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  website: string;
  steuernummer: string;
  ustId: string;
  iban: string;
  bic: string;
  /** Zahlungsziel in Tagen, 0 = nicht erkannt */
  zahlungszielTage: number;
  /** Stundensatz netto in Euro, 0 = nicht erkannt */
  stundensatz: number;
  /** Logo-Ausschnitt im Foto, relativ (0–1); nur bei Fotos */
  logo: { gefunden: boolean; x: number; y: number; breite: number; hoehe: number };
}

export interface KiUmgebung {
  apiKey?: string;
  fetch?: typeof fetch;
}

export class KiFehler extends Error {
  status: number;
  constructor(status: number, nachricht: string) {
    super(nachricht);
    this.status = status;
  }
}

export const KI_MODELL = 'claude-opus-5-5';
const API_URL = 'https://api.anthropic.com/v1/messages';
/** Bilder größer als ~4 MB (base64) lehnen wir ab – der Browser verkleinert vorher. */
export const MAX_BASE64 = 5_500_000;
const BILD_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type Inhalt =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } };

/** Schlüssel aus der Umgebung lesen, ohne Node-Typen vorauszusetzen */
export function umgebungsSchluessel(): string | undefined {
  const p = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
  return p?.env?.ANTHROPIC_API_KEY || undefined;
}

/**
 * Ein Aufruf der Claude-API mit strukturierter Ausgabe (JSON-Schema). Gibt das geparste JSON zurück.
 * Ablehnungen und abgeschnittene Antworten werden als verständlicher Fehler gemeldet.
 */
export async function claudeJson<T>(inhalt: Inhalt[], system: string, schema: object, env: KiUmgebung): Promise<T> {
  if (!env.apiKey) throw new KiFehler(501, 'nicht verbunden');
  const f = env.fetch ?? fetch;
  const antwort = await f(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: KI_MODELL,
      max_tokens: 16000,
      fallbacks: 'default',
      system,
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: inhalt }],
    }),
  });
  if (!antwort.ok) {
    const text = await antwort.text().catch(() => '');
    console.error('Claude-API', antwort.status, text.slice(0, 500));
    throw new KiFehler(antwort.status === 429 ? 429 : 502, antwort.status === 429 ? 'Gerade sind zu viele Anfragen unterwegs. Versuche es in einer Minute erneut.' : 'Die Erkennung ist gerade nicht erreichbar.');
  }
  const daten = (await antwort.json()) as { stop_reason?: string; content?: { type: string; text?: string }[] };
  if (daten.stop_reason === 'refusal') throw new KiFehler(422, 'Das Dokument konnte nicht gelesen werden.');
  if (daten.stop_reason === 'max_tokens') throw new KiFehler(422, 'Das Dokument ist zu lang für einen Durchgang.');
  const text = (daten.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new KiFehler(502, 'Die Antwort der Erkennung war unvollständig.');
  }
}

/** Datei-Eingabe prüfen (Bild oder PDF als base64) */
export function dateiInhalt(d: unknown, pdfErlaubt: boolean): Inhalt {
  const x = d as { daten?: unknown; mime?: unknown } | undefined;
  const daten = typeof x?.daten === 'string' ? x.daten.replace(/^data:[^,]*,/, '').replace(/\s/g, '') : '';
  const mime = typeof x?.mime === 'string' ? x.mime : '';
  if (!daten) throw new KiFehler(400, 'Es wurde keine Datei mitgeschickt.');
  if (daten.length > MAX_BASE64) throw new KiFehler(413, 'Die Datei ist zu groß. Nimm ein kleineres Foto oder eine kürzere PDF.');
  if (pdfErlaubt && mime === 'application/pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: daten } };
  if (!BILD_MIMES.includes(mime)) throw new KiFehler(415, pdfErlaubt ? 'Bitte ein Foto (JPG, PNG) oder eine PDF schicken.' : 'Bitte ein Foto (JPG oder PNG) schicken.');
  return { type: 'image', source: { type: 'base64', media_type: mime, data: daten } };
}

// ------------------------------------------------------------------ Website lesen

/** Adresse normalisieren; nur http(s) und öffentliche Hostnamen (kein localhost, keine IPs) */
export function websiteUrl(eingabe: string): URL {
  let t = eingabe.trim();
  if (!/^https?:\/\//i.test(t)) t = 'https://' + t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    throw new KiFehler(400, 'Das sieht nicht wie eine Website-Adresse aus.');
  }
  const host = u.hostname.toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal'))
    throw new KiFehler(400, 'Das sieht nicht wie eine Website-Adresse aus.');
  return u;
}

/** HTML auf lesbaren Text reduzieren (Skripte/Styles raus, Tags raus, Leerraum zusammenfassen) */
export function htmlText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#64;|&commat;/g, '@')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

async function seiteLesen(u: URL, f: typeof fetch): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await f(u.toString(), { headers: { 'user-agent': 'MacherOS-Einrichtung/1.0', accept: 'text/html' }, redirect: 'follow', signal: ctrl.signal });
    if (!r.ok) return '';
    const html = await r.text();
    return htmlText(html.slice(0, 600_000));
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

/** Startseite + Impressum lesen (Impressum enthält Steuernummer, Anschrift, Inhaber) */
export async function websiteText(eingabe: string, f: typeof fetch = fetch): Promise<string> {
  const u = websiteUrl(eingabe);
  const start = await seiteLesen(u, f);
  let impressum = '';
  for (const pfad of ['/impressum', '/impressum.html', '/impressum/', '/kontakt']) {
    impressum = await seiteLesen(new URL(pfad, u.origin), f);
    if (impressum) break;
  }
  const text = [impressum && `IMPRESSUM:\n${impressum}`, start && `STARTSEITE:\n${start}`].filter(Boolean).join('\n\n');
  if (!text) throw new KiFehler(422, 'Die Website konnte nicht gelesen werden. Prüfe die Adresse oder lade ein Foto hoch.');
  // Impressum steht vorn; sehr lange Seiten begrenzen wir auf die ersten 60 000 Zeichen
  return text.slice(0, 60_000);
}

// ------------------------------------------------------------------ Erkennen

const S = { type: 'string' } as const;
export const BRIEFKOPF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'inhaber', 'strasse', 'plz', 'ort', 'telefon', 'email', 'website', 'steuernummer', 'ustId', 'iban', 'bic', 'zahlungszielTage', 'stundensatz', 'logo'],
  properties: {
    name: S, inhaber: S, strasse: S, plz: S, ort: S, telefon: S, email: S, website: S,
    steuernummer: S, ustId: S, iban: S, bic: S,
    zahlungszielTage: { type: 'integer' },
    stundensatz: { type: 'number' },
    logo: {
      type: 'object',
      additionalProperties: false,
      required: ['gefunden', 'x', 'y', 'breite', 'hoehe'],
      properties: { gefunden: { type: 'boolean' }, x: { type: 'number' }, y: { type: 'number' }, breite: { type: 'number' }, hoehe: { type: 'number' } },
    },
  },
};

const SYSTEM = `Du liest den Briefkopf eines deutschen Handwerksbetriebs aus – aus dem Foto einer Rechnung/eines Briefbogens oder aus dem Text einer Website (Impressum).
Gesucht sind die Daten des ABSENDERS (des Handwerksbetriebs), niemals die des Rechnungsempfängers.
Regeln:
- Nur übernehmen, was wirklich dasteht. Nichts erfinden, nichts raten. Unbekannt = leerer Text bzw. 0.
- name: Firmenname wie geschrieben (inkl. Rechtsform). inhaber: Inhaber/Geschäftsführer, falls genannt.
- strasse inkl. Hausnummer; plz fünfstellig; telefon wie geschrieben.
- steuernummer (z. B. 026 123 45678) und ustId (DE + 9 Ziffern) getrennt.
- iban ohne Leerzeichen, bic wie geschrieben.
- zahlungszielTage: z. B. "zahlbar innerhalb 14 Tagen" → 14.
- stundensatz: Netto-Stundensatz in Euro, wenn eine Position wie "Arbeitsstunde Geselle" mit Einheit Stunde erkennbar ist, sonst 0.
- logo: Bei Fotos den Bereich des Firmenlogos als Anteile der Bildbreite/-höhe (0 bis 1, x/y = linke obere Ecke). Ohne Logo oder bei Website-Text: gefunden=false und 0.`;

/** Werte säubern, damit der Browser sich auf das Format verlassen kann */
export function briefkopfBereinigen(r: Partial<BriefkopfErkannt>): BriefkopfErkannt {
  const t = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const n = (v: unknown) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : 0);
  const anteil = (v: unknown) => Math.min(1, Math.max(0, typeof v === 'number' && isFinite(v) ? v : 0));
  const l = (r.logo ?? {}) as Partial<BriefkopfErkannt['logo']>;
  const logoOk = !!l.gefunden && anteil(l.breite) > 0.01 && anteil(l.hoehe) > 0.005;
  const plz = t(r.plz).replace(/\D/g, '');
  return {
    name: t(r.name),
    inhaber: t(r.inhaber),
    strasse: t(r.strasse),
    plz: plz.length === 5 ? plz : '',
    ort: t(r.ort),
    telefon: t(r.telefon),
    email: t(r.email).toLowerCase(),
    website: t(r.website),
    steuernummer: t(r.steuernummer),
    ustId: t(r.ustId).replace(/\s/g, '').toUpperCase(),
    iban: t(r.iban).replace(/\s/g, '').toUpperCase(),
    bic: t(r.bic).replace(/\s/g, '').toUpperCase(),
    zahlungszielTage: Math.round(n(r.zahlungszielTage)),
    stundensatz: Math.round(n(r.stundensatz) * 100) / 100,
    logo: logoOk ? { gefunden: true, x: anteil(l.x), y: anteil(l.y), breite: anteil(l.breite), hoehe: anteil(l.hoehe) } : { gefunden: false, x: 0, y: 0, breite: 0, hoehe: 0 },
  };
}

export async function briefkopfErkennen(eingabe: unknown, env: KiUmgebung): Promise<BriefkopfErkannt> {
  if (!env.apiKey) throw new KiFehler(501, 'nicht verbunden');
  const e = (eingabe ?? {}) as { bild?: unknown; website?: unknown };
  let inhalt: Inhalt[];
  if (typeof e.website === 'string' && e.website.trim()) {
    const text = await websiteText(e.website, env.fetch ?? fetch);
    inhalt = [{ type: 'text', text: `Website ${e.website.trim()}:\n\n${text}\n\nLies den Briefkopf des Betriebs aus.` }];
  } else if (e.bild) {
    inhalt = [dateiInhalt(e.bild, false), { type: 'text', text: 'Lies den Briefkopf des Absenders aus diesem Dokument aus.' }];
  } else throw new KiFehler(400, 'Schick ein Foto oder eine Website-Adresse.');
  const roh = await claudeJson<Partial<BriefkopfErkannt>>(inhalt, SYSTEM, BRIEFKOPF_SCHEMA, env);
  const b = briefkopfBereinigen(roh);
  if (e.website) b.logo = { gefunden: false, x: 0, y: 0, breite: 0, hoehe: 0 };
  return b;
}

export const json = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/** Gemeinsamer Ablauf für beide KI-Funktionen: Body lesen, Fehler in verständliche Antworten übersetzen */
export async function kiAntwort(req: Request, arbeit: (body: unknown, env: KiUmgebung) => Promise<unknown>): Promise<Response> {
  const apiKey = umgebungsSchluessel();
  if (!apiKey) return json(501, { fehler: 'nicht verbunden' });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { fehler: 'Die Anfrage war leer oder kein JSON.' });
  }
  try {
    return json(200, await arbeit(body, { apiKey }));
  } catch (e) {
    if (e instanceof KiFehler) return json(e.status, { fehler: e.message });
    console.error(e);
    return json(500, { fehler: 'Unerwarteter Fehler bei der Erkennung.' });
  }
}

export async function POST(req: Request): Promise<Response> {
  return kiAntwort(req, async (body, env) => ({ briefkopf: await briefkopfErkennen(body, env) }));
}
