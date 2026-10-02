/**
 * POST /api/abo/portal – Selbstbedienung:
 * - `{ aktion: 'portal' }` → Stripe-Kundenportal (Zahlungsart ändern, Rechnungen), Antwort `{ url }`
 * - `{ aktion: 'kuendigen', grund?, text? }` → zum Ende des bezahlten Zeitraums kündigen, Antwort `{ plan }`
 * - `{ aktion: 'fortsetzen' }` → Kündigung zurücknehmen, Antwort `{ plan }`
 */
import { KUENDIGUNGS_GRUENDE, planKodieren, planLesen } from '@modules/abo/regeln';
import { betriebLesen, betriebSetzen, fehler, json, koerper, laufendesAbo, letzterTag, nichtVerbunden, periodenEnde, planIdAusAbo, stripe, verbunden, zugang } from '../_lib/gemeinsam';

export async function POST(req: Request): Promise<Response> {
  if (!verbunden()) return nichtVerbunden();
  try {
    const body = await koerper<{ betriebId: string; aktion: string; grund: string; text: string }>(req);
    const z = await zugang(req, body.betriebId, true);
    if (z instanceof Response) return z;
    const b = await betriebLesen(z.betriebId);
    if (!b?.stripe_kunde) return fehler('Es gibt noch keinen gebuchten Plan.', 409);

    if (body.aktion === 'portal') {
      const s = await stripe<{ url: string }>('billing_portal/sessions', { customer: b.stripe_kunde, locale: 'de', return_url: `${new URL(req.url).origin}/os/betrieb/abo` });
      return json({ url: s.url });
    }

    const abo = await laufendesAbo(b.stripe_kunde);
    if (!abo) return fehler('Es läuft gerade kein Plan.', 409);
    const planId = planIdAusAbo(abo, planLesen(b.plan).planId);
    if (!planId) return fehler('Der Plan konnte nicht zugeordnet werden.', 409);

    if (body.aktion === 'kuendigen') {
      const grund = KUENDIGUNGS_GRUENDE.find((g) => g.wert === body.grund);
      const neu = await stripe<typeof abo>(`subscriptions/${abo.id}`, {
        cancel_at_period_end: true,
        cancellation_details: { feedback: grund?.stripe, comment: body.text?.slice(0, 500) },
      });
      const ende = periodenEnde(neu) ?? periodenEnde(abo);
      const plan = ende ? planKodieren(planId, 'gekuendigt', letzterTag(ende)) : planKodieren(planId);
      await betriebSetzen(b.id, { plan });
      return json({ plan });
    }

    if (body.aktion === 'fortsetzen') {
      await stripe(`subscriptions/${abo.id}`, { cancel_at_period_end: false });
      const plan = planKodieren(planId);
      await betriebSetzen(b.id, { plan });
      return json({ plan });
    }
    return fehler('Unbekannte Aktion.');
  } catch (e) {
    console.error('abo/portal', e);
    return fehler('Das hat gerade nicht geklappt. Versuch es gleich noch einmal.', 502);
  }
}
