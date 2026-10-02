/**
 * /api/senden – E-Mails an Kunden über Resend (Angebote, Rechnungen).
 *
 * GET  → { email: boolean }   ist der Versand eingerichtet?
 * POST → Versand aus `src/os/core/cloud.ts` (an, kanal, betreff, text, html, link, anhaenge, absender) → { id }
 *
 * Umgebungsvariablen (Vercel → Projekt macher-os → Settings → Environment Variables):
 *   RESEND_API_KEY               Pflicht. Ohne Schlüssel antwortet die Funktion 501, der Browser öffnet das Mailprogramm.
 *   RESEND_ABSENDER              z. B. "angebote@deine-domain.de" (Domain in Resend bestätigen). Ohne: onboarding@resend.dev –
 *                                damit stellt Resend nur an die eigene Konto-Adresse zu (gut für die Demo).
 *   RESEND_ERLAUBTE_EMPFAENGER   optional, Komma-Liste von Adressen oder "@domain.de" – nur an diese wird gesendet.
 *
 * Schutz, solange es noch keine Anmeldung gibt: nur Aufrufe von derselben Seite (Origin), Mengenbegrenzung je IP,
 * Größenlimits, nur E-Mail. Für echten Betrieb gehört der Versand hinter die Anmeldung (Paket Fundament).
 */
const RESEND = 'https://api.resend.com/emails';
const STANDARD_ABSENDER = 'onboarding@resend.dev';
const LIMIT_JE_STUNDE = 30;
const MAX_ANHANG_BYTES = 2_000_000;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const zaehler = new Map<string, { anzahl: number; seit: number }>();
function zuViele(ip: string): boolean {
  const jetzt = Date.now();
  const z = zaehler.get(ip);
  if (!z || jetzt - z.seit > 3_600_000) {
    zaehler.set(ip, { anzahl: 1, seit: jetzt });
    return false;
  }
  z.anzahl++;
  return z.anzahl > LIMIT_JE_STUNDE;
}

const istEmail = (s: unknown): s is string => typeof s === 'string' && s.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s);
const sauber = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '');

function erlaubt(an: string): boolean {
  const liste = (process.env.RESEND_ERLAUBTE_EMPFAENGER ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (!liste.length) return true;
  const a = an.toLowerCase();
  return liste.some((e) => (e.startsWith('@') ? a.endsWith(e) : a === e));
}

/** Data-URL → Base64-Anhang für Resend; URLs werden als `path` übergeben */
function anhang(x: { name?: unknown; url?: unknown }): { filename: string; content?: string; path?: string } | undefined {
  const name = sauber(x.name, 120);
  const url = typeof x.url === 'string' ? x.url : '';
  if (!name || !url) return undefined;
  if (url.startsWith('https://')) return { filename: name, path: url };
  const m = /^data:([^;,]*)(;charset=[^;,]*)?(;base64)?,([\s\S]*)$/.exec(url);
  if (!m) return undefined;
  const content = m[3] ? m[4] : Buffer.from(decodeURIComponent(m[4]), 'utf8').toString('base64');
  if (content.length * 0.75 > MAX_ANHANG_BYTES) return undefined;
  return { filename: name, content };
}

export function GET() {
  return json(200, { email: !!process.env.RESEND_API_KEY });
}

export async function POST(req: Request): Promise<Response> {
  const schluessel = process.env.RESEND_API_KEY;
  if (!schluessel) return json(501, { fehler: 'nicht verbunden' });

  // nur von der eigenen Seite
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return json(403, { fehler: 'Nicht erlaubt' });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unbekannt';
  if (zuViele(ip)) return json(429, { fehler: 'Zu viele E-Mails in kurzer Zeit. Bitte später erneut versuchen.' });

  const roh = await req.text();
  if (roh.length > 3_000_000) return json(413, { fehler: 'Zu groß' });
  let v: { an?: unknown; kanal?: unknown; betreff?: unknown; text?: unknown; html?: unknown; link?: unknown; anhaenge?: unknown; absender?: { name?: unknown; antwortAn?: unknown } };
  try {
    v = JSON.parse(roh);
  } catch {
    return json(400, { fehler: 'Ungültige Anfrage' });
  }
  if (v.kanal !== 'email') return json(501, { fehler: 'Nur E-Mail ist eingerichtet' });
  const an = sauber(v.an, 254);
  if (!istEmail(an)) return json(400, { fehler: 'Ungültige E-Mail-Adresse' });
  if (!erlaubt(an)) return json(403, { fehler: 'Diese Adresse ist für den Demo-Versand nicht freigegeben.' });

  const text = typeof v.text === 'string' ? v.text.slice(0, 20_000) : '';
  const link = typeof v.link === 'string' && /^https?:\/\//.test(v.link) ? v.link.slice(0, 500) : '';
  const html = typeof v.html === 'string' ? v.html.slice(0, 200_000) : undefined;
  const name = sauber(v.absender?.name, 80).replace(/[<>"]/g, '') || 'Macher OS';
  const antwortAn = sauber(v.absender?.antwortAn, 254);
  const adresse = (process.env.RESEND_ABSENDER ?? STANDARD_ABSENDER).replace(/^.*<([^>]+)>.*$/, '$1').trim();
  const anhaenge = Array.isArray(v.anhaenge) ? v.anhaenge.slice(0, 5).map(anhang).filter(Boolean) : [];

  const antwort = await fetch(RESEND, {
    method: 'POST',
    headers: { authorization: `Bearer ${schluessel}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: `${name} <${adresse}>`,
      to: [an],
      subject: sauber(v.betreff, 200) || `Nachricht von ${name}`,
      text: [text, link].filter(Boolean).join('\n\n'),
      ...(html ? { html } : {}),
      ...(istEmail(antwortAn) ? { reply_to: antwortAn } : {}),
      ...(anhaenge.length ? { attachments: anhaenge } : {}),
    }),
  }).catch(() => undefined);

  if (!antwort) return json(502, { fehler: 'E-Mail-Dienst nicht erreichbar' });
  const d = (await antwort.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!antwort.ok) return json(502, { fehler: d.message ? `E-Mail-Dienst: ${d.message}` : `E-Mail-Dienst antwortet ${antwort.status}` });
  return json(200, { id: d.id });
}
