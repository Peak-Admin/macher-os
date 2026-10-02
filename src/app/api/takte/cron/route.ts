/**
 * GET/POST /api/takte/cron – Server-Takt (Next.js Route Handler): stellt Dein Tag, Tagesbrief, Zeiten bestätigen und Wochenbilanz zu – auch wenn
 * niemand die App offen hat. Läuft als Vercel-Cron (z. B. alle 15 Minuten, siehe Bericht),
 * liest `objekte` laut Datenvertrag mit dem Service-Key und erzeugt die Inhalte mit denselben
 * Funktionen wie der Browser (`src/os/modules/takte`).
 *
 * Schlüssel: `SUPABASE_URL` (oder `NEXT_PUBLIC_SUPABASE_URL`/`VITE_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`;
 * für Push `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`, für E-Mail `RESEND_API_KEY`.
 * Ohne Supabase-Schlüssel oder `CRON_SECRET`: 501 { fehler: "nicht verbunden" }.
 *
 * `?trocken=1` berechnet nur, was zugestellt würde (ohne Senden und ohne Speichern).
 */
import { emailAus } from '@/os/modules/takte/zustellung';
import { zuletztSchluessel } from '@/os/modules/takte/regeln';
import { betriebsDaten, planen, type Mitglied, type Zustellung } from '@/os/modules/takte/server/planen';
import { pushSenden, type PushAbo } from '@/os/modules/takte/server/webpush';
import { einstellungSchreiben, objekteLaden, rest, umgebung, type Umgebung } from '@/os/modules/takte/server/supabase';
import { aktionenMitSchluessel, geheimnis } from '@/os/modules/takte/server/serverAktionen';

export const dynamic = 'force-dynamic';

const json = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

async function zustellen(u: Umgebung, betriebId: string, z: Zustellung, abos: { nutzer_id: string; abo: PushAbo }[]): Promise<'push' | 'email' | 'kein-weg'> {
  const vapid = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? { oeffentlich: process.env.VAPID_PUBLIC_KEY, privat: process.env.VAPID_PRIVATE_KEY, kontakt: process.env.VAPID_KONTAKT ?? 'mailto:hallo@macher-os.de' } : undefined;
  const meine = [...abos.filter((a) => a.nutzer_id === z.nutzerId), ...z.geraete.map((abo) => ({ nutzer_id: z.nutzerId, abo, ausEinstellung: true }))].filter(
    (a, n, alle) => alle.findIndex((b) => b.abo.endpoint === a.abo.endpoint) === n,
  );
  // Push zuerst (wenn gewählt und möglich), sonst E-Mail als Rückfall
  if (z.kanal === 'push' && vapid && meine.length) {
    const nutzlast = { titel: z.nachricht.titel, text: z.nachricht.text, pfad: z.nachricht.pfad, takt: z.takt, aktionen: aktionenMitSchluessel(z.nachricht.aktionen, { betriebId, mitarbeiterId: z.mitarbeiterId, takt: z.takt, geheim: geheimnis() }) };
    const ergebnisse = await Promise.all(meine.map((a) => pushSenden(a.abo, nutzlast, vapid).catch(() => ({ ok: false, status: 0, abgelaufen: false }))));
    // abgelaufene Abos (Gerät abgemeldet, App gelöscht) aufräumen
    await Promise.all(
      ergebnisse.map((e, n) =>
        e.abgelaufen && !('ausEinstellung' in meine[n])
          ? rest(u, `push_abos?betrieb_id=eq.${betriebId}&nutzer_id=eq.${z.nutzerId}&abo->>endpoint=eq.${encodeURIComponent(meine[n].abo.endpoint)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => undefined)
          : undefined,
      ),
    );
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
        const weg = await zustellen(u, betriebId, z, abos);
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

export async function GET(request: Request) {
  return lauf(request);
}

export async function POST(request: Request) {
  return lauf(request);
}
