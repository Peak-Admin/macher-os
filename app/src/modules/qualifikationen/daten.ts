/** Qualifikationen & Nachweise – reine Logik (Gültigkeit, Ablauf-Stufen, Matrix). */
import { isoDatum, tageZwischen, datum as datumFmt } from '@core/format';
import type { Datum, ID, Nachweis, Qualifikation } from '@core/objects';
import type { Ton } from '@core/modul';

export const KATEGORIE_LABEL: Record<Qualifikation['kategorie'], string> = {
  fachlich: 'Fachlich',
  pflicht: 'Pflicht',
  fuehrerschein: 'Führerschein',
  zertifikat: 'Zertifikat',
};

export type NachweisStatus = 'unbefristet' | 'gueltig' | 'laeuft_ab' | 'abgelaufen';

/** Ab wie vielen Tagen vor Ablauf gewarnt wird */
export const WARN_TAGE = 60;
export const DRINGEND_TAGE = 30;

export function gueltigBisAus(erworbenAm: Datum | undefined, gueltigMonate: number | undefined): Datum | undefined {
  if (!erworbenAm || !gueltigMonate) return undefined;
  const d = new Date(erworbenAm + 'T12:00:00');
  const tag = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + gueltigMonate);
  const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12).getDate();
  d.setDate(Math.min(tag, letzter));
  return isoDatum(d);
}

export function nachweisStatus(n: Pick<Nachweis, 'gueltigBis'>, heute: Datum): NachweisStatus {
  if (!n.gueltigBis) return 'unbefristet';
  const t = tageZwischen(heute, n.gueltigBis);
  if (t < 0) return 'abgelaufen';
  if (t <= WARN_TAGE) return 'laeuft_ab';
  return 'gueltig';
}

/** Stufe für Ablauf-Hinweise: 60 / 30 Tage vorher, 0 = abgelaufen; undefined = kein Hinweis */
export function ablaufStufe(n: Pick<Nachweis, 'gueltigBis'>, heute: Datum): 60 | 30 | 0 | undefined {
  if (!n.gueltigBis) return undefined;
  const t = tageZwischen(heute, n.gueltigBis);
  if (t < 0) return 0;
  if (t <= DRINGEND_TAGE) return 30;
  if (t <= WARN_TAGE) return 60;
  return undefined;
}

export function statusAnzeige(n: Pick<Nachweis, 'gueltigBis'> | undefined, heute: Datum): { text: string; ton: Ton } {
  if (!n) return { text: 'Fehlt', ton: 'neutral' };
  const s = nachweisStatus(n, heute);
  if (s === 'unbefristet') return { text: 'Vorhanden', ton: 'erfolg' };
  if (s === 'gueltig') return { text: `Bis ${datumFmt(n.gueltigBis)}`, ton: 'erfolg' };
  const t = tageZwischen(heute, n.gueltigBis!);
  if (s === 'laeuft_ab') return { text: t === 0 ? 'Läuft heute ab' : `Läuft in ${t} Tagen ab`, ton: 'achtung' };
  return { text: `Abgelaufen seit ${datumFmt(n.gueltigBis)}`, ton: 'achtung' };
}

/** Aktuellster Nachweis je Mitarbeiter + Qualifikation (spätestes gueltigBis, unbefristet gewinnt) */
export function aktuellerNachweis(nachweise: Nachweis[], maId: ID, qualiId: ID): Nachweis | undefined {
  return nachweise
    .filter((n) => !n.geloeschtAm && n.mitarbeiterId === maId && n.qualifikationId === qualiId)
    .sort((a, b) => (b.gueltigBis ?? '9999').localeCompare(a.gueltigBis ?? '9999'))[0];
}

/** Hat der Mitarbeiter die Qualifikation heute gültig? */
export function hatGueltig(nachweise: Nachweis[], maId: ID, qualiId: ID, heute: Datum): boolean {
  const n = aktuellerNachweis(nachweise, maId, qualiId);
  return !!n && nachweisStatus(n, heute) !== 'abgelaufen';
}
