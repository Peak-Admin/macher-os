/**
 * Bewertungen & Empfehlungen.
 *
 * Eigene Sammlung `bewertungen` mit zwei Arten:
 * - `anfrage`: Bewertungsanfrage zu einem erledigten Auftrag (vorbereitet → gesendet / verworfen),
 *   optional mit interner Zufriedenheit (1–5), die das Büro nach Rückmeldung einträgt.
 * - `empfehlung`: Kunde X wurde von Kunde Y empfohlen.
 *
 * Es werden nie Bewertungen erfunden oder öffentliche Sterne gespeichert –
 * wir merken uns nur, wen wir gefragt haben und was der Kunde uns selbst gesagt hat.
 */
import { db, defineCollection, vermerken } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { heute, tageZwischen } from '@core/format';
import type { Auftrag, Basis, Betrieb, ID, Kunde, Zeitpunkt } from '@core/objects';

export interface Bewertung extends Basis {
  art: 'anfrage' | 'empfehlung';
  /** bei `empfehlung`: der neue (empfohlene) Kunde */
  kundeId: ID;
  auftragId?: ID;
  status?: 'vorbereitet' | 'gesendet' | 'verworfen';
  gesendetAm?: Zeitpunkt;
  /** interne Zufriedenheit 1 (unzufrieden) – 5 (sehr zufrieden), nur was der Kunde selbst gesagt hat */
  zufriedenheit?: 1 | 2 | 3 | 4 | 5;
  zufriedenheitNotiz?: string;
  /** bei `empfehlung`: wer hat empfohlen */
  empfohlenVonKundeId?: ID;
  /** Dank an Empfehler erledigt */
  bedanktAm?: Zeitpunkt;
}

export const bewertungen = defineCollection<Bewertung>('bewertungen');

export const LINK_KEY = 'bewertungen.googleLink';
export const PAUSE_TAGE = 180;

export const ZUFRIEDENHEIT: { wert: NonNullable<Bewertung['zufriedenheit']>; label: string }[] = [
  { wert: 5, label: 'Sehr zufrieden' },
  { wert: 4, label: 'Zufrieden' },
  { wert: 3, label: 'Geht so' },
  { wert: 2, label: 'Unzufrieden' },
  { wert: 1, label: 'Sehr unzufrieden' },
];

export const zufriedenheitLabel = (z: Bewertung['zufriedenheit']) => ZUFRIEDENHEIT.find((x) => x.wert === z)?.label;

// ------------------------------------------------------------------ Regeln

/**
 * Soll nach diesem Auftrag eine Bewertungsanfrage vorbereitet werden?
 * - Auftrag ist gerade auf „erledigt“ gegangen
 * - keine Reklamation
 * - für diesen Auftrag gibt es noch keine Anfrage
 * - der Kunde wurde in den letzten 180 Tagen nicht schon gefragt
 * - der Kunde hat zuletzt keine Unzufriedenheit geäußert
 */
export function sollAnfragen(
  auftrag: Pick<Auftrag, 'id' | 'phase' | 'art' | 'kundeId'>,
  vorherPhase: Auftrag['phase'] | undefined,
  alle: Pick<Bewertung, 'art' | 'kundeId' | 'auftragId' | 'status' | 'gesendetAm' | 'zufriedenheit' | 'erstelltAm'>[],
  stichtag: string = heute(),
): boolean {
  if (auftrag.phase !== 'erledigt' || vorherPhase === 'erledigt') return false;
  if (auftrag.art === 'reklamation') return false;
  const anfragen = alle.filter((b) => b.art === 'anfrage');
  if (anfragen.some((b) => b.auftragId === auftrag.id)) return false;
  const vomKunden = anfragen.filter((b) => b.kundeId === auftrag.kundeId);
  if (vomKunden.some((b) => b.status === 'gesendet' && b.gesendetAm && tageZwischen(b.gesendetAm.slice(0, 10), stichtag) < PAUSE_TAGE)) return false;
  const letzte = vomKunden.filter((b) => b.zufriedenheit).sort((a, z) => z.erstelltAm.localeCompare(a.erstelltAm))[0];
  if (letzte?.zufriedenheit && letzte.zufriedenheit <= 2) return false;
  return true;
}

export function anfrageText(kunde: Pick<Kunde, 'name' | 'art' | 'ansprechpartner'>, betrieb: Pick<Betrieb, 'name'> | undefined, link: string): string {
  const anrede = kunde.art === 'privat' ? `Guten Tag ${kunde.name}` : kunde.ansprechpartner[0] ? `Guten Tag ${kunde.ansprechpartner[0].name}` : 'Guten Tag';
  const wir = betrieb?.name ?? 'uns';
  return `${anrede},\n\nvielen Dank für Ihren Auftrag. Wir hoffen, Sie sind mit unserer Arbeit zufrieden.\n\nWenn ja, hilft uns eine kurze Bewertung sehr – das dauert eine Minute:\n${link}\n\nWenn etwas nicht gepasst hat, antworten Sie einfach auf diese Nachricht. Dann kümmern wir uns darum.\n\nViele Grüße\n${wir}`;
}

/** Empfehler mit Anzahl der gebrachten Kunden, meiste zuerst */
export function empfehlerRangliste(empfehlungen: Pick<Bewertung, 'art' | 'empfohlenVonKundeId' | 'kundeId'>[]): { kundeId: ID; anzahl: number; kundeIds: ID[] }[] {
  const m = new Map<ID, ID[]>();
  for (const e of empfehlungen) {
    if (e.art !== 'empfehlung' || !e.empfohlenVonKundeId) continue;
    m.set(e.empfohlenVonKundeId, [...(m.get(e.empfohlenVonKundeId) ?? []), e.kundeId]);
  }
  return [...m.entries()].map(([kundeId, kundeIds]) => ({ kundeId, anzahl: kundeIds.length, kundeIds })).sort((a, b) => b.anzahl - a.anzahl);
}

// ------------------------------------------------------------------ Aktionen auf Daten

export function anfrageFuerAuftrag(auftragId: ID) {
  return bewertungen.all().find((b) => b.art === 'anfrage' && b.auftragId === auftragId);
}

export function anfrageVorbereiten(auftrag: Auftrag, beispiel?: boolean) {
  const vorhanden = anfrageFuerAuftrag(auftrag.id);
  if (vorhanden) return vorhanden;
  return bewertungen.create({ art: 'anfrage', kundeId: auftrag.kundeId, auftragId: auftrag.id, status: 'vorbereitet', beispiel });
}

export type SendenErgebnis = { ok: true; kanal: 'email' | 'sms' } | { ok: false; grund: 'kein_link' | 'kein_kontakt' | 'unbekannt' };

/** Anfrage als ausgehende Nachricht an den Kunden geben (Versand übernimmt das Modul Nachrichten) */
export function anfrageSenden(auftragId: ID): SendenErgebnis {
  const auftrag = db.auftraege.get(auftragId);
  const kunde = db.kunden.get(auftrag?.kundeId);
  if (!auftrag || !kunde) return { ok: false, grund: 'unbekannt' };
  const link = einstellung<string>(LINK_KEY, '').trim();
  if (!link) return { ok: false, grund: 'kein_link' };
  const kanal = kunde.email ? 'email' : kunde.telefon ? 'sms' : undefined;
  if (!kanal) return { ok: false, grund: 'kein_kontakt' };
  const anfrage = anfrageVorbereiten(auftrag);
  db.nachrichten.create({
    kanal,
    richtung: 'aus',
    kundeId: kunde.id,
    auftragId,
    betreff: 'Wie zufrieden warst du mit uns?',
    text: anfrageText(kunde, db.betrieb.get('betrieb'), link),
    gelesen: true,
  });
  bewertungen.update(anfrage.id, { status: 'gesendet', gesendetAm: new Date().toISOString() });
  vermerken({ typ: 'auftraege', id: auftragId }, 'bewertung.angefragt', 'Bewertungsanfrage gesendet');
  return { ok: true, kanal };
}

export function anfrageVerwerfen(auftragId: ID) {
  const a = anfrageFuerAuftrag(auftragId);
  if (a) bewertungen.update(a.id, { status: 'verworfen' });
}

export function empfehlungFuer(kundeId: ID) {
  return bewertungen.all().find((b) => b.art === 'empfehlung' && b.kundeId === kundeId);
}

export function empfehlungErfassen(kundeId: ID, empfohlenVonKundeId: ID) {
  if (kundeId === empfohlenVonKundeId) throw new Error('Ein Kunde kann sich nicht selbst empfehlen.');
  const vorhanden = empfehlungFuer(kundeId);
  if (vorhanden) return bewertungen.update(vorhanden.id, { empfohlenVonKundeId })!;
  vermerken({ typ: 'kunden', id: empfohlenVonKundeId }, 'empfehlung.erfasst', `Hat ${db.kunden.get(kundeId)?.name ?? 'einen Kunden'} empfohlen`);
  return bewertungen.create({ art: 'empfehlung', kundeId, empfohlenVonKundeId });
}
