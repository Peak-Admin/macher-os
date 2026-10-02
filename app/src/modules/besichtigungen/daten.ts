/**
 * Besichtigungen = `termine` mit `art: 'besichtigung'`. Notizen und Fotos sind `dokumente`
 * mit Bezug auf den Termin. Das Ergebnis führt zu Aufmaß, Angebot oder Absage.
 */
import { db, vermerken } from '@core/db';
import { aktionAusfuehren, pfadZu } from '@core/modul';
import type { ID, Termin } from '@core/objects';

export const istBesichtigung = (t: Termin) => t.art === 'besichtigung';

export function besichtigungenVon(auftragId: ID): Termin[] {
  return db.termine.where((t) => istBesichtigung(t) && t.auftragId === auftragId && t.status !== 'abgesagt');
}

/** Überschneiden sich zwei Zeiträume? (Ende exklusiv) */
export function ueberschneidet(a: { start: string; ende: string }, b: { start: string; ende: string }): boolean {
  return a.start < b.ende && b.start < a.ende;
}

/** Termine der Mitarbeiter, die mit dem neuen Zeitraum kollidieren */
export function konflikte(mitarbeiterIds: ID[], start: string, ende: string, termine: Termin[]): Termin[] {
  return termine.filter((t) => t.status !== 'abgesagt' && !t.ganztags && t.mitarbeiterIds.some((m) => mitarbeiterIds.includes(m)) && ueberschneidet({ start, ende }, t));
}

/** Abwesend an dem Tag? */
export function abwesend(mitarbeiterId: ID, tag: string): boolean {
  return db.abwesenheiten.all().some((a) => a.mitarbeiterId === mitarbeiterId && a.status !== 'abgelehnt' && a.von <= tag && a.bis >= tag);
}

export interface Planung {
  auftragId: ID;
  start: string;
  ende: string;
  mitarbeiterIds: ID[];
  notiz?: string;
}

export function besichtigungPlanen(p: Planung): Termin {
  const a = db.auftraege.get(p.auftragId);
  if (!a) throw new Error('Auftrag nicht gefunden.');
  const t = db.termine.create({
    art: 'besichtigung',
    titel: `Besichtigung: ${a.titel}`,
    start: p.start,
    ende: p.ende,
    auftragId: a.id,
    kundeId: a.kundeId,
    ortId: a.ortId,
    mitarbeiterIds: p.mitarbeiterIds,
    status: 'geplant',
    notiz: p.notiz?.trim() || undefined,
  });
  if (a.phase === 'anfrage') db.auftraege.update(a.id, { phase: 'besichtigung' }, { text: 'Besichtigung geplant' });
  vermerken({ typ: 'auftraege', id: a.id }, 'besichtigung.geplant', 'Besichtigung geplant');
  return t;
}

export type Ergebnis = 'aufmass' | 'angebot' | 'kein_auftrag';

export const ERGEBNISSE: { wert: Ergebnis; label: string; text: string; icon: string }[] = [
  { wert: 'aufmass', label: 'Aufmaß erfassen', text: 'Maße nehmen, Mengen gehen ins Angebot.', icon: 'liste' },
  { wert: 'angebot', label: 'Angebot schreiben', text: 'Alles gesehen – direkt anbieten.', icon: 'dokument' },
  { wert: 'kein_auftrag', label: 'Kein Auftrag', text: 'Passt nicht oder Kunde will nicht.', icon: 'x' },
];

/** Besichtigung abschließen und den nächsten Schritt starten. Rückgabe: Zielpfad */
export function ergebnisFestlegen(terminId: ID, ergebnis: Ergebnis, grund?: string): string | undefined {
  const t = db.termine.get(terminId);
  if (!t) return undefined;
  db.termine.update(t.id, { status: 'erledigt' }, { text: 'Besichtigung erledigt' });
  const a = db.auftraege.get(t.auftragId);
  if (!a) return undefined;
  const bezug = { typ: 'auftraege' as const, id: a.id };
  switch (ergebnis) {
    case 'aufmass':
      vermerken(bezug, 'besichtigung.ergebnis', 'Besichtigung: weiter mit Aufmaß');
      return (aktionAusfuehren('aufmass.anlegen', { auftragId: a.id }) as string | undefined) ?? pfadZu(bezug);
    case 'angebot':
      vermerken(bezug, 'besichtigung.ergebnis', 'Besichtigung: weiter mit Angebot');
      return (aktionAusfuehren('angebot.erstellen', { auftragId: a.id }) as string | undefined) ?? pfadZu(bezug);
    case 'kein_auftrag':
      db.auftraege.update(a.id, { phase: 'verloren', verlorenGrund: grund || 'Nach Besichtigung kein Auftrag', abgeschlossenAm: new Date().toISOString() }, { text: `Nach Besichtigung: ${grund || 'kein Auftrag'}` });
      return undefined;
  }
}

