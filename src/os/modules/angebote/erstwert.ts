/**
 * Angebot in drei Minuten: Kunde · Positionen · Senden – und „Der Kunde hat dein Angebot geöffnet“.
 * Versand nur über den Cloud-Vertrag (mit Link zum Kundenbereich), lokal öffnet sich das Mailprogramm.
 */
import { db, neueId, vermerken } from '@core/db';
import type { Versand } from '@core/cloud';
import { benachrichtigen } from '@core/macher';
import { datum, euro, heute } from '@core/format';
import { messen } from '@core/messung';
import { naechsteNummer } from '@core/nummern';
import type { Angebot, Bezug, ID, Kunde, Position } from '@core/objects';
import { aktiverZugang, portalLink, zugangErzeugen } from '@modules/kundenbereich/daten';
import { frage, type GatewayKontext } from '@core/gateway';
import { darf, ich } from '@core/session';
import { satzAnfang, type Erkannt } from '@modules/start/sprache';
import { dokumentVersendet, sendenMitRueckfall, type SendeErgebnis } from '@modules/start/daten';
import { absenderVon, dokumentHtml, zeilenAus } from '@modules/start/emailHtml';
import { angebotSummen, neuesAngebot, positionAusArtikel, positionAusLeistung, versenden } from './daten';
import { POSITIONEN_VORSCHLAGEN, vorschlagAusRegeln, type PositionsVorschlag } from './vorschlag';

// ------------------------------------------------------------------ Positionen aus Text/Sprache

const KI_PFAD = '/api/ki/positionen';

export function erkanntAlsPosition(e: Erkannt): Position {
  if (e.leistung) return positionAusLeistung(e.leistung, e.menge);
  if (e.artikel) return positionAusArtikel(e.artikel, e.menge);
  return { id: neueId('p'), art: 'pauschal', text: satzAnfang(e.roh), menge: e.menge, einheit: e.einheit ?? 'Stk', einzelpreis: 0 };
}

/** ki = Claude · demo = KI-Demo ohne Schlüssel (lokaler Katalog-Abgleich, sichtbar beschriftet) · katalog = offline */
export type Erkennung = { positionen: Position[]; quelle: 'ki' | 'demo' | 'katalog' };

let kiStand: Promise<'ki' | 'demo' | 'aus'> | undefined;
/** Einmal beim Server nachfragen: echte KI, Demo (kein Schlüssel) oder gar nicht erreichbar */
export function kiModus(f: typeof fetch | undefined = globalThis.fetch): Promise<'ki' | 'demo' | 'aus'> {
  kiStand ??= (async () => {
    if (!f) return 'aus' as const;
    try {
      const r = await f(KI_PFAD, { method: 'GET' });
      if (!r.ok || !r.headers.get('content-type')?.includes('json')) return 'aus' as const;
      return ((await r.json()) as { ki?: boolean }).ki ? ('ki' as const) : ('demo' as const);
    } catch {
      return 'aus' as const;
    }
  })();
  return kiStand;
}
export const kiModusZuruecksetzen = () => (kiStand = undefined);

const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));


/**
 * Freitext oder Sprache → Positionsvorschlag, ausschließlich über den Macher AI Gateway (`offer.positions.suggest`):
 * zuerst Regeln (Katalog-Abgleich, Mengen, Einheiten, genannte Beträge), ein angeschlossenes Modell verbessert nur.
 * Ohne Server, ohne Schlüssel oder bei Ausfall gelten die Regeln. Preise kommen aus dem Katalog oder aus dem Satz.
 */
export async function positionenAusText(text: string, opts: { ki?: boolean; demoPauseMs?: number } = {}): Promise<Erkennung> {
  const modus = opts.ki === false ? 'aus' : await kiModus();
  const k: GatewayKontext = { heute: heute(), jetzt: new Date(), ich: ich(), darf: (r) => darf(r) };
  const r = await frage<PositionsVorschlag>(text, k, { absicht: POSITIONEN_VORSCHLAGEN });
  if (r.verweigert === 'rechte') return { positionen: [], quelle: 'katalog' };
  // Modul nicht geladen (z. B. in einem Test): dieselben Regeln, ohne Modell
  const v: PositionsVorschlag = r.ergebnis ?? { positionen: vorschlagAusRegeln(text, db.leistungen.where((l) => l.aktiv), db.artikel.where((a) => a.aktiv)), quelle: 'regeln' };
  if (v.quelle === 'ki') return { positionen: v.positionen, quelle: 'ki' };
  if (modus === 'demo') await pause(opts.demoPauseMs ?? 600);
  return { positionen: v.positionen, quelle: modus === 'demo' ? 'demo' : 'katalog' };
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

/** Das Angebot direkt in der E-Mail – Briefkopf, Positionen, Summen, Knopf zum Kundenbereich */
export function angebotHtml(a: Angebot, link?: string): string {
  const k = db.kunden.get(a.kundeId);
  const b = db.betrieb.get('betrieb');
  const s = angebotSummen(a);
  const ust = b?.kleinunternehmer ? 0 : (b?.ustSatz ?? 19);
  const name = k?.ansprechpartner[0]?.name ?? k?.name;
  return dokumentHtml({
    betrieb: b,
    titel: a.titel,
    daten: [
      ['Angebot', `${a.nummer}${a.version > 1 ? ` · Version ${a.version}` : ''}`],
      ['Datum', datum(a.datum)],
      ['Gültig bis', datum(a.gueltigBis)],
    ],
    absaetze: [`Guten Tag${name ? ' ' + name : ''},`, a.einleitung || 'vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen folgende Leistungen an:'],
    zeilen: zeilenAus(a.positionen),
    summen: [
      ...(s.rabatt > 0 ? ([[`Rabatt ${a.rabattProzent} %`, `− ${euro(s.rabatt)}`]] as [string, string][]) : []),
      ['Summe netto', euro(s.netto)],
      [ust ? `zzgl. ${ust} % USt.` : 'Keine USt. (Kleinunternehmer, § 19 UStG)', euro(s.ust)],
      ['Gesamtbetrag', euro(s.brutto), true],
    ],
    link: link ? { label: 'Angebot ansehen und annehmen', url: link } : undefined,
    schluss: ['Möchten Sie den Auftrag erteilen oder haben Sie Fragen? Antworten Sie einfach auf diese E-Mail.', 'Viele Grüße', b?.name ?? ''],
  });
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
  const r = await sendenMitRueckfall({ an: an.trim(), kanal, betreff, text, link, bezug, html: kanal === 'email' ? angebotHtml(a, link) : undefined, absender: absenderVon(db.betrieb.get('betrieb')) });
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
