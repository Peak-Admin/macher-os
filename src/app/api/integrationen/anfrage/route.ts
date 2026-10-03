/**
 * /api/integrationen/anfrage – „Verbinden“ einer Integration, die Handwerk OS noch nicht hat, wird direkt aus der App
 * als Anfrage an das Integrationsteam geschickt (Resend). Bauplan: `docs/os/INTEGRATIONEN.md`.
 *
 * POST { integration, notiz?, betrieb?: { name?, email?, telefon? } } → { id }
 *
 * Der Empfänger ist fest (INTEGRATION_ANFRAGE_AN, Standard partner@macher-os.de) – über diese Route lässt sich keine
 * beliebige Adresse anschreiben. Ohne RESEND_API_KEY antwortet sie 501; die App öffnet dann das Mail-Programm.
 * Schutz wie bei /api/senden: nur von derselben Seite (Origin), Mengenbegrenzung je IP, Größenlimits.
 */
const RESEND = 'https://api.resend.com/emails';
const STANDARD_AN = 'partner@macher-os.de';
const STANDARD_ABSENDER = 'onboarding@resend.dev';
const LIMIT_JE_STUNDE = 10;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
const istEmail = (s: unknown): s is string => typeof s === 'string' && s.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s);
const zeile = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '');

const zaehler = new Map<string, { anzahl: number; seit: number }>();
function zuViele(ip: string): boolean {
  const jetzt = Date.now();
  const z = zaehler.get(ip);
  if (!z || jetzt - z.seit > 3_600_000) {
    zaehler.set(ip, { anzahl: 1, seit: jetzt });
    return false;
  }
  return ++z.anzahl > LIMIT_JE_STUNDE;
}

export async function POST(req: Request): Promise<Response> {
  const schluessel = process.env.RESEND_API_KEY;
  if (!schluessel) return json(501, { fehler: 'nicht verbunden' });

  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return json(403, { fehler: 'Nicht erlaubt' });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unbekannt';
  if (zuViele(ip)) return json(429, { fehler: 'Zu viele Anfragen in kurzer Zeit. Bitte später erneut versuchen.' });

  const roh = await req.text();
  if (roh.length > 10_000) return json(413, { fehler: 'Zu groß' });
  let v: { integration?: unknown; notiz?: unknown; betrieb?: { name?: unknown; email?: unknown; telefon?: unknown } };
  try {
    v = JSON.parse(roh);
  } catch {
    return json(400, { fehler: 'Ungültige Anfrage' });
  }
  const integration = zeile(v.integration, 120);
  if (!integration) return json(400, { fehler: 'Welche Integration?' });
  const notiz = typeof v.notiz === 'string' ? v.notiz.trim().slice(0, 2_000) : '';
  const betrieb = zeile(v.betrieb?.name, 120);
  const email = zeile(v.betrieb?.email, 254);
  const telefon = zeile(v.betrieb?.telefon, 60);

  const text = [
    `Integration anfragen: ${integration}`,
    notiz ? `\nWofür: ${notiz}` : '',
    '',
    `Betrieb: ${betrieb || '–'}`,
    istEmail(email) ? `E-Mail: ${email}` : '',
    telefon ? `Telefon: ${telefon}` : '',
    '',
    'Gesendet aus Handwerk OS (Betrieb → Verbindungen).',
  ]
    .filter((z, i, a) => z !== '' || a[i - 1] !== '')
    .join('\n');

  const an = process.env.INTEGRATION_ANFRAGE_AN ?? STANDARD_AN;
  const adresse = (process.env.RESEND_ABSENDER ?? STANDARD_ABSENDER).replace(/^.*<([^>]+)>.*$/, '$1').trim();
  const antwort = await fetch(RESEND, {
    method: 'POST',
    headers: { authorization: `Bearer ${schluessel}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: `Handwerk OS <${adresse}>`,
      to: [an],
      subject: `Integration anfragen: ${integration}${betrieb ? ` – ${betrieb}` : ''}`,
      text,
      ...(istEmail(email) ? { reply_to: email } : {}),
    }),
  }).catch(() => undefined);

  if (!antwort) return json(502, { fehler: 'E-Mail-Dienst nicht erreichbar' });
  const d = (await antwort.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!antwort.ok) return json(502, { fehler: d.message ? `E-Mail-Dienst: ${d.message}` : `E-Mail-Dienst antwortet ${antwort.status}` });
  return json(200, { id: d.id });
}
