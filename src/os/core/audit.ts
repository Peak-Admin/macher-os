/**
 * Audit & Rückgängig – Hintergrund-Infrastruktur.
 *
 * Die Datenschicht protokolliert jede Änderung automatisch im Verlauf des Objekts (`ereignisse`):
 * wer (Mensch, Automation, Macher, Import, Abgleich), wann, was (angelegt/geändert/gelöscht) und – bei
 * Änderungen – nur die geänderten Felder mit vorher/nachher. Sichtbar ist das als „Verlauf“ am Objekt
 * (Zeitstrahl) in Klartext; ein eigenes Audit-Modul gibt es bewusst nicht.
 *
 * Hier: Rückgängig machen, Abfragen und Rotation (Speicher begrenzen).
 */
import { db, sammlung, vergessen } from './db';
import { alsAkteur } from './akteur';
import type { Basis, Ereignis, ID } from './objects';

// ------------------------------------------------------------------ Sperren

type Sperre = (aktuell: Basis | undefined, e: Ereignis) => string | undefined;
const sperren = new Map<string, Sperre[]>();

/**
 * Rückgängig für eine Sammlung einschränken. Die Funktion gibt einen Grund zurück, wenn es nicht geht.
 * Beispiel (Kern): festgeschriebene Rechnungen ändert man nur per Storno.
 */
export function rueckgaengigSperre(name: string, fn: Sperre) {
  sperren.set(name, [...(sperren.get(name) ?? []), fn]);
}

const status = (o: Basis | undefined) => (o as { status?: string } | undefined)?.status;

rueckgaengigSperre('rechnungen', (r, e) => {
  const vorher = e.felder?.status?.vorher;
  if ((r && status(r) !== 'entwurf') || (vorher !== undefined && vorher !== 'entwurf'))
    return 'Festgeschriebene Rechnungen änderst du nur über eine Stornorechnung.';
  return undefined;
});
rueckgaengigSperre('zahlungen', () => 'Zahlungen nimmst du in der Zahlung selbst zurück.');

// ------------------------------------------------------------------ Rückgängig

const gleich = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Lässt sich dieser Verlaufseintrag zurücknehmen? Gibt einen Grund zurück, wenn nicht. */
export function rueckgaengigGrund(e: Ereignis | undefined): string | undefined {
  if (!e || !e.aenderung) return 'Dieser Eintrag lässt sich nicht zurücknehmen.';
  if (e.rueckgaengigAm) return 'Schon rückgängig gemacht.';
  const c = sammlung(e.bezug.typ);
  if (!c) return 'Dieser Eintrag lässt sich nicht zurücknehmen.';
  const aktuell = c.get(e.bezug.id);
  for (const s of sperren.get(e.bezug.typ) ?? []) {
    const grund = s(aktuell, e);
    if (grund) return grund;
  }
  switch (e.aenderung) {
    case 'created':
      return !aktuell || aktuell.geloeschtAm ? 'Liegt schon im Papierkorb.' : undefined;
    case 'removed':
      return !aktuell ? 'Wurde endgültig gelöscht.' : !aktuell.geloeschtAm ? 'Ist schon wiederhergestellt.' : undefined;
    case 'restored':
      return !aktuell || aktuell.geloeschtAm ? 'Liegt schon im Papierkorb.' : undefined;
    case 'updated': {
      if (!aktuell) return 'Wurde endgültig gelöscht.';
      if (!e.felder || !Object.keys(e.felder).length) return 'Es wurde nichts Erkennbares geändert.';
      if (Object.values(e.felder).some((f) => f.gekuerzt)) return 'Die Änderung ist zu groß, um sie zurückzunehmen.';
      if (Object.values(e.felder).some((f) => f.geschuetzt)) return 'Geld- und Lohnangaben nimmst du direkt im Objekt zurück.';
      const a = aktuell as unknown as Record<string, unknown>;
      if (Object.entries(e.felder).some(([k, f]) => !gleich(a[k], f.nachher))) return 'Wurde inzwischen weiter geändert.';
      return undefined;
    }
  }
}

/**
 * Verlaufseintrag zurücknehmen: Anlegen → Papierkorb, Löschen → wiederherstellen, Ändern → vorher-Stand.
 * Läuft als die angegebene Quelle (Standard: Mensch). Wirft mit Klartext-Grund, wenn es nicht geht.
 */
export function rueckgaengig(ereignisId: ID): void {
  const e = db.ereignisse.get(ereignisId);
  const grund = rueckgaengigGrund(e);
  if (grund || !e) throw new Error(grund ?? 'Nicht gefunden.');
  const c = sammlung(e.bezug.typ)!;
  switch (e.aenderung) {
    case 'created':
    case 'restored':
      c.remove(e.bezug.id);
      break;
    case 'removed':
      c.restore(e.bezug.id);
      break;
    case 'updated': {
      const patch: Record<string, unknown> = {};
      for (const [k, f] of Object.entries(e.felder!)) patch[k] = f.vorher;
      c.update(e.bezug.id, patch as never, { text: 'Änderung rückgängig gemacht' });
      break;
    }
  }
  db.ereignisse.update(e.id, { rueckgaengigAm: new Date().toISOString() }, { leise: true });
}

/** Mehrere Einträge (z. B. alles, was eine Macher-Aktion getan hat) in umgekehrter Reihenfolge zurücknehmen */
export function allesRueckgaengig(ereignisIds: ID[]): { ok: number; fehler: string[] } {
  let ok = 0;
  const fehler: string[] = [];
  const liste = ereignisIds
    .map((id) => db.ereignisse.get(id))
    .filter((e): e is Ereignis => !!e && !!e.aenderung)
    // in umgekehrter Reihenfolge des Entstehens
    .reverse();
  for (const e of liste) {
    // Anlegen + Ändern desselben Objekts: es reicht, das Anlegen zurückzunehmen
    if (e.aenderung === 'updated' && liste.some((x) => x.aenderung === 'created' && x.bezug.id === e.bezug.id && x.bezug.typ === e.bezug.typ)) continue;
    try {
      alsAkteur({ quelle: 'user' }, () => rueckgaengig(e.id));
      ok++;
    } catch (err) {
      fehler.push(err instanceof Error ? err.message : String(err));
    }
  }
  return { ok, fehler };
}

// ------------------------------------------------------------------ Abfragen

/** Automatisch protokollierte Änderungen, neueste zuerst (optional gefiltert) */
export function letzteAenderungen(opts: { quelle?: Ereignis['quelle']; mitarbeiterId?: ID; seit?: string; max?: number; nurRueckgaengigBar?: boolean } = {}): Ereignis[] {
  return db.ereignisse
    .where(
      (e) =>
        !!e.aenderung &&
        (!opts.quelle || (e.quelle ?? 'user') === opts.quelle) &&
        (!opts.mitarbeiterId || e.vonMitarbeiterId === opts.mitarbeiterId) &&
        (!opts.seit || e.geaendertAm >= opts.seit) &&
        (!opts.nurRueckgaengigBar || !rueckgaengigGrund(e)),
    )
    .sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm))
    .slice(0, opts.max ?? 50);
}

// ------------------------------------------------------------------ Rotation

/**
 * Verlauf begrenzen (nur auf diesem Gerät, der Server behält alles): automatische Einträge älter als
 * `maxTage` und alles über `maxEintraege` hinaus fallen weg. Eigene Vermerke (Angebot versendet …) bleiben
 * länger: sie zählen erst ab der doppelten Grenze.
 */
export function verlaufAufraeumen(opts: { maxTage?: number; maxEintraege?: number; jetzt?: Date } = {}): number {
  const jetzt = opts.jetzt ?? new Date();
  const maxTage = opts.maxTage ?? 365;
  const max = opts.maxEintraege ?? 20_000;
  const grenze = new Date(jetzt.getTime() - maxTage * 86_400_000).toISOString();
  const alle = db.ereignisse
    .allMitGeloeschten()
    .map((e, i) => [e, i] as const)
    .sort(([a, ia], [b, ib]) => b.erstelltAm.localeCompare(a.erstelltAm) || ib - ia)
    .map(([e]) => e);
  const weg: ID[] = [];
  let auto = 0;
  let gesamt = 0;
  for (const e of alle) {
    gesamt++;
    if (e.aenderung) {
      auto++;
      if (auto > max || e.erstelltAm < grenze) weg.push(e.id);
    } else if (gesamt > max * 2) weg.push(e.id);
  }
  vergessen('ereignisse', weg);
  return weg.length;
}
