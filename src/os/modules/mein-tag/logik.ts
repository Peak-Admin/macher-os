/**
 * Reine Logik für „Heute“: Was steht für wen heute an? Wer ist gerade wo?
 * Wird von Mein Tag, Nächster Einsatz, Schnell erfassen und Erledigt genutzt.
 */
import { db } from '@core/db';
import { datumVon, isoDatum, personName } from '@core/format';
import type { Abwesenheit, Aufgabe, Datum, ID, Mitarbeiter, Termin } from '@core/objects';
import { ABWESENHEIT_LABEL, abwesenheitAm as planAbwesenheitAm } from '@modules/verfuegbarkeit/daten';

export const TERMIN_ART_LABEL: Record<Termin['art'], string> = {
  einsatz: 'Einsatz',
  besichtigung: 'Besichtigung',
  wartung: 'Wartung',
  intern: 'Intern',
  schulung: 'Schulung',
  abnahme: 'Abnahme',
};

export const TERMIN_STATUS_LABEL: Record<Termin['status'], string> = {
  geplant: 'Geplant',
  bestaetigt: 'Bestätigt',
  unterwegs: 'Unterwegs',
  vor_ort: 'Vor Ort',
  erledigt: 'Erledigt',
  abgesagt: 'Abgesagt',
};

export { ABWESENHEIT_LABEL };

/** Termine, die an einem Tag stattfinden (auch mehrtägige), ohne abgesagte, nach Start sortiert */
export function termineAm(tag: Datum, mitarbeiterId?: ID): Termin[] {
  return db.termine
    .where(
      (t) =>
        t.status !== 'abgesagt' &&
        !!t.start &&
        datumVon(t.start) <= tag &&
        datumVon(t.ende || t.start) >= tag &&
        (!mitarbeiterId || t.mitarbeiterIds.includes(mitarbeiterId)),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Genehmigte Abwesenheit eines Mitarbeiters an einem Tag (Logik aus `verfuegbarkeit`) */
export function abwesenheitAm(mitarbeiterId: ID, tag: Datum): Abwesenheit | undefined {
  return planAbwesenheitAm(mitarbeiterId, tag, { abwesenheiten: db.abwesenheiten.all() }, { nurGenehmigt: true });
}

/**
 * Aufgaben, die heute für jemanden dran sind:
 * – ihm zugewiesen und heute (oder früher) fällig,
 * – oder ohne Zuständigen an einem Auftrag, an dem er heute arbeitet.
 * Überfällige zuerst, dann hohe Priorität.
 */
export function aufgabenFuer(mitarbeiterId: ID, tag: Datum): Aufgabe[] {
  const auftraegeHeute = new Set(
    termineAm(tag, mitarbeiterId)
      .map((t) => t.auftragId)
      .filter(Boolean) as ID[],
  );
  return db.aufgaben
    .where(
      (a) =>
        !a.erledigt &&
        ((a.zustaendigId === mitarbeiterId && (!a.faellig || a.faellig <= tag)) ||
          (!a.zustaendigId && !!a.auftragId && auftraegeHeute.has(a.auftragId))),
    )
    .sort(
      (a, b) =>
        (a.faellig ?? '9999').localeCompare(b.faellig ?? '9999') ||
        (a.prioritaet === 'hoch' ? -1 : 0) - (b.prioritaet === 'hoch' ? -1 : 0) ||
        a.titel.localeCompare(b.titel, 'de'),
    );
}

export type Lage =
  | { art: 'abwesend'; text: string; abwesenheit: Abwesenheit }
  | { art: 'vor_ort' | 'unterwegs'; text: string; termin: Termin }
  | { art: 'geplant'; text: string; termin: Termin }
  | { art: 'fertig'; text: string }
  | { art: 'frei'; text: string };

/** Ein Satz: Wo ist dieser Mitarbeiter gerade bzw. was steht als Nächstes an? */
export function lageVon(m: Mitarbeiter, jetzt = new Date()): Lage {
  const tag = isoDatum(jetzt);
  const ab = abwesenheitAm(m.id, tag);
  if (ab) return { art: 'abwesend', text: ABWESENHEIT_LABEL[ab.art], abwesenheit: ab };
  const termine = termineAm(tag, m.id);
  const laufend = termine.find((t) => t.status === 'vor_ort' || t.status === 'unterwegs');
  if (laufend) {
    const wo = ortKurz(laufend);
    return {
      art: laufend.status === 'vor_ort' ? 'vor_ort' : 'unterwegs',
      text: laufend.status === 'vor_ort' ? `Vor Ort${wo ? ` · ${wo}` : ''}` : `Unterwegs${wo ? ` nach ${wo}` : ''}`,
      termin: laufend,
    };
  }
  const iso = jetzt.toISOString();
  const naechster = termine.find((t) => t.status !== 'erledigt' && (t.ende || t.start) > iso);
  if (naechster) return { art: 'geplant', text: naechster.titel, termin: naechster };
  if (termine.length) return { art: 'fertig', text: 'Alle Termine erledigt' };
  return { art: 'frei', text: 'Kein Termin geplant' };
}

/** Kurzbeschreibung des Einsatzorts: Kunde, sonst Ort */
export function ortKurz(t: Termin): string {
  const k = db.kunden.get(t.kundeId ?? db.auftraege.get(t.auftragId)?.kundeId);
  const o = db.orte.get(t.ortId ?? db.auftraege.get(t.auftragId)?.ortId);
  return [k?.name, o?.adresse.ort].filter(Boolean).join(', ');
}

/** Alle aktiven Mitarbeiter mit ihrer Lage – für Chef und Büro („Wer ist wo“) */
export function betriebHeute(jetzt = new Date()) {
  return db.mitarbeiter
    .where((m) => m.aktiv)
    .map((m) => ({ mitarbeiter: m, lage: lageVon(m, jetzt) }))
    .sort((a, b) => LAGE_REIHENFOLGE[a.lage.art] - LAGE_REIHENFOLGE[b.lage.art] || personName(a.mitarbeiter).localeCompare(personName(b.mitarbeiter), 'de'));
}

const LAGE_REIHENFOLGE: Record<Lage['art'], number> = { vor_ort: 0, unterwegs: 1, geplant: 2, fertig: 3, frei: 4, abwesend: 5 };

/** Zeitspanne eines Termins für die Anzeige */
export function zeitText(t: Termin): string {
  if (t.ganztags) return 'ganztags';
  const f = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return t.ende ? `${f(t.start)}–${f(t.ende)}` : f(t.start);
}

/** Begrüßung nach Tageszeit */
export function gruss(jetzt = new Date()): string {
  const h = jetzt.getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Hallo';
  return 'Guten Abend';
}
