/**
 * POST /api/cloud/einladen – Mitarbeiter ins Team einladen.
 * Body: { mitarbeiterId, ziel: { email?, telefon? } }. Nur Chef und Büro.
 * Legt eine Einladung an (14 Tage gültig) und schickt den Link `/os/beitreten/<token>` per SMS oder E-Mail.
 * Ist der Kanal nicht verbunden, kommt `{ status: 'fehler', link }` zurück – der Browser teilt den Link dann selbst.
 */
import { angemeldetesMitglied, appUrl, body, fehler, istEmail, json, neuesToken, nichtVerbunden, objektLesen, rest, supabaseKonfig } from '@/server/cloud/lib';
import { emailSenden, emailVerbunden, smsSenden, smsVerbunden } from '@/server/cloud/versand';

const ROLLEN = ['chef', 'buero', 'monteur', 'azubi'];

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const b = await body<{ mitarbeiterId?: string; ziel?: { email?: string; telefon?: string } }>(req);
  const email = b?.ziel?.email?.trim();
  const telefon = b?.ziel?.telefon?.trim();
  if (!b?.mitarbeiterId || (!email && !telefon)) return fehler(400, 'Mitarbeiter und Handynummer oder E-Mail fehlen.');
  if (email && !istEmail(email)) return fehler(400, 'Die E-Mail-Adresse stimmt nicht.');

  const wer = await angemeldetesMitglied(req, k, ['chef', 'buero']);
  if (wer instanceof Response) return wer;
  const betriebId = wer.mitglied.betrieb_id;
  const [mitarbeiter, betrieb] = await Promise.all([
    objektLesen<{ vorname?: string; name?: string; rolle?: string }>(k, betriebId, 'mitarbeiter', b.mitarbeiterId),
    objektLesen<{ name?: string; email?: string }>(k, betriebId, 'betrieb', 'betrieb'),
  ]);
  const rolle = mitarbeiter?.rolle && ROLLEN.includes(mitarbeiter.rolle) ? mitarbeiter.rolle : 'monteur';
  // Niemand macht sich per Einladung zu mehr als er selbst ist
  const erlaubteRolle = rolle === 'chef' && wer.mitglied.rolle !== 'chef' ? 'buero' : rolle;

  const token = neuesToken();
  await rest(k, 'einladungen', {
    method: 'POST',
    prefer: 'return=minimal',
    body: [{ token, betrieb_id: betriebId, mitarbeiter_id: b.mitarbeiterId, rolle: erlaubteRolle, ziel: telefon ?? email, eingeladen_von: wer.nutzer.id }],
  });

  const link = `${appUrl(req)}/os/beitreten/${token}`;
  const betriebName = betrieb?.name ?? 'Dein Betrieb';
  const vorname = mitarbeiter?.vorname ?? mitarbeiter?.name?.split(' ')[0];
  const text = `${vorname ? `Hallo ${vorname}, ` : ''}${betriebName} arbeitet mit Handwerk OS. Tippe auf den Link, melde dich mit deiner Handynummer an und du siehst deine Einsätze:`;

  try {
    if (telefon) {
      if (!smsVerbunden()) return json(200, { status: 'fehler', fehler: 'SMS ist noch nicht verbunden.', link, id: token });
      const r = await smsSenden(telefon, `${text}\n${link}`);
      return json(200, { status: 'gesendet', id: r.id ?? token, link });
    }
    if (!emailVerbunden()) return json(200, { status: 'fehler', fehler: 'E-Mail ist noch nicht verbunden.', link, id: token });
    await emailSenden({
      an: email!,
      betreff: `Einladung von ${betriebName}`,
      text: `${text.replace(/ mit deiner Handynummer/, '')}`,
      link,
      linkText: 'Einladung annehmen',
      absenderName: betriebName,
      antwortAn: betrieb?.email && istEmail(betrieb.email) ? betrieb.email : undefined,
    });
    return json(200, { status: 'gesendet', id: token, link });
  } catch (e) {
    return json(502, { status: 'fehler', fehler: e instanceof Error ? e.message : 'Einladung nicht verschickt', link, id: token });
  }
}
