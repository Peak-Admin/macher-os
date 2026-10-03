/**
 * Speicher der Partner-Schnittstelle auf Supabase (PostgREST mit Service-Key – nur auf dem Server).
 * Tabellen: `partner_zugaenge`, `partner_nutzer`, `api_aufrufe`, `partner_auslieferungen` (Migration 20261003120000)
 * und `objekte` für die Geschäftsdaten.
 */
import { rest, type SupabaseKonfig } from '@/server/cloud/lib';
import type { ObjektZeile } from './aktionen';
import type { Aufruf, PartnerSpeicher, Zugang } from './dienst';
import { zustellen, type Auslieferung, type Senden } from './webhook';

const q = encodeURIComponent;
const ZUGANG_FELDER = 'id,betrieb_id,partner,name,partner_workspace_id,webhook_url,webhook_geheimnis,ereignisse,widerrufen_am';

export function supabaseSpeicher(k: SupabaseKonfig): PartnerSpeicher {
  return {
    async zugangNachHash(hash) {
      const z = await rest<Zugang[]>(k, `partner_zugaenge?schluessel_hash=eq.${q(hash)}&select=${ZUGANG_FELDER}&limit=1`);
      return z[0];
    },
    async zugangNachId(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
      const z = await rest<Zugang[]>(k, `partner_zugaenge?id=eq.${q(id)}&select=${ZUGANG_FELDER}&limit=1`);
      return z[0];
    },
    async aufrufeSeit(zugangId, seit) {
      // Funktion aus Migration 20261003180000 (zählt über den Index api_aufrufe_zugang)
      return (await rest<number>(k, 'rpc/partner_aufrufe_seit', { method: 'POST', body: { p_zugang: zugangId, p_seit: seit } })) ?? 0;
    },
    async zugangGenutzt(id, zeit) {
      await rest(k, `partner_zugaenge?id=eq.${q(id)}`, { method: 'PATCH', body: { zuletzt_genutzt_am: zeit }, prefer: 'return=minimal' });
    },
    async nutzerZuordnung(zugangId, partnerNutzerId) {
      const z = await rest<{ mitarbeiter_id: string }[]>(
        k,
        `partner_nutzer?zugang_id=eq.${q(zugangId)}&partner_nutzer_id=eq.${q(partnerNutzerId)}&select=mitarbeiter_id&limit=1`,
      );
      return z[0]?.mitarbeiter_id;
    },
    async objekte(betriebId, sammlungen) {
      const alle: ObjektZeile[] = [];
      const SEITE = 1000;
      for (let ab = 0; ; ab += SEITE) {
        const teil = await rest<ObjektZeile[]>(
          k,
          `objekte?select=sammlung,id,daten&betrieb_id=eq.${q(betriebId)}&daten=not.is.null&sammlung=in.(${sammlungen.map(q).join(',')})&order=sammlung,id&limit=${SEITE}&offset=${ab}`,
        );
        alle.push(...teil);
        if (teil.length < SEITE) return alle;
      }
    },
    async aufrufVormerken(a) {
      const neu = await rest<Aufruf[]>(k, 'api_aufrufe?on_conflict=zugang_id,idempotenz_schluessel', {
        method: 'POST',
        body: [a],
        prefer: 'resolution=ignore-duplicates,return=representation',
      });
      if (neu.length) return 'neu';
      const frueher = await rest<Aufruf[]>(
        k,
        `api_aufrufe?zugang_id=eq.${q(a.zugang_id)}&idempotenz_schluessel=eq.${q(a.idempotenz_schluessel ?? '')}&select=*&limit=1`,
      );
      return frueher[0] ?? 'neu';
    },
    async aufrufSchreiben(a) {
      await rest(k, 'api_aufrufe?on_conflict=id', { method: 'POST', body: [a], prefer: 'resolution=merge-duplicates,return=minimal' });
    },
    async objekteSchreiben(betriebId, zeilen) {
      if (!zeilen.length) return;
      await rest(k, 'objekte?on_conflict=betrieb_id,sammlung,id', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: zeilen.map((z) => ({ betrieb_id: betriebId, sammlung: z.sammlung, id: z.id, daten: z.daten })),
      });
    },
    async auslieferungenAnlegen(liste) {
      if (!liste.length) return;
      await rest(k, 'partner_auslieferungen', { method: 'POST', body: liste, prefer: 'return=minimal' });
    },
  };
}

async function speichern(k: SupabaseKonfig, liste: Auslieferung[]) {
  if (!liste.length) return;
  await rest(k, 'partner_auslieferungen?on_conflict=id', { method: 'POST', body: liste, prefer: 'resolution=merge-duplicates,return=minimal' });
}

async function zugaengeLaden(k: SupabaseKonfig, ids: string[]): Promise<Map<string, Zugang>> {
  if (!ids.length) return new Map();
  const z = await rest<Zugang[]>(k, `partner_zugaenge?id=in.(${[...new Set(ids)].map(q).join(',')})&select=${ZUGANG_FELDER}`);
  return new Map(z.map((x) => [x.id, x]));
}

/** Frisch angelegte Auslieferungen sofort zustellen (Fehler landen in der Warteschlange, nie beim Partner-Aufruf) */
export async function sofortZustellen(k: SupabaseKonfig, liste: Auslieferung[], zugang: Zugang, senden?: Senden): Promise<void> {
  if (!liste.length) return;
  await speichern(k, await zustellen(liste, new Map([[zugang.id, zugang]]), senden));
}

/** Fällige Wiederholungen zustellen – für einen Zugang (nach seinem Aufruf) oder alle (Cron). Gibt die Anzahl zurück. */
export async function faelligeZustellen(k: SupabaseKonfig, opts: { zugangId?: string; max?: number; jetzt?: Date; senden?: Senden } = {}): Promise<number> {
  const jetzt = opts.jetzt ?? new Date();
  const liste = await rest<Auslieferung[]>(
    k,
    `partner_auslieferungen?status=in.(wartend,fehler)&naechster_versuch=lte.${q(jetzt.toISOString())}${opts.zugangId ? `&zugang_id=eq.${q(opts.zugangId)}` : ''}&order=erstellt_am&limit=${opts.max ?? 50}&select=id,zugang_id,betrieb_id,typ,nutzlast,status,versuche,naechster_versuch`,
  );
  if (!liste.length) return 0;
  await speichern(k, await zustellen(liste, await zugaengeLaden(k, liste.map((a) => a.zugang_id)), opts.senden, jetzt));
  return liste.length;
}
