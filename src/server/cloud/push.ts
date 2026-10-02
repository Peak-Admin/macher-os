/**
 * Web-Push (VAPID) an Mitarbeiter – auch für andere Server-Funktionen (z. B. Takte/Cron) nutzbar:
 * `import { pushAnMitarbeiter } from '@/server/cloud/push'`.
 * Hat ein Mitarbeiter kein Gerät mit Benachrichtigungen, geht die Nachricht als E-Mail raus (falls verbunden).
 */
import webpush from 'web-push';
import { env, rest, type SupabaseKonfig } from './lib';
import { emailSenden, emailVerbunden } from './versand';

export interface PushNachricht {
  anMitarbeiterId: string;
  titel: string;
  text?: string;
  pfad?: string;
  aktionen?: { aktion: string; label: string; payload?: unknown }[];
}

export const pushVerbunden = () => !!(env('VAPID_PUBLIC_KEY') ?? env('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) && !!env('VAPID_PRIVATE_KEY');

interface Abo {
  nutzer_id: string;
  abo: webpush.PushSubscription;
}

/** Ergebnis: Anzahl erreichter Geräte und ob als E-Mail ausgewichen wurde */
export async function pushAnMitarbeiter(
  k: SupabaseKonfig,
  betriebId: string,
  n: PushNachricht,
  sender: Pick<typeof webpush, 'sendNotification'> = webpush,
): Promise<{ geraete: number; email: boolean }> {
  const mitglieder = await rest<{ nutzer_id: string }[]>(
    k,
    `mitglieder?betrieb_id=eq.${betriebId}&mitarbeiter_id=eq.${encodeURIComponent(n.anMitarbeiterId)}&select=nutzer_id`,
  );
  if (!mitglieder.length) return { geraete: 0, email: false };
  const ids = mitglieder.map((m) => m.nutzer_id).join(',');
  const abos = await rest<Abo[]>(k, `push_abos?nutzer_id=in.(${ids})&select=nutzer_id,abo`);
  const nutzlast = JSON.stringify({ titel: n.titel, text: n.text, pfad: n.pfad, aktionen: n.aktionen });
  let geraete = 0;
  if (abos.length && pushVerbunden()) {
    const vapid = {
      subject: env('VAPID_SUBJECT') ?? 'mailto:post@macher-os.de',
      publicKey: (env('VAPID_PUBLIC_KEY') ?? env('NEXT_PUBLIC_VAPID_PUBLIC_KEY'))!,
      privateKey: env('VAPID_PRIVATE_KEY')!,
    };
    await Promise.all(
      abos.map(async (a) => {
        try {
          await sender.sendNotification(a.abo, nutzlast, { vapidDetails: vapid, TTL: 60 * 60 * 24, urgency: 'normal' });
          geraete++;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          // Gerät abgemeldet → Abo entfernen
          if (status === 404 || status === 410) {
            await rest(k, `push_abos?nutzer_id=eq.${a.nutzer_id}&abo->>endpoint=eq.${encodeURIComponent(a.abo.endpoint)}`, { method: 'DELETE' }).catch(() => {});
          } else console.error('Push fehlgeschlagen', status, e);
        }
      }),
    );
  }
  if (geraete > 0 || !emailVerbunden()) return { geraete, email: false };
  // Rückfall E-Mail
  for (const m of mitglieder) {
    const r = await fetch(`${k.url}/auth/v1/admin/users/${m.nutzer_id}`, { headers: { apikey: k.serviceKey, authorization: `Bearer ${k.serviceKey}` } });
    if (!r.ok) continue;
    const u = (await r.json()) as { email?: string };
    if (!u.email) continue;
    const basis = env('APP_URL');
    await emailSenden({
      an: u.email,
      betreff: n.titel,
      text: n.text ?? n.titel,
      link: basis && n.pfad ? `${basis.replace(/\/$/, '')}/os${n.pfad}` : undefined,
      linkText: 'In Macher OS öffnen',
      absenderName: 'Macher OS',
    });
    return { geraete: 0, email: true };
  }
  return { geraete: 0, email: false };
}
