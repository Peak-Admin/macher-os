/**
 * Öffentliche Links für echte Kunden (Kundenbereich `/k/:token`, Terminbuchung `/buchen/:token`).
 *
 * Ablauf mit Backend:
 * 1. Die App des Betriebs legt je gültigem Link eine **öffentliche Sicht** ab (`oeffentliche_sichten`, ID = Token) –
 *    nur das, was der Kunde sehen darf. Über den Sync landet sie in `objekte`.
 * 2. Der Kunde öffnet den Link auf seinem Gerät → `cloud().oeffentlichLesen(art, token)` bzw. die Server-Funktion
 *    `/api/oeffentlich/lesen` liefert die Sicht.
 * 3. Was der Kunde tut, schickt `oeffentlichSenden()` an `/api/oeffentlich/aktion` → `oeffentliche_eingaben` beim Betrieb.
 *    Die App verarbeitet jede Eingabe einmal mit derselben Logik wie im Büro (`eingabenVerarbeiten`).
 *
 * Ohne Backend (lokaler Rückfall) funktionieren die Links nur im selben Browser – dort wird direkt aus der Datenschicht gelesen.
 */
import { db, defineCollection, vermerken } from '@core/db';
import { cloud, cloudAktiv } from '@core/cloud';
import { emit } from '@core/events';
import { benachrichtigen } from '@core/macher';
import { istBuero } from '@core/session';
import { briefkopf } from '@ui/druck';
import { heute } from '@core/format';
import type { Basis, Bezug, Datum, ID, Position, Zeitpunkt } from '@core/objects';
import { angebotEntscheidbar, angebotEntscheiden, bruttoVon, nachrichtSenden, portalDaten, portalzugaenge, rechnungStatusKunde, zugangPruefen, zugangZuToken, type Portalzugang } from './daten';

export type OeffentlicheArt = 'portal' | 'buchung';

export interface OeffentlicheSicht extends Basis {
  art: OeffentlicheArt;
  token: string;
  gueltigBis?: Datum;
  widerrufen?: boolean;
  sicht: unknown;
}

export type EingabeTyp = 'geoeffnet' | 'nachricht' | 'angebot' | 'buchung';

export interface OeffentlicheEingabe extends Basis {
  art: OeffentlicheArt;
  token: string;
  typ: EingabeTyp;
  daten: Record<string, unknown>;
  verarbeitetAm?: Zeitpunkt;
  ergebnis?: string;
}

export const oeffentlicheSichten = defineCollection<OeffentlicheSicht>('oeffentliche_sichten');
export const oeffentlicheEingaben = defineCollection<OeffentlicheEingabe>('oeffentliche_eingaben');

// ------------------------------------------------------------------ Betrieb-Kopf (für den Rahmen beim Kunden)

export interface BetriebKopf {
  name: string;
  telefon?: string;
  /** Logo nur als echte URL oder kleine Data-URL */
  logo?: string;
  fusszeilen: string[];
}

export function betriebKopf(): BetriebKopf {
  const b = db.betrieb.get('betrieb');
  const k = briefkopf();
  return {
    name: b?.name || 'Ihr Handwerksbetrieb',
    telefon: b?.telefon || undefined,
    logo: k.logo && (!k.logo.startsWith('data:') || k.logo.length < 150_000) ? k.logo : undefined,
    fusszeilen: k.fusszeilen,
  };
}

// ------------------------------------------------------------------ Portal-Sicht

type Ton = 'neutral' | 'aktiv' | 'erfolg' | 'achtung';

export interface PortalSicht {
  stand: Zeitpunkt;
  betrieb: BetriebKopf;
  kunde: { id: ID; name: string };
  termine: { id: ID; titel: string; start: string; ende: string; status: string; ort?: string }[];
  angebote: {
    id: ID;
    nummer: string;
    titel: string;
    datum: Datum;
    gueltigBis: Datum;
    status: string;
    entschiedenAm?: Zeitpunkt;
    einleitung?: string;
    brutto: number;
    positionen: Pick<Position, 'id' | 'art' | 'text' | 'menge' | 'einheit' | 'einzelpreis' | 'optional'>[];
  }[];
  rechnungen: { id: ID; titel: string; nummer: string; datum: Datum; brutto: number; status: { text: string; ton: Ton } }[];
  dokumente: { id: ID; titel: string; erstelltAm: Zeitpunkt; url?: string; text?: string }[];
  auftraege: { id: ID; titel: string }[];
}

/** Was der Kunde im Kundenbereich sieht – als reine Daten (lokal live, beim Kunden aus der Sicht vom Server) */
export function portalSicht(kundeId: ID, jetzt = new Date()): PortalSicht | undefined {
  const kunde = db.kunden.get(kundeId);
  if (!kunde || kunde.geloeschtAm) return undefined;
  const d = portalDaten(kundeId, jetzt);
  return {
    stand: jetzt.toISOString(),
    betrieb: betriebKopf(),
    kunde: { id: kunde.id, name: kunde.name },
    termine: d.termine.map((t) => ({ id: t.id, titel: t.titel || 'Termin', start: t.start, ende: t.ende, status: t.status, ort: t.ortId ? db.orte.get(t.ortId)?.adresse.strasse : undefined })),
    angebote: d.angebote.map((a) => ({
      id: a.id,
      nummer: a.nummer,
      titel: a.titel,
      datum: a.datum,
      gueltigBis: a.gueltigBis,
      status: a.status,
      entschiedenAm: a.entschiedenAm,
      einleitung: a.einleitung,
      brutto: bruttoVon(a.positionen, a.rabattProzent),
      positionen: a.positionen.map((p) => ({ id: p.id, art: p.art, text: p.text, menge: p.menge, einheit: p.einheit, einzelpreis: p.einzelpreis, optional: p.optional })),
    })),
    rechnungen: d.rechnungen.map((r) => ({ id: r.id, titel: r.titel, nummer: r.nummer, datum: r.datum, brutto: bruttoVon(r.positionen), status: rechnungStatusKunde(r) })),
    // Dateien nur als echte URL (Storage) – große Data-URLs gehören nicht in die öffentliche Sicht
    dokumente: d.dokumente.map((x) => ({ id: x.id, titel: x.titel, erstelltAm: x.erstelltAm, url: x.url && !x.url.startsWith('data:') ? x.url : undefined, text: x.text?.slice(0, 200) })),
    auftraege: db.auftraege.where((a) => a.kundeId === kundeId && a.phase !== 'verloren').map((a) => ({ id: a.id, titel: a.titel || a.nummer })),
  };
}

export const sichtAngebotEntscheidbar = (a: Pick<PortalSicht['angebote'][number], 'status' | 'gueltigBis'>, stichtag = heute()) =>
  angebotEntscheidbar({ status: a.status as never, gueltigBis: a.gueltigBis }, stichtag);

// ------------------------------------------------------------------ Laden und Senden (Kundengerät)

const API = '/api/oeffentlich';

/**
 * Öffentliche Sicht vom Server laden: zuerst über den Cloud-Vertrag, sonst direkt über die eigene Server-Funktion.
 * `undefined` = nicht gefunden oder kein Backend (dann gilt der lokale Rückfall).
 */
export async function oeffentlichLaden<T>(art: OeffentlicheArt, token: string): Promise<T | undefined> {
  try {
    const ueberCloud = await cloud().oeffentlichLesen<T>(art, token);
    if (ueberCloud !== undefined) return ueberCloud;
  } catch {
    /* weiter mit der Server-Funktion */
  }
  try {
    const r = await fetch(`${API}/lesen?art=${art}&token=${encodeURIComponent(token)}`, { headers: { accept: 'application/json' } });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return undefined;
    const j = (await r.json()) as { sicht?: T };
    return j.sicht;
  } catch {
    return undefined;
  }
}

export async function oeffentlichSenden(e: { art: OeffentlicheArt; token: string; typ: EingabeTyp; daten?: Record<string, unknown> }): Promise<{ ok: true } | { ok: false; fehler: string }> {
  try {
    const r = await fetch(`${API}/aktion`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...e, daten: e.daten ?? {} }) });
    if (r.ok) return { ok: true };
    const j = (await r.json().catch(() => ({}))) as { fehler?: string };
    return { ok: false, fehler: r.status === 501 ? 'Das geht gerade nicht online. Bitte rufen Sie uns kurz an.' : (j.fehler ?? 'Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.') };
  } catch {
    return { ok: false, fehler: 'Keine Verbindung. Bitte prüfen Sie Ihr Internet und versuchen Sie es noch einmal.' };
  }
}

// ------------------------------------------------------------------ Veröffentlichen (Gerät des Betriebs)

/** Sicht ablegen – nur wenn sich etwas geändert hat (sonst kein Sync, keine Schleife) */
export function sichtSpeichern(art: OeffentlicheArt, token: string, sicht: unknown, opts: { gueltigBis?: Datum; widerrufen?: boolean } = {}): boolean {
  const alt = oeffentlicheSichten.get(token);
  const ohneStand = (s: unknown) => JSON.stringify(s, (k, v) => (k === 'stand' ? undefined : v));
  if (alt && alt.art === art && alt.gueltigBis === opts.gueltigBis && !!alt.widerrufen === !!opts.widerrufen && ohneStand(alt.sicht) === ohneStand(sicht)) return false;
  if (alt) oeffentlicheSichten.update(token, { art, sicht, gueltigBis: opts.gueltigBis, widerrufen: opts.widerrufen }, { leise: true });
  else oeffentlicheSichten.create({ id: token, art, token, sicht, gueltigBis: opts.gueltigBis, widerrufen: opts.widerrufen }, { leise: true });
  return true;
}

/** Portal-Sichten aller Zugänge aktualisieren (gesperrte/abgelaufene werden als ungültig markiert). */
export function portalSichtenVeroeffentlichen(jetzt = new Date()): number {
  let n = 0;
  for (const z of portalzugaenge.allMitGeloeschten()) {
    const p = zugangPruefen(z);
    const sicht = p.ok ? portalSicht(z.kundeId, jetzt) : undefined;
    if (!sicht) {
      if (oeffentlicheSichten.get(z.token)) n += Number(sichtSpeichern('portal', z.token, null, { gueltigBis: z.gueltigBis, widerrufen: true }));
      continue;
    }
    n += Number(sichtSpeichern('portal', z.token, sicht, { gueltigBis: z.gueltigBis }));
  }
  return n;
}

/**
 * Nur mit Backend sinnvoll (lokal liest der Kunde ohnehin direkt aus der Datenschicht) – und nur auf Geräten
 * von Chef/Büro, damit nicht jedes Monteur-Handy dieselbe Arbeit doppelt macht.
 */
export const veroeffentlichenNoetig = () => cloudAktiv() && istBuero();

// ------------------------------------------------------------------ „Kunde hat geöffnet“

/** `?bezug=angebote:<id>` → { typ, id } */
export function bezugAusSuche(suche: string): Bezug | undefined {
  const roh = new URLSearchParams(suche).get('bezug');
  const m = roh?.match(/^([a-z_-]+):([\w-]+)$/i);
  return m ? { typ: m[1], id: m[2] } : undefined;
}

/**
 * Kundenbereich wurde geöffnet: Event `portal.geoeffnet` { kundeId, bezug } und Vermerk im Zeitstrahl.
 * `quelle`: 'lokal' = im selben Browser (z. B. Vorschau), 'server' = beim Kunden auf seinem Gerät.
 */
export function portalGeoeffnet(zugang: Portalzugang, bezug: Bezug | undefined, quelle: 'lokal' | 'server', zeit = new Date().toISOString()) {
  const b: Bezug = bezug ?? { typ: 'kunden', id: zugang.kundeId };
  portalzugaenge.update(zugang.id, { letzterZugriffAm: zeit }, { leise: true });
  const text = b.typ === 'angebote' ? `Kundenbereich geöffnet (Angebot ${db.angebote.get(b.id)?.nummer ?? ''})`.replace(' ()', '') : 'Kundenbereich geöffnet';
  vermerken({ typ: 'kunden', id: zugang.kundeId }, 'portal.geoeffnet', text, { quelle, zeit });
  if (b.typ !== 'kunden') vermerken(b, 'portal.geoeffnet', 'Kunde hat den Kundenbereich geöffnet', { quelle, zeit });
  emit({ typ: 'portal.geoeffnet', sammlung: 'kunden', objekt: db.kunden.get(zugang.kundeId), daten: { kundeId: zugang.kundeId, bezug: b, quelle, zeit } });
}

// ------------------------------------------------------------------ Eingaben vom Kunden verarbeiten

type Verarbeiter = (e: OeffentlicheEingabe) => string;
const verarbeiter = new Map<OeffentlicheArt, Verarbeiter>();

export function eingabeVerarbeiter(art: OeffentlicheArt, f: Verarbeiter) {
  verarbeiter.set(art, f);
}

/** Alle noch offenen Eingaben genau einmal verarbeiten */
export function eingabenVerarbeiten(): number {
  // Nur ein Gerät-Typ verarbeitet (Chef/Büro) – Monteur-Handys warten auf den Abgleich
  if (!istBuero()) return 0;
  let n = 0;
  for (const e of oeffentlicheEingaben.where((x) => !x.verarbeitetAm).sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm))) {
    const f = verarbeiter.get(e.art);
    if (!f) continue;
    // zuerst markieren – eine Eingabe darf nie doppelt wirken
    oeffentlicheEingaben.update(e.id, { verarbeitetAm: new Date().toISOString() }, { leise: true });
    let ergebnis: string;
    try {
      ergebnis = f(e);
    } catch (err) {
      ergebnis = `Fehler: ${err instanceof Error ? err.message : String(err)}`;
    }
    oeffentlicheEingaben.update(e.id, { ergebnis }, { leise: true });
    n++;
  }
  return n;
}

/** Portal-Eingaben: dieselben Funktionen wie im lokalen Kundenbereich */
export function portalEingabe(e: OeffentlicheEingabe): string {
  const z = zugangZuToken(e.token);
  const p = zugangPruefen(z);
  if (!p.ok) return `Link ungültig (${p.grund})`;
  const kundeId = p.zugang.kundeId;
  const d = e.daten;
  if (e.typ === 'geoeffnet') {
    const roh = typeof d.bezug === 'string' ? d.bezug : undefined;
    portalGeoeffnet(p.zugang, roh ? bezugAusSuche(`?bezug=${roh}`) : undefined, 'server', e.erstelltAm);
    return 'geöffnet';
  }
  if (e.typ === 'nachricht') {
    const r = nachrichtSenden(kundeId, String(d.text ?? ''), typeof d.auftragId === 'string' ? d.auftragId : undefined);
    return r.ok ? 'Nachricht angelegt' : r.fehler;
  }
  if (e.typ === 'angebot') {
    const r = angebotEntscheiden(kundeId, String(d.angebotId ?? ''), d.entscheidung === 'abgelehnt' ? 'abgelehnt' : 'angenommen', String(d.name ?? ''));
    if (r.ok) return `Angebot ${d.entscheidung}`;
    // Der Kunde hat „angekommen“ gesehen – also muss das Büro Bescheid wissen
    benachrichtigen(`Antwort auf Angebot nicht übernommen: ${db.kunden.get(kundeId)?.name ?? 'Kunde'}`, {
      text: `${String(d.name ?? '')} wollte das Angebot ${d.entscheidung === 'abgelehnt' ? 'ablehnen' : 'annehmen'}: ${r.fehler} Bitte kurz anrufen.`,
      bezug: { typ: 'angebote', id: String(d.angebotId ?? '') },
      wichtig: true,
    });
    return r.fehler;
  }
  return 'unbekannt';
}
