/**
 * Cloud über Supabase (Region Frankfurt) + Server-Funktionen unter `/api/cloud/*`.
 *
 * Schaltet sich nur ein, wenn `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt sind. Ohne diese Werte
 * bleibt die lokale Cloud aus `cloud.ts` aktiv und die App läuft wie bisher nur im Browser.
 *
 * Im Browser liegen nur öffentliche Werte (URL, Anon-Key, VAPID-Public-Key). Alles mit Geheimnis
 * (Versand, Push, Einladungen, öffentliche Links) läuft über `/api/cloud/*`.
 */
import { useSyncExternalStore } from 'react';
import type { RealtimeChannel, Session, SupabaseClient } from '@supabase/supabase-js';
import { cloud, LOKALE_CLOUD, setzeCloud, type Cloud, type Konto, type PushNachricht, type Versand, type VersandErgebnis } from './cloud';
import { appPfad } from './basis';
import { db, exportieren, importieren, neueId, sicherungAnlegen, subscribe } from './db';
import { emit } from './events';
import { messen, messpunkte, setzeMessziel, type Messpunkt } from './messung';
import { ichId, setzeIch } from './session';
import { dataUrlsAuslagern } from './sync-dateien';
import { laufenderSync, starteSync, type ObjektZeile, type SyncAdapter } from './sync';

export interface CloudKonfig {
  url: string;
  anonKey: string;
  vapidKey?: string;
  /** Basis der Server-Funktionen, Standard: gleiche Adresse wie die App */
  apiBasis?: string;
}

/** Öffentliche Werte – Next.js setzt `NEXT_PUBLIC_*` beim Bauen ein (deshalb jeder Name ausgeschrieben). */
const UMGEBUNG: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
};

export function konfigAusUmgebung(e: Record<string, string | undefined> = UMGEBUNG): CloudKonfig | undefined {
  const url = e.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = e.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return undefined;
  return { url, anonKey, vapidKey: e.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || undefined, apiBasis: '' };
}

// ------------------------------------------------------------------ Zustand für die Oberfläche

export interface KontoZustand {
  /** Sind Backend-Schlüssel gesetzt? */
  konfiguriert: boolean;
  phase: 'lokal' | 'abgemeldet' | 'verbinde' | 'kein-betrieb' | 'bereit';
  konto?: Konto & { rolle?: string; mitarbeiterId?: string };
  fehler?: string;
  /** Sicherung der Gerätedaten, bevor die Daten des Betriebs übernommen wurden */
  sicherung?: string;
}

let zustand: KontoZustand = { konfiguriert: false, phase: 'lokal' };
const hoerer = new Set<() => void>();
function setze(z: Partial<KontoZustand>) {
  zustand = { ...zustand, ...z };
  hoerer.forEach((h) => h());
}

export function kontoZustand(): KontoZustand {
  return zustand;
}

export function useKontoZustand(): KontoZustand {
  return useSyncExternalStore(
    (h) => (hoerer.add(h), () => hoerer.delete(h)),
    () => zustand,
    () => zustand,
  );
}

// ------------------------------------------------------------------ Hilfen

const K_KONTO = 'macher-os:konto';
const K_EINLADUNG = 'macher-os:einladung';
const K_INSTALLATION = 'macher-os:installation';
/** Zu welchem Betrieb gehören die Daten in diesem Browser? */
const K_DATEN_BETRIEB = 'macher-os:daten-betrieb';
/** Schlüssel der letzten Sicherung (IndexedDB), bevor ein Betrieb übernommen wurde */
const K_SICHERUNG = 'macher-os:sicherung';

type Speicher = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Handynummer ins internationale Format (+49 …) */
export function telefonNormal(t: string): string {
  const roh = t.replace(/[^\d+]/g, '');
  if (roh.startsWith('+')) return roh;
  if (roh.startsWith('00')) return `+${roh.slice(2)}`;
  if (roh.startsWith('0')) return `+49${roh.slice(1)}`;
  return `+${roh}`;
}

export const istEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
export const istTelefon = (s: string) => /^\+?[\d\s/()-]{6,}$/.test(s.trim()) && s.replace(/\D/g, '').length >= 6;

function fehlerText(e: unknown): string {
  const m = (e as { message?: string; status?: number })?.message ?? String(e);
  const status = (e as { status?: number })?.status;
  if (status === 429 || /rate limit|too many/i.test(m)) return 'Zu viele Versuche. Warte eine Minute und versuch es dann noch mal.';
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(m)) return 'Der Code stimmt nicht oder ist abgelaufen. Fordere einen neuen an.';
  if (/fetch|network|failed to/i.test(m)) return 'Keine Verbindung. Prüfe dein Netz und versuch es noch mal.';
  if (/Einladung/i.test(m)) return m;
  return `Das hat nicht geklappt: ${m}`;
}

/** Protokolle und Einstellungen zählen nicht als „echte Daten“ eines Betriebs */
const PROTOKOLL_SAMMLUNGEN = new Set(['einstellungen', 'ereignisse', 'ereignisprotokoll', 'webhook_auslieferungen']);

function hatEchteDaten(): boolean {
  const alles = exportieren();
  return Object.entries(alles).some(
    ([s, t]) => !PROTOKOLL_SAMMLUNGEN.has(s) && Object.values(t).some((o) => !o.beispiel),
  );
}

function geraetName(): string {
  const ua = globalThis.navigator?.userAgent ?? '';
  const system = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Gerät';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${system} · ${browser}`;
}

function base64UrlZuBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const roh = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(roh.length));
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return bytes;
}

// ------------------------------------------------------------------ Abgleich über Supabase

export function supabaseAdapter(client: SupabaseClient, betriebId: string): SyncAdapter {
  return {
    async hochladen(zeilen) {
      // über die Server-Funktion: prüft Mitgliedschaft und Rechte je Rolle (siehe Migration „Rechte“)
      const { error } = await client.rpc('objekte_schreiben', {
        p_betrieb: betriebId,
        p_zeilen: zeilen.map((z) => ({ sammlung: z.sammlung, id: z.id, daten: z.daten, geloescht_am: z.geloescht_am ?? null })),
      });
      if (error) throw Object.assign(new Error(error.message), { berechtigung: error.code === '42501' });
    },
    async laden(seit) {
      const alle: ObjektZeile[] = [];
      for (let von = 0; ; von += 1000) {
        let q = client.from('objekte').select('sammlung,id,daten,geaendert_am,geloescht_am').eq('betrieb_id', betriebId);
        if (seit) q = q.gt('geaendert_am', seit);
        const { data, error } = await q.order('geaendert_am', { ascending: true }).order('sammlung').order('id').range(von, von + 999);
        if (error) throw new Error(error.message);
        alle.push(...((data ?? []) as ObjektZeile[]));
        if (!data || data.length < 1000) return alle;
      }
    },
    abonnieren(zeile, verbunden) {
      const kanal: RealtimeChannel = client
        .channel(`objekte:${betriebId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'objekte', filter: `betrieb_id=eq.${betriebId}` }, (p) => {
          const neu = p.new as Partial<ObjektZeile> | undefined;
          if (neu?.sammlung && neu.id) zeile(neu as ObjektZeile);
        })
        .subscribe((s) => verbunden?.(s === 'SUBSCRIBED'));
      return () => void client.removeChannel(kanal);
    },
  };
}

// ------------------------------------------------------------------ Cloud

export interface SupabaseCloud extends Cloud {
  /** Beim App-Start: gespeichertes Konto übernehmen, Anmeldung aus dem Link erkennen, Abgleich starten */
  starten(): Promise<void>;
  /** Einladungs-Token merken (vor der Anmeldung über `/beitreten/:token`) */
  einladungMerken(token: string): void;
  /** Einladung annehmen, wenn schon jemand angemeldet ist (`/beitreten/:token`) */
  einladungAnnehmen(token: string): Promise<{ ok: boolean; fehler?: string }>;
  /** Betrieb anlegen und vorhandene Browser-Daten einmalig hochladen („Daten sichern & Team einladen“) */
  sichern(): Promise<{ ok: boolean; fehler?: string }>;
  pushEinschalten(): Promise<{ ok: boolean; fehler?: string }>;
  geraete(): Promise<{ endpoint: string; geraet: string; seit: string; diesesGeraet: boolean }[]>;
  geraetEntfernen(endpoint: string): Promise<void>;
  /** Angemeldeter Aufruf einer Server-Funktion `/api/cloud/<pfad>` (Status 0 = keine Verbindung) */
  serverAnfrage<T>(pfad: string, body: unknown): Promise<{ status: number; daten?: T }>;
}

export interface Abhaengigkeiten {
  fetch?: typeof fetch;
  speicher?: Speicher;
  /** Abgleich starten (Tests ersetzen ihn) */
  syncStarten?: typeof starteSync;
  ursprung?: string;
  /** Cloud ohne Konto (z. B. E-Mail über `/api/senden`, sonst lokale Programme) */
  rueckfall?: Cloud;
}

export function erzeugeSupabaseCloud(client: SupabaseClient, konfig: CloudKonfig, abh: Abhaengigkeiten = {}): SupabaseCloud {
  const holen = abh.fetch ?? ((...a: Parameters<typeof fetch>) => globalThis.fetch(...a));
  const speicher: Speicher | undefined = abh.speicher ?? globalThis.localStorage;
  const syncStarten = abh.syncStarten ?? starteSync;
  const ursprung = abh.ursprung ?? globalThis.location?.origin ?? '';
  const rueckfall = abh.rueckfall ?? LOKALE_CLOUD;
  const api = (pfad: string) => `${konfig.apiBasis ?? ''}/api/cloud/${pfad}`;

  const lesen = (k: string) => {
    try {
      return speicher?.getItem(k) ?? undefined;
    } catch {
      return undefined;
    }
  };
  const schreiben = (k: string, v: string | undefined) => {
    try {
      if (v === undefined) speicher?.removeItem(k);
      else speicher?.setItem(k, v);
    } catch {
      /* egal */
    }
  };

  let konto: KontoZustand['konto'] = (() => {
    try {
      return JSON.parse(lesen(K_KONTO) ?? 'null') ?? undefined;
    } catch {
      return undefined;
    }
  })();
  const kontoSetzen = (k: KontoZustand['konto']) => {
    konto = k;
    schreiben(K_KONTO, k ? JSON.stringify(k) : undefined);
    setze({ konto: k });
  };

  /** angemeldet und mit einem Betrieb verbunden */
  const angemeldet = () => !!konto?.betriebId;

  async function token(): Promise<string | undefined> {
    try {
      return (await client.auth.getSession()).data.session?.access_token;
    } catch {
      return undefined;
    }
  }

  async function serverAufruf<T>(pfad: string, body: unknown): Promise<{ status: number; daten?: T }> {
    try {
      const t = await token();
      const r = await holen(api(pfad), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(t ? { authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      return { status: r.status, daten: text ? (JSON.parse(text) as T) : undefined };
    } catch {
      return { status: 0 };
    }
  }

  // ---------------------------------------------------------------- Verbinden mit dem Betrieb

  async function verbinden(betriebId: string, opt: { uebernahme?: boolean; mitarbeiterId?: string; beigetreten?: boolean } = {}) {
    const datenBetrieb = lesen(K_DATEN_BETRIEB);
    if (!opt.uebernahme && datenBetrieb !== betriebId) {
      // Dieses Gerät übernimmt die Daten des Betriebs. Was vorher hier lag, wird vorher gesichert.
      if (hatEchteDaten()) {
        const s = await sicherungAnlegen(`Vor der Anmeldung bei Betrieb ${betriebId}`).catch(() => undefined);
        if (s) {
          schreiben(K_SICHERUNG, s);
          setze({ sicherung: s });
        }
      }
      importieren({});
      schreiben(`macher-os:sync:${betriebId}:stand`, undefined);
      schreiben(`macher-os:sync:${betriebId}:warteschlange`, undefined);
    }
    schreiben(K_DATEN_BETRIEB, betriebId);
    const sync = syncStarten(supabaseAdapter(client, betriebId), { betriebId });
    setze({ phase: 'bereit', fehler: undefined });
    if (opt.uebernahme) await sync.allesHochladen();
    else await sync.abgleichen();
    // alte Data-URLs (Fotos, PDFs) im Hintergrund in den Speicher umziehen
    void dataUrlsAuslagern((d, n) => c.dateiAblegen(d, n), { weiter: () => angemeldet() && (globalThis.navigator?.onLine ?? true) }).catch(() => {});
    if (opt.beigetreten && opt.mitarbeiterId) {
      setzeIch(opt.mitarbeiterId);
      messen('team.beigetreten');
      emit({ typ: 'team.beigetreten', daten: { mitarbeiterId: opt.mitarbeiterId } });
    }
  }

  async function betriebAnlegen(): Promise<string> {
    const b = db.betrieb.get('betrieb');
    const chef = ichId() ?? db.mitarbeiter.all().find((m) => m.rolle === 'chef')?.id;
    const { data, error } = await client.rpc('betrieb_anlegen', { p_name: b?.name ?? 'Mein Betrieb', p_mitarbeiter_id: chef ?? null });
    if (error) throw new Error(error.message);
    return data as string;
  }

  let laufendeAnmeldung: Promise<void> | undefined;

  function nachAnmeldung(session: Session, erzwingen = false): Promise<void> {
    laufendeAnmeldung ??= (async () => {
      const u = session.user;
      const basis = { nutzerId: u.id, email: u.email || undefined, telefon: u.phone ? `+${u.phone.replace(/^\+/, '')}` : undefined };
      // gleiches Konto, schon verbunden → nur Abgleich (z. B. Token erneuert)
      if (!erzwingen && konto?.nutzerId === u.id && konto.betriebId && laufenderSync()) return;
      kontoSetzen({ ...konto, ...basis, betriebId: konto?.nutzerId === u.id ? konto.betriebId : undefined });
      setze({ phase: 'verbinde', fehler: undefined });
      try {
        let beigetreten: { betrieb_id: string; mitarbeiter_id?: string; rolle?: string } | undefined;
        let einladungFehler: string | undefined;
        const einladung = lesen(K_EINLADUNG);
        if (einladung) {
          const { data, error } = await client.rpc('einladung_annehmen', { p_token: einladung });
          schreiben(K_EINLADUNG, undefined);
          if (error) einladungFehler = 'Die Einladung ist ungültig oder abgelaufen. Bitte lass dir eine neue schicken.';
          else beigetreten = (Array.isArray(data) ? data[0] : data) as typeof beigetreten;
        }
        const { data: m, error } = await client
          .from('mitglieder')
          .select('betrieb_id,mitarbeiter_id,rolle')
          .eq('nutzer_id', u.id)
          .order('erstellt_am', { ascending: true })
          .limit(1);
        if (error) throw new Error(error.message);
        // eine gerade angenommene Einladung hat Vorrang (z. B. Wechsel in einen anderen Betrieb)
        let mitglied = beigetreten ?? (m?.[0] as { betrieb_id: string; mitarbeiter_id?: string; rolle?: string } | undefined);
        let uebernahme = false;
        if (!mitglied) {
          if (!db.betrieb.get('betrieb')?.onboardingFertig) {
            kontoSetzen({ ...basis });
            setze({ phase: 'kein-betrieb', fehler: einladungFehler });
            return;
          }
          mitglied = { betrieb_id: await betriebAnlegen(), mitarbeiter_id: ichId(), rolle: 'chef' };
          uebernahme = true;
        }
        kontoSetzen({ ...basis, betriebId: mitglied.betrieb_id, rolle: mitglied.rolle, mitarbeiterId: mitglied.mitarbeiter_id ?? undefined });
        await verbinden(mitglied.betrieb_id, {
          uebernahme,
          mitarbeiterId: mitglied.mitarbeiter_id ?? undefined,
          beigetreten: !!beigetreten && beigetreten.betrieb_id === mitglied.betrieb_id,
        });
        if (einladungFehler) setze({ fehler: einladungFehler });
      } catch (e) {
        setze({ phase: konto?.betriebId ? 'bereit' : 'kein-betrieb', fehler: fehlerText(e) });
      }
    })().finally(() => {
      laufendeAnmeldung = undefined;
    });
    return laufendeAnmeldung;
  }

  // ---------------------------------------------------------------- Messung an den Server

  const messPuffer: Messpunkt[] = [...messpunkte()];
  let messTimer: ReturnType<typeof setTimeout> | undefined;
  let messungAus = false;
  const installation = (() => {
    let id = lesen(K_INSTALLATION);
    if (!id) {
      id = neueId();
      schreiben(K_INSTALLATION, id);
    }
    return id;
  })();
  async function messungSenden() {
    messTimer = undefined;
    if (messungAus || !messPuffer.length) return;
    const punkte = messPuffer.splice(0, 100);
    const r = await serverAufruf('messen', { punkte, installation });
    if (r.status === 501) {
      messungAus = true;
      setzeMessziel(undefined);
    } else if (r.status === 0 || r.status >= 500) messPuffer.unshift(...punkte.slice(0, 500 - messPuffer.length));
    if (messPuffer.length && !messungAus) messTimer = setTimeout(messungSenden, 30_000);
  }
  const messziel = (p: Messpunkt) => {
    messPuffer.push(p);
    if (messPuffer.length > 500) messPuffer.shift();
    messTimer ??= setTimeout(messungSenden, 5000);
  };

  // ---------------------------------------------------------------- Vertrag

  const c: SupabaseCloud = {
    serverAnfrage: serverAufruf,
    // „aktiv“ = Backend ist verbunden (Schlüssel gesetzt). Ob jemand angemeldet ist, sagt `konto()`.
    aktiv: () => true,
    konto: () => (konto ? { nutzerId: konto.nutzerId, email: konto.email, telefon: konto.telefon, betriebId: konto.betriebId } : undefined),

    async anmelden(ziel) {
      try {
        if (ziel.email) {
          if (!istEmail(ziel.email)) return { ok: false, fehler: 'Die E-Mail-Adresse stimmt nicht.' };
          const e = lesen(K_EINLADUNG);
          const { error } = await client.auth.signInWithOtp({
            email: ziel.email.trim(),
            options: { emailRedirectTo: `${ursprung}${appPfad('/anmelden')}${e ? `?einladung=${encodeURIComponent(e)}` : ''}` },
          });
          if (error) return { ok: false, fehler: fehlerText(error) };
          return { ok: true };
        }
        if (ziel.telefon) {
          if (!istTelefon(ziel.telefon)) return { ok: false, fehler: 'Die Handynummer stimmt nicht.' };
          const { error } = await client.auth.signInWithOtp({ phone: telefonNormal(ziel.telefon) });
          if (error) return { ok: false, fehler: fehlerText(error) };
          return { ok: true };
        }
        return { ok: false, fehler: 'Gib deine E-Mail-Adresse oder Handynummer ein.' };
      } catch (e) {
        return { ok: false, fehler: fehlerText(e) };
      }
    },

    async mitGoogle(zurueck) {
      try {
        const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${ursprung}${appPfad(zurueck)}` } });
        if (error) return { ok: false, fehler: fehlerText(error) };
        return { ok: true };
      } catch (e) {
        return { ok: false, fehler: fehlerText(e) };
      }
    },

    async codeBestaetigen(ziel, code) {
      const token = code.replace(/\D/g, '');
      if (token.length < 6) return { ok: false, fehler: 'Der Code hat 6 Ziffern.' };
      try {
        const { data, error } = ziel.includes('@')
          ? await client.auth.verifyOtp({ email: ziel.trim(), token, type: 'email' })
          : await client.auth.verifyOtp({ phone: telefonNormal(ziel), token, type: 'sms' });
        if (error || !data.session) return { ok: false, fehler: fehlerText(error ?? 'Code ungültig') };
        await nachAnmeldung(data.session);
        return zustand.fehler && zustand.phase !== 'bereit' ? { ok: false, fehler: zustand.fehler } : { ok: true };
      } catch (e) {
        return { ok: false, fehler: fehlerText(e) };
      }
    },

    async abmelden() {
      laufenderSync()?.stoppen();
      try {
        await client.auth.signOut();
      } catch {
        /* lokal trotzdem abmelden */
      }
      kontoSetzen(undefined);
      setze({ phase: 'abgemeldet', fehler: undefined });
    },

    async einladen(mitarbeiterId, ziel) {
      if (!angemeldet()) return rueckfall.einladen(mitarbeiterId, ziel);
      const r = await serverAufruf<VersandErgebnis & { link?: string }>('einladen', { mitarbeiterId, ziel });
      if (r.status === 200 && r.daten?.status === 'gesendet') return { status: 'gesendet', id: r.daten.id };
      if (r.daten?.link) {
        // Kanal nicht verbunden: Einladung gibt es trotzdem – Link über das eigene Handy teilen
        const an = ziel.telefon ?? ziel.email ?? '';
        const lokal = await rueckfall.senden({
          an,
          kanal: ziel.telefon ? 'sms' : 'email',
          betreff: 'Einladung zu Handwerk OS',
          text: 'Du bist zu Handwerk OS eingeladen. Tippe auf den Link und melde dich an:',
          link: r.daten.link,
        });
        return { ...lokal, id: r.daten.id };
      }
      if (r.status === 501 || r.status === 0) return rueckfall.einladen(mitarbeiterId, ziel);
      return { status: 'fehler', fehler: (r.daten as { fehler?: string } | undefined)?.fehler ?? 'Einladen hat nicht geklappt.' };
    },

    async senden(v: Versand) {
      if (!angemeldet()) return rueckfall.senden(v);
      const r = await serverAufruf<VersandErgebnis & { fehler?: string }>('senden', { versand: v });
      if (r.status === 200 && r.daten) return r.daten;
      // nicht verbunden (z. B. WhatsApp) oder offline → eigenes Mail-/SMS-Programm
      if (r.status === 501 || r.status === 0) return rueckfall.senden(v);
      return { status: 'fehler', fehler: r.daten?.fehler ?? 'Versand hat nicht geklappt.' };
    },

    async push(n: PushNachricht) {
      if (!angemeldet()) return rueckfall.push(n);
      await serverAufruf('push', { nachricht: n });
    },

    async oeffentlichLesen<T = unknown>(art: 'portal' | 'buchung', token: string): Promise<T | undefined> {
      try {
        const r = await holen(`${konfig.apiBasis ?? ''}/api/cloud/oeffentlich?art=${art}&token=${encodeURIComponent(token)}`);
        if (!r.ok) return undefined;
        return (await r.json()) as T;
      } catch {
        return undefined;
      }
    },

    async dateiAblegen(datei, name) {
      if (!konto?.betriebId) return rueckfall.dateiAblegen(datei, name);
      const sauber = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'datei';
      const pfad = `${konto.betriebId}/${neueId().replace(/[^\w-]/g, '')}-${sauber}`;
      try {
        const { error } = await client.storage.from('dateien').upload(pfad, datei, { contentType: datei.type || undefined, upsert: false });
        if (error) throw error;
        // privater Speicher: dauerhafter, signierter Link über den Server
        const r = await serverAufruf<{ url?: string }>('datei', { pfad });
        if (r.status !== 200 || !r.daten?.url) throw new Error('Kein Link für die Datei');
        return r.daten.url;
      } catch {
        // offline o. Ä.: im Gerät behalten, damit nichts verloren geht
        return rueckfall.dateiAblegen(datei, name);
      }
    },

    // -------------------------------------------------------------- Zusätze für das Konto-Modul

    async starten() {
      setze({ konfiguriert: true, phase: konto?.betriebId ? 'bereit' : 'abgemeldet', konto, sicherung: lesen(K_SICHERUNG) });
      setzeMessziel(messziel);
      if (messPuffer.length) messTimer ??= setTimeout(messungSenden, 5000);
      // Offline-fähig: mit gespeichertem Konto sofort weiterarbeiten
      if (konto?.betriebId && lesen(K_DATEN_BETRIEB) === konto.betriebId) {
        void verbinden(konto.betriebId).catch((e) => setze({ fehler: fehlerText(e) }));
      }
      // Angemeldet mitten in der Einrichtung: sobald der Betrieb fertig eingerichtet ist, automatisch sichern
      let sichertGerade = false;
      subscribe(() => {
        if (sichertGerade || zustand.phase !== 'kein-betrieb' || !konto || !db.betrieb.get('betrieb')?.onboardingFertig) return;
        sichertGerade = true;
        setTimeout(() => void c.sichern().finally(() => (sichertGerade = false)), 0);
      });
      client.auth.onAuthStateChange((ereignis, session) => {
        // keine Supabase-Aufrufe direkt im Rückruf (Sperre in supabase-js) → entkoppeln
        setTimeout(() => {
          if (session && (ereignis === 'SIGNED_IN' || ereignis === 'INITIAL_SESSION')) {
            if (konto?.nutzerId === session.user.id && konto.betriebId && laufenderSync()) return;
            void nachAnmeldung(session);
          } else if (ereignis === 'SIGNED_OUT' || (ereignis === 'INITIAL_SESSION' && !session && konto)) {
            // abgemeldet (auch auf einem anderen Weg) – Daten bleiben auf dem Gerät, nur der Abgleich stoppt
            laufenderSync()?.stoppen();
            kontoSetzen(undefined);
            setze({ phase: 'abgemeldet' });
          }
        }, 0);
      });
    },

    einladungMerken(t) {
      schreiben(K_EINLADUNG, t);
    },

    async einladungAnnehmen(t) {
      const { data } = await client.auth.getSession();
      if (!data.session) {
        schreiben(K_EINLADUNG, t);
        return { ok: false, fehler: 'Bitte melde dich zuerst an.' };
      }
      schreiben(K_EINLADUNG, t);
      setze({ fehler: undefined });
      await nachAnmeldung(data.session, true);
      return zustand.fehler ? { ok: false, fehler: zustand.fehler } : { ok: true };
    },

    async sichern() {
      const { data } = await client.auth.getSession();
      if (!data.session) return { ok: false, fehler: 'Bitte melde dich zuerst an.' };
      try {
        const betriebId = await betriebAnlegen();
        kontoSetzen({ ...konto!, betriebId, rolle: 'chef', mitarbeiterId: ichId() });
        await verbinden(betriebId, { uebernahme: true });
        return { ok: true };
      } catch (e) {
        const fehler = fehlerText(e);
        setze({ fehler });
        return { ok: false, fehler };
      }
    },

    async pushEinschalten() {
      const nav = globalThis.navigator;
      if (!konfig.vapidKey) return { ok: false, fehler: 'Benachrichtigungen sind noch nicht verbunden.' };
      if (!konto?.betriebId) return { ok: false, fehler: 'Bitte melde dich zuerst an.' };
      if (!nav?.serviceWorker || !('PushManager' in globalThis)) {
        return { ok: false, fehler: 'Dieses Gerät kann keine Benachrichtigungen. Am iPhone: erst „Zum Home-Bildschirm“ hinzufügen, dann dort öffnen.' };
      }
      const reg = await Promise.race([nav.serviceWorker.ready, new Promise<undefined>((ok) => setTimeout(() => ok(undefined), 4000))]);
      if (!reg) return { ok: false, fehler: 'Installiere die App auf dem Startbildschirm, dann klappt es mit Benachrichtigungen.' };
      const erlaubnis = await Notification.requestPermission();
      if (erlaubnis !== 'granted') return { ok: false, fehler: 'Du hast Benachrichtigungen nicht erlaubt. Ändere das in den Einstellungen deines Browsers.' };
      try {
        const abo = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlZuBytes(konfig.vapidKey) }));
        const { error } = await client
          .from('push_abos')
          .upsert({ nutzer_id: konto.nutzerId, betrieb_id: konto.betriebId, abo: abo.toJSON(), geraet: geraetName() }, { onConflict: 'nutzer_id,abo' });
        if (error) throw new Error(error.message);
        return { ok: true };
      } catch (e) {
        return { ok: false, fehler: fehlerText(e) };
      }
    },

    async geraete() {
      if (!konto) return [];
      const { data, error } = await client.from('push_abos').select('abo,geraet,erstellt_am').eq('nutzer_id', konto.nutzerId).order('erstellt_am');
      if (error) throw new Error(error.message);
      let hier: string | undefined;
      try {
        const reg = await Promise.race([globalThis.navigator?.serviceWorker?.ready, new Promise<undefined>((ok) => setTimeout(() => ok(undefined), 500))]);
        hier = (await reg?.pushManager.getSubscription())?.endpoint;
      } catch {
        /* egal */
      }
      return (data ?? []).map((z: { abo: { endpoint: string }; geraet?: string; erstellt_am: string }) => ({
        endpoint: z.abo.endpoint,
        geraet: z.geraet ?? 'Gerät',
        seit: z.erstellt_am,
        diesesGeraet: z.abo.endpoint === hier,
      }));
    },

    async geraetEntfernen(endpoint) {
      if (!konto) return;
      const { error } = await client.from('push_abos').delete().eq('nutzer_id', konto.nutzerId).eq('abo->>endpoint', endpoint);
      if (error) throw new Error(error.message);
      try {
        const reg = await globalThis.navigator?.serviceWorker?.getRegistration();
        const abo = await reg?.pushManager.getSubscription();
        if (abo?.endpoint === endpoint) await abo.unsubscribe();
      } catch {
        /* egal */
      }
    },
  };
  return c;
}

let aktuelle: SupabaseCloud | undefined;

/** Die verbundene Supabase-Cloud (oder undefined ohne Schlüssel) – für das Konto-Modul */
export function supabaseCloud(): SupabaseCloud | undefined {
  return aktuelle;
}

/**
 * Beim App-Start: Mit Schlüsseln wird die Supabase-Cloud gesetzt (`setzeCloud`) und die Messung an den
 * Server gehängt (`setzeMessziel`). Ohne Schlüssel passiert nichts – die App bleibt lokal.
 */
export async function starteCloud(konfig: CloudKonfig | undefined = konfigAusUmgebung()): Promise<boolean> {
  if (!konfig) return false;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(konfig.url, konfig.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'macher-os:anmeldung' },
    });
    // Was bisher galt (z. B. E-Mail über /api/senden), bleibt der Rückfall ohne Konto
    aktuelle = erzeugeSupabaseCloud(client, konfig, { rueckfall: cloud() });
    setzeCloud(aktuelle);
    await aktuelle.starten();
    return true;
  } catch (e) {
    console.error('Cloud konnte nicht starten – die App arbeitet lokal weiter.', e);
    return false;
  }
}
