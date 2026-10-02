/**
 * Geschäftsdokumente, die es bisher nicht gab: Auftragsbestätigung und Lieferschein.
 * Eigene Sammlung `geschaeftsdokumente` – sie verweist nur per ID: Positionen kommen aus dem angenommenen Angebot,
 * gelieferte Mengen aus den Materialbuchungen am Auftrag. Nichts wird kopiert.
 * (Ausnahme: Auftragsbestätigung ohne Angebot – dann sind die Positionen der Inhalt des Dokuments selbst, wie beim Angebot.)
 */
import { db, defineCollection, neueId, vermerken } from '@core/db';
import { emit } from '@core/events';
import { datum, heute, summen } from '@core/format';
import type { Auftrag, Basis, Datum, ID, Materialbuchung, Position, Zeitpunkt } from '@core/objects';
import type { UnterschriftEingabe } from '@ui/index';
import { unterschriftSpeichern, type UnterschriftDaten } from '@modules/abnahme/unterschrift';
import { naechsteDokumentNummer } from './nummern';

export type GeschaeftsArt = 'auftragsbestaetigung' | 'lieferschein';

export const GESCHAEFTS_LABEL: Record<GeschaeftsArt, string> = {
  auftragsbestaetigung: 'Auftragsbestätigung',
  lieferschein: 'Lieferschein',
};

export interface Geschaeftsdokument extends Basis {
  art: GeschaeftsArt;
  nummer: string;
  auftragId: ID;
  kundeId: ID;
  datum: Datum;
  titel: string;
  /** Einleitung (aus dem Textbaustein, änderbar) */
  text?: string;
  /** Schlusstext (aus dem Textbaustein, änderbar) */
  schluss?: string;
  /** Auftragsbestätigung: Positionen kommen aus diesem (angenommenen) Angebot */
  angebotId?: ID;
  /** Auftragsbestätigung ohne Angebot: eigene Positionen */
  positionen?: Position[];
  /** geplanter Ausführungszeitraum, z. B. „KW 42“ */
  ausfuehrung?: string;
  /** Lieferschein: gelieferte Materialbuchungen */
  materialIds?: ID[];
  status: 'entwurf' | 'versendet' | 'unterschrieben';
  versendetAm?: Zeitpunkt;
  /** Lieferschein: Empfang bestätigt */
  unterschrift?: UnterschriftDaten;
}

export const geschaeftsdokumente = defineCollection<Geschaeftsdokument>('geschaeftsdokumente');

export const STATUS_TEXT: Record<Geschaeftsdokument['status'], { text: string; ton: 'neutral' | 'aktiv' | 'erfolg' }> = {
  entwurf: { text: 'Entwurf', ton: 'neutral' },
  versendet: { text: 'Versendet', ton: 'aktiv' },
  unterschrieben: { text: 'Unterschrieben', ton: 'erfolg' },
};

// ------------------------------------------------------------------ Inhalt (aufgelöst, nicht kopiert)

/** Das angenommene (sonst neueste versendete) Angebot eines Auftrags */
export function angebotFuerBestaetigung(auftragId: ID) {
  const liste = db.angebote.where((a) => a.auftragId === auftragId && a.status !== 'abgelehnt' && a.status !== 'abgelaufen');
  const sortiert = liste.sort((a, b) => b.version - a.version || b.datum.localeCompare(a.datum));
  return sortiert.find((a) => a.status === 'angenommen') ?? sortiert.find((a) => a.status === 'versendet');
}

/** Material, das auf einen Lieferschein gehört: bereitgestellt oder verbraucht */
export const lieferbaresMaterial = (auftragId: ID, alle: Materialbuchung[] = db.material.all()) =>
  alle.filter((m) => m.auftragId === auftragId && (m.status === 'bereit' || m.status === 'verbraucht'));

/** Positionen eines Dokuments – immer frisch aus der Quelle */
export function positionenVon(d: Pick<Geschaeftsdokument, 'art' | 'angebotId' | 'positionen' | 'materialIds'>): Position[] {
  if (d.art === 'lieferschein')
    return (d.materialIds ?? [])
      .map((id) => db.material.get(id))
      .filter((m): m is Materialbuchung => !!m)
      .map((m) => ({ id: m.id, art: 'material', text: m.text || db.artikel.get(m.artikelId)?.name || 'Material', menge: m.menge, einheit: m.einheit, einzelpreis: 0, artikelId: m.artikelId }));
  const a = db.angebote.get(d.angebotId);
  if (a) return a.positionen.filter((p) => !p.optional);
  return d.positionen ?? [];
}

/** Summe (nur Auftragsbestätigung) – mit Rabatt des Angebots */
export function summeVon(d: Geschaeftsdokument, ustSatz: number) {
  const a = db.angebote.get(d.angebotId);
  return summen(positionenVon(d), ustSatz, a?.rabattProzent ?? 0);
}

/** Geplante Einsätze als Text für die Auftragsbestätigung */
export function ausfuehrungAus(auftragId: ID): string | undefined {
  const tage = db.termine
    .where((t) => t.auftragId === auftragId && t.status !== 'abgesagt' && t.start.slice(0, 10) >= heute())
    .map((t) => t.start.slice(0, 10))
    .sort();
  if (!tage.length) return undefined;
  const von = tage[0];
  const bis = tage[tage.length - 1];
  return von === bis ? `am ${datum(von)}` : `vom ${datum(von)} bis ${datum(bis)}`;
}

// ------------------------------------------------------------------ Anlegen & Ändern

const standardTitel = (art: GeschaeftsArt, a: Auftrag) => `${GESCHAEFTS_LABEL[art]} – ${a.titel}`;

/**
 * Auftragsbestätigung oder Lieferschein am Auftrag anlegen. Gibt es schon einen Entwurf derselben Art, kommt der zurück.
 * `texte` sind die Einleitung/der Schluss aus den Textbausteinen (vom Aufrufer mit Variablen gefüllt).
 */
export function geschaeftsdokumentErstellen(auftragId: ID, art: GeschaeftsArt, texte: { text?: string; schluss?: string } = {}): Geschaeftsdokument | undefined {
  const a = db.auftraege.get(auftragId);
  if (!a) return undefined;
  const vorhanden = geschaeftsdokumente.all().find((d) => d.auftragId === auftragId && d.art === art && d.status === 'entwurf');
  if (vorhanden) return vorhanden;
  const angebot = art === 'auftragsbestaetigung' ? angebotFuerBestaetigung(auftragId) : undefined;
  const ohneAngebot =
    art === 'auftragsbestaetigung' && !angebot
      ? (a.leistungIds ?? [])
          .map((id) => db.leistungen.get(id))
          .filter((l) => !!l)
          .map((l) => ({ id: neueId('p'), art: 'leistung' as const, text: l!.name, menge: 1, einheit: l!.einheit, einzelpreis: l!.preis, leistungId: l!.id }))
      : undefined;
  const d = geschaeftsdokumente.create({
    art,
    nummer: naechsteDokumentNummer(art, geschaeftsdokumente.allMitGeloeschten().map((x) => x.nummer)),
    auftragId,
    kundeId: a.kundeId,
    datum: heute(),
    titel: standardTitel(art, a),
    text: texte.text,
    schluss: texte.schluss,
    angebotId: angebot?.id,
    positionen: ohneAngebot,
    ausfuehrung: art === 'auftragsbestaetigung' ? ausfuehrungAus(auftragId) : undefined,
    materialIds: art === 'lieferschein' ? lieferbaresMaterial(auftragId).map((m) => m.id) : undefined,
    status: 'entwurf',
    beispiel: a.beispiel,
  });
  vermerken({ typ: 'auftraege', id: auftragId }, `${art}.erstellt`, `${GESCHAEFTS_LABEL[art]} ${d.nummer} angelegt`);
  emit({ typ: 'dokument.erstellt', sammlung: 'geschaeftsdokumente', objekt: d, daten: { art, auftragId, bezug: { typ: 'geschaeftsdokumente', id: d.id } } });
  return d;
}

/** Material des Lieferscheins neu einlesen (nur im Entwurf) */
export function lieferscheinAktualisieren(id: ID) {
  const d = geschaeftsdokumente.get(id);
  if (!d || d.art !== 'lieferschein' || d.status !== 'entwurf') return d;
  return geschaeftsdokumente.update(id, { materialIds: lieferbaresMaterial(d.auftragId).map((m) => m.id) }, { leise: true });
}

/** Als versendet markieren und fachlich melden (`auftragsbestaetigung.versendet`, `lieferschein.versendet`) */
export function alsVersendet(id: ID, weg: string): Geschaeftsdokument | undefined {
  const d = geschaeftsdokumente.get(id);
  if (!d) return undefined;
  const neu = d.status === 'entwurf' ? geschaeftsdokumente.update(id, { status: 'versendet', versendetAm: new Date().toISOString() }, { text: weg }) : d;
  vermerken({ typ: 'auftraege', id: d.auftragId }, `${d.art}.versendet`, `${GESCHAEFTS_LABEL[d.art]} ${d.nummer} versendet`);
  emit({ typ: `${d.art}.versendet`, sammlung: 'geschaeftsdokumente', objekt: neu, daten: { auftragId: d.auftragId } });
  return neu;
}

/** Lieferschein: Empfang vom Kunden unterschreiben lassen */
export function empfangBestaetigen(id: ID, e: UnterschriftEingabe): Geschaeftsdokument | undefined {
  const d = geschaeftsdokumente.get(id);
  if (!d || d.status === 'unterschrieben') return d;
  const sig = unterschriftSpeichern(d.auftragId, `Unterschrift ${GESCHAEFTS_LABEL[d.art]} ${d.nummer} – ${e.name.trim()}`, e);
  const neu = geschaeftsdokumente.update(id, { status: 'unterschrieben', unterschrift: sig }, { text: `Unterschrieben von ${sig.name}` });
  vermerken({ typ: 'auftraege', id: d.auftragId }, `${d.art}.unterschrieben`, `${GESCHAEFTS_LABEL[d.art]} ${d.nummer} unterschrieben von ${sig.name}`);
  emit({ typ: `${d.art}.unterschrieben`, sammlung: 'geschaeftsdokumente', objekt: neu, daten: { auftragId: d.auftragId } });
  return neu;
}
