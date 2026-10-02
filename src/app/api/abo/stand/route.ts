/**
 * GET /api/abo/stand – Stand des Plans für „Dein Plan“: `betriebe.plan`/`test_bis` laut Datenvertrag,
 * dazu nächste Abbuchung, Zahlungsart und Rechnungen aus Stripe. Ohne Schlüssel: 501.
 */
import { betriebLesen, fehler, json, laufendesAbo, nichtVerbunden, periodenEnde, stripe, testBisSicher, verbunden, zugang, datumAus, type StripeZahlungsart } from '../_lib/gemeinsam';

function zahlungsartText(z: StripeZahlungsart | string | null | undefined) {
  if (!z || typeof z === 'string') return undefined;
  if (z.type === 'sepa_debit') return { art: 'sepa' as const, text: `SEPA-Lastschrift · Konto endet auf ${z.sepa_debit?.last4 ?? '…'}` };
  if (z.type === 'card') return { art: 'karte' as const, text: `Karte (${z.card?.brand ?? 'Karte'}) · endet auf ${z.card?.last4 ?? '…'}` };
  return { art: 'sonstige' as const, text: 'Hinterlegte Zahlungsart' };
}

export async function GET(req: Request): Promise<Response> {
  if (!verbunden()) return nichtVerbunden();
  try {
    const z = await zugang(req, new URL(req.url).searchParams.get('betrieb') ?? undefined, false);
    if (z instanceof Response) return z;
    const b = await betriebLesen(z.betriebId);
    if (!b) return fehler('Betrieb nicht gefunden.', 404);
    const testBis = await testBisSicher(b);
    const antwort: Record<string, unknown> = { plan: b.plan ?? 'test', testBis };
    if (b.stripe_kunde) {
      const abo = await laufendesAbo(b.stripe_kunde);
      if (abo) {
        const ende = periodenEnde(abo);
        const preis = abo.items.data[0]?.price;
        antwort.naechsteAbbuchung = ende && !abo.cancel_at_period_end ? datumAus(ende) : undefined;
        antwort.betragCent = preis?.unit_amount ?? undefined;
        antwort.intervall = preis?.recurring?.interval === 'year' ? 'jahr' : 'monat';
        let zahlart = abo.default_payment_method;
        if (!zahlart) {
          const kunde = await stripe<{ invoice_settings?: { default_payment_method?: StripeZahlungsart | null } }>(`customers/${b.stripe_kunde}`, { expand: ['invoice_settings.default_payment_method'] }, 'GET');
          zahlart = kunde.invoice_settings?.default_payment_method ?? null;
        }
        antwort.zahlungsart = zahlungsartText(zahlart);
      }
      const rechnungen = await stripe<{ data: { id: string; number?: string | null; created: number; total: number; status: string; invoice_pdf?: string | null; hosted_invoice_url?: string | null }[] }>(
        'invoices',
        { customer: b.stripe_kunde, limit: 12 },
        'GET',
      );
      antwort.rechnungen = rechnungen.data
        .filter((r) => r.status !== 'draft')
        .map((r) => ({ id: r.id, nummer: r.number ?? undefined, datum: datumAus(r.created), betragCent: r.total, status: r.status, pdf: r.invoice_pdf ?? undefined, link: r.hosted_invoice_url ?? undefined }));
    }
    return json(antwort);
  } catch (e) {
    console.error('abo/stand', e);
    return fehler('Der Stand konnte gerade nicht geladen werden.', 502);
  }
}
