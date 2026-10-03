/**
 * POST /api/abo/checkout – Plan buchen. Kunde in Stripe = Betrieb. Der Plan ergibt sich aus der Teamgröße
 * (aktive Mitarbeiter laut `objekte`), nicht aus dem Browser.
 * - noch kein laufendes Abo → Stripe Checkout (SEPA-Lastschrift zuerst, Karte als Alternative), Antwort `{ url }`
 * - laufendes Abo → Planwechsel mit tagesgenauer Verrechnung, Antwort `{ plan }`
 * Ohne Schlüssel: 501 – die App verlängert dann nichts und bucht nichts.
 */
import { abbuchungCent, buchbar, planFuer, planKodieren, planLesen, type Intervall, type Plan } from '@modules/abo/regeln';
import { betriebLesen, betriebSetzen, env, fehler, json, koerper, laufendesAbo, nichtVerbunden, personenZaehlen, stripe, verbunden, zugang } from '../_lib/gemeinsam';

/** Stripe-Preis je Plan, Zahlweise und Betrag – wird beim ersten Mal angelegt (eine Quelle: plaene.ts) */
async function preisId(plan: Plan, intervall: Intervall): Promise<string> {
  const cent = abbuchungCent(plan, intervall)!;
  const schluessel = `macher-os-${plan.id}-${intervall}-${cent}`;
  const vorhanden = await stripe<{ data: { id: string }[] }>('prices', { lookup_keys: [schluessel], active: true, limit: 1 }, 'GET');
  if (vorhanden.data[0]) return vorhanden.data[0].id;
  const neu = await stripe<{ id: string }>('prices', {
    currency: 'eur',
    unit_amount: cent,
    tax_behavior: 'exclusive',
    lookup_key: schluessel,
    recurring: { interval: intervall === 'jahr' ? 'year' : 'month' },
    product_data: { name: `Handwerk OS ${plan.name}`, metadata: { plan: plan.id } },
    metadata: { plan: plan.id },
  });
  return neu.id;
}

export async function POST(req: Request): Promise<Response> {
  if (!verbunden()) return nichtVerbunden();
  try {
    const body = await koerper<{ betriebId: string; intervall: Intervall }>(req);
    const z = await zugang(req, body.betriebId, true);
    if (z instanceof Response) return z;
    const b = await betriebLesen(z.betriebId);
    if (!b) return fehler('Betrieb nicht gefunden.', 404);

    const plan = planFuer(await personenZaehlen(b.id));
    if (!buchbar(plan)) return fehler('Für mehr als 30 Leute machen wir dir ein persönliches Angebot. Schreib uns über die Website unter „Kontakt“.', 409);
    const intervall: Intervall = body.intervall === 'jahr' ? 'jahr' : 'monat';

    let kunde = b.stripe_kunde ?? undefined;
    if (!kunde) {
      const k = await stripe<{ id: string }>('customers', { name: b.name ?? 'Betrieb', email: z.email, preferred_locales: ['de'], metadata: { betrieb_id: b.id } });
      kunde = k.id;
      await betriebSetzen(b.id, { stripe_kunde: kunde });
    }

    // Laufendes Abo: Plan wechseln (die App hat vorher gefragt), Zahlweise bleibt
    const abo = await laufendesAbo(kunde);
    if (abo) {
      const posten = abo.items.data[0];
      const bisher = posten.price.recurring?.interval === 'year' ? 'jahr' : 'monat';
      await stripe(`subscriptions/${abo.id}`, {
        items: [{ id: posten.id, price: await preisId(plan, bisher) }],
        proration_behavior: 'create_prorations',
        metadata: { betrieb_id: b.id, plan: plan.id },
      });
      const alt = planLesen(b.plan);
      const neu = alt.status ? planKodieren(plan.id, alt.status, alt.datum) : planKodieren(plan.id);
      await betriebSetzen(b.id, { plan: neu });
      return json({ plan: neu });
    }

    const herkunft = new URL(req.url).origin;
    const sitzung = await stripe<{ url: string }>('checkout/sessions', {
      mode: 'subscription',
      customer: kunde,
      client_reference_id: b.id,
      locale: 'de',
      // SEPA-Lastschrift zuerst, Karte als Alternative
      payment_method_types: ['sepa_debit', 'card'],
      line_items: [{ price: await preisId(plan, intervall), quantity: 1 }],
      billing_address_collection: 'required',
      customer_update: { address: 'auto', name: 'auto' },
      tax_id_collection: { enabled: true },
      automatic_tax: env('STRIPE_AUTOMATISCHE_STEUER') === '1' ? { enabled: true } : undefined,
      subscription_data: { metadata: { betrieb_id: b.id, plan: plan.id } },
      metadata: { betrieb_id: b.id, plan: plan.id },
      success_url: `${herkunft}/os/betrieb/abo?bezahlt=1`,
      cancel_url: `${herkunft}/os/betrieb/abo?abgebrochen=1`,
    });
    return json({ url: sitzung.url });
  } catch (e) {
    console.error('abo/checkout', e);
    return fehler('Bezahlen konnte gerade nicht gestartet werden. Versuch es gleich noch einmal – es wurde nichts gebucht.', 502);
  }
}
