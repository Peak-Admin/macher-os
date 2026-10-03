/**
 * GET/POST /api/takte/cron – Server-Takt: stellt Dein Tag, Tagesbrief, Zeiten bestätigen und Wochenbilanz zu – auch wenn
 * niemand die App offen hat. Liest `objekte` laut Datenvertrag mit dem Service-Key und erzeugt die Inhalte mit denselben
 * Funktionen wie der Browser (`src/os/modules/takte`, Planung in `src/os/server/takte`).
 *
 * Zeitplan (vercel.json): einmal täglich um 04:30 UTC (Vercel Hobby erlaubt nur tägliche Crons). Die feinen Zeiten
 * (6:30 · 7:00 · 16:30 · Fr 15:00) plant zusätzlich der Browser-Planer, solange Handwerk OS offen ist; „zuletzt zugestellt“
 * liegt für beide in `objekte`, damit kein Takt doppelt kommt. Mit Vercel Pro: `*\/15 * * * *` (siehe docs/os/BACKEND.md).
 *
 * Schlüssel: `SUPABASE_URL` (oder `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`;
 * Push: `VAPID_PUBLIC_KEY` (oder `NEXT_PUBLIC_VAPID_PUBLIC_KEY`) + `VAPID_PRIVATE_KEY`; E-Mail: `RESEND_API_KEY`.
 * Ohne `CRON_SECRET` oder Supabase-Schlüssel: 501 { fehler: "nicht verbunden" }; falsches Geheimnis: 401.
 *
 * `?trocken=1` berechnet nur, was zugestellt würde (ohne Senden und ohne Speichern).
 */
import { appUrl, json, nichtVerbunden, rest, supabaseKonfig, type SupabaseKonfig } from '@/server/cloud/lib';
import { cronErlaubt } from '@/server/cloud/cron';
import { pushAnMitarbeiter, pushVerbunden } from '@/server/cloud/push';
import { emailSenden, emailVerbunden } from '@/server/cloud/versand';
import { emailAus } from '@/os/modules/takte/zustellung';
import { zuletztSchluessel } from '@/os/modules/takte/regeln';
import { betriebsDaten, planen, type Mitglied, type Zustellung } from '@/os/server/takte/planen';
import { aktionenMitSchluessel, geheimnis } from '@/os/server/takte/serverAktionen';
import { einstellungSchreiben, messen, objekteLaden } from '@/os/server/takte/supabase';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

type Weg = 'push' | 'email' | 'kein-weg';

/** Push zuerst (wenn gewählt und möglich), sonst E-Mail als Rückfall */
async function zustellen(k: SupabaseKonfig, betriebId: string, z: Zustellung, basis: string): Promise<Weg> {
  if (z.kanal === 'push' && pushVerbunden()) {
    const r = await pushAnMitarbeiter(
      k,
      betriebId,
      {
        anMitarbeiterId: z.mitarbeiterId,
        titel: z.nachricht.titel,
        text: z.nachricht.text,
        pfad: z.nachricht.pfad,
        tag: `takt-${z.takt}`,
        aktionen: aktionenMitSchluessel(z.nachricht.aktionen, { betriebId, mitarbeiterId: z.mitarbeiterId, takt: z.takt, geheim: geheimnis() }),
      },
      webpush,
      { emailRueckfall: false },
    );
    if (r.geraete > 0) return 'push';
  }
  if (z.email && emailVerbunden()) {
    const mail = emailAus(z.nachricht, z.takt, basis);
    await emailSenden({ an: z.email, betreff: mail.betreff, text: mail.text, absenderName: 'Handwerk OS' });
    return 'email';
  }
  return 'kein-weg';
}

async function lauf(req: Request): Promise<Response> {
  const verboten = cronErlaubt(req);
  if (verboten) return verboten;
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const trocken = new URL(req.url).searchParams.get('trocken') === '1';
  const jetzt = new Date();
  const basis = appUrl(req);

  const betriebe = await rest<{ id: string }[]>(k, 'betriebe?select=id');
  const bericht: { betriebId: string; zugestellt: { mitarbeiterId: string; takt: string; weg: string }[]; fehler?: string }[] = [];
  for (const { id: betriebId } of betriebe) {
    try {
      const [zeilen, mitglieder] = await Promise.all([
        objekteLaden(k, betriebId),
        rest<Mitglied[]>(k, `mitglieder?select=nutzer_id,mitarbeiter_id,rolle&betrieb_id=eq.${encodeURIComponent(betriebId)}`),
      ]);
      const { zustellungen, zuletzt } = planen(betriebsDaten(zeilen), mitglieder, jetzt);
      if (trocken) {
        bericht.push({ betriebId, zugestellt: zustellungen.map((z) => ({ mitarbeiterId: z.mitarbeiterId, takt: z.takt, weg: 'trocken' })) });
        continue;
      }
      // zuerst merken: ein Takt kommt höchstens einmal am Tag, auch wenn ein Versand scheitert
      for (const [mitarbeiterId, stand] of zuletzt) await einstellungSchreiben(k, betriebId, zuletztSchluessel(mitarbeiterId), stand);
      const zugestellt: { mitarbeiterId: string; takt: string; weg: Weg }[] = [];
      for (const z of zustellungen) {
        let weg: Weg = 'kein-weg';
        try {
          weg = await zustellen(k, betriebId, z, basis);
        } catch (e) {
          console.error('Takt-Zustellung fehlgeschlagen', z.takt, e);
        }
        zugestellt.push({ mitarbeiterId: z.mitarbeiterId, takt: z.takt, weg });
      }
      await messen(k, betriebId, 'gewohnheit.takt_zugestellt', zugestellt.map((z) => ({ takt: z.takt, weg: z.weg })), jetzt);
      bericht.push({ betriebId, zugestellt });
    } catch (e) {
      console.error(`Server-Takt für Betrieb ${betriebId} fehlgeschlagen`, e);
      bericht.push({ betriebId, zugestellt: [], fehler: e instanceof Error ? e.message : 'unbekannt' });
    }
  }
  return json(200, { zeit: jetzt.toISOString(), trocken, betriebe: bericht });
}

export async function GET(req: Request): Promise<Response> {
  return lauf(req);
}

export async function POST(req: Request): Promise<Response> {
  return lauf(req);
}
