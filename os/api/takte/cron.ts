/**
 * Server-Takt: stellt Dein Tag, Tagesbrief, Zeiten bestätigen und Wochenbilanz zu – auch wenn
 * niemand die App offen hat. Läuft als Vercel-Cron (z. B. alle 15 Minuten, siehe Bericht),
 * liest `objekte` laut Datenvertrag mit dem Service-Key und erzeugt die Inhalte mit denselben
 * Funktionen wie der Browser (`src/modules/takte`).
 *
 * Schlüssel: `VITE_SUPABASE_URL` (oder `SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`;
 * für Push `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`, für E-Mail `RESEND_API_KEY`.
 * Ohne Supabase-Schlüssel oder `CRON_SECRET`: 501 { fehler: "nicht verbunden" }.
 *
 * `?trocken=1` berechnet nur, was zugestellt würde (ohne Senden und ohne Speichern).
 */
import { emailAus } from '../../src/modules/takte/zustellung';
import { zuletztSchluessel } from '../../src/modules/takte/regeln';
import { betriebsDaten, planen, SAMMLUNGEN, type Mitglied, type ObjektZeile, type Zustellung } from './planen';
import { pushSenden, type PushAbo } from './webpush';

declare const process: { env: Record<string, string | undefined> };

const json = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

interface Umgebung {
  url: string;
  schluessel: string;
}

function umgebung(): Umgebung | undefined {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const schluessel = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && schluessel ? { url: url.replace(/\/$/, ''), schluessel } : undefined;
}

async function rest<T>(u: Umgebung, pfad: string, init: RequestInit = {}): Promise<T> {
  const antwort = await fetch(`${u.url}/rest/v1/${pfad}`, {
    ...init,
    headers: { apikey: u.schluessel, Authorization: `Bearer ${u.schluessel}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!antwort.ok) throw new Error(`Supabase ${antwort.status}: ${pfad.split('?')[0]}`);
  return antwort.status === 204 || init.method === 'POST' ? (undefined as T) : ((await antwort.json()) as T);
}

/** Alle benötigten Objekte eines Betriebs, seitenweise */
async function objekteLaden(u: Umgebung, betriebId: string): Promise<ObjektZeile[]> {
  const alle: ObjektZeile[] = [];
  const SEITE = 1000;
  for (let ab = 0; ; ab += SEITE) {
    const teil = await rest<ObjektZeile[]>(
      u,
      `objekte?select=sammlung,id,daten&betrieb_id=eq.${betriebId}&geloescht_am=is.null&sammlung=in.(${SAMMLUNGEN.join(',')})&order=sammlung,id&limit=${SEITE}&offset=${ab}`,
    );
    alle.push(...teil);
    if (teil.length < SEITE) return alle;
  }
}

async function einstellungSchreiben(u: Umgebung, betriebId: string, id: string, wert: unknown) {
  const jetzt = new Date().toISOString();
  await rest(u, 'objekte?on_conflict=betrieb_id,sammlung,id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ betrieb_id: betriebId, sammlung: 'einstellungen', id, daten: { id, wert, erstelltAm: jetzt, geaendertAm: jetzt }, geaendert_am: jetzt }]),
  });
}

async function zustellen(z: Zustellung, abos: { nutzer_id: string; abo: PushAbo }[]): Promise<'push' | 'email' | 'kein-weg'> {
  const vapid = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? { oeffentlich: process.env.VAPID_PUBLIC_KEY, privat: process.env.VAPID_PRIVATE_KEY, kontakt: process.env.VAPID_KONTAKT ?? 'mailto:hallo@macher-os.de' } : undefined;
  const meine = abos.filter((a) => a.nutzer_id === z.nutzerId);
  // Push zuerst (wenn gewählt und möglich), sonst E-Mail als Rückfall
  if (z.kanal === 'push' && vapid && meine.length) {
    const nutzlast = { titel: z.nachricht.titel, text: z.nachricht.text, pfad: z.nachricht.pfad, takt: z.takt, aktionen: z.nachricht.aktionen };
    const ergebnisse = await Promise.all(meine.map((a) => pushSenden(a.abo, nutzlast, vapid).catch(() => ({ ok: false, status: 0, abgelaufen: false }))));
    if (ergebnisse.some((e) => e.ok)) return 'push';
  }
  if (z.email && process.env.RESEND_API_KEY) {
    const basis = process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://app.macher-os.de');
    const mail = emailAus(z.nachricht, z.takt, basis);
    const antwort = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.RESEND_ABSENDER ?? 'Macher OS <takte@macher-os.de>', to: [z.email], subject: mail.betreff, text: mail.text }),
    });
    if (antwort.ok) return 'email';
  }
  return 'kein-weg';
}

async function lauf(request: Request): Promise<Response> {
  const u = umgebung();
  const geheim = process.env.CRON_SECRET;
  if (!u || !geheim) return json(501, { fehler: 'nicht verbunden' });
  if (request.headers.get('authorization') !== `Bearer ${geheim}`) return json(401, { fehler: 'nicht berechtigt' });
  const trocken = new URL(request.url).searchParams.get('trocken') === '1';
  const jetzt = new Date();

  const betriebe = await rest<{ id: string }[]>(u, 'betriebe?select=id');
  const bericht: { betriebId: string; zugestellt: { mitarbeiterId: string; takt: string; weg: string }[]; fehler?: string }[] = [];
  for (const { id: betriebId } of betriebe) {
    try {
      const [zeilen, mitglieder] = await Promise.all([objekteLaden(u, betriebId), rest<Mitglied[]>(u, `mitglieder?select=nutzer_id,mitarbeiter_id,rolle&betrieb_id=eq.${betriebId}`)]);
      const { zustellungen, zuletzt } = planen(betriebsDaten(zeilen), mitglieder, jetzt);
      if (trocken) {
        bericht.push({ betriebId, zugestellt: zustellungen.map((z) => ({ mitarbeiterId: z.mitarbeiterId, takt: z.takt, weg: 'trocken' })) });
        continue;
      }
      // zuerst merken: ein Takt kommt höchstens einmal am Tag, auch wenn ein Versand scheitert
      for (const [mitarbeiterId, stand] of zuletzt) await einstellungSchreiben(u, betriebId, zuletztSchluessel(mitarbeiterId), stand);
      const abos = zustellungen.length ? await rest<{ nutzer_id: string; abo: PushAbo }[]>(u, `push_abos?select=nutzer_id,abo&betrieb_id=eq.${betriebId}`) : [];
      const zugestellt = [];
      for (const z of zustellungen) {
        const weg = await zustellen(z, abos);
        zugestellt.push({ mitarbeiterId: z.mitarbeiterId, takt: z.takt, weg });
      }
      if (zugestellt.length) {
        await rest(u, 'messpunkte', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(zugestellt.map((z) => ({ betrieb_id: betriebId, ereignis: 'gewohnheit.takt_zugestellt', zeit: jetzt.toISOString(), daten: { takt: z.takt, weg: z.weg } }))),
        });
      }
      bericht.push({ betriebId, zugestellt });
    } catch (e) {
      bericht.push({ betriebId, zugestellt: [], fehler: e instanceof Error ? e.message : 'unbekannt' });
    }
  }
  return json(200, { zeit: jetzt.toISOString(), trocken, betriebe: bericht });
}

export const GET = lauf;
export const POST = lauf;
