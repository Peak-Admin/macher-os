/** Suche: eigene Provider für Kernobjekte ohne Besitzer-Suche, Duplikate entfernen, gruppieren. */
import { db } from '@core/db';
import { datumKurz, euro, passt, summen, uhrzeit } from '@core/format';
import { pfadZu, type Treffer } from '@core/modul';
import { OBJEKT_LABEL } from '@core/objects';

/** Termine, Rechnungsnummern und Dokumente – deckt sonst niemand ab. */
export function eigeneTreffer(q: string, opts: { geld: boolean } = { geld: true }): Treffer[] {
  if (!q.trim()) return [];
  const t: Treffer[] = [];

  for (const x of db.termine.where((x) => passt(q, x.titel, x.notiz, db.kunden.get(x.kundeId)?.name, db.orte.get(x.ortId)?.adresse?.ort)).slice(0, 6)) {
    const pfad = pfadZu({ typ: 'termine', id: x.id }) ?? (x.auftragId ? pfadZu({ typ: 'auftraege', id: x.auftragId }) : undefined);
    if (!pfad) continue;
    t.push({ typ: 'Termin', titel: x.titel || 'Termin', untertitel: `${datumKurz(x.start)}, ${uhrzeit(x.start)} Uhr${x.kundeId ? ' · ' + (db.kunden.get(x.kundeId)?.name ?? '') : ''}`, pfad, relevanz: 40 });
  }

  // Rechnungsnummer: exakter Treffer zuerst, auch ohne Geld-Recht (Nummer ist kein Betrag)
  const nq = q.trim().toLowerCase();
  const ust = db.betrieb.get('betrieb')?.ustSatz ?? 19;
  for (const r of db.rechnungen.where((r) => r.nummer.toLowerCase().includes(nq) || passt(q, r.nummer, r.titel, db.kunden.get(r.kundeId)?.name)).slice(0, 6)) {
    const pfad = pfadZu({ typ: 'rechnungen', id: r.id });
    if (!pfad) continue;
    t.push({
      typ: 'Rechnung',
      titel: `${r.nummer} · ${r.titel}`,
      untertitel: [db.kunden.get(r.kundeId)?.name, opts.geld ? euro(summen(r.positionen, ust).brutto) : undefined].filter(Boolean).join(' · '),
      pfad,
      relevanz: r.nummer.toLowerCase() === nq ? 95 : 50,
    });
  }

  for (const d of db.dokumente.where((d) => passt(q, d.titel, d.text, ...(d.tags ?? []))).slice(0, 6)) {
    const pfad = pfadZu({ typ: 'dokumente', id: d.id }) ?? (d.auftragId ? pfadZu({ typ: 'auftraege', id: d.auftragId }) : undefined);
    if (!pfad) continue;
    t.push({ typ: 'Dokument', titel: d.titel, untertitel: d.auftragId ? db.auftraege.get(d.auftragId)?.titel : OBJEKT_LABEL.dokumente, pfad, relevanz: 30 });
  }
  return t;
}

/** Gleicher Pfad = gleiches Objekt → nur der relevanteste Treffer bleibt. */
export function ohneDoppelte(liste: Treffer[]): Treffer[] {
  const best = new Map<string, Treffer>();
  for (const t of liste) {
    const vorher = best.get(t.pfad);
    if (!vorher || (t.relevanz ?? 0) > (vorher.relevanz ?? 0)) best.set(t.pfad, t);
  }
  return [...best.values()].sort((a, b) => (b.relevanz ?? 0) - (a.relevanz ?? 0));
}

export interface Gruppe {
  typ: string;
  treffer: Treffer[];
}

/** Nach Typ gruppieren – Gruppe mit dem besten Treffer zuerst, je Gruppe höchstens `max`. */
export function gruppieren(liste: Treffer[], max = 5): Gruppe[] {
  const gruppen: Gruppe[] = [];
  for (const t of liste) {
    let g = gruppen.find((x) => x.typ === t.typ);
    if (!g) gruppen.push((g = { typ: t.typ, treffer: [] }));
    if (g.treffer.length < max) g.treffer.push(t);
  }
  return gruppen;
}

/** Letzte Suchbegriffe: neuester zuerst, ohne Doppelte, höchstens 6 */
export function merkeSuche(liste: string[], q: string): string[] {
  const s = q.trim();
  if (s.length < 2) return liste;
  return [s, ...liste.filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, 6);
}
