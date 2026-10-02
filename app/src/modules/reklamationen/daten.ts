/**
 * Gewährleistung & Reklamationen. Eigene Sammlung `reklamationen`.
 * Nacharbeit ist ein normaler Auftrag (`art: 'reklamation'`), Fotos sind `dokumente`.
 */
import { batch, db, defineCollection, vermerken } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { datum, heute, plusTage, tageZwischen, plusMonate } from '@core/format';
import { naechsteNummer } from '@core/nummern';
import type { Auftrag, Basis, Datum, ID, Kanal } from '@core/objects';

/** Rechtsgrundlage der Mängelhaftung */
export type Grundlage = 'bgb_bau' | 'bgb' | 'vob_bau' | 'vob';

export const GRUNDLAGEN: { wert: Grundlage; label: string; jahre: number; text: string }[] = [
  { wert: 'bgb_bau', label: 'BGB – Bauwerk', jahre: 5, text: '§ 634a BGB: 5 Jahre bei Arbeiten an einem Bauwerk' },
  { wert: 'bgb', label: 'BGB – sonstige Arbeiten', jahre: 2, text: '§ 634a BGB: 2 Jahre bei Reparatur, Wartung, sonstigen Werken' },
  { wert: 'vob_bau', label: 'VOB/B – Bauwerk', jahre: 4, text: '§ 13 Abs. 4 VOB/B: 4 Jahre bei Bauwerken (wenn VOB/B vereinbart)' },
  { wert: 'vob', label: 'VOB/B – sonstige Arbeiten', jahre: 2, text: '§ 13 Abs. 4 VOB/B: 2 Jahre bei anderen Werken' },
];
export const grundlage = (g: Grundlage) => GRUNDLAGEN.find((x) => x.wert === g) ?? GRUNDLAGEN[1];

export type Bewertung = 'gewaehrleistung' | 'kostenpflichtig' | 'kulanz' | 'offen';

export const BEWERTUNG_TEXT: Record<Bewertung, string> = {
  gewaehrleistung: 'Auf Gewährleistung',
  kostenpflichtig: 'Kostenpflichtig',
  kulanz: 'Kulanz',
  offen: 'Noch zu klären',
};

export type ReklamationStatus = 'neu' | 'in_arbeit' | 'erledigt' | 'abgelehnt';

export const STATUS_TEXT: Record<ReklamationStatus, string> = {
  neu: 'Neu',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
  abgelehnt: 'Abgelehnt',
};

export interface Reklamation extends Basis {
  nummer: string;
  /** Mangel in einem Satz */
  titel: string;
  beschreibung?: string;
  kundeId: ID;
  /** ursprünglicher Auftrag, an dem der Mangel auftritt */
  auftragId?: ID;
  anlageId?: ID;
  ortId?: ID;
  gemeldetAm: Datum;
  kanal?: Kanal;
  grundlage: Grundlage;
  /** Abnahme-/Abschlussdatum von Hand (sonst aus dem Auftrag) */
  abnahmeAm?: Datum;
  bewertung: Bewertung;
  /** Frist zur Beseitigung */
  fristBis?: Datum;
  status: ReklamationStatus;
  nacharbeitAuftragId?: ID;
  erledigtAm?: Datum;
  /** Grund bei Ablehnung */
  grund?: string;
}

export const reklamationen = defineCollection<Reklamation>('reklamationen');

export const fristTage = () => einstellung<number>('reklamationen.fristTage', 14);

// ------------------------------------------------------------------ Gewährleistung prüfen

export interface Pruefung {
  ergebnis: 'gewaehrleistung' | 'kostenpflichtig' | 'unklar';
  /** Gewährleistung bis (inklusive) */
  bis?: Datum;
  /** Referenzdatum (Abnahme/Abschluss) */
  ab?: Datum;
  /** woher die Angabe stammt */
  quelle: string;
  /** Tage bis Ende (negativ = abgelaufen) */
  restTage?: number;
}

/**
 * Reine Prüfung: Mangel gemeldet am X – liegt das innerhalb der Gewährleistung?
 * Vorrang: ausdrückliches Gewährleistungsende der Anlage, dann Abnahme/Abschluss + Frist.
 */
export function pruefeGewaehrleistung(p: {
  gemeldetAm: Datum;
  grundlage: Grundlage;
  abnahmeAm?: Datum;
  anlageGewaehrleistungBis?: Datum;
}): Pruefung {
  let bis: Datum | undefined;
  let quelle: string;
  if (p.anlageGewaehrleistungBis) {
    bis = p.anlageGewaehrleistungBis;
    quelle = 'Gewährleistung bis laut Anlage';
  } else if (p.abnahmeAm) {
    const g = grundlage(p.grundlage);
    bis = plusTage(plusMonate(p.abnahmeAm, g.jahre * 12), -1);
    quelle = `Abnahme ${datum(p.abnahmeAm)} + ${g.jahre} Jahre (${g.label})`;
  } else {
    return { ergebnis: 'unklar', quelle: 'Kein Abnahme- oder Abschlussdatum bekannt' };
  }
  const restTage = tageZwischen(p.gemeldetAm, bis);
  return { ergebnis: restTage >= 0 ? 'gewaehrleistung' : 'kostenpflichtig', bis, ab: p.abnahmeAm, quelle, restTage };
}

/** Abnahme-/Abschlussdatum: von Hand → Auftrag abgeschlossen am */
export function referenzDatum(r: Pick<Reklamation, 'abnahmeAm' | 'auftragId'>): Datum | undefined {
  if (r.abnahmeAm) return r.abnahmeAm;
  const a = db.auftraege.get(r.auftragId);
  return a?.abgeschlossenAm?.slice(0, 10);
}

export function pruefen(r: Pick<Reklamation, 'abnahmeAm' | 'auftragId' | 'anlageId' | 'gemeldetAm' | 'grundlage'>): Pruefung {
  return pruefeGewaehrleistung({
    gemeldetAm: r.gemeldetAm,
    grundlage: r.grundlage,
    abnahmeAm: referenzDatum(r),
    anlageGewaehrleistungBis: db.anlagen.get(r.anlageId)?.gewaehrleistungBis,
  });
}

/** Vorschlag für die Rechtsgrundlage aus der Auftragsart */
export function grundlageVorschlag(auftrag: Auftrag | undefined): Grundlage {
  return auftrag?.art === 'projekt' ? 'bgb_bau' : 'bgb';
}

// ------------------------------------------------------------------ Nacharbeit & Status

export function naechsteReklamationsnummer(jahr = new Date().getFullYear()) {
  const start = `RK-${jahr}-`;
  const max = reklamationen
    .allMitGeloeschten()
    .map((r) => r.nummer)
    .filter((n) => n?.startsWith(start))
    .map((n) => Number(n.slice(start.length)))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(3, '0')}`;
}

/** Nacharbeitsauftrag anlegen (idempotent: gibt vorhandenen zurück) */
export function nacharbeitAnlegen(reklamationId: ID): Auftrag | undefined {
  const r = reklamationen.get(reklamationId);
  if (!r) return undefined;
  const vorhanden = db.auftraege.get(r.nacharbeitAuftragId);
  if (vorhanden && !vorhanden.geloeschtAm) return vorhanden;
  const ursprung = db.auftraege.get(r.auftragId);
  const kostenpflichtig = r.bewertung === 'kostenpflichtig';
  const a = db.auftraege.create({
    nummer: naechsteNummer('auftrag'),
    titel: `Nacharbeit: ${r.titel}`,
    art: 'reklamation',
    // kostenpflichtig: erst Zustimmung/Angebot, sonst direkt beauftragt
    phase: kostenpflichtig ? 'angebot' : 'beauftragt',
    kundeId: r.kundeId,
    ortId: r.ortId ?? ursprung?.ortId ?? db.anlagen.get(r.anlageId)?.ortId,
    anlageIds: r.anlageId ? [r.anlageId] : undefined,
    beschreibung: [
      `Reklamation ${r.nummer}${ursprung ? ` zu Auftrag ${ursprung.nummer}` : ''}.`,
      r.beschreibung,
      `${BEWERTUNG_TEXT[r.bewertung]}${r.bewertung === 'gewaehrleistung' || r.bewertung === 'kulanz' ? ' – nicht berechnen.' : '.'}`,
      r.fristBis ? `Frist zur Beseitigung: ${datum(r.fristBis)}.` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    dringend: !!r.fristBis && tageZwischen(heute(), r.fristBis) <= 7,
    wunschtermin: r.fristBis ? `bis ${datum(r.fristBis)}` : undefined,
    qualifikationIds: ursprung?.qualifikationIds,
    beispiel: r.beispiel,
  });
  reklamationen.update(r.id, { nacharbeitAuftragId: a.id, status: r.status === 'neu' ? 'in_arbeit' : r.status }, { text: `Nacharbeitsauftrag ${a.nummer} angelegt` });
  vermerken({ typ: 'auftraege', id: a.id }, 'reklamation.nacharbeit', `Nacharbeit zu Reklamation ${r.nummer}`);
  if (ursprung) vermerken({ typ: 'auftraege', id: ursprung.id }, 'reklamation.gemeldet', `Reklamation ${r.nummer}: ${r.titel}`);
  return a;
}

/** Status der Reklamation aus der Nacharbeit ableiten. Gibt neuen Status zurück, falls geändert. */
export function statusAusNacharbeit(r: Reklamation, a: Auftrag): ReklamationStatus | undefined {
  if (['erledigt', 'abgelehnt'].includes(r.status)) return undefined;
  if (['abnahme', 'abrechnung', 'erledigt'].includes(a.phase)) return 'erledigt';
  if (a.phase === 'verloren') return undefined;
  if (r.status === 'neu') return 'in_arbeit';
  return undefined;
}

export function reklamationErledigen(id: ID, am: Datum = heute()) {
  const r = reklamationen.get(id);
  if (!r) return;
  batch(() => {
    reklamationen.update(id, { status: 'erledigt', erledigtAm: am }, { text: 'Als erledigt markiert' });
    const a = db.auftraege.get(r.nacharbeitAuftragId);
    // Auf Gewährleistung/Kulanz gibt es nichts abzurechnen
    if (a && r.bewertung !== 'kostenpflichtig' && !['erledigt', 'verloren'].includes(a.phase)) {
      db.auftraege.update(a.id, { phase: 'erledigt', abgeschlossenAm: new Date().toISOString() }, { text: 'Nacharbeit erledigt – auf Gewährleistung, keine Rechnung' });
    }
  });
}

export const offen = (r: Reklamation) => r.status === 'neu' || r.status === 'in_arbeit';

/** Fotos zur Reklamation (Dokumente mit Tag) */
export const fotoTag = (id: ID) => `reklamation:${id}`;
export function fotosZu(id: ID) {
  return db.dokumente.where((d) => (d.tags ?? []).includes(fotoTag(id)));
}

/** Bild verkleinern (max. 1280 px, JPEG), damit der lokale Speicher nicht vollläuft */
export function bildLesen(datei: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const leser = new FileReader();
    leser.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    leser.onload = () => {
      const url = String(leser.result);
      if (!datei.type.startsWith('image/')) return resolve(url);
      const img = new Image();
      img.onerror = () => resolve(url);
      img.onload = () => {
        const f = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * f);
        c.height = Math.round(img.height * f);
        const ctx = c.getContext('2d');
        if (!ctx) return resolve(url);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = url;
    };
    leser.readAsDataURL(datei);
  });
}
