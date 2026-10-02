/**
 * Auftragsakte – Zugriff auf die Datenschicht: Phase setzen, nächsten Schritt ausführen,
 * Phasen-Automationen. Alles über `db.*`, nichts wird kopiert.
 */
import { db } from '@core/db';
import type { DbEvent } from '@core/events';
import { erledigt } from '@core/macher';
import { aktionAusfuehren, alleModule, pfadZu } from '@core/modul';
import { heute, plusTage } from '@core/format';
import type { Auftrag, ID, Phase } from '@core/objects';
import { alleEinsaetzeErledigt, istOffen, istVor, naechsterSchritt, phaseLabel, type Schritt, type SchrittKontext } from './logik';

export function aktionDa(id: string): boolean {
  return alleModule().some((m) => !!m.aktionen?.[id]);
}

export function auftragPfad(id: ID) {
  return `/auftrag/${id}`;
}

/** Phase ändern – mit lesbarem Eintrag im Verlauf */
export function setzePhase(id: ID, phase: Phase, opts: { automatisch?: boolean; grund?: string } = {}): Auftrag | undefined {
  const a = db.auftraege.get(id);
  if (!a || a.phase === phase) return a;
  const patch: Partial<Auftrag> = { phase };
  if (phase === 'erledigt') patch.abgeschlossenAm = new Date().toISOString();
  if (phase === 'verloren') patch.verlorenGrund = opts.grund;
  if (a.phase === 'verloren' && phase !== 'verloren') patch.verlorenGrund = undefined;
  const text = `Phase: ${phaseLabel(a.phase)} → ${phaseLabel(phase)}${opts.automatisch ? ' (automatisch)' : ''}${opts.grund ? ` · ${opts.grund}` : ''}`;
  return db.auftraege.update(id, patch, { text });
}

export function schrittKontext(a: Auftrag): SchrittKontext {
  return {
    termine: db.termine.where((t) => t.auftragId === a.id),
    angebote: db.angebote.where((x) => x.auftragId === a.id),
    rechnungen: db.rechnungen.where((r) => r.auftragId === a.id),
    heute: heute(),
    aktionDa,
    pfadZu: (typ, id) => pfadZu({ typ, id }),
  };
}

export function schrittFuer(a: Auftrag): Schritt | undefined {
  return naechsterSchritt(a, schrittKontext(a));
}

/** Aufgabe am Auftrag anlegen, wenn es dieselbe offene noch nicht gibt */
export function aufgabeSicherstellen(auftragId: ID, titel: string, quelle = 'macher') {
  const da = db.aufgaben.all().find((x) => x.auftragId === auftragId && !x.erledigt && x.titel === titel);
  if (da) return da;
  const a = db.auftraege.get(auftragId);
  return db.aufgaben.create({ titel, auftragId, zustaendigId: a?.verantwortlichId, faellig: plusTage(heute(), 2), erledigt: false, prioritaet: 'normal', quelle });
}

/** Führt den nächsten Schritt aus. Rückgabe: Ziel zum Navigieren und/oder Meldung. */
export function schrittAusfuehren(a: Auftrag, s: Schritt): { pfad?: string; meldung?: string } {
  if (s.vorherPhase) setzePhase(a.id, s.vorherPhase);
  if (s.aktion) {
    if (aktionDa(s.aktion)) {
      const ziel = aktionAusfuehren(s.aktion, s.payload);
      return { pfad: typeof ziel === 'string' ? ziel : undefined, meldung: typeof ziel === 'string' ? undefined : 'Erledigt.' };
    }
    if (s.ersatz?.phase) setzePhase(a.id, s.ersatz.phase);
    if (s.ersatz?.aufgabe) aufgabeSicherstellen(a.id, s.ersatz.aufgabe, 'auftrag');
    return { meldung: s.ersatz?.meldung ?? 'Erledigt.' };
  }
  if (s.phase) {
    setzePhase(a.id, s.phase);
    return { meldung: `Auftrag steht jetzt auf „${phaseLabel(s.phase)}“.`, pfad: s.pfad };
  }
  return { pfad: s.pfad };
}

/** Letzte Bewegung je Auftrag: Auftrag selbst + alles, was per auftragId daran hängt */
export function letzteBewegungen(): Map<ID, string> {
  const m = new Map<ID, string>();
  const merk = (id: ID | undefined, z: string | undefined) => {
    if (!id || !z) return;
    const alt = m.get(id);
    if (!alt || z > alt) m.set(id, z);
  };
  for (const a of db.auftraege.all()) merk(a.id, a.geaendertAm);
  for (const col of [db.termine, db.aufgaben, db.angebote, db.rechnungen, db.dokumente, db.nachrichten, db.material, db.zeiten] as const)
    for (const x of col.all() as { auftragId?: ID; geaendertAm: string }[]) merk(x.auftragId, x.geaendertAm);
  for (const e of db.ereignisse.where((e) => e.bezug.typ === 'auftraege')) merk(e.bezug.id, e.erstelltAm);
  return m;
}

// ------------------------------------------------------------------ Phasen-Automationen

/** Auftrag aus einem beliebigen Ereignis ermitteln (Objekt, Daten, Rechnung, Termin) */
export function auftragIdAus(e: DbEvent): ID | undefined {
  if (e.sammlung === 'auftraege') return e.objekt?.id;
  const o = (e.objekt ?? {}) as Record<string, unknown>;
  const d = (e.daten ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const direkt = s(o.auftragId) ?? s(d.auftragId);
  if (direkt) return direkt;
  const rechnungId = s(o.rechnungId) ?? s(d.rechnungId);
  if (rechnungId) return db.rechnungen.get(rechnungId)?.auftragId;
  const terminId = s(o.terminId) ?? s(d.terminId);
  if (terminId) return db.termine.get(terminId)?.auftragId;
  const angebotId = s(o.angebotId) ?? s(d.angebotId);
  if (angebotId) return db.angebote.get(angebotId)?.auftragId;
  return undefined;
}

const bezug = (id: ID) => ({ typ: 'auftraege' as const, id });

export function beiAngebotAngenommen(auftragId: ID | undefined) {
  const a = db.auftraege.get(auftragId);
  if (!a || !istVor(a.phase, 'beauftragt')) return false;
  setzePhase(a.id, 'beauftragt', { automatisch: true });
  erledigt('auftrag.angebot-angenommen', `${a.nummer}: Angebot angenommen – Auftrag steht auf „Beauftragt“`, { bezug: bezug(a.id) });
  return true;
}

export function beiEinsatzGestartet(auftragId: ID | undefined) {
  const a = db.auftraege.get(auftragId);
  if (!a || !istVor(a.phase, 'in_arbeit')) return false;
  setzePhase(a.id, 'in_arbeit', { automatisch: true });
  erledigt('auftrag.einsatz-gestartet', `${a.nummer}: Erster Einsatz gestartet – Auftrag ist „In Arbeit“`, { bezug: bezug(a.id) });
  return true;
}

/** Alle Einsätze erledigt → Abnahme. Gibt es noch offene Aufgaben, bleibt es bei einem Hinweis. */
export function beiTerminErledigt(auftragId: ID | undefined) {
  const a = db.auftraege.get(auftragId);
  if (!a || (a.phase !== 'in_arbeit' && a.phase !== 'beauftragt')) return false;
  if (!alleEinsaetzeErledigt(db.termine.where((t) => t.auftragId === a.id))) return false;
  if (db.aufgaben.where((x) => x.auftragId === a.id && !x.erledigt).length) return false;
  setzePhase(a.id, 'abnahme', { automatisch: true });
  erledigt('auftrag.termine-erledigt', `${a.nummer}: Alle Einsätze erledigt – bereit zur Abnahme`, { bezug: bezug(a.id) });
  return true;
}

export function beiAbnahmeUnterschrieben(auftragId: ID | undefined) {
  const a = db.auftraege.get(auftragId);
  if (!a || !istVor(a.phase, 'abrechnung')) return false;
  setzePhase(a.id, 'abrechnung', { automatisch: true });
  erledigt('auftrag.abnahme-unterschrieben', `${a.nummer}: Abnahme unterschrieben – weiter mit der Rechnung`, { bezug: bezug(a.id) });
  return true;
}

/** Schluss- oder Einzelrechnung bezahlt und nichts mehr offen → erledigt */
export function beiZahlung(auftragId: ID | undefined) {
  const a = db.auftraege.get(auftragId);
  if (!a || !istOffen(a)) return false;
  const r = db.rechnungen.where((x) => x.auftragId === a.id && x.status !== 'storniert' && x.art !== 'gutschrift');
  const schluss = r.filter((x) => x.art === 'schluss' || x.art === 'rechnung');
  if (!schluss.length || !schluss.some((x) => x.status === 'bezahlt')) return false;
  if (r.some((x) => x.status !== 'bezahlt')) return false;
  setzePhase(a.id, 'erledigt', { automatisch: true });
  erledigt('auftrag.bezahlt', `${a.nummer}: Rechnung bezahlt – Auftrag abgeschlossen`, { bezug: bezug(a.id) });
  return true;
}
