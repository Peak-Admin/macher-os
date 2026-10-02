/**
 * Anfrage-Postfach: Eingangs-Webhook für `anfragen@<betrieb>.macher-os.de` (Resend Inbound oder Postmark Inbound).
 * Mails an `belege@<betrieb>.macher-os.de` gehen an den Belege-Eingang (`src/os/server/belege-eingang.ts`).
 *
 * POST /api/eingang/email (Next.js Route Handler, Node)
 *  → erkennt den Betrieb an der Empfängeradresse,
 *  → erkennt den Kunden (E-Mail, sonst Telefonnummer aus der Signatur) oder legt ihn an,
 *  → legt eine Anfrage an (Auftrag in Phase „anfrage“, Quelle E-Mail) – oder hängt die Mail an eine
 *    offene Anfrage desselben Kunden mit gleichem Betreff (Dublette),
 *  → speichert den Text als eingehende Nachricht. Doppelt zugestellte Mails (gleiche Message-ID) werden ignoriert.
 *
 * Ohne `SUPABASE_SERVICE_ROLE_KEY` → 501 { fehler: "nicht verbunden" }.
 * Optional `EINGANG_WEBHOOK_SECRET`: dann muss `?schluessel=<wert>` oder Basic-Auth-Passwort übereinstimmen.
 */
import { json, lesen, neueId, nichtVerbunden, objekteLesen, objekteSchreiben, verbindung, type ObjektZeile, type Verbindung } from '@/os/server/supabase';
import { anfragePlanen, betriebSlug, mailLesen, slugAusAdresse, type AuftragZeile, type KundeZeile } from '@/os/server/postfach';
import { slugAusBelegeAdresse } from '@/os/server/belege-postfach';
import { belegeEingang } from '@/os/server/belege-eingang';
import { appUrl } from '@/server/cloud/lib';

function erlaubt(request: Request): boolean {
  const geheim = process.env.EINGANG_WEBHOOK_SECRET;
  if (!geheim) return true;
  const url = new URL(request.url);
  if (url.searchParams.get('schluessel') === geheim) return true;
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Basic ')) {
    try {
      const [, passwort] = atob(auth.slice(6)).split(':');
      return passwort === geheim;
    } catch {
      return false;
    }
  }
  return false;
}

export const dynamic = 'force-dynamic';

/**
 * Betrieb zum Postfach: zuerst die eindeutige Spalte `betriebe.postfach` (Migration `supabase/migrations/…_aktivierung.sql`),
 * sonst – solange die Spalte fehlt – der Slug aus dem Namen (nur wenn er eindeutig ist).
 */
async function betriebZumPostfach(v: Verbindung, slug: string): Promise<{ id: string } | undefined> {
  const mitSpalte = await lesen<{ id: string }>(v, 'betriebe', `select=id&postfach=eq.${encodeURIComponent(slug)}`).catch(() => undefined);
  if (mitSpalte?.length === 1) return mitSpalte[0];
  const betriebe = await lesen<{ id: string; name?: string }>(v, 'betriebe', 'select=id,name');
  const treffer = betriebe.filter((b) => betriebSlug(b.name) === slug);
  return treffer.length === 1 ? treffer[0] : undefined;
}

export async function POST(request: Request): Promise<Response> {
  const v = verbindung();
  if (!v) return nichtVerbunden();
  if (!erlaubt(request)) return json({ fehler: 'nicht erlaubt' }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ fehler: 'kein JSON' }, 400);
  }
  const mail = mailLesen(body);
  if (!mail) return json({ fehler: 'keine E-Mail erkannt' }, 400);

  // Belege-Postfach (`belege@<betrieb>.macher-os.de`): Anhänge werden Eingangsrechnungen – siehe docs/os/BELEGE-EMAIL.md
  const belegeSlug = mail.an.map(slugAusBelegeAdresse).find(Boolean);
  if (belegeSlug) return belegeEingang({ v, body, mail, slug: belegeSlug, appBasis: appUrl(request) });

  const slug = mail.an.map(slugAusAdresse).find(Boolean);
  if (!slug) return json({ fehler: 'Empfänger ist kein Anfrage- oder Belege-Postfach' }, 404);

  try {
    const betrieb = await betriebZumPostfach(v, slug);
    // 200 statt Fehler, damit der Mail-Dienst nicht endlos neu zustellt
    if (!betrieb) return json({ ok: false, fehler: 'Betrieb nicht gefunden' }, 200);

    const [kunden, auftraege] = await Promise.all([
      objekteLesen<KundeZeile>(v, betrieb.id, 'kunden'),
      objekteLesen<AuftragZeile>(v, betrieb.id, 'auftraege'),
    ]);

    if (mail.nachrichtId) {
      const schon = auftraege.some((a) => a.eingangId === mail.nachrichtId);
      const nachrichten = schon ? [] : await objekteLesen<{ eingangId?: string }>(v, betrieb.id, 'nachrichten');
      if (schon || nachrichten.some((n) => n.eingangId === mail.nachrichtId)) return json({ ok: true, doppelt: true });
    }

    const plan = anfragePlanen(mail, { kunden, auftraege }, { id: neueId, jetzt: new Date() });
    const zeilen: ObjektZeile[] = [];
    if (plan.kunde.neu && plan.kunde.daten) zeilen.push({ betrieb_id: betrieb.id, sammlung: 'kunden', id: plan.kunde.id, daten: plan.kunde.daten });
    if (plan.auftrag) zeilen.push({ betrieb_id: betrieb.id, sammlung: 'auftraege', id: plan.auftrag.id, daten: plan.auftrag.daten });
    zeilen.push({ betrieb_id: betrieb.id, sammlung: 'nachrichten', id: plan.nachricht.id, daten: plan.nachricht.daten });
    await objekteSchreiben(v, zeilen);

    return json({ ok: true, kundeNeu: plan.kunde.neu, auftragId: plan.auftrag?.id, angehaengtAn: plan.angehaengtAn });
  } catch (e) {
    return json({ fehler: e instanceof Error ? e.message : 'Fehler' }, 502);
  }
}

export function GET(): Response {
  return verbindung() ? json({ ok: true, hinweis: 'Eingang für E-Mail-Anfragen. Bitte per POST (Webhook) aufrufen.' }) : nichtVerbunden();
}
