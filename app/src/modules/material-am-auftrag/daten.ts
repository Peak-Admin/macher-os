import { db } from '@core/db';
import { erledigt } from '@core/macher';
import { einstellung } from '@core/einstellungen';
import type { Angebot, ID, Materialbuchung, Position, Rechnung } from '@core/objects';
import { alsPositionen, inRechnung } from './logik';

export function statusSetzen(id: ID, status: Materialbuchung['status']) {
  return db.material.update(id, { status, datum: status === 'verbraucht' ? new Date().toISOString().slice(0, 10) : db.material.get(id)?.datum }, { text: `Material: ${status}` });
}

/**
 * Für das Paket Geld: verbrauchtes, offenes Material eines Auftrags als Rechnungspositionen.
 * Nach dem Versenden markiert die Automation „Material abgerechnet“ die Buchungen.
 */
export function materialFuerRechnung(auftragId: ID): Position[] {
  return alsPositionen(
    db.material.where((b) => b.auftragId === auftragId),
    (id) => db.artikel.get(id),
    einstellung('material.aufschlag', 20),
  );
}

/** Buchungen als abgerechnet markieren – direkt oder über die Rechnungspositionen */
export function materialAbrechnen(rechnung: Pick<Rechnung, 'id' | 'auftragId' | 'positionen'>): Materialbuchung[] {
  if (!rechnung.auftragId) return [];
  const treffer = inRechnung(db.material.where((b) => b.auftragId === rechnung.auftragId), rechnung.positionen);
  treffer.forEach((b) => db.material.update(b.id, { abgerechnetIn: rechnung.id }, { text: 'In Rechnung übernommen' }));
  return treffer;
}

/** Angenommenes Angebot → Material aus Positionen (Artikel und Leistungen mit Material) als „geplant“ */
export function materialAusAngebot(an: Angebot): Materialbuchung[] {
  const vorhanden = new Set(db.material.where((b) => b.auftragId === an.auftragId).map((b) => b.artikelId).filter(Boolean));
  const bedarf = new Map<ID, number>();
  for (const p of an.positionen) {
    if (p.optional || p.art === 'text' || p.art === 'zwischensumme') continue;
    if (p.artikelId) bedarf.set(p.artikelId, (bedarf.get(p.artikelId) ?? 0) + p.menge);
    const l = db.leistungen.get(p.leistungId);
    for (const m of l?.material ?? []) bedarf.set(m.artikelId, (bedarf.get(m.artikelId) ?? 0) + m.menge * p.menge);
  }
  const neu: Materialbuchung[] = [];
  for (const [artikelId, menge] of bedarf) {
    const art = db.artikel.get(artikelId);
    if (!art || vorhanden.has(artikelId)) continue;
    neu.push(db.material.create({ auftragId: an.auftragId, artikelId, text: art.name, menge: Math.round(menge * 100) / 100, einheit: art.einheit, ek: art.ek, status: 'geplant' }));
  }
  const a = db.auftraege.get(an.auftragId);
  if (neu.length && a)
    erledigt('material.aus-angebot', `${a.nummer}: ${neu.length === 1 ? '1 Materialposition' : `${neu.length} Materialpositionen`} aus dem Angebot geplant`, { bezug: { typ: 'auftraege', id: a.id } });
  return neu;
}
