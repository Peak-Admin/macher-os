/**
 * POST /api/abo/webhook – Stripe-Ereignisse (Signatur geprüft mit `STRIPE_WEBHOOK_SECRET`).
 * Setzt `betriebe.plan` / `betriebe.stripe_kunde` laut Datenvertrag (Kodierung siehe `regeln.ts`):
 * - `checkout.session.completed` → Plan gebucht
 * - `customer.subscription.created|updated` → Plan, Planwechsel, Kündigung zum Periodenende, Zahlung offen
 * - `invoice.payment_failed` → Zahlung offen seit heute (Stufe 1, E-Mail), Kulanz 14 Tage, danach Lesemodus
 * - `invoice.paid` → Zahlung offen erledigt; Rechnung + XRechnung per E-Mail, Kopie an den Steuerberater
 * - `customer.subscription.deleted` → Lesemodus
 */
import { planKodieren, planLesen, type PlanId } from '@modules/abo/regeln';
import { erinnern } from '../_lib/erinnern';
import { rechnungZustellen, type StripeRechnung } from '../_lib/rechnung';
import { signaturGueltig } from '../_lib/signatur';
import { betriebLesen, betriebSetzen, betriebZuKunde, env, fehler, json, letzterTag, messpunkt, nichtVerbunden, periodenEnde, planIdAusAbo, supabaseUrl, type BetriebZeile, type StripeAbo } from '../_lib/gemeinsam';

const heute = () => new Date().toISOString().slice(0, 10);

/** Zahlung offen setzen – das Datum des ersten Fehlschlags bleibt, damit die Kulanz nicht neu beginnt */
function zahlungOffen(b: BetriebZeile, planId: PlanId) {
  const alt = planLesen(b.plan);
  return planKodieren(planId, 'zahlung_offen', alt.status === 'zahlung_offen' && alt.datum ? alt.datum : heute());
}

function planAusAbo(b: BetriebZeile, abo: StripeAbo): string | undefined {
  const planId = planIdAusAbo(abo, planLesen(b.plan).planId);
  if (!planId) return undefined;
  if (abo.status === 'canceled' || abo.status === 'incomplete_expired') return 'lesemodus';
  if (abo.status === 'past_due' || abo.status === 'unpaid') return zahlungOffen(b, planId);
  if (abo.status !== 'active' && abo.status !== 'trialing') return undefined;
  const ende = abo.cancel_at ?? (abo.cancel_at_period_end ? periodenEnde(abo) : undefined);
  return ende ? planKodieren(planId, 'gekuendigt', letzterTag(ende)) : planKodieren(planId);
}

interface Ereignis {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export async function POST(req: Request): Promise<Response> {
  const geheimnis = env('STRIPE_WEBHOOK_SECRET');
  if (!geheimnis || !env('SUPABASE_SERVICE_ROLE_KEY') || !supabaseUrl()) return nichtVerbunden();
  const roh = await req.text();
  if (!(await signaturGueltig(roh, req.headers.get('stripe-signature'), geheimnis))) return fehler('Signatur ungültig.', 400);

  const e = JSON.parse(roh) as Ereignis;
  const o = e.data.object;
  try {
    switch (e.type) {
      case 'checkout.session.completed': {
        const meta = (o.metadata ?? {}) as Record<string, string>;
        const betriebId = meta.betrieb_id ?? (o.client_reference_id as string | undefined);
        const planId = planLesen(meta.plan).planId;
        const b = betriebId ? await betriebLesen(betriebId) : undefined;
        if (!b || !planId) break;
        await betriebSetzen(b.id, { plan: planKodieren(planId), stripe_kunde: (o.customer as string) ?? b.stripe_kunde });
        await messpunkt(b.id, 'bezahlen.fertig', { plan: planId, quelle: 'stripe' });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const abo = o as unknown as StripeAbo & { customer: string };
        const b = await betriebZuKunde(abo.customer);
        if (!b) break;
        const plan = e.type === 'customer.subscription.deleted' ? 'lesemodus' : planAusAbo(b, abo);
        if (plan && plan !== b.plan) await betriebSetzen(b.id, { plan });
        break;
      }
      case 'invoice.payment_failed': {
        const b = await betriebZuKunde(o.customer as string);
        const planId = b && planLesen(b.plan).planId;
        if (!b || !planId) break;
        const plan = zahlungOffen(b, planId);
        await betriebSetzen(b.id, { plan });
        // erste freundliche Erinnerung sofort; Stufe 2 und 3 schickt der tägliche Lauf (`/api/abo/erinnern`)
        if (planLesen(b.plan).status !== 'zahlung_offen') await erinnern(o.customer_email as string | undefined, 1, planLesen(plan).datum!);
        break;
      }
      case 'invoice.paid': {
        const b = await betriebZuKunde(o.customer as string);
        const alt = planLesen(b?.plan);
        if (b && alt.planId && alt.status === 'zahlung_offen') await betriebSetzen(b.id, { plan: planKodieren(alt.planId) });
        // Rechnung mit E-Rechnung an den Betrieb, Kopie an den Steuerberater (nur Rechnungen mit Betrag)
        if (b && (o.total as number) > 0) await rechnungZustellen(b.id, o as unknown as StripeRechnung);
        break;
      }
    }
    return json({ ok: true });
  } catch (err) {
    console.error('abo/webhook', e.type, err);
    // 500 → Stripe stellt das Ereignis später erneut zu
    return fehler('Verarbeitung fehlgeschlagen.', 500);
  }
}
