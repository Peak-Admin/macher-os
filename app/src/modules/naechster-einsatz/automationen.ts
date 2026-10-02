/**
 * Automation „Terminstatus nachziehen“: Vergangene Termine, zu denen Zeiten erfasst sind,
 * die aber nie auf „erledigt“ gesetzt wurden, schließt Macher selbst – rückgängig machbar.
 */
import { db } from '@core/db';
import { erledigt } from '@core/macher';
import { datumVon, isoDatum } from '@core/format';
import type { Automation } from '@core/modul';
import type { Termin } from '@core/objects';

export const STATUS_ID = 'heute.terminstatus';
/** Schätzung: Termin suchen, öffnen, Status ändern ≈ 1 Minute */
export const STATUS_MINUTEN = 1;

/** Termine vor heute, noch offen, mit erfasster Zeit am Termintag */
export function abschliessbareTermine(jetzt = new Date()): Termin[] {
  const tag = isoDatum(jetzt);
  return db.termine.where((t) => {
    if (!t.start || t.status === 'erledigt' || t.status === 'abgesagt') return false;
    const d = datumVon(t.ende || t.start);
    if (d >= tag) return false;
    return db.zeiten.where(
      (z) =>
        z.terminId === t.id ||
        (!!t.auftragId && z.auftragId === t.auftragId && z.datum === datumVon(t.start) && t.mitarbeiterIds.includes(z.mitarbeiterId) && !!z.ende),
    ).length > 0;
  });
}

export function terminstatusNachziehen(jetzt = new Date()): number {
  const liste = abschliessbareTermine(jetzt);
  for (const t of liste) {
    const vorher = t.status;
    db.termine.update(t.id, { status: 'erledigt' }, { text: 'Automatisch abgeschlossen – Zeiten sind erfasst' });
    erledigt(STATUS_ID, `Termin abgeschlossen: ${t.titel}`, {
      text: `Vom ${new Date(t.start).toLocaleDateString('de-DE')}. Zeiten waren erfasst, der Status stand noch auf offen.`,
      bezug: { typ: 'termine', id: t.id },
      minuten: STATUS_MINUTEN,
      rueckgaengig: { aktion: 'heute.termin.status', payload: { terminId: t.id, status: vorher } },
    });
  }
  return liste.length;
}

export const terminstatusAutomation: Automation = {
  id: STATUS_ID,
  titel: 'Vergangene Termine abschließen',
  beschreibung: 'Termine von gestern und früher mit erfassten Zeiten setzt Macher auf „erledigt“.',
  standardAn: true,
  minuten: STATUS_MINUTEN,
  start: () => {
    const t = setInterval(() => terminstatusNachziehen(), 60 * 60_000);
    return () => clearInterval(t);
  },
  pruefen: () => void terminstatusNachziehen(),
};
