/**
 * Regeln der Ablauf-Engine: fachliche Ereignisse → Schrittwechsel und Folgeaktionen.
 * Alles über Events (`on`), nie als direkter Aufruf aus anderen Modulen.
 */
import { db } from '@core/db';
import type { DbEvent } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { aktionVorhanden } from '@core/modul';
import type { Angebot, ID, Rechnung } from '@core/objects';
import { auftragIdAus, beiZahlung } from '@modules/auftraege/daten';
import { schrittOderPhase, setzeSchritt, standVon } from './daten';

const bezug = (id: ID) => ({ typ: 'auftraege' as const, id });

/** wechselt ein Feld gerade auf einen der Werte? */
export function wechsel<T>(e: DbEvent, feld: keyof T, werte: unknown[]): boolean {
  const neu = e.objekt as T | undefined;
  const alt = e.vorher as T | undefined;
  return !!neu && werte.includes(neu[feld]) && (!alt || !werte.includes(alt[feld]));
}

/** Wer plant? Büro, sonst Chef */
function planer(): ID[] {
  const aktiv = db.mitarbeiter.where((m) => m.aktiv);
  const buero = aktiv.filter((m) => m.rolle === 'buero');
  return (buero.length ? buero : aktiv.filter((m) => m.rolle === 'chef')).map((m) => m.id);
}

/**
 * Angebot angenommen → Schritt „Vorbereitung“. Macher erinnert an den Materialbedarf (Hinweis am Schritt)
 * und sagt der Planung Bescheid.
 */
export function beiZusage(auftragId: ID | undefined): boolean {
  const a = db.auftraege.get(auftragId);
  if (!a || a.phase === 'erledigt' || a.phase === 'verloren' || ['in_arbeit', 'abnahme', 'abrechnung'].includes(a.phase)) return false;
  const ziel = schrittOderPhase(a, 'vorbereitung', 'beauftragt');
  if (!ziel) return false;
  const st = setzeSchritt(a.id, ziel, { automatisch: true, grund: 'Angebot angenommen' });
  if (!st) return false;
  for (const id of planer()) benachrichtigen(`Zum Einplanen: ${a.titel}`, { text: `${db.kunden.get(a.kundeId)?.name ?? 'Kunde'} hat zugesagt. Prüf das Material und plan den Einsatz.`, bezug: bezug(a.id), fuer: id });
  erledigt('ablauf.zusage', `${a.nummer}: Zusage – Schritt „${st.schritt.label}“, Planung informiert`, { bezug: bezug(a.id) });
  return true;
}

/** Abnahme unterschrieben → Schritt „Rechnung“. Gibt es noch keine Rechnung, schlägt Macher sie vor (Hinweis). */
export function beiAbnahme(auftragId: ID | undefined): boolean {
  const a = db.auftraege.get(auftragId);
  if (!a || a.phase === 'erledigt' || a.phase === 'verloren') return false;
  const ziel = schrittOderPhase(a, 'rechnung', 'abrechnung');
  if (!ziel) return false;
  const st = setzeSchritt(a.id, ziel, { automatisch: true, grund: 'Abnahme unterschrieben' });
  if (!st) return false;
  erledigt('ablauf.abnahme', `${a.nummer}: Abnahme unterschrieben – Schritt „${st.schritt.label}“`, { bezug: bezug(a.id) });
  return true;
}

/** Bezahlt → Auftrag abschließen (wenn nichts mehr offen ist) und Schritt „Bezahlt“. Bewertung folgt als nächster Schritt. */
export function beiBezahlt(auftragId: ID | undefined): boolean {
  const a = db.auftraege.get(auftragId);
  if (!a) return false;
  if (a.phase !== 'erledigt') beiZahlung(a.id);
  const jetzt = db.auftraege.get(a.id)!;
  if (jetzt.phase !== 'erledigt') return false;
  const ziel = schrittOderPhase(jetzt, 'bezahlt', 'erledigt');
  const vorher = standVon(jetzt).schritt.id;
  if (ziel && ziel !== vorher) setzeSchritt(jetzt.id, ziel, { automatisch: true, grund: 'Rechnung bezahlt' });
  if (a.phase !== 'erledigt' || (ziel && ziel !== vorher))
    erledigt('ablauf.bezahlt', `${jetzt.nummer}: bezahlt – Auftrag abgeschlossen`, {
      text: aktionVorhanden('bewertung.anfragen') ? 'Als Nächstes: Bewertung anfragen.' : undefined,
      bezug: bezug(jetzt.id),
    });
  return true;
}

export const zusageEvents = {
  angebot: (e: DbEvent) => wechsel<Angebot>(e, 'status', ['angenommen']) && beiZusage((e.objekt as Angebot).auftragId),
  fachlich: (e: DbEvent) => beiZusage(auftragIdAus(e)),
};

export const bezahltEvents = {
  rechnung: (e: DbEvent) => wechsel<Rechnung>(e, 'status', ['bezahlt']) && beiBezahlt((e.objekt as Rechnung).auftragId),
  fachlich: (e: DbEvent) => beiBezahlt(auftragIdAus(e)),
};

