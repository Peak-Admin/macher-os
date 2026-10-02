/**
 * Bedarf: Was fehlt für die anstehenden Aufträge?
 *
 * Fehlmenge je Artikel = geplantes/bestelltes Material aller anstehenden Aufträge
 *   + Auffüllen auf Mindestbestand
 *   − verfügbarer Bestand (Bestand minus bereits bereitgelegtes Material)
 *   − offene Bestellungen (Entwurf, bestellt, Rest bei Teillieferung).
 */
import { db } from '@core/db';
import { datumVon, heute } from '@core/format';
import type { Auftrag, Datum, Einheit, ID } from '@core/objects';
import { inEntwurfUebernehmen, materialInBestellung, offeneMengen, type Bestellung } from '../bestellungen/daten';

export interface BedarfAuftrag {
  auftragId: ID;
  menge: number;
  termin?: Datum;
}

export interface BedarfZeile {
  schluessel: string;
  artikelId?: ID;
  text: string;
  einheit: Einheit;
  lieferantId?: ID;
  /** Menge aus geplanten/bestellten Materialbuchungen */
  benoetigt: number;
  /** Bestand minus bereitgelegtes Material */
  verfuegbar: number;
  /** offene Bestellmenge */
  offen: number;
  mindestbestand: number;
  fehl: number;
  grund: 'auftrag' | 'mindestbestand';
  /** frühester Termin eines betroffenen Auftrags */
  fruehestens?: Datum;
  auftraege: BedarfAuftrag[];
  /** geplante Materialbuchungen, die mit bestellt werden sollen */
  materialIds: ID[];
}

const ANSTEHEND: Auftrag['phase'][] = ['beauftragt', 'in_arbeit', 'abnahme'];
const NIE: Auftrag['phase'][] = ['erledigt', 'verloren', 'abrechnung'];

/** Nächster offener Termin je Auftrag (ab heute, sonst der jüngste offene) */
export function naechsteTermine(t: Datum = heute()): Map<ID, Datum> {
  const m = new Map<ID, Datum>();
  for (const x of db.termine.where((x) => !!x.auftragId && x.status !== 'abgesagt' && x.status !== 'erledigt')) {
    const d = datumVon(x.start);
    if (d < t) continue;
    const alt = m.get(x.auftragId!);
    if (!alt || d < alt) m.set(x.auftragId!, d);
  }
  return m;
}

/** Aufträge, für die Material beschafft werden muss */
export function anstehendeAuftraege(termine = naechsteTermine()): Auftrag[] {
  return db.auftraege.where((a) => !NIE.includes(a.phase) && (ANSTEHEND.includes(a.phase) || termine.has(a.id)));
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function berechneBedarf(t: Datum = heute()): BedarfZeile[] {
  const termine = naechsteTermine(t);
  const auftraege = new Map(anstehendeAuftraege(termine).map((a) => [a.id, a]));
  const offen = offeneMengen();
  const inBestellung = materialInBestellung();
  const zeilen = new Map<string, BedarfZeile>();

  // reserviert: bereits bereitgelegtes Material offener Aufträge (liegt physisch im Lager, ist aber verplant)
  const reserviert = new Map<ID, number>();
  for (const m of db.material.where((m) => m.status === 'bereit' && !!m.artikelId && auftraege.has(m.auftragId))) {
    reserviert.set(m.artikelId!, (reserviert.get(m.artikelId!) ?? 0) + m.menge);
  }

  const zeileFuer = (artikelId: ID | undefined, text: string, einheit: Einheit): BedarfZeile => {
    const schluessel = artikelId ?? `text:${text.trim().toLowerCase()}|${einheit}`;
    let z = zeilen.get(schluessel);
    if (!z) {
      const a = db.artikel.get(artikelId);
      z = {
        schluessel,
        artikelId: a?.id,
        text: a?.name ?? text,
        einheit: a?.einheit ?? einheit,
        lieferantId: a?.lieferantId,
        benoetigt: 0,
        verfuegbar: a ? Math.max(0, (a.bestand ?? 0) - (reserviert.get(a.id) ?? 0)) : 0,
        offen: a ? (offen.get(a.id) ?? 0) : 0,
        mindestbestand: a?.mindestbestand ?? 0,
        fehl: 0,
        grund: 'auftrag',
        auftraege: [],
        materialIds: [],
      };
      zeilen.set(schluessel, z);
    }
    return z;
  };

  for (const m of db.material.where((m) => (m.status === 'geplant' || m.status === 'bestellt') && auftraege.has(m.auftragId))) {
    const artikel = db.artikel.get(m.artikelId);
    // Freitext-Material, das schon in einer Bestellung steckt, ist abgedeckt
    if (!artikel && inBestellung.has(m.id)) continue;
    // Freitext-Material mit Status „bestellt“ wurde außerhalb bestellt
    if (!artikel && m.status === 'bestellt') continue;
    const z = zeileFuer(artikel?.id, m.text, m.einheit);
    z.benoetigt = r3(z.benoetigt + m.menge);
    const termin = termine.get(m.auftragId);
    const vorhanden = z.auftraege.find((x) => x.auftragId === m.auftragId);
    if (vorhanden) vorhanden.menge = r3(vorhanden.menge + m.menge);
    else z.auftraege.push({ auftragId: m.auftragId, menge: m.menge, termin });
    if (termin && (!z.fruehestens || termin < z.fruehestens)) z.fruehestens = termin;
    if (m.status === 'geplant' && !inBestellung.has(m.id)) z.materialIds.push(m.id);
  }

  // Lagerartikel unter Mindestbestand (auch ohne Auftrag)
  for (const a of db.artikel.where((a) => a.aktiv && (a.mindestbestand ?? 0) > 0)) zeileFuer(a.id, a.name, a.einheit);

  return [...zeilen.values()]
    .map((z) => {
      const fehl = r3(Math.max(0, z.benoetigt + z.mindestbestand - z.verfuegbar - z.offen));
      const nurAuftrag = r3(Math.max(0, z.benoetigt - z.verfuegbar - z.offen));
      return { ...z, fehl, grund: nurAuftrag > 0 ? ('auftrag' as const) : ('mindestbestand' as const) };
    })
    .filter((z) => z.fehl > 0)
    .sort((a, b) => {
      if (a.grund !== b.grund) return a.grund === 'auftrag' ? -1 : 1;
      return (a.fruehestens ?? '9999').localeCompare(b.fruehestens ?? '9999') || a.text.localeCompare(b.text, 'de');
    });
}

/** Bedarf → Bestellentwürfe je Lieferant (bestehende Entwürfe werden ergänzt). */
export function bestellvorschlag(zeilen: BedarfZeile[] = berechneBedarf()): Bestellung[] {
  const jeLieferant = new Map<string, BedarfZeile[]>();
  for (const z of zeilen) {
    if (z.fehl <= 0) continue;
    const k = z.lieferantId ?? '';
    jeLieferant.set(k, [...(jeLieferant.get(k) ?? []), z]);
  }
  const ergebnis: Bestellung[] = [];
  for (const [lieferantId, liste] of jeLieferant) {
    ergebnis.push(
      inEntwurfUebernehmen(
        lieferantId || undefined,
        liste.map((z) => ({
          artikelId: z.artikelId,
          text: z.text,
          menge: z.fehl,
          einheit: z.einheit,
          ek: db.artikel.get(z.artikelId)?.ek ?? db.material.get(z.materialIds[0])?.ek ?? 0,
          materialIds: z.materialIds,
        })),
      ),
    );
  }
  return ergebnis;
}

export function bedarfZusammenfassung(zeilen: BedarfZeile[]) {
  const auftrag = zeilen.filter((z) => z.grund === 'auftrag');
  return { gesamt: zeilen.length, auftrag: auftrag.length, mindest: zeilen.length - auftrag.length, fruehestens: auftrag.map((z) => z.fruehestens).filter(Boolean).sort()[0] };
}
