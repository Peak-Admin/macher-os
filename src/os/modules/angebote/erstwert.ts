/**
 * Angebot in drei Minuten: Kunde · Positionen · Senden – und „Der Kunde hat dein Angebot geöffnet“.
 * Versand nur über den Cloud-Vertrag (mit Link zum Kundenbereich), lokal öffnet sich das Mailprogramm.
 */
import { db, neueId, vermerken } from '@core/db';
import type { Versand } from '@core/cloud';
import { benachrichtigen } from '@core/macher';
import { datum, euro } from '@core/format';
import { messen } from '@core/messung';
import { naechsteNummer } from '@core/nummern';
import type { Angebot, Bezug, Einheit, ID, Kunde, Leistung, Position } from '@core/objects';
import { aktiverZugang, portalLink, zugangErzeugen } from '@modules/kundenbereich/daten';
import { positionenErkennen, satzAnfang, type Erkannt } from '@modules/start/sprache';
import { dokumentVersendet, sendenMitRueckfall, type SendeErgebnis } from '@modules/start/daten';
import { angebotSummen, neuesAngebot, positionAusArtikel, positionAusLeistung, versenden } from './daten';

// ------------------------------------------------------------------ Positionen aus Text/Sprache

export function erkanntAlsPosition(e: Erkannt): Position {
  if (e.leistung) return positionAusLeistung(e.leistung, e.menge);
  if (e.artikel) return positionAusArtikel(e.artikel, e.menge);
  return { id: neueId('p'), art: 'pauschal', text: satzAnfang(e.roh), menge: e.menge, einheit: e.einheit ?? 'Stk', einzelpreis: 0 };
}

export type Erkennung = { positionen: Position[]; quelle: 'ki' | 'katalog' };

const KI_PFAD = '/api/ki/positionen';

/**
 * Optional besser über Claude (Server-Funktion `os/api/ki/positionen.ts`). Ohne Schlüssel antwortet sie 501,
 * ohne Server gibt es keine Antwort – dann gilt der lokale Parser. Preise kommen immer aus dem Katalog.
 */
export async function kiErkennen(text: string, leistungen: Leistung[], ms = 4000): Promise<Position[] | undefined> {
  if (typeof fetch === 'undefined') return undefined;
  const abbruch = new AbortController();
  const t = setTimeout(() => abbruch.abort(), ms);
  try {
    const res = await fetch(KI_PFAD, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, katalog: leistungen.map((l) => ({ id: l.id, name: l.name, einheit: l.einheit })) }),
      signal: abbruch.signal,
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
    const daten = (await res.json()) as { positionen?: { leistungId?: string | null; text?: string; menge?: number; einheit?: string }[] };
    if (!Array.isArray(daten.positionen) || !daten.positionen.length) return undefined;
    return daten.positionen.map((p) => {
      const l = leistungen.find((x) => x.id === p.leistungId);
      const menge = typeof p.menge === 'number' && p.menge > 0 ? p.menge : 1;
      if (l) return positionAusLeistung(l, menge);
      return { id: neueId('p'), art: 'pauschal', text: satzAnfang(p.text ?? ''), menge, einheit: (p.einheit as Einheit) || 'Stk', einzelpreis: 0 };
    });
  } catch {
    return undefined;
  } finally {
    clearTimeout(t);
  }
}

/** Erst KI (falls verbunden), sonst lokal gegen den Katalog */
export async function positionenAusText(text: string, opts: { ki?: boolean } = {}): Promise<Erkennung> {
  const leistungen = db.leistungen.where((l) => l.aktiv);
  if (opts.ki !== false) {
    const ki = await kiErkennen(text, leistungen);
    if (ki) return { positionen: ki, quelle: 'ki' };
  }
  const artikel = db.artikel.where((a) => a.aktiv);
  return { positionen: positionenErkennen(text, leistungen, artikel).map(erkanntAlsPosition), quelle: 'katalog' };
}

// ------------------------------------------------------------------ Kunde

export interface KundeEingabe {
  kundeId?: ID;
  name: string;
  /** E-Mail oder Telefon */
  kontakt: string;
}

/** Bestehenden Kunden ergänzen oder neuen anlegen (Name + Telefon oder E-Mail reicht) */
export function kundeSichern(k: KundeEingabe): Kunde {
  const kontakt = k.kontakt.trim();
  const istMail = kontakt.includes('@');
  const vorhanden = k.kundeId ? db.kunden.get(k.kundeId) : undefined;
  if (vorhanden) {
    const patch: Partial<Kunde> = {};
    if (kontakt && istMail && vorhanden.email !== kontakt) patch.email = kontakt;
    if (kontakt && !istMail && vorhanden.telefon !== kontakt) patch.telefon = kontakt;
    return Object.keys(patch).length ? db.kunden.update(vorhanden.id, patch, { text: 'Kontakt beim Angebot ergänzt' })! : vorhanden;
  }
  return db.kunden.create({
    art: 'privat',
    name: k.name.trim(),
    email: istMail ? kontakt : undefined,
    telefon: !istMail && kontakt ? kontakt : undefined,
    ansprechpartner: [],
    quelle: 'telefon',
  });
}

// ------------------------------------------------------------------ Anlegen und senden

/** Titel aus den Positionen, falls keiner angegeben ist */
export function titelAus(positionen: Position[]): string {
  const erste = positionen.find((p) => p.art !== 'text' && p.text.trim());
  if (!erste) return 'Angebot';
  const kurz = erste.text.replace(/\s+(inkl\.?|inklusive)\s.*$/i, '').trim();
  return positionen.filter((p) => p.art !== 'text').length > 1 ? `${kurz} u. a.` : kurz;
}

/** Auftrag (Phase Angebot) + Angebotsentwurf in einem Schritt – das Angebot hängt immer an einem Auftrag */
export function schnellAngebotAnlegen(kundeId: ID, positionen: Position[], kopf: { titel?: string; gueltigBis?: string; rabattProzent?: number; einleitung?: string } = {}): Angebot {
  const titel = kopf.titel?.trim() || titelAus(positionen);
  const auftrag = db.auftraege.create({ nummer: naechsteNummer('auftrag'), titel, art: 'kundendienst', phase: 'anfrage', kundeId });
  const a = neuesAngebot(auftrag.id, positionen);
  const patch: Partial<Angebot> = { titel };
  if (kopf.gueltigBis) patch.gueltigBis = kopf.gueltigBis;
  if (kopf.rabattProzent) patch.rabattProzent = kopf.rabattProzent;
  if (kopf.einleitung?.trim()) patch.einleitung = kopf.einleitung.trim();
  return db.angebote.update(a.id, patch, { leise: true }) ?? a;
}

/** Nachricht an den Kunden (Sie-Form) */
export function angebotNachricht(a: Angebot, kanal: Versand['kanal']): { betreff: string; text: string } {
  const k = db.kunden.get(a.kundeId);
  const b = db.betrieb.get('betrieb');
  const s = angebotSummen(a);
  const betreff = `Angebot ${a.nummer}${a.version > 1 ? ` (Version ${a.version})` : ''} – ${a.titel}`;
  const name = k?.ansprechpartner[0]?.name ?? k?.name;
  if (kanal !== 'email')
    return {
      betreff,
      text: `Guten Tag${name ? ' ' + name : ''}, hier ist unser Angebot ${a.nummer} „${a.titel}“ über ${euro(s.brutto)}. Sie können es unter diesem Link ansehen und direkt annehmen. Viele Grüße, ${b?.name ?? ''}`.trim(),
    };
  return {
    betreff,
    text: [
      `Guten Tag${name ? ' ' + name : ''},`,
      '',
      `vielen Dank für Ihre Anfrage. Unser Angebot ${a.nummer} für „${a.titel}“ finden Sie unter dem Link unten – dort können Sie es ansehen, als PDF speichern und direkt annehmen.`,
      `Gesamtsumme: ${euro(s.brutto)} (inkl. USt.)`,
      `Gültig bis: ${datum(a.gueltigBis)}`,
      '',
      'Bei Fragen melden Sie sich gern. Wir freuen uns auf Ihren Auftrag.',
      '',
      'Viele Grüße',
      b?.name ?? '',
      b?.telefon ?? '',
    ].join('\n'),
  };
}

/** Link zum Kundenbereich – vorhandenen Zugang nutzen oder neuen erzeugen (Modul Kundenbereich) */
export function kundenLink(kundeId: ID, angebotId?: ID): string {
  const z = aktiverZugang(kundeId) ?? zugangErzeugen(kundeId);
  return portalLink(z.token, undefined, angebotId);
}

/**
 * Angebot senden: Cloud-Versand mit Link, sonst Mail-/SMS-Programm. Danach ist das Angebot „versendet“,
 * Nachfassen läuft, Event `dokument.versendet` und Messpunkt `erstwert.dokument_versendet` sind gesetzt.
 */
export async function angebotSenden(angebotId: ID, an: string, kanal: Versand['kanal'], opts: { sekunden?: number } = {}): Promise<SendeErgebnis> {
  const a = db.angebote.get(angebotId);
  if (!a) return { status: 'fehler', fehler: 'Angebot nicht gefunden.' };
  const link = kundenLink(a.kundeId, a.id);
  const { betreff, text } = angebotNachricht(a, kanal);
  const bezug: Bezug = { typ: 'angebote', id: a.id };
  const r = await sendenMitRueckfall({ an: an.trim(), kanal, betreff, text, link, bezug });
  if (r.status === 'fehler') return r;
  if (a.status === 'entwurf') versenden(a.id, kanal === 'email' ? 'email' : 'anders');
  const wie = kanal === 'sms' ? 'SMS' : kanal === 'whatsapp' ? 'WhatsApp' : 'E-Mail';
  vermerken(bezug, 'dokument.versendet', r.status === 'gesendet' ? `Per ${wie} an ${an.trim()} verschickt` : `${wie} an ${an.trim()} vorbereitet (im eigenen Programm geöffnet)`, { kanal, status: r.status });
  dokumentVersendet(bezug, kanal, r, opts.sekunden);
  return r;
}

// ------------------------------------------------------------------ Kunde hat geöffnet

/** Wann der Kunde das Angebot zuerst geöffnet hat */
export function geoeffnetAm(angebotId: ID): string | undefined {
  return db.angebote.get(angebotId)?.geoeffnetAm;
}

/**
 * Reaktion auf `portal.geoeffnet` { kundeId, bezug }: Bezieht sich der Aufruf auf ein Angebot, gilt er diesem –
 * sonst allen versendeten, noch nicht geöffneten Angeboten des Kunden (der Kunde sieht sie im Kundenbereich).
 * Beim ersten Öffnen: Vermerk am Angebot, Benachrichtigung, Messpunkt. Danach nichts Doppeltes.
 */
export function portalGeoeffnet(daten: { kundeId?: ID; bezug?: Bezug } | undefined, zeit = new Date().toISOString()): Angebot[] {
  if (!daten) return [];
  const direkt = daten.bezug?.typ === 'angebote' ? db.angebote.get(daten.bezug.id) : undefined;
  const kundeId = daten.kundeId ?? direkt?.kundeId;
  const kandidaten = direkt ? [direkt] : kundeId ? db.angebote.where((a) => a.kundeId === kundeId && a.status === 'versendet') : [];
  const neu = kandidaten.filter((a) => !geoeffnetAm(a.id));
  const kunde = db.kunden.get(kundeId);
  for (const a of neu) {
    db.angebote.update(a.id, { geoeffnetAm: zeit }, { text: 'Vom Kunden geöffnet' });
    vermerken({ typ: 'angebote', id: a.id }, 'angebot.geoeffnet', 'Der Kunde hat das Angebot geöffnet');
    vermerken({ typ: 'auftraege', id: a.auftragId }, 'angebot.geoeffnet', `Angebot ${a.nummer} vom Kunden geöffnet`);
    benachrichtigen(`${kunde?.name ?? 'Dein Kunde'} hat dein Angebot geöffnet`, {
      text: `${a.nummer} · ${a.titel} · ${euro(angebotSummen(a).brutto)}`,
      bezug: { typ: 'angebote', id: a.id },
      wichtig: true,
    });
    const minuten = a.versendetAm ? Math.max(0, Math.round((Date.parse(zeit) - Date.parse(a.versendetAm)) / 60000)) : undefined;
    messen('erstwert.dokument_geoeffnet', { art: 'angebote', ...(minuten !== undefined ? { minutenNachVersand: minuten } : {}) });
  }
  return neu;
}
