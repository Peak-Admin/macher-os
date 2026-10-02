/**
 * Anbieter für echten Versand – nur über `fetch`, Schlüssel aus der Umgebung.
 * E-Mail: Resend (https://resend.com). SMS: beliebiger Anbieter mit HTTP-Schnittstelle, Standard seven.io.
 */
import { env, htmlSicher, telefonNormal } from './lib';

export interface Anhang {
  name: string;
  url: string;
  mime?: string;
}

export interface EmailAuftrag {
  an: string;
  betreff: string;
  text: string;
  /** Knopf-Link in der E-Mail (bereits mit Tracking) */
  link?: string;
  linkText?: string;
  absenderName: string;
  antwortAn?: string;
  anhaenge?: Anhang[];
}

export const emailVerbunden = () => !!env('RESEND_API_KEY');
export const smsVerbunden = () => !!env('SMS_API_KEY');

function anhangFuerResend(a: Anhang): { filename: string; content?: string; path?: string } | undefined {
  const daten = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(a.url);
  if (daten) {
    const inhalt = daten[2] ? daten[3] : Buffer.from(decodeURIComponent(daten[3])).toString('base64');
    return { filename: a.name, content: inhalt };
  }
  if (/^https:\/\//.test(a.url)) return { filename: a.name, path: a.url };
  return undefined;
}

export function emailHtml(e: Pick<EmailAuftrag, 'text' | 'link' | 'linkText' | 'absenderName'>): string {
  const absaetze = e.text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${htmlSicher(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const knopf = e.link
    ? `<p style="margin:24px 0"><a href="${htmlSicher(e.link)}" style="background:#2F9250;color:#ffffff;font-weight:700;font-size:19px;text-decoration:none;padding:12px 24px;border-radius:4px;display:inline-block">${htmlSicher(e.linkText ?? 'Jetzt ansehen')}</a></p>`
    : '';
  return `<!doctype html><html lang="de"><body style="margin:0;background:#F7FAFB"><div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Barlow,Arial,sans-serif;font-size:17px;line-height:1.5;color:#374040;background:#ffffff">${absaetze}${knopf}<p style="margin:32px 0 0;font-size:14px;color:#5b6666">${htmlSicher(e.absenderName)}</p></div></body></html>`;
}

/** Sendet eine E-Mail über Resend. Absender = Name des Betriebs, Antwort an den Betrieb. */
export async function emailSenden(e: EmailAuftrag): Promise<{ id?: string }> {
  const key = env('RESEND_API_KEY');
  if (!key) throw new Error('E-Mail nicht verbunden');
  const absender = env('EMAIL_ABSENDER') ?? 'post@macher-os.de';
  const name = e.absenderName.replace(/["<>]/g, '').trim() || 'Macher OS';
  const text = [e.text, e.link].filter(Boolean).join('\n\n');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: `${name} <${absender}>`,
      to: [e.an],
      subject: e.betreff,
      text,
      html: emailHtml(e),
      ...(e.antwortAn ? { reply_to: e.antwortAn } : {}),
      ...(e.anhaenge?.length ? { attachments: e.anhaenge.map(anhangFuerResend).filter(Boolean) } : {}),
    }),
  });
  if (!r.ok) throw new Error(`E-Mail-Versand fehlgeschlagen (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as { id?: string };
}

/**
 * Sendet eine SMS über einen HTTP-Anbieter.
 * Standard ist seven.io (`POST https://gateway.seven.io/api/sms`, Kopfzeile `X-Api-Key`, JSON `{ to, from, text }`).
 * Andere Anbieter: `SMS_API_URL`, `SMS_API_HEADER` (Name der Schlüssel-Kopfzeile, z. B. `Authorization`)
 * und `SMS_API_PRAEFIX` (z. B. `Bearer `) setzen.
 */
export async function smsSenden(an: string, text: string): Promise<{ id?: string }> {
  const key = env('SMS_API_KEY');
  if (!key) throw new Error('SMS nicht verbunden');
  const url = env('SMS_API_URL') ?? 'https://gateway.seven.io/api/sms';
  const kopf = env('SMS_API_HEADER') ?? 'X-Api-Key';
  const praefix = process.env.SMS_API_PRAEFIX ?? '';
  const r = await fetch(url, {
    method: 'POST',
    headers: { [kopf]: `${praefix}${key}`, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ to: telefonNormal(an), from: env('SMS_ABSENDER') ?? 'MacherOS', text }),
  });
  if (!r.ok) throw new Error(`SMS-Versand fehlgeschlagen (${r.status}): ${(await r.text()).slice(0, 200)}`);
  const antwort = (await r.json().catch(() => ({}))) as { id?: string | number; messages?: { id?: string | number }[] };
  const id = antwort.id ?? antwort.messages?.[0]?.id;
  return { id: id == null ? undefined : String(id) };
}
