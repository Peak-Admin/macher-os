/**
 * POST /api/cloud/senden – echte E-Mail oder SMS im Namen des Betriebs.
 * Body: { versand: Versand } (siehe src/core/cloud.ts). Antwort: VersandErgebnis.
 * Enthält der Versand einen Link, wird er durch einen Öffnen-Link ersetzt (`/api/cloud/oeffnen?v=…`),
 * damit der Betrieb sieht, dass der Kunde geöffnet hat.
 */
import { angemeldetesMitglied, appUrl, body, fehler, istEmail, json, neueId, nichtVerbunden, objektLesen, rest, supabaseKonfig } from './_lib.js';
import { emailSenden, emailVerbunden, smsSenden, smsVerbunden, type Anhang } from './_versand.js';

interface Versand {
  an: string;
  kanal: 'email' | 'sms' | 'whatsapp';
  betreff?: string;
  text: string;
  link?: string;
  anhaenge?: Anhang[];
  bezug?: { typ: string; id: string };
}

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const b = await body<{ versand?: Versand }>(req);
  const v = b?.versand;
  if (!v?.an || !v.text || !v.kanal) return fehler(400, 'Empfänger, Kanal und Text fehlen.');
  if (v.kanal === 'whatsapp') return nichtVerbunden('whatsapp');
  if (v.kanal === 'email' && !emailVerbunden()) return nichtVerbunden('email');
  if (v.kanal === 'sms' && !smsVerbunden()) return nichtVerbunden('sms');
  if (v.kanal === 'email' && !istEmail(v.an)) return fehler(400, 'Die E-Mail-Adresse stimmt nicht.');
  if (v.link && !/^https?:\/\//.test(v.link)) return fehler(400, 'Der Link muss mit https:// beginnen.');
  if (v.text.length > 20_000) return fehler(400, 'Der Text ist zu lang.');

  const wer = await angemeldetesMitglied(req, k);
  if (wer instanceof Response) return wer;
  const betriebId = wer.mitglied.betrieb_id;
  const betrieb = await objektLesen<{ name?: string; email?: string }>(k, betriebId, 'betrieb', 'betrieb');

  const id = neueId('v');
  const link = v.link ? `${appUrl(req)}/api/cloud/oeffnen?v=${encodeURIComponent(id)}` : undefined;
  // zuerst vermerken, damit der Öffnen-Link sofort funktioniert
  await rest(k, 'versand', {
    method: 'POST',
    prefer: 'return=minimal',
    body: [{ id, betrieb_id: betriebId, kanal: v.kanal, an: v.an, bezug: v.bezug ?? null, ziel_link: v.link ?? null, status: 'wird_gesendet' }],
  });
  let anbieterId: string | undefined;
  try {
    if (v.kanal === 'email') {
      const r = await emailSenden({
        an: v.an,
        betreff: v.betreff ?? `Nachricht von ${betrieb?.name ?? 'deinem Handwerksbetrieb'}`,
        text: v.text,
        link,
        absenderName: betrieb?.name ?? 'Macher OS',
        antwortAn: betrieb?.email && istEmail(betrieb.email) ? betrieb.email : undefined,
        anhaenge: v.anhaenge,
      });
      anbieterId = r.id;
    } else {
      const r = await smsSenden(v.an, [v.text, link].filter(Boolean).join('\n'));
      anbieterId = r.id;
    }
  } catch (e) {
    await rest(k, `versand?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'fehler' } }).catch(() => {});
    return json(502, { status: 'fehler', fehler: e instanceof Error ? e.message : 'Versand fehlgeschlagen' });
  }
  await rest(k, `versand?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: { status: 'gesendet', anbieter_id: anbieterId ?? null },
  }).catch((e) => console.error('Versandstatus nicht gespeichert', e));

  return json(200, { status: 'gesendet', id });
}
