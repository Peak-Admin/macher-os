/** Wiederherstellen/Endgültig löschen über die Sammlung, wenn wir sie kennen (dann mit Zeitstrahl-Eintrag) */
import { db, exportieren, importieren, type Collection } from '@core/db';
import type { Basis } from '@core/objects';
import { vorlagen } from '@modules/vorlagen/daten';
import { wissen } from '@modules/wissen/daten';
import { subunternehmer } from '@modules/subunternehmer/daten';

const bekannt: Record<string, Collection<Basis>> = {
  ...(db as unknown as Record<string, Collection<Basis>>),
  vorlagen: vorlagen as unknown as Collection<Basis>,
  wissen: wissen as unknown as Collection<Basis>,
  subunternehmer: subunternehmer as unknown as Collection<Basis>,
};

export function wiederherstellen(sammlung: string, id: string) {
  const c = bekannt[sammlung];
  if (c) return c.restore(id);
  // Sammlung eines anderen Moduls: direkt in den Rohdaten
  const d = exportieren();
  const o = d[sammlung]?.[id];
  if (!o) return;
  delete o.geloeschtAm;
  importieren(d);
}

export function endgueltigLoeschen(eintraege: { sammlung: string; id: string }[]) {
  const d = exportieren();
  for (const e of eintraege) delete d[e.sammlung]?.[e.id];
  importieren(d);
}
