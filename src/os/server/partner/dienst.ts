/**
 * Action API v1 – ein Aufruf von außen, Schritt für Schritt (Architektur: „HeyLotte versteht, Handwerk OS entscheidet“).
 *
 *   Schlüssel → Betrieb → Nutzer-Zuordnung → Mitarbeiter und Rolle → Recht → Bestätigung → Idempotenz
 *   → Eingabe prüfen → Geschäftslogik (`aktionen.ts`) → Schreiben + Verlauf → Protokoll → Ereignisse an den Partner
 *
 * Der Speicher ist austauschbar (`PartnerSpeicher`): Supabase in Betrieb (`supabase.ts`), im Test ein Objekt im Speicher.
 * Jeder Aufruf mit bekanntem Zugang landet in `api_aufrufe` – auch abgelehnte.
 */
import { RECHTE, rolleDarf, STANDARD_RECHTE, type Recht } from '@core/rechte';
import type { Mitarbeiter, Rolle } from '@core/objects';
import { partnerAktion, type Bestand, type ObjektZeile, type PartnerAktion, type VersandAuftrag } from './aktionen';
import { tokenPruefen, TOKEN_PRAEFIX } from './token';
import { auslieferungenFuer, type Auslieferung } from './webhook';

export const API_VERSION = 'v1';
/** Schlüssel beginnen so – erkennt man in Logs und beim Kopieren */
export const SCHLUESSEL_PRAEFIX = 'hos_';
/** Höchstens so viele Aufrufe je Zugang und Minute – darüber 429 mit `Retry-After` */
export const GRENZE_PRO_MINUTE = 120;

export interface Zugang {
  id: string;
  betrieb_id: string;
  partner: string;
  name: string;
  partner_workspace_id: string | null;
  webhook_url: string | null;
  webhook_geheimnis: string | null;
  ereignisse: string[];
  widerrufen_am: string | null;
}

export interface Aufruf {
  id: string;
  betrieb_id: string;
  zugang_id: string;
  partner_nutzer_id?: string | null;
  mitarbeiter_id?: string | null;
  version: string;
  aktion: string;
  idempotenz_schluessel?: string | null;
  status: number;
  ergebnis?: unknown;
  bezug?: unknown;
  zeit: string;
}

export interface PartnerSpeicher {
  zugangNachHash(hash: string): Promise<Zugang | undefined>;
  /** für kurzlebige Token (`hot_…`), die die Zugang-ID tragen */
  zugangNachId(id: string): Promise<Zugang | undefined>;
  /** Anzahl protokollierter Aufrufe des Zugangs seit dem Zeitpunkt (Begrenzung) */
  aufrufeSeit(zugangId: string, seit: string): Promise<number>;
  zugangGenutzt(zugangId: string, zeit: string): Promise<void>;
  /** Mitarbeiter-ID zu einem Nutzer des Partners */
  nutzerZuordnung(zugangId: string, partnerNutzerId: string): Promise<string | undefined>;
  /** Objekte der Sammlungen – inklusive Papierkorb, ohne endgültig gelöschte */
  objekte(betriebId: string, sammlungen: string[]): Promise<ObjektZeile[]>;
  /**
   * Aufruf mit Idempotenz-Schlüssel vormerken. `neu` = noch nie gesehen, sonst der frühere Aufruf
   * (Status 0 = läuft noch).
   */
  aufrufVormerken(a: Aufruf): Promise<'neu' | Aufruf>;
  /** Aufruf ins Protokoll schreiben (oder einen vorgemerkten abschließen) */
  aufrufSchreiben(a: Aufruf): Promise<void>;
  objekteSchreiben(betriebId: string, zeilen: ObjektZeile[]): Promise<void>;
  auslieferungenAnlegen(a: Auslieferung[]): Promise<void>;
  /** Nachricht an einen Kunden des Betriebs schicken (E-Mail, SMS, WhatsApp) – wie `/api/cloud/senden` */
  versenden(betriebId: string, v: VersandAuftrag): Promise<{ ok: true; id: string } | { ok: false; code: 'channel_unavailable' | 'delivery_failed'; fehler: string }>;
}

export interface Anfrage {
  aktion: string;
  /** Kopfzeile `Authorization` */
  autorisierung: string | null;
  /** Kopfzeile `Idempotency-Key` */
  idempotenz: string | null;
  body: unknown;
}

export interface Antwort {
  status: number;
  body: Record<string, unknown>;
  /** frisch angelegte Ereignisse – die Route stellt sie direkt nach der Antwort zu */
  auslieferungen: Auslieferung[];
  zugang?: Zugang;
  wiederholt?: boolean;
  /** zusätzliche Kopfzeilen, z. B. `retry-after` */
  kopf?: Record<string, string>;
}

export interface DienstOptionen {
  jetzt?: Date;
  neueId?: (praefix?: string) => string;
  /** Geheimnis der kurzlebigen Token – ohne werden `hot_…` abgelehnt */
  tokenGeheimnis?: string;
  grenzeProMinute?: number;
  /** Öffentliche Adresse der App für Links an Kunden */
  appUrl?: string;
  neuesToken?: () => string;
}

/** Felder, die zum Aufruf gehören und nicht zur Eingabe der Aktion */
const META = new Set(['organization_id', 'user_id', 'source', 'confirmed', 'idempotency_key']);

export async function sha256Hex(text: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 24 Zeichen, URL-sicher, nicht erratbar (wie `neuesToken` des Kundenbereichs) */
function zufallsToken(): string {
  const b = new Uint8Array(18);
  globalThis.crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const fehlerBody = (code: string, message: string, extra: Record<string, unknown> = {}) => ({ status: 'error', error: { code, message, ...extra } });

const rechtLabel = (r: Recht) => RECHTE.find((x) => x.id === r)?.label ?? r;

export async function bearbeite(anfrage: Anfrage, s: PartnerSpeicher, opts: DienstOptionen = {}): Promise<Antwort> {
  const jetzt = opts.jetzt ?? new Date();
  const neueId = opts.neueId ?? ((p?: string) => (p ? `${p}_${globalThis.crypto.randomUUID()}` : globalThis.crypto.randomUUID()));
  const zeit = jetzt.toISOString();
  const aufrufId = neueId('req');
  const ohne = (status: number, body: Record<string, unknown>): Antwort => ({ status, body: { ...body, request_id: aufrufId }, auslieferungen: [] });

  // 1. Schlüssel → Zugang → Betrieb
  const auth = anfrage.autorisierung?.trim() ?? '';
  const schluessel = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, '').trim() : '';
  let zugang: Zugang | undefined;
  if (schluessel.startsWith(SCHLUESSEL_PRAEFIX)) zugang = await s.zugangNachHash(await sha256Hex(schluessel));
  else if (schluessel.startsWith(TOKEN_PRAEFIX) && opts.tokenGeheimnis) {
    const id = await tokenPruefen(schluessel, opts.tokenGeheimnis, jetzt);
    if (id) zugang = await s.zugangNachId(id);
  }
  if (!zugang || zugang.widerrufen_am) return ohne(401, fehlerBody('unauthorized', 'API-Schlüssel oder Token fehlt, ist abgelaufen oder ungültig.'));

  // Begrenzung: schützt Betrieb und Datenbank, falls der Partner in eine Schleife gerät
  const grenze = opts.grenzeProMinute ?? GRENZE_PRO_MINUTE;
  if ((await s.aufrufeSeit(zugang.id, new Date(jetzt.getTime() - 60_000).toISOString())) >= grenze)
    return { ...ohne(429, fehlerBody('rate_limited', `Zu viele Aufrufe. Höchstens ${grenze} je Minute – bitte kurz warten.`, { retry_after: 60 })), kopf: { 'retry-after': '60' } };

  const aktion = partnerAktion(anfrage.aktion);
  const roh = anfrage.body && typeof anfrage.body === 'object' && !Array.isArray(anfrage.body) ? (anfrage.body as Record<string, unknown>) : undefined;
  const partnerNutzerId = typeof roh?.user_id === 'string' ? roh.user_id.trim().slice(0, 200) : '';
  const idemRoh = anfrage.idempotenz ?? (typeof roh?.idempotency_key === 'string' ? roh.idempotency_key : null);
  const idempotenz = idemRoh?.trim().slice(0, 200) || null;

  const aufruf: Aufruf = {
    id: aufrufId,
    betrieb_id: zugang.betrieb_id,
    zugang_id: zugang.id,
    partner_nutzer_id: partnerNutzerId || null,
    mitarbeiter_id: null,
    version: API_VERSION,
    aktion: anfrage.aktion.slice(0, 80),
    idempotenz_schluessel: null,
    status: 0,
    zeit,
  };
  // Ab hier wird jede Antwort protokolliert
  const antworte = async (status: number, body: Record<string, unknown>, extra: Partial<Aufruf> = {}, auslieferungen: Auslieferung[] = []): Promise<Antwort> => {
    const voll = { ...body, request_id: aufrufId };
    await s.aufrufSchreiben({ ...aufruf, ...extra, status, ergebnis: voll });
    return { status, body: voll, auslieferungen, zugang };
  };

  if (!aktion) return antworte(404, fehlerBody('unknown_action', `Die Aktion „${anfrage.aktion}“ gibt es nicht. Liste: GET /${API_VERSION}/actions`));
  if (!roh) return antworte(400, fehlerBody('invalid_body', 'Der Inhalt muss ein JSON-Objekt sein.'));

  // 2. Organisation: wer eine angibt, muss die des Schlüssels meinen (kein Zugriff auf fremde Betriebe)
  const org = roh.organization_id;
  if (org !== undefined && org !== zugang.betrieb_id && (zugang.partner_workspace_id === null || org !== zugang.partner_workspace_id))
    return antworte(403, fehlerBody('wrong_organization', 'Dieser Schlüssel gehört zu einem anderen Betrieb.'));

  // 3. Nutzer → Mitarbeiter → Rolle
  if (!partnerNutzerId) return antworte(400, fehlerBody('user_required', 'Wer spricht? „user_id“ fehlt.', { field: 'user_id' }));
  const mitarbeiterId = await s.nutzerZuordnung(zugang.id, partnerNutzerId);
  if (!mitarbeiterId) return antworte(403, fehlerBody('unknown_user', 'Dieser Nutzer ist noch keinem Mitarbeiter in Handwerk OS zugeordnet.'));
  aufruf.mitarbeiter_id = mitarbeiterId;

  const sammlungen = [...new Set(['mitarbeiter', 'einstellungen', ...aktion.liest])];
  const zeilen = await s.objekte(zugang.betrieb_id, sammlungen);
  const bestand: Bestand = {};
  for (const z of zeilen) (bestand[z.sammlung] ??= []).push({ ...z.daten, id: z.id });
  const m = (bestand.mitarbeiter ?? []).find((x) => x.id === mitarbeiterId) as Mitarbeiter | undefined;
  if (!m || m.geloeschtAm || !m.aktiv) return antworte(403, fehlerBody('inactive_user', 'Dieser Mitarbeiter ist in Handwerk OS nicht (mehr) aktiv.'));

  // 4. Rechte – dieselbe Matrix wie in der App (Einstellung `rollen.rechte`)
  const matrixZeile = (bestand.einstellungen ?? []).find((e) => e.id === 'rollen.rechte') as { wert?: Partial<Record<Rolle, Recht[]>> } | undefined;
  const matrix = matrixZeile?.wert ?? STANDARD_RECHTE;
  const rechte = (matrix[m.rolle] ?? []) as Recht[];
  const fehlt = aktion.rechte.filter((r) => !rolleDarf(m.rolle, r, matrix));
  if (fehlt.length) return antworte(403, fehlerBody('forbidden', `Dafür fehlt das Recht „${rechtLabel(fehlt[0])}“.`, { missing_permissions: fehlt }));

  // 5. Kritische Aktionen nur nach ausdrücklicher Bestätigung durch den Menschen
  if (aktion.risiko === 'kritisch' && roh.confirmed !== true)
    return antworte(409, { status: 'confirmation_required', message: 'Bitte erst beim Nutzer bestätigen und mit "confirmed": true erneut senden.', requires_confirmation: true });

  // 6. Idempotenz für schreibende Aktionen: gleicher Schlüssel → gleiche Antwort, nichts doppelt
  if (idempotenz && aktion.risiko !== 'lesen') {
    aufruf.idempotenz_schluessel = idempotenz;
    const frueher = await s.aufrufVormerken({ ...aufruf });
    if (frueher !== 'neu') {
      if (frueher.aktion !== aufruf.aktion) return ohne(422, fehlerBody('idempotency_conflict', 'Dieser Idempotency-Key wurde schon für eine andere Aktion benutzt.'));
      if (!frueher.status) return ohne(409, fehlerBody('in_progress', 'Dieser Aufruf läuft noch. Gleich noch einmal versuchen.'));
      return { status: frueher.status, body: (frueher.ergebnis ?? {}) as Record<string, unknown>, auslieferungen: [], zugang, wiederholt: true };
    }
  }

  try {
    // 7. Eingabe prüfen
    const eingabe = Object.fromEntries(Object.entries(roh).filter(([k]) => !META.has(k)));
    const geprueft = aktion.pruefe(eingabe);
    if ('fehler' in geprueft) return antworte(422, fehlerBody('invalid_input', geprueft.fehler, geprueft.feld ? { field: geprueft.feld } : {}));

    // 8. Ausführen
    const ergebnis = (aktion as PartnerAktion<unknown>).fuehreAus(
      geprueft.daten,
      { handelnder: { mitarbeiter: m, rechte }, jetzt, neueId, partnerName: zugang.name, appUrl: opts.appUrl ?? 'https://macher-os.de', neuesToken: opts.neuesToken ?? zufallsToken },
      bestand,
    );
    if (ergebnis.art === 'antwort') return antworte(ergebnis.status, ergebnis.antwort);

    // Erst senden, dann schreiben: Geht die Nachricht nicht raus, bleibt alles, wie es war
    let versandId: string | undefined;
    if (ergebnis.versand) {
      const v = await s.versenden(zugang.betrieb_id, ergebnis.versand);
      if (!v.ok) {
        // Schlüssel freigeben – der Partner darf es nach einer Korrektur erneut versuchen
        return antworte(v.code === 'channel_unavailable' ? 424 : 502, fehlerBody(v.code, v.fehler), { idempotenz_schluessel: null });
      }
      versandId = v.id;
    }

    // 9. Schreiben + Verlauf am Objekt (Quelle KI, Akteur = Partner, für den Mitarbeiter)
    const aenderung = ergebnis.aenderung ?? 'created';
    const verlauf: ObjektZeile = {
      sammlung: 'ereignisse',
      id: neueId('e'),
      daten: {
        id: '',
        erstelltAm: zeit,
        geaendertAm: zeit,
        erstelltVon: m.id,
        typ: `${ergebnis.bezug.typ}.${aenderung}`,
        bezug: ergebnis.bezug,
        text: ergebnis.verlauf,
        quelle: 'ai',
        akteurId: zugang.partner,
        vonMitarbeiterId: m.id,
        aenderung,
        daten: { partner: zugang.partner, aktion: aktion.name, requestId: aufrufId, ...(versandId ? { versandId } : {}) },
      },
    };
    verlauf.daten.id = verlauf.id;
    // weitere betroffene Objekte (z. B. der Auftrag zu einem neuen Angebot) bekommen ihren eigenen Verlaufseintrag
    const weitere: ObjektZeile[] = (ergebnis.weitereVerlaeufe ?? []).map((w) => {
      const id = neueId('e');
      return { sammlung: 'ereignisse', id, daten: { ...verlauf.daten, id, typ: `${w.bezug.typ}.${w.aenderung}`, bezug: w.bezug, text: w.text, aenderung: w.aenderung } };
    });
    await s.objekteSchreiben(zugang.betrieb_id, [...ergebnis.zeilen, verlauf, ...weitere]);

    // 10. Ereignisse an den Partner vormerken
    const auslieferungen = auslieferungenFuer(zugang, ergebnis.ereignisse, { zeit, neueId, partnerNutzerId, requestId: aufrufId });
    if (auslieferungen.length) await s.auslieferungenAnlegen(auslieferungen);
    await s.zugangGenutzt(zugang.id, zeit).catch(() => undefined);
    return antworte(ergebnis.status, ergebnis.antwort, { bezug: ergebnis.bezug }, auslieferungen);
  } catch (e) {
    // Idempotenz-Schlüssel wieder freigeben, damit der Partner es erneut versuchen kann
    await s.aufrufSchreiben({ ...aufruf, idempotenz_schluessel: null, status: 500, ergebnis: fehlerBody('internal', e instanceof Error ? e.message.slice(0, 300) : 'Fehler') }).catch(() => undefined);
    throw e;
  }
}
