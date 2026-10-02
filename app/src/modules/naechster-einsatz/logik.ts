/**
 * Nächster Einsatz: welcher Termin ist für mich jetzt dran, und wie starte/beende ich ihn?
 * Zeiterfassung gehört dem Paket team (`einsatz.starten` / `einsatz.beenden`).
 * Ist diese Aktion (noch) nicht registriert, setzt Heute den Terminstatus selbst.
 */
import { db } from '@core/db';
import { emit } from '@core/events';
import { aktionAusfuehren, alleModule } from '@core/modul';
import { datumVon, isoDatum, plusTage } from '@core/format';
import type { ID, Termin } from '@core/objects';

/** Termine, an denen tatsächlich jemand rausfährt bzw. vor Ort arbeitet */
const VOR_ORT_ARTEN: Termin['art'][] = ['einsatz', 'wartung', 'besichtigung', 'abnahme', 'schulung'];

export function aktionVorhanden(id: string): boolean {
  return alleModule().some((m) => !!m.aktionen?.[id]);
}

export function laeuft(t: Termin) {
  return t.status === 'unterwegs' || t.status === 'vor_ort';
}

/**
 * Der eine Termin, um den es jetzt geht:
 * 1. ein laufender (unterwegs/vor Ort), sonst
 * 2. der nächste noch nicht beendete in den kommenden `tage` Tagen.
 */
export function naechsterEinsatz(mitarbeiterId: ID | undefined, jetzt = new Date(), tage = 14): Termin | undefined {
  if (!mitarbeiterId) return undefined;
  const iso = jetzt.toISOString();
  const bis = plusTage(isoDatum(jetzt), tage);
  const meine = db.termine
    .where(
      (t) =>
        t.mitarbeiterIds.includes(mitarbeiterId) &&
        VOR_ORT_ARTEN.includes(t.art) &&
        t.status !== 'abgesagt' &&
        t.status !== 'erledigt' &&
        !!t.start,
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  const laufend = meine.find(laeuft);
  if (laufend) return laufend;
  return meine.find((t) => (t.ende || t.start) > iso && datumVon(t.start) <= bis);
}

/** Der Auftrag, an dem jemand gerade arbeitet – für die Vorauswahl in „Schnell erfassen“ */
export function aktuellerAuftrag(mitarbeiterId: ID | undefined, jetzt = new Date()): ID | undefined {
  if (!mitarbeiterId) return undefined;
  const tag = isoDatum(jetzt);
  const zeit = db.zeiten.where((z) => z.mitarbeiterId === mitarbeiterId && z.datum === tag && !z.ende && !!z.auftragId).at(0);
  if (zeit?.auftragId) return zeit.auftragId;
  const t = naechsterEinsatz(mitarbeiterId, jetzt, 0);
  if (t?.auftragId && (laeuft(t) || datumVon(t.start) === tag)) return t.auftragId;
  // sonst der zuletzt heute bearbeitete Termin
  const heute = db.termine
    .where((x) => x.mitarbeiterIds.includes(mitarbeiterId) && !!x.auftragId && datumVon(x.start) === tag && x.status !== 'abgesagt')
    .sort((a, b) => b.start.localeCompare(a.start));
  return heute.find((x) => x.start <= jetzt.toISOString())?.auftragId ?? heute.at(-1)?.auftragId;
}

/** Status direkt setzen (Rückfall, wenn Zeiterfassung fehlt; auch für Rückgängig) */
export function setzeTerminStatus(terminId: ID, status: Termin['status'], text?: string) {
  const alt = db.termine.get(terminId);
  if (!alt) return undefined;
  return db.termine.update(terminId, { status }, { text });
}

/** Einsatz starten: Zeiterfassung (team) oder Status „vor Ort“ */
export function einsatzStarten(terminId: ID): string | void {
  if (aktionVorhanden('einsatz.starten')) return aktionAusfuehren('einsatz.starten', { terminId });
  const t = setzeTerminStatus(terminId, 'vor_ort', 'Einsatz gestartet – vor Ort');
  if (t) emit({ typ: 'einsatz.gestartet', sammlung: 'termine', objekt: t, daten: { terminId } });
}

/** Losfahren: nur Status „unterwegs“ */
export function einsatzLosfahren(terminId: ID) {
  setzeTerminStatus(terminId, 'unterwegs', 'Unterwegs zum Einsatz');
}

/** Einsatz beenden: Zeiterfassung (team) oder Status „erledigt“ */
export function einsatzBeenden(terminId: ID): string | void {
  if (aktionVorhanden('einsatz.beenden')) return aktionAusfuehren('einsatz.beenden', { terminId });
  const t = setzeTerminStatus(terminId, 'erledigt', 'Einsatz beendet');
  if (t) emit({ typ: 'einsatz.beendet', sammlung: 'termine', objekt: t, daten: { terminId } });
}

export interface StatusPayload {
  terminId: ID;
  status: Termin['status'];
}

/** Telefonnummer für „Anrufen“: vor Ort, sonst Ansprechpartner, sonst Kunde */
export function telefonFuer(t: Termin): { nummer: string; wer: string } | undefined {
  const auftrag = db.auftraege.get(t.auftragId);
  const ort = db.orte.get(t.ortId ?? auftrag?.ortId);
  const kunde = db.kunden.get(t.kundeId ?? auftrag?.kundeId);
  if (ort?.telefonVorOrt) return { nummer: ort.telefonVorOrt, wer: ort.ansprechpartnerVorOrt ?? 'Ansprechpartner vor Ort' };
  const ap = kunde?.ansprechpartner.find((a) => a.telefon);
  if (kunde?.telefon) return { nummer: kunde.telefon, wer: kunde.name };
  if (ap?.telefon) return { nummer: ap.telefon, wer: ap.name };
  return undefined;
}
