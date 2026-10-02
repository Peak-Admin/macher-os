/**
 * Qualifikation bei der Planung: Hat das eingeplante Team am Termindatum die nötigen,
 * GÜLTIGEN Nachweise? Wenn nicht: wer wäre stattdessen qualifiziert und frei?
 */
import { datum as datumFmt, personName } from '@core/format';
import type { Auftrag, Datum, ID, Termin } from '@core/objects';
import {
  finde,
  istVerfuegbar,
  planbareMitarbeiter,
  terminDatum,
  type Kontext,
  type Pruefung,
} from '../autoplanung/basis';

/** Benötigte Qualifikationen: am Auftrag + aus den erwarteten Leistungen (ohne Doppelte) */
export function benoetigteQualifikationen(ctx: Kontext, auftrag: Auftrag | undefined): ID[] {
  if (!auftrag) return [];
  const ids = new Set(auftrag.qualifikationIds ?? []);
  for (const lid of auftrag.leistungIds ?? []) {
    for (const q of finde(ctx.leistungen, lid)?.qualifikationIds ?? []) ids.add(q);
  }
  return [...ids].filter((id) => ctx.qualifikationen.some((q) => q.id === id && !q.geloeschtAm));
}

/** Gültiger Nachweis am Datum? (ohne `gueltigBis` = unbefristet; erworben nach Datum zählt nicht) */
export function hatGueltigenNachweis(ctx: Kontext, mitarbeiterId: ID, qualifikationId: ID, d: Datum): boolean {
  return ctx.nachweise.some(
    (n) =>
      !n.geloeschtAm &&
      n.mitarbeiterId === mitarbeiterId &&
      n.qualifikationId === qualifikationId &&
      (!n.gueltigBis || n.gueltigBis >= d) &&
      (!n.erworbenAm || n.erworbenAm <= d),
  );
}

/** abgelaufener Nachweis (für eine bessere Erklärung) */
function abgelaufenAm(ctx: Kontext, mitarbeiterId: ID, qualifikationId: ID, d: Datum): Datum | undefined {
  return ctx.nachweise
    .filter((n) => !n.geloeschtAm && n.mitarbeiterId === mitarbeiterId && n.qualifikationId === qualifikationId && n.gueltigBis && n.gueltigBis < d)
    .map((n) => n.gueltigBis!)
    .sort()
    .pop();
}

/** Hat der Mitarbeiter ALLE Qualifikationen am Datum? */
export function erfuelltAlle(ctx: Kontext, mitarbeiterId: ID, qualiIds: ID[], d: Datum): boolean {
  return qualiIds.every((q) => hatGueltigenNachweis(ctx, mitarbeiterId, q, d));
}

const qName = (ctx: Kontext, id: ID) => finde(ctx.qualifikationen, id)?.name ?? 'Qualifikation';
const maName = (ctx: Kontext, id: ID) => personName(finde(ctx.mitarbeiter, id));

/** Wer wäre im Zeitraum frei und hat die Qualifikationen? (eingeplante ausgenommen) */
export function qualifizierteErsatzleute(ctx: Kontext, t: Pick<Termin, 'id' | 'start' | 'ende' | 'mitarbeiterIds'>, qualiIds: ID[]): ID[] {
  const d = terminDatum(t);
  return planbareMitarbeiter(ctx)
    .filter((m) => !t.mitarbeiterIds.includes(m.id))
    .filter((m) => m.rolle !== 'azubi')
    .filter((m) => erfuelltAlle(ctx, m.id, qualiIds, d))
    .filter((m) => istVerfuegbar(ctx, m.id, t.start, t.ende, t.id))
    .map((m) => m.id);
}

/**
 * Prüft einen Termin: Für jede benötigte Qualifikation muss mindestens eine eingeplante Person
 * am Termindatum einen gültigen Nachweis haben (z. B. die Elektrofachkraft im Team).
 */
export function pruefeQualifikation(ctx: Kontext, t: Termin): Pruefung[] {
  const auftrag = finde(ctx.auftraege, t.auftragId);
  const benoetigt = benoetigteQualifikationen(ctx, auftrag);
  if (!benoetigt.length) return [{ ergebnis: 'ok', text: 'Für diesen Einsatz ist keine besondere Qualifikation hinterlegt.' }];
  const d = terminDatum(t);
  if (!t.mitarbeiterIds.length) {
    return [{ ergebnis: 'warnung', text: 'Noch niemand eingeplant.', loesung: vorschlagText(ctx, t, benoetigt) }];
  }
  return benoetigt.map((q) => {
    const wer = t.mitarbeiterIds.filter((m) => hatGueltigenNachweis(ctx, m, q, d));
    if (wer.length) return { ergebnis: 'ok' as const, text: `${qName(ctx, q)}: ${wer.map((m) => maName(ctx, m)).join(', ')}.` };
    const abgelaufen = t.mitarbeiterIds
      .map((m) => ({ m, bis: abgelaufenAm(ctx, m, q, d) }))
      .filter((x) => x.bis);
    const grund = abgelaufen.length
      ? `Nachweis von ${abgelaufen.map((x) => `${maName(ctx, x.m)} (abgelaufen am ${datumFmt(x.bis)})`).join(', ')} ist am ${datumFmt(d)} nicht mehr gültig.`
      : `Niemand im eingeplanten Team hat „${qName(ctx, q)}“.`;
    return { ergebnis: 'problem' as const, text: `${qName(ctx, q)} fehlt. ${grund}`, loesung: vorschlagText(ctx, t, [q]) };
  });
}

function vorschlagText(ctx: Kontext, t: Termin, qualiIds: ID[]): string {
  const ersatz = qualifizierteErsatzleute(ctx, t, qualiIds);
  if (!ersatz.length) return 'Niemand Qualifiziertes ist zu der Zeit frei. Verschieb den Termin oder hol einen Subunternehmer dazu.';
  const namen = ersatz.slice(0, 3).map((m) => maName(ctx, m));
  return `${namen.join(' oder ')} ${namen.length > 1 ? 'wären' : 'wäre'} frei und qualifiziert.`;
}
