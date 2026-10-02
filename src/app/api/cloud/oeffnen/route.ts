/**
 * GET /api/cloud/oeffnen?v=<versand-id> – Öffnen-Link aus E-Mail/SMS.
 * Vermerkt beim ersten Öffnen „Kunde hat geöffnet“ (Versand-Status + Zeitstrahl-Eintrag `portal.geoeffnet`,
 * der per Realtime auf allen Geräten des Betriebs als Event ankommt) und leitet zum eigentlichen Link weiter.
 */
import { appUrl, ereignisSchreiben, objektLesen, rest, supabaseKonfig } from '@/server/cloud/lib';

interface VersandZeile {
  id: string;
  betrieb_id: string;
  kanal: string;
  bezug: { typ: string; id: string } | null;
  ziel_link: string | null;
  geoeffnet_am: string | null;
}

const weiter = (ziel: string) => new Response(null, { status: 302, headers: { location: ziel, 'cache-control': 'no-store' } });

export async function GET(req: Request): Promise<Response> {
  const start = appUrl(req);
  const k = supabaseKonfig();
  const id = new URL(req.url).searchParams.get('v');
  if (!k || !id) return weiter(start);
  let v: VersandZeile | undefined;
  try {
    v = (await rest<VersandZeile[]>(k, `versand?id=eq.${encodeURIComponent(id)}&select=*`))[0];
  } catch (e) {
    console.error(e);
  }
  if (!v) return weiter(start);
  const ziel = v.ziel_link && /^https?:\/\//.test(v.ziel_link) ? v.ziel_link : start;
  if (!v.geoeffnet_am) {
    try {
      // nur der erste Aufruf setzt den Zeitpunkt (Bedingung im Filter)
      const neu = await rest<VersandZeile[]>(k, `versand?id=eq.${encodeURIComponent(id)}&geoeffnet_am=is.null`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: { geoeffnet_am: new Date().toISOString(), status: 'geoeffnet' },
      });
      if (neu.length && v.bezug) {
        const obj = await objektLesen<{ kundeId?: string }>(k, v.betrieb_id, v.bezug.typ, v.bezug.id);
        await ereignisSchreiben(k, v.betrieb_id, {
          typ: 'portal.geoeffnet',
          bezug: v.bezug,
          text: v.kanal === 'sms' ? 'Kunde hat den Link aus der SMS geöffnet' : 'Kunde hat den Link aus der E-Mail geöffnet',
          daten: { kundeId: obj?.kundeId, bezug: v.bezug, kanal: v.kanal, versandId: v.id },
        });
      }
    } catch (e) {
      console.error('Öffnen nicht vermerkt', e);
    }
  }
  return weiter(ziel);
}
