/**
 * Anfrage-Postfach: Eingangs-Webhook für `anfragen@<betrieb>.macher-os.de` (Resend Inbound oder Postmark Inbound).
 *
 * POST /api/eingang/email
 *  → erkennt den Betrieb an der Empfängeradresse,
 *  → erkennt den Kunden (E-Mail, sonst Telefonnummer aus der Signatur) oder legt ihn an,
 *  → legt eine Anfrage an (Auftrag in Phase „anfrage“, Quelle E-Mail) – oder hängt die Mail an eine
 *    offene Anfrage desselben Kunden mit gleichem Betreff (Dublette),
 *  → speichert den Text als eingehende Nachricht. Doppelt zugestellte Mails (gleiche Message-ID) werden ignoriert.
 *
 * Ohne `SUPABASE_SERVICE_ROLE_KEY` → 501 { fehler: "nicht verbunden" }.
 * Optional `EINGANG_WEBHOOK_SECRET`: dann muss `?schluessel=<wert>` oder Basic-Auth-Passwort übereinstimmen.
 */
import { json, lesen, neueId, nichtVerbunden, objekteLesen, objekteSchreiben, verbindung, type ObjektZeile } from '../oeffentlich/_db';
import { anfragePlanen, betriebSlug, mailLesen, slugAusAdresse, type AuftragZeile, type KundeZeile } from './_logik';

declare const process: { env: Record<string, string | undefined> };

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

  const slug = mail.an.map(slugAusAdresse).find(Boolean);
  if (!slug) return json({ fehler: 'Empfänger ist kein Anfrage-Postfach' }, 404);

  try {
    const betriebe = await lesen<{ id: string; name?: string }>(v, 'betriebe', 'select=id,name');
    const betrieb = betriebe.find((b) => betriebSlug(b.name) === slug) ?? betriebe.find((b) => b.id.replace(/-/g, '').startsWith(slug));
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
