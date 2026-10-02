/**
 * Abnahme & Unterschrift – eigene Sammlung `abnahmen`.
 * Mängel sind Aufgaben am Auftrag (Kernobjekt), Fotos sind Dokumente, die Unterschrift ist ein Dokument.
 * Die Abnahme verweist nur per ID darauf.
 */
import { db, defineCollection, vermerken } from '@core/db';
import { emit } from '@core/events';
import { heute, plusTage } from '@core/format';
import type { Aufgabe, Auftrag, Basis, Datum, ID, Zeitpunkt } from '@core/objects';
import type { HinweisVorschlag } from '@core/modul';
import { unterschriftSpeichern, type UnterschriftDaten } from './unterschrift';
import type { UnterschriftEingabe } from '@ui/index';

export interface Abnahme extends Basis {
  auftragId: ID;
  datum: Datum;
  ort?: string;
  /** Wer war dabei (Freitext, z. B. „Frau Neumann, Hausverwaltung“) */
  teilnehmer?: string;
  /** Mängel = Aufgaben am Auftrag */
  mangelAufgabeIds: ID[];
  /** Fotos (Dokumente), die ins Protokoll gehören */
  fotoIds: ID[];
  bemerkung?: string;
  status: 'offen' | 'unterschrieben' | 'verweigert';
  verweigertGrund?: string;
  unterschriftKunde?: UnterschriftDaten;
  abgeschlossenAm?: Zeitpunkt;
}

export const abnahmen = defineCollection<Abnahme>('abnahmen');

/** Frist für die Mängelbeseitigung, wenn nichts anderes vereinbart ist */
export const MANGEL_FRIST_TAGE = 14;

export type Ergebnis = 'ohne_maengel' | 'mit_maengeln';

export function ergebnis(mangelIds: ID[]): Ergebnis {
  return mangelIds.length ? 'mit_maengeln' : 'ohne_maengel';
}

export const ERGEBNIS_TEXT: Record<Ergebnis, string> = {
  ohne_maengel: 'Abgenommen ohne Mängel',
  mit_maengeln: 'Abgenommen mit Mängeln (Vorbehalt)',
};

export function offeneMaengel(a: Pick<Abnahme, 'mangelAufgabeIds'>, aufgaben: Aufgabe[]): Aufgabe[] {
  return aufgaben.filter((x) => a.mangelAufgabeIds.includes(x.id) && !x.erledigt && !x.geloeschtAm);
}

/** Offene Abnahme zum Auftrag holen oder neu anlegen – Fotos mit „Nachher“/„Mangel“ sind vorausgewählt */
export function abnahmeStarten(auftragId: ID): Abnahme {
  const offen = abnahmen.all().find((x) => x.auftragId === auftragId && x.status === 'offen');
  if (offen) return offen;
  const auftrag = db.auftraege.get(auftragId);
  const ort = db.orte.get(auftrag?.ortId);
  const kunde = db.kunden.get(auftrag?.kundeId);
  const fotoIds = db.dokumente
    .where((d) => d.auftragId === auftragId && d.art === 'foto' && !!d.tags?.some((t) => t === 'Nachher' || t === 'Mangel'))
    .map((d) => d.id);
  return abnahmen.create({
    auftragId,
    datum: heute(),
    ort: ort?.adresse.ort ?? kunde?.adresse?.ort,
    teilnehmer: kunde?.name,
    mangelAufgabeIds: [],
    fotoIds,
    status: 'offen',
  });
}

/** Mangel erfassen → wird sofort Aufgabe am Auftrag (hohe Priorität, Frist 14 Tage) */
export function mangelHinzufuegen(abnahmeId: ID, text: string, fotoId?: ID): Aufgabe | undefined {
  const a = abnahmen.get(abnahmeId);
  if (!a || !text.trim()) return undefined;
  const aufgabe = db.aufgaben.create({
    titel: `Mangel: ${text.trim()}`,
    auftragId: a.auftragId,
    faellig: plusTage(a.datum, MANGEL_FRIST_TAGE),
    erledigt: false,
    prioritaet: 'hoch',
    quelle: 'abnahme',
  });
  abnahmen.update(abnahmeId, {
    mangelAufgabeIds: [...a.mangelAufgabeIds, aufgabe.id],
    fotoIds: fotoId && !a.fotoIds.includes(fotoId) ? [...a.fotoIds, fotoId] : a.fotoIds,
  });
  return aufgabe;
}

export function mangelEntfernen(abnahmeId: ID, aufgabeId: ID) {
  const a = abnahmen.get(abnahmeId);
  if (!a || a.status !== 'offen') return;
  abnahmen.update(abnahmeId, { mangelAufgabeIds: a.mangelAufgabeIds.filter((x) => x !== aufgabeId) });
  db.aufgaben.remove(aufgabeId);
}

export function abnahmeUnterschreiben(abnahmeId: ID, e: UnterschriftEingabe): Abnahme | undefined {
  const a = abnahmen.get(abnahmeId);
  if (!a || a.status !== 'offen') return undefined;
  const sig = unterschriftSpeichern(a.auftragId, `Unterschrift Abnahme – ${e.name.trim()}`, e);
  const neu = abnahmen.update(abnahmeId, { status: 'unterschrieben', unterschriftKunde: sig, ort: e.ort?.trim() || a.ort, abgeschlossenAm: sig.zeitpunkt });
  const erg = ergebnis(a.mangelAufgabeIds);
  vermerken({ typ: 'auftraege', id: a.auftragId }, 'abnahme.unterschrieben', `Abnahme unterschrieben von ${sig.name} – ${ERGEBNIS_TEXT[erg]}`);
  emit({ typ: 'abnahme.unterschrieben', objekt: neu, daten: { auftragId: a.auftragId, abnahmeId, maengel: a.mangelAufgabeIds.length } });
  return neu;
}

export function abnahmeVerweigert(abnahmeId: ID, grund: string): Abnahme | undefined {
  const a = abnahmen.get(abnahmeId);
  if (!a || a.status !== 'offen') return undefined;
  const neu = abnahmen.update(abnahmeId, { status: 'verweigert', verweigertGrund: grund.trim(), abgeschlossenAm: new Date().toISOString() });
  vermerken({ typ: 'auftraege', id: a.auftragId }, 'abnahme.verweigert', `Abnahme verweigert: ${grund.trim()}`);
  return neu;
}

/** Hinweise: Auftrag wartet auf Abnahme · offene Mängel nach Ablauf der Frist */
export function abnahmeHinweise(auftraege: Auftrag[], liste: Abnahme[], aufgaben: Aufgabe[], tag: Datum): HinweisVorschlag[] {
  const out: HinweisVorschlag[] = [];
  for (const a of auftraege.filter((x) => x.phase === 'abnahme')) {
    const fertig = liste.some((x) => x.auftragId === a.id && x.status === 'unterschrieben');
    if (fertig) continue;
    const verweigert = liste.find((x) => x.auftragId === a.id && x.status === 'verweigert');
    out.push({
      schluessel: `abnahme-fehlt:${a.id}`,
      art: 'entscheidung',
      titel: verweigert ? `Abnahme verweigert: ${a.titel}` : `Abnahme mit Kunde machen: ${a.titel}`,
      text: verweigert ? `Grund: ${verweigert.verweigertGrund}. Kläre das und starte die Abnahme neu.` : `${a.nummer} ist fertig. Ohne unterschriebene Abnahme beginnt keine Gewährleistung und die Schlussrechnung ist angreifbar.`,
      bezug: { typ: 'auftraege', id: a.id },
      gewicht: 64,
      aktionen: [{ aktion: 'abnahme.starten', label: 'Abnahme starten', primaer: true, payload: { auftragId: a.id } }],
    });
  }
  for (const ab of liste.filter((x) => x.status === 'unterschrieben')) {
    const ueber = offeneMaengel(ab, aufgaben).filter((m) => m.faellig && m.faellig < tag);
    if (!ueber.length) continue;
    const auftrag = auftraege.find((x) => x.id === ab.auftragId);
    out.push({
      schluessel: `abnahme-maengel:${ab.id}`,
      art: 'problem',
      titel: ueber.length === 1 ? `Mangel nicht beseitigt: ${auftrag?.titel ?? ''}` : `${ueber.length} Mängel nicht beseitigt: ${auftrag?.titel ?? ''}`,
      text: 'Die Frist aus der Abnahme ist abgelaufen. Plane die Nacharbeit ein.',
      bezug: { typ: 'auftraege', id: ab.auftragId },
      gewicht: 58,
      pfad: `/auftraege/abnahme/${ab.id}`,
    });
  }
  return out;
}
